import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatNaira, statusLabel } from '@/lib/pricing.mjs';
import { Flash } from '@/components/Flash';
import { EmptyState, StatusPill } from '@/components/ui';
import { HeartIcon, LogoutIcon, PackageIcon, PinIcon, UserIcon } from '@/components/Icons';
import type { OrderRecord } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) redirect('/account/login?next=/account');

  const user = db.prepare('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?').get(session.id) as {
    id: number;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    created_at: string;
  };

  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 10')
    .all(session.id) as OrderRecord[];

  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(session.id) as {
    id: number;
    label: string | null;
    full_name: string;
    phone: string;
    address: string;
    state: string;
    city: string;
    landmark: string | null;
    is_default: number;
  }[];

  const wishlistCount = (
    db.prepare('SELECT COUNT(*) AS c FROM wishlist_items WHERE user_id = ?').get(session.id) as { c: number }
  ).c;

  return (
    <div className="shell max-w-4xl py-6 sm:py-10">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/account" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-forest font-display text-xl font-extrabold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="text-[24px] font-extrabold leading-tight sm:text-[30px]">{user.name}</h1>
            <p className="text-[12px] text-ink/45">
              {user.email} · member since{' '}
              {new Date(user.created_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(user.role === 'admin' || user.role === 'staff') && (
            <Link href="/admin" className="btn-ghost btn-sm">
              Admin dashboard
            </Link>
          )}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn-ghost btn-sm">
              <LogoutIcon size={15} /> Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        <Link href="/orders" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-lift">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-200 text-forest">
            <PackageIcon size={18} />
          </span>
          <div>
            <p className="text-[13px] font-bold">Orders</p>
            <p className="text-[11px] text-ink/45">{orders.length} placed</p>
          </div>
        </Link>
        <Link href="/wishlist" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-lift">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-200 text-forest">
            <HeartIcon size={18} />
          </span>
          <div>
            <p className="text-[13px] font-bold">Wishlist</p>
            <p className="text-[11px] text-ink/45">{wishlistCount} saved</p>
          </div>
        </Link>
        <a href="#addresses" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-lift">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-200 text-forest">
            <PinIcon size={18} />
          </span>
          <div>
            <p className="text-[13px] font-bold">Addresses</p>
            <p className="text-[11px] text-ink/45">{addresses.length} saved</p>
          </div>
        </a>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            <UserIcon size={16} className="text-emerald" /> Profile
          </h2>
          <form action="/api/account/profile" method="post" className="mt-3 space-y-3">
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input id="name" name="name" required defaultValue={user.name} className="field" />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone number
              </label>
              <input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ''} className="field" placeholder="09034422971" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={user.email} readOnly disabled className="field bg-mist text-ink/50" />
              <p className="hint">Contact support to change the email on your account.</p>
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Save profile
            </button>
          </form>
        </section>

        <section id="addresses" className="card scroll-mt-24 p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            <PinIcon size={16} className="text-emerald" /> Delivery addresses
          </h2>
          <ul className="mt-3 space-y-2">
            {addresses.length === 0 && <li className="text-[12px] text-ink/45">No saved addresses yet.</li>}
            {addresses.map((a) => (
              <li key={a.id} className="rounded-2xl border border-line/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12px] leading-relaxed text-ink/60">
                    <p className="font-bold text-ink">
                      {a.label || 'Address'}
                      {a.is_default ? (
                        <span className="ml-1.5 rounded-full bg-emerald/10 px-2 py-0.5 text-[9.5px] font-bold uppercase text-emerald">
                          Default
                        </span>
                      ) : null}
                    </p>
                    {a.full_name} · {a.phone}
                    <br />
                    {a.address}, {a.city}, {a.state}
                    {a.landmark ? ` — ${a.landmark}` : ''}
                  </div>
                  <form action="/api/account/address" method="post">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-[10.5px] font-semibold text-red-500 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>

          <details className="mt-3 rounded-2xl bg-mint-50 p-3">
            <summary className="cursor-pointer text-[12px] font-semibold text-forest">Add a new address</summary>
            <form action="/api/account/address" method="post" className="mt-3 space-y-2.5">
              <input type="hidden" name="intent" value="create" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                <input name="label" placeholder="Label (Home, Office)" className="field py-2.5 text-[12.5px]" />
                <input name="fullName" required placeholder="Recipient name" defaultValue={user.name} className="field py-2.5 text-[12.5px]" />
                <input name="phone" required placeholder="Phone" defaultValue={user.phone ?? ''} className="field py-2.5 text-[12.5px]" />
                <input name="state" required placeholder="State" defaultValue="Plateau" className="field py-2.5 text-[12.5px]" />
                <input name="city" required placeholder="City" defaultValue="Jos" className="field py-2.5 text-[12.5px]" />
                <input name="landmark" placeholder="Landmark" className="field py-2.5 text-[12.5px]" />
                <input name="address" required placeholder="Street address" className="field py-2.5 text-[12.5px] sm:col-span-2" />
              </div>
              <label className="flex items-center gap-2 text-[11.5px] text-ink/60">
                <input type="checkbox" name="isDefault" value="true" className="accent-emerald" /> Make this my default
                address
              </label>
              <button type="submit" className="btn-primary w-full py-2.5 text-[12.5px]">
                Save address
              </button>
            </form>
          </details>
        </section>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold">Recent orders</h2>
          <Link href="/orders" className="text-[12px] font-semibold text-emerald hover:text-forest">
            All orders →
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No orders yet"
              description="Your Zakson orders and their delivery progress will appear here."
              action={{ href: '/shop', label: 'Find your pair' }}
              icon={<PackageIcon size={22} />}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {orders.map((o) => (
              <li key={o.id} className="card flex flex-wrap items-center justify-between gap-2.5 p-4">
                <div>
                  <p className="text-[13px] font-bold">{o.reference}</p>
                  <p className="text-[11px] text-ink/45">
                    {new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                    · {statusLabel(o.status)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <StatusPill status={o.payment_status} label={o.payment_status} />
                  <span className="text-[13px] font-bold text-forest">{formatNaira(o.total_kobo)}</span>
                  <Link href={`/orders/${o.reference}?token=${o.access_token}`} className="btn-ghost btn-sm">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
