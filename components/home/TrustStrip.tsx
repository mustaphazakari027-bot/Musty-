import { ReturnIcon, ShieldIcon, SparkIcon, TruckIcon } from '@/components/Icons';

const ITEMS = [
  { icon: TruckIcon, title: 'Fast Jos delivery', body: 'Same-day around Terminus & central Jos.' },
  { icon: ShieldIcon, title: 'Verified payments', body: 'Card, transfer and USSD via licensed providers.' },
  { icon: ReturnIcon, title: '7-day size swap', body: 'Unworn pairs, original packaging, no stress.' },
  { icon: SparkIcon, title: 'Fitted by runners', body: 'Real advice on sizing and the right shoe.' },
];

export function TrustStrip() {
  return (
    <section className="shell mt-8 sm:mt-10" aria-label="Why shop with Zakson">
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl border border-line/70 bg-white/70 p-3.5 sm:p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint-200 text-forest">
              <Icon size={17} />
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-ink">{title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
