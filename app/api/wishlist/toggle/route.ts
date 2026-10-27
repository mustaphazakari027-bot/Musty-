import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const productId = Number(form.get('productId'));
  const next = String(form.get('next') || '/shop');

  const session = await getSession();
  if (!session) {
    return redirectTo(request, `/account/login?next=${encodeURIComponent(next)}&flash=Sign in to save items to your wishlist.`);
  }
  if (!Number.isFinite(productId)) {
    return redirectTo(request, withFlash(next, 'That product could not be found.', 'error'));
  }

  const existing = db
    .prepare('SELECT 1 FROM wishlist_items WHERE user_id = ? AND product_id = ?')
    .get(session.id, productId);

  if (existing) {
    db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?').run(session.id, productId);
    return redirectTo(request, withFlash(next, 'Removed from your wishlist.'));
  }

  db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)').run(session.id, productId);
  return redirectTo(request, withFlash(next, 'Saved to your wishlist.'));
}
