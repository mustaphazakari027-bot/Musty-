import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto, { randomUUID } from 'node:crypto';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { z, ZodError } from 'zod';
import { openDatabase, migrate, type Database, type Row } from './db';
import { seed } from './seed';
import { AppError, cartSchema, emailSchema, makeQuote, now, phoneSchema, releaseExpired, sha, token, verifyPaystack } from './services';

const prod = process.env.NODE_ENV === 'production';
if (prod && !process.env.DATABASE_URL) throw new Error('Production requires DATABASE_URL (PostgreSQL). The local SQLite database is for demo/development only.');
if (prod && (!process.env.APP_URL || !process.env.APP_URL.startsWith('https://'))) throw new Error('Production requires an HTTPS APP_URL.');
const db: Database = await openDatabase();
await migrate(db); await seed(db); await releaseExpired(db);
const app = express();
let snapshot = { categories: [] as Row[], products: [] as Row[] };
async function refreshSnapshot() { try { snapshot = { categories:(await db.query('SELECT id,name,description,image,color,sort_order FROM categories ORDER BY sort_order')).rows, products:(await db.query('SELECT p.id,p.name,p.category_id,p.description,p.unit,p.price,p.old_price,p.stock,p.image,p.badge,p.rating,p.review_count,c.name AS category_name FROM products p JOIN categories c ON p.category_id=c.id WHERE p.is_active=1 ORDER BY p.created_at,p.name')).rows }; } catch(e) { console.error('Snapshot refresh failed:', (e as Error).message); } }
await refreshSnapshot();
setInterval(refreshSnapshot, 60_000).unref();
const snapshotScript = () => `<script>window.__RF_CATALOGUE__=${JSON.stringify(snapshot).replace(/</g,'\\u003c')}</script>`;
function injectSnapshot(html: string) { return html.replace('</head>', `${snapshotScript()}</head>`); }
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: prod ? { directives: { defaultSrc:["'self'"], scriptSrc:["'self'"], styleSrc:["'self'","'unsafe-inline'"], imgSrc:["'self'",'https:','data:'], connectSrc:["'self'"], fontSrc:["'self'",'data:'], objectSrc:["'none'"], baseUri:["'self'"], frameAncestors:["'self'"] } } : false, crossOriginEmbedderPolicy:false }));
app.use('/api', (_req,res,next) => { res.set('Cache-Control','no-store'); next(); });
const wrap = (fn: (req: Request,res: Response,next:NextFunction)=>Promise<any>) => (req:Request,res:Response,next:NextFunction) => { Promise.resolve(fn(req,res,next)).catch(next); };
const limiter = (max: number, windowMs = 15*60*1000) => rateLimit({ windowMs, limit:max, standardHeaders:'draft-7', legacyHeaders:false, message:{ error:'Too many attempts. Please try again later.' } });
const authLimit = limiter(20); const contactLimit = limiter(8); const checkoutLimit = limiter(20);

// Paystack sends a signed raw body, before JSON parsing and same-origin CSRF checks.
app.post('/api/paystack/webhook', express.raw({ type:'application/json', limit:'100kb' }), wrap(async (req,res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  const signature = String(req.headers['x-paystack-signature'] || '');
  const expected = crypto.createHmac('sha512',secret).update(req.body as Buffer).digest();
  const provided = Buffer.from(signature, 'hex');
  if (!secret || provided.length !== expected.length || !crypto.timingSafeEqual(provided,expected)) throw new AppError(401,'Invalid signature.');
  let event: any; try { event = JSON.parse((req.body as Buffer).toString('utf8')); } catch { throw new AppError(400,'Invalid webhook payload.'); }
  if (event.event === 'charge.success' && typeof event.data?.reference === 'string') await verifyPaystack(db,event.data.reference);
  res.sendStatus(200);
}));
app.use(express.json({ limit:'100kb' }));
app.use(cookieParser());
// Custom header makes cross-site forms impossible; Origin is checked when supplied. No CORS is enabled.
app.use('/api', (req,res,next) => {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if (req.header('x-requested-with') !== 'XMLHttpRequest') return res.status(403).json({error:'Request not allowed.'});
  const origin = req.header('origin');
  if (origin) {
    try { const allowed = new Set([req.get('host'), process.env.APP_URL ? new URL(process.env.APP_URL).host : '']); if (!allowed.has(new URL(origin).host)) return res.status(403).json({error:'Request origin not allowed.'}); }
    catch { return res.status(403).json({error:'Invalid origin.'}); }
  }
  next();
});

