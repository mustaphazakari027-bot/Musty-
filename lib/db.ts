import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { SCHEMA_SQL } from '@/lib/schema';
import {
  CATEGORIES,
  COLORS,
  COUPONS,
  DELIVERY_ZONES,
  PRODUCTS,
  SAMPLE_REVIEWS,
  SIZES,
} from '@/lib/seed-data';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
export const DB_PATH = path.join(DATA_DIR, 'zakson.db');

declare global {
  // eslint-disable-next-line no-var
  var __zaksonDb: Database.Database | undefined;
}

function createDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const instance = new Database(DB_PATH);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  instance.exec(SCHEMA_SQL);
  seedIfEmpty(instance);
  ensureAdmin(instance);
  return instance;
}

export const db = global.__zaksonDb ?? createDb();
if (process.env.NODE_ENV !== 'production') global.__zaksonDb = db;

function seedIfEmpty(instance: Database.Database) {
  const { count } = instance.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
  if (count > 0) return;

  const insertCategory = instance.prepare(
    'INSERT INTO categories (slug, name, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
  );
  const insertColor = instance.prepare(
    'INSERT INTO colors (slug, name, hex, filter, sort_order) VALUES (?, ?, ?, ?, ?)',
  );
  const insertSize = instance.prepare('INSERT INTO sizes (label, sort_order, system) VALUES (?, ?, ?)');
  const insertProduct = instance.prepare(`
    INSERT INTO products (slug, name, subtitle, description, category_id, gender, price_kobo, compare_at_kobo, badge,
      is_featured, is_best_seller, is_new)
    VALUES (@slug, @name, @subtitle, @description, @categoryId, @gender, @priceKobo, @compareAtKobo, @badge,
      @featured, @bestSeller, @isNew)
  `);
  const insertImage = instance.prepare(
    'INSERT INTO product_images (product_id, url, alt, color_slug, sort_order) VALUES (?, ?, ?, ?, ?)',
  );
  const insertProductColor = instance.prepare(
    'INSERT INTO product_colors (product_id, color_slug, image_url, is_default, sort_order) VALUES (?, ?, ?, ?, ?)',
  );
  const insertVariant = instance.prepare(
    'INSERT INTO product_variants (product_id, color_slug, size_label, sku, stock) VALUES (?, ?, ?, ?, ?)',
  );
  const insertReview = instance.prepare(`
    INSERT INTO reviews (product_id, author, rating, title, body, is_verified, is_sample, created_at)
    VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now', ?))
  `);

  instance.transaction(() => {
    CATEGORIES.forEach((c, i) => insertCategory.run(c.slug, c.name, c.description, c.icon, i));
    COLORS.forEach((c) => insertColor.run(c.slug, c.name, c.hex, c.filter, c.sort));
    SIZES.forEach((s) => insertSize.run(s.label, s.sort, 'UK'));

    const categoryIds = new Map<string, number>(
      (instance.prepare('SELECT id, slug FROM categories').all() as { id: number; slug: string }[]).map((r) => [
        r.slug,
        r.id,
      ]),
    );

    // Deterministic pseudo-stock so demo data looks realistic between resets.
    let seed = 7;
    const nextStock = (min: number, max: number) => {
      seed = (seed * 9301 + 49297) % 233280;
      const r = seed / 233280;
      return Math.floor(min + r * (max - min + 1));
    };

    for (const p of PRODUCTS) {
      const info = insertProduct.run({
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        categoryId: categoryIds.get(p.categorySlug) ?? null,
        gender: p.gender,
        priceKobo: p.priceKobo,
        compareAtKobo: p.compareAtKobo ?? null,
        badge: p.badge ?? null,
        featured: p.featured ? 1 : 0,
        bestSeller: p.bestSeller ? 1 : 0,
        isNew: p.isNew ? 1 : 0,
      });
      const productId = Number(info.lastInsertRowid);

      p.images.forEach((url, i) => insertImage.run(productId, url, `${p.name} view ${i + 1}`, null, i));
      p.colors.forEach((colorSlug, i) =>
        insertProductColor.run(productId, colorSlug, p.images[0], i === 0 ? 1 : 0, i),
      );

      for (const colorSlug of p.colors) {
        for (const size of p.sizes) {
          const key = `${colorSlug}/${size}`;
          const stock = p.outOfStock?.includes(key) ? 0 : nextStock(2, 9);
          insertVariant.run(productId, colorSlug, size, `ZK-${p.slug.toUpperCase().slice(0, 8)}-${colorSlug.slice(0, 3).toUpperCase()}-${size}`, stock);
        }
      }

      for (const review of SAMPLE_REVIEWS[p.slug] ?? []) {
        insertReview.run(
          productId,
          review.author,
          review.rating,
          review.title,
          review.body,
          `-${review.daysAgo} days`,
        );
      }
    }

    const insertZone = instance.prepare(
      'INSERT INTO delivery_zones (name, state, fee_kobo, eta, sort_order) VALUES (?, ?, ?, ?, ?)',
    );
    DELIVERY_ZONES.forEach((z) => insertZone.run(z.name, z.state, z.feeKobo, z.eta, z.sort));

    const insertCoupon = instance.prepare(
      'INSERT INTO coupons (code, description, type, value, min_subtotal_kobo, max_uses) VALUES (?, ?, ?, ?, ?, ?)',
    );
    COUPONS.forEach((c) => insertCoupon.run(c.code, c.description, c.type, c.value, c.minSubtotalKobo, c.maxUses));

    const insertSetting = instance.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    const settings: Record<string, string> = {
      store_name: 'Zakson',
      owner_name: 'Musty Zakari',
      support_email: 'mustaphazakari081@gmail.com',
      support_phone: '09034422971',
      location_city: 'Jos North',
      location_state: 'Plateau State',
      location_country: 'Nigeria',
      landmark: 'Terminus Market Overhead Bridge',
      whatsapp: '09034422971',
      instagram: 'https://instagram.com/',
      facebook: 'https://facebook.com/',
      twitter: 'https://x.com/',
      store_hours: 'Mon–Sat, 8:00 – 19:00 (WAT)',
      return_window_days: '7',
      free_delivery_threshold_kobo: '25000000',
      announcement: 'Free delivery in Jos on orders over ₦250,000',
    };
    Object.entries(settings).forEach(([k, v]) => insertSetting.run(k, v));
  })();
}

/**
 * Creates the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD on boot.
 * Sign in and change the password immediately — see README "First login".
 */
function ensureAdmin(instance: Database.Database) {
  const email = (process.env.ADMIN_EMAIL || 'mustaphazakari081@gmail.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'zakson-dev-only');
  const name = process.env.ADMIN_NAME || 'Musty Zakari';

  if (!password) {
    console.warn(
      '[zakson] ADMIN_PASSWORD is not set — no admin account was created. ' +
        'Set ADMIN_PASSWORD in the environment, restart, then sign in and rotate the password.',
    );
    return;
  }

  const existingAdmin = instance.prepare("SELECT id FROM users WHERE role = 'admin' OR role = 'staff' LIMIT 1").get();
  if (existingAdmin) return;

  const existingUser = instance.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  const hash = bcrypt.hashSync(password, 10);

  if (existingUser) {
    instance.prepare("UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?").run(hash, existingUser.id);
  } else {
    instance
      .prepare("INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, 'admin')")
      .run(email, name, '09034422971', hash);
  }
  console.info(`[zakson] Admin account ready for ${email} — change the password after your first login.`);
}
