import { updateCartItem } from '@/lib/cart';
import { cartUpdateSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = cartUpdateSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/cart', zodMessage(parsed.error), 'error'));
  }
  const { itemId, ...changes } = parsed.data;
  const result = await updateCartItem(itemId, changes);
  return redirectTo(request, withFlash('/cart', result.message, result.ok ? 'ok' : 'error'));
}
