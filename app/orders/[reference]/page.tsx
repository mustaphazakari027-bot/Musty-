import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { listOrderEvents, listOrderItems, type OrderRecord } from '@/lib/orders';
import { ORDER_STATUSES, formatNaira, statusIndex } from '@/lib/pricing.mjs';
import { StatusPill } from '@/components/ui';
import { CheckIcon, PhoneIcon, TruckIcon } from '@/components/Icons';
import { getStoreInfo } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order details',
  robots: { index: false, follow: false },
};

const TRACKABLE = ORDER_STATUSES.filter((s) => s.key !== 'cancelled');

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { reference } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const store = getStoreInfo();

  const order = db.prepare('SELECT * FROM orders WHERE reference = ?').get(reference.toUpperCase()) as
    | OrderRecord
    | undefined;

  if (!order) notFound();
  const allowed =
    (session && order.user_id === session.id) ||
    (sp.token && sp.token === order.access_token) ||
    (session && (session.role === 'admin' || session.role === 'staff'));
  if (!allowed) notFound();

  const items = listOrderItems(order.id);
  const events = listOrderEvents(order.id);
  const currentIndex = statusIndex(order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <div className="shell max-w-3xl py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/orders" className="hover:text-forest">
          Track order
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">{order.reference}</span>
      </nav>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">Order</p>
            <h1 className="text-[22px] font-extrabold leading-tight sm:text-[26px]">{order.reference}</h1>
            <p className="mt-0.5 text-[11.5px] text-ink/45">
              Placed{' '}
              {new Date(order.created_at).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusPill status={order.payment_status} label={`Payment ${order.payment_status}`} />
            <span className="text-[13px] font-bold text-forest">{formatNaira(order.total_kobo)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-b border-line p-5">
          <h2 className="text-[14px] font-extrabold">Delivery progress</h2>
          {cancelled ? (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
              This order was cancelled. Contact support if you need help.
            </p>
          ) : (
            <ol className="mt-3 space-y-0">
              {TRACKABLE.map((step, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                          done ? 'border-emerald bg-emerald text-white' : 'border-line bg-white text-ink/30'
                        }`}
                      >
                        {done ? <CheckIcon size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </span>
                      {i < TRACKABLE.length - 1 && (
                        <span className={`my-0.5 h-7 w-0.5 ${i < currentIndex ? 'bg-emerald' : 'bg-line'}`} />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-[12.5px] font-bold ${active ? 'text-forest' : done ? 'text-ink/80' : 'text-ink/35'}`}>
                        {step.label}
                      </p>
                      <p className="text-[11px] leading-relaxed text-ink/40">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-3 rounded-xl bg-mint-100 px-3 py-2 text-[11px] leading-relaxed text-ink/50">
            <TruckIcon size={13} className="mr-1 inline text-emerald" />
            Updates are posted by our team — this is not live GPS tracking. For an urgent update call{' '}
            <a href={`tel:${store.phone}`} className="font-semibold text-forest">
              {store.phone}
            </a>
            .
          </p>
        </div>

        {/* Items */}
        <div className="border-b border-line p-5">
          <h2 className="text-[14px] font-extrabold">Items</h2>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mint-100">
                  {item.image_url && <Image src={item.image_url} alt="" fill sizes="60px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{item.product_name}</p>
                  <p className="text-[11px] text-ink/45">
                    {item.color_name} · Size {item.size_label} · Qty {item.qty}
                  </p>
                </div>
                <span className="text-[12px] font-semibold text-ink">
                  {formatNaira(item.unit_price_kobo * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-ink/50">Subtotal</dt>
              <dd>{formatNaira(order.subtotal_kobo)}</dd>
            </div>
            {order.discount_kobo > 0 && (
              <div className="flex justify-between text-emerald">
                <dt>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</dt>
                <dd>−{formatNaira(order.discount_kobo)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/50">Delivery — {order.delivery_zone_name}</dt>
              <dd>{order.delivery_fee_kobo === 0 ? 'Free' : formatNaira(order.delivery_fee_kobo)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-[14px] font-bold">
              <dt>Total</dt>
              <dd className="text-forest">{formatNaira(order.total_kobo)}</dd>
            </div>
          </dl>
        </div>

        {/* Delivery details */}
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <h2 className="text-[14px] font-extrabold">Delivery address</h2>
            <address className="mt-1.5 text-[12px] not-italic leading-relaxed text-ink/60">
              {order.customer_name}
              <br />
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
              <a href={`tel:${order.customer_phone}`} className="inline-flex items-center gap-1 font-semibold text-forest">
                <PhoneIcon size={12} /> {order.customer_phone}
              </a>
            </address>
            {order.delivery_instructions && (
              <p className="mt-2 rounded-lg bg-mist px-2.5 py-1.5 text-[11px] text-ink/55">
                “{order.delivery_instructions}”
              </p>
            )}
          </div>
          <div>
            <h2 className="text-[14px] font-extrabold">Updates</h2>
            <ul className="mt-1.5 space-y-1.5">
              {events.map((e) => (
                <li key={e.id} className="text-[11.5px] leading-relaxed text-ink/55">
                  <span className="font-semibold text-ink">
                    {ORDER_STATUSES.find((s) => s.key === e.status)?.label ?? e.status}
                  </span>
                  <span className="text-ink/35">
                    {' · '}
                    {new Date(e.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </span>
                  {e.note && <span className="block text-ink/40">{e.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line bg-mint-50 p-4">
          <Link href="/shop" className="btn-primary btn-sm px-5 py-3">
            Reorder or shop again
          </Link>
          <Link href="/contact" className="btn-ghost btn-sm px-5 py-3">
            Need help with this order?
          </Link>
        </div>
      </div>
    </div>
  );
}
