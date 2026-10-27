import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const productId = Number(id);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as
    | {
        id: number;
        slug: string;
        name: string;
        subtitle: string | null;
        description: string;
        category_id: number | null;
        gender: 'men' | 'women' | 'unisex';
        price_kobo: number;
        compare_at_kobo: number | null;
        badge: string | null;
        is_featured: number;
        is_best_seller: number;
        is_new: number;
        is_active: number;
      }
    | undefined;

  if (!product) notFound();

  const images = (
    db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order').all(productId) as {
      url: string;
    }[]
  ).map((r) => r.url);

  const colors = (
    db.prepare('SELECT color_slug FROM product_colors WHERE product_id = ?').all(productId) as { color_slug: string }[]
  ).map((r) => r.color_slug);

  const variants = db
    .prepare(
      `SELECT v.color_slug, co.name AS color_name, v.size_label, v.stock
         FROM product_variants v JOIN colors co ON co.slug = v.color_slug
        WHERE v.product_id = ? ORDER BY co.sort_order, CAST(v.size_label AS REAL)`,
    )
    .all(productId) as { color_slug: string; color_name: string; size_label: string; stock: number }[];

  const sizes = [...new Set(variants.map((v) => v.size_label))];

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/admin/products" className="hover:text-forest">
          Products
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">{product.name}</span>
      </nav>

      <Flash message={sp.flash} tone={sp.flashTone} clearHref={`/admin/products/${productId}`} />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-[24px] font-extrabold">{product.name}</h1>
        <Link href={`/product/${product.slug}`} className="btn-ghost btn-sm px-3.5 py-2">
          View on storefront →
        </Link>
      </div>

      <ProductForm
        values={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          subtitle: product.subtitle ?? '',
          description: product.description,
          categoryId: product.category_id,
          gender: product.gender,
          priceKobo: product.price_kobo,
          compareAtKobo: product.compare_at_kobo,
          badge: product.badge ?? '',
          isFeatured: !!product.is_featured,
          isBestSeller: !!product.is_best_seller,
          isNew: !!product.is_new,
          isActive: !!product.is_active,
          images,
          colors,
          sizes,
        }}
      />

      {/* Inventory */}
      <section className="card p-5">
        <h2 className="text-[14px] font-extrabold">Inventory by variant</h2>
        <p className="mt-1 text-[11.5px] text-ink/45">
          Stock is decremented automatically when a payment is confirmed. Sold-out combos cannot be added to bags.
        </p>
        <form action={`/api/admin/products/${productId}`} method="post" className="mt-3">
          <input type="hidden" name="intent" value="stock" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11.5px]">
              <thead className="text-[10px] uppercase tracking-wide text-ink/40">
                <tr>
                  <th className="py-1.5 pr-2 font-bold">Colour</th>
                  {sizes.map((s) => (
                    <th key={s} className="px-1 py-1.5 text-center font-bold">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(variants.map((v) => v.color_slug))].map((colorSlug) => (
                  <tr key={colorSlug} className="border-t border-line/70">
                    <td className="py-1.5 pr-2 font-semibold text-ink">
                      {variants.find((v) => v.color_slug === colorSlug)?.color_name ?? colorSlug}
                    </td>
                    {sizes.map((size) => {
                      const variant = variants.find((v) => v.color_slug === colorSlug && v.size_label === size);
                      return (
                        <td key={size} className="px-1 py-1.5 text-center">
                          {variant ? (
                            <input
                              type="number"
                              min={0}
                              max={9999}
                              name={`stock_${colorSlug}_${size}`}
                              defaultValue={variant.stock}
                              aria-label={`Stock for ${colorSlug} size ${size}`}
                              className="w-14 rounded-lg border border-line px-1.5 py-1 text-center text-[11.5px] focus:border-emerald focus:outline-none"
                            />
                          ) : (
                            <span className="text-ink/25">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" className="btn-primary mt-3 px-5 py-2.5 text-[12.5px]">
            Save inventory
          </button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="text-[14px] font-extrabold text-red-600">Danger zone</h2>
        <p className="mt-1 text-[11.5px] text-ink/50">
          Deleting removes the product from the storefront. Past orders keep their own snapshots of name, size, colour
          and price, so order history stays accurate.
        </p>
        <form action={`/api/admin/products/${productId}`} method="post" className="mt-3">
          <input type="hidden" name="intent" value="delete" />
          <button type="submit" className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-100">
            Delete this product
          </button>
        </form>
      </section>
    </div>
  );
}
