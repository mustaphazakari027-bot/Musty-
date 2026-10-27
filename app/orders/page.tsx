import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/pricing.mjs';
import { formatNaira } from '@/lib/pricing.mjs';
import { Flash } from '@/components/Flash';
import { StatusPill } from '@/components/ui';
import { PackageIcon } from '@/components/Icons';
import type { OrderRecord } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Track your order',
  description: 'Follow your Zakson order from confirmation to delivery.',
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  const orders = session
    ? (db
        .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 20')
        .all(session.id) as OrderRecord[])
    : [];

  return (
    <div className="shell max-w-3xl py-6 sm:py-10">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/orders" />

      <h1 className="text-[28px] font-extrabold leading-tight sm:text-[36px]">Track your order</h1>
      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-ink/50">
        Enter the reference from your confirmation (it looks like ZAK-XXXXXX) together with the email you used at
        checkout. You will see the current stage of your delivery.
      </p>

      <form action="/api/orders/lookup" method="post" className="card mt-5 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="reference" className="label">
            Order reference
          </label>
          <input id="reference" name="reference" required placeholder="ZAK-8F3K2Q" className="field uppercase" />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input id="email" name="email" type="email" required placeholder="you@email.com" className="field" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full py-3.5">
            Find order
          </button>
        </div>
      </form>

      {session ? (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold">Your orders</h2>
            <Link href="/account" className="text-[12px] font-semibold text-emerald hover:text-forest">
              Account →
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="card mt-3 flex flex-col items-center gap-2 p-8 text-center">
              <PackageIcon size={24} className="text-emerald" />
              <p className="text-[13.5px] font-semibold">No orders yet</p>
              <p className="max-w-sm text-[12px] text-ink/50">
                When you place your first order it will appear here with live delivery updates.
              </p>
              <Link href="/shop" className="btn-ghost btn-sm mt-1">
                Browse shoes
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {orders.map((order) => (
                <li key={order.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-[13px] font-bold text-ink">{order.reference}</p>
                    <p className="text-[11.5px] text-ink/45">
                      {new Date(order.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {order.delivery_city}, {order.delivery_state}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.payment_status} label={order.payment_status} />
                    <span className="text-[13px] font-bold text-forest">{formatNaira(order.total_kobo)}</span>
                    <Link
                      href={`/orders/${order.reference}?token=${order.access_token}`}
                      className="btn-ghost btn-sm"
                    >
                      {statusLabel(order.status)}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="mt-5 rounded-2xl bg-mint-100 px-4 py-3 text-[12px] text-ink/55">
          <Link href="/account/login?next=/orders" className="font-semibold text-forest underline">
            Sign in
          </Link>{' '}
          to see every order in one place, or use the lookup above as a guest.
        </p>
      )}
    </div>
  );
}
