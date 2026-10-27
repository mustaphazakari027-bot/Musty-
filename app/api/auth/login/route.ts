import { db } from '@/lib/db';
import { createSession, verifyPassword, type Role } from '@/lib/auth';
import { loginSchema, zodMessage } from '@/lib/validate';
import { attachCartToUser } from '@/lib/cart';
import { redirectTo, safePath, withFlash } from '@/lib/redirect';
import { clientIp, rateLimit } from '@/lib/http';

export async function POST(request: Request) {
  const form = await request.formData();
  const next = safePath(form.get('next'), '/account');

  const limit = rateLimit(`login:${clientIp(request)}`, 10, 10 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/account/login', 'Too many attempts. Please try again in a few minutes.', 'error'));
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/account/login', zodMessage(parsed.error), 'error'));
  }

  const user = db
    .prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?')
    .get(parsed.data.email) as
    | { id: number; email: string; name: string; role: Role; password_hash: string }
    | undefined;

  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return redirectTo(request, withFlash('/account/login', 'Email or password is incorrect.', 'error'));
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  await attachCartToUser(user.id);

  const destination = user.role === 'admin' || user.role === 'staff' ? '/admin' : next;
  return redirectTo(request, withFlash(destination, `Welcome back, ${user.name.split(' ')[0]}.`));
}
