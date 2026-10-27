import { setCartCoupon } from '@/lib/cart';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const code = String(form.get('code') || '').trim();
  const remove = form.get('remove') === '1';

  const result = await setCartCoupon(remove || !code ? null : code);
  const next = form.get('next') === 'checkout' ? '/checkout' : '/cart';
  return redirectTo(request, withFlash(next, result.message, result.ok ? 'ok' : 'error'));
}
