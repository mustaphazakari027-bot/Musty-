import { db } from '@/lib/db';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return redirectTo(request, '/account/login?next=/admin', 303);

  const form = await request.formData();
  const id = Number(form.get('id'));
  if (Number.isFinite(id)) {
    db.prepare('UPDATE contact_messages SET is_read = 1 - is_read WHERE id = ?').run(id);
  }
  return redirectTo(request, withFlash('/admin/messages', 'Message updated.'));
}
