import type { Metadata } from 'next';
import Link from 'next/link';
import { getStoreInfo } from '@/lib/settings';
import { Flash } from '@/components/Flash';
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, WhatsappIcon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Zakson — Jos North, Plateau State',
  description:
    'Talk to Zakson customer support in Jos North, Plateau State. Call 09034422971, email mustaphazakari081@gmail.com or send a message from this page.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const store = getStoreInfo();
  const tel = store.phone.replace(/\s/g, '');
  const whatsapp = `https://wa.me/234${tel.replace(/^0/, '')}`;

  return (
    <div className="shell py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/" className="hover:text-forest">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">Contact</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr] lg:items-start">
        <div>
          <p className="eyebrow">We are here to help</p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-[1.05] sm:text-[42px]">Contact Zakson</h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-ink/55">
            Questions about sizing, delivery or an existing order? Reach us on the phone, by email, or send a message
            below — our team in Jos North replies within one working day.
          </p>

          <div className="mt-5 space-y-2.5">
            <a href={`tel:${tel}`} className="card flex items-center gap-3.5 p-4 transition-shadow hover:shadow-lift">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint-200 text-forest">
                <PhoneIcon size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">Call us</p>
                <p className="text-[14px] font-bold text-ink">{store.phone}</p>
              </div>
            </a>
            <a href={`mailto:${store.email}`} className="card flex items-center gap-3.5 p-4 transition-shadow hover:shadow-lift">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint-200 text-forest">
                <MailIcon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">Email us</p>
                <p className="break-all text-[13.5px] font-bold text-ink">{store.email}</p>
              </div>
            </a>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-3.5 p-4 transition-shadow hover:shadow-lift"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald text-white">
                <WhatsappIcon size={18} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">WhatsApp</p>
                <p className="text-[14px] font-bold text-ink">Chat with the store</p>
              </div>
            </a>

            <div className="card p-4">
              <div className="flex items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint-200 text-forest">
                  <PinIcon size={18} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">Visit the store</p>
                  <p className="mt-0.5 text-[13.5px] font-bold text-ink">
                    {store.city}, {store.state}, {store.country}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink/50">Landmark: {store.landmark}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink/45">
                    <ClockIcon size={13} /> {store.hours}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-mint-50 px-3 py-2.5 text-[11px] leading-relaxed text-ink/50">
                Please call ahead before visiting so we can have your sizes ready. A map will appear here once verified
                coordinates for the shop are configured in the admin settings — we do not publish invented locations.
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mt-1">
            <Flash message={sp.flash} tone={sp.flashTone} clearHref="/contact" />
          </div>
          <form action="/api/contact" method="post" className="card space-y-3.5 p-5 sm:p-6">
            <h2 className="text-[16px] font-extrabold">Send us a message</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">
                  Your name
                </label>
                <input id="name" name="name" required className="field" placeholder="Full name" />
              </div>
              <div>
                <label htmlFor="phone" className="label">
                  Phone <span className="font-normal text-ink/40">(optional)</span>
                </label>
                <input id="phone" name="phone" type="tel" className="field" placeholder="09034422971" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input id="email" name="email" type="email" required className="field" placeholder="you@email.com" />
            </div>
            <div>
              <label htmlFor="subject" className="label">
                Subject
              </label>
              <select id="subject" name="subject" required className="field">
                <option value="">Choose a topic…</option>
                <option>Product or sizing question</option>
                <option>Delivery question</option>
                <option>Return or exchange</option>
                <option>Order status</option>
                <option>Wholesale or bulk order</option>
                <option>Something else</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                rows={5}
                className="field resize-y"
                placeholder="Tell us how we can help…"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3.5">
              Send message
            </button>
            <p className="text-[10.5px] leading-relaxed text-ink/40">
              Messages are saved to our support inbox. We never share your details with third parties.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
