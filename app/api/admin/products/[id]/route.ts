import { db } from '@/lib/db';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { productSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';
import { writeRelations } from '@/app/api/admin/products/route';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const { id } = await params;
  const productId = Number(id);
  const form = await request.formData();
  const intent = String(form.get('intent') || 'update');

  if (intent === 'delete') {
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return redirectTo(request, withFlash('/admin/products', 'Product deleted.'));
  }

  if (intent === 'stock') {
    const updates = [...form.entries()].filter(([key]) => key.startsWith('stock_'));
    db.transaction(() => {
      for (const [key, value] of updates) {
        const [, color, size] = key.split('_');
        const stock = Math.max(0, Math.min(9999, Number(value) || 0));
        db.prepare(
          'UPDATE product_variants SET stock = ? WHERE product_id = ? AND color_slug = ? AND size_label = ?',
        ).run(stock, productId, color, size);
      }
    })();
    return redirectTo(request, withFlash(`/admin/products/${productId}`, 'Inventory updated.'));
  }

  const payload = {
    ...Object.fromEntries(form.entries()),
    images: form.getAll('images').map(String).filter(Boolean),
    colors: form.getAll('colors').map(String).filter(Boolean),
    sizes: form.getAll('sizes').map(String).filter(Boolean),
    isFeatured: form.get('isFeatured') === 'on',
    isBestSeller: form.get('isBestSeller') === 'on',
    isNew: form.get('isNew') === 'on',
    isActive: form.get('isActive') === 'on',
    compareAtKobo: form.get('compareAt') ? Math.round(Number(String(form.get('compareAt')).replace(/[^0-9.]/g, '')) * 100) : null,
    priceKobo: Math.round(Number(String(form.get('price') || '0').replace(/[^0-9.]/g, '')) * 100),
    categoryId: Number(form.get('categoryId')),
  };

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return redirectTo(request, withFlash(`/admin/products/${productId}`, zodMessage(parsed.error), 'error'));
  }
  const data = parsed.data;

  db.transaction(() => {
    db.prepare(
      `UPDATE products SET slug = ?, name = ?, subtitle = ?, description = ?, category_id = ?, gender = ?,
        price_kobo = ?, compare_at_kobo = ?, badge = ?, is_featured = ?, is_best_seller = ?, is_new = ?,
        is_active = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(
      data.slug,
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
      productId,
    );
    writeRelations(productId, data.images ?? [], data.colors, data.sizes);
  })();

  return redirectTo(request, withFlash(`/admin/products/${productId}`, 'Product saved.'));
}
