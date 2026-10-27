import { db } from '@/lib/db';
import { markOrderFailed, markOrderPaid, type OrderRecord } from '@/lib/orders';
import { demoPaymentsEnabled } from '@/lib/payments';
import { redirectTo } from '@/lib/redirect';

/**
 * Simulated payment endpoint used only when no live provider is configured.
 * It exists so the full paid / pending / failed order flow can be tested.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const reference = String(form.get('reference') || '');
  const token = String(form.get('token') || '');
  const outcome = String(form.get('outcome') || 'paid');

  if (!demoPaymentsEnabled() || process.env.PAYMENT_PROVIDER === 'paystack' || process.env.PAYMENT_PROVIDER === 'flutterwave') {
    return redirectTo(request, '/cart');
  }

  const order = db.prepare('SELECT * FROM orders WHERE reference = ? AND access_token = ?').get(reference, token) as
    | OrderRecord
    | undefined;

  if (!order) return redirectTo(request, '/orders?flash=That order could not be found.&flashTone=error');

  const completeUrl = `/checkout/complete?reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`;

  if (outcome === 'failed') {
    markOrderFailed(order.id, 'demo', `demo_${reference}`, 'Simulated declined payment.');
    return redirectTo(request, `${completeUrl}&simulated=failed`);
  }

  markOrderPaid(order.id, 'demo', `demo_${reference}`, order.total_kobo);
  return redirectTo(request, `${completeUrl}&simulated=paid`);
}

export async function GET(request: Request) {
  return redirectTo(request, '/cart');
}
