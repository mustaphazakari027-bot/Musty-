import Link from 'next/link';
import { ProductForm } from '@/components/admin/ProductForm';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/admin/products" className="hover:text-forest">
          Products
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">New</span>
      </nav>
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/products/new" />
      <h1 className="text-[24px] font-extrabold">Add a product</h1>

      <ProductForm
        values={{
          name: '',
          slug: '',
          subtitle: '',
          description: '',
          categoryId: null,
          gender: 'unisex',
          priceKobo: 0,
          compareAtKobo: null,
          badge: '',
          isFeatured: false,
          isBestSeller: false,
          isNew: true,
          isActive: true,
          images: [],
          colors: ['mint-white'],
          sizes: [],
        }}
      />
    </div>
  );
}
