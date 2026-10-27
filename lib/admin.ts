import { db } from '@/lib/db';

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export type DashboardStats = {
  revenuePaidKobo: number;
  ordersTotal: number;
  ordersPaid: number;
  ordersPending: number;
  ordersDelivered: number;
  ordersFailed: number;
  customers: number;
  lowStock: { product: string; slug: string; size: string; color: string; stock: number }[];
  topProducts: { name: string; slug: string; units: number; revenueKobo: number }[];
  recentOrders: {
    id: number;
    reference: string;
    customer_name: string;
    total_kobo: number;
    payment_status: string;
    status: string;
    created_at: string;
  }[];
  salesByDay: { day: string; total: number; orders: number }[];
  unreadMessages: number;
  subscribers: number;
};

export function getDashboardStats(): DashboardStats {
  const one = <T,>(sql: string, ...params: (string | number)[]) => db.prepare(sql).get(...params) as T | undefined;

  const revenue = one<{ total: number | null }>(
    "SELECT SUM(total_kobo) AS total FROM orders WHERE payment_status = 'paid'",
  );
  const counts = one<{ total: number; paid: number; pending: number; delivered: number; failed: number }>(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid,
            SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
            SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) AS failed
     FROM orders`,
  );
  const customers = one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'");
  const unread = one<{ c: number }>('SELECT COUNT(*) AS c FROM contact_messages WHERE is_read = 0');
  const subs = one<{ c: number }>('SELECT COUNT(*) AS c FROM newsletter_subscribers');

  const lowStock = db
    .prepare(
      `SELECT p.name AS product, p.slug, v.size_label AS size, v.color_slug AS color, v.stock
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.stock <= 2 AND p.is_active = 1
       ORDER BY v.stock ASC, p.name ASC LIMIT 12`,
    )
    .all() as DashboardStats['lowStock'];

  const topProducts = db
    .prepare(
      `SELECT oi.product_name AS name, oi.product_slug AS slug, SUM(oi.qty) AS units,
              SUM(oi.qty * oi.unit_price_kobo) AS revenueKobo
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.payment_status = 'paid'
       GROUP BY oi.product_slug ORDER BY units DESC LIMIT 5`,
    )
    .all() as DashboardStats['topProducts'];

  const recentOrders = db
    .prepare(
      `SELECT id, reference, customer_name, total_kobo, payment_status, status, created_at
       FROM orders ORDER BY id DESC LIMIT 8`,
    )
    .all() as DashboardStats['recentOrders'];

  const salesByDay = db
    .prepare(
      `SELECT date(created_at) AS day, SUM(total_kobo) AS total, COUNT(*) AS orders
       FROM orders WHERE payment_status = 'paid' AND created_at >= date('now','-13 days')
       GROUP BY date(created_at) ORDER BY day`,
    )
    .all() as DashboardStats['salesByDay'];

  return {
    revenuePaidKobo: revenue?.total ?? 0,
    ordersTotal: counts?.total ?? 0,
    ordersPaid: counts?.paid ?? 0,
    ordersPending: counts?.pending ?? 0,
    ordersDelivered: counts?.delivered ?? 0,
    ordersFailed: counts?.failed ?? 0,
    customers: customers?.c ?? 0,
    lowStock,
    topProducts,
    recentOrders,
    salesByDay,
    unreadMessages: unread?.c ?? 0,
    subscribers: subs?.c ?? 0,
  };
}
