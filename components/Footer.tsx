import Link from 'next/link';
import { Logo } from '@/components/Brand';
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsappIcon,
  XIcon,
} from '@/components/Icons';
import { NewsletterForm } from '@/components/NewsletterForm';
import { getStoreInfo } from '@/lib/settings';

const SHOP_LINKS = [
  { href: '/shop', label: 'All shoes' },
  { href: '/shop?gender=men', label: "Men's shoes" },
  { href: '/shop?gender=women', label: "Women's shoes" },
  { href: '/shop?category=running-shoes', label: 'Running shoes' },
  { href: '/shop?category=trail-shoes', label: 'Trail shoes' },
  { href: '/shop?offers=1', label: 'Offers' },
];

const HELP_LINKS = [
  { href: '/help', label: 'Delivery & returns' },
  { href: '/help#size-guide', label: 'Size guide' },
  { href: '/orders', label: 'Track your order' },
  { href: '/help#faq', label: 'FAQs' },
  { href: '/contact', label: 'Contact us' },
];

export function Footer() {
  const store = getStoreInfo();
  const tel = store.phone.replace(/\s/g, '');
  const whatsapp = `https://wa.me/234${tel.replace(/^0/, '')}`;

  return (
    <footer className="mt-10 bg-forest text-white">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.15fr_.8fr_.8fr_1fr] lg:py-16">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            Premium running, training and lifestyle footwear — fitted and delivered from Jos North, Plateau State.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {store.instagram && (
              <a
                href={store.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zakson on Instagram"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-emerald"
              >
                <InstagramIcon size={17} />
              </a>
            )}
            {store.facebook && (
              <a
                href={store.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zakson on Facebook"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-emerald"
              >
                <FacebookIcon size={17} />
              </a>
            )}
            {store.twitter && (
              <a
                href={store.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Zakson on X"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-emerald"
              >
                <XIcon size={15} />
              </a>
            )}
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with Zakson on WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-emerald"
            >
              <WhatsappIcon size={17} />
            </a>
          </div>
        </div>

        <nav aria-label="Shop">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald">Help</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/65">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald">Zakson — Customer Support</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>
              <a href={`mailto:${store.email}`} className="flex items-start gap-2.5 hover:text-white">
                <MailIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
                <span className="break-all">{store.email}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${tel}`} className="flex items-start gap-2.5 hover:text-white">
                <PhoneIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
                {store.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <PinIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
              <span>
                {store.city}, {store.state}, {store.country}
                <br />
                <span className="text-white/50">Landmark: {store.landmark}</span>
              </span>
            </li>
          </ul>

          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <p className="text-xs font-semibold text-white">Join the Zakson list</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">
              New drops, restocks and genuine offers. No noise.
            </p>
            <NewsletterForm compact />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-3 py-6 text-[11.5px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Zakson. Owned by {store.owner}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/help#returns" className="hover:text-white">
              Returns policy
            </Link>
            <Link href="/help#privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/help#terms" className="hover:text-white">
              Terms
            </Link>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden />
              Secure checkout · Naira (₦)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
