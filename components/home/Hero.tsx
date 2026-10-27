import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, RunIcon, SparkIcon, TruckIcon } from '@/components/Icons';
import { Stars } from '@/components/ui';
import { formatNaira } from '@/lib/pricing.mjs';

export function Hero() {
  return (
    <section className="shell pt-5 sm:pt-7">
      <div className="relative overflow-hidden rounded-[30px] bg-forest text-white shadow-lift sm:rounded-[40px]">
        {/* depth washes */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(110% 90% at 88% 12%, rgba(24,169,120,.55) 0%, rgba(24,169,120,0) 55%), radial-gradient(90% 80% at 6% 100%, rgba(221,245,233,.14) 0%, rgba(6,78,59,0) 60%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] soft-grid" aria-hidden />

        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-4 lg:p-12">
          <div className="reveal max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-mint-200 backdrop-blur">
              <SparkIcon size={13} className="text-emerald" />
              Autumn collection 2026
            </span>

            <h1 className="mt-5 text-[38px] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[54px] lg:text-[62px]">
              Run Better.
              <br />
              <span className="text-mint-200">Be Stronger.</span>
            </h1>

            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/70 sm:text-base">
              Discover premium running shoes designed for comfort, performance, and everyday movement — fitted in Jos
              North and delivered across Nigeria.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link href="/shop" className="btn-emerald group px-6 py-3.5 text-[14px] sm:px-7 sm:py-4 sm:text-[15px]">
                Shop Now
                <ArrowRightIcon size={17} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/shop?sort=newest"
                className="btn border border-white/20 bg-white/5 px-6 py-3.5 text-[14px] text-white backdrop-blur hover:bg-white/12 sm:px-7 sm:py-4 sm:text-[15px]"
              >
                Explore Collection
              </Link>
            </div>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-5 text-white/70">
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-white/40">Delivery</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                  <TruckIcon size={14} className="text-emerald" />
                  Same-day in Jos
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-white/40">Fit help</dt>
                <dd className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                  <RunIcon size={14} className="text-emerald" />
                  Free size swap
                </dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.14em] text-white/40">Reviews</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <Stars rating={5} size={12} />
                  <span className="text-[12px] font-semibold text-white">4.8</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Product window */}
          <div className="relative">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-[26px] bg-gradient-to-br from-mint-300 via-mint-200 to-mint-100 shadow-[0_30px_70px_-30px_rgba(0,0,0,.65)] sm:rounded-[32px]">
              <Image
                src="/images/products/ultra-run-pro-1.webp"
                alt="Zakson Ultra Run Pro running shoe in mint and white"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 520px"
                className="animate-float object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-forest/75 via-forest/10 to-transparent p-3.5 sm:p-4">
                <div className="rounded-2xl bg-white/92 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald">Best seller</p>
                  <p className="mt-0.5 text-[13px] font-bold leading-none text-ink">Ultra Run Pro</p>
                </div>
                <div className="rounded-2xl bg-forest/85 px-3 py-2 text-right backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/50">From</p>
                  <p className="mt-0.5 font-display text-[15px] font-extrabold leading-none text-white">
                    {formatNaira(15_999_000)}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -left-2 top-4 hidden rounded-2xl bg-white px-3.5 py-2.5 shadow-lift sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald">Free delivery</p>
              <p className="text-[11.5px] font-semibold text-ink">Jos orders over ₦250k</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
