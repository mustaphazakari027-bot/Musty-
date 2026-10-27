import { db } from '@/lib/db';
import { getDeliveryZones, getCoupon } from '@/lib/catalog';
import { getCartView, clearCart } from '@/lib/cart';
import { computeTotals, makeReference, FREE_DELIVERY_THRESHOLD_KOBO } from '@/lib/pricing.mjs';
import { getSetting } from '@/lib/settings';
import { activeProvider } from '@/lib/payments';

export type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  city: string;
  landmark?: string;
  instructions?: string;
  zoneId: number;
};

export type CreateOrderResult =
  | { ok: false; message: string; field?: string }
  | { ok: true; order: { id: number; reference: string; accessToken: string; totalKobo: number } };

/**
 * Creates an order from the server-side cart. Every price, stock level, coupon
 * and delivery fee is re-read from the database — nothing is trusted from the client.
 */
export async function createOrderFromCart(
  customer: CheckoutCustomer,
  opts: { userId?: number | null; cartToken?: string | null } = {},
): Promise<CreateOrderResult> {
  const cart = await getCartView(opts.cartToken);
  if (cart.items.length === 0) return { ok: false, message: 'Your bag is empty.' };

  const outOfStock = cart.items.find((i) => !i.inStock);
  if (outOfStock) {
    return {
      ok: false,
      message: `${outOfStock.name} (size ${outOfStock.size}) no longer has enough stock. Please update your bag.`,
    };
  }

  const zone = getDeliveryZones().find((z) => z.id === Number(customer.zoneId));
  if (!zone) return { ok: false, message: 'Please choose a delivery area.', field: 'zoneId' };

  const coupon = cart.couponCode ? getCoupon(cart.couponCode) : null;
  const threshold = Number(getSetting('free_delivery_threshold_kobo') ?? FREE_DELIVERY_THRESHOLD_KOBO);
  const totals = computeTotals({
    items: cart.items.map((i) => ({ unit_price_kobo: i.unitPriceKobo, qty: i.qty })),
    deliveryFeeKobo: zone.fee_kobo,
    coupon,
    freeDeliveryThresholdKobo: threshold,
  });

  const reference = makeReference('ZAK');
  const accessToken = makeReference('T').toLowerCase() + Date.now().toString(36);
  const provider = activeProvider();

  const create = db.transaction(() => {
    const orderInfo = db
      .prepare(
        `INSERT INTO orders (reference, access_token, user_id, status, payment_status, payment_provider,
          customer_name, customer_email, customer_phone, delivery_address, delivery_state, delivery_city,
          delivery_landmark, delivery_instructions, delivery_zone_name, delivery_fee_kobo,
          subtotal_kobo, discount_kobo, total_kobo, coupon_code)
         VALUES (@reference, @accessToken, @userId, 'received', 'pending', @provider,
          @fullName, @email, @phone, @address, @state, @city, @landmark, @instructions, @zoneName, @deliveryFee,
          @subtotal, @discount, @total, @couponCode)`,
      )
      .run({
        reference,
        accessToken,
        userId: opts.userId ?? null,
        provider,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        state: customer.state,
        city: customer.city,
        landmark: customer.landmark ?? null,
        instructions: customer.instructions ?? null,
        zoneName: zone.name,
        deliveryFee: totals.deliveryKobo,
        subtotal: totals.subtotalKobo,
        discount: totals.discountKobo,
        total: totals.totalKobo,
        couponCode: totals.couponApplied ? coupon?.code ?? null : null,
      });

    const orderId = Number(orderInfo.lastInsertRowid);

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_slug, product_name, category_name, color_slug,
        color_name, size_label, image_url, qty, unit_price_kobo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const item of cart.items) {
      insertItem.run(
        orderId,
        item.productId,
        item.slug,
        item.name,
        item.categoryName,
        item.colorSlug,
        item.colorName,
        item.size,
        item.image,
        item.qty,
        item.unitPriceKobo,
      );
    }

    db.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, 'received', ?)").run(
      orderId,
      'Order placed on zakson.ng',
    );

    if (totals.couponApplied && coupon) {
      db.prepare('UPDATE coupons SET uses = uses + 1 WHERE id = ?').run(coupon.id);
    }

    return orderId;
  });

  const orderId = create();

  return {
    ok: true,
    order: { id: orderId, reference, accessToken, totalKobo: totals.totalKobo },
  };
}

