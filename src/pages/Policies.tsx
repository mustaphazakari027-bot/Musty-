import {BRAND} from '../brand';
import {Link} from 'react-router-dom';
import {PageHead} from '../components/ui';
const sections=[
  ['delivery','Delivery, areas and fees',[
    'We deliver from Rikkos, Jos North to addresses across Jos and surrounding areas. Availability is confirmed at checkout and by our team.',
    'Standard delivery is ₦1,000 and free on baskets of ₦25,000 or more. Express delivery is ₦1,500 and depends on rider capacity. Fees are always shown before you pay.',
    'You choose a preferred date and time window at checkout. These are requests; if a slot is not possible, we will contact you to agree an alternative.',
    'Someone should be available to receive the order at the address provided. If we cannot deliver and cannot reach you, redelivery may attract a further fee.',
  ]],
  ['returns','Returns, replacements and refunds',[
    'Fresh produce is perishable, so please check your order on arrival. If something is missing, damaged or not as described, contact us within 24 hours with your order reference and, where possible, a photo.',
    'We will offer a replacement, credit or refund where a claim is verified. Items that have been used, cooked or stored incorrectly may not be eligible.',
    'Refunds for Paystack payments are returned to the original payment method through Paystack. Timing depends on your bank.',
    'Orders may be cancelled before packing begins. Once an order is out for delivery, cancellation may not be possible.',
  ]],
  ['payments','Payments and security',[
    'Card, bank transfer and USSD payments are processed by Paystack, a licensed payment provider. Card details are entered on Paystack’s secure checkout and are never stored on this website.',
    'We verify every transaction with Paystack on our server before treating an order as paid. Prices and totals are always recalculated on the server at checkout.',
    'Where pay on delivery is offered, payment is due in full to the rider at handover. Availability may vary by order value and location.',
  ]],
  ['privacy','Privacy and your data',[
    'We collect the details needed to process and deliver your order: your name, email, phone number, delivery address and order history. Payment card details are never handled by us.',
    'Passwords are stored as salted hashes. Sessions use secure, HTTP-only cookies. Access to customer and order data inside the store is restricted to authorised staff.',
    'We use the contact details you provide to fulfil orders and, if you opt in, to send occasional store updates. You can unsubscribe from marketing emails at any time.',
    'We do not sell your personal data. To ask for a copy, correction or deletion of your data, contact {BRAND.email}.',
  ]],
  ['terms','Terms of use',[
    'By placing an order you confirm that the information you provide is accurate and that you are able to receive the delivery at the chosen address.',
    'Product images are for illustration; fresh produce naturally varies in size, shape and colour. Availability and prices may change without notice, but the price you pay is the price confirmed at checkout.',
    'This storefront is provided as-is for the business named in the footer. Content, test products and sample reviews should be reviewed by the store owner before taking real orders.',
  ]],
];
export default function Policies(){return <><PageHead title="Delivery, returns, privacy and terms" description="Rikkos Fresh delivery fees, returns policy, payment security, privacy and terms of use."/>
  <section className="border-b border-[#eef0e7] bg-[#f0f4e8]"><div className="container-x py-10"><p className="section-eyebrow">The helpful details</p><h1 className="serif mt-2 text-[31px] text-[#173f30] sm:text-[38px]">Delivery, returns & the fine print.</h1><p className="mt-2 max-w-lg text-[12.5px] leading-relaxed text-[#61776a]">Plain-language policies for shopping with Rikkos Fresh. Last reviewed October 2026.</p></div></section>
  <div className="container-x mt-8 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
    <nav aria-label="On this page" className="hidden rounded-2xl border border-[#ecefe6] bg-white p-4 lg:sticky lg:top-32 lg:block"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#93a294]">On this page</p><ul className="mt-2 space-y-1">{(sections as [string,string,string[]][]).map(([id,title])=><li key={id}><a href={`#${id}`} className="block rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-[#5c7062] hover:bg-[#f4f7ef] hover:text-[#15704c]">{title}</a></li>)}</ul><Link to="/contact" className="btn-secondary mt-4 h-9 w-full text-[11px]">Ask a question</Link></nav>
    <div className="space-y-4">{(sections as [string,string,string[]][]).map(([id,title,paras])=><section key={id} id={id} className="scroll-mt-32 rounded-2xl border border-[#ecefe6] bg-white p-6"><h2 className="serif text-[22px] text-[#173f30]">{title}</h2>{paras.map((p,i)=><p key={i} className="mt-2.5 text-[12px] leading-relaxed text-[#657a6b]">{p}</p>)}</section>)}
      <section className="rounded-2xl bg-[#173f30] p-6 text-white"><h2 className="serif text-[21px]">Still need help?</h2><p className="mt-1.5 text-[11.5px] leading-relaxed text-[#b9d2c3]">Call <a href="tel:+2349034422971" className="underline">{BRAND.phoneDisplay}</a> or email <a href="mailto:{BRAND.email}" className="underline">{BRAND.email}</a>. Our team in Rikkos, Jos North is happy to help.</p><Link to="/contact" className="btn-primary mt-4 bg-[#dff0dd] !text-[#173f30] hover:!bg-white">Contact the store</Link></section>
    </div>
  </div></>;}
