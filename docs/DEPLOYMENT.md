# Zakson — deployment & go-live notes

Short, practical version of the README deployment section. Everything here assumes you already ran the
store locally (`npm install && npm run dev`) and placed at least one test order.

---

## 0. Decide where it will run

| Option | Database | Notes |
| --- | --- | --- |
| **VPS / Render / Railway / Fly.io** (recommended first launch) | SQLite in `.data/` on a persistent volume | Zero database work, one process, cheapest. |
| **Vercel** | Postgres (Supabase/Neon) | Best CDN performance, but **SQLite cannot persist** on Vercel. Migrate first (see `docs/schema-postgres.sql`). |
| **Supabase + Vercel** | Supabase Postgres | Add `@supabase/supabase-js`, replace `lib/db.ts` query layer. |

A `Dockerfile` is included for the VPS option:

```bash
docker build -t zakson .
docker run -d -p 3000:3000 --env-file .env.production -v zakson-data:/app/.data --name zakson zakson
```

---

## 1. Environment for production

```env
NEXT_PUBLIC_SITE_URL=https://zakson.ng
AUTH_SECRET=<64 random chars — openssl rand -hex 32>
DATA_DIR=/app/.data
ADMIN_EMAIL=mustaphazakari081@gmail.com
ADMIN_PASSWORD="<strong password>"
ADMIN_NAME="Musty Zakari"

PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYMENT_PROVIDER=paystack
ALLOW_DEMO_PAYMENTS=false

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_UPLOAD_FOLDER=zakson/products

RESEND_API_KEY=re_xxx
MAIL_FROM="Zakson <no-reply@zakson.ng>"
```

Rule of thumb: **anything that ends in `_SECRET_KEY` or `_API_SECRET` stays server-side.** This project
never imports them into a client component, and `.env.local` is git-ignored.

---

## 2. Paystack (or Flutterwave)

1. Create the business account and complete KYC (required before live keys are issued).
2. Copy the **live** secret key into `PAYSTACK_SECRET_KEY`.
3. Settings → Webhooks → `https://YOUR_DOMAIN/api/payments/webhook`.
4. Make one real ₦100-ish test order, confirm:
   * order shows **paid** on `/checkout/complete`,
   * `/admin/orders` shows the payment record,
   * stock decreased by the ordered quantity,
   * the webhook delivery log on Paystack shows HTTP 200.
5. Flutterwave equivalent: `FLUTTERWAVE_SECRET_KEY` + a webhook secret hash in `FLUTTERWAVE_WEBHOOK_HASH`.

Never enable "payment on delivery" in the UI unless you actually operate it — the code intentionally does
not advertise it.

---

## 3. Cloudinary

1. Create a cloud, then copy cloud name, API key and API secret into the environment.
2. Create the folder `zakson/products` (or whatever `CLOUDINARY_UPLOAD_FOLDER` says).
3. In `/admin/products/[id]`, upload an image — the browser posts the file to
   `/api/admin/upload`, which signs the request with the API secret and forwards it. The secret is never
   sent to the browser.
4. Without Cloudinary in production, uploads return HTTP 501 and you can still paste image URLs.

---

## 4. Email

* **Resend**: create a key, verify your domain, set `RESEND_API_KEY` and `MAIL_FROM`.
* **SMTP**: `npm i nodemailer` then set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
* With neither configured, contact messages are stored in `/admin/messages`, order confirmations still
  render on screen, and password-reset links are logged to the server console (never emailed).

---

## 5. Backups & operations

```bash
# nightly SQLite backup (cron)
sqlite3 /app/.data/zakson.db ".backup '/backups/zakson-$(date +%F).db'"
```

* Keep `.data/` on a volume that survives deploys.
* Rotate the admin password after handing the store over.
* Watch `/admin` low-stock alerts and `/api/health` for uptime checks.
* Review `/admin/messages` daily — nothing is auto-forwarded without email configured.

---

## 6. Post-launch SEO

1. Submit `https://YOUR_DOMAIN/sitemap.xml` in Google Search Console.
2. Confirm the structured data with the Rich Results test (Product + FAQ + Store).
3. Keep product URLs stable (`/product/<slug>`) — changing a slug breaks links and rankings.
4. Target local terms already present in the copy: *running shoes in Jos*, *sports shoes Plateau State*,
   *buy sneakers online Nigeria*.
