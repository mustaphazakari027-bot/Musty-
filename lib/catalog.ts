import { db } from '@/lib/db';

export type ProductColor = { slug: string; name: string; hex: string; filter: string; image: string };
export type ProductSize = { label: string; stock: number };

export type Product = {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  gender: 'men' | 'women' | 'unisex';
  priceKobo: number;
  compareAtKobo: number | null;
  badge: string | null;
  categorySlug: string;
  categoryName: string;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  images: string[];
  colors: ProductColor[];
  sizes: ProductSize[];
  stockTotal: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
};

type BaseRow = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  gender: string;
  price_kobo: number;
  compare_at_kobo: number | null;
  badge: string | null;
  category_slug: string | null;
  category_name: string | null;
  is_new: number;
  is_featured: number;
  is_best_seller: number;
  created_at: string;
};

const BASE_SELECT = `
  SELECT p.id, p.slug, p.name, p.subtitle, p.description, p.gender, p.price_kobo, p.compare_at_kobo, p.badge,
         c.slug AS category_slug, c.name AS category_name,
         p.is_new, p.is_featured, p.is_best_seller, p.created_at
  FROM products p LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = 1
`;

function hydrate(rows: BaseRow[]): Product[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const imageRows = db
    .prepare(`SELECT product_id, url FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`)
    .all(...ids) as { product_id: number; url: string }[];

  const colorRows = db
    .prepare(
      `SELECT pc.product_id, pc.image_url, co.slug, co.name, co.hex, co.filter
       FROM product_colors pc JOIN colors co ON co.slug = pc.color_slug
       WHERE pc.product_id IN (${placeholders}) ORDER BY pc.sort_order, co.sort_order`,
    )
    .all(...ids) as { product_id: number; image_url: string | null; slug: string; name: string; hex: string; filter: string | null }[];

  const variantRows = db
    .prepare(
      `SELECT product_id, color_slug, size_label, stock FROM product_variants
       WHERE product_id IN (${placeholders}) ORDER BY CAST(size_label AS REAL)`,
    )
    .all(...ids) as { product_id: number; color_slug: string; size_label: string; stock: number }[];

  const reviewRows = db
    .prepare(
      `SELECT product_id, COUNT(*) AS count, AVG(rating) AS avg FROM reviews
       WHERE is_published = 1 AND product_id IN (${placeholders}) GROUP BY product_id`,
    )
    .all(...ids) as { product_id: number; count: number; avg: number }[];

  const images = new Map<number, string[]>();
  imageRows.forEach((r) => images.set(r.product_id, [...(images.get(r.product_id) ?? []), r.url]));

  const colors = new Map<number, ProductColor[]>();
  colorRows.forEach((r) =>
    colors.set(r.product_id, [
      ...(colors.get(r.product_id) ?? []),
      { slug: r.slug, name: r.name, hex: r.hex, filter: r.filter || 'none', image: r.image_url || images.get(r.product_id)?.[0] || '' },
    ]),
  );

  const sizes = new Map<number, ProductSize[]>();
  const stockTotals = new Map<number, number>();
  variantRows.forEach((r) => {
    const list = sizes.get(r.product_id) ?? [];
    const existing = list.find((s) => s.label === r.size_label);
    if (existing) existing.stock += r.stock;
    else list.push({ label: r.size_label, stock: r.stock });
    sizes.set(r.product_id, list);
    stockTotals.set(r.product_id, (stockTotals.get(r.product_id) ?? 0) + r.stock);
  });

  const ratings = new Map(reviewRows.map((r) => [r.product_id, { count: r.count, avg: r.avg }]));

  return rows.map((r) => {
    const ratingInfo = ratings.get(r.id);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      subtitle: r.subtitle ?? '',
      description: r.description,
      gender: (r.gender as Product['gender']) ?? 'unisex',
      priceKobo: r.price_kobo,
      compareAtKobo: r.compare_at_kobo,
      badge: r.badge,
      categorySlug: r.category_slug ?? '',
      categoryName: r.category_name ?? '',
      isNew: !!r.is_new,
      isFeatured: !!r.is_featured,
      isBestSeller: !!r.is_best_seller,
      images: images.get(r.id) ?? [],
      colors: colors.get(r.id) ?? [],
      sizes: sizes.get(r.id) ?? [],
      stockTotal: stockTotals.get(r.id) ?? 0,
      rating: ratingInfo ? Math.round(ratingInfo.avg * 10) / 10 : 0,
      reviewCount: ratingInfo?.count ?? 0,
      createdAt: r.created_at,
    };
  });
}

export type ProductQuery = {
  q?: string;
  gender?: string[];
  category?: string[];
  size?: string[];
  color?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sort?: string;
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
  limit?: number;
};

