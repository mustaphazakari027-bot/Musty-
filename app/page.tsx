import Link from 'next/link';
import { Hero } from '@/components/home/Hero';
import { CategoryRail } from '@/components/home/CategoryRail';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ProductRail } from '@/components/home/ProductRail';
import { PromoBand } from '@/components/home/PromoBand';
import { ReviewWall } from '@/components/home/ReviewWall';
import { DeliveryInfo } from '@/components/home/DeliveryInfo';
import { Faq, FAQS } from '@/components/home/Faq';
import { NewsletterCta } from '@/components/home/NewsletterCta';
import { SectionHeading } from '@/components/ui';
import { queryProducts } from '@/lib/catalog';
import { getWishlistProductIds } from '@/lib/wishlist';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const wishlist = await getWishlistProductIds();
  const featured = queryProducts({ featured: true, limit: 4 });
  const bestSellers = queryProducts({ bestSeller: true, limit: 4 });
  const newArrivals = queryProducts({ isNew: true, limit: 4, sort: 'newest' });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <Hero />
      <TrustStrip />
      <CategoryRail />

      <ProductRail
        eyebrow="Top picks"
        title="Chosen by our runners this week"
        description="The pairs our Jos customers keep coming back for — cushioned, breathable and built to last on Nigerian roads."
        href="/shop?sort=popular"
        products={featured}
        wishlist={wishlist}
      />

      <PromoBand />

      <ProductRail
        eyebrow="Best sellers"
        title="Best-selling shoes"
        description="Proven over thousands of kilometres. These are the models we restock most often."
        href="/shop?sort=popular"
        products={bestSellers}
        wishlist={wishlist}
      />

      <ProductRail
        eyebrow="Just landed"
        title="New arrivals"
        description="Fresh colourways and new silhouettes, available now in limited quantities."
        href="/shop?sort=newest"
        products={newArrivals}
        wishlist={wishlist}
      />

      <ReviewWall />
      <DeliveryInfo />

      <section className="shell mt-12 sm:mt-16">
        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Questions"
              title="Everything you need to know before you order"
              description="Sizing, delivery, payments and returns — answered plainly. Still unsure? Call our store on 09034422971."
            />
            <Link href="/contact" className="btn-ghost mt-5">
              Talk to customer support
            </Link>
          </div>
          <Faq compact />
        </div>
      </section>

      <NewsletterCta />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
