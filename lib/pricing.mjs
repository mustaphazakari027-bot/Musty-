/**
 * Pure pricing / validation helpers.
 * Kept as plain ESM JavaScript so they can be unit-tested with `node --test`
 * and imported by both server code and client components.
 * All money values are integers in kobo (₦1 = 100 kobo) to avoid float drift.
 */

export const FREE_DELIVERY_THRESHOLD_KOBO = 25_000_000; // ₦250,000

/** Format kobo into a Naira string, e.g. 15999000 -> "₦159,990". */
export function formatNaira(kobo, { withDecimals = false } = {}) {
  const value = Number(kobo || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(value);
}

/** Parse a Naira input ("159,990" / "159990.50") into kobo. */
export function nairaToKobo(input) {
  const cleaned = String(input ?? '').replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  return Math.round(Number.parseFloat(cleaned) * 100);
}

/**
 * Apply a coupon to a subtotal.
 * @returns {{ ok: boolean, discount: number, message?: string, coupon?: object }}
 */
export function applyCoupon(subtotalKobo, coupon, now = new Date()) {
  if (!coupon) return { ok: false, discount: 0, message: 'Promo code not found.' };
  if (!coupon.is_active) return { ok: false, discount: 0, message: 'This promo code is no longer active.' };
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { ok: false, discount: 0, message: 'This promo code has expired.' };
  }
  if (coupon.max_uses != null && coupon.uses >= coupon.max_uses) {
    return { ok: false, discount: 0, message: 'This promo code has been fully redeemed.' };
  }
  if (coupon.min_subtotal_kobo && subtotalKobo < coupon.min_subtotal_kobo) {
    return {
      ok: false,
      discount: 0,
      message: `Spend at least ${formatNaira(coupon.min_subtotal_kobo)} to use this code.`,
    };
  }
  const raw =
    coupon.type === 'percent'
      ? Math.round((subtotalKobo * Number(coupon.value)) / 100)
      : Math.round(Number(coupon.value) * 100);
  const discount = Math.max(0, Math.min(raw, subtotalKobo));
  return { ok: true, discount, coupon, message: 'Promo code applied.' };
}

/**
 * Compute cart totals.
 * @param {{ items: {unit_price_kobo:number, qty:number}[], deliveryFeeKobo:number, coupon?: object|null, freeDeliveryThresholdKobo?: number }} input
 */
export function computeTotals({
  items,
  deliveryFeeKobo = 0,
  coupon = null,
  freeDeliveryThresholdKobo = FREE_DELIVERY_THRESHOLD_KOBO,
  now = new Date(),
}) {
  const subtotalKobo = items.reduce((sum, i) => sum + i.unit_price_kobo * i.qty, 0);
  const couponResult = coupon ? applyCoupon(subtotalKobo, coupon, now) : { ok: false, discount: 0 };
  const discountKobo = couponResult.ok ? couponResult.discount : 0;
  const qualifiesFreeDelivery = subtotalKobo >= freeDeliveryThresholdKobo && subtotalKobo > 0;
  const delivery = qualifiesFreeDelivery ? 0 : deliveryFeeKobo;
  const totalKobo = Math.max(0, subtotalKobo - discountKobo) + delivery;
  return {
    subtotalKobo,
    discountKobo,
    deliveryKobo: delivery,
    totalKobo,
    freeDeliveryApplied: qualifiesFreeDelivery,
    couponApplied: couponResult.ok,
    couponMessage: couponResult.message ?? null,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
  };
}

/** Percent-off badge, only when a genuine discount exists. */
export function discountPercent(priceKobo, compareAtKobo) {
  if (!compareAtKobo || compareAtKobo <= priceKobo) return 0;
  return Math.round(((compareAtKobo - priceKobo) / compareAtKobo) * 100);
}

/** Order reference, e.g. ZAK-8F3K2Q. */
export function makeReference(prefix = 'ZAK') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${out}`;
}

/** Average rating rounded to 1 decimal; 0 when there are no reviews. */
export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export const ORDER_STATUSES = [
  { key: 'received', label: 'Order received', description: 'We have your order and are confirming it.' },
  { key: 'payment_confirmed', label: 'Payment confirmed', description: 'Payment has been verified by Zakson.' },
  { key: 'processing', label: 'Order being processed', description: 'Your shoes are being packed at our Jos store.' },
  { key: 'ready_for_dispatch', label: 'Ready for dispatch', description: 'Packed and waiting for the rider or courier.' },
  { key: 'out_for_delivery', label: 'Out for delivery', description: 'On the way to your delivery address.' },
  { key: 'delivered', label: 'Delivered', description: 'Delivered. Enjoy your stride!' },
  { key: 'cancelled', label: 'Cancelled', description: 'This order was cancelled.' },
];

export function statusLabel(status) {
  return ORDER_STATUSES.find((s) => s.key === status)?.label ?? 'Order received';
}

export function statusIndex(status) {
  return ORDER_STATUSES.findIndex((s) => s.key === status);
}

export function paymentLabel(status) {
  return { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' }[status] ?? 'Pending';
}

export function isValidNigerianPhone(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  return /^(0\d{10}|234\d{10})$/.test(digits);
}

export function normalisePhone(phone) {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (/^234\d{10}$/.test(digits)) return `0${digits.slice(3)}`;
  return digits;
}
