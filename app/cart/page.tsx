import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCartView } from '@/lib/cart';
import { getDeliveryZones } from '@/lib/catalog';
import { getSetting } from '@/lib/settings';
import { formatNaira, FREE_DELIVERY_THRESHOLD_KOBO } from '@/lib/pricing.mjs';
import { Flash } from '@/components/Flash';
import { EmptyState } from '@/components/ui';
import { BagIcon, CheckIcon, MinusIcon, PlusIcon, ReturnIcon, ShieldIcon, TrashIcon, TruckIcon } from '@/components/Icons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your bag',
  description: 'Review the shoes in your Zakson bag and continue to secure checkout.',
  robots: { index: false, follow: false },
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const cart = await getCartView();
  const zones = getDeliveryZones();
  const threshold = Number(getSetting('free_delivery_threshold_kobo') ?? FREE_DELIVERY_THRESHOLD_KOBO);
  const remaining = Math.max(0, threshold - cart.totals.subtotalKobo);
  const progress = Math.min(100, Math.round((cart.totals.subtotalKobo / threshold) * 100));

  return (
    <div className="shell py-5 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/" className="hover:text-forest">
          Home
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">Bag</span>
      </nav>

      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/cart" />

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight sm:text-[36px]">Your bag</h1>
          <p className="mt-1 text-[13px] text-ink/50">
            {cart.totals.itemCount === 0
              ? 'Nothing here yet.'
              : `${cart.totals.itemCount} item${cart.totals.itemCount === 1 ? '' : 's'} · prices in Naira (₦)`}
          </p>
        </div>
        <Link href="/shop" className="btn-ghost btn-sm sm:px-5 sm:py-3">
          Continue shopping
        </Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Your bag is empty"
            description="Browse our running, training and lifestyle shoes — every pair ships from our Jos North store."
            action={{ href: '/shop', label: 'Start shopping' }}
            icon={<BagIcon size={24} />}
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_.65fr] lg:items-start">
          <div className="space-y-2.5">
            {cart.items.map((item) => (
              <article key={item.id} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-mint-100 sm:h-28 sm:w-28"
                >
                  <Image src={item.image} alt={item.name} fill sizes="120px" className="object-cover" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-emerald">
                        {item.categoryName}
                      </p>
                      <h2 className="truncate text-[14.5px] font-bold text-ink">
                        <Link href={`/product/${item.slug}`} className="hover:text-forest">
                          {item.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink/45">
                        <span
                          className="h-2.5 w-2.5 rounded-full border border-black/10"
                          style={{ backgroundColor: item.colorHex }}
                          aria-hidden
                        />
                        {item.colorName} · Size {item.size}
                      </p>
                    </div>
                    <form action="/api/cart/remove" method="post">
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        aria-label={`Remove ${item.name} from bag`}
                        className="grid h-8 w-8 place-items-center rounded-full text-ink/35 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </form>
                  </div>

                  {!item.inStock && (
                    <p className="mt-1.5 rounded-lg bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                      Only {item.stock} left — reduce the quantity to continue.
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2.5">
                    <form action="/api/cart/update" method="post" className="flex flex-wrap items-center gap-1.5">
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="qty" value={item.qty} />

                      <div className="flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5">
                        <button
                          type="submit"
                          name="qty"
                          value={Math.max(1, item.qty - 1)}
                          aria-label="Decrease quantity"
                          className="grid h-7 w-7 place-items-center rounded-full text-forest hover:bg-mint-100"
                        >
                          <MinusIcon size={13} />
                        </button>
                        <span className="w-6 text-center text-[12.5px] font-bold tabular-nums">{item.qty}</span>
                        <button
                          type="submit"
                          name="qty"
                          value={Math.min(10, item.qty + 1)}
                          aria-label="Increase quantity"
                          className="grid h-7 w-7 place-items-center rounded-full text-forest hover:bg-mint-100"
                        >
                          <PlusIcon size={13} />
                        </button>
                      </div>

                      <label className="sr-only" htmlFor={`size-${item.id}`}>
                        Change size for {item.name}
                      </label>
                      <select
                        id={`size-${item.id}`}
                        name="sizeLabel"
                        defaultValue={item.size}
                        className="rounded-xl border border-line bg-white px-2 py-1.5 text-[11.5px] font-semibold text-forest focus:border-emerald focus:outline-none"
                      >
                        {item.sizeOptions.map((opt) => (
                          <option key={opt.label} value={opt.label} disabled={opt.stock === 0}>
                            Size {opt.label}
                            {opt.stock === 0 ? ' (sold out)' : ''}
                          </option>
                        ))}
                      </select>

                      <label className="sr-only" htmlFor={`color-${item.id}`}>
                        Change colour for {item.name}
                      </label>
                      <select
                        id={`color-${item.id}`}
                        name="colorSlug"
                        defaultValue={item.colorSlug}
                        className="rounded-xl border border-line bg-white px-2 py-1.5 text-[11.5px] font-semibold text-forest focus:border-emerald focus:outline-none"
                      >
                        {item.colorOptions.map((opt) => (
                          <option key={opt.slug} value={opt.slug}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-[11px] font-semibold text-emerald hover:text-forest">
                        Update
                      </button>
                    </form>

                    <div className="text-right">
                      <p className="font-display text-[15px] font-extrabold text-forest">
                        {formatNaira(item.lineTotalKobo)}
                      </p>
                      <p className="text-[10.5px] text-ink/40">{formatNaira(item.unitPriceKobo)} each</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div className="grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: TruckIcon, text: 'Same-day delivery in Jos North' },
                { icon: ReturnIcon, text: '7-day size swap' },
                { icon: ShieldIcon, text: 'Payment verified on our server' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 rounded-2xl bg-white/70 px-3.5 py-3 text-[11.5px] text-ink/55">
                  <Icon size={15} className="shrink-0 text-emerald" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24">
            <div className="card p-5">
              <h2 className="text-[15px] font-extrabold">Order summary</h2>

              <div className="mt-3 rounded-2xl bg-mint-100 p-3">
                <div className="flex items-center justify-between text-[11.5px] font-semibold text-forest">
                  <span className="flex items-center gap-1.5">
                    {remaining === 0 && <CheckIcon size={12} />}
                    {remaining === 0 ? 'Free delivery unlocked' : 'Free delivery progress'}
                  </span>
                  <span>{remaining === 0 ? 'Free' : `${formatNaira(remaining)} to go`}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1.5 text-[10.5px] text-ink/45">
                  Applies to orders over {formatNaira(threshold)}.
                </p>
              </div>

              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-ink/55">Subtotal</dt>
                  <dd className="font-semibold text-ink">{formatNaira(cart.totals.subtotalKobo)}</dd>
                </div>
                {cart.totals.discountKobo > 0 && (
                  <div className="flex justify-between text-emerald">
                    <dt>Discount ({cart.couponCode})</dt>
                    <dd className="font-semibold">−{formatNaira(cart.totals.discountKobo)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink/55">Delivery</dt>
                  <dd className="text-right text-[11.5px] font-medium text-ink/50">
                    from {formatNaira(Math.min(...zones.map((z) => z.fee_kobo)))}
                    <br />
                    calculated at checkout
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-[15px]">
                  <dt className="font-bold text-ink">Total</dt>
                  <dd className="font-display font-extrabold text-forest">
                    {formatNaira(cart.totals.subtotalKobo - cart.totals.discountKobo)}
                    <span className="ml-1 text-[10.5px] font-medium text-ink/40">+ delivery</span>
                  </dd>
                </div>
              </dl>

              {cart.couponCode ? (
                <form action="/api/cart/coupon" method="post" className="mt-4">
                  <input type="hidden" name="remove" value="1" />
                  <div className="flex items-center justify-between rounded-xl bg-emerald/10 px-3 py-2.5">
                    <span className="text-[12px] font-bold text-emerald">{cart.couponCode} applied</span>
                    <button type="submit" className="text-[11px] font-semibold text-forest underline">
                      Remove
                    </button>
                  </div>
                </form>
              ) : (
                <form action="/api/cart/coupon" method="post" className="mt-4">
                  <label htmlFor="promo" className="label text-[11.5px]">
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo"
                      name="code"
                      placeholder="ZAKSON10"
                      className="field px-3 py-2.5 text-[12.5px] uppercase"
                      autoComplete="off"
                    />
                    <button type="submit" className="btn-ghost shrink-0 px-4 py-2.5 text-[12.5px]">
                      Apply
                    </button>
                  </div>
                </form>
              )}

              <Link href="/checkout" className="btn-primary mt-4 w-full py-4 text-[14.5px]">
                Proceed to checkout
              </Link>
              <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-ink/40">
                Prices, stock and promo codes are verified on our server before you pay.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
