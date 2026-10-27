import Link from 'next/link';
import { RunIcon } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="shell flex min-h-[55vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-mint-200 text-forest">
        <RunIcon size={26} />
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold sm:text-[36px]">This page took a wrong turn</h1>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink/55">
        The page you were looking for does not exist, or the link has expired. Try the shop — or search for the shoe you
        want.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2.5">
        <Link href="/shop" className="btn-primary">
          Shop all shoes
        </Link>
        <Link href="/" className="btn-ghost">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
