/**
 * Transactional email.
 *
 * The store works without any email credentials: messages are always persisted in
 * SQLite (contact_messages / orders) so nothing is lost. If you configure a
 * provider, an email is also dispatched. Two options are supported out of the box:
 *   • RESEND_API_KEY  – Resend HTTP API (no extra dependency)
 *   • SMTP_HOST/...   – requires `npm i nodemailer` (see README)
 */
type Mail = { to: string; subject: string; text: string; replyTo?: string };

const FROM = process.env.MAIL_FROM || 'Zakson <no-reply@zakson.ng>';

export async function sendMail(mail: Mail): Promise<{ sent: boolean; reason?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [mail.to],
          subject: mail.subject,
          text: mail.text,
          reply_to: mail.replyTo,
        }),
      });
      if (!res.ok) return { sent: false, reason: `Resend responded ${res.status}` };
      return { sent: true };
    } catch (error) {
      return { sent: false, reason: (error as Error).message };
    }
  }

  if (process.env.SMTP_HOST) {
    // Optional dependency — install nodemailer before enabling SMTP.
    try {
      const moduleName = 'nodemailer';
      const mod = (await import(/* webpackIgnore: true */ moduleName)) as {
        default: { createTransport: (opts: unknown) => { sendMail: (m: unknown) => Promise<unknown> } };
      };
      const transport = mod.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transport.sendMail({ from: FROM, ...mail });
      return { sent: true };
    } catch (error) {
      return { sent: false, reason: `SMTP not configured: ${(error as Error).message}` };
    }
  }

  // No provider configured — log in development so the flow is observable.
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[mail:skipped] ${mail.subject} -> ${mail.to}`);
  }
  return { sent: false, reason: 'No email provider configured' };
}

export function orderConfirmationText(order: {
  reference: string;
  customer_name: string;
  total_kobo: number;
  delivery_city: string;
  delivery_state: string;
}) {
  return [
    `Hello ${order.customer_name},`,
    '',
    `Thank you for shopping with Zakson. We have received your order ${order.reference}.`,
    `Total: ₦${(order.total_kobo / 100).toLocaleString('en-NG')}`,
    `Delivery to: ${order.delivery_city}, ${order.delivery_state}`,
    '',
    'We will send you an update as soon as payment is confirmed and your shoes are on the way.',
    '',
    'Zakson — Jos North, Plateau State',
    'Phone: 09034422971',
  ].join('\n');
}
