import { getAllSettings } from '@/lib/settings';
import { getDeliveryZones } from '@/lib/catalog';
import { providerStatus } from '@/lib/payments';
import { Flash } from '@/components/Flash';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; flashTone?: string }>;
}) {
  const sp = await searchParams;
  const settings = getAllSettings();
  const zones = getDeliveryZones();
  const payments = providerStatus();
  const cloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
  );

  return (
    <div className="space-y-4">
      <Flash message={sp.flash} tone={sp.flashTone} clearHref="/admin/settings" />

      <header>
        <h1 className="text-[24px] font-extrabold">Store settings</h1>
        <p className="mt-1 text-[12.5px] text-ink/50">
          Business details, delivery fees and integrations. Secrets are read from environment variables only.
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink/35">Payments</p>
          <p className={`mt-1.5 text-[13px] font-bold ${payments.live ? 'text-emerald' : 'text-amber-600'}`}>
            {payments.live ? `${payments.provider} connected` : 'Demo mode'}
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-ink/45">
            Paystack key: {payments.paystack ? 'set' : 'missing'} · Flutterwave key: {payments.flutterwave ? 'set' : 'missing'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink/35">Cloudinary</p>
          <p className={`mt-1.5 text-[13px] font-bold ${cloudinary ? 'text-emerald' : 'text-amber-600'}`}>
            {cloudinary ? 'Signed uploads ready' : 'Not configured'}
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-ink/45">
            {cloudinary ? 'Uploads go straight to your Cloudinary account.' : 'Add cloud name, key and secret to enable uploads.'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink/35">Email</p>
          <p className={`mt-1.5 text-[13px] font-bold ${process.env.RESEND_API_KEY || process.env.SMTP_HOST ? 'text-emerald' : 'text-amber-600'}`}>
            {process.env.RESEND_API_KEY || process.env.SMTP_HOST ? 'Configured' : 'Messages saved only'}
          </p>
          <p className="mt-1 text-[10.5px] leading-relaxed text-ink/45">
            Contact messages are always stored in the database.
          </p>
        </div>
      </div>

      <form action="/api/admin/settings" method="post" className="card p-5">
        <input type="hidden" name="intent" value="business" />
        <h2 className="text-[14px] font-extrabold">Business information</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ['store_name', 'Store name'],
            ['owner_name', 'Owner'],
            ['support_email', 'Support email'],
            ['support_phone', 'Support phone'],
            ['location_city', 'City'],
            ['location_state', 'State'],
            ['location_country', 'Country'],
            ['landmark', 'Landmark (no street number)'],
            ['whatsapp', 'WhatsApp number'],
            ['store_hours', 'Opening hours'],
            ['instagram', 'Instagram URL'],
            ['facebook', 'Facebook URL'],
            ['twitter', 'X / Twitter URL'],
            ['return_window_days', 'Return window (days)'],
          ].map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="label text-[11.5px]">
                {label}
              </label>
              <input id={key} name={key} defaultValue={settings[key] ?? ''} className="field py-2.5 text-[12px]" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="announcement" className="label text-[11.5px]">
              Announcement bar text
            </label>
            <input
              id="announcement"
              name="announcement"
              defaultValue={settings.announcement ?? ''}
              className="field py-2.5 text-[12px]"
            />
          </div>
          <div>
            <label htmlFor="free_delivery_threshold" className="label text-[11.5px]">
              Free delivery over (₦)
            </label>
            <input
              id="free_delivery_threshold"
              name="free_delivery_threshold"
              defaultValue={String(Number(settings.free_delivery_threshold_kobo || 25000000) / 100)}
              className="field py-2.5 text-[12px]"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4 px-5 py-2.5 text-[12.5px]">
          Save settings
        </button>
      </form>

      <form action="/api/admin/settings" method="post" className="card p-5">
        <input type="hidden" name="intent" value="zones" />
        <h2 className="text-[14px] font-extrabold">Delivery areas & fees</h2>
        <p className="mt-1 text-[11.5px] text-ink/45">These fees appear at checkout, in Naira.</p>
        <div className="mt-3 space-y-1.5">
          {zones.map((z) => (
            <div key={z.id} className="grid items-center gap-1.5 rounded-xl border border-line/70 p-2.5 sm:grid-cols-[1.4fr_.6fr_.9fr_.3fr]">
              <input type="hidden" name="zoneId" value={z.id} />
              <p className="text-[12px] font-semibold text-ink">{z.name}</p>
              <label className="sr-only" htmlFor={`fee_${z.id}`}>
                Fee for {z.name}
              </label>
              <input
                id={`fee_${z.id}`}
                name={`fee_${z.id}`}
                defaultValue={String(z.fee_kobo / 100)}
                inputMode="numeric"
                className="field py-2 text-[12px]"
              />
              <label className="sr-only" htmlFor={`eta_${z.id}`}>
                ETA for {z.name}
              </label>
              <input id={`eta_${z.id}`} name={`eta_${z.id}`} defaultValue={z.eta} className="field py-2 text-[12px]" />
              <label className="flex items-center gap-1.5 text-[10.5px] text-ink/50">
                <input type="checkbox" name={`active_${z.id}`} defaultChecked className="accent-emerald" /> On
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-mint-50 p-3">
          <p className="text-[11.5px] font-bold text-ink">Add a delivery area</p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-4">
            <input name="newZoneName" placeholder="Area name" className="field py-2 text-[12px]" />
            <input name="newZoneState" placeholder="State" className="field py-2 text-[12px]" />
            <input name="newZoneFee" placeholder="Fee (₦)" className="field py-2 text-[12px]" />
            <input name="newZoneEta" placeholder="ETA text" className="field py-2 text-[12px]" />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-4 px-5 py-2.5 text-[12.5px]">
          Save delivery settings
        </button>
      </form>

      <div className="card p-5">
        <h2 className="text-[14px] font-extrabold">Integration checklist</h2>
        <ul className="mt-2 space-y-1.5 text-[11.5px] text-ink/60">
          <li>• Set the Paystack webhook to <code className="font-mono text-[11px]">/api/payments/webhook</code> in your dashboard.</li>
          <li>• Set the Flutterwave webhook hash to <code className="font-mono text-[11px]">FLUTTERWAVE_WEBHOOK_HASH</code>.</li>
          <li>• Add Cloudinary credentials to enable server-signed image uploads.</li>
          <li>• Configure a Resend or SMTP provider so customers receive receipts.</li>
          <li>• Change the seeded admin password after your first login.</li>
        </ul>
      </div>
    </div>
  );
}
