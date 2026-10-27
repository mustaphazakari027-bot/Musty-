-- ─────────────────────────────────────────────────────────────────────────────
-- Zakson — PostgreSQL / Supabase schema (mirror of lib/schema.ts)
-- Run with:  psql "$DATABASE_URL" -f docs/schema-postgres.sql
--            (or paste into the Supabase SQL editor)
-- Money is stored in kobo (integers) exactly like the SQLite version.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order int not null default 0
);

create table if not exists products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  subtitle text,
  description text not null,
  category_id bigint references categories(id),
  gender text not null default 'unisex' check (gender in ('men','women','unisex')),
  price_kobo bigint not null check (price_kobo >= 0),
  compare_at_kobo bigint check (compare_at_kobo is null or compare_at_kobo >= 0),
  badge text,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  url text not null,
  alt text,
  color_slug text,
  sort_order int not null default 0
);

create table if not exists colors (
  slug text primary key,
  name text not null,
  hex text not null,
  filter text,
  sort_order int not null default 0
);

create table if not exists product_colors (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  color_slug text not null references colors(slug),
  image_url text,
  is_default boolean not null default false,
  sort_order int not null default 0,
  unique (product_id, color_slug)
);

create table if not exists sizes (
  label text primary key,
  sort_order int not null,
  system text not null default 'UK'
);

create table if not exists product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  color_slug text not null,
  size_label text not null,
  sku text not null unique,
  stock int not null default 0 check (stock >= 0),
  unique (product_id, color_slug, size_label)
);

create table if not exists users (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null,
  phone text,
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer','staff','admin')),
  created_at timestamptz not null default now()
);

create table if not exists password_resets (
  token text primary key,
  user_id bigint not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists addresses (
  id bigint generated always as identity primary key,
  user_id bigint not null references users(id) on delete cascade,
  label text,
  full_name text not null,
  phone text not null,
  address text not null,
  state text not null,
  city text not null,
  landmark text,
  instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id bigint generated always as identity primary key,
  token text not null unique,
  user_id bigint references users(id) on delete set null,
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id bigint generated always as identity primary key,
  cart_id bigint not null references carts(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  color_slug text not null,
  size_label text not null,
  qty int not null default 1 check (qty > 0),
  unit_price_kobo bigint not null,
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, color_slug, size_label)
);

create table if not exists delivery_zones (
  id bigint generated always as identity primary key,
  name text not null,
  state text not null,
  fee_kobo bigint not null,
  eta text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists coupons (
  id bigint generated always as identity primary key,
  code text not null unique,
  description text,
  type text not null default 'percent' check (type in ('percent','fixed')),
  value numeric(12,2) not null,
  min_subtotal_kobo bigint not null default 0,
  max_uses int,
  uses int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  reference text not null unique,
  access_token text not null,
  user_id bigint references users(id) on delete set null,
  status text not null default 'received',
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  payment_provider text,
  payment_reference text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_state text not null,
  delivery_city text not null,
  delivery_landmark text,
  delivery_instructions text,
  delivery_zone_name text,
  delivery_fee_kobo bigint not null default 0,
  subtotal_kobo bigint not null,
  discount_kobo bigint not null default 0,
  total_kobo bigint not null,
  coupon_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  category_name text,
  color_slug text not null,
  color_name text not null,
  size_label text not null,
  image_url text,
  qty int not null,
  unit_price_kobo bigint not null
);

create table if not exists order_events (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  provider text not null,
  reference text not null,
  status text not null default 'pending',
  amount_kobo bigint not null,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  user_id bigint references users(id) on delete set null,
  author text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  is_verified boolean not null default false,
  is_sample boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists wishlist_items (
  user_id bigint not null references users(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_active on products(is_active);
create index if not exists idx_variants_product on product_variants(product_id);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_reviews_product on reviews(product_id);

-- Row level security: this app talks to Postgres with a server-side service role,
-- so RLS should stay enabled with no public policies.
-- alter table products enable row level security;  (repeat per table)
