'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckIcon, ShieldIcon, TruckIcon } from '@/components/Icons';
import { formatNaira } from '@/lib/pricing.mjs';

type Zone = { id: number; name: string; state: string; fee_kobo: number; eta: string };
type Item = { id: number; name: string; size: string; colorName: string; qty: number; lineTotalKobo: number; image: string };

type Props = {
  items: Item[];
  subtotalKobo: number;
  discountKobo: number;
  couponCode: string | null;
  zones: Zone[];
  provider: 'paystack' | 'flutterwave' | 'demo';
  live: boolean;
  prefill: { fullName: string; email: string; phone: string; address: string; state: string; city: string; landmark: string };
  states: string[];
};

export function CheckoutClient({
  items,
  subtotalKobo,
  discountKobo,
  couponCode,
  zones,
  provider,
  live,
  prefill,
  states,
}: Props) {
  const [zoneId, setZoneId] = useState<number>(zones[0]?.id ?? 0);
  const zone = zones.find((z) => z.id === zoneId) ?? zones[0];

  const { deliveryKobo, totalKobo } = useMemo(() => {
    const due = Math.max(0, subtotalKobo - discountKobo);
    const fee = due >= 25_000_000 ? 0 : zone?.fee_kobo ?? 0;
    return { deliveryKobo: fee, totalKobo: due + fee };
  }, [subtotalKobo, discountKobo, zone]);

  return (
    <form action="/api/checkout" method="post" className="grid gap-4 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
      <div className="space-y-3.5">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold">1. Your details</h2>
            <span className="text-[11px] text-ink/40">We only use these to deliver your order</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="label">
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                required
                minLength={2}
                autoComplete="name"
                defaultValue={prefill.fullName}
                className="field"
                placeholder="Mustapha Zakari"
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                defaultValue={prefill.phone}
                className="field"
                placeholder="09034422971"
              />
              <p className="hint">Nigerian number — used for delivery calls.</p>
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                required
                type="email"
                autoComplete="email"
                defaultValue={prefill.email}
                className="field"
                placeholder="you@email.com"
              />
              <p className="hint">Your order receipt is sent here.</p>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold">2. Delivery address</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="address" className="label">
                Street address
              </label>
              <input
                id="address"
                name="address"
                required
                minLength={6}
                autoComplete="street-address"
                defaultValue={prefill.address}
                className="field"
                placeholder="House / flat, street, area"
              />
            </div>
            <div>
              <label htmlFor="state" className="label">
                State
              </label>
              <select id="state" name="state" required defaultValue={prefill.state || 'Plateau'} className="field">
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="label">
                City / town
              </label>
              <input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={prefill.city}
                className="field"
                placeholder="Jos"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="landmark" className="label">
                Landmark <span className="font-normal text-ink/40">(helps our rider find you)</span>
              </label>
              <input
                id="landmark"
                name="landmark"
                defaultValue={prefill.landmark}
                className="field"
                placeholder="e.g. near Terminus Market Overhead Bridge"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="instructions" className="label">
                Delivery instructions <span className="font-normal text-ink/40">(optional)</span>
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={2}
                className="field resize-y"
                placeholder="Call when you arrive at the junction…"
              />
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold">3. Delivery area</h2>
          <p className="mt-1 text-[11.5px] text-ink/45">Fees are set by the store and confirmed on our server.</p>
          <div className="mt-3 space-y-2">
            {zones.map((z) => (
              <label
                key={z.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-colors ${
                  zoneId === z.id ? 'border-forest bg-mint-50' : 'border-line hover:border-forest/25'
                }`}
              >
                <span className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="zoneId"
                    value={z.id}
                    checked={zoneId === z.id}
                    onChange={() => setZoneId(z.id)}
                    className="mt-1 accent-emerald"
                  />
                  <span>
                    <span className="block text-[12.5px] font-bold text-ink">{z.name}</span>
                    <span className="block text-[11px] text-ink/45">{z.eta}</span>
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-bold text-forest">{formatNaira(z.fee_kobo)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-extrabold">4. Payment</h2>
          <div className="mt-3 rounded-2xl border border-line bg-mint-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white">
                  <ShieldIcon size={17} />
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-ink">
                    {provider === 'paystack'
                      ? 'Paystack — card, transfer, USSD'
                      : provider === 'flutterwave'
                        ? 'Flutterwave — card, transfer, USSD'
                        : 'Simulated payment (demo mode)'}
                  </p>
                  <p className="text-[11px] text-ink/45">
                    {live
                      ? 'You will be redirected to the provider’s secure page. Card details never touch our servers.'
                      : 'No payment keys are configured yet, so this store cannot take real money.'}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  live ? 'bg-emerald/12 text-emerald' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {live ? 'Live' : 'Demo'}
              </span>
            </div>
            {!live && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                To accept real orders, add <code className="font-mono">PAYSTACK_SECRET_KEY</code> or{' '}
                <code className="font-mono">FLUTTERWAVE_SECRET_KEY</code> to the server environment. Until then you can
                test the full paid / failed flow on the simulated gateway page.
              </p>
            )}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-ink/40">
            By placing this order you agree to our{' '}
            <Link href="/help#terms" className="underline hover:text-forest">
              terms
            </Link>{' '}
            and{' '}
            <Link href="/help#returns" className="underline hover:text-forest">
              returns policy
            </Link>
            . Your order is only confirmed once payment is verified.
          </p>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <div className="card p-5">
          <h2 className="text-[15px] font-extrabold">Order summary</h2>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="h-12 w-12 rounded-xl bg-mint-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{item.name}</p>
                  <p className="text-[10.5px] text-ink/45">
                    {item.colorName} · Size {item.size} · ×{item.qty}
                  </p>
                </div>
                <span className="text-[12px] font-semibold text-ink">{formatNaira(item.lineTotalKobo)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-line pt-3 text-[12.5px]">
            <div className="flex justify-between">
              <dt className="text-ink/55">Subtotal</dt>
              <dd className="font-semibold">{formatNaira(subtotalKobo)}</dd>
            </div>
            {discountKobo > 0 && (
              <div className="flex justify-between text-emerald">
                <dt>Discount {couponCode ? `(${couponCode})` : ''}</dt>
                <dd className="font-semibold">−{formatNaira(discountKobo)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="flex items-center gap-1 text-ink/55">
                <TruckIcon size={13} /> Delivery
              </dt>
              <dd className="font-semibold">
                {deliveryKobo === 0 ? <span className="text-emerald">Free</span> : formatNaira(deliveryKobo)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-3">
              <dt className="text-[14px] font-bold">Total</dt>
              <dd className="font-display text-[20px] font-extrabold text-forest">{formatNaira(totalKobo)}</dd>
            </div>
          </dl>

          <button type="submit" className="btn-primary mt-4 w-full py-4 text-[14.5px]">
            Place order & pay {formatNaira(totalKobo)}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-ink/40">
            <CheckIcon size={12} className="text-emerald" /> Stock and prices re-checked before payment
          </p>
          <Link href="/cart" className="mt-3 block text-center text-[11.5px] font-semibold text-forest hover:text-emerald">
            Back to bag
          </Link>
        </div>
      </aside>
    </form>
  );
}
