import { db } from '@/lib/db';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const form = await request.formData();
  const intent = String(form.get('intent') || 'create');

  if (intent === 'toggle') {
    const id = Number(form.get('id'));
    db.prepare('UPDATE coupons SET is_active = 1 - is_active WHERE id = ?').run(id);
    return redirectTo(request, withFlash('/admin/coupons', 'Coupon updated.'));
  }

  if (intent === 'delete') {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(Number(form.get('id')));
    return redirectTo(request, withFlash('/admin/coupons', 'Coupon deleted.'));
  }

  const code = String(form.get('code') || '').trim().toUpperCase();
  const type = String(form.get('type') || 'percent');
  const value = Number(form.get('value'));
  const minSubtotal = Math.round(Number(String(form.get('minSubtotal') || '0').replace(/[^0-9.]/g, '')) * 100);
  const maxUsesRaw = String(form.get('maxUses') || '').trim();
  const expires = String(form.get('expires') || '').trim();

  if (!/^[A-Z0-9-]{3,24}$/.test(code)) {
    return redirectTo(request, withFlash('/admin/coupons', 'Use a code of 3–24 letters, numbers or dashes.', 'error'));
  }
  if (!Number.isFinite(value) || value <= 0) {
    return redirectTo(request, withFlash('/admin/coupons', 'Enter a discount value greater than zero.', 'error'));
  }
  if (type === 'percent' && value > 90) {
    return redirectTo(request, withFlash('/admin/coupons', 'Percentage discounts are capped at 90%.', 'error'));
  }
  if (db.prepare('SELECT id FROM coupons WHERE UPPER(code) = ?').get(code)) {
    return redirectTo(request, withFlash('/admin/coupons', 'That code already exists.', 'error'));
  }

  db.prepare(
    `INSERT INTO coupons (code, description, type, value, min_subtotal_kobo, max_uses, expires_at, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
  ).run(
    code,
    String(form.get('description') || '') || null,
    type === 'fixed' ? 'fixed' : 'percent',
    value,
    minSubtotal || 0,
    maxUsesRaw ? Number(maxUsesRaw) : null,
    expires ? new Date(expires).toISOString() : null,
  );

  return redirectTo(request, withFlash('/admin/coupons', `Coupon ${code} created.`));
}