type User = { id:string; name:string; email:string; phone:string; role:string };
const userOf = (req:Request): User | null => (req as any).user || null;
app.use('/api', wrap(async (req,_res,next) => {
  const raw = req.cookies?.rf_session;
  if (typeof raw === 'string' && raw.length > 20 && raw.length < 150) {
    const r = await db.query('SELECT u.id,u.name,u.email,u.phone,u.role FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>$2', [sha(raw),now()]);
    (req as any).user = r.rows[0] || null;
  }
  next();
}));
const requireUser = (req:Request,_res:Response,next:NextFunction) => userOf(req) ? next() : next(new AppError(401,'Please sign in first.'));
const requireAdmin = (req:Request,_res:Response,next:NextFunction) => userOf(req)?.role === 'admin' ? next() : next(new AppError(403,'Administrator access required.'));
async function setSession(res:Response,userId:string) {
  const raw = token(); const created = now(); const expires = new Date(Date.now()+7*86400_000).toISOString();
  await db.query('INSERT INTO sessions (token_hash,user_id,expires_at,created_at) VALUES ($1,$2,$3,$4)', [sha(raw),userId,expires,created]);
  res.cookie('rf_session',raw,{httpOnly:true,secure:prod,sameSite:'lax',path:'/',maxAge:7*86400_000});
}
const config = () => ({ demo:!prod, paystack_enabled:Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.APP_URL), cod_enabled:process.env.ALLOW_PAY_ON_DELIVERY === 'true' || (!prod && process.env.ALLOW_PAY_ON_DELIVERY !== 'false'), reset_enabled:Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM && process.env.APP_URL), image_upload_enabled:Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) });
app.get('/api/config',(_req,res)=>res.json(config()));
app.get('/api/health',(_req,res)=>res.json({ok:true,database:db.kind}));

