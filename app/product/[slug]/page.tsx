import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, getPublishedReviews } from '@/lib/catalog';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getWishlistProductIds } from '@/lib/wishlist';
import { getStoreInfo } from '@/lib/settings';
import { formatNaira } from '@/lib/pricing.mjs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductCard } from '@/components/ProductCard';
import { Flash } from '@/components/Flash';
import { Stars } from '@/components/ui';
import {
  ArrowRightIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  ReturnIcon,
  ShieldIcon,
  TruckIcon,
} from '@/components/Icons';
import { ReviewForm } from '@/components/product/ReviewForm';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  const title = `${product.name} — ${product.subtitle} · ${formatNaira(product.priceKobo)}`;
  return {
    title,
    description: `${product.name} by Zakson. ${product.description.slice(0, 145)}`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title,
      description: product.description.slice(0, 160),
      images: [{ url: product.images[0], alt: product.name }],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const [session, wishlist] = await Promise.all([getSession(), getWishlistProductIds()]);
  const reviews = getPublishedReviews(product.id);
  const related = getRelatedProducts(product, 4);
  const store = getStoreInfo();

  const stockByKey: Record<string, number> = {};
  (
    db.prepare('SELECT color_slug, size_label, stock FROM product_variants WHERE product_id = ?').all(product.id) as {
      color_slug: string;
      size_label: string;
      stock: number;
    }[]
  ).forEach((v) => {
    stockByKey[`${v.color_slug}/${v.size_label}`] = v.stock;
  });

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((src) => new URL(src, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').toString()),
    brand: { '@type': 'Brand', name: 'Zakson' },
    category: product.categoryName,
    sku: `ZK-${product.slug.toUpperCase()}`,
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/product/${product.slug}`,
      priceCurrency: 'NGN',
      price: (product.priceKobo / 100).toFixed(2),
      availability:
        product.stockTotal > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Zakson' },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="shell py-5 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/" className="hover:text-forest">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/shop" className="hover:text-forest">
          Shop
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-forest">
          {product.categoryName}
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">{product.name}</span>
      </nav>

      <Flash message={sp.flash} tone={sp.flashTone} clearHref={`/product/${product.slug}`} />

      <div className="grid gap-7 lg:grid-cols-[1.02fr_1fr] lg:gap-12">
        <ProductGallery images={product.images} name={product.name} badge={product.badge} />

        <div className="pt-1">
          <ProductPurchase product={product} wishlisted={wishlist.has(product.id)} stockByKey={stockByKey} />

          {/* Delivery / returns / authenticity */}
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            {[
              { icon: TruckIcon, title: 'Delivery', body: 'Same-day in Jos North, 2–5 days nationwide.' },
              { icon: ReturnIcon, title: '7-day returns', body: 'Unworn pairs, original box.' },
              { icon: ShieldIcon, title: 'Authentic', body: 'Sourced from authorised suppliers.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-line/70 bg-white p-3.5">
                <Icon size={17} className="text-emerald" />
                <p className="mt-2 text-[12px] font-bold text-ink">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink/45">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-mint-100 p-4">
            <p className="text-[12px] font-bold text-forest">Need help choosing a size?</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/55">
              Call or message our store and we will advise on fit for this model.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <a href={`tel:${store.phone}`} className="chip bg-white">
                <PhoneIcon size={13} /> {store.phone}
              </a>
              <a href={`mailto:${store.email}`} className="chip bg-white">
                <MailIcon size={13} /> Email support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <section className="mt-10 grid gap-3.5 sm:mt-14 lg:grid-cols-3">
        <div className="rounded-3xl border border-line/70 bg-white p-6 lg:col-span-2">
          <h2 className="text-[19px] font-extrabold">Details & materials</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{product.description}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              'Engineered knit upper with reinforced toe cap',
              'Responsive nitrogen-infused foam midsole',
              'Carbon-rubber outsole for wet-season grip',
              'Removable cushioned insole',
              `Available in ${product.colors.length} colourways`,
              'Unisex sizing on unisex models',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12.5px] text-ink/60">
                <CheckIcon size={14} className="mt-0.5 shrink-0 text-emerald" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-forest p-6 text-white">
          <h2 className="text-[17px] font-extrabold">Delivery & returns</h2>
          <ul className="mt-3 space-y-3 text-[12px] leading-relaxed text-white/65">
            <li className="flex gap-2.5">
              <TruckIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
              Jos North orders before 2pm are usually delivered the same day.
            </li>
            <li className="flex gap-2.5">
              <ReturnIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
              Free size swap within 7 days; refunds to the original payment method.
            </li>
            <li className="flex gap-2.5">
              <ShieldIcon size={16} className="mt-0.5 shrink-0 text-emerald" />
              Payment is verified on our server before your order is confirmed.
            </li>
          </ul>
          <Link href="/help" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-mint-200">
            Full policies <ArrowRightIcon size={13} />
          </Link>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="mt-10 scroll-mt-28 sm:mt-14">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-[24px] font-extrabold sm:text-[30px]">Customer reviews</h2>
            <div className="mt-2 flex items-center gap-2.5">
              <Stars rating={product.rating || 0} size={17} />
              <span className="text-[13px] font-semibold text-forest">
                {product.reviewCount > 0 ? `${product.rating} out of 5` : 'No reviews yet'}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
              {product.reviewCount > 0
                ? `Based on ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'} from Zakson customers.`
                : 'Be the first to review this shoe after your order is delivered.'}
            </p>
            <ReviewForm productId={product.id} loggedIn={Boolean(session)} slug={product.slug} />
          </div>

          <div className="space-y-2.5">
            {reviews.length === 0 && (
              <div className="rounded-3xl border border-dashed border-line bg-white/60 p-8 text-center text-[13px] text-ink/45">
                No reviews published yet.
              </div>
            )}
            {reviews.map((r) => (
              <article key={r.id} className="rounded-3xl border border-line/70 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Stars rating={r.rating} size={13} />
                      {r.is_verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald">
                          <CheckIcon size={10} /> Verified
                        </span>
                      ) : null}
                      {r.is_sample ? (
                        <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-semibold text-ink/45">
                          Sample
                        </span>
                      ) : null}
                    </div>
                    {r.title && <p className="mt-1.5 text-[14px] font-bold text-ink">{r.title}</p>}
                  </div>
                  <time className="shrink-0 text-[11px] text-ink/35" dateTime={r.created_at}>
                    {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </time>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{r.body}</p>
                <p className="mt-2.5 text-[11.5px] font-semibold text-forest">{r.author}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">You may also like</p>
              <h2 className="mt-1.5 text-[24px] font-extrabold sm:text-[30px]">Related shoes</h2>
            </div>
            <Link href="/shop" className="text-[12.5px] font-semibold text-forest hover:text-emerald">
              View all →
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} wishlisted={wishlist.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    </div>
  );
}
