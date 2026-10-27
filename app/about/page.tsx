import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getStoreInfo } from '@/lib/settings';
import { ArrowRightIcon, CheckIcon, PinIcon, RunIcon, SparkIcon, TruckIcon } from '@/components/Icons';

export const metadata: Metadata = {
  title: 'About Zakson — premium footwear from Jos, Nigeria',
  description:
    'Zakson is a premium sports footwear store in Jos North, Plateau State, founded by Musty Zakari. Real shoes, honest advice and delivery across Nigeria.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const store = getStoreInfo();

  return (
    <div className="shell py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <p className="eyebrow">Our story</p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-[1.03] sm:text-[46px]">
            Built in Jos.
            <br />
            <span className="text-emerald">Built for movement.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink/60">
            Zakson started with a simple frustration: it was too hard to find genuine performance running shoes in
            Plateau State without guessing your size online or paying inflated prices. So we opened in {store.city}, a
            short walk from the {store.landmark}, and started fitting runners properly.
          </p>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink/60">
            Every pair we sell is inspected before it leaves the shop. We stock shoes that make sense on Nigerian roads
            and trails — cushioned enough for long distances, grippy in the rainy season, and honest about their price.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/shop" className="btn-primary">
              Shop the collection <ArrowRightIcon size={16} />
            </Link>
            <Link href="/contact" className="btn-ghost">
              Visit the store
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-mint-200 sm:rounded-[36px]">
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/products/cloudtrail-1.webp"
              alt="Zakson trail shoe"
              fill
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-4 rounded-2xl bg-white/92 px-4 py-3 shadow-card backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald">Founded by</p>
            <p className="text-[13px] font-bold text-ink">{store.owner}</p>
            <p className="text-[11px] text-ink/50">{store.city}, {store.state}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { icon: CheckIcon, title: 'Genuine stock only', body: 'Sourced from authorised suppliers, checked by hand.' },
          { icon: RunIcon, title: 'Fitted by runners', body: 'We run in what we sell — ask us anything.' },
          { icon: TruckIcon, title: 'Delivery across Nigeria', body: 'Same-day in Jos North, tracked courier elsewhere.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-200 text-forest">
              <Icon size={18} />
            </span>
            <h2 className="mt-3 text-[15px] font-extrabold">{title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/55">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] bg-forest p-6 text-white sm:p-10">
        <div className="grid gap-6 sm:grid-cols-[1.2fr_.8fr] sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-mint-200">
              <SparkIcon size={14} /> Come and try a pair
            </p>
            <h2 className="mt-2 text-[24px] font-extrabold sm:text-[30px]">Find us at {store.landmark}</h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/65">
              {store.city}, {store.state}, {store.country}. Open {store.hours}. Call ahead and we will have your sizes
              ready to try.
            </p>
          </div>
          <div className="space-y-2">
            <a href={`tel:${store.phone}`} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-[13px] font-semibold">
              Call {store.phone} <ArrowRightIcon size={15} />
            </a>
            <a href={`mailto:${store.email}`} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-[12.5px] font-semibold">
              <span className="truncate">{store.email}</span> <ArrowRightIcon size={15} />
            </a>
            <p className="flex items-center gap-2 px-1 text-[11px] text-white/45">
              <PinIcon size={13} /> {store.city}, {store.state}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
