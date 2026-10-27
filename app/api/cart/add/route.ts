import { addToCart } from '@/lib/cart';
import { getSession } from '@/lib/auth';
import { cartAddSchema, zodMessage } from '@/lib/validate';
import { backTo, redirectTo, withFlash } from '@/lib/redirect';
import { jsonError, jsonOk } from '@/lib/http';

export async function POST(request: Request) {
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const parsed = cartAddSchema.safeParse(raw);

  if (!parsed.success) {
    const message = zodMessage(parsed.error);
    if (request.headers.get('accept')?.includes('application/json')) return jsonError(message);
    return redirectTo(request, withFlash(backTo(form, request, '/cart'), message, 'error'));
  }

  const session = await getSession();
  const result = await addToCart(parsed.data, session?.id ?? null);
  const next = backTo(form, request, '/cart');

  if (request.headers.get('accept')?.includes('application/json')) {
    return result.ok
      ? jsonOk({ message: result.message, cart: result.cart })
      : jsonError(result.message);
  }

  return redirectTo(request, withFlash(next, result.message, result.ok ? 'ok' : 'error'));
}
