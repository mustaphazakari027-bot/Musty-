import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirectTo, withFlash } from '@/lib/redirect';
import { isValidNigerianPhone, normalisePhone } from '@/lib/pricing.mjs';

export async function POST(request: Request) {
  const form = await request.formData();
  const session = await getSession();
  if (!session) return redirectTo(request, '/account/login?next=/account');

  const name = String(form.get('name') || '').trim();
  const phone = String(form.get('phone') || '').trim();

  if (name.length < 2) return redirectTo(request, withFlash('/account', 'Enter your full name.', 'error'));
  if (phone && !isValidNigerianPhone(phone)) {
    return redirectTo(request, withFlash('/account', 'Enter a valid Nigerian phone number.', 'error'));
  }

  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone ? normalisePhone(phone) : null, session.id);
  return redirectTo(request, withFlash('/account', 'Profile updated.'));
}
