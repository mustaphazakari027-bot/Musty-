import { db } from '@/lib/db';
import { markOrderFailed, markOrderPaid, type OrderRecord } from '@/lib/orders';
import { verifyPayment, type Provider } from '@/lib/payments';

/**
 * Confirms a payment server-side and updates the order. Safe to call repeatedly
 * (the complete page, webhooks and manual admin checks all use it).
 */
export async function finalizeOrderPayment(order: OrderRecord): Promise<{
  status: 'paid' | 'failed' | 'pending';
  message: string;
}> {
  if (order.payment_status === 'paid') return { status: 'paid', message: 'Payment already confirmed.' };

  const provider = (order.payment_provider as Provider) || 'demo';

  if (provider === 'demo') {
    // Demo mode never contacts a provider; the simulated page updated the order.
    return {
      status: order.payment_status === 'failed' ? 'failed' : 'pending',
      message: 'Simulated payment — no money was taken.',
    };
  }

  const reference = order.payment_reference || order.reference;
  let verification;
  try {
    verification = await verifyPayment(provider, reference);
  } catch (error) {
    return { status: 'pending', message: `We could not reach ${provider} to confirm payment: ${(error as Error).message}` };
  }

  if (verification.status === 'paid') {
    if (verification.amountKobo + 1 < order.total_kobo) {
      return { status: 'pending', message: 'The amount paid was lower than the order total. Contact support.' };
    }
    const result = markOrderPaid(order.id, provider, verification.reference, verification.amountKobo);
    if (!result.ok) return { status: 'pending', message: result.message ?? 'Could not confirm this payment.' };
    return { status: 'paid', message: 'Payment confirmed. Your order is being processed.' };
  }

  if (verification.status === 'failed') {
    markOrderFailed(order.id, provider, verification.reference, 'Provider reported a failed transaction.');
    return { status: 'failed', message: 'That payment did not go through. No money should have left your account.' };
  }

  return { status: 'pending', message: 'Payment is still pending with the provider. This page updates once it clears.' };
}

export function getOrderById(id: number) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRecord | undefined;
}
