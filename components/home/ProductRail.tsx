import Link from 'next/link';
import { ArrowRightIcon } from '@/components/Icons';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/catalog';

export function ProductRail({
  title,
  eyebrow,
  description,
  href,
  products,
  wishlist,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  href: string;
  products: Product[];
  wishlist: Set<number>;
}) {
  if (products.length === 0) return null;

  return (
    <section className="shell mt-12 sm:mt-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1.5 text-[24px] font-extrabold leading-tight sm:text-[32px]">{title}</h2>
          {description && <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-ink/50">{description}</p>}
        </div>
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-[12.5px] font-semibold text-forest transition-colors hover:border-forest/20 hover:bg-mint-100"
        >
          View all
          <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {products.map((p, i) => (
          <div key={p.id} className="w-[63%] min-w-[63%] shrink-0 snap-start sm:w-[42%] sm:min-w-[42%] lg:w-auto lg:min-w-0">
            <ProductCard product={p} wishlisted={wishlist.has(p.id)} priority={i === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
