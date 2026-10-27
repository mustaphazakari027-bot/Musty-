import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { resetSchema, zodMessage } from '@/lib/validate';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = resetSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/account/forgot', zodMessage(parsed.error), 'error'));
  }

  const row = db
    .prepare('SELECT token, user_id, expires_at, used_at FROM password_resets WHERE token = ?')
    .get(parsed.data.token) as { token: string; user_id: number; expires_at: string; used_at: string | null } | undefined;

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return redirectTo(request, withFlash('/account/forgot', 'That reset link is invalid or has expired.', 'error'));
  }

  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(parsed.data.password), row.user_id);
    db.prepare("UPDATE password_resets SET used_at = datetime('now') WHERE token = ?").run(row.token);
  })();

  return redirectTo(request, withFlash('/account/login', 'Password updated. You can sign in now.'));
}
