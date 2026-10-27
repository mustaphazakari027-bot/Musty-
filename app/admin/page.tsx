import Link from 'next/link';
import { getDashboardStats } from '@/lib/admin';
import { formatNaira, statusLabel } from '@/lib/pricing.mjs';
import { StatusPill } from '@/components/ui';
import { providerStatus } from '@/lib/payments';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = getDashboardStats();
  const payments = providerStatus();
  const maxDay = Math.max(1, ...stats.salesByDay.map((d) => d.total));

  const cards = [
    { label: 'Paid revenue', value: formatNaira(stats.revenuePaidKobo), hint: 'Verified payments only', tone: 'bg-forest text-white' },
    { label: 'Total orders', value: String(stats.ordersTotal), hint: `${stats.ordersPaid} paid · ${stats.ordersPending} pending` },
    { label: 'Delivered', value: String(stats.ordersDelivered), hint: 'Completed deliveries' },
    { label: 'Customers', value: String(stats.customers), hint: `${stats.subscribers} newsletter subscribers` },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold leading-tight sm:text-[30px]">Store dashboard</h1>
          <p className="mt-1 text-[12.5px] text-ink/50">
            Live figures from the Zakson database. Payments: {payments.live ? `${payments.provider} (live)` : 'demo mode — no real money'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn-primary btn-sm px-4 py-2.5">
            Add product
          </Link>
          <Link href="/admin/orders" className="btn-ghost btn-sm px-4 py-2.5">
            View orders
          </Link>
        </div>
      </header>

      {!payments.live && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800">
          <strong>Payments are in demo mode.</strong> No card is charged. Add <code className="font-mono">PAYSTACK_SECRET_KEY</code>{' '}
          or <code className="font-mono">FLUTTERWAVE_SECRET_KEY</code> to <code className="font-mono">.env.local</code> and set
          the webhook URL to accept real orders.
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-3xl p-4 ${c.tone ?? 'border border-line/70 bg-white'}`}
          >
            <p className={`text-[10.5px] font-bold uppercase tracking-[0.12em] ${c.tone ? 'text-white/60' : 'text-ink/35'}`}>
              {c.label}
            </p>
            <p className={`mt-1.5 font-display text-[26px] font-extrabold leading-none ${c.tone ? 'text-white' : 'text-forest'}`}>
              {c.value}
            </p>
            <p className={`mt-1.5 text-[11px] ${c.tone ? 'text-white/50' : 'text-ink/40'}`}>{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Paid sales — last 14 days</h2>
          {stats.salesByDay.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-mint-50 px-3 py-6 text-center text-[12px] text-ink/45">
              No paid orders yet. Place a test order to see this chart populate.
            </p>
          ) : (
            <div className="mt-4 flex h-40 items-end justify-start gap-1.5 border-b border-line/70 pb-0">
              {stats.salesByDay.map((d) => (
                <div key={d.day} className="group flex max-w-[46px] flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-lg bg-emerald/80 transition-colors group-hover:bg-emerald"
                    style={{ height: `${Math.max(6, (d.total / maxDay) * 100)}%` }}
                    title={`${d.day}: ${formatNaira(d.total)} (${d.orders} orders)`}
                  />
                  <span className="text-[9px] text-ink/35">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Best sellers</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-3 text-[12px] text-ink/45">No paid sales recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.topProducts.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-mint-200 text-[11px] font-bold text-forest">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">{p.name}</p>
                    <p className="text-[10.5px] text-ink/40">{p.units} pair{p.units === 1 ? '' : 's'} sold</p>
                  </div>
                  <span className="text-[11.5px] font-bold text-forest">{formatNaira(p.revenueKobo)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-[14px] font-extrabold">Recent orders</h2>
            <Link href="/admin/orders" className="text-[11.5px] font-semibold text-emerald">
              All orders →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-4 pb-5 text-[12px] text-ink/45">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-mint-50 text-[10px] uppercase tracking-wide text-ink/40">
                  <tr>
                    <th className="px-4 py-2 font-bold">Reference</th>
                    <th className="px-4 py-2 font-bold">Customer</th>
                    <th className="px-4 py-2 font-bold">Total</th>
                    <th className="px-4 py-2 font-bold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-line/70">
                      <td className="px-4 py-2">
                        <Link href={`/admin/orders/${o.id}`} className="font-semibold text-forest hover:underline">
                          {o.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-ink/60">{o.customer_name}</td>
                      <td className="px-4 py-2 font-semibold">{formatNaira(o.total_kobo)}</td>
                      <td className="px-4 py-2">
                        <StatusPill status={o.payment_status} label={o.payment_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Inventory alerts</h2>
          <p className="text-[10.5px] text-ink/40">Variants with 2 or fewer pairs left.</p>
          {stats.lowStock.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-emerald/8 px-3 py-4 text-[12px] text-emerald">All sizes are well stocked.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {stats.lowStock.map((s) => (
                <li key={`${s.slug}-${s.color}-${s.size}`} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="truncate text-ink/65">
                    {s.product} · {s.color} · {s.size}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-bold ${s.stock === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                    {s.stock === 0 ? 'Out' : `${s.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-[12px]">
        <p className="text-ink/55">
          {stats.unreadMessages} unread support message{stats.unreadMessages === 1 ? '' : 's'} ·{' '}
          {stats.ordersPending} pending payment{stats.ordersPending === 1 ? '' : 's'} · {stats.ordersFailed} failed
        </p>
        <div className="flex gap-2">
          <Link href="/admin/messages" className="btn-ghost btn-sm">
            Messages
          </Link>
          <Link href="/admin/settings" className="btn-ghost btn-sm">
            Store settings
          </Link>
        </div>
      </div>
      <p className="pb-2 text-[10.5px] text-ink/35">
        Latest order update:{' '}
        {stats.recentOrders[0]
          ? `${stats.recentOrders[0].reference} — ${statusLabel(stats.recentOrders[0].status)}`
          : 'no orders yet'}
        .
      </p>
    </div>
  );
}
