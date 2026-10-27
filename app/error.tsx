'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="shell flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-[26px] font-extrabold sm:text-[32px]">Something went wrong</h1>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink/55">
        We hit an unexpected error on this page. Your bag and account are safe — try again, or contact support on
        09034422971 if it keeps happening.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
