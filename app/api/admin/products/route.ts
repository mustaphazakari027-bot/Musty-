import { db } from '@/lib/db';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { productSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';
import { slugify } from '@/lib/admin';

/** Create a product (admin/staff only). */
export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const form = await request.formData();
  const payload = {
    ...Object.fromEntries(form.entries()),
    images: form.getAll('images').map(String).filter(Boolean),
    colors: form.getAll('colors').map(String).filter(Boolean),
    sizes: form.getAll('sizes').map(String).filter(Boolean),
    isFeatured: form.get('isFeatured') === 'on' || form.get('isFeatured') === 'true',
    isBestSeller: form.get('isBestSeller') === 'on' || form.get('isBestSeller') === 'true',
    isNew: form.get('isNew') === 'on' || form.get('isNew') === 'true',
    isActive: form.get('isActive') === 'on' || form.get('isActive') === 'true',
    compareAtKobo: form.get('compareAt') ? Math.round(Number(String(form.get('compareAt')).replace(/[^0-9.]/g, '')) * 100) : null,
    priceKobo: Math.round(Number(String(form.get('price') || '0').replace(/[^0-9.]/g, '')) * 100),
    categoryId: Number(form.get('categoryId')),
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return redirectTo(request, withFlash('/admin/products/new', zodMessage(parsed.error), 'error'));
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  if (db.prepare('SELECT id FROM products WHERE slug = ?').get(slug)) {
    return redirectTo(request, withFlash('/admin/products/new', 'That slug is already in use.', 'error'));
  }

  const create = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO products (slug, name, subtitle, description, category_id, gender, price_kobo, compare_at_kobo, badge,
          is_featured, is_best_seller, is_new, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        slug,
        data.name,
        data.subtitle || null,
        data.description,
        data.categoryId,
        data.gender,
        data.priceKobo,
        data.compareAtKobo || null,
        data.badge || null,
        data.isFeatured ? 1 : 0,
        data.isBestSeller ? 1 : 0,
        data.isNew ? 1 : 0,
        data.isActive === false ? 0 : 1,
      );
    const productId = Number(info.lastInsertRowid);
    writeRelations(productId, data.images ?? [], data.colors, data.sizes);
    return productId;
  });

  const id = create();
  return redirectTo(request, withFlash(`/admin/products/${id}`, 'Product created.'));
}

export function writeRelations(productId: number, images: string[], colors: string[], sizes: string[]) {
  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
  db.prepare('DELETE FROM product_colors WHERE product_id = ?').run(productId);

  const imageList = images.length ? images : ['/images/products/ultra-run-pro-1.webp'];
  imageList.forEach((url, i) =>
    db.prepare('INSERT INTO product_images (product_id, url, alt, sort_order) VALUES (?, ?, ?, ?)').run(
      productId,
      url,
      null,
      i,
    ),
  );
  colors.forEach((colorSlug, i) =>
    db
      .prepare(
        'INSERT OR IGNORE INTO product_colors (product_id, color_slug, image_url, is_default, sort_order) VALUES (?, ?, ?, ?, ?)',
      )
      .run(productId, colorSlug, imageList[0], i === 0 ? 1 : 0, i),
  );

  // Keep existing stock for combinations that still exist, create the rest.
  const existing = db
    .prepare('SELECT color_slug, size_label, stock FROM product_variants WHERE product_id = ?')
    .all(productId) as { color_slug: string; size_label: string; stock: number }[];
  const keep = new Set<string>();

  for (const color of colors) {
    for (const size of sizes) {
      const key = `${color}::${size}`;
      keep.add(key);
      const found = existing.find((v) => `${v.color_slug}::${v.size_label}` === key);
      if (!found) {
        db.prepare(
          'INSERT OR IGNORE INTO product_variants (product_id, color_slug, size_label, sku, stock) VALUES (?, ?, ?, ?, ?)',
        ).run(
          productId,
          color,
          size,
          `ZK-${productId}-${color.slice(0, 3).toUpperCase()}-${size}`,
          5,
        );
      }
    }
  }
  for (const v of existing) {
    if (!keep.has(`${v.color_slug}::${v.size_label}`)) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ? AND color_slug = ? AND size_label = ?').run(
        productId,
        v.color_slug,
        v.size_label,
      );
    }
  }
  db.prepare("UPDATE products SET updated_at = datetime('now') WHERE id = ?").run(productId);
}
