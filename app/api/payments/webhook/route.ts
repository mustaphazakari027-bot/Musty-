import { db } from '@/lib/db';
import { markOrderFailed, markOrderPaid, type OrderRecord } from '@/lib/orders';
import { verifyFlutterwaveSignature, verifyPaystackSignature } from '@/lib/payments';

/**
 * Webhook receiver for Paystack and Flutterwave.
 * Signatures are verified against the raw body before anything is trusted.
 * Always returns 200 quickly so providers do not retry unnecessarily.
 */
export async function POST(request: Request) {
  const raw = await request.text();

  // ── Paystack ───────────────────────────────────────────────────────────────
  const paystackSignature = request.headers.get('x-paystack-signature');
  if (paystackSignature) {
    if (!verifyPaystackSignature(raw, paystackSignature)) {
      console.warn('paystack webhook: bad signature');
      return new Response('invalid signature', { status: 401 });
    }
    try {
      const event = JSON.parse(raw) as {
        event: string;
        data: { reference: string; status: string; amount: number; currency: string };
      };
      const order = db.prepare('SELECT * FROM orders WHERE reference = ?').get(event.data.reference) as
        | OrderRecord
        | undefined;
      if (!order) return Response.json({ status: 'ignored' });

      if (event.event === 'charge.success' && event.data.status === 'success') {
        markOrderPaid(order.id, 'paystack', event.data.reference, event.data.amount);
      } else if (event.event === 'charge.failed') {
        markOrderFailed(order.id, 'paystack', event.data.reference, 'Provider reported a failed charge.');
      }
      return Response.json({ status: 'ok' });
    } catch (error) {
      console.error('paystack webhook error', error);
      return new Response('bad payload', { status: 400 });
    }
  }

  // ── Flutterwave ────────────────────────────────────────────────────────────
  const flwSignature = request.headers.get('verif-hash');
  if (flwSignature) {
    if (!verifyFlutterwaveSignature(flwSignature)) {
      console.warn('flutterwave webhook: bad hash');
      return new Response('invalid signature', { status: 401 });
    }
    try {
      const event = JSON.parse(raw) as {
        event: string;
        data: { tx_ref: string; status: string; amount: number; currency: string };
      };
      const order = db.prepare('SELECT * FROM orders WHERE reference = ?').get(event.data.tx_ref) as
        | OrderRecord
        | undefined;
      if (!order) return Response.json({ status: 'ignored' });

      if (event.data.status === 'successful') {
        markOrderPaid(order.id, 'flutterwave', event.data.tx_ref, Math.round(event.data.amount * 100));
      } else if (event.data.status === 'failed') {
        markOrderFailed(order.id, 'flutterwave', event.data.tx_ref, 'Provider reported a failed charge.');
      }
      return Response.json({ status: 'ok' });
    } catch (error) {
      console.error('flutterwave webhook error', error);
      return new Response('bad payload', { status: 400 });
    }
  }

  return new Response('no signature header', { status: 400 });
}
