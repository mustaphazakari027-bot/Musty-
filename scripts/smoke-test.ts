/**
 * End-to-end API smoke test. Run against a running server:
 *   npm run dev        # terminal 1
 *   npm test           # terminal 2
 * Optional: BASE_URL=https://your-preview-url npm test
 * It creates a throwaway customer + COD order, so use a demo database — not production.
 */
export {};
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
let passed = 0, failed = 0;
const ok = (label: string, condition: unknown, detail?: unknown) => {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`, detail ?? ''); }
};
const call = async (path: string, init: RequestInit & { cookie?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (init.cookie) headers.set('Cookie', init.cookie);
  const res = await fetch(`${BASE}/api${path}`, { ...init, headers, redirect: 'manual' });
  const text = await res.text();
  let body: any = null; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body, cookie: res.headers.get('set-cookie')?.split(';')[0] || '' };
};
const email = `smoke.${Date.now()}@example.com`;
const deliveryDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

console.log(`\nRikkos Fresh API smoke test → ${BASE}\n`);
console.log('Catalogue');
const cats = await call('/categories');
ok('categories load (8 expected)', cats.status === 200 && cats.body.length >= 8, cats.status);
const products = await call('/products?limit=4&sort=price-low');
ok('products load with paging metadata', products.status === 200 && products.body.products.length === 4 && products.body.total >= 22);
const search = await call('/products?search=avocado');
ok('search returns the avocado', search.body.products.some((p: any) => p.id === 'fresh-avocado'));

console.log('Basket and pricing');
const quote = await call('/quote', { method: 'POST', body: JSON.stringify({ items: [{ id: 'fresh-avocado', quantity: 2 }] }) });
ok('server recalculates a quote', quote.status === 200 && quote.body.total === quote.body.subtotal - quote.body.discount + quote.body.delivery_fee, quote.body);
const promo = await call('/quote', { method: 'POST', body: JSON.stringify({ items: [{ id: 'long-grain-rice', quantity: 2 }], promo: 'FRESH10' }) });
ok('valid promo is applied server-side', promo.body.promo_code === 'FRESH10' && promo.body.discount > 0, promo.body);
const badPromo = await call('/quote', { method: 'POST', body: JSON.stringify({ items: [{ id: 'fresh-avocado', quantity: 1 }], promo: 'FRESH10' }) });
ok('promo below the minimum is rejected with a reason', badPromo.body.promo_error?.length > 0, badPromo.body);

console.log('Security guards');
const noHeader = await fetch(`${BASE}/api/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"items":[]}' });
ok('POST without the anti-forgery header is refused (403)', noHeader.status === 403, noHeader.status);
const anonAdmin = await call('/admin/orders');
ok('admin API refuses anonymous requests (401)', anonAdmin.status === 401, anonAdmin.status);

console.log('Accounts');
const reg = await call('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Smoke Tester', email, phone: '08030000000', password: 'SmokeTest!2026' }) });
ok('customer can register and receives a session', reg.status === 201 && reg.cookie.startsWith('rf_session='), reg.status);
const session = await call('/auth/session', { cookie: reg.cookie });
ok('session resolves the new customer', session.body.user?.email === email);
const blockedAdmin = await call('/admin/overview', { cookie: reg.cookie });
ok('customer session cannot reach admin data (403)', blockedAdmin.status === 403, blockedAdmin.status);

console.log('Checkout');
const order = await call('/checkout', { method: 'POST', cookie: reg.cookie, body: JSON.stringify({
  items: [{ id: 'fresh-avocado', quantity: 1 }, { id: 'sweet-bananas', quantity: 2 }],
  promo: '', delivery: 'standard', name: 'Smoke Tester', email, phone: '08030000000',
  address: '14 Rikkos Road, Rikkos, Jos North', instructions: 'Smoke test order',
  delivery_date: deliveryDate, delivery_time: '9am – 12pm', payment: 'cod'
}) });
const accepted = order.status === 201 || (order.status === 503 && /pay on delivery/i.test(order.body?.error || ''));
ok('checkout creates a pay-on-delivery order (or is disabled by config)', accepted, { status: order.status, body: order.body });
if (order.status === 201) {
  const reference = order.body.reference;
  const mine = await call(`/orders/${reference}`, { cookie: reg.cookie });
  ok('customer can read their own order', mine.status === 200 && mine.body.reference === reference);
  const anon = await call(`/orders/${reference}`);
  ok('anonymous visitors cannot read an order (404)', anon.status === 404, anon.status);
  const tokenView = await fetch(`${BASE}/api/orders/${reference}`, { headers: { 'x-order-token': order.body.token } });
  ok('guest order token grants receipt access', tokenView.status === 200);
  const history = await call('/account/orders', { cookie: reg.cookie });
  ok('order appears in account history', history.body.some((o: any) => o.reference === reference));
  const tracked = await call('/track', { method: 'POST', body: JSON.stringify({ reference, email }) });
  ok('guest can track with reference + email', tracked.status === 200 && tracked.body.reference === reference);
}

console.log('Other public endpoints');
const contact = await call('/contact', { method: 'POST', body: JSON.stringify({ name: 'Smoke', email, subject: 'Smoke test', message: 'This message is written by the automated smoke test.', website: '' }) });
ok('contact form stores a message', contact.status === 200);
const news = await call('/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
ok('newsletter subscription works', news.status === 200);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
