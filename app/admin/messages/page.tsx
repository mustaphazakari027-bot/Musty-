import { db } from '@/lib/db';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const messages = db
    .prepare('SELECT * FROM contact_messages ORDER BY is_read ASC, id DESC LIMIT 100')
    .all() as {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    is_read: number;
    created_at: string;
  }[];

  const subscribers = db
    .prepare('SELECT email, created_at FROM newsletter_subscribers ORDER BY id DESC LIMIT 30')
    .all() as { email: string; created_at: string }[];

  return (
    <div className="space-y-4">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/messages" />
      <header>
        <h1 className="text-[24px] font-extrabold">Support inbox</h1>
        <p className="mt-1 text-[12.5px] text-ink/50">
          {messages.filter((m) => !m.is_read).length} unread · every contact form submission is stored here.
        </p>
      </header>

      <div className="space-y-2.5">
        {messages.length === 0 && <p className="card p-6 text-center text-[12px] text-ink/45">No messages yet.</p>}
        {messages.map((m) => (
          <article key={m.id} className={`card p-4 ${m.is_read ? '' : 'border-emerald/30 bg-emerald/5'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-bold text-ink">
                  {m.subject} {!m.is_read && <span className="ml-1 rounded-full bg-emerald px-2 py-0.5 text-[9px] font-bold uppercase text-white">New</span>}
                </p>
                <p className="text-[11px] text-ink/45">
                  {m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <time className="text-[10.5px] text-ink/35">
                  {new Date(m.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </time>
                <form action="/api/admin/messages" method="post">
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-[10.5px] font-semibold text-emerald hover:underline">
                    {m.is_read ? 'Mark unread' : 'Mark read'}
                  </button>
                </form>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-ink/60">{m.message}</p>
            <a
              href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
              className="mt-2 inline-block text-[11px] font-semibold text-forest underline"
            >
              Reply by email
            </a>
          </article>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="text-[14px] font-extrabold">Newsletter subscribers ({subscribers.length})</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {subscribers.map((s) => (
            <span key={s.email} className="rounded-full bg-mint-100 px-2.5 py-1 text-[10.5px] text-forest">
              {s.email}
            </span>
          ))}
          {subscribers.length === 0 && <p className="text-[11.5px] text-ink/45">No subscribers yet.</p>}
        </div>
      </section>
    </div>
  );
}
