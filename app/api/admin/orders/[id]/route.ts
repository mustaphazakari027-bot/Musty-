import { db } from '@/lib/db';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { advanceOrderStatus, type OrderRecord } from '@/lib/orders';
import { finalizeOrderPayment } from '@/lib/finalize';
import { redirectTo, withFlash } from '@/lib/redirect';
import { ORDER_STATUSES } from '@/lib/pricing.mjs';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const { id } = await params;
  const orderId = Number(id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRecord | undefined;
  if (!order) return redirectTo(request, withFlash('/admin/orders', 'Order not found.', 'error'));

  const form = await request.formData();
  const intent = String(form.get('intent') || 'status');

  if (intent === 'status') {
    const status = String(form.get('status') || '');
    if (!ORDER_STATUSES.some((s) => s.key === status)) {
      return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Unknown status.', 'error'));
    }
    advanceOrderStatus(orderId, status, String(form.get('note') || '') || undefined);
    return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Order status updated.'));
  }

  if (intent === 'verify-payment') {
    const result = await finalizeOrderPayment(order);
    return redirectTo(
      request,
      withFlash(`/admin/orders/${orderId}`, result.message, result.status === 'failed' ? 'error' : 'ok'),
    );
  }

  if (intent === 'mark-paid') {
    db.prepare("UPDATE orders SET payment_status = 'paid', payment_reference = ?, updated_at = datetime('now') WHERE id = ?").run(
      `manual_${order.reference}`,
      orderId,
    );
    advanceOrderStatus(orderId, 'payment_confirmed', `Marked paid manually by ${session.name}.`);
    return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Order marked as paid.'));
  }

  if (intent === 'mark-failed') {
    db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(orderId);
    advanceOrderStatus(orderId, 'received', `Payment marked failed by ${session.name}.`);
    return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Order marked as failed.'));
  }

  if (intent === 'refund') {
    db.prepare("UPDATE orders SET payment_status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(orderId);
    advanceOrderStatus(orderId, 'cancelled', `Refund recorded by ${session.name}.`);
    return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Refund recorded and order cancelled.'));
  }

  return redirectTo(request, withFlash(`/admin/orders/${orderId}`, 'Nothing to do.', 'error'));
}
