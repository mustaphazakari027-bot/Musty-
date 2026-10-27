import Image from 'next/image';
import Link from 'next/link';
import { HeartIcon, PlusIcon } from '@/components/Icons';
import { Badge, Price, Stars } from '@/components/ui';
import type { Product } from '@/lib/catalog';

export function ColorDots({ colors, max = 4 }: { colors: Product['colors']; max?: number }) {
  return (
    <span className="flex items-center gap-1.5" aria-label={`${colors.length} colours available`}>
      {colors.slice(0, max).map((c) => (
        <span
          key={c.slug}
          title={c.name}
          className="h-3.5 w-3.5 rounded-full border border-black/10 ring-1 ring-white"
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </span>
  );
}

export function ProductCard({
  product,
  wishlisted = false,
  priority = false,
}: {
  product: Product;
  wishlisted?: boolean;
  priority?: boolean;
}) {
  const soldOut = product.stockTotal === 0;
  const availableSizes = product.sizes.filter((s) => s.stock > 0).map((s) => s.label);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[26px] border border-line/80 bg-white p-2.5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift focus-within:-translate-y-1">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-mint-300 via-mint-200 to-mint-100 ring-1 ring-inset ring-forest/5">
        <Link href={`/product/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={product.images[0] || '/images/products/ultra-run-pro-1.webp'}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-col items-start gap-1.5">
            {product.badge && <Badge tone="white">{product.badge}</Badge>}
            {soldOut && <Badge tone="forest">Sold out</Badge>}
          </div>
          <form action="/api/wishlist/toggle" method="post" className="pointer-events-auto">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="next" value={`/product/${product.slug}`} />
            <button
              type="submit"
              aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              aria-pressed={wishlisted}
              className={`grid h-9 w-9 place-items-center rounded-full border shadow-sm backdrop-blur transition-colors ${
                wishlisted
                  ? 'border-emerald/20 bg-emerald text-white'
                  : 'border-black/5 bg-white/95 text-forest hover:bg-white'
              }`}
            >
              <HeartIcon size={17} />
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald">{product.categoryName}</p>
        <h3 className="mt-1 text-[15px] font-bold leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="rounded hover:text-forest">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-[11.5px] text-ink/45">{product.subtitle}</p>

        <div className="mt-1.5 flex items-center gap-1.5">
          {product.reviewCount > 0 ? (
            <>
              <Stars rating={product.rating} size={12} />
              <span className="text-[11px] text-ink/40">({product.reviewCount})</span>
            </>
          ) : (
            <span className="text-[11px] text-ink/35">New in</span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <Price priceKobo={product.priceKobo} compareAtKobo={product.compareAtKobo} size="sm" />
            <div className="mt-1.5 flex items-center gap-2">
              <ColorDots colors={product.colors} max={3} />
              <span className="text-[10.5px] text-ink/35">
                {availableSizes.length > 0 ? `Sizes ${availableSizes[0]}–${availableSizes[availableSizes.length - 1]}` : 'Out of stock'}
              </span>
            </div>
          </div>
          <Link
            href={`/product/${product.slug}`}
            aria-label={`Choose size and colour for ${product.name}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-white shadow-card transition-transform hover:scale-105 hover:bg-forest-800"
          >
            <PlusIcon size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
