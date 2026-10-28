import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Database } from './db';

const categories = [
  ['fruits-vegetables','Fruits & Vegetables','Fresh from the farm','/images/avocado.jpg','#eaf3e8',1],
  ['dairy-eggs','Dairy & Eggs','The everyday essentials','/images/eggs.jpg','#fbf0df',2],
  ['meat-poultry','Meat & Poultry','Quality cuts, carefully packed','/images/chicken.jpg','#f9e9e3',3],
  ['bakery','Bakery','Freshly baked favourites','/images/bread.jpg','#f6eede',4],
  ['snacks','Snacks & Munchies','A little something lovely','/images/cookies.jpg','#fceee3',5],
  ['beverages','Beverages','Sips for every moment','/images/juice.jpg','#f8efd9',6],
  ['pantry','Pantry Essentials','Your cupboard staples','/images/rice.jpg','#eff1e1',7],
  ['household','Household','For a happy home','/images/cleaning.jpg','#e9f1ef',8],
];
// [id, name, category, description, unit, price, old price, stock, image, badge, rating, review count]
const products: any[][] = [
  ['fresh-avocado','Fresh Avocado','fruits-vegetables','Creamy, delicious avocados, perfect for toast, salads and everything in between.','2 pieces',1800,2200,35,'avocado','20% OFF','4.8',124],
  ['sweet-bananas','Sweet Bananas','fruits-vegetables','Naturally sweet bananas, hand-picked and ready for your fruit bowl.','1 bunch',1500,null,48,'banana','BESTSELLER','4.9',86],
  ['garden-tomatoes','Fresh Tomatoes','fruits-vegetables','Juicy, vibrant tomatoes for stews, salads and everyday cooking.','1 kg',2200,2600,42,'tomato','15% OFF','4.8',95],
  ['fresh-strawberries','Fresh Strawberries','fruits-vegetables','Sweet, bright and full of flavour. A lovely treat for any time of day.','250 g',3500,null,18,'strawberry','','4.7',58],
  ['sweet-oranges','Sweet Oranges','fruits-vegetables','Naturally juicy oranges, bursting with refreshing citrus flavour.','1 kg',2000,null,40,'orange','','4.9',72],
  ['farm-eggs','Farm Fresh Eggs','dairy-eggs','A dozen wholesome eggs, carefully packed for your kitchen.','12 pieces',4800,5200,30,'eggs','FRESH PICK','4.8',103],
  ['full-cream-milk','Full Cream Milk','dairy-eggs','Smooth, creamy milk for breakfast, baking and everyday moments.','1 litre',2900,null,25,'milk','','4.7',42],
  ['artisan-bread','Whole Wheat Bread','bakery','A hearty, delicious loaf for toast, sandwiches and sharing.','1 loaf',2300,2600,23,'bread','','4.8',67],
  ['fresh-broccoli','Fresh Broccoli','fruits-vegetables','Tender, crisp green broccoli for all your favourite meals.','1 head',1800,null,26,'broccoli','','4.7',31],
  ['fresh-carrots','Crunchy Carrots','fruits-vegetables','Fresh, naturally sweet carrots for snacking, salads and stews.','1 kg',1600,null,50,'carrots','','4.8',45],
  ['red-apples','Red Apples','fruits-vegetables','Crisp and juicy apples, picked for everyday snacking.','4 pieces',3200,3600,37,'apple','10% OFF','4.8',70],
  ['bell-peppers','Mixed Bell Peppers','fruits-vegetables','A colourful mix of crunchy peppers to brighten any dish.','3 pieces',2400,null,34,'pepper','','4.6',24],
  ['long-grain-rice','Long Grain Rice','pantry','Fluffy long-grain rice, a pantry staple for every family table.','2 kg',7200,null,60,'rice','','4.9',56],
  ['chicken-breast','Chicken Breast','meat-poultry','Tender chicken breast, carefully prepared and chilled.','1 kg',6500,null,16,'chicken','','4.7',28],
  ['orange-juice','Orange Juice','beverages','A refreshing orange drink for breakfast and beyond.','1 litre',2800,null,26,'juice','','4.6',21],
  ['oat-cookies','Oat Cookies','snacks','Golden, crunchy cookies for a little moment of joy.','300 g',2400,null,30,'cookies','','4.8',38],
  ['sweet-watermelon','Sweet Watermelon','fruits-vegetables','Sweet and refreshing watermelon, ready to brighten your day.','1 piece',3800,null,14,'watermelon','','4.8',32],
  ['ripe-mangoes','Ripe Mangoes','fruits-vegetables','Sun-ripened mangoes with a beautifully sweet flavour.','3 pieces',2400,null,20,'mango','','4.9',48],
  ['olive-oil','Olive Oil','pantry','A kitchen essential for dressings, sautés and everyday cooking.','500 ml',6800,null,19,'oil','','4.7',19],
  ['home-cleaner','Household Cleaner','household','A useful everyday cleaning essential for a fresher home.','1 bottle',3200,null,22,'cleaning','','',0],
  ['blueberries','Fresh Blueberries','fruits-vegetables','Little bursts of sweetness for breakfast bowls and snacking.','125 g',3900,null,12,'blueberry','','4.8',22],
  ['red-onions','Red Onions','fruits-vegetables','A fragrant, flavourful base for your favourite home-cooked meals.','1 kg',2000,null,40,'onion','','4.7',35],
];
export async function seed(db: Database) {
  const existing = await db.query('SELECT COUNT(*) AS count FROM categories');
  if (Number(existing.rows[0].count) === 0) {
    await db.transaction(async tx => {
      for (const c of categories) await tx.query('INSERT INTO categories (id,name,description,image,color,sort_order) VALUES ($1,$2,$3,$4,$5,$6)', c);
      for (const p of products) await tx.query('INSERT INTO products (id,name,category_id,description,unit,price,old_price,stock,image,badge,rating,review_count,is_active,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [...p.slice(0,8), `/images/${p[8]}.jpg`, ...p.slice(9), 1, new Date().toISOString()]);
      await tx.query('INSERT INTO promos (code,percent,minimum,cap,active) VALUES ($1,$2,$3,$4,$5)', ['FRESH10',10,10000,2000,1]);
    });
  }
  // A demo-only account makes the protected dashboard testable without shipping credentials to production.
  const isProd = process.env.NODE_ENV === 'production';
  const email = (process.env.ADMIN_EMAIL || (!isProd ? 'admin@rikkosfresh.demo' : '')).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (!isProd ? 'RikkosDemo!2026' : '');
  if (email && password) {
    if (isProd && (password.length < 12 || password === 'RikkosDemo!2026')) throw new Error('ADMIN_PASSWORD must be a unique password of at least 12 characters in production.');
    const existingAdmin = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!existingAdmin.rows.length) await db.query('INSERT INTO users (id,name,email,phone,password_hash,role,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [randomUUID(),'Store Admin',email,'',await bcrypt.hash(password,12),'admin',new Date().toISOString()]);
  }
}
