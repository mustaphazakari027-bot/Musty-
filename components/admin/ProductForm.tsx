import Link from 'next/link';
import { ImageFieldList } from '@/components/admin/ImageFieldList';
import { getCategories, getColors, getAllSizes } from '@/lib/catalog';

export type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  categoryId: number | null;
  gender: 'men' | 'women' | 'unisex';
  priceKobo: number;
  compareAtKobo: number | null;
  badge: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isActive: boolean;
  images: string[];
  colors: string[];
  sizes: string[];
};

const naira = (kobo: number | null) => (kobo ? String(kobo / 100) : '');

export function ProductForm({ values }: { values: ProductFormValues }) {
  const categories = getCategories();
  const colors = getColors();
  const sizes = getAllSizes();
  const action = values.id ? `/api/admin/products/${values.id}` : '/api/admin/products';

  return (
    <form action={action} method="post" className="grid gap-3.5 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <div className="space-y-3.5">
        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Basics</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="label">
                Product name
              </label>
              <input id="name" name="name" required defaultValue={values.name} className="field" placeholder="Ultra Run Pro" />
            </div>
            <div>
              <label htmlFor="slug" className="label">
                URL slug
              </label>
              <input
                id="slug"
                name="slug"
                required
                pattern="[a-z0-9-]+"
                defaultValue={values.slug}
                className="field font-mono text-[12px]"
                placeholder="ultra-run-pro"
              />
            </div>
            <div>
              <label htmlFor="subtitle" className="label">
                Subtitle
              </label>
              <input id="subtitle" name="subtitle" defaultValue={values.subtitle} className="field" placeholder="Men's Running Shoes" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea id="description" name="description" required rows={5} defaultValue={values.description} className="field resize-y" />
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Pricing</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="label">
                Selling price (₦)
              </label>
              <input id="price" name="price" required inputMode="numeric" defaultValue={naira(values.priceKobo)} className="field" />
            </div>
            <div>
              <label htmlFor="compareAt" className="label">
                Compare-at price (₦)
              </label>
              <input
                id="compareAt"
                name="compareAt"
                inputMode="numeric"
                defaultValue={naira(values.compareAtKobo)}
                className="field"
                placeholder="Leave empty if no discount"
              />
              <p className="hint">Only set this for a genuine discount. It powers the “−%” badge.</p>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Variants</h2>
          <div className="mt-3">
            <p className="label">Available colours</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {colors.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-[12px] text-ink/70">
                  <input
                    type="checkbox"
                    name="colors"
                    value={c.slug}
                    defaultChecked={values.colors.includes(c.slug)}
                    className="accent-emerald"
                  />
                  <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="label">Available sizes (UK)</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <label key={s.label} className="relative">
                  <input
                    type="checkbox"
                    name="sizes"
                    value={s.label}
                    defaultChecked={values.sizes.includes(s.label)}
                    className="peer sr-only"
                  />
                  <span className="flex h-8 w-9 cursor-pointer items-center justify-center rounded-lg border border-line text-[11.5px] font-semibold text-ink/65 peer-checked:border-forest peer-checked:bg-forest peer-checked:text-white">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="hint">New colour/size combinations start with 5 pairs of stock — adjust on the inventory panel.</p>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Media</h2>
          <div className="mt-3">
            <ImageFieldList initial={values.images} />
          </div>
        </section>
      </div>

      <div className="space-y-3.5">
        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Organisation</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="categoryId" className="label">
                Category
              </label>
              <select id="categoryId" name="categoryId" required defaultValue={values.categoryId ?? ''} className="field">
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gender" className="label">
                Who it is for
              </label>
              <select id="gender" name="gender" defaultValue={values.gender} className="field">
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div>
              <label htmlFor="badge" className="label">
                Badge <span className="font-normal text-ink/40">(optional)</span>
              </label>
              <input id="badge" name="badge" defaultValue={values.badge} className="field" placeholder="Best seller / New" />
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-[14px] font-extrabold">Visibility</h2>
          <div className="mt-3 space-y-2 text-[12.5px] text-ink/70">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="accent-emerald" /> Visible in
              the store
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="accent-emerald" /> Featured
              on the homepage
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isBestSeller" defaultChecked={values.isBestSeller} className="accent-emerald" />{' '}
              Best seller
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isNew" defaultChecked={values.isNew} className="accent-emerald" /> Mark as new
              arrival
            </label>
          </div>
        </section>

        <div className="card space-y-2 p-4">
          <button type="submit" className="btn-primary w-full py-3">
            {values.id ? 'Save changes' : 'Create product'}
          </button>
          <Link href="/admin/products" className="btn-ghost w-full py-2.5 text-[12.5px]">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
