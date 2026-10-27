import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getProductById } from '@/lib/catalog';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui';
import { HeartIcon } from '@/components/Icons';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your wishlist',
  robots: { index: false, follow: false },
};

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();

  if (!session) {
    return (
      <div className="shell max-w-2xl py-10">
        <EmptyState
          title="Sign in to see your wishlist"
          description="Your saved shoes are tied to your Zakson account so they are waiting for you on any device."
          action={{ href: '/account/login?next=/wishlist', label: 'Sign in' }}
          icon={<HeartIcon size={22} />}
        />
        <p className="mt-4 text-center text-[12px] text-ink/45">
          New here?{' '}
          <Link href="/account/register" className="font-semibold text-forest underline">
            Create an account
          </Link>
        </p>
      </div>
    );
  }

  const rows = db
    .prepare('SELECT product_id FROM wishlist_items WHERE user_id = ? ORDER BY created_at DESC')
    .all(session.id) as { product_id: number }[];

  const products = rows.map((r) => getProductById(r.product_id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="shell py-6 sm:py-10">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/wishlist" />
      <h1 className="text-[28px] font-extrabold leading-tight sm:text-[36px]">Your wishlist</h1>
      <p className="mt-1 text-[13px] text-ink/50">
        {products.length === 0 ? 'Nothing saved yet.' : `${products.length} saved pair${products.length === 1 ? '' : 's'}.`}
      </p>

      {products.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No saved shoes yet"
            description="Tap the heart on any product to save it here for later."
            action={{ href: '/shop', label: 'Browse the collection' }}
            icon={<HeartIcon size={22} />}
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
