import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { forgotSchema, zodMessage } from '@/lib/validate';
import { sendMail } from '@/lib/notify';
import { redirectTo, withFlash } from '@/lib/redirect';
import { clientIp, rateLimit } from '@/lib/http';
import { siteUrl } from '@/lib/payments';
import { getStoreInfo } from '@/lib/settings';

/**
 * Creates a single-use reset token. The response is intentionally identical
 * whether or not the email exists, to avoid account enumeration.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const limit = rateLimit(`forgot:${clientIp(request)}`, 5, 15 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/account/forgot', 'Too many requests. Try again later.', 'error'));
  }

  const parsed = forgotSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/account/forgot', zodMessage(parsed.error), 'error'));
  }

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(parsed.data.email) as
    | { id: number; name: string; email: string }
    | undefined;

  if (user) {
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expires);

    const link = `${siteUrl()}/account/reset?token=${token}`;
    const result = await sendMail({
      to: user.email,
      subject: 'Reset your Zakson password',
      text: `Hello ${user.name},\n\nUse this link to set a new Zakson password (valid for 1 hour):\n${link}\n\nIf you did not request this, ignore this email.\n\nZakson · ${getStoreInfo().phone}`,
    });
    // Without an email provider the link is logged so the owner can test locally.
    if (!result.sent) console.info(`[password-reset] ${user.email}: ${link}`);
  }

  const message = process.env.RESEND_API_KEY || process.env.SMTP_HOST
    ? 'If that email is registered, a reset link is on its way.'
    : 'Email delivery is not configured on this deployment. Contact support at mustaphazakari081@gmail.com to reset your password.';
  return redirectTo(request, withFlash('/account/forgot', message, process.env.RESEND_API_KEY || process.env.SMTP_HOST ? 'ok' : 'error'));
}
