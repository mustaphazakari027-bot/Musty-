import { NewsletterForm } from '@/components/NewsletterForm';
import { SparkIcon } from '@/components/Icons';

export function NewsletterCta() {
  return (
    <section className="shell mt-12 sm:mt-16">
      <div className="relative overflow-hidden rounded-[28px] bg-emerald px-6 py-9 text-white sm:rounded-[36px] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative grid gap-6 sm:grid-cols-[1.15fr_.85fr] sm:items-center">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              <SparkIcon size={13} /> The Zakson list
            </p>
            <h2 className="mt-2 text-[26px] font-extrabold leading-tight sm:text-[32px]">
              First access to new drops in Jos
            </h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-white/75">
              Join our list for restocks, new colourways and genuine offers. We send a few emails a month — nothing
              more.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <NewsletterForm />
            <p className="mt-2 text-[10.5px] leading-relaxed text-white/55">
              By subscribing you agree to receive marketing emails from Zakson. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
