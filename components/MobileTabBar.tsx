'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BagIcon, HeartIcon, HomeIcon, SearchIcon, UserIcon } from '@/components/Icons';

export function MobileTabBar({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const itemClass = (isActive: boolean) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
      isActive ? 'text-emerald' : 'text-white/55 hover:text-white'
    }`;

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="relative flex items-center rounded-[26px] bg-forest px-2 py-1.5 shadow-nav">
          <Link href="/" className={itemClass(active('/'))} aria-current={active('/') ? 'page' : undefined}>
            <HomeIcon size={20} />
            Home
          </Link>
          <Link href="/shop" className={itemClass(active('/shop'))} aria-current={active('/shop') ? 'page' : undefined}>
            <SearchIcon size={20} />
            Shop
          </Link>

          <div className="w-16" aria-hidden />

          <Link
            href="/wishlist"
            className={itemClass(active('/wishlist'))}
            aria-current={active('/wishlist') ? 'page' : undefined}
          >
            <HeartIcon size={20} />
            Saved
          </Link>
          <Link
            href="/account"
            className={itemClass(active('/account'))}
            aria-current={active('/account') ? 'page' : undefined}
          >
            <UserIcon size={20} />
            You
          </Link>

          <Link
            href="/cart"
            aria-label={`Shopping bag, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-5 place-items-center rounded-full border-[5px] border-mint-50 bg-emerald text-white shadow-lift transition-transform active:scale-95"
          >
            <BagIcon size={22} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[10px] font-bold text-white ring-2 ring-mint-50">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
