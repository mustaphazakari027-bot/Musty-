import { addToCart } from '@/lib/cart';
import { getSession } from '@/lib/auth';
import { cartAddSchema, zodMessage } from '@/lib/validate';
import { backTo, redirectTo, withFlash } from '@/lib/redirect';

/** Add the configured pair then jump straight to checkout. */
export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = cartAddSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash(backTo(form, request, '/cart'), zodMessage(parsed.error), 'error'));
  }
  const session = await getSession();
  const result = await addToCart(parsed.data, session?.id ?? null);
  if (!result.ok) {
    return redirectTo(request, withFlash(backTo(form, request, '/cart'), result.message, 'error'));
  }
  return redirectTo(request, '/checkout');
}
