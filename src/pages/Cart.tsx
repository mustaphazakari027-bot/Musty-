import {ArrowRight,ShieldCheck,ShoppingBasket,Tag,Trash2,Truck} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,money} from '../api';
import Quantity from '../components/Quantity';
import {ProductCard} from '../components/ProductCard';
import {Alert,EmptyState,PageHead,Spinner} from '../components/ui';
import {useQuote,useStore} from '../store';
import type {Product} from '../types';
export default function Cart(){
  const {cart,count,setQty,remove,add}=useStore(); const [promoInput,setPromoInput]=useState(''); const [promo,setPromo]=useState(''); const [promoMessage,setPromoMessage]=useState<{kind:'error'|'success';text:string}|null>(null);
  const {quote,error,loading}=useQuote(promo); const [suggestions,setSuggestions]=useState<Product[]>([]);
  useEffect(()=>{if(!cart.length){api<{products:Product[]}>('/products?sort=featured&limit=4').then(r=>setSuggestions(r.products.slice(0,4))).catch(()=>{});}},[cart.length]);
  const applyPromo=(e:React.FormEvent)=>{e.preventDefault();const code=promoInput.trim().toUpperCase();if(!code)return;setPromo(code);setPromoMessage(null);};
  useEffect(()=>{if(!quote)return;if(quote.promo_code){setPromoMessage({kind:'success',text:`${quote.promo_code} applied — you saved ${money(quote.discount)}.`});}else if(quote.promo_error){setPromoMessage({kind:'error',text:quote.promo_error});setPromo('');}},[quote]);
  const clearPromo=()=>{setPromo('');setPromoInput('');setPromoMessage(null);};
  if(!cart.length) return <><PageHead title="Your basket"/><div className="container-x mt-10"><EmptyState title="Your basket is waiting" text="Add fresh produce and everyday essentials to get started. Free delivery over ₦25,000." action="Browse the shop"/></div>
    {!!suggestions.length&&<section className="container-x mt-12"><h2 className="serif text-[22px] text-[#173f30]">A few fresh ideas</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{suggestions.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div></section>}</>;
  return <>
    <PageHead title="Your basket" description="Review your grocery basket, adjust quantities and apply a promo code before checkout."/>
    <div className="border-b border-[#eef0e7] bg-[#f3f5eb]"><div className="container-x py-7"><h1 className="serif text-[29px] text-[#173f30] sm:text-[34px]">Your basket</h1><p className="mt-1 text-[12px] text-[#76887b]">{count} {count===1?'item':'items'} ready for checkout</p></div></div>
    <div className="container-x mt-6 grid gap-6 lg:grid-cols-[1fr_370px] lg:items-start">
      <div>
        <div className="overflow-hidden rounded-2xl border border-[#ecefe6] bg-white">
          <div className="hidden grid-cols-[1fr_110px_110px_40px] gap-3 border-b border-[#f0f2ea] px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#93a294] sm:grid"><span>Product</span><span className="text-center">Quantity</span><span className="text-right">Total</span><span/></div>
          {cart.map(item=><div key={item.id} className="grid gap-3 border-b border-[#f2f4ec] px-4 py-4 last:border-0 sm:grid-cols-[1fr_110px_110px_40px] sm:items-center sm:px-5">
            <div className="flex gap-3"><Link to={`/product/${item.id}`} className="shrink-0"><img src={item.product.image} alt={item.product.name} className="h-[70px] w-[70px] rounded-xl object-cover"/></Link><div className="min-w-0"><Link to={`/product/${item.id}`} className="block text-[13px] font-bold text-[#1f3829] hover:text-[#0e6749]">{item.product.name}</Link><p className="mt-0.5 text-[10.5px] text-[#8b988c]">{item.product.unit}</p><p className="mt-1 text-[11px] text-[#6b7d6f]"><b className="text-[12.5px] text-[#173f30]">{money(item.product.price)}</b> each</p>{item.product.stock<item.quantity&&<p className="mt-1 text-[10px] font-semibold text-[#b35b33]">Only {item.product.stock} in stock</p>}</div></div>
            <div className="flex items-center justify-between gap-2 sm:justify-center"><Quantity value={item.quantity} max={Math.max(1,item.product.stock)} onChange={q=>setQty(item.id,q)} small/><button onClick={()=>remove(item.id)} aria-label={`Remove ${item.product.name}`} className="grid h-8 w-8 place-items-center rounded-full text-[#a3ada4] hover:bg-[#fbf0ed] hover:text-[#c85648] sm:hidden"><Trash2 size={14}/></button></div>
            <div className="flex items-center justify-between sm:block sm:text-right"><span className="text-[10px] text-[#93a294] sm:hidden">Line total</span><b className="text-[13.5px] text-[#173f30]">{money(item.product.price*item.quantity)}</b></div>
            <button onClick={()=>remove(item.id)} aria-label={`Remove ${item.product.name}`} className="mx-auto hidden h-8 w-8 place-items-center rounded-full text-[#a3ada4] hover:bg-[#fbf0ed] hover:text-[#c85648] sm:grid"><Trash2 size={14}/></button>
          </div>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Link to="/shop" className="btn-secondary">← Continue shopping</Link><div className="flex items-center gap-2 text-[11px] text-[#7b8b7d]"><ShieldCheck size={14} className="text-[#3f8a5f]"/>Prices and stock are confirmed at checkout</div></div>
        {cart.length>0&&suggestions.length>0&&<section className="mt-10"><div className="mb-3 flex items-end justify-between"><h2 className="serif text-[21px] text-[#173f30]">Complete your basket</h2><Link to="/shop" className="text-[11.5px] font-bold text-[#15704c]">See all</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{suggestions.slice(0,4).map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div></section>}
      </div>
      <aside className="lg:sticky lg:top-32">
        <div className="rounded-2xl border border-[#ecefe6] bg-white p-5">
          <h2 className="text-[14px] font-extrabold text-[#1f3829]">Order summary</h2>
          <form onSubmit={applyPromo} className="mt-4"><label htmlFor="promo" className="label">Promo code</label><div className="flex gap-2"><div className="relative flex-1"><Tag size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#93a294]"/><input id="promo" value={promoInput} onChange={e=>setPromoInput(e.target.value.toUpperCase())} placeholder="e.g. FRESH10" maxLength={30} className="input h-10 pl-8 text-[12px] uppercase"/></div><button disabled={loading||!promoInput.trim()} className="btn-secondary h-10 px-4 text-[11.5px]">Apply</button></div></form>
          {promoMessage&&<div className="mt-2.5"><Alert kind={promoMessage.kind}>{promoMessage.text}{promoMessage.kind==='success'&&<button onClick={clearPromo} className="ml-1 underline">Remove</button>}</Alert></div>}
          {error&&<div className="mt-2.5"><Alert>{error}</Alert></div>}
          <dl className="mt-5 space-y-2.5 border-t border-[#f0f2ea] pt-4 text-[12px]">
            <div className="flex justify-between text-[#687b6e]"><dt>Subtotal</dt><dd className="font-semibold text-[#274434]">{loading&&!quote?<span className="skeleton inline-block h-3 w-12 rounded"/>:money(quote?.subtotal ?? cart.reduce((n,i)=>n+i.product.price*i.quantity,0))}</dd></div>
            {!!quote?.discount&&<div className="flex justify-between text-[#1f7147]"><dt>Discount ({quote.promo_code})</dt><dd className="font-semibold">−{money(quote.discount)}</dd></div>}
            <div className="flex justify-between text-[#687b6e]"><dt>Delivery (standard)</dt><dd className="font-semibold text-[#274434]">{quote?quote.delivery_fee===0?'Free':money(quote.delivery_fee):'—'}</dd></div>
            <div className="flex justify-between border-t border-[#f0f2ea] pt-3 text-[15px] font-extrabold text-[#173f30]"><dt>Total</dt><dd>{quote?money(quote.total):'—'}</dd></div>
          </dl>
          <p className="mt-1 text-[10px] text-[#93a294]">Express delivery (₦1,500) can be selected at checkout.</p>
          <Link to="/checkout" aria-disabled={!quote} onClick={e=>{if(!quote)e.preventDefault();}} className={`btn-primary mt-4 w-full h-11 ${!quote?'pointer-events-none opacity-50':''}`}>Proceed to checkout<ArrowRight size={15}/></Link>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#93a294]"><ShieldCheck size={12}/>Secure Paystack checkout · No card details stored</div>
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#eef4e8] p-4"><Truck size={16} className="mt-0.5 shrink-0 text-[#3f8a5f]"/><p className="text-[11px] leading-relaxed text-[#5a7163]">Free standard delivery on baskets over ₦25,000. Pick a delivery slot during checkout.</p></div>
        <div className="mt-3 rounded-2xl border border-[#ecefe6] bg-white p-4"><p className="flex items-center gap-2 text-[11px] font-bold text-[#274434]"><ShoppingBasket size={13}/>Sample promo code</p><p className="mt-1 text-[10.5px] leading-relaxed text-[#829084]">Use <b className="text-[#15704c]">FRESH10</b> for 10% off baskets over ₦10,000 (max ₦2,000 off). Seed data for testing.</p></div>
      </aside>
    </div>
  </>;
}
