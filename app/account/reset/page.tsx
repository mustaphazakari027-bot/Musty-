import type { Metadata } from 'next';
import Link from 'next/link';
import { Flash } from '@/components/Flash';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="shell max-w-md py-8 sm:py-14">
      <h1 className="text-[26px] font-extrabold">Choose a new password</h1>
      <p className="mt-1.5 text-[13px] text-ink/50">Use at least 8 characters.</p>

      <div className="mt-5">
        <Flash message={sp.flash} tone={sp.flashTone} clearHref="/account/reset" />
      </div>

      {sp.token ? (
        <form action="/api/auth/reset" method="post" className="card space-y-3.5 p-5 sm:p-6">
          <input type="hidden" name="token" value={sp.token} />
          <div>
            <label htmlFor="password" className="label">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5">
            Update password
          </button>
        </form>
      ) : (
        <div className="card p-5 text-[13px] text-ink/60">
          This link is missing its token.{' '}
          <Link href="/account/forgot" className="font-semibold text-forest underline">
            Request a new reset link
          </Link>
          .
        </div>
      )}
    </div>
  );
}