export function queryProducts(filters: ProductQuery = {}): Product[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.q) {
    clauses.push('(p.name LIKE ? OR p.description LIKE ? OR p.subtitle LIKE ?)');
    const like = `%${filters.q}%`;
    params.push(like, like, like);
  }
  if (filters.gender?.length) {
    clauses.push(`(p.gender IN (${filters.gender.map(() => '?').join(',')}) OR p.gender = 'unisex')`);
    params.push(...filters.gender);
  }
  if (filters.category?.length) {
    clauses.push(`c.slug IN (${filters.category.map(() => '?').join(',')})`);
    params.push(...filters.category);
  }
  if (filters.minPrice != null) {
    clauses.push('p.price_kobo >= ?');
    params.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    clauses.push('p.price_kobo <= ?');
    params.push(filters.maxPrice);
  }
  if (filters.featured) clauses.push('p.is_featured = 1');
  if (filters.bestSeller) clauses.push('p.is_best_seller = 1');
  if (filters.isNew) clauses.push('p.is_new = 1');

  if (filters.size?.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.stock > 0 AND v.size_label IN (${filters.size
        .map(() => '?')
        .join(',')}))`,
    );
    params.push(...filters.size);
  }
  if (filters.color?.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM product_colors pc WHERE pc.product_id = p.id AND pc.color_slug IN (${filters.color
        .map(() => '?')
        .join(',')}))`,
    );
    params.push(...filters.color);
  }
  if (filters.inStock) {
    clauses.push('EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.stock > 0)');
  }
  if (filters.rating) {
    clauses.push(
      `(SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id AND r.is_published = 1) >= ?`,
    );
    params.push(filters.rating);
  }

  const where = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
  const order =
    {
      'price-asc': 'p.price_kobo ASC',
      'price-desc': 'p.price_kobo DESC',
      newest: 'p.created_at DESC, p.id DESC',
      popular: 'p.is_best_seller DESC, p.is_featured DESC, p.id ASC',
      rating: '(SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) DESC NULLS LAST, p.id ASC',
      featured: 'p.is_featured DESC, p.id ASC',
    }[filters.sort ?? 'featured'] ?? 'p.is_featured DESC, p.id ASC';

  const limit = filters.limit ? ` LIMIT ${Number(filters.limit)}` : '';
  const rows = db.prepare(`${BASE_SELECT}${where} ORDER BY ${order}${limit}`).all(...params) as BaseRow[];
  return hydrate(rows);
}

export function getProductBySlug(slug: string): Product | null {
  const row = db.prepare(`${BASE_SELECT} AND p.slug = ?`).get(slug) as BaseRow | undefined;
  if (!row) return null;
  return hydrate([row])[0] ?? null;
}

export function getProductById(id: number): Product | null {
  const row = db.prepare(`${BASE_SELECT} AND p.id = ?`).get(id) as BaseRow | undefined;
  if (!row) return null;
  return hydrate([row])[0] ?? null;
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const rows = db
    .prepare(
      `${BASE_SELECT} AND p.id != ? AND (c.slug = ? OR p.gender = ?)
       ORDER BY (c.slug = ?) DESC, p.is_featured DESC LIMIT ?`,
    )
    .all(product.id, product.categorySlug, product.gender, product.categorySlug, limit) as BaseRow[];
  return hydrate(rows);
}

export function getCategories() {
  return db
    .prepare('SELECT id, slug, name, description, icon FROM categories ORDER BY sort_order')
    .all() as { id: number; slug: string; name: string; description: string; icon: string }[];
}

export function getColors() {
  return db.prepare('SELECT slug, name, hex, filter FROM colors ORDER BY sort_order').all() as {
    slug: string;
    name: string;
    hex: string;
    filter: string;
  }[];
}

export function getAllSizes() {
  return db.prepare('SELECT label, sort_order FROM sizes ORDER BY sort_order').all() as {
    label: string;
    sort_order: number;
  }[];
}

export function getVariantStock(productId: number, colorSlug: string, sizeLabel: string) {
  const row = db
    .prepare('SELECT stock FROM product_variants WHERE product_id = ? AND color_slug = ? AND size_label = ?')
    .get(productId, colorSlug, sizeLabel) as { stock: number } | undefined;
  return row?.stock ?? 0;
}

export function getPublishedReviews(productId: number) {
  return db
    .prepare(
      `SELECT id, author, rating, title, body, is_verified, is_sample, created_at
       FROM reviews WHERE product_id = ? AND is_published = 1 ORDER BY created_at DESC`,
    )
    .all(productId) as {
    id: number;
    author: string;
    rating: number;
    title: string | null;
    body: string;
    is_verified: number;
    is_sample: number;
    created_at: string;
  }[];
}

export function getFeaturedReviews(limit = 3) {
  return db
    .prepare(
      `SELECT r.id, r.author, r.rating, r.title, r.body, r.is_sample, p.name AS product_name, p.slug AS product_slug
       FROM reviews r JOIN products p ON p.id = r.product_id
       WHERE r.is_published = 1 AND r.rating >= 4 ORDER BY r.is_sample ASC, r.rating DESC, r.created_at DESC LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    author: string;
    rating: number;
    title: string | null;
    body: string;
    is_sample: number;
    product_name: string;
    product_slug: string;
  }[];
}

export function getDeliveryZones() {
  return db
    .prepare(
      'SELECT id, name, state, fee_kobo, eta FROM delivery_zones WHERE is_active = 1 ORDER BY sort_order, id',
    )
    .all() as { id: number; name: string; state: string; fee_kobo: number; eta: string }[];
}

export function getCoupon(code: string) {
  if (!code) return null;
  return (
    (db
      .prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)')
      .get(code.trim()) as
      | {
          id: number;
          code: string;
          description: string | null;
          type: 'percent' | 'fixed';
          value: number;
          min_subtotal_kobo: number;
          max_uses: number | null;
          uses: number;
          expires_at: string | null;
          is_active: number;
        }
      | undefined) ?? null
  );
}
