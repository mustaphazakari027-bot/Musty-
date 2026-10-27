import { db } from '@/lib/db';
import { createSession, hashPassword } from '@/lib/auth';
import { registerSchema, zodMessage } from '@/lib/validate';
import { attachCartToUser } from '@/lib/cart';
import { redirectTo, safePath, withFlash } from '@/lib/redirect';
import { clientIp, rateLimit } from '@/lib/http';

export async function POST(request: Request) {
  const form = await request.formData();
  const next = safePath(form.get('next'), '/account');

  const limit = rateLimit(`register:${clientIp(request)}`, 6, 10 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/account/register', 'Too many attempts. Try again shortly.', 'error'));
  }

  const parsed = registerSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(
      request,
      withFlash(`/account/register?next=${encodeURIComponent(next)}`, zodMessage(parsed.error), 'error'),
    );
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email);
  if (existing) {
    return redirectTo(
      request,
      withFlash('/account/login', 'An account with that email already exists. Please sign in.', 'error'),
    );
  }

  const info = db
    .prepare('INSERT INTO users (email, name, phone, password_hash) VALUES (?, ?, ?, ?)')
    .run(parsed.data.email, parsed.data.name, parsed.data.phone || null, hashPassword(parsed.data.password));

  const userId = Number(info.lastInsertRowid);
  await createSession({ id: userId, email: parsed.data.email, name: parsed.data.name, role: 'customer' });
  await attachCartToUser(userId);

  return redirectTo(request, withFlash(next, `Welcome to Zakson, ${parsed.data.name.split(' ')[0]}!`));
}
