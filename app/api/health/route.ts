import { db } from '@/lib/db';
import { activeProvider, demoPaymentsEnabled } from '@/lib/payments';

export async function GET() {
  const products = db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number };
  return Response.json({
    ok: true,
    service: 'zakson',
    time: new Date().toISOString(),
    products: products.c,
    payments: { provider: activeProvider(), demoAllowed: demoPaymentsEnabled() },
  });
}
