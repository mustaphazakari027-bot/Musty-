import Link from 'next/link';
import { Logo } from '@/components/Brand';
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from '@/components/Icons';
import { MobileMenu } from '@/components/MobileMenu';
import { getSession } from '@/lib/auth';
import { getCartView } from '@/lib/cart';
import { db } from '@/lib/db';
import { getStoreInfo } from '@/lib/settings';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/shop?gender=men', label: 'Men' },
  { href: '/shop?gender=women', label: 'Women' },
  { href: '/shop?category=running-shoes', label: 'Running' },
  { href: '/shop?sort=newest', label: 'New Arrivals' },
  { href: '/shop?offers=1', label: 'Offers' },
];

export async function Header() {
  const [session, cart] = await Promise.all([getSession(), getCartView()]);
  const count = cart.totals.itemCount;
  const wishlistCount = session
    ? (db.prepare('SELECT COUNT(*) AS c FROM wishlist_items WHERE user_id = ?').get(session.id) as { c: number }).c
    : 0;
  const store = getStoreInfo();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-mint-50/85 backdrop-blur-xl">
      {store.announcement && (
        <div className="hidden bg-forest text-white sm:block">
          <div className="shell flex h-9 items-center justify-between text-[11.5px] font-medium tracking-wide">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
              {store.announcement}
            </p>
            <p className="flex items-center gap-4 text-white/70">
              <a href={`tel:${store.phone}`} className="hover:text-white">
                {store.phone}
              </a>
              <span aria-hidden>·</span>
              <span>
                {store.city}, {store.state}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="shell flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Logo />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-ink/70 transition-colors hover:bg-white hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <form action="/shop" method="get" className="hidden items-center xl:flex" role="search">
            <label htmlFor="header-search" className="sr-only">
              Search shoes
            </label>
            <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-3.5 focus-within:border-emerald">
              <SearchIcon size={16} className="text-ink/40" />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Search shoes…"
                className="w-36 bg-transparent text-[13px] outline-none placeholder:text-ink/35 focus:w-44"
              />
            </div>
          </form>

          <Link
            href="/shop"
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-full text-forest transition-colors hover:bg-white xl:hidden"
          >
            <SearchIcon size={20} />
          </Link>

          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
            className="relative hidden h-10 w-10 place-items-center rounded-full text-forest transition-colors hover:bg-white sm:grid"
          >
            <HeartIcon size={20} />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-emerald px-1 text-[9px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href={session ? '/account' : '/account/login'}
            aria-label={session ? 'Your account' : 'Log in'}
            className="grid h-10 w-10 place-items-center rounded-full text-forest transition-colors hover:bg-white"
          >
            <UserIcon size={20} />
          </Link>

          <Link
            href="/cart"
            aria-label={`Shopping bag, ${count} item${count === 1 ? '' : 's'}`}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-forest text-white shadow-card transition-transform hover:scale-105"
          >
            <BagIcon size={19} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-mint-50 bg-emerald px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
