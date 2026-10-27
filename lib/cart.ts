import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { computeTotals, FREE_DELIVERY_THRESHOLD_KOBO } from '@/lib/pricing.mjs';
import { getCoupon, getVariantStock } from '@/lib/catalog';
import { getSetting } from '@/lib/settings';

export const CART_COOKIE = 'zak_cart';

export type CartLine = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  subtitle: string;
  categoryName: string;
  image: string;
  colorSlug: string;
  colorName: string;
  colorHex: string;
  size: string;
  qty: number;
  unitPriceKobo: number;
  compareAtKobo: number | null;
  stock: number;
  lineTotalKobo: number;
  inStock: boolean;
  colorOptions: { slug: string; name: string; hex: string }[];
  sizeOptions: { label: string; stock: number }[];
};

export type CartView = {
  token: string;
  items: CartLine[];
  couponCode: string | null;
  totals: ReturnType<typeof computeTotals>;
};

/** Read the cart token without creating one (safe in Server Components). */
export async function readCartToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value ?? null;
}

/** Create a cart token + cookie. Only call from Route Handlers / Server Actions. */
export async function ensureCartToken(userId?: number | null): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) {
    const cart = db.prepare('SELECT id, user_id FROM carts WHERE token = ?').get(existing) as
      | { id: number; user_id: number | null }
      | undefined;
    if (cart) {
      if (userId && !cart.user_id) db.prepare('UPDATE carts SET user_id = ? WHERE id = ?').run(userId, cart.id);
      return existing;
    }
  }
  const token = crypto.randomBytes(18).toString('hex');
  db.prepare('INSERT INTO carts (token, user_id) VALUES (?, ?)').run(token, userId ?? null);
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  });
  return token;
}

function cartRow(token: string | null) {
  if (!token) return null;
  return (
    (db.prepare('SELECT id, token, coupon_code, user_id FROM carts WHERE token = ?').get(token) as
      | { id: number; token: string; coupon_code: string | null; user_id: number | null }
      | undefined) ?? null
  );
}

export async function getCartView(token?: string | null): Promise<CartView> {
  const resolved = token ?? (await readCartToken());
  const cart = cartRow(resolved);
  const emptyTotals = computeTotals({ items: [], deliveryFeeKobo: 0 });

  if (!cart) {
    return { token: resolved ?? '', items: [], couponCode: null, totals: emptyTotals };
  }

  const rows = db
    .prepare(
      `SELECT ci.id, ci.product_id, ci.color_slug, ci.size_label, ci.qty, ci.unit_price_kobo,
              p.slug, p.name, p.subtitle, p.compare_at_kobo, c.name AS category_name,
              co.name AS color_name, co.hex AS color_hex,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
              (SELECT stock FROM product_variants v WHERE v.product_id = p.id AND v.color_slug = ci.color_slug AND v.size_label = ci.size_label) AS stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       JOIN colors co ON co.slug = ci.color_slug
       WHERE ci.cart_id = ?
       ORDER BY ci.id`,
    )
    .all(cart.id) as {
    id: number;
    product_id: number;
    color_slug: string;
    size_label: string;
    qty: number;
    unit_price_kobo: number;
    slug: string;
    name: string;
    subtitle: string | null;
    compare_at_kobo: number | null;
    category_name: string | null;
    color_name: string;
    color_hex: string;
    image: string | null;
    stock: number | null;
  }[];

  const items: CartLine[] = rows.map((r) => {
    const stock = r.stock ?? 0;
    // Always price from the live product record, never from the client.
    const livePrice = (
      db.prepare('SELECT price_kobo FROM products WHERE id = ?').get(r.product_id) as { price_kobo: number }
    ).price_kobo;
    return {
      id: r.id,
      productId: r.product_id,
      slug: r.slug,
      name: r.name,
      subtitle: r.subtitle ?? '',
      categoryName: r.category_name ?? '',
      image: r.image ?? '',
      colorSlug: r.color_slug,
      colorName: r.color_name,
      colorHex: r.color_hex,
      size: r.size_label,
      qty: r.qty,
      unitPriceKobo: livePrice,
      compareAtKobo: r.compare_at_kobo,
      stock,
      lineTotalKobo: livePrice * r.qty,
      inStock: stock >= r.qty,
      colorOptions: (
        db
          .prepare(
            `SELECT co.slug, co.name, co.hex FROM product_colors pc
             JOIN colors co ON co.slug = pc.color_slug
             WHERE pc.product_id = ? ORDER BY pc.sort_order`,
          )
          .all(r.product_id) as { slug: string; name: string; hex: string }[]
      ),
      sizeOptions: (
        db
          .prepare(
            `SELECT size_label AS label, stock FROM product_variants
             WHERE product_id = ? AND color_slug = ? ORDER BY CAST(size_label AS REAL)`,
          )
          .all(r.product_id, r.color_slug) as { label: string; stock: number }[]
      ),
    };
  });

  const coupon = cart.coupon_code ? getCoupon(cart.coupon_code) : null;
  const threshold = Number(getSetting('free_delivery_threshold_kobo') ?? FREE_DELIVERY_THRESHOLD_KOBO);
  const totals = computeTotals({
    items: items.map((i) => ({ unit_price_kobo: i.unitPriceKobo, qty: i.qty })),
    deliveryFeeKobo: 0,
    coupon: coupon ?? null,
    freeDeliveryThresholdKobo: threshold,
  });

  return { token: cart.token, items, couponCode: cart.coupon_code, totals };
}

