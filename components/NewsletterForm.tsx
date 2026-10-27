'use client';

import { useRef, useState } from 'react';
import { ArrowRightIcon } from '@/components/Icons';

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as { ok: boolean; message: string };
      setMessage(json.message);
      setState(json.ok ? 'ok' : 'error');
      if (json.ok) form.reset();
    } catch {
      // No JS-side fetch available — fall back to a normal form POST.
      form.submit();
    }
  }

  return (
    <div>
      <form ref={formRef} action="/api/newsletter" method="post" onSubmit={onSubmit} className="mt-3">
        <label htmlFor={compact ? 'newsletter-footer' : 'newsletter-main'} className="sr-only">
          Email address
        </label>
        <div className="flex items-center gap-2">
          <input
            id={compact ? 'newsletter-footer' : 'newsletter-main'}
            type="email"
            name="email"
            required
            placeholder="you@email.com"
            autoComplete="email"
            className={
              compact
                ? 'min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[13px] text-white placeholder:text-white/40 focus:border-emerald focus:outline-none'
                : 'min-w-0 flex-1 rounded-2xl border border-line bg-white px-4 py-3.5 text-sm text-ink placeholder:text-ink/35 focus:border-emerald focus:outline-none focus:ring-4 focus:ring-emerald/10'
            }
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className={
              compact
                ? 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald text-white transition-colors hover:bg-emerald-600 disabled:opacity-60'
                : 'btn-emerald shrink-0 px-5 py-3.5'
            }
            aria-label="Subscribe to the Zakson newsletter"
          >
            {compact ? <ArrowRightIcon size={16} /> : state === 'loading' ? 'Joining…' : 'Subscribe'}
          </button>
        </div>
        {state === 'ok' && <p className="mt-2 text-xs font-medium text-emerald">{message}</p>}
        {state === 'error' && <p className="mt-2 text-xs font-medium text-red-400">{message}</p>}
      </form>
    </div>
  );
}
