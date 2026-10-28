import crypto from 'node:crypto';
import { z } from 'zod';
import type { Database, Queryable, Row } from './db';

export const now = () => new Date().toISOString();
export const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const token = () => crypto.randomBytes(32).toString('base64url');
export const emailSchema = z.string().trim().email().max(254).transform(x => x.toLowerCase());
export const phoneSchema = z.string().trim().min(7).max(25).regex(/^[+\d\s()\-]+$/, 'Enter a valid phone number.');
export const cartSchema = z.array(z.object({ id: z.string().min(1).max(100), quantity: z.number().int().min(1).max(50) })).max(50);
export type CartItem = z.infer<typeof cartSchema>[number];
export class AppError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function makeQuote(db: Queryable, cart: CartItem[], promoCode = '', deliveryType = 'standard') {
  const quantities = new Map<string, number>();
  for (const x of cart) quantities.set(x.id, (quantities.get(x.id) || 0) + x.quantity);
  if ([...quantities.values()].some(q => q > 50)) throw new AppError(400, 'A maximum of 50 of each item may be ordered.');
  const items: Row[] = [];
  for (const [id, quantity] of quantities) {
    const { rows } = await db.query('SELECT id,name,unit,price,stock,image,is_active FROM products WHERE id=$1', [id]);
    const p = rows[0];
    if (!p || !Number(p.is_active)) throw new AppError(400, 'A product in your basket is no longer available. Please remove it.');
    if (Number(p.stock) < quantity) throw new AppError(400, `Only ${p.stock} ${p.name} available. Please update your basket.`);
    items.push({ id:p.id, name:p.name, unit:p.unit, price:Number(p.price), stock:Number(p.stock), image:p.image, quantity, line_total:Number(p.price)*quantity });
  }
  const subtotal = items.reduce((n, p) => n + p.line_total, 0);
  let discount = 0, promoError = '', appliedCode = '';
  if (promoCode.trim()) {
    const code = promoCode.trim().toUpperCase();
    const { rows } = await db.query('SELECT * FROM promos WHERE code=$1 AND active=1', [code]);
    const promo = rows[0];
    if (!promo) promoError = 'That promo code is not valid.';
    else if (subtotal < Number(promo.minimum)) promoError = `This code needs a minimum basket of ₦${Number(promo.minimum).toLocaleString('en-NG')}.`;
    else { discount = Math.floor(subtotal * Number(promo.percent) / 100); if (Number(promo.cap) > 0) discount = Math.min(discount, Number(promo.cap)); appliedCode = code; }
  }
  const deliveryFee = !subtotal ? 0 : deliveryType === 'express' ? 1500 : subtotal >= 25000 ? 0 : 1000;
  return { items, subtotal, discount, delivery_fee:deliveryFee, total:subtotal-discount+deliveryFee, promo_code:appliedCode, promo_error:promoError, delivery_type:deliveryType };
}

export async function releaseExpired(db: Database) {
  await db.transaction(async tx => {
    const suffix = db.kind === 'postgres' ? ' FOR UPDATE' : '';
    const { rows } = await tx.query(`SELECT id FROM orders WHERE payment_status='pending' AND stock_reserved=1 AND expires_at IS NOT NULL AND expires_at<$1${suffix}`, [now()]);
    for (const o of rows) {
      const result = await tx.query("UPDATE orders SET payment_status='expired', status='cancelled', stock_reserved=0, updated_at=$1 WHERE id=$2 AND payment_status='pending' AND stock_reserved=1", [now(),o.id]);
      if (result.rowCount) {
        const lines = await tx.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[o.id]);
        for (const line of lines.rows) await tx.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[Number(line.quantity),line.product_id]);
      }
    }
  });
}

export async function verifyPaystack(db: Database, reference: string) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new AppError(503, 'Paystack is not configured yet.');
  let payload: any;
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers:{ Authorization:`Bearer ${key}` }, signal:AbortSignal.timeout(12000) });
    payload = await response.json();
    if (!response.ok || !payload.status) throw new Error('Verification request failed');
  } catch { throw new AppError(502, 'Could not verify payment with Paystack. Please try again shortly.'); }
  const data = payload.data;
  const { rows } = await db.query('SELECT * FROM orders WHERE reference=$1', [reference]);
  const order = rows[0];
  if (!order || order.payment_method !== 'paystack') throw new AppError(404, 'Order not found.');
  if (data.reference !== reference || data.currency !== 'NGN' || Number(data.amount) !== Number(order.total)*100) throw new AppError(400, 'Payment verification did not match the order.');
  if (data.status !== 'success') return { verified:false, status:data.status };
  await db.transaction(async tx => {
    const lock = db.kind === 'postgres' ? ' FOR UPDATE' : '';
    const fresh = (await tx.query(`SELECT * FROM orders WHERE reference=$1${lock}`, [reference])).rows[0];
    if (fresh.payment_status === 'paid') return;
    // If a payment arrived after its stock hold expired, record the money but flag it for manual fulfilment/refund.
    const status = Number(fresh.stock_reserved) ? 'confirmed' : 'review';
    await tx.query('UPDATE orders SET payment_status=$1,status=$2,expires_at=$3,updated_at=$4 WHERE id=$5', ['paid',status,null,now(),fresh.id]);
  });
  return { verified:true, status:'paid' };
}
