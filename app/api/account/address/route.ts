import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { addressSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const session = await getSession();
  if (!session) return redirectTo(request, '/account/login?next=/account');

  const intent = String(form.get('intent') || 'create');

  if (intent === 'delete') {
    const id = Number(form.get('id'));
    db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, session.id);
    return redirectTo(request, withFlash('/account#addresses', 'Address removed.'));
  }

  const parsed = addressSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return redirectTo(request, withFlash('/account#addresses', zodMessage(parsed.error), 'error'));

  const data = parsed.data;
  db.transaction(() => {
    if (data.isDefault) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(session.id);
    db.prepare(
      'INSERT INTO addresses (user_id, label, full_name, phone, address, state, city, landmark, instructions, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(
      session.id,
      data.label || 'Home',
      data.fullName,
      data.phone,
      data.address,
      data.state,
      data.city,
      data.landmark || null,
      data.instructions || null,
      data.isDefault ? 1 : 0,
    );
  })();

  return redirectTo(request, withFlash('/account#addresses', 'Delivery address saved.'));
}
