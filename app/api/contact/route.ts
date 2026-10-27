import { db } from '@/lib/db';
import { contactSchema, zodMessage } from '@/lib/validate';
import { clientIp, rateLimit } from '@/lib/http';
import { redirectTo, withFlash } from '@/lib/redirect';
import { sendMail } from '@/lib/notify';
import { getStoreInfo } from '@/lib/settings';

/** Persists every enquiry, then attempts an email notification to the store owner. */
export async function POST(request: Request) {
  const form = await request.formData();
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000);
  if (!limit.allowed) {
    return redirectTo(request, withFlash('/contact', 'You have sent several messages already. Please try again later.', 'error'));
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return redirectTo(request, withFlash('/contact', zodMessage(parsed.error), 'error'));
  }

  const { name, email, phone, subject, message } = parsed.data;
  db.prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(
    name,
    email,
    phone || null,
    subject,
    message,
  );

  const store = getStoreInfo();
  const mail = await sendMail({
    to: store.email,
    replyTo: email,
    subject: `[Zakson contact] ${subject}`,
    text: `From: ${name} <${email}>${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`,
  });

  return redirectTo(
    request,
    withFlash(
      '/contact',
      mail.sent
        ? 'Thank you — your message has been sent. We reply within one working day.'
        : 'Thank you — your message has been saved and our team will follow up. (Email notifications are not configured on this deployment.)',
    ),
  );
}
