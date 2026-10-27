import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isStaff } from '@/lib/auth';
import { BrandMark } from '@/components/Brand';
import {
  ChartIcon,
  GridIcon,
  LogoutIcon,
  MailIcon,
  PackageIcon,
  SettingsIcon,
  SparkIcon,
  TruckIcon,
} from '@/components/Icons';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: ChartIcon },
  { href: '/admin/products', label: 'Products', icon: GridIcon },
  { href: '/admin/orders', label: 'Orders', icon: TruckIcon },
  { href: '/admin/coupons', label: 'Promo codes', icon: SparkIcon },
  { href: '/admin/messages', label: 'Messages', icon: MailIcon },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/account/login?next=/admin');
  if (!isStaff(session)) redirect('/account');

  const pending = (
    db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status NOT IN ('delivered','cancelled')").get() as { c: number }
  ).c;
  const unread = (db.prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE is_read = 0').get() as { c: number }).c;

  return (
    <div className="shell py-5 sm:py-8">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <div className="card p-3">
            <div className="flex items-center gap-2 px-1 py-1.5">
              <BrandMark className="h-8 w-8" />
              <div>
                <p className="text-[13px] font-extrabold leading-none text-forest">Zakson admin</p>
                <p className="mt-1 text-[10px] text-ink/40">{session.role}</p>
              </div>
            </div>
            <nav aria-label="Admin" className="mt-2 flex gap-1 overflow-x-auto lg:flex-col">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold text-ink/65 transition-colors hover:bg-mint-100 hover:text-forest"
                >
                  <Icon size={15} className="text-emerald" />
                  {label}
                  {href === '/admin/orders' && pending > 0 && (
                    <span className="ml-auto rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {pending}
                    </span>
                  )}
                  {href === '/admin/messages' && unread > 0 && (
                    <span className="ml-auto rounded-full bg-emerald px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-2 space-y-1 border-t border-line pt-2">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-ink/55 hover:bg-mint-100"
              >
                <PackageIcon size={14} /> View storefront
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50"
                >
                  <LogoutIcon size={14} /> Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
