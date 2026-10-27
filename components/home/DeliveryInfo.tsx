import Link from 'next/link';
import { ArrowRightIcon, PinIcon, ReturnIcon, TruckIcon } from '@/components/Icons';
import { formatNaira } from '@/lib/pricing.mjs';
import { getDeliveryZones } from '@/lib/catalog';

export function DeliveryInfo() {
  const zones = getDeliveryZones().slice(0, 3);

  return (
    <section className="shell mt-12 sm:mt-16">
      <div className="grid gap-3.5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[28px] bg-forest p-6 text-white sm:rounded-[36px] sm:p-9">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <TruckIcon size={20} className="text-emerald" />
          </span>
          <h2 className="mt-4 text-[24px] font-extrabold leading-tight sm:text-[30px]">
            Delivery built for Jos — and for all of Nigeria
          </h2>
          <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/65">
            Orders placed before 2pm around Jos North are usually delivered the same day. Everywhere else ships with a
            tracked courier. Delivery fees are shown at checkout before you pay.
          </p>

          <ul className="mt-5 divide-y divide-white/10 rounded-2xl bg-white/5 px-4">
            {zones.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[12.5px] font-semibold text-white">{z.name}</p>
                  <p className="text-[11px] text-white/45">{z.eta}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald/15 px-2.5 py-1 text-[11.5px] font-bold text-mint-200">
                  {formatNaira(z.fee_kobo)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-white/40">
            Free delivery on orders over {formatNaira(25_000_000)}. Other states are quoted live at checkout.
          </p>
        </div>

        <div className="grid gap-3.5">
          <div className="rounded-[28px] border border-line/70 bg-white p-6 sm:rounded-[36px] sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-200 text-forest">
              <ReturnIcon size={20} />
            </span>
            <h3 className="mt-4 text-[19px] font-extrabold">7-day returns & size swaps</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              Not the right fit? Return unworn pairs in their original box within 7 days of delivery for a swap or
              refund. Visit our store at the Terminus Market Overhead Bridge or request a pickup.
            </p>
            <Link
              href="/help#returns"
              className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald hover:text-forest"
            >
              Read the full policy <ArrowRightIcon size={13} />
            </Link>
          </div>

          <div className="rounded-[28px] border border-line/70 bg-mint-100 p-6 sm:rounded-[36px] sm:p-8">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-forest">
              <PinIcon size={20} />
            </span>
            <h3 className="mt-4 text-[19px] font-extrabold">Try before you buy</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              Prefer to feel the shoe first? Call 09034422971 to arrange a fitting in Jos North — we will have your
              sizes ready.
            </p>
            <a
              href="tel:09034422971"
              className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald hover:text-forest"
            >
              Call the store <ArrowRightIcon size={13} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
