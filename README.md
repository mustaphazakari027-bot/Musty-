# Zakson — premium sports footwear e-commerce

A complete, working online shoe store for **Zakson**, owned by **Musty Zakari** and based at
**Terminus Market Overhead Bridge, Jos North, Plateau State, Nigeria**. Built with Next.js 15 (App Router),
React 19, TypeScript and Tailwind CSS, with a server-side order/payment pipeline in Nigerian Naira.

The design follows the supplied reference: mint-green canvas, deep forest-green actions, rounded product
cards, minimal navigation, mobile-first shopping with a floating bottom bar, and a product page with
colour swatches, size pills and a sticky Add to Cart / Buy Now pair.

---

## 1. What is included

| Area | Status |
| --- | --- |
| Homepage (hero, categories, top picks, promo, best sellers, new arrivals, reviews, delivery, FAQ, newsletter, footer) | ✅ built |
| Product catalogue with search, filters (gender, category, size, colour, price, availability, rating) and sorting | ✅ built |
| Product page: gallery, colour swatches, size pills, size guide, quantity, stock, add to cart, buy now, wishlist, reviews, related products | ✅ built |
| Cart: add/remove, quantity, size **and colour** changes, promo codes, delivery estimate, persistence between visits | ✅ built |
| Checkout: customer details, delivery zones & fees, server-validated prices/stock/coupons, payment hand-off | ✅ built |
| Payments: Paystack + Flutterwave init, server-side verification, signed webhooks, demo mode | ✅ built (needs merchant keys) |
| Customer accounts: register, login, logout, password reset, profile, saved addresses, order history, wishlist, reviews | ✅ built |
| Order tracking: 6-stage workflow + cancellation, guest lookup by reference + email | ✅ built |
| Admin dashboard: products CRUD, variant inventory grid, image upload, orders & fulfilment, promo codes, messages, store settings, analytics | ✅ built |
| SEO: per-page metadata, product/FAQ/store JSON-LD, sitemap, robots, canonical URLs, OG images | ✅ built |
| Accessibility: semantic landmarks, skip link, labelled inputs, focus rings, reduced-motion support | ✅ built |
| Tests: pricing/coupon/phone/reference unit tests (`node --test`) | ✅ 13 passing |

### Items that need your credentials or approval before real orders can be accepted

1. **Payment provider (Paystack or Flutterwave)** — merchant account, live secret key, webhook URL.
   Until then the store runs in **demo payment mode**: orders are created, a simulated gateway page
   lets you test paid/failed flows, and no money moves.
2. **Cloudinary** for product image uploads (cloud name, API key, API secret). Without it, paste image
   URLs in the admin, or use the local development upload folder.
3. **Email delivery** (Resend API key or SMTP) for receipts, password reset links and contact-form
   notifications. Without it, messages and reset links are stored/logged server-side.
4. **Production database** — the demo ships with SQLite (zero-config). For a managed Postgres/Supabase
   deployment see §8.
5. **Business details to confirm** — support email `mustaphazakari081@gmail.com`, phone `09034422971`,
   Jos North address and Terminus Market landmark are pre-loaded from the brief. No street number,
   postal code or map coordinates were invented; a map placeholder is shown until you configure one.

---

## 2. Quick start (local)

```bash
cd zakson
npm install
cp .env.example .env.local        # then edit the values
npm run dev                       # http://localhost:3000
```

The SQLite database is created and seeded automatically on first boot in `.data/zakson.db`
(products, colours, sizes, variants, delivery zones, promo codes, sample reviews and the admin user).

```bash
npm run build && npm start        # production build
npm test                          # unit tests (pricing, coupons, validation helpers)
```

### First login

| Role | Email | Password |
| --- | --- | --- |
| Admin | `mustaphazakari081@gmail.com` (from `ADMIN_EMAIL`) | the value you set in `ADMIN_PASSWORD` — no default in this repo |