// Catalog. Parameters are bound; sort is selected from a fixed allowlist.
app.get('/api/categories',wrap(async (_req,res)=>{
  const {rows} = await db.query(`SELECT c.id,c.name,c.description,c.image,c.color,c.sort_order,COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.is_active=1 GROUP BY c.id,c.name,c.description,c.image,c.color,c.sort_order ORDER BY c.sort_order,c.name`);
  res.json(rows.map(r=>({...r,product_count:Number(r.product_count)})));
}));
app.get('/api/products',wrap(async (req,res)=>{
  const params:any[]=[]; const conditions=['p.is_active=1'];
  const add=(v:any)=>{params.push(v);return `$${params.length}`;};
  const search = String(req.query.search || '').trim().slice(0,100);
  if(search) { const q=add(`%${search.toLowerCase()}%`); conditions.push(`(LOWER(p.name) LIKE ${q} OR LOWER(p.description) LIKE ${q})`); }
  if(req.query.category) conditions.push(`p.category_id=${add(String(req.query.category).slice(0,100))}`);
  const min = Number(req.query.min); const max = Number(req.query.max);
  if(req.query.min && Number.isFinite(min) && min>=0) conditions.push(`p.price>=${add(Math.floor(min))}`);
  if(req.query.max && Number.isFinite(max) && max>=0) conditions.push(`p.price<=${add(Math.floor(max))}`);
  const where = conditions.join(' AND ');
  const total = Number((await db.query(`SELECT COUNT(*) AS count FROM products p WHERE ${where}`,params)).rows[0].count);
  const order: Record<string,string> = { featured:'p.created_at ASC,p.name ASC', 'price-low':'p.price ASC,p.name ASC', 'price-high':'p.price DESC,p.name ASC', name:'p.name ASC', newest:'p.created_at DESC,p.name ASC' };
  const sort=order[String(req.query.sort)] || 'p.created_at ASC,p.name ASC';
  const limit=Math.max(1,Math.min(40,Number.parseInt(String(req.query.limit || '12')) || 12));
  const page=Math.max(1,Math.min(1000,Number.parseInt(String(req.query.page || '1')) || 1));
  const lim=add(limit), off=add((page-1)*limit);
  const {rows}=await db.query(`SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON p.category_id=c.id WHERE ${where} ORDER BY ${sort} LIMIT ${lim} OFFSET ${off}`,params);
  res.json({products:rows,total,page,pages:Math.ceil(total/limit)});
}));
function escapeHtml(s: string) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!)); }
app.get('/api/feed.json',wrap(async (_req,res)=>{
  const categories=(await db.query('SELECT id,name,description,image,color,sort_order FROM categories ORDER BY sort_order')).rows.map(r=>({...r,sort_order:Number(r.sort_order)}));
  const products=(await db.query('SELECT p.id,p.name,p.category_id,p.description,p.unit,p.price,p.old_price,p.stock,p.image,p.badge,p.rating,p.review_count,p.created_at,c.name AS category_name FROM products p JOIN categories c ON p.category_id=c.id WHERE p.is_active=1 ORDER BY p.created_at ASC,p.name ASC')).rows;
  res.json({categories,products});
}));
app.get('/sitemap.xml',(_req,res)=>{
  const base=(process.env.APP_URL||'https://example.com').replace(/\/$/,'');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url><url><loc>${base}/shop</loc></url><url><loc>${base}/categories</loc></url><url><loc>${base}/contact</loc></url><url><loc>${base}/policies</loc></url></urlset>`);
});
app.get('/api/products/:id',wrap(async (req,res)=>{
  const {rows}=await db.query('SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON p.category_id=c.id WHERE p.id=$1 AND p.is_active=1',[req.params.id]);
  if(!rows.length) throw new AppError(404,'Product not found.'); res.json(rows[0]);
}));
app.post('/api/quote',wrap(async(req,res)=>{
  const input=z.object({items:cartSchema,promo:z.string().max(40).optional().default(''),delivery:z.enum(['standard','express']).optional().default('standard')}).parse(req.body);
  res.json(await makeQuote(db,input.items,input.promo,input.delivery));
}));

// Authentication: random HTTP-only session tokens are stored only as hashes in the database.
app.get('/api/auth/session',(req,res)=>res.json({user:userOf(req)}));
app.post('/api/auth/register',authLimit,wrap(async(req,res)=>{
  const input=z.object({name:z.string().trim().min(2).max(100),email:emailSchema,phone:phoneSchema.or(z.literal('')).optional().default(''),password:z.string().min(10).max(128)}).parse(req.body);
  const id=randomUUID();
  if((await db.query('SELECT id FROM users WHERE email=$1',[input.email])).rows.length) throw new AppError(409,'An account with this email already exists.');
  await db.query('INSERT INTO users (id,name,email,phone,password_hash,role,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',[id,input.name,input.email,input.phone,await bcrypt.hash(input.password,12),'customer',now()]);
  await setSession(res,id); res.status(201).json({user:{id,name:input.name,email:input.email,phone:input.phone,role:'customer'}});
}));
app.post('/api/auth/login',authLimit,wrap(async(req,res)=>{
  const input=z.object({email:emailSchema,password:z.string().max(128)}).parse(req.body);
  const user=(await db.query('SELECT * FROM users WHERE email=$1',[input.email])).rows[0];
  if(!user || !(await bcrypt.compare(input.password,user.password_hash))) throw new AppError(401,'Email or password is incorrect.');
  if(req.cookies?.rf_session) await db.query('DELETE FROM sessions WHERE token_hash=$1',[sha(req.cookies.rf_session)]);
  await setSession(res,user.id); res.json({user:{id:user.id,name:user.name,email:user.email,phone:user.phone,role:user.role}});
}));
app.post('/api/auth/logout',wrap(async(req,res)=>{
  if(req.cookies?.rf_session) await db.query('DELETE FROM sessions WHERE token_hash=$1',[sha(req.cookies.rf_session)]);
  res.clearCookie('rf_session',{httpOnly:true,secure:prod,sameSite:'lax',path:'/'}); res.json({ok:true});
}));
app.post('/api/auth/forgot',authLimit,wrap(async(req,res)=>{
  const {email}=z.object({email:emailSchema}).parse(req.body);
  if(!config().reset_enabled) throw new AppError(503,'Password-reset email is not configured yet. Please contact the store.');
  const user=(await db.query('SELECT id FROM users WHERE email=$1',[email])).rows[0];
  if(user) {
    const raw=token(); await db.query('INSERT INTO password_resets (token_hash,user_id,expires_at,created_at) VALUES ($1,$2,$3,$4)',[sha(raw),user.id,new Date(Date.now()+30*60_000).toISOString(),now()]);
    const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT||587)===465,auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS||''}:undefined});
    const url=`${process.env.APP_URL!.replace(/\/$/,'')}/reset-password?token=${encodeURIComponent(raw)}`;
    await transporter.sendMail({from:process.env.SMTP_FROM,to:email,subject:'Reset your Rikkos Fresh password',text:`Use this link within 30 minutes to reset your password: ${url}\nIf you did not request this, ignore this email.`});
  }
  res.json({ok:true,message:'If an account exists for that email, a reset link has been sent.'});
}));
app.post('/api/auth/reset',authLimit,wrap(async(req,res)=>{
  const input=z.object({token:z.string().min(20).max(150),password:z.string().min(10).max(128)}).parse(req.body);
  const hash=sha(input.token), passwordHash=await bcrypt.hash(input.password,12);
  await db.transaction(async tx=>{
    const suffix=db.kind==='postgres'?' FOR UPDATE':'';
    const row=(await tx.query(`SELECT * FROM password_resets WHERE token_hash=$1 AND expires_at>$2${suffix}`,[hash,now()])).rows[0];
    if(!row) throw new AppError(400,'This reset link is invalid or has expired.');
    await tx.query('UPDATE users SET password_hash=$1 WHERE id=$2',[passwordHash,row.user_id]);
    await tx.query('DELETE FROM sessions WHERE user_id=$1',[row.user_id]);
    await tx.query('DELETE FROM password_resets WHERE user_id=$1',[row.user_id]);
  }); res.json({ok:true});
}));
app.get('/api/account/orders',requireUser,wrap(async(req,res)=>{
  const {rows}=await db.query('SELECT reference,status,payment_status,total,delivery_date,created_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC',[userOf(req)!.id]); res.json(rows);
}));
app.get('/api/account/addresses',requireUser,wrap(async(req,res)=>{
  const {rows}=await db.query('SELECT id,label,address,phone FROM addresses WHERE user_id=$1 ORDER BY created_at DESC',[userOf(req)!.id]); res.json(rows);
}));
const addressSchema=z.object({label:z.string().trim().min(1).max(50),address:z.string().trim().min(8).max(300),phone:phoneSchema});
app.post('/api/account/addresses',requireUser,wrap(async(req,res)=>{const a=addressSchema.parse(req.body),id=randomUUID(); await db.query('INSERT INTO addresses (id,user_id,label,address,phone,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[id,userOf(req)!.id,a.label,a.address,a.phone,now()]);res.status(201).json({id,...a});}));
app.patch('/api/account/addresses/:id',requireUser,wrap(async(req,res)=>{const a=addressSchema.parse(req.body); const r=await db.query('UPDATE addresses SET label=$1,address=$2,phone=$3 WHERE id=$4 AND user_id=$5',[a.label,a.address,a.phone,req.params.id,userOf(req)!.id]);if(!r.rowCount) throw new AppError(404,'Address not found.');res.json({id:req.params.id,...a});}));
app.delete('/api/account/addresses/:id',requireUser,wrap(async(req,res)=>{await db.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2',[req.params.id,userOf(req)!.id]);res.json({ok:true});}));

// Checkout always re-reads prices, promotion rules, and inventory in a transaction.
const checkoutSchema=z.object({items:cartSchema.min(1),promo:z.string().max(40).optional().default(''),delivery:z.enum(['standard','express']),name:z.string().trim().min(2).max(100),email:emailSchema,phone:phoneSchema,address:z.string().trim().min(8).max(300),instructions:z.string().trim().max(500).optional().default(''),delivery_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),delivery_time:z.enum(['9am – 12pm','12pm – 3pm','3pm – 6pm']),payment:z.enum(['paystack','cod'])});
app.post('/api/checkout',checkoutLimit,wrap(async(req,res)=>{
  const input=checkoutSchema.parse(req.body), conf=config();
  if(input.payment==='paystack' && !conf.paystack_enabled) throw new AppError(503,'Paystack has not been configured yet.');
  if(input.payment==='cod' && !conf.cod_enabled) throw new AppError(503,'Pay on delivery is not currently available.');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const day=new Date(`${input.delivery_date}T12:00:00Z`);
  if(Number.isNaN(day.valueOf()) || day.toISOString().slice(0,10)!==input.delivery_date || input.delivery_date<today || day.valueOf()>Date.now()+31*86400_000) throw new AppError(400,'Choose a valid delivery date within the next 30 days.');
  await releaseExpired(db);
  const orderId=randomUUID(), reference=`RF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`, rawToken=token(), created=now();
  let quote:Awaited<ReturnType<typeof makeQuote>>;
  await db.transaction(async tx=>{
    quote=await makeQuote(tx,input.items,input.promo,input.delivery);
    if(quote.promo_error) throw new AppError(400,quote.promo_error);
    for(const item of quote.items){const r=await tx.query('UPDATE products SET stock=stock-$1 WHERE id=$2 AND stock>=$1 AND is_active=1',[item.quantity,item.id]);if(!r.rowCount) throw new AppError(409,`${item.name} is no longer available in that quantity.`);}
    const expires=input.payment==='paystack'?new Date(Date.now()+30*60_000).toISOString():null;
    await tx.query('INSERT INTO orders (id,reference,user_id,token_hash,name,email,phone,address,instructions,delivery_date,delivery_time,delivery_type,subtotal,discount,delivery_fee,total,promo_code,payment_method,payment_status,status,stock_reserved,expires_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)',[orderId,reference,userOf(req)?.id||null,sha(rawToken),input.name,input.email,input.phone,input.address,input.instructions,input.delivery_date,input.delivery_time,input.delivery,quote.subtotal,quote.discount,quote.delivery_fee,quote.total,quote.promo_code,input.payment,input.payment==='paystack'?'pending':'pay_on_delivery',input.payment==='paystack'?'pending':'confirmed',1,expires,created,created]);
    for(const item of quote.items) await tx.query('INSERT INTO order_items (id,order_id,product_id,name,unit,price,quantity,image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[randomUUID(),orderId,item.id,item.name,item.unit,item.price,item.quantity,item.image]);
  });
  if(input.payment==='paystack') {
    try {
      const callback=`${process.env.APP_URL!.replace(/\/$/,'')}/checkout/return`;
      const response=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email:input.email,amount:quote!.total*100,currency:'NGN',reference,callback_url:callback,metadata:{order_reference:reference}}),signal:AbortSignal.timeout(12000)});
      const data:any=await response.json(); const url=new URL(data?.data?.authorization_url || 'https://invalid.example');
      if(!response.ok || !data.status || url.protocol!=='https:' || url.hostname!=='checkout.paystack.com') throw new Error('Initialization failed');
      return res.status(201).json({reference,token:rawToken,authorization_url:url.toString()});
    } catch { throw new AppError(502,'Could not start secure payment. No card was charged. Your stock hold will expire automatically.'); }
  }
  res.status(201).json({reference,token:rawToken});
}));
async function canViewOrder(req:Request,order:Row) {
  const u=userOf(req); if(u && (u.id===order.user_id || u.role==='admin')) return true;
  const provided=String(req.header('x-order-token') || '');
  if(!provided || provided.length>200) return false;
  const a=Buffer.from(sha(provided)); const b=Buffer.from(order.token_hash); return a.length===b.length && crypto.timingSafeEqual(a,b);
}
app.get('/api/orders/:reference',wrap(async(req,res)=>{
  const order=(await db.query('SELECT * FROM orders WHERE reference=$1',[req.params.reference])).rows[0];
  if(!order || !(await canViewOrder(req,order))) throw new AppError(404,'Order not found.');
  const items=(await db.query('SELECT name,unit,price,quantity,image FROM order_items WHERE order_id=$1',[order.id])).rows;
  const {token_hash,user_id,id,...safe}=order; res.json({...safe,items});
}));
app.post('/api/track',authLimit,wrap(async(req,res)=>{
  const input=z.object({reference:z.string().trim().min(5).max(80),email:emailSchema}).parse(req.body);
  const order=(await db.query('SELECT reference,status,payment_status,delivery_date,delivery_time,created_at,updated_at FROM orders WHERE reference=$1 AND email=$2',[input.reference.toUpperCase(),input.email])).rows[0];
  if(!order) throw new AppError(404,'No order matched that reference and email.'); res.json(order);
}));
app.post('/api/paystack/verify',checkoutLimit,wrap(async(req,res)=>{
  const input=z.object({reference:z.string().min(5).max(80),token:z.string().max(200).optional()}).parse(req.body);
  const order=(await db.query('SELECT * FROM orders WHERE reference=$1',[input.reference])).rows[0];
  if(!order) throw new AppError(404,'Order not found.');
  const u=userOf(req); if(!(u && (u.id===order.user_id||u.role==='admin')) && (!input.token || sha(input.token)!==order.token_hash)) throw new AppError(404,'Order not found.');
  res.json(await verifyPaystack(db,input.reference));
}));

// Basic honeypot + rate limits; messages and subscriptions are persisted, not silently emailed.
app.post('/api/contact',contactLimit,wrap(async(req,res)=>{
  const data=z.object({name:z.string().trim().min(2).max(100),email:emailSchema,subject:z.string().trim().min(3).max(120),message:z.string().trim().min(10).max(4000),website:z.string().max(200).optional()}).parse(req.body);
  if(!data.website) await db.query('INSERT INTO contact_messages (id,name,email,subject,message,created_at) VALUES ($1,$2,$3,$4,$5,$6)',[randomUUID(),data.name,data.email,data.subject,data.message,now()]);
  res.json({ok:true,message:'Thanks for reaching out. Your message has been saved.'});
}));
app.post('/api/newsletter',contactLimit,wrap(async(req,res)=>{
  const data=z.object({email:emailSchema,website:z.string().max(200).optional()}).parse(req.body);
  if(!data.website && !(await db.query('SELECT email FROM newsletter WHERE email=$1',[data.email])).rows.length) await db.query('INSERT INTO newsletter (email,created_at) VALUES ($1,$2)',[data.email,now()]);
  res.json({ok:true});
}));

// Every admin endpoint is guarded server-side, regardless of what the client renders.
app.use('/api/admin',requireUser,requireAdmin);
app.get('/api/admin/overview',wrap(async(_req,res)=>{
  const orders=(await db.query('SELECT reference,name,email,status,payment_status,total,created_at,delivery_date FROM orders ORDER BY created_at DESC')).rows;
  const products=(await db.query('SELECT id,name,stock FROM products WHERE is_active=1')).rows;
  const users=(await db.query("SELECT id FROM users WHERE role='customer'")).rows;
  const revenue=orders.filter(o=>o.payment_status==='paid').reduce((n,o)=>n+Number(o.total),0);
  res.json({order_count:orders.length,customer_count:users.length,product_count:products.length,paid_revenue:revenue,low_stock:products.filter(p=>Number(p.stock)<10).length,recent_orders:orders.slice(0,8)});
}));
app.get('/api/admin/orders',wrap(async(_req,res)=>{const {rows}=await db.query('SELECT reference,name,email,phone,address,delivery_date,delivery_time,status,payment_method,payment_status,total,created_at FROM orders ORDER BY created_at DESC');res.json(rows);}));
app.patch('/api/admin/orders/:reference',wrap(async(req,res)=>{
  const {status}=z.object({status:z.enum(['confirmed','processing','out_for_delivery','delivered','cancelled','review'])}).parse(req.body);
  await db.transaction(async tx=>{
    const suffix=db.kind==='postgres'?' FOR UPDATE':'';
    const order=(await tx.query(`SELECT * FROM orders WHERE reference=$1${suffix}`,[req.params.reference])).rows[0];
    if(!order) throw new AppError(404,'Order not found.');
    if(order.status==='cancelled' && status!=='cancelled') throw new AppError(400,'A cancelled order cannot be reopened; create a new order.');
    if(order.payment_status==='pending' && !['cancelled','review'].includes(status)) throw new AppError(400,'Payment must be verified before fulfillment.');
    if(status==='cancelled' && order.payment_status==='paid') throw new AppError(400,'Paid orders require a provider refund and manual reconciliation; do not cancel here.');
    if(status==='cancelled' && Number(order.stock_reserved)) {
      const lines=(await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[order.id])).rows;
      for(const line of lines) await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[Number(line.quantity),line.product_id]);
      await tx.query('UPDATE orders SET stock_reserved=0,payment_status=$1 WHERE id=$2',[order.payment_status==='pending'?'expired':order.payment_status,order.id]);
    }
    await tx.query('UPDATE orders SET status=$1,updated_at=$2 WHERE id=$3',[status,now(),order.id]);
  }); res.json({ok:true});
}));
app.get('/api/admin/customers',wrap(async(_req,res)=>{const {rows}=await db.query("SELECT id,name,email,phone,created_at FROM users WHERE role='customer' ORDER BY created_at DESC");res.json(rows);}));
app.get('/api/admin/messages',wrap(async(_req,res)=>{const {rows}=await db.query('SELECT name,email,subject,message,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 100');res.json(rows);}));
app.get('/api/admin/newsletter',wrap(async(_req,res)=>{const {rows}=await db.query('SELECT email,created_at FROM newsletter ORDER BY created_at DESC LIMIT 1000');res.json(rows);}));
app.get('/api/admin/products',wrap(async(_req,res)=>{const {rows}=await db.query('SELECT p.*,c.name AS category_name FROM products p JOIN categories c ON p.category_id=c.id ORDER BY p.created_at DESC,p.name');res.json(rows);}));
const imageUrl=z.string().trim().max(1000).refine(v=>v.startsWith('/images/') || /^https:\/\//i.test(v),'Use a local /images/ path or HTTPS image URL.');
const productSchema=z.object({name:z.string().trim().min(2).max(120),category_id:z.string().min(1).max(100),description:z.string().trim().min(5).max(2000),unit:z.string().trim().min(1).max(60),price:z.number().int().min(1).max(100000000),old_price:z.number().int().min(1).max(100000000).nullable().optional(),stock:z.number().int().min(0).max(100000),image:imageUrl,badge:z.string().trim().max(30).optional().default(''),is_active:z.number().int().min(0).max(1).optional().default(1)});
app.post('/api/admin/products',wrap(async(req,res)=>{
  const p=productSchema.parse(req.body);
  if(!(await db.query('SELECT id FROM categories WHERE id=$1',[p.category_id])).rows.length) throw new AppError(400,'Choose an existing category.');
  const slug=p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'product';const id=`${slug}-${crypto.randomBytes(3).toString('hex')}`;
  await db.query('INSERT INTO products (id,name,category_id,description,unit,price,old_price,stock,image,badge,rating,review_count,is_active,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',[id,p.name,p.category_id,p.description,p.unit,p.price,p.old_price||null,p.stock,p.image,p.badge,'',0,p.is_active,now()]);res.status(201).json({id});
}));
app.patch('/api/admin/products/:id',wrap(async(req,res)=>{
  const p=productSchema.parse(req.body);
  if(!(await db.query('SELECT id FROM categories WHERE id=$1',[p.category_id])).rows.length) throw new AppError(400,'Choose an existing category.');
  const r=await db.query('UPDATE products SET name=$1,category_id=$2,description=$3,unit=$4,price=$5,old_price=$6,stock=$7,image=$8,badge=$9,is_active=$10 WHERE id=$11',[p.name,p.category_id,p.description,p.unit,p.price,p.old_price||null,p.stock,p.image,p.badge,p.is_active,req.params.id]);if(!r.rowCount) throw new AppError(404,'Product not found.');res.json({ok:true});
}));
app.delete('/api/admin/products/:id',wrap(async(req,res)=>{const r=await db.query('UPDATE products SET is_active=0 WHERE id=$1',[req.params.id]);if(!r.rowCount) throw new AppError(404,'Product not found.');res.json({ok:true});}));
const categorySchema=z.object({name:z.string().trim().min(2).max(80),description:z.string().trim().min(2).max(160),image:imageUrl,color:z.string().regex(/^#[0-9a-fA-F]{6}$/),sort_order:z.number().int().min(0).max(999)});
app.post('/api/admin/categories',wrap(async(req,res)=>{const c=categorySchema.parse(req.body);const id=`${c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55)}-${crypto.randomBytes(2).toString('hex')}`;await db.query('INSERT INTO categories (id,name,description,image,color,sort_order) VALUES ($1,$2,$3,$4,$5,$6)',[id,c.name,c.description,c.image,c.color,c.sort_order]);res.status(201).json({id});}));
app.patch('/api/admin/categories/:id',wrap(async(req,res)=>{const c=categorySchema.parse(req.body);const r=await db.query('UPDATE categories SET name=$1,description=$2,image=$3,color=$4,sort_order=$5 WHERE id=$6',[c.name,c.description,c.image,c.color,c.sort_order,req.params.id]);if(!r.rowCount)throw new AppError(404,'Category not found.');res.json({ok:true});}));
app.delete('/api/admin/categories/:id',wrap(async(req,res)=>{if((await db.query('SELECT id FROM products WHERE category_id=$1 LIMIT 1',[req.params.id])).rows.length)throw new AppError(409,'Move all products out of this category before deleting it.');await db.query('DELETE FROM categories WHERE id=$1',[req.params.id]);res.json({ok:true});}));
app.get('/api/admin/promos',wrap(async(_req,res)=>{res.json((await db.query('SELECT * FROM promos ORDER BY code')).rows);}));
const promoSchema=z.object({code:z.string().trim().regex(/^[A-Za-z0-9_-]{3,30}$/).transform(s=>s.toUpperCase()),percent:z.number().int().min(1).max(100),minimum:z.number().int().min(0).max(100000000),cap:z.number().int().min(0).max(100000000),active:z.number().int().min(0).max(1)});
app.post('/api/admin/promos',wrap(async(req,res)=>{const p=promoSchema.parse(req.body);await db.query('INSERT INTO promos (code,percent,minimum,cap,active) VALUES ($1,$2,$3,$4,$5)',[p.code,p.percent,p.minimum,p.cap,p.active]);res.status(201).json(p);}));
app.patch('/api/admin/promos/:code',wrap(async(req,res)=>{const p=promoSchema.parse({...req.body,code:req.params.code});const r=await db.query('UPDATE promos SET percent=$1,minimum=$2,cap=$3,active=$4 WHERE code=$5',[p.percent,p.minimum,p.cap,p.active,p.code]);if(!r.rowCount)throw new AppError(404,'Promo not found.');res.json({ok:true});}));
app.delete('/api/admin/promos/:code',wrap(async(req,res)=>{await db.query('DELETE FROM promos WHERE code=$1',[String(req.params.code).toUpperCase()]);res.json({ok:true});}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
app.post('/api/admin/upload',upload.single('image'),wrap(async(req,res)=>{
  if(!config().image_upload_enabled) throw new AppError(503,'Cloudinary image uploads are not configured.');
  const file=req.file;if(!file)throw new AppError(400,'Choose a JPEG, PNG or WebP image under 5 MB.');
  const b=file.buffer; const valid=(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)||(b.subarray(0,8).toString('hex')==='89504e470d0a1a0a')||(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP');
  if(!valid)throw new AppError(400,'The file is not a supported image.');
  cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
  const result:any=await new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'rikkos-fresh',resource_type:'image',allowed_formats:['jpg','jpeg','png','webp']},(err,data)=>err?reject(err):resolve(data));stream.end(b);});res.json({url:result.secure_url});
}));

app.use('/api',(_req,res)=>res.status(404).json({error:'API endpoint not found.'}));
app.use((err:any,_req:Request,res:Response,_next:NextFunction)=>{
  if(err instanceof ZodError) return res.status(400).json({error:err.issues[0]?.message || 'Please check your details.'});
  if(err instanceof AppError) return res.status(err.status).json({error:err.message});
  if(err instanceof multer.MulterError) return res.status(400).json({error:'Image must be under 5 MB.'});
  if(err?.type==='entity.parse.failed') return res.status(400).json({error:'Invalid JSON.'});
  if(err?.code==='23505' || String(err?.message||'').includes('UNIQUE constraint')) return res.status(409).json({error:'That record already exists.'});
  console.error('Request failed:',err?.message || err); res.status(500).json({error:'Something went wrong. Please try again.'});
});
if(prod) {
  const dist=path.resolve('dist');app.use(express.static(dist,{maxAge:'1h'}));app.get('*',(_req,res)=>res.sendFile(path.join(dist,'index.html')));
} else {
  const {createServer}=await import('vite');
  const vite=await createServer({configFile:path.resolve('vite.config.ts'),server:{middlewareMode:true,allowedHosts:true},appType:'spa'});
  app.use((req,res,next)=>{ const end=res.end.bind(res); (res as any).end=(body?:any,encoding?:any)=>{ if(typeof body==='string' && (req.headers.accept||'').includes('text/html') && body.includes('</head>')) body=injectSnapshot(body); return end(body,encoding); }; next(); });
  app.use(vite.middlewares);
}
setInterval(()=>releaseExpired(db).catch(e=>console.error('Reservation cleanup failed:',e.message)),60_000).unref();
const port=Number(process.env.PORT || 3000);
app.listen(port,'0.0.0.0',()=>console.log(`Rikkos Fresh listening on http://0.0.0.0:${port} (${db.kind}${prod?'':' demo'})`));
