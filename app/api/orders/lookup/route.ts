import { db } from '@/lib/db';
import { redirectTo, withFlash } from '@/lib/redirect';
import { clientIp, rateLimit } from '@/lib/http';
import type { OrderRecord } from '@/lib/orders';

/** Guest order lookup: reference + the email used at checkout. */
export async function POST(request: Request) {
  const form = await request.formData();
  const reference = String(form.get('reference') || '').trim().toUpperCase();
  const email = String(form.get('email') || '').trim().toLowerCase();

  const limit = rateLimit(`lookup:${clientIp(request)}`, 12, 10 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/orders', 'Too many lookups. Please wait a few minutes.', 'error'));
  }

  if (!reference || !email) {
    return redirectTo(request, withFlash('/orders', 'Enter both your order reference and email.', 'error'));
  }

  const order = db
    .prepare('SELECT * FROM orders WHERE UPPER(reference) = ? AND lower(customer_email) = ?')
    .get(reference, email) as OrderRecord | undefined;

  if (!order) {
    return redirectTo(
      request,
      withFlash('/orders', 'We could not find an order with that reference and email.', 'error'),
    );
  }

  return redirectTo(request, `/orders/${order.reference}?token=${order.access_token}`);
}