export type AddToCartInput = {
  productId: number;
  colorSlug: string;
  sizeLabel: string;
  qty: number;
};

export type MutationResult = { ok: boolean; message: string; cart?: CartView };

export async function addToCart(input: AddToCartInput, userId?: number | null): Promise<MutationResult> {
  const token = await ensureCartToken(userId);
  const cart = cartRow(token)!;

  const product = db
    .prepare('SELECT id, price_kobo, is_active, name FROM products WHERE id = ?')
    .get(input.productId) as { id: number; price_kobo: number; is_active: number; name: string } | undefined;
  if (!product || !product.is_active) return { ok: false, message: 'This product is no longer available.' };

  const colorOk = db
    .prepare('SELECT 1 FROM product_colors WHERE product_id = ? AND color_slug = ?')
    .get(input.productId, input.colorSlug);
  const sizeOk = db
    .prepare('SELECT 1 FROM product_variants WHERE product_id = ? AND color_slug = ? AND size_label = ?')
    .get(input.productId, input.colorSlug, input.sizeLabel);
  if (!colorOk) return { ok: false, message: 'Please choose an available colour.' };
  if (!sizeOk) return { ok: false, message: 'Please choose an available size.' };

  const stock = getVariantStock(input.productId, input.colorSlug, input.sizeLabel);
  const qty = Math.max(1, Math.min(10, Math.floor(input.qty || 1)));
  const existing = db
    .prepare('SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND color_slug = ? AND size_label = ?')
    .get(cart.id, input.productId, input.colorSlug, input.sizeLabel) as { id: number; qty: number } | undefined;

  const desired = (existing?.qty ?? 0) + qty;
  if (stock <= 0) return { ok: false, message: 'That size is sold out. Try another size or colour.' };
  if (desired > stock) {
    return { ok: false, message: `Only ${stock} pair${stock === 1 ? '' : 's'} left in that size.` };
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET qty = ?, unit_price_kobo = ? WHERE id = ?').run(
      desired,
      product.price_kobo,
      existing.id,
    );
  } else {
    db.prepare(
      'INSERT INTO cart_items (cart_id, product_id, color_slug, size_label, qty, unit_price_kobo) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(cart.id, input.productId, input.colorSlug, input.sizeLabel, qty, product.price_kobo);
  }
  db.prepare("UPDATE carts SET updated_at = datetime('now') WHERE id = ?").run(cart.id);

  return { ok: true, message: `${product.name} added to your bag.`, cart: await getCartView(token) };
}

