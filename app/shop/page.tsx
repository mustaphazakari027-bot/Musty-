import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSizes, getCategories, getColors, queryProducts } from '@/lib/catalog';
import { getWishlistProductIds } from '@/lib/wishlist';
import { ProductCard } from '@/components/ProductCard';
import { FilterPanel } from '@/components/shop/FilterPanel';
import { EmptyState } from '@/components/ui';
import { BagIcon, SearchIcon } from '@/components/Icons';
import { nairaToKobo } from '@/lib/pricing.mjs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop running, training & lifestyle shoes',
  description:
    'Browse every Zakson shoe — running shoes, trail shoes, training shoes and lifestyle sneakers. Filter by size, colour and price. Delivered across Nigeria.',
  alternates: { canonical: '/shop' },
};

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS = [
  { value: 'featured', label: 'Recommended' },
  { value: 'popular', label: 'Popularity' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Best rated' },
];

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const sort = typeof sp.sort === 'string' ? sp.sort : 'featured';
  const gender = toArray(sp.gender);
  const category = toArray(sp.category);
  const size = toArray(sp.size);
  const color = toArray(sp.color);
  const rating = toArray(sp.rating)[0];
  const inStock = toArray(sp.inStock).includes('1');
  const offersOnly = toArray(sp.offers).includes('1');
  const minPrice = typeof sp.minPrice === 'string' && sp.minPrice ? nairaToKobo(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === 'string' && sp.maxPrice ? nairaToKobo(sp.maxPrice) : undefined;

  let products = queryProducts({
    q: q || undefined,
    gender,
    category,
    size,
    color,
    rating: rating ? Number(rating) : undefined,
    inStock,
    minPrice,
    maxPrice,
    sort,
  });

  if (offersOnly) products = products.filter((p) => p.compareAtKobo && p.compareAtKobo > p.priceKobo);

  const wishlist = await getWishlistProductIds();
  const categories = getCategories();
  const colors = getColors();
  const sizes = getAllSizes();

  const current: Record<string, string[]> = {
    gender,
    category,
    size,
    color,
    rating: rating ? [rating] : [],
    inStock: inStock ? ['1'] : [],
    offers: offersOnly ? ['1'] : [],
  };
  const activeCount =
    gender.length + category.length + size.length + color.length + (rating ? 1 : 0) + (inStock ? 1 : 0) + (offersOnly ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const heading = q
    ? `Results for “${q}”`
    : offersOnly
      ? 'Genuine offers'
      : category.length === 1
        ? categories.find((c) => c.slug === category[0])?.name ?? 'Shop'
        : gender.length === 1
          ? `${gender[0] === 'men' ? "Men's" : gender[0] === 'women' ? "Women's" : 'Unisex'} shoes`
          : 'All shoes';

  return (
    <div className="shell py-5 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/" className="hover:text-forest">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">Shop</span>
      </nav>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Zakson catalogue</p>
          <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight sm:text-[38px]">{heading}</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink/50">
            {products.length} shoe{products.length === 1 ? '' : 's'} available. Every pair is inspected in Jos before
            it ships.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form action="/shop" method="get" role="search" className="flex items-center gap-2">
            {gender.map((g) => (
              <input key={g} type="hidden" name="gender" value={g} />
            ))}
            {category.map((c) => (
              <input key={c} type="hidden" name="category" value={c} />
            ))}
            <label htmlFor="shop-search" className="sr-only">
              Search shoes
            </label>
            <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-3.5">
              <SearchIcon size={16} className="text-ink/40" />
              <input
                id="shop-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search shoes"
                className="w-32 bg-transparent text-[13px] outline-none placeholder:text-ink/35 sm:w-40"
              />
            </div>
            <button type="submit" className="btn-ghost btn-sm h-11 px-4">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-line/70 bg-white px-3.5 py-2.5">
        <p className="text-[11.5px] font-medium text-ink/50">
          {activeCount > 0 ? `${activeCount} filter${activeCount === 1 ? '' : 's'} active` : 'No filters applied'}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-[11.5px] font-semibold text-ink/50">
            Sort
          </label>
          <form action="/shop" method="get" id="sort-form">
            {Object.entries(sp).map(([key, value]) => {
              if (key === 'sort') return null;
              return toArray(value).map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />);
            })}
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              form="sort-form"
              className="rounded-xl border border-line bg-white px-3 py-2 text-[12px] font-semibold text-forest focus:border-emerald focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <noscript>
              <button type="submit" className="btn-ghost btn-sm ml-2">
                Apply
              </button>
            </noscript>
          </form>
          <button
            type="submit"
            form="sort-form"
            className="rounded-xl bg-forest px-3 py-2 text-[12px] font-semibold text-white hover:bg-forest-800"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[268px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-24">
          <details className="lg:hidden">
            <summary className="card flex cursor-pointer items-center justify-between px-4 py-3.5 text-[13px] font-bold text-ink">
              Filters & sorting
              <span className="text-emerald">Open</span>
            </summary>
            <div className="mt-3">
              <FilterPanel
                categories={categories}
                colors={colors}
                sizes={sizes}
                current={current}
                minPrice={sp.minPrice as string | undefined}
                maxPrice={sp.maxPrice as string | undefined}
                sort={sort}
                q={q}
                resultCount={products.length}
                activeCount={activeCount}
                clearHref="/shop"
              />
            </div>
          </details>
          <div className="hidden lg:block">
            <FilterPanel
              categories={categories}
              colors={colors}
              sizes={sizes}
              current={current}
              minPrice={sp.minPrice as string | undefined}
              maxPrice={sp.maxPrice as string | undefined}
              sort={sort}
              q={q}
              resultCount={products.length}
              activeCount={activeCount}
              clearHref="/shop"
            />
          </div>
        </aside>

        <div>
          {products.length === 0 ? (
            <EmptyState
              title="No shoes match those filters"
              description="Try widening your price range, choosing a different size, or clearing the filters to see the full collection."
              action={{ href: '/shop', label: 'Clear filters' }}
              icon={<BagIcon size={24} />}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} wishlisted={wishlist.has(product.id)} priority={i < 3} />
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-ink/35">
            Showing all {products.length} pairs in this view. Need something else?{' '}
            <Link href="/contact" className="font-semibold text-forest underline">
              Ask our team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
