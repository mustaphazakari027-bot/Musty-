import Link from 'next/link';
import { db } from '@/lib/db';
import { formatNaira } from '@/lib/pricing.mjs';
import { StatusPill } from '@/components/ui';
import { Flash } from '@/components/Flash';
import type { OrderRecord } from '@/lib/orders';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'open', label: 'In progress' },
  { value: 'delivered', label: 'Delivered' },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? '';

  const where =
    filter === 'pending'
      ? "WHERE payment_status = 'pending'"
      : filter === 'paid'
        ? "WHERE payment_status = 'paid'"
        : filter === 'failed'
          ? "WHERE payment_status = 'failed'"
          : filter === 'delivered'
            ? "WHERE status = 'delivered'"
            : filter === 'open'
              ? "WHERE status NOT IN ('delivered','cancelled')"
              : '';

  const orders = db.prepare(`SELECT * FROM orders ${where} ORDER BY id DESC LIMIT 100`).all() as OrderRecord[];

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total_kobo),0) AS sum FROM orders
       WHERE payment_status = 'paid' ${where ? '' : ''}`,
    )
    .get() as { count: number; sum: number };

  return (
    <div className="space-y-4">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/orders" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold">Orders</h1>
          <p className="mt-1 text-[12.5px] text-ink/50">
            {orders.length} shown · {totals.count} paid orders · {formatNaira(totals.sum)} verified revenue
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/orders?filter=${f.value}` : '/admin/orders'}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
                filter === f.value ? 'bg-forest text-white' : 'border border-line bg-white text-forest hover:bg-mint-100'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[11.5px]">
            <thead className="bg-mint-50 text-[10px] uppercase tracking-wide text-ink/40">
              <tr>
                <th className="px-4 py-2.5 font-bold">Reference</th>
                <th className="px-4 py-2.5 font-bold">Customer</th>
                <th className="px-4 py-2.5 font-bold">Delivery</th>
                <th className="px-4 py-2.5 font-bold">Total</th>
                <th className="px-4 py-2.5 font-bold">Payment</th>
                <th className="px-4 py-2.5 font-bold">Stage</th>
                <th className="px-4 py-2.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-line/70">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">
                      {o.reference}
                    </Link>
                    <p className="text-[10px] text-ink/35">
                      {new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{o.customer_name}</p>
                    <p className="text-[10px] text-ink/40">{o.customer_phone}</p>
                  </td>
                  <td className="px-4 py-2.5 text-ink/55">
                    {o.delivery_city}, {o.delivery_state}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-forest">{formatNaira(o.total_kobo)}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={o.payment_status} label={o.payment_status} />
                  </td>
                  <td className="px-4 py-2.5 text-ink/55">{o.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-[11px] font-semibold text-emerald">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-ink/45">
                    No orders in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
