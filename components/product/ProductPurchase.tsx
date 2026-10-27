'use client';

import { useMemo, useState } from 'react';
import { BagIcon, CheckIcon, HeartIcon, MinusIcon, PlusIcon, SparkIcon } from '@/components/Icons';
import { Price, Stars } from '@/components/ui';
import type { Product } from '@/lib/catalog';

type Props = {
  product: Product;
  wishlisted: boolean;
  stockByKey: Record<string, number>;
};

export function ProductPurchase({ product, wishlisted, stockByKey }: Props) {
  const colors = product.colors;
  const [color, setColor] = useState(colors[0]?.slug ?? '');
  const [size, setSize] = useState(() => {
    const firstAvailable = product.sizes.find((s) => (stockByKey[`${colors[0]?.slug}/${s.label}`] ?? 0) > 0);
    return firstAvailable?.label ?? '';
  });
  const [qty, setQty] = useState(1);
  const [guideOpen, setGuideOpen] = useState(false);

  const activeColor = colors.find((c) => c.slug === color) ?? colors[0];
  const stock = size ? stockByKey[`${color}/${size}`] ?? 0 : 0;
  const totalStock = useMemo(
    () => product.sizes.reduce((sum, s) => sum + (stockByKey[`${color}/${s.label}`] ?? 0), 0),
    [product.sizes, stockByKey, color],
  );
  const maxQty = Math.max(1, Math.min(10, stock || 1));
  const soldOut = product.stockTotal === 0;

  const common = (
    <>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="colorSlug" value={color} />
      <input type="hidden" name="sizeLabel" value={size} />
      <input type="hidden" name="qty" value={qty} />
      <input type="hidden" name="next" value={`/product/${product.slug}`} />
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-emerald/20 bg-emerald/8 text-emerald">{product.categoryName}</span>
        {product.isNew && <span className="chip">New in</span>}
        {product.isBestSeller && <span className="chip">Best seller</span>}
      </div>

      <h1 className="mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[40px]">
        {product.name}
      </h1>
      <p className="mt-1 text-[13.5px] text-ink/50">{product.subtitle}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Price priceKobo={product.priceKobo} compareAtKobo={product.compareAtKobo} size="lg" />
        {product.reviewCount > 0 && (
          <a href="#reviews" className="flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1.5">
            <Stars rating={product.rating} size={13} />
            <span className="text-[11.5px] font-semibold text-forest">
              {product.rating} ({product.reviewCount})
            </span>
          </a>
        )}
      </div>

      <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-ink/60">{product.description}</p>

      <div className="mt-5 flex items-center gap-2 text-[12px] font-semibold">
        <span className={`h-2 w-2 rounded-full ${totalStock > 0 ? 'bg-emerald' : 'bg-red-500'}`} aria-hidden />
        {totalStock === 0 ? (
          <span className="text-red-600">Sold out in this colourway</span>
        ) : totalStock <= 4 ? (
          <span className="text-amber-600">Only {totalStock} left in {activeColor?.name}</span>
        ) : (
          <span className="text-emerald">In stock · ships from Jos North</span>
        )}
      </div>

      <form action="/api/cart/add" method="post" className="mt-5">
        {common}

        <fieldset>
          <legend className="mb-2 flex w-full items-center justify-between text-[12.5px] font-bold text-ink">
            <span>Select colour</span>
            <span className="font-medium text-ink/45">{activeColor?.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const disabled = product.sizes.every((s) => (stockByKey[`${c.slug}/${s.label}`] ?? 0) === 0);
              return (
                <label
                  key={c.slug}
                  className={`relative cursor-pointer ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                  title={c.name}
                >
                  <input
                    type="radio"
                    name="colorChoice"
                    value={c.slug}
                    checked={color === c.slug}
                    onChange={() => {
                      setColor(c.slug);
                      const first = product.sizes.find((s) => (stockByKey[`${c.slug}/${s.label}`] ?? 0) > 0);
                      setSize(first?.label ?? '');
                      setQty(1);
                    }}
                    className="swatch-input peer sr-only"
                    aria-label={c.name}
                    disabled={disabled}
                  />
                  <span
                    className="swatch relative block h-14 w-14 overflow-hidden rounded-2xl border border-line bg-mint-100"
                    style={{ backgroundColor: c.hex }}
                  >
                    {c.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={c.image} alt="" className="h-full w-full object-cover" style={{ filter: c.filter }} />
                    )}
                    {color === c.slug && (
                      <span className="absolute inset-0 grid place-items-center bg-forest/35">
                        <CheckIcon size={18} className="text-white" />
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="mb-2 flex w-full items-center justify-between text-[12.5px] font-bold text-ink">
            <span>Select size (UK)</span>
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              className="font-semibold text-emerald hover:text-forest"
              aria-expanded={guideOpen}
            >
              Size guide
            </button>
          </legend>

          {guideOpen && (
            <div className="mb-3 overflow-hidden rounded-2xl border border-line bg-mint-50 p-3 text-[11.5px] text-ink/60">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase tracking-wide text-ink/40">
                  <tr>
                    <th className="pb-1.5 font-semibold">UK</th>
                    <th className="pb-1.5 font-semibold">Foot length</th>
                    <th className="pb-1.5 font-semibold">Fit note</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['6', '24.0 cm', 'Snug'],
                    ['7', '25.0 cm', 'True'],
                    ['8', '26.0 cm', 'True'],
                    ['9', '27.0 cm', 'True'],
                    ['10', '28.0 cm', 'Roomy'],
                    ['11', '29.0 cm', 'Roomy'],
                  ].map(([uk, cm, note]) => (
                    <tr key={uk} className="border-t border-line/70">
                      <td className="py-1 font-semibold text-ink">{uk}</td>
                      <td>{cm}</td>
                      <td>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10.5px] text-ink/45">
                Measure heel to longest toe while standing. Half sizes exist between these values.
              </p>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {product.sizes.map((s) => {
              const available = (stockByKey[`${color}/${s.label}`] ?? 0) > 0;
              return (
                <label key={s.label} className="relative">
                  <input
                    type="radio"
                    name="sizeChoice"
                    value={s.label}
                    checked={size === s.label}
                    onChange={() => {
                      setSize(s.label);
                      setQty(1);
                    }}
                    disabled={!available}
                    className="size-input peer sr-only"
                    aria-label={`UK size ${s.label}${available ? '' : ' — sold out'}`}
                  />
                  <span className="size-pill flex h-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white text-[12.5px] font-semibold text-ink transition-colors hover:border-forest/30">
                    {s.label}
                  </span>
                </label>
              );
            })}
          </div>
          {!size && <p className="mt-2 text-[11.5px] font-medium text-red-600">Choose a size to continue.</p>}
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-9 w-9 place-items-center rounded-full text-forest hover:bg-mint-100"
              aria-label="Decrease quantity"
            >
              <MinusIcon size={15} />
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              className="grid h-9 w-9 place-items-center rounded-full text-forest hover:bg-mint-100"
              aria-label="Increase quantity"
            >
              <PlusIcon size={15} />
            </button>
          </div>

          <button
            type="submit"
            disabled={soldOut || !size || stock === 0}
            className="btn-primary min-w-[180px] flex-1 px-6 py-4 text-[14.5px]"
          >
            <BagIcon size={18} />
            Add to Cart
          </button>

          <button
            type="submit"
            formAction="/api/cart/buy-now"
            disabled={soldOut || !size || stock === 0}
            className="btn-emerald px-6 py-4 text-[14.5px]"
          >
            <SparkIcon size={17} />
            Buy Now
          </button>
        </div>

        <p className="mt-3 text-[11.5px] text-ink/45">
          {stock > 0 ? `${stock} pair${stock === 1 ? '' : 's'} available in ${activeColor?.name}, size ${size}` : 'Select an available colour and size to continue.'}
        </p>
      </form>

      <form action="/api/wishlist/toggle" method="post" className="mt-4">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="next" value={`/product/${product.slug}`} />
        <button
          type="submit"
          className={`btn-ghost w-full py-3.5 text-[13.5px] ${wishlisted ? 'border-emerald/30 text-emerald' : ''}`}
        >
          <HeartIcon size={17} />
          {wishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
        </button>
      </form>
    </div>
  );
}
