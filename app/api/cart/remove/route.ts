import { removeCartItem } from '@/lib/cart';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const itemId = Number(form.get('itemId'));
  if (!Number.isFinite(itemId) || itemId <= 0) {
    return redirectTo(request, withFlash('/cart', 'That item could not be found.', 'error'));
  }
  const result = await removeCartItem(itemId);
  return redirectTo(request, withFlash('/cart', result.message, result.ok ? 'ok' : 'error'));
}
