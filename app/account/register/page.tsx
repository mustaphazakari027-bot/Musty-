import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Flash } from '@/components/Flash';
import { BrandMark } from '@/components/Brand';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a Zakson account to track orders, save wishlists and reorder faster.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
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
        <h1 className="mt-4 text-[26px] font-extrabold">Create your account</h1>
        <p className="mt-1 text-[13px] text-ink/50">Save addresses, track deliveries and keep a wishlist.</p>
      </div>

      <div className="mt-5">
        <Flash message={sp.flash} tone={sp.flashTone} clearHref="/account/register" />
      </div>

      <form action="/api/auth/register" method="post" className="card space-y-3.5 p-5 sm:p-6">
        {sp.next && <input type="hidden" name="next" value={sp.next} />}
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input id="name" name="name" required autoComplete="name" className="field" placeholder="Mustapha Zakari" />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="you@email.com" />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Phone number <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" placeholder="09034422971" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="field"
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" className="btn-primary w-full py-3.5">
          Create account
        </button>
        <p className="text-center text-[11px] leading-relaxed text-ink/40">
          By creating an account you agree to our{' '}
          <Link href="/help#terms" className="underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/help#privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
        <p className="text-center text-[12px] text-ink/50">
          Already have an account?{' '}
          <Link href="/account/login" className="font-semibold text-forest underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
