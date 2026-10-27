import { requireAdminSession, isStaff } from '@/lib/auth';
import { db } from '@/lib/db';
import { setSetting } from '@/lib/settings';
import { redirectTo, withFlash } from '@/lib/redirect';

const TEXT_KEYS = [
  'store_name',
  'owner_name',
  'support_email',
  'support_phone',
  'location_city',
  'location_state',
  'location_country',
  'landmark',
  'whatsapp',
  'instagram',
  'facebook',
  'twitter',
  'store_hours',
  'announcement',
  'return_window_days',
];

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const form = await request.formData();
  const intent = String(form.get('intent') || 'business');

  if (intent === 'business') {
    for (const key of TEXT_KEYS) {
      const value = form.get(key);
      if (typeof value === 'string') setSetting(key, value.trim());
    }
    const threshold = form.get('free_delivery_threshold');
    if (typeof threshold === 'string' && threshold) {
      setSetting('free_delivery_threshold_kobo', String(Math.round(Number(threshold.replace(/[^0-9.]/g, '')) * 100)));
    }
    return redirectTo(request, withFlash('/admin/settings', 'Store settings saved.'));
  }

  if (intent === 'zones') {
    const ids = form.getAll('zoneId').map(String);
    for (const id of ids) {
      const fee = String(form.get(`fee_${id}`) || '');
      const eta = String(form.get(`eta_${id}`) || '');
      const active = form.get(`active_${id}`) === 'on' ? 1 : 0;
      db.prepare('UPDATE delivery_zones SET fee_kobo = ?, eta = ?, is_active = ? WHERE id = ?').run(
        Math.round(Number(fee.replace(/[^0-9.]/g, '')) * 100) || 0,
        eta,
        active,
        Number(id),
      );
    }
    const newName = String(form.get('newZoneName') || '').trim();
    const newFee = String(form.get('newZoneFee') || '').trim();
    if (newName && newFee) {
      db.prepare(
        'INSERT INTO delivery_zones (name, state, fee_kobo, eta, sort_order) VALUES (?, ?, ?, ?, 99)',
      ).run(
        newName,
        String(form.get('newZoneState') || 'Plateau'),
        Math.round(Number(newFee.replace(/[^0-9.]/g, '')) * 100) || 0,
        String(form.get('newZoneEta') || '2–4 working days'),
      );
    }
    return redirectTo(request, withFlash('/admin/settings', 'Delivery areas updated.'));
  }

  return redirectTo(request, withFlash('/admin/settings', 'Nothing to save.', 'error'));
}
