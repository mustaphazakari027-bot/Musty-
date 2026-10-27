import type { Metadata } from 'next';
import Link from 'next/link';
import { Flash } from '@/components/Flash';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="shell max-w-md py-8 sm:py-14">
      <h1 className="text-[26px] font-extrabold">Reset your password</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/50">
        Enter the email on your Zakson account and we will send a single-use reset link (valid for one hour).
      </p>

      <div className="mt-5">
        <Flash message={sp.flash} tone={sp.flashTone} clearHref="/account/forgot" />
      </div>

      <form action="/api/auth/forgot" method="post" className="card space-y-3.5 p-5 sm:p-6">
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input id="email" name="email" type="email" required className="field" placeholder="you@email.com" />
        </div>
        <button type="submit" className="btn-primary w-full py-3.5">
          Send reset link
        </button>
      </form>

      <p className="mt-4 text-[12px] text-ink/50">
        Remembered it?{' '}
        <Link href="/account/login" className="font-semibold text-forest underline">
          Back to sign in
        </Link>
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink/40">
        No email provider configured? Our support team can reset your password manually — call 09034422971.
      </p>
    </div>
  );
}
