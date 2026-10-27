import { db } from '@/lib/db';
import { formatNaira } from '@/lib/pricing.mjs';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all() as {
    id: number;
    code: string;
    description: string | null;
    type: 'percent' | 'fixed';
    value: number;
    min_subtotal_kobo: number;
    max_uses: number | null;
    uses: number;
    expires_at: string | null;
    is_active: number;
  }[];

  return (
    <div className="space-y-4">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/coupons" />

      <header>
        <h1 className="text-[24px] font-extrabold">Promo codes</h1>
        <p className="mt-1 text-[12.5px] text-ink/50">
          Create real discounts only — the storefront never shows a “sale” that does not exist.
        </p>
      </header>

      <div className="grid gap-3.5 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11.5px]">
              <thead className="bg-mint-50 text-[10px] uppercase tracking-wide text-ink/40">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Code</th>
                  <th className="px-4 py-2.5 font-bold">Discount</th>
                  <th className="px-4 py-2.5 font-bold">Min. spend</th>
                  <th className="px-4 py-2.5 font-bold">Uses</th>
                  <th className="px-4 py-2.5 font-bold">Status</th>
                  <th className="px-4 py-2.5 font-bold" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-line/70">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-ink">{c.code}</p>
                      <p className="text-[10px] text-ink/40">{c.description}</p>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60">
                      {c.type === 'percent' ? `${c.value}% off` : `${formatNaira(c.value * 100)} off`}
                    </td>
                    <td className="px-4 py-2.5 text-ink/60">{formatNaira(c.min_subtotal_kobo)}</td>
                    <td className="px-4 py-2.5 text-ink/60">
                      {c.uses}
                      {c.max_uses ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.is_active ? 'bg-emerald/12 text-emerald' : 'bg-mist text-ink/45'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <form action="/api/admin/coupons" method="post">
                          <input type="hidden" name="intent" value="toggle" />
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="text-[10.5px] font-semibold text-emerald hover:underline">
                            {c.is_active ? 'Pause' : 'Activate'}
                          </button>
                        </form>
                        <form action="/api/admin/coupons" method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="text-[10.5px] font-semibold text-red-500 hover:underline">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[12px] text-ink/45">
                      No promo codes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form action="/api/admin/coupons" method="post" className="card space-y-2.5 p-5">
          <h2 className="text-[14px] font-extrabold">Create a code</h2>
          <input type="hidden" name="intent" value="create" />
          <div>
            <label htmlFor="code" className="label text-[11.5px]">
              Code
            </label>
            <input id="code" name="code" required className="field py-2.5 text-[12px] uppercase" placeholder="ZAKSON10" />
          </div>
          <div>
            <label htmlFor="description" className="label text-[11.5px]">
              Description
            </label>
            <input id="description" name="description" className="field py-2.5 text-[12px]" placeholder="10% off launch week" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="type" className="label text-[11.5px]">
                Type
              </label>
              <select id="type" name="type" className="field py-2.5 text-[12px]">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (₦)</option>
              </select>
            </div>
            <div>
              <label htmlFor="value" className="label text-[11.5px]">
                Value
              </label>
              <input id="value" name="value" type="number" step="0.01" min="1" required className="field py-2.5 text-[12px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="minSubtotal" className="label text-[11.5px]">
                Min. spend (₦)
              </label>
              <input id="minSubtotal" name="minSubtotal" inputMode="numeric" className="field py-2.5 text-[12px]" placeholder="80000" />
            </div>
            <div>
              <label htmlFor="maxUses" className="label text-[11.5px]">
                Max uses
              </label>
              <input id="maxUses" name="maxUses" type="number" min="1" className="field py-2.5 text-[12px]" placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <label htmlFor="expires" className="label text-[11.5px]">
              Expires
            </label>
            <input id="expires" name="expires" type="date" className="field py-2.5 text-[12px]" />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-[12.5px]">
            Create promo code
          </button>
        </form>
      </div>
    </div>
  );
}
