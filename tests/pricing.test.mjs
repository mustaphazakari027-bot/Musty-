import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCoupon,
  averageRating,
  computeTotals,
  discountPercent,
  formatNaira,
  isValidNigerianPhone,
  makeReference,
  normalisePhone,
  nairaToKobo,
  statusIndex,
  statusLabel,
} from '../lib/pricing.mjs';

const NOW = new Date('2026-10-27T10:00:00.000Z');

const coupon = (overrides = {}) => ({
  code: 'ZAKSON10',
  type: 'percent',
  value: 10,
  min_subtotal_kobo: 0,
  max_uses: null,
  uses: 0,
  expires_at: null,
  is_active: 1,
  ...overrides,
});

test('formatNaira renders Naira without decimals by default', () => {
  const out = formatNaira(15_999_000);
  assert.match(out, /159,990/);
  assert.match(out, /₦|NGN/);
});

test('nairaToKobo parses formatted input', () => {
  assert.equal(nairaToKobo('159,990'), 15_999_000);
  assert.equal(nairaToKobo('₦8,999.50'), 899_950);
  assert.equal(nairaToKobo(''), 0);
});

test('discountPercent only reports a genuine discount', () => {
  assert.equal(discountPercent(15_999_000, 18_999_000), 16);
  assert.equal(discountPercent(15_999_000, null), 0);
  assert.equal(discountPercent(15_999_000, 15_999_000), 0);
  assert.equal(discountPercent(15_999_000, 12_000_000), 0);
});

test('computeTotals adds delivery when below the free-delivery threshold', () => {
  const totals = computeTotals({
    items: [
      { unit_price_kobo: 8_999_000, qty: 1 },
      { unit_price_kobo: 1_000_000, qty: 2 },
    ],
    deliveryFeeKobo: 150_000,
    coupon: null,
    now: NOW,
  });
  assert.equal(totals.subtotalKobo, 10_999_000);
  assert.equal(totals.discountKobo, 0);
  assert.equal(totals.deliveryKobo, 150_000);
  assert.equal(totals.totalKobo, 11_149_000);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.freeDeliveryApplied, false);
});

test('computeTotals waives delivery above the threshold', () => {
  const totals = computeTotals({
    items: [{ unit_price_kobo: 15_999_000, qty: 2 }],
    deliveryFeeKobo: 150_000,
    now: NOW,
  });
  assert.equal(totals.deliveryKobo, 0);
  assert.equal(totals.freeDeliveryApplied, true);
  assert.equal(totals.totalKobo, 31_998_000);
});

test('percentage coupon is capped at the subtotal', () => {
  const totals = computeTotals({
    items: [{ unit_price_kobo: 500_000, qty: 1 }],
    deliveryFeeKobo: 0,
    coupon: coupon({ value: 200 }),
    now: NOW,
  });
  assert.equal(totals.discountKobo, 500_000);
  assert.equal(totals.totalKobo, 0);
});

test('fixed coupon respects the minimum spend', () => {
  const small = applyCoupon(500_000, coupon({ type: 'fixed', value: 5000, min_subtotal_kobo: 8_000_000 }), NOW);
  assert.equal(small.ok, false);
  assert.equal(small.discount, 0);

  const large = applyCoupon(9_000_000, coupon({ type: 'fixed', value: 5000, min_subtotal_kobo: 8_000_000 }), NOW);
  assert.equal(large.ok, true);
  assert.equal(large.discount, 500_000);
});

test('expired and exhausted coupons are rejected', () => {
  const expired = applyCoupon(20_000_000, coupon({ expires_at: '2026-01-01T00:00:00.000Z' }), NOW);
  assert.equal(expired.ok, false);
  assert.match(expired.message, /expired/i);

  const exhausted = applyCoupon(20_000_000, coupon({ max_uses: 5, uses: 5 }), NOW);
  assert.equal(exhausted.ok, false);
  assert.match(exhausted.message, /redeemed/i);

  const paused = applyCoupon(20_000_000, coupon({ is_active: 0 }), NOW);
  assert.equal(paused.ok, false);
});

test('unknown coupon code is rejected', () => {
  const result = applyCoupon(10_000_000, null, NOW);
  assert.equal(result.ok, false);
  assert.equal(result.discount, 0);
});

test('Nigerian phone validation normalises +234 numbers', () => {
  assert.equal(isValidNigerianPhone('09034422971'), true);
  assert.equal(isValidNigerianPhone('+234 903 442 2971'), true);
  assert.equal(isValidNigerianPhone('0703'), false);
  assert.equal(normalisePhone('+2349034422971'), '09034422971');
});

test('averageRating rounds to one decimal and handles no reviews', () => {
  assert.equal(averageRating([{ rating: 5 }, { rating: 4 }]), 4.5);
  assert.equal(averageRating([]), 0);
});

test('order references are unique-ish and formatted', () => {
  const refs = new Set(Array.from({ length: 200 }, () => makeReference('ZAK')));
  assert.equal(refs.size, 200);
  refs.forEach((ref) => assert.match(ref, /^ZAK-[A-Z0-9]{6}$/));
});

test('order status helpers', () => {
  assert.equal(statusLabel('ready_for_dispatch'), 'Ready for dispatch');
  assert.equal(statusLabel('nonsense'), 'Order received');
  assert.equal(statusIndex('payment_confirmed'), 1);
  assert.equal(statusIndex('delivered'), 5);
});