export async function updateCartItem(
  itemId: number,
  changes: { qty?: number; sizeLabel?: string; colorSlug?: string },
): Promise<MutationResult> {
  const token = await readCartToken();
  const cart = cartRow(token);
  if (!cart) return { ok: false, message: 'Your bag is empty.' };

  const item = db
    .prepare('SELECT * FROM cart_items WHERE id = ? AND cart_id = ?')
    .get(itemId, cart.id) as
    | { id: number; product_id: number; color_slug: string; size_label: string; qty: number }
    | undefined;
  if (!item) return { ok: false, message: 'Item not found in your bag.' };

  const nextColor = changes.colorSlug ?? item.color_slug;
  const nextSize = changes.sizeLabel ?? item.size_label;
  const nextQty = Math.max(1, Math.min(10, Math.floor(changes.qty ?? item.qty)));

  const stock = getVariantStock(item.product_id, nextColor, nextSize);
  if (stock <= 0) return { ok: false, message: 'That combination is sold out.' };
  if (nextQty > stock) return { ok: false, message: `Only ${stock} left in that size.` };

  const clash = db
    .prepare(
      'SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ? AND color_slug = ? AND size_label = ? AND id != ?',
    )
    .get(cart.id, item.product_id, nextColor, nextSize, item.id);
  if (clash) {
    // Merge quantities into the existing line.
    const merged = Math.min(10, stock);
    db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(merged, (clash as { id: number }).id);
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  } else {
    db.prepare('UPDATE cart_items SET qty = ?, color_slug = ?, size_label = ? WHERE id = ?').run(
      nextQty,
      nextColor,
      nextSize,
      item.id,
    );
  }
  return { ok: true, message: 'Bag updated.', cart: await getCartView(token) };
}

export async function removeCartItem(itemId: number): Promise<MutationResult> {
  const token = await readCartToken();
  const cart = cartRow(token);
  if (!cart) return { ok: false, message: 'Your bag is empty.' };
  db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(itemId, cart.id);
  return { ok: true, message: 'Item removed.', cart: await getCartView(token) };
}

export async function setCartCoupon(code: string | null): Promise<MutationResult> {
  const token = await ensureCartToken();
  const cart = cartRow(token)!;
  if (!code) {
    db.prepare('UPDATE carts SET coupon_code = NULL WHERE id = ?').run(cart.id);
    return { ok: true, message: 'Promo code removed.', cart: await getCartView(token) };
  }
  const coupon = getCoupon(code);
  if (!coupon) return { ok: false, message: 'That promo code does not exist.' };
  const view = await getCartView(token);
  const probe = computeTotals({
    items: view.items.map((i) => ({ unit_price_kobo: i.unitPriceKobo, qty: i.qty })),
    deliveryFeeKobo: 0,
    coupon,
    freeDeliveryThresholdKobo: Number(getSetting('free_delivery_threshold_kobo') ?? FREE_DELIVERY_THRESHOLD_KOBO),
  });
  if (!probe.couponApplied) {
    return { ok: false, message: probe.couponMessage ?? 'This promo code cannot be applied.' };
  }
  db.prepare('UPDATE carts SET coupon_code = ? WHERE id = ?').run(coupon.code.toUpperCase(), cart.id);
  return { ok: true, message: `Promo code ${coupon.code.toUpperCase()} applied.`, cart: await getCartView(token) };
}

export async function clearCart(token: string | null) {
  const cart = cartRow(token);
  if (!cart) return;
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
  db.prepare('UPDATE carts SET coupon_code = NULL WHERE id = ?').run(cart.id);
}

/** Attach an anonymous cart to a user after login/registration. */
export async function attachCartToUser(userId: number) {
  const token = await readCartToken();
  const cart = cartRow(token);
  if (!cart) return;
  db.prepare('UPDATE carts SET user_id = ? WHERE id = ?').run(userId, cart.id);
}
