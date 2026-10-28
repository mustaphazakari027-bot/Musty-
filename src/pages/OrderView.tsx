import {CheckCircle2,Circle,Clock,MapPin,PackageCheck,ReceiptText,ShoppingBag,Truck,XCircle} from 'lucide-react';
import {useEffect,useState} from 'react';
import {BRAND} from '../brand';
import {Link,useParams,useSearchParams} from 'react-router-dom';
import {api,money,niceDate,statusText} from '../api';
import {Alert,PageHead} from '../components/ui';
import {useStore} from '../store';
import type {Order} from '../types';
const steps=[['confirmed','Order received'],['processing','Being packed'],['out_for_delivery','Out for delivery'],['delivered','Delivered']];
export default function OrderView(){
  const {reference}=useParams(); const [params]=useSearchParams(); const {user}=useStore(); const [order,setOrder]=useState<Order|null>(null); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  useEffect(()=>{let ignore=false;const token=localStorage.getItem(`rf-order-${reference}`)||'';
    api<Order>(`/orders/${reference}`,{headers:token?{'x-order-token':token}:{}}).then(o=>{if(!ignore)setOrder(o);}).catch(e=>{if(!ignore)setError(e.message);}).finally(()=>{if(!ignore)setLoading(false);});return()=>{ignore=true;};},[reference,user]);
  if(loading) return <div className="container-x mt-10 space-y-3">{[0,1].map(i=><div key={i} className="skeleton h-40 rounded-2xl"/>)}</div>;
  if(error||!order) return <div className="container-x mt-12"><div className="mx-auto max-w-md rounded-2xl border border-[#ecefe6] bg-white p-8 text-center"><XCircle className="mx-auto text-[#c8785f]"/><h1 className="mt-3 text-[18px] font-extrabold">We couldn’t open that order</h1><p className="mt-1 text-[12px] leading-relaxed text-[#7b8b7d]">{error||'This order belongs to another account. Sign in with the email used at checkout, or track it with your reference and email.'}</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link to="/track" className="btn-primary">Track an order</Link><Link to="/login" className="btn-secondary">Sign in</Link></div></div></div>;
  const cancelled=order.status==='cancelled'; const paid=order.payment_status==='paid'; const cod=order.payment_method==='cod'; const stepIndex=steps.findIndex(s=>s[0]===order.status);
  return <>
    <PageHead title={`Order ${order.reference}`}/>
    <div className="border-b border-[#eef0e7] bg-[#f3f5eb]"><div className="container-x py-8"><div className="flex flex-wrap items-start justify-between gap-4"><div>
      {params.get('new')?<><span className="pill bg-[#dff0dd] text-[#1d6242]">Order placed</span><h1 className="serif mt-2 text-[27px] text-[#173f30] sm:text-[32px]">Thank you, {order.name.split(' ')[0]}.</h1><p className="mt-1 max-w-md text-[12.5px] text-[#718374]">{cod?'Your order has been received. You’ll pay when it arrives.':'We’ve received your order and will keep you updated.'}</p></>:<><h1 className="serif text-[27px] text-[#173f30] sm:text-[32px]">Order {order.reference}</h1><p className="mt-1 text-[12px] text-[#718374]">Placed {niceDate(order.created_at)}</p></>}
      </div><div className="flex gap-2"><Link to="/shop" className="btn-secondary">Keep shopping</Link>{!cod&&!paid&&<Link to={`/checkout/return?reference=${order.reference}`} className="btn-primary">Complete payment</Link>}</div></div></div></div>
    <div className="container-x mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#ecefe6] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-[13px] font-extrabold text-[#1f3829]"><Truck size={15} className="text-[#3f8a5f]"/>Delivery progress</h2><span className={`pill ${cancelled?'bg-[#f8ece8] text-[#a75a3d]':paid||cod?'bg-[#eaf6ec] text-[#1f7147]':'bg-[#fdf3e2] text-[#a87318]'}`}>{statusText(order.status)}</span></div>
          {cancelled?<div className="mt-4"><Alert>This order was cancelled.{order.payment_status==='paid'?' A refund will be handled by the store — please contact us.':''}</Alert></div>:<ol className="mt-5 space-y-4">{steps.map(([key,label],i)=>{const done=stepIndex>=i;return <li key={key} className="flex gap-3">{done?<CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2f8a5f]"/>:<Circle size={18} className="mt-0.5 shrink-0 text-[#cfdacb]"/>}<div><p className={`text-[12px] font-bold ${done?'text-[#1f3829]':'text-[#96a297]'}`}>{label}</p>{key==='confirmed'&&<p className="text-[10.5px] text-[#93a294]">Placed {niceDate(order.created_at)}</p>}</div></li>;})}</ol>}
          <div className="mt-5 grid gap-2 border-t border-[#f0f2ea] pt-4 text-[11.5px] sm:grid-cols-2"><p className="flex items-center gap-2 text-[#5c7062]"><Clock size={13} className="text-[#8b988c]"/>Requested: {niceDate(order.delivery_date)}, {order.delivery_time}</p><p className="flex items-center gap-2 capitalize text-[#5c7062]"><PackageCheck size={13} className="text-[#8b988c]"/>{order.delivery_type} delivery</p></div>
          <p className="mt-2 text-[10.5px] text-[#93a294]">Delivery dates and times are requests. We’ll contact you if anything changes.</p>
        </div>
        <div className="rounded-2xl border border-[#ecefe6] bg-white p-5"><h2 className="flex items-center gap-2 text-[13px] font-extrabold text-[#1f3829]"><ShoppingBag size={15} className="text-[#3f8a5f]"/>Items</h2>
          <div className="mt-3 divide-y divide-[#f2f4ec]">{order.items.map((item,i)=><div key={i} className="flex items-center gap-3 py-2.5"><img src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover"/><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold text-[#213a2b]">{item.name}</p><p className="text-[10px] text-[#93a294]">{item.unit} × {item.quantity}</p></div><b className="text-[12px] text-[#173f30]">{money(item.price*item.quantity)}</b></div>)}</div></div>
        <div className="rounded-2xl border border-[#ecefe6] bg-white p-5"><h2 className="flex items-center gap-2 text-[13px] font-extrabold text-[#1f3829]"><MapPin size={15} className="text-[#3f8a5f]"/>Delivery to</h2><p className="mt-2 text-[12px] font-semibold text-[#274434]">{order.name}</p><p className="mt-0.5 whitespace-pre-line text-[11.5px] leading-relaxed text-[#7b8b7d]">{order.address}</p><p className="mt-1 text-[11.5px] text-[#7b8b7d]">{order.phone} · {order.email}</p>{order.instructions&&<p className="mt-2 rounded-lg bg-[#f6f8f1] px-3 py-2 text-[11px] text-[#6b7d6f]"><b>Note:</b> {order.instructions}</p>}</div>
      </div>
      <aside className="space-y-3">
        <div className="rounded-2xl border border-[#ecefe6] bg-white p-5"><h2 className="flex items-center gap-2 text-[13px] font-extrabold text-[#1f3829]"><ReceiptText size={15} className="text-[#3f8a5f]"/>Payment</h2>
          <div className="mt-3 rounded-xl bg-[#f6f8f1] px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#93a294]">Status</p><p className={`text-[12px] font-bold ${paid?'text-[#1f7147]':order.payment_status==='expired'?'text-[#a75a3d]':'text-[#a87318]'}`}>{statusText(order.payment_status)}</p><p className="mt-0.5 text-[10.5px] text-[#8b988c]">{order.payment_method==='cod'?'Pay on delivery':'Paid securely via Paystack'}</p></div>
          <dl className="mt-3 space-y-2 text-[11.5px]"><div className="flex justify-between text-[#687b6e]"><dt>Subtotal</dt><dd className="font-semibold text-[#274434]">{money(order.subtotal)}</dd></div>{!!order.discount&&<div className="flex justify-between text-[#1f7147]"><dt>Discount {order.promo_code&&`(${order.promo_code})`}</dt><dd>−{money(order.discount)}</dd></div>}<div className="flex justify-between text-[#687b6e]"><dt>Delivery</dt><dd className="font-semibold text-[#274434]">{order.delivery_fee?money(order.delivery_fee):'Free'}</dd></div><div className="flex justify-between border-t border-[#f0f2ea] pt-2.5 text-[15px] font-extrabold text-[#173f30]"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl>
          <div className="mt-3 border-t border-dashed border-[#e4e9dd] pt-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#93a294]">Order reference</p><p className="mt-0.5 break-all font-mono text-[12px] font-bold text-[#173f30]">{order.reference}</p></div>
        </div>
        <div className="rounded-2xl bg-[#eef4e8] p-4"><p className="text-[11px] font-bold text-[#274434]">Questions about this order?</p><p className="mt-1 text-[10.5px] leading-relaxed text-[#5c7062]">Call {BRAND.phoneDisplay} or email us with your reference.</p><div className="mt-2 flex gap-2"><Link to="/contact" className="btn-secondary h-8 px-3 text-[10.5px]">Contact store</Link><Link to="/track" className="btn-secondary h-8 px-3 text-[10.5px]">Track</Link></div></div>
      </aside>
    </div>
  </>;
}
