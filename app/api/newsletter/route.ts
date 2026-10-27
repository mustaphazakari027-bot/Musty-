import { db } from '@/lib/db';
import { newsletterSchema } from '@/lib/validate';
import { clientIp, jsonError, jsonOk, rateLimit } from '@/lib/http';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const next = String(form.get('next') || '/');

  const limit = rateLimit(`newsletter:${clientIp(request)}`, 6, 10 * 60_000);
  if (!limit.allowed) {
    return wantsJson ? jsonError('Too many attempts. Try again later.', 429) : redirectTo(request, withFlash(next, 'Too many attempts.', 'error'));
  }

  const parsed = newsletterSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Enter a valid email address.';
    return wantsJson ? jsonError(message) : redirectTo(request, withFlash(next, message, 'error'));
  }

  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(parsed.data.email);
  const message = 'You are on the list. Watch your inbox for new drops.';
  return wantsJson ? jsonOk({ message }) : redirectTo(request, withFlash(next, message));
}
