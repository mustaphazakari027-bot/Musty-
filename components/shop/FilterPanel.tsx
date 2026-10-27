import Link from 'next/link';
import { ChevronDownIcon, FilterIcon } from '@/components/Icons';
import type { getCategories, getColors, getAllSizes } from '@/lib/catalog';
import { formatNaira } from '@/lib/pricing.mjs';

type Props = {
  categories: ReturnType<typeof getCategories>;
  colors: ReturnType<typeof getColors>;
  sizes: ReturnType<typeof getAllSizes>;
  current: Record<string, string[]>;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  q?: string;
  resultCount: number;
  activeCount: number;
  clearHref: string;
};

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-line/80 py-3.5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] font-bold text-ink">
        {title}
        <ChevronDownIcon size={15} className="text-ink/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

const checkboxClass =
  'h-4 w-4 shrink-0 rounded border-line text-emerald accent-emerald focus:ring-emerald';

export function FilterPanel({
  categories,
  colors,
  sizes,
  current,
  minPrice,
  maxPrice,
  sort,
  q,
  resultCount,
  activeCount,
  clearHref,
}: Props) {
  const isChecked = (name: string, value: string) => (current[name] ?? []).includes(value);

  return (
    <form action="/shop" method="get" className="card overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between pb-1">
        <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink">
          <FilterIcon size={16} className="text-emerald" />
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <Link href={clearHref} className="text-[11.5px] font-semibold text-emerald hover:text-forest">
            Clear all
          </Link>
        )}
      </div>

      {/* preserve search & sort */}
      {q && <input type="hidden" name="q" value={q} />}
      {sort && <input type="hidden" name="sort" value={sort} />}

      <FilterGroup title="Category">
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2.5 text-[12.5px] text-ink/70">
              <input
                type="checkbox"
                name="category"
                value={c.slug}
                defaultChecked={isChecked('category', c.slug)}
                className={checkboxClass}
              />
              {c.name}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Who it's for">
        <div className="space-y-2">
          {[
            ['men', "Men's"],
            ['women', "Women's"],
            ['unisex', 'Unisex'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2.5 text-[12.5px] text-ink/70">
              <input
                type="checkbox"
                name="gender"
                value={value}
                defaultChecked={isChecked('gender', value)}
                className={checkboxClass}
              />
              {label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Size (UK)">
        <div className="grid grid-cols-5 gap-1.5">
          {sizes.map((s) => (
            <label key={s.label} className="relative">
              <input
                type="checkbox"
                name="size"
                value={s.label}
                defaultChecked={isChecked('size', s.label)}
                className="peer sr-only"
              />
              <span className="flex h-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-[11.5px] font-semibold text-ink/70 peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <label key={c.slug} className="relative" title={c.name}>
              <input
                type="checkbox"
                name="color"
                value={c.slug}
                defaultChecked={isChecked('color', c.slug)}
                className="peer sr-only"
                aria-label={c.name}
              />
              <span
                className="block h-7 w-7 cursor-pointer rounded-full border border-black/10 ring-offset-2 peer-checked:ring-2 peer-checked:ring-forest"
                style={{ backgroundColor: c.hex }}
              />
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price (₦)">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="minPrice">
            Minimum price
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="0"
            defaultValue={minPrice}
            className="field px-3 py-2.5 text-[12.5px]"
          />
          <span className="text-ink/30">–</span>
          <label className="sr-only" htmlFor="maxPrice">
            Maximum price
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            placeholder="250000"
            defaultValue={maxPrice}
            className="field px-3 py-2.5 text-[12.5px]"
          />
        </div>
        <p className="mt-2 text-[10.5px] text-ink/40">
          Our shoes range from {formatNaira(8_999_000)} to {formatNaira(22_999_000)}.
        </p>
      </FilterGroup>

      <FilterGroup title="Availability & rating">
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-[12.5px] text-ink/70">
            <input
              type="checkbox"
              name="inStock"
              value="1"
              defaultChecked={(current.inStock ?? []).includes('1')}
              className={checkboxClass}
            />
            In stock only
          </label>
          <label className="flex items-center gap-2.5 text-[12.5px] text-ink/70">
            <input
              type="checkbox"
              name="offers"
              value="1"
              defaultChecked={(current.offers ?? []).includes('1')}
              className={checkboxClass}
            />
            Discounted only
          </label>
          <label className="mt-1 block text-[11px] font-semibold text-ink/50" htmlFor="rating">
            Minimum rating
          </label>
          <select
            id="rating"
            name="rating"
            defaultValue={(current.rating ?? [])[0] ?? ''}
            className="field px-3 py-2.5 text-[12.5px]"
          >
            <option value="">Any rating</option>
            <option value="4">4★ & above</option>
            <option value="3">3★ & above</option>
          </select>
        </div>
      </FilterGroup>

      <button type="submit" className="btn-primary mt-4 w-full py-3.5">
        Show {resultCount} result{resultCount === 1 ? '' : 's'}
      </button>
    </form>
  );
}
