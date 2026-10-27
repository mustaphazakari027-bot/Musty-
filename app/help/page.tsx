import type { Metadata } from 'next';
import Link from 'next/link';
import { Faq } from '@/components/home/Faq';
import { getAllSizes } from '@/lib/catalog';
import { getStoreInfo } from '@/lib/settings';
import { formatNaira } from '@/lib/pricing.mjs';
import { getDeliveryZones } from '@/lib/catalog';
import { ArrowRightIcon, MailIcon, PhoneIcon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Help — delivery, returns, sizing and policies',
  description:
    'Zakson delivery fees and times, 7-day returns, size guide and store policies. Support from our Jos North store.',
  alternates: { canonical: '/help' },
};

const SECTIONS = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'returns', label: 'Returns' },
  { id: 'size-guide', label: 'Size guide' },
  { id: 'faq', label: 'FAQs' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
];

export default async function HelpPage() {
  const store = getStoreInfo();
  const zones = getDeliveryZones();
  const sizes = getAllSizes();

  return (
    <div className="shell py-6 sm:py-10">
      <p className="eyebrow">Customer care</p>
      <h1 className="mt-2 text-[30px] font-extrabold leading-[1.05] sm:text-[42px]">Help centre</h1>
      <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink/55">
        Everything about delivery, returns, sizing and payments. Still stuck? Call {store.phone} — a real person in
        Jos North answers.
      </p>

      <nav className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Help sections">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip shrink-0 bg-white px-3.5 py-2">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.4fr_.6fr] lg:items-start">
        <div className="space-y-4">
          <section id="delivery" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold">Delivery</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              Orders are packed at our {store.city} location and dispatched Monday to Saturday. Orders placed before 2pm
              in Jos North are usually delivered the same day. Delivery fees are shown at checkout before you pay, and
              delivery is free on orders over {formatNaira(25_000_000)}.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-line">
              <table className="w-full text-left text-[12.5px]">
                <thead className="bg-mint-100 text-[10.5px] uppercase tracking-wide text-forest">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold">Area</th>
                    <th className="px-3.5 py-2.5 font-bold">Fee</th>
                    <th className="px-3.5 py-2.5 font-bold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className="border-t border-line/70">
                      <td className="px-3.5 py-2.5 font-medium text-ink">{z.name}</td>
                      <td className="px-3.5 py-2.5 text-ink/60">{formatNaira(z.fee_kobo)}</td>
                      <td className="px-3.5 py-2.5 text-ink/60">{z.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
              Delivery updates are posted by our team on your order page — we do not claim live GPS tracking. If a
              courier provides live tracking for your area, we will share the link by SMS or email.
            </p>
          </section>

          <section id="returns" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold">Returns & exchanges</h2>
            <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-ink/55">
              <li>• Return unworn shoes in their original box within 7 days of delivery.</li>
              <li>• Try shoes indoors on a clean surface — outdoor wear voids the return.</li>
              <li>• Exchanges for a different size are free within Plateau State; other states pay return courier.</li>
              <li>• Refunds go back to the original payment method within 5–10 working days of inspection.</li>
              <li>• Faulty item? Send a photo to {store.email} and we will arrange a replacement.</li>
            </ul>
            <p className="mt-3 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] text-ink/55">
              Start a return by calling {store.phone} or visiting us at {store.landmark}, {store.city}.
            </p>
          </section>

          <section id="size-guide" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold">Size guide</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              All sizes on Zakson are UK sizes. Measure your foot in centimetres while standing, heel against a wall,
              and match it below. If you are between sizes or run long distances, go half a size up.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {sizes.map((s) => (
                <div key={s.label} className="rounded-xl border border-line bg-white p-2.5 text-center">
                  <p className="text-[13px] font-bold text-forest">UK {s.label}</p>
                  <p className="text-[10.5px] text-ink/45">{(22.5 + Number(s.label) * 0.42).toFixed(1)} cm</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-ink/40">
              Women’s models use a narrower last than men’s — if you normally wear a men’s shoe, size up in women’s
              styles, and vice versa for unisex models.
            </p>
          </section>

          <section id="faq" className="scroll-mt-24">
            <h2 className="mb-3 text-[19px] font-extrabold">Frequently asked questions</h2>
            <Faq />
          </section>

          <section id="privacy" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold">Privacy</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              We collect only what we need to fulfil your order: your name, phone number, email and delivery address. We
              do not store card numbers or CVV codes — payments are handled on our provider’s secure page. Your details
              are never sold. To request a copy or deletion of your data, email {store.email}.
            </p>
          </section>

          <section id="terms" className="card scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-[19px] font-extrabold">Terms of sale</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              Prices are in Nigerian Naira and include VAT where applicable. An order is only confirmed once payment is
              verified. Discounts and promo codes are subject to availability and may be withdrawn. Stock is limited; if
              an item becomes unavailable after payment we will contact you and refund in full. Title passes on delivery.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-3xl bg-forest p-5 text-white">
            <h2 className="text-[16px] font-extrabold">Talk to a human</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
              {store.hours}. We answer calls and WhatsApp messages during store hours.
            </p>
            <a href={`tel:${store.phone}`} className="btn-light mt-4 w-full py-3 text-[13px]">
              <PhoneIcon size={15} /> {store.phone}
            </a>
            <a href={`mailto:${store.email}`} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-[12.5px] font-semibold text-white/80 hover:bg-white/10">
              <MailIcon size={15} /> Email support
            </a>
            <p className="mt-4 text-[11px] leading-relaxed text-white/45">
              {store.landmark}
              <br />
              {store.city}, {store.state}
            </p>
          </div>
          <Link href="/contact" className="card mt-3 flex items-center justify-between p-4 text-[12.5px] font-semibold text-forest">
            Send us a message <ArrowRightIcon size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
