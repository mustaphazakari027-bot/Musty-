import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { formatNaira } from '@/lib/pricing.mjs';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  slug: string;
  name: string;
  price_kobo: number;
  compare_at_kobo: number | null;
  is_active: number;
  gender: string;
  category: string | null;
  image: string | null;
  stock: number;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? '';

  const rows = db
    .prepare(
      `SELECT p.id, p.slug, p.name, p.price_kobo, p.compare_at_kobo, p.is_active, p.gender,
              c.name AS category,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order LIMIT 1) AS image,
              (SELECT COALESCE(SUM(stock),0) FROM product_variants v WHERE v.product_id = p.id) AS stock
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       ${q ? 'WHERE p.name LIKE ? OR p.slug LIKE ?' : ''}
       ORDER BY p.id DESC`,
    )
    .all(...(q ? [`%${q}%`, `%${q}%`] : [])) as Row[];

  return (
    <div className="space-y-4">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/products" />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold">Products</h1>
          <p className="mt-1 text-[12.5px] text-ink/50">{rows.length} products · manage prices, stock and visibility.</p>
        </div>
        <div className="flex gap-2">
          <form action="/admin/products" method="get" className="flex items-center gap-1.5">
            <label htmlFor="q" className="sr-only">
              Search products
            </label>
            <input id="q" name="q" defaultValue={q} placeholder="Search…" className="field w-36 px-3 py-2.5 text-[12px]" />
            <button type="submit" className="btn-ghost btn-sm px-3 py-2.5">
              Search
            </button>
          </form>
          <Link href="/admin/products/new" className="btn-primary btn-sm px-4 py-2.5">
            Add product
          </Link>
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[12px]">
            <thead className="bg-mint-50 text-[10px] uppercase tracking-wide text-ink/40">
              <tr>
                <th className="px-4 py-2.5 font-bold">Product</th>
                <th className="px-4 py-2.5 font-bold">Category</th>
                <th className="px-4 py-2.5 font-bold">Price</th>
                <th className="px-4 py-2.5 font-bold">Stock</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line/70">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mint-100">
                        {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div>
                        <Link href={`/admin/products/${r.id}`} className="font-semibold text-ink hover:text-forest">
                          {r.name}
                        </Link>
                        <p className="text-[10.5px] text-ink/40">
                          /product/{r.slug} · {r.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink/60">{r.category}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-forest">{formatNaira(r.price_kobo)}</span>
                    {r.compare_at_kobo ? (
                      <span className="ml-1 text-[10.5px] text-ink/35 line-through">{formatNaira(r.compare_at_kobo)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={r.stock === 0 ? 'font-bold text-red-500' : r.stock < 8 ? 'font-bold text-amber-600' : 'text-ink/60'}>
                      {r.stock}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.is_active ? 'bg-emerald/12 text-emerald' : 'bg-mist text-ink/50'
                      }`}
                    >
                      {r.is_active ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/products/${r.id}`} className="text-[11px] font-semibold text-emerald hover:text-forest">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-ink/45">
                    No products matched.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
