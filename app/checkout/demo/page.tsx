import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { listOrderItems, type OrderRecord } from '@/lib/orders';
import { demoPaymentsEnabled, providerStatus } from '@/lib/payments';
import { formatNaira } from '@/lib/pricing.mjs';
import { ShieldIcon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Simulated payment',
  robots: { index: false, follow: false },
};

/**
 * Stand-in for the provider's hosted checkout page. Only reachable when the store
 * has no live payment keys and ALLOW_DEMO_PAYMENTS is not disabled.
 */
export default async function DemoPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; token?: string }>;
}) {
  const sp = await searchParams;
  const status = providerStatus();
  if (!demoPaymentsEnabled() || status.live) redirect('/cart');

  const order = db
    .prepare('SELECT * FROM orders WHERE reference = ? AND access_token = ?')
    .get(sp.reference ?? '', sp.token ?? '') as OrderRecord | undefined;

  if (!order) notFound();
  const items = listOrderItems(order.id);

  return (
    <div className="shell max-w-xl py-10">
      <div className="card overflow-hidden">
        <div className="bg-forest p-6 text-white">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mint-200">
            <ShieldIcon size={14} /> Simulated gateway
          </p>
          <p className="mt-2 text-[13px] text-white/65">
            Demo mode — no card is charged and no money moves. Configure Paystack or Flutterwave to accept real
            payments.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">Amount due</p>
              <p className="font-display text-[30px] font-extrabold text-forest">{formatNaira(order.total_kobo)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">Order</p>
              <p className="text-[13px] font-bold text-ink">{order.reference}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-1.5 rounded-2xl bg-mint-50 p-3.5 text-[12px] text-ink/60">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>
                  {i.product_name} · {i.size_label} · ×{i.qty}
                </span>
                <span className="font-semibold text-ink">{formatNaira(i.unit_price_kobo * i.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between border-t border-line pt-1.5 text-[11.5px]">
              <span>Delivery — {order.delivery_zone_name}</span>
              <span>{order.delivery_fee_kobo === 0 ? 'Free' : formatNaira(order.delivery_fee_kobo)}</span>
            </li>
          </ul>

          <form action="/api/payments/demo" method="post" className="mt-5 space-y-2.5">
            <input type="hidden" name="reference" value={order.reference} />
            <input type="hidden" name="token" value={order.access_token} />
            <button type="submit" name="outcome" value="paid" className="btn-primary w-full py-4">
              Pay {formatNaira(order.total_kobo)} now
            </button>
            <button type="submit" name="outcome" value="failed" className="btn-ghost w-full py-3">
              Simulate a declined payment
            </button>
          </form>

          <p className="mt-4 text-center text-[10.5px] leading-relaxed text-ink/40">
            A real integration redirects the customer to Paystack/Flutterwave, then verifies the transaction on the
            server before marking the order paid. <Link href="/cart" className="underline">Return to bag</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
