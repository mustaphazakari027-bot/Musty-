'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CloseIcon, MenuIcon, SearchIcon } from '@/components/Icons';
import { BrandMark } from '@/components/Brand';

const LINKS = [
  { href: '/shop', label: 'Shop all' },
  { href: '/shop?gender=men', label: "Men's shoes" },
  { href: '/shop?gender=women', label: "Women's shoes" },
  { href: '/shop?category=running-shoes', label: 'Running shoes' },
  { href: '/shop?category=training-shoes', label: 'Training shoes' },
  { href: '/shop?category=trail-shoes', label: 'Trail shoes' },
  { href: '/shop?category=lifestyle-sneakers', label: 'Lifestyle sneakers' },
  { href: '/shop?sort=newest', label: 'New arrivals' },
  { href: '/shop?offers=1', label: 'Offers' },
];

const SECONDARY = [
  { href: '/orders', label: 'Track an order' },
  { href: '/account', label: 'My account' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/help', label: 'Delivery, returns & sizing' },
  { href: '/contact', label: 'Contact us' },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full text-forest transition-colors hover:bg-white lg:hidden"
      >
        <MenuIcon size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto rounded-r-[28px] bg-mint-50 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <BrandMark className="h-9 w-9" />
                <span className="font-display text-lg font-extrabold tracking-tight text-forest">zakson</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-forest"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form action="/shop" method="get" role="search" className="mt-5">
              <label htmlFor="menu-search" className="sr-only">
                Search shoes
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-3">
                <SearchIcon size={17} className="text-ink/40" />
                <input
                  id="menu-search"
                  name="q"
                  type="search"
                  placeholder="Search running shoes…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
                />
              </div>
            </form>

            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-2xl px-3 py-3 text-[15px] font-semibold text-ink/80 transition-colors hover:bg-white hover:text-forest"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 border-t border-line pt-4">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/35">More</p>
              <nav aria-label="Secondary" className="mt-2 flex flex-col gap-1">
                {SECONDARY.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-2xl px-3 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-white hover:text-forest"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-auto pt-6 text-xs text-ink/45">
              <p className="font-semibold text-forest">Zakson — Customer Support</p>
              <a href="tel:09034422971" className="mt-1 block hover:text-forest">
                09034422971
              </a>
              <p className="mt-1">Terminus Market Overhead Bridge, Jos North</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
