import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { listOrderItems, type OrderRecord } from '@/lib/orders';
import { finalizeOrderPayment } from '@/lib/finalize';
import { clearCart, readCartToken } from '@/lib/cart';
import { formatNaira } from '@/lib/pricing.mjs';
import { CheckIcon, CloseIcon, PackageIcon, RunIcon } from '@/components/Icons';
import { StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment status',
  robots: { index: false, follow: false },
};

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; token?: string; simulated?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const order = (
    sp.reference
      ? db.prepare('SELECT * FROM orders WHERE reference = ?').get(sp.reference)
      : null
  ) as OrderRecord | undefined;

  if (!order) notFound();

  const ownsOrder =
    (session && order.user_id === session.id) ||
    (sp.token && sp.token === order.access_token) ||
    (session && (session.role === 'admin' || session.role === 'staff'));
  if (!ownsOrder) notFound();

  const result = await finalizeOrderPayment(order);
  const fresh = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id) as OrderRecord;

  if (fresh.payment_status === 'paid') {
    await clearCart(await readCartToken());
  }

  const items = listOrderItems(fresh.id);
  const paid = fresh.payment_status === 'paid';
  const failed = fresh.payment_status === 'failed';
  const trackingHref = `/orders/${fresh.reference}?token=${fresh.access_token}`;

  return (
    <div className="shell max-w-2xl py-8 sm:py-12">
      <div className="card overflow-hidden">
        <div className={`p-6 text-center sm:p-8 ${paid ? 'bg-forest' : failed ? 'bg-red-600' : 'bg-amber-500'}`}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15 text-white">
            {paid ? <CheckIcon size={26} /> : failed ? <CloseIcon size={24} /> : <PackageIcon size={24} />}
          </span>
          <h1 className="mt-4 text-[24px] font-extrabold text-white sm:text-[28px]">
            {paid ? 'Payment confirmed' : failed ? 'Payment failed' : 'Payment pending'}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/75">
            {paid
              ? `Thank you! Order ${fresh.reference} is confirmed and is being packed at our Jos store.`
              : failed
                ? 'The payment did not go through and no order was confirmed. Nothing should have left your account — you can try again.'
                : result.message}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <StatusPill status={paid ? 'paid' : failed ? 'failed' : 'pending'} label={paid ? 'Paid' : failed ? 'Failed' : 'Pending'} />
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
              {fresh.payment_provider === 'demo' ? 'Simulated (demo)' : fresh.payment_provider}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <dl className="grid gap-3 text-[12.5px] sm:grid-cols-2">
            <div>
              <dt className="text-ink/40">Order reference</dt>
              <dd className="font-bold text-ink">{fresh.reference}</dd>
            </div>
            <div>
              <dt className="text-ink/40">Total</dt>
              <dd className="font-bold text-ink">{formatNaira(fresh.total_kobo)}</dd>
            </div>
            <div>
              <dt className="text-ink/40">Delivering to</dt>
              <dd className="font-medium text-ink">
                {fresh.delivery_address}, {fresh.delivery_city}, {fresh.delivery_state}
              </dd>
            </div>
            <div>
              <dt className="text-ink/40">Delivery area</dt>
              <dd className="font-medium text-ink">{fresh.delivery_zone_name}</dd>
            </div>
          </dl>

          <ul className="mt-4 divide-y divide-line rounded-2xl bg-mint-50 px-3.5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-[12px]">
                <span className="text-ink/70">
                  {i.product_name} · Size {i.size_label} · {i.color_name} · ×{i.qty}
                </span>
                <span className="shrink-0 font-semibold text-ink">{formatNaira(i.unit_price_kobo * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            <Link href={trackingHref} className="btn-primary py-3.5">
              Track this order
            </Link>
            <Link href="/shop" className="btn-ghost py-3.5">
              <RunIcon size={16} /> Continue shopping
            </Link>
          </div>

          {failed && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11.5px] text-red-700">
              You can safely place the order again from your{' '}
              <Link href="/cart" className="underline">
                bag
              </Link>
              . If your bank shows a debit without an order, contact 09034422971 with reference {fresh.reference}.
            </p>
          )}

          {!paid && !failed && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
              We are waiting for the payment provider to confirm. Refresh this page in a moment — the order is created
              but not yet paid.
            </p>
          )}

          <p className="mt-4 text-center text-[11px] text-ink/40">
            Keep your reference <strong className="text-ink/60">{fresh.reference}</strong> handy. Signed-in customers can
            see all orders under <Link href="/account" className="underline">account</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
