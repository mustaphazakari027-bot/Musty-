import Link from 'next/link';
import { ChevronDownIcon } from '@/components/Icons';

export const FAQS = [
  {
    q: 'How do I know which size to order?',
    a: 'Our shoes are listed in UK sizes. Measure your foot in centimetres and match it on the size guide — most runners go half a size up for long-distance comfort. If you are between sizes, order the larger one and we will swap it free within 7 days.',
  },
  {
    q: 'Do you deliver outside Jos?',
    a: 'Yes. We deliver to every state in Nigeria through tracked couriers. Plateau State deliveries usually arrive in 1–3 working days; Abuja and Lagos in 2–4 working days. Fees are calculated at checkout before payment.',
  },
  {
    q: 'What payment methods can I use?',
    a: 'Card, bank transfer and USSD are supported through Paystack or Flutterwave once the merchant account is connected. We never see or store your card details — payment is completed on the provider’s secure page.',
  },
  {
    q: 'Can I pay on delivery?',
    a: 'Pay-on-delivery may be offered for selected Jos North addresses at the discretion of the store. It is not enabled by default — contact us on 09034422971 to confirm availability for your address.',
  },
  {
    q: 'Are the shoes original?',
    a: 'Every pair we sell is sourced from authorised suppliers. Each order includes a Zakson authenticity card, and you can verify your order reference with our support team at any time.',
  },
  {
    q: 'How do returns work?',
    a: 'Return unworn shoes in their original box within 7 days of delivery. Bring them to our Jos North location or ask for a pickup within Plateau State. Refunds are processed to the original payment method after inspection.',
  },
];

export function Faq({ compact = false }: { compact?: boolean }) {
  const items = compact ? FAQS.slice(0, 4) : FAQS;
  return (
    <div className="divide-y divide-line/80 overflow-hidden rounded-3xl border border-line/70 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-1 sm:px-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14px] font-semibold text-ink marker:hidden">
            {item.q}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint-200 text-forest transition-transform group-open:rotate-180">
              <ChevronDownIcon size={15} />
            </span>
          </summary>
          <p className="pb-4 pr-8 text-[13.5px] leading-relaxed text-ink/55">{item.a}</p>
        </details>
      ))}
      {compact && (
        <div className="px-5 py-4 sm:px-6">
          <Link href="/help#faq" className="text-[12.5px] font-semibold text-emerald hover:text-forest">
            See all frequently asked questions →
          </Link>
        </div>
      )}
    </div>
  );
}
