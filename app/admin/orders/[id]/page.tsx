import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { listOrderEvents, listOrderItems, type OrderRecord } from '@/lib/orders';
import { ORDER_STATUSES, formatNaira } from '@/lib/pricing.mjs';
import { StatusPill } from '@/components/ui';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id)) as OrderRecord | undefined;
  if (!order) notFound();

  const items = listOrderItems(order.id);
  const events = listOrderEvents(order.id);
  const payments = db
    .prepare('SELECT provider, reference, status, amount_kobo, created_at FROM payments WHERE order_id = ? ORDER BY id DESC')
    .all(order.id) as { provider: string; reference: string; status: string; amount_kobo: number; created_at: string }[];

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/admin/orders" className="hover:text-forest">
          Orders
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">{order.reference}</span>
      </nav>

      <Flash message={sp.flash} tone={sp.flashTone} clearHref={`/admin/orders/${order.id}`} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold">{order.reference}</h1>
          <p className="mt-1 text-[12px] text-ink/50">
            {new Date(order.created_at).toLocaleString('en-NG')} · {order.payment_provider}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={order.payment_status} label={`Payment ${order.payment_status}`} />
          <Link href={`/orders/${order.reference}?token=${order.access_token}`} className="btn-ghost btn-sm px-3 py-2">
            Customer view
          </Link>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.25fr_.75fr] lg:items-start">
        <div className="space-y-3.5">
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-[13px] font-extrabold">Items</h2>
            <ul className="divide-y divide-line/70">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]">
                  <div>
                    <p className="font-semibold text-ink">{i.product_name}</p>
                    <p className="text-[10.5px] text-ink/45">
                      {i.color_name} · UK {i.size_label} · ×{i.qty} · {formatNaira(i.unit_price_kobo)} each
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">{formatNaira(i.unit_price_kobo * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-line px-4 py-3 text-[11.5px]">
              <div className="flex justify-between">
                <dt className="text-ink/50">Subtotal</dt>
                <dd>{formatNaira(order.subtotal_kobo)}</dd>
              </div>
              {order.discount_kobo > 0 && (
                <div className="flex justify-between text-emerald">
                  <dt>Discount ({order.coupon_code})</dt>
                  <dd>−{formatNaira(order.discount_kobo)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink/50">Delivery — {order.delivery_zone_name}</dt>
                <dd>{formatNaira(order.delivery_fee_kobo)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-[13px] font-bold">
                <dt>Total</dt>
                <dd className="text-forest">{formatNaira(order.total_kobo)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-4">
            <h2 className="text-[13px] font-extrabold">Fulfilment</h2>
            <form action={`/api/admin/orders/${order.id}`} method="post" className="mt-2.5 flex flex-wrap items-end gap-2">
              <input type="hidden" name="intent" value="status" />
              <div className="min-w-[180px] flex-1">
                <label htmlFor="status" className="label text-[11.5px]">
                  Update stage
                </label>
                <select id="status" name="status" defaultValue={order.status} className="field py-2.5 text-[12px]">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[180px] flex-1">
                <label htmlFor="note" className="label text-[11.5px]">
                  Note (optional)
                </label>
                <input id="note" name="note" className="field py-2.5 text-[12px]" placeholder="Handed to rider…" />
              </div>
              <button type="submit" className="btn-primary px-4 py-2.5 text-[12px]">
                Save stage
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
              <form action={`/api/admin/orders/${order.id}`} method="post">
                <input type="hidden" name="intent" value="verify-payment" />
                <button type="submit" className="btn-ghost btn-sm px-3 py-2 text-[11.5px]">
                  Verify with provider
                </button>
              </form>
              <form action={`/api/admin/orders/${order.id}`} method="post">
                <input type="hidden" name="intent" value="mark-paid" />
                <button type="submit" className="btn-ghost btn-sm px-3 py-2 text-[11.5px]">
                  Mark paid (transfer)
                </button>
              </form>
              <form action={`/api/admin/orders/${order.id}`} method="post">
                <input type="hidden" name="intent" value="mark-failed" />
                <button type="submit" className="btn-ghost btn-sm px-3 py-2 text-[11.5px] text-amber-700">
                  Mark payment failed
                </button>
              </form>
              <form action={`/api/admin/orders/${order.id}`} method="post">
                <input type="hidden" name="intent" value="refund" />
                <button type="submit" className="btn-ghost btn-sm px-3 py-2 text-[11.5px] text-red-600">
                  Record refund & cancel
                </button>
              </form>
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-[13px] font-extrabold">Timeline</h2>
            <ul className="mt-2 space-y-1.5">
              {events.map((e) => (
                <li key={e.id} className="text-[11.5px] text-ink/60">
                  <span className="font-semibold text-ink">
                    {ORDER_STATUSES.find((s) => s.key === e.status)?.label ?? e.status}
                  </span>
                  <span className="text-ink/35"> · {new Date(e.created_at).toLocaleString('en-NG')}</span>
                  {e.note && <span className="block text-[10.5px] text-ink/40">{e.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-3.5">
          <section className="card p-4">
            <h2 className="text-[13px] font-extrabold">Customer</h2>
            <div className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-ink/60">
              <p className="font-semibold text-ink">{order.customer_name}</p>
              <p>
                <a href={`tel:${order.customer_phone}`} className="text-forest underline">
                  {order.customer_phone}
                </a>
              </p>
              <p className="break-all">{order.customer_email}</p>
            </div>
            <h3 className="mt-3 text-[12px] font-bold text-ink">Delivery</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/60">
              {order.delivery_address}
              <br />
              {order.delivery_city}, {order.delivery_state}
              {order.delivery_landmark && (
                <>
                  <br />
                  Landmark: {order.delivery_landmark}
                </>
              )}
              <br />
              <span className="text-ink/40">{order.delivery_zone_name}</span>
            </p>
            {order.delivery_instructions && (
              <p className="mt-2 rounded-lg bg-mist px-2.5 py-1.5 text-[10.5px] text-ink/55">
                “{order.delivery_instructions}”
              </p>
            )}
          </section>

          <section className="card p-4">
            <h2 className="text-[13px] font-extrabold">Payment records</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-[11.5px] text-ink/45">No payment attempts recorded.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {payments.map((p) => (
                  <li key={`${p.reference}-${p.created_at}`} className="text-[11px] text-ink/55">
                    <span className="font-semibold text-ink">{p.status}</span> · {p.provider} ·{' '}
                    {formatNaira(p.amount_kobo)}
                    <span className="block text-[10px] text-ink/35">{p.reference}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-ink/35">
              Provider reference: {order.payment_reference ?? '—'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
