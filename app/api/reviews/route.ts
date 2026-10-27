import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { reviewSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const session = await getSession();
  const next = String(form.get('next') || '/shop');

  if (!session) return redirectTo(request, `/account/login?next=${encodeURIComponent(next)}`);

  const parsed = reviewSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return redirectTo(request, withFlash(next, zodMessage(parsed.error), 'error'));

  const { productId, rating, title, body } = parsed.data;
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return redirectTo(request, withFlash(next, 'That product could not be found.', 'error'));

  // "Verified" only when this customer actually has a delivered/paid order for it.
  const purchased = db
    .prepare(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.payment_status = 'paid' LIMIT 1`,
    )
    .get(productId, session.id);

  db.prepare(
    'INSERT INTO reviews (product_id, user_id, author, rating, title, body, is_verified, is_sample, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)',
  ).run(productId, session.id, session.name, rating, title || null, body, purchased ? 1 : 0);

  return redirectTo(request, withFlash(next, 'Thank you — your review has been published.'));
}
