# Rikkos Fresh — grocery delivery storefront

A working, mobile-first grocery e-commerce site inspired by the supplied mobile app reference: mint-and-cream palette, rounded product cards, soft shadows, clear naira pricing and a calm, premium feel. It is a real application — catalogue, basket, promotions, stock, checkout, order tracking, customer accounts and a protected admin dashboard all run against a database, not mocks.

> **Brand name:** “Rikkos Fresh” is a working name derived from the store address (Rikkos, Jos North). Change it in `src/brand.ts` and the handful of literal meta titles listed under [Renaming the store](#renaming-the-store).

---

## 1. What is included

| Area | Status | Details |
| --- | --- | --- |
| Homepage | ✅ Working | Hero, category rail, promotional panels, bestsellers, new arrivals, testimonials (sample copy), newsletter, footer |
| Categories page | ✅ Working | 8 seeded categories with live product counts, images, links to filtered shop |
| Product listing | ✅ Working | Server-side search, category filter, price range, 5 sort orders, pagination + “load more”, skeletons, empty states |
| Product detail | ✅ Working | Large image, price/saving, pack size, stock state, quantity, add to basket, buy now, related products, delivery/security info |
| Basket | ✅ Working | Add/remove/change quantity, promo codes, delivery fee rules, server-verified totals, suggestions, persistent (localStorage) |
| Checkout & delivery | ✅ Working (payment needs keys) | Contact + address + instructions, delivery date/time windows, standard/express fee, order summary, Paystack redirect **or** pay-on-delivery, server-side price/stock/promo re-validation, order receipt |
| Paystack payments | ⚙️ Code complete, **needs your keys** | Hosted checkout initialisation, server-side verification endpoint, signed webhook handler, 30-minute stock hold, currency/amount/reference checks. No card data ever touches this app |
| Order confirmation & tracking | ✅ Working | Private receipt accessible to the signed-in customer, the browser that placed the order (token), or staff; plus public tracking with reference + email |
| Customer accounts | ✅ Working | Register, sign in, sign out, hashed sessions, saved addresses, order history, order view |
| Password reset | ⚙️ Code complete, **needs SMTP** | Single-use hashed tokens, 30-minute expiry, sessions invalidated on reset. Without SMTP the UI explains that email is not configured |
| Admin dashboard | ✅ Working | Overview metrics, order list + status workflow, product CRUD + inventory, category CRUD, promo CRUD, customers, contact messages, newsletter list |
| Image upload | ⚙️ Code complete, **needs Cloudinary** | Signed cloud upload with type/size validation; otherwise paste an `/images/…` path or HTTPS URL |
| Contact form | ✅ Working | Validated, rate-limited, honeypot, stored in database and visible in admin |
| Newsletter | ✅ Working | Stored in database, visible in admin (double opt-in/marketing email sending is not implemented) |
| SEO | ✅ Basic | Per-page titles/descriptions, `sitemap.xml`, a server-rendered catalogue snapshot for fast first paint, semantic headings |
| Accessibility | ✅ Good baseline | Skip link, labels on all inputs, visible focus rings, `aria-invalid`, keyboard-friendly dialogs, reduced-motion support, colour contrast checked |

**Not built (deliberately, so nothing is pretending):** automated refunds, courier/live-map tracking, product review submission, multi-image galleries, email order receipts, a real accounting/export module, wishlists shared across devices, multi-admin roles, and an automatic database migration tool.

---

## 2. Tech stack

- **Frontend:** React 18 + TypeScript + Vite, React Router, Tailwind CSS, Lucide icons. Self-hosted DM Sans / DM Serif Display (no external font requests).
- **Backend:** Express + TypeScript (`server/`), Zod validation, bcrypt password hashing, HTTP-only cookie sessions, helmet, rate limiting.
- **Database:** PostgreSQL in production via `DATABASE_URL`. With no `DATABASE_URL` the app uses a local file-backed SQLite database (`sql.js`) so you can run everything instantly — this is a **demo/development only** fallback; production refuses to boot without PostgreSQL.
- **One server, one deploy:** Express serves the built React app and the JSON API, so the frontend, backend and database layer ship (and deploy) together. No cross-origin configuration is needed.
- **Payments:** Paystack (redirect checkout + server verification + webhook).
- **Images:** local files in `public/images` by default; Cloudinary for admin uploads.
- **Email:** Nodemailer/SMTP for password reset. Order emails are not sent yet (the receipt is on-screen and in the account history).

---

## 3. Run it locally

```bash
npm install
cp .env.example .env      # optional for the demo; all values may stay empty
npm run dev               # http://localhost:3000
```

The first start creates `data/demo.sqlite`, seeds 8 categories, 22 realistic products with naira prices, the `FRESH10` promo and a demo admin.

**Demo sign-in (development only):**

```
Email:    admin@rikkosfresh.demo
Password: RikkosDemo!2026
```

Create a normal customer account from `/register` to test the customer journey.

Useful commands:

```bash
npm run build     # type-check + production build into dist/
npm start         # production server (requires DATABASE_URL and HTTPS APP_URL)
npm test          # 19-check API smoke test against a running server
```

The smoke test creates a throwaway customer and order — run it against a demo database, not production.

---

## 4. Environment variables

Copy `.env.example` to `.env`. **Never commit `.env`.** Nothing secret is referenced by `VITE_` variables, so nothing secret can reach the browser bundle.

| Variable | Required for | Notes |
| --- | --- | --- |
| `NODE_ENV` | deployment | `production` enables the Postgres requirement, HTTPS `APP_URL` check, secure cookies, helmet CSP and static file serving |
| `PORT` | hosting | Defaults to `3000`; most hosts inject their own |
| `APP_URL` | Paystack, reset email | Public HTTPS origin, e.g. `https://shop.example.com`. Also used for the Paystack callback URL and sitemap |
| `DATABASE_URL` | production | PostgreSQL connection string. Managed providers usually need `?sslmode=require` |
| `ALLOW_PAY_ON_DELIVERY` | checkout | `true`/`false`. Only enable if you genuinely collect payment on delivery |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | first boot | Creates one admin account if it does not exist. In production the password must be ≥12 characters and must not be the demo password |
| `PAYSTACK_SECRET_KEY` | card payments | Server-side only. Never expose it in the frontend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | password reset | A verified sender domain is usually required by email providers |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | admin image uploads | All three required to enable uploads |
| `TRUST_PROXY` | behind a proxy | Set to `1` only when a trusted reverse proxy (Render, Railway, Fly, Nginx) terminates TLS, so rate limits key on the real client IP |

### Renaming the store

1. Edit `src/brand.ts` (name, tagline, phone, email, address, hours, free-delivery threshold).
2. Update `<title>`/meta in `index.html`, and the literal meta descriptions in `src/components/ui.tsx` and the page `PageHead` descriptions if you want the old name gone entirely.
3. Update the seed (`server/seed.ts`) if you also want different sample products.

---

## 5. How checkout actually works

1. The basket lives in the browser, but **every price, promo and stock decision is recalculated on the server** (`POST /api/quote`, `POST /api/checkout`).
2. On checkout the server opens a transaction, re-checks stock, decrements inventory and writes an immutable order + order-item snapshot.
3. **Paystack orders** are created as `pending`, with a 30-minute stock hold. The server initialises the transaction with Paystack using the order reference and the *server-computed* amount, then redirects the browser to Paystack’s hosted page.
4. On return, `/checkout/return` calls `POST /api/paystack/verify`. The server verifies directly with Paystack and checks the reference, currency (`NGN`) and amount in kobo before marking the order paid and confirmed.
5. `POST /api/paystack/webhook` (signature-verified) provides the same confirmation independently of the browser. Configure it in the Paystack dashboard as `https://your-domain.com/api/paystack/webhook`.
6. A background job releases expired holds every minute and restores stock. If a payment lands after its hold expired, the order is marked **Paid / Needs review** for manual fulfilment or refund — money is never silently lost.
7. **Pay-on-delivery orders** reserve stock immediately and are confirmed for fulfilment; the admin marks payment when cash/transfer is received.

### Going live with Paystack

1. Create a Paystack business account and complete their KYC.
2. Put the **secret key** in `PAYSTACK_SECRET_KEY` on the server (never in the frontend) and set `APP_URL` to your HTTPS domain.
3. Add the webhook URL above in the Paystack dashboard.
4. Test with Paystack test keys and test cards first, then switch to live keys.
5. Place one real low-value order and confirm the admin dashboard shows **Paid** and stock is decremented exactly once.

### Going live with pay-on-delivery

Set `ALLOW_PAY_ON_DELIVERY=true` only if you can genuinely collect on the doorstep, and decide how you handle refusals (the app has no cancellation-fraud scoring).

---

## 6. Database

Tables are created automatically on first boot (`server/db.ts`): `categories`, `products`, `users`, `sessions`, `password_resets`, `addresses`, `promos`, `orders`, `order_items`, `contact_messages`, `newsletter`.

- Local: SQLite file at `data/demo.sqlite` (delete it to reseed).
- Production: PostgreSQL from `DATABASE_URL`. Point it at Render Postgres, Supabase, Neon or RDS, then deploy.
- **Schema changes are additive by hand** — this project ships `CREATE TABLE IF NOT EXISTS` rather than a migration runner. Before real order volume, adopt a migration tool (Drizzle, Prisma Migrate, node-pg-migrate) and take regular `pg_dump` backups.

---

## 7. Deployment

### Render / Railway / Fly (single app + managed Postgres)

1. Create a PostgreSQL instance; copy its connection string into `DATABASE_URL` (add `?sslmode=require` if required).
2. Create a web service from this repository.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Health check path: `/api/health`
3. Add environment variables from `.env.example` (`NODE_ENV=production`, `APP_URL`, `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optionally Paystack/SMTP/Cloudinary). Set `TRUST_PROXY=1` behind the platform proxy.
4. Deploy, sign in as the admin, change or create a strong admin password, then replace the sample products and copy.

### Vercel

The app is a single Express server that also serves the built SPA, which suits Render/Railway/Fly/VPS better than Vercel’s serverless model. If you must use Vercel, split it: host the API as Node functions (rewrite `server/index.ts` into `/api` routes), host the frontend as a static Vite build, and keep the database and secrets server-side.

### Docker

```bash
docker build -t rikkos-fresh .
docker run --env-file .env -p 3000:3000 rikkos-fresh
```

### VPS (Ubuntu + Nginx)

```bash
npm ci && npm run build
NODE_ENV=production PORT=3000 npm start   # manage with pm2/systemd
```

Reverse-proxy `:3000` with Nginx, terminate TLS with Certbot, set `TRUST_PROXY=1`, and keep `.env` readable only by the service user.

---

## 8. Security notes (what is actually enforced)

- Prices, discounts, delivery fees and stock are computed **server-side** from the database; the browser cannot dictate what it pays.
- Sessions: 32-byte random tokens, stored only as SHA-256 hashes, `HttpOnly` + `SameSite=Lax` cookies, `Secure` in production, 7-day expiry, deleted on logout and on password reset.
- Passwords: bcrypt (cost 12), minimum 10 characters, never logged.
- Authorisation: `/api/admin/*` is guarded on the server by `requireUser` + `requireAdmin`; the UI guard is only a convenience.
- CSRF: state-changing API requests require an `X-Requested-With: XMLHttpRequest` header (cross-site forms cannot set it) and are rejected when the `Origin` host does not match. No permissive CORS is enabled.
- Paystack webhook signatures are verified with a timing-safe HMAC-SHA512 comparison over the raw body.
- Input validation with Zod (shared by client-side hints and server enforcement), parameterised SQL everywhere, sort order chosen from a fixed allowlist, ID/path values length-checked.
- Rate limiting on auth, checkout, contact and newsletter endpoints; Helmet security headers and a strict CSP in production; no secrets in the frontend bundle; uploads limited to 5 MB and verified by file signature.
- Order receipts are private: signed-in owner, admin, the placing browser’s token, or reference + matching email only.

**Operational hardening still recommended:** a web application firewall, alerting on failed payments, backups with restore drills, and rotating the admin password and Paystack/Cloudinary keys periodically.

---

## 9. Content and asset credits

- Product photography: [Unsplash](https://unsplash.com/license) — free to use, but replace with your own photography (or confirm licensing) before a commercial launch, since some images show branded packaging.
- Hero, fruit and greens promotional images: generated for this project.
- Sample reviews, ratings and product copy are **placeholder content** written for this build. Replace with verified customer reviews and your own descriptions; do not present sample reviews as real.
- Icons: Lucide (ISC licence).

---

## 10. Launch checklist

- [ ] Set a real brand name, logo and contact details (`src/brand.ts`)
- [ ] Confirm phone/email/address and opening hours with the business owner
- [ ] Replace sample products, prices, stock, categories and photos with real inventory
- [ ] Replace sample testimonials and remove or verify ratings
- [ ] Provision PostgreSQL, set `DATABASE_URL`, run the first boot, take a backup
- [ ] Set `NODE_ENV=production`, `APP_URL` (HTTPS), `TRUST_PROXY=1`
- [ ] Create a unique admin account; remove demo credentials
- [ ] Add Paystack keys, configure the webhook, run one live test order end-to-end
- [ ] Decide on pay-on-delivery and set `ALLOW_PAY_ON_DELIVERY` accordingly
- [ ] Configure SMTP so password reset email works
- [ ] Configure Cloudinary if staff will upload images
- [ ] Review delivery fees/areas and the policies page with the business
- [ ] Add analytics/error monitoring (e.g. Sentry, Plausible) if desired
- [ ] Test on a real phone: basket → checkout → confirmation → track

---

## 11. Project structure

```
server/
  index.ts        Express app: routes, auth, checkout, admin, security middleware
  db.ts           PostgreSQL + SQLite adapters and schema
  services.ts     Quote/pricing rules, promo logic, stock holds, Paystack verification
  seed.ts         Categories, products, promo, bootstrap admin
src/
  brand.ts        Store identity and contact details
  api.ts          fetch wrapper, money/date/status helpers
  store.tsx       Basket, favourites, session, catalogue context
  components/     Header (+ cart drawer), Footer, ProductCard, Quantity, Stars, UI primitives
  pages/          Home, Shop, Categories, ProductDetail, Cart, Checkout, CheckoutReturn,
                  OrderView, Track, Favorites, Account, Auth, Contact, Policies, Admin, NotFound
public/images/    Seeded product photos and promotional imagery
scripts/          smoke-test.ts
```

---

Questions or changes — the store details in the footer are the business’s real contact points: **0903 442 2971**, **mustaphazakari081@gmail.com**, Rikkos, Jos North, Plateau State, Nigeria.
