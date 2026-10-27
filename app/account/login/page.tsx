import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Flash } from '@/components/Flash';
import { BrandMark } from '@/components/Brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Zakson account to track orders and save your wishlist.',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(sp.next || '/account');

  return (
    <div className="shell max-w-md py-8 sm:py-14">
      <div className="text-center">
        <div className="mx-auto w-fit">
          <BrandMark className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-[26px] font-extrabold">Welcome back</h1>
        <p className="mt-1 text-[13px] text-ink/50">Sign in to track orders, save shoes and check out faster.</p>
      </div>

      <div className="mt-5">
        <Flash message={sp.flash} tone={sp.flashTone} clearHref="/account/login" />
      </div>

      <form action="/api/auth/login" method="post" className="card space-y-3.5 p-5 sm:p-6">
        {sp.next && <input type="hidden" name="next" value={sp.next} />}
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@email.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link href="/account/forgot" className="mb-1.5 text-[11.5px] font-semibold text-emerald hover:text-forest">
              Forgot?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3.5">
          Sign in
        </button>
        <p className="text-center text-[12px] text-ink/50">
          New to Zakson?{' '}
          <Link
            href={`/account/register${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ''}`}
            className="font-semibold text-forest underline"
          >
            Create an account
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-[11px] text-ink/40">
        You can also{' '}
        <Link href="/checkout" className="underline">
          check out as a guest
        </Link>{' '}
        — no account required.
      </p>
    </div>
  );
}
