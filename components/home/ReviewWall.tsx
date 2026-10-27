import Link from 'next/link';
import { Stars } from '@/components/ui';
import { getFeaturedReviews } from '@/lib/catalog';

export function ReviewWall() {
  const reviews = getFeaturedReviews(3);
  if (reviews.length === 0) return null;

  return (
    <section className="shell mt-12 sm:mt-16">
      <div className="rounded-[28px] border border-line/70 bg-white p-6 sm:rounded-[36px] sm:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Customer reviews</p>
            <h2 className="mt-1.5 text-[24px] font-extrabold sm:text-[32px]">Loved on the roads of Plateau</h2>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-mint-100 px-4 py-2.5">
            <Stars rating={5} size={15} />
            <span className="text-[12.5px] font-semibold text-forest">Verified buyers</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="flex h-full flex-col rounded-2xl border border-line/70 bg-mint-50/60 p-5">
              <Stars rating={r.rating} size={14} />
              {r.title && <p className="mt-2.5 text-[14px] font-bold text-ink">{r.title}</p>}
              <blockquote className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink/60">“{r.body}”</blockquote>
              <figcaption className="mt-4 border-t border-line/70 pt-3 text-[11.5px] text-ink/45">
                <span className="font-semibold text-forest">{r.author}</span> ·{' '}
                <Link href={`/product/${r.product_slug}`} className="hover:text-forest">
                  {r.product_name}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-ink/40">
          Reviews shown are sample content supplied with the store template. Remove or replace them from the admin
          dashboard once your own verified reviews arrive.
        </p>
      </div>
    </section>
  );
}
