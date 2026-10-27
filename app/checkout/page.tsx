import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCartView } from '@/lib/cart';
import { getDeliveryZones } from '@/lib/catalog';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { providerStatus } from '@/lib/payments';
import { Flash } from '@/components/Flash';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secure checkout',
  description: 'Complete your Zakson order with secure payment.',
  robots: { index: false, follow: false },
};

const STATES = [
  'Plateau', 'Abuja (FCT)', 'Lagos', 'Kano', 'Kaduna', 'Nasarawa', 'Bauchi', 'Gombe', 'Benue', 'Taraba',
  'Niger', 'Kwara', 'Oyo', 'Ogun', 'Osun', 'Ondo', 'Ekiti', 'Rivers', 'Enugu', 'Anambra', 'Imo', 'Abia',
  'Ebonyi', 'Delta', 'Edo', 'Cross River', 'Akwa Ibom', 'Bayelsa', 'Borno', 'Yobe', 'Adamawa', 'Sokoto',
  'Kebbi', 'Zamfara', 'Katsina', 'Jigawa', 'Kogi', 'Other',
];

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const cart = await getCartView();
  if (cart.items.length === 0 && !sp.flash) redirect('/cart');

  const session = await getSession();
  const zones = getDeliveryZones();
  const provider = providerStatus();

  let prefill = { fullName: '', email: '', phone: '', address: '', state: 'Plateau', city: 'Jos', landmark: '' };
  if (session) {
    const saved = db
      .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC LIMIT 1')
      .get(session.id) as
      | { full_name: string; phone: string; address: string; state: string; city: string; landmark: string | null }
      | undefined;
    const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(session.id) as { phone: string | null } | undefined;
    prefill = {
      fullName: saved?.full_name || session.name,
      email: session.email,
      phone: saved?.phone || user?.phone || '',
      address: saved?.address || '',
      state: saved?.state || 'Plateau',
      city: saved?.city || 'Jos',
      landmark: saved?.landmark || '',
    };
  }

  return (
    <div className="shell py-5 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[11.5px] text-ink/40">
        <Link href="/cart" className="hover:text-forest">
          Bag
        </Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-ink/70">Checkout</span>
      </nav>

      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/checkout" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight sm:text-[36px]">Secure checkout</h1>
          <p className="mt-1 text-[13px] text-ink/50">
            {session ? `Signed in as ${session.email}` : 'Checking out as a guest — you can still track your order with your reference.'}
          </p>
        </div>
        {!session && (
          <Link href="/account/login?next=/checkout" className="btn-ghost btn-sm">
            Sign in for faster checkout
          </Link>
        )}
      </div>

      <div className="mt-5">
        <CheckoutClient
          items={cart.items.map((i) => ({
            id: i.id,
            name: i.name,
            size: i.size,
            colorName: i.colorName,
            qty: i.qty,
            lineTotalKobo: i.lineTotalKobo,
            image: i.image,
          }))}
          subtotalKobo={cart.totals.subtotalKobo}
          discountKobo={cart.totals.discountKobo}
          couponCode={cart.couponCode}
          zones={zones}
          provider={provider.provider}
          live={provider.live}
          prefill={prefill}
          states={STATES}
        />
      </div>
    </div>
  );
}