No password is hard-coded anywhere: set `ADMIN_PASSWORD` (in `.env.local` or your host's env vars) **before the
first boot** and the admin account is created with it. In production the app refuses to create an admin
while `ADMIN_PASSWORD` is unset. To rotate it later, generate a hash and update the row:

```bash
node -e "console.log(require('bcryptjs').hashSync('YourNewPassword',10))"
# then: UPDATE users SET password_hash='<hash>' WHERE email='mustaphazakari081@gmail.com';
```

Admin dashboard: `/admin`.

---

## 3. Environment variables

See `.env.example` for the annotated list.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used for SEO and payment callbacks |
| `AUTH_SECRET` | HMAC key for signed session cookies (32+ random chars) |
| `DATA_DIR` | SQLite data directory (default `.data`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seed admin account (first boot only) |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Paystack live/test keys (server-side only) |
| `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH` | Flutterwave keys and webhook hash |
| `PAYMENT_PROVIDER` | `paystack` \| `flutterwave` \| `demo` (auto-detected when empty) |
| `ALLOW_DEMO_PAYMENTS` | Set `false` in production once live keys exist |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Signed server-side uploads |
| `RESEND_API_KEY` *or* `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` | Transactional email |
| `MAIL_FROM` | From address for outgoing email |

Nothing secret is ever imported into a client component: keys are read only inside Route Handlers and
server code (`lib/payments.ts`, `lib/notify.ts`, `app/api/admin/upload/route.ts`).

---

## 4. How the money path works

1. **Cart** — `POST /api/cart/add` validates product, colour, size and stock **on the server**, stores the
   line in SQLite and sets an httpOnly cart cookie. Prices are always re-read from `products.price_kobo`,
   never accepted from the browser.
2. **Checkout** (`/checkout`) — customer details + delivery zone. The client only *previews* totals;
   `/api/checkout` re-computes everything (subtotal, coupon, free-delivery threshold, zone fee) before
   writing the order.
3. **Order creation** — `orders` + `order_items` rows are written with **snapshots** of product name,
   colour, size and unit price, plus the delivery/billing details, and an `order_events` entry.
4. **Payment init** — `initializePayment()` calls Paystack/Flutterwave with the server secret and a
   `callback_url` pointing at `/checkout/complete`. In demo mode it redirects to `/checkout/demo`.
5. **Verification** — `/checkout/complete` calls `finalizeOrderPayment()`, which re-verifies the
   transaction with the provider API (amount + status) and only then marks the order `paid`, advances it
   to *processing* and decrements stock. Webhooks (`/api/payments/webhook`) do the same with signature
   verification, so a customer closing the browser still gets a confirmed order.
6. **Failed / pending** — statuses are shown distinctly on the completion page and in the admin; a failed
   charge never confirms an order.

### Webhook setup

* Paystack → Dashboard → Settings → API Keys & Webhooks → Webhook URL:
  `https://YOUR_DOMAIN/api/payments/webhook`
  Signature `x-paystack-signature` is validated with HMAC-SHA512 of the raw body.
* Flutterwave → Settings → Webhooks → URL: `https://YOUR_DOMAIN/api/payments/webhook`,
  Secret hash → `FLUTTERWAVE_WEBHOOK_HASH` (checked against the `verif-hash` header).

---

## 5. Database

SQLite via `better-sqlite3`, schema in `lib/schema.ts`, seed data in `lib/seed-data.ts`.
Tables: `users, categories, products, product_images, colors, product_colors, sizes, product_variants,
addresses, carts, cart_items, delivery_zones, coupons, orders, order_items, order_events, payments,
reviews, wishlist_items, password_resets, settings, newsletter_subscribers, contact_messages`.

Stock lives on `product_variants` (product × colour × size), so a size can sell out independently.
Deleting a product keeps past `order_items` intact because they are snapshots.

### Moving to PostgreSQL / Supabase

The schema is deliberately Postgres-friendly:

1. Swap `lib/db.ts` for a Postgres client (`pg` or `@supabase/supabase-js`) keeping the same exported `db`
   query surface, or use the SQL migration in `docs/schema-postgres.sql`.
2. Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `BIGINT GENERATED ALWAYS AS IDENTITY`,
   `datetime('now')` with `now()`, and integer booleans with native `boolean`.
3. Keep Supabase Auth out of the cart/order path if you prefer this app's own session cookies — either
   model works, but do not mix two session sources for the same admin routes.
4. Upload the migrations with `supabase db push`, then run the seed data once.

---

## 6. Admin guide

| Page | What you can do |
| --- | --- |
| `/admin` | Paid revenue, order counts, 14-day sales chart, best sellers, low-stock alerts, recent orders |
| `/admin/products` | Search, create, edit, hide (visibility flag) and delete products |
| `/admin/products/[id]` | Prices, genuine compare-at price, colours, sizes, images, badges, per-variant stock grid |
| `/admin/orders` | Filter by payment/fulfilment state, open an order to verify payment, advance stages, mark paid/failed, record refunds |
| `/admin/coupons` | Create percent/fixed codes with minimum spend, usage caps and expiry; pause/delete |
| `/admin/messages` | Contact-form inbox (mark read/unread, reply by email), newsletter subscriber list |
| `/admin/settings` | Business details, announcement bar, free-delivery threshold, delivery zones and fees |

**Rules the code enforces:** discounts only appear when `compare_at_kobo > price_kobo`; coupons respect
expiry, usage caps and minimum spend; stock never goes negative; order totals are recomputed server-side
on every request.

---

## 7. Design system

* Colours: mint `#DDF5E9`, emerald `#18A978`, forest `#064E3B`, ink `#101A17`, white, mist `#F3F5F4`,
  border `#E2E8E5` (Tailwind theme in `tailwind.config.ts`).
* Type: Inter (body) + Manrope (display) via `next/font` — self-hosted, no external font requests.
* Radii 20–36 px, soft shadows, restrained hover lift, `prefers-reduced-motion` respected.
* Components: `components/ui.tsx` (stars, price, badges, section headings, empty states, status pills),
  `ProductCard`, `Header`, `MobileMenu`, `MobileTabBar`, `Footer`, `Icons` (inline SVG, zero icon deps).

### Product imagery

Ten studio product shots live in `public/images/products/*.webp` (1280 px, ~30–70 KB each, mint backdrops
that match the palette). They are AI-generated placeholders for the demo — replace them with your own
photography through the admin (Cloudinary) before launch. Keep the same framing (three-quarter view,
floating, soft shadow) for a consistent grid.

---

## 8. Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel link
vercel env add AUTH_SECRET production        # repeat for each variable in §3
vercel --prod
```

⚠️ **SQLite on Vercel does not persist** (read-only filesystem, serverless instances). Before going live
on Vercel, point the app at Postgres/Supabase (§5) or run it on a VPS/container with a persistent volume
(e.g. Railway, Render, Fly.io, or a Nigerian VPS) where `.data/` survives. The Dockerfile in the repo
runs the app with a mounted volume for exactly this case.

### Any Node host / VPS

```bash
npm ci && npm run build && npm start   # listens on 0.0.0.0:3000
```

Put Nginx/Caddy in front for TLS, set `NEXT_PUBLIC_SITE_URL` to the public https URL, register the
webhook, then set `ALLOW_DEMO_PAYMENTS=false`.

### Pre-launch checklist

- [ ] Change the admin password, create a `staff` user for any helper.
- [ ] Add live Paystack/Flutterwave keys, webhook, and make one small real payment.
- [ ] Configure Cloudinary; replace the demo product photos with real photography.
- [ ] Configure email so customers receive receipts and reset links.
- [ ] Confirm delivery fees/areas in `/admin/settings` against your actual rider costs.
- [ ] Review the sample reviews (`reviews.is_sample = 1`) — delete them once you have real ones.
- [ ] Verify contact details, opening hours and the store landmark.
- [ ] Run `npm test`, walk the flows in §9 on a phone and a laptop.

---

## 9. Manual test script

1. Browse → filter by size 9 + Running → open a product → pick colour + size → Add to Cart.
2. Cart → change quantity, change size, change colour → apply `ZAKSON10` (needs ₦120,000 subtotal) → totals update.
3. Try adding a sold-out size → friendly error, no line added.
4. Checkout with an invalid phone (`0703`) → server rejects with a specific message.
5. Place an order, pay on the simulated gateway → confirmation shows *Paid*, order is *processing*, stock drops, cart empties.
6. Simulate a declined payment → order shows *Failed*, cart retained.
7. Track the order by reference + email as a guest; sign in to see it under `/account`.
8. Register a new account → wishlist a product → leave a review (marked unverified without a delivery).
9. Sign in as admin → advance the order to *Out for delivery* → the customer's tracking page reflects it.
10. Create a promo code with a minimum spend → verify it is rejected below that spend.
11. Upload a product image (with Cloudinary configured) → it appears on the storefront.
12. Resize to 390 px: bottom tab bar, two-column grid, sticky checkout button, no horizontal scroll.

---

## 10. Project structure

```
app/
  page.tsx                    homepage
  shop/                       catalogue with filters + sorting
  product/[slug]/             product detail (gallery, variants, reviews, JSON-LD)
  cart/  checkout/            cart, checkout, demo gateway, completion
  orders/                     guest + customer order tracking
  account/                    login, register, forgot/reset, profile, addresses, orders
  admin/                      dashboard, products, orders, coupons, messages, settings
  api/                        cart, auth, checkout, payments (webhook), admin, contact, reviews…
  sitemap.ts robots.ts        SEO
components/                   design-system UI, product, home, shop, checkout, admin components
lib/                          db, schema, seed data, catalog, cart, orders, payments, auth, validation, pricing
tests/                        node:test unit tests
public/images/products/       product photography (webp)
docs/                         deployment notes and Postgres schema
```

---

## 11. Security notes

* Sessions: signed (JOSE, HS256) httpOnly cookies; role checks (`admin`/`staff`) on every admin route and
  API handler via `requireAdminSession()`.
* Passwords: bcrypt (cost 10). Password reset tokens are single-use, hashed into the DB with a 1-hour expiry.
* No card data ever touches this app — payments happen on the provider's page; we store only references.
* Every mutation route re-validates with Zod; money values are integers (kobo) throughout.
* Rate limiting on login, registration, checkout, contact, newsletter and order lookup.
* Admin uploads: MIME + 6 MB limits, Cloudinary signing on the server, no secret in the browser.
* Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`).

For a multi-instance deployment, move the in-memory rate limiter to Redis and the session store to a
shared cache.

---

© Zakson — Musty Zakari, Jos North, Plateau State, Nigeria · mustaphazakari081@gmail.com · 09034422971
