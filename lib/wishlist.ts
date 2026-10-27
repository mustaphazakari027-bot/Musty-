import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getWishlistProductIds(): Promise<Set<number>> {
  const session = await getSession();
  if (!session) return new Set();
  const rows = db.prepare('SELECT product_id FROM wishlist_items WHERE user_id = ?').all(session.id) as {
    product_id: number;
  }[];
  return new Set(rows.map((r) => r.product_id));
}