export function getOrderByReference(reference: string) {
  return db
    .prepare('SELECT * FROM orders WHERE reference = ?')
    .get(reference) as Record<string, unknown> | undefined;
}

export function getOrderByAccessToken(token: string) {
  return db
    .prepare('SELECT * FROM orders WHERE access_token = ?')
    .get(token) as Record<string, unknown> | undefined;
}

export type OrderRecord = {
  id: number;
  reference: string;
  access_token: string;
  user_id: number | null;
  status: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_provider: string | null;
  payment_reference: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_state: string;
  delivery_city: string;
  delivery_landmark: string | null;
  delivery_instructions: string | null;
  delivery_zone_name: string | null;
  delivery_fee_kobo: number;
  subtotal_kobo: number;
  discount_kobo: number;
  total_kobo: number;
  coupon_code: string | null;
  created_at: string;
  updated_at: string;
};

export function listOrderItems(orderId: number) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId) as {
    id: number;
    product_id: number | null;
    product_slug: string;
    product_name: string;
    category_name: string | null;
    color_slug: string;
    color_name: string;
    size_label: string;
    image_url: string | null;
    qty: number;
    unit_price_kobo: number;
  }[];
}

export function listOrderEvents(orderId: number) {
  return db
    .prepare('SELECT id, status, note, created_at FROM order_events WHERE order_id = ? ORDER BY id')
    .all(orderId) as { id: number; status: string; note: string | null; created_at: string }[];
}

/** Marks an order paid (idempotent), decrements stock and advances the workflow. */
export function markOrderPaid(orderId: number, provider: string, paymentReference: string, amountKobo: number) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderRecord | undefined;
  if (!order) return { ok: false, message: 'Order not found.' };
  if (order.payment_status === 'paid') return { ok: true, alreadyPaid: true };

  db.transaction(() => {
    db.prepare(
      "UPDATE orders SET payment_status = 'paid', payment_reference = ?, status = 'processing', updated_at = datetime('now') WHERE id = ?",
    ).run(paymentReference, orderId);

    db.prepare(
      "INSERT INTO payments (order_id, provider, reference, status, amount_kobo) VALUES (?, ?, ?, 'paid', ?)",
    ).run(orderId, provider, paymentReference, amountKobo);

    db.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, 'payment_confirmed', ?)").run(
      orderId,
      `Payment of ₦${(amountKobo / 100).toLocaleString('en-NG')} confirmed via ${provider}.`,
    );
    db.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, 'processing', ?)").run(
      orderId,
      'Order moved to processing.',
    );

    const items = listOrderItems(orderId);
    for (const item of items) {
      if (item.product_id) {
        db.prepare(
          'UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE product_id = ? AND color_slug = ? AND size_label = ?',
        ).run(item.qty, item.product_id, item.color_slug, item.size_label);
      }
    }
  })();

  void clearCart;
  return { ok: true, alreadyPaid: false };
}

export function markOrderFailed(orderId: number, provider: string, paymentReference: string, note?: string) {
  db.transaction(() => {
    db.prepare(
      "UPDATE orders SET payment_status = 'failed', payment_reference = ?, updated_at = datetime('now') WHERE id = ? AND payment_status != 'paid'",
    ).run(paymentReference, orderId);
    db.prepare(
      "INSERT INTO payments (order_id, provider, reference, status, amount_kobo) VALUES (?, ?, ?, 'failed', 0)",
    ).run(orderId, provider, paymentReference);
    db.prepare("INSERT INTO order_events (order_id, status, note) VALUES (?, 'payment_failed', ?)").run(
      orderId,
      note ?? 'Payment was not completed.',
    );
  })();
}

export function advanceOrderStatus(orderId: number, status: string, note?: string) {
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, orderId);
  db.prepare('INSERT INTO order_events (order_id, status, note) VALUES (?, ?, ?)').run(orderId, status, note ?? null);
}

export { clearCart };
