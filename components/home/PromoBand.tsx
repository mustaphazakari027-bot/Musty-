import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, SparkIcon } from '@/components/Icons';

export function PromoBand() {
  return (
    <section className="shell mt-12 sm:mt-16">
      <div className="relative overflow-hidden rounded-[28px] bg-mint-200 sm:rounded-[36px]">
        <div className="pointer-events-none absolute inset-0 opacity-40 soft-grid" aria-hidden />
        <div className="relative grid items-center gap-2 sm:grid-cols-2">
          <div className="p-6 sm:p-10 lg:p-12">
            <p className="eyebrow flex items-center gap-1.5">
              <SparkIcon size={13} />
              Movement, matched
            </p>
            <h2 className="mt-2.5 text-[28px] font-extrabold leading-[1.05] sm:text-[40px]">
              Find Your
              <br />
              Perfect Stride
            </h2>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-ink/55 sm:text-sm">
              Explore footwear designed to match your movement and style — cushioned daily trainers for the long road,
              grippy trail shoes for Plateau weekends, and clean sneakers for everything in between.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/shop?category=running-shoes" className="btn-primary px-6 py-3.5">
                Shop running
                <ArrowRightIcon size={16} />
              </Link>
              <Link href="/help#size-guide" className="btn-ghost px-6 py-3.5">
                Size guide
              </Link>
            </div>
            <p className="mt-4 text-[11px] font-medium text-ink/40">
              Only genuine discounts are shown — no permanent “sales”.
            </p>
          </div>

          <div className="relative min-h-[220px] sm:min-h-[340px]">
            <Image
              src="/images/products/pace-elite-1.webp"
              alt="Zakson Pace Elite Carbon racing shoe"
              fill
              sizes="(max-width: 640px) 100vw, 560px"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/92 px-3.5 py-2.5 shadow-card backdrop-blur sm:left-auto sm:right-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald">Race day</p>
              <p className="text-[13px] font-bold text-ink">Pace Elite Carbon</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
