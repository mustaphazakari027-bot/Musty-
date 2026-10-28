import {useEffect,useRef,useState} from 'react';
import {ChevronDown,Heart,LayoutGrid,MapPin,Menu,Search,ShoppingBasket,User,X} from 'lucide-react';
import {Link,useLocation,useNavigate,useSearchParams} from 'react-router-dom';
import {useStore} from '../store';
import {money} from '../api';
import Logo from './Logo';
import {BRAND} from '../brand';

function SearchBox({onDone}:{onDone?:()=>void}) {
  const [params]=useSearchParams(); const [value,setValue]=useState(params.get('search')||''); const navigate=useNavigate(); const location=useLocation();
  useEffect(()=>{ setValue(new URLSearchParams(location.search).get('search')||''); },[location.pathname,location.search]);
  return <form role="search" onSubmit={e=>{e.preventDefault();navigate(`/shop${value.trim()?`?search=${encodeURIComponent(value.trim())}`:''}`);onDone?.();}} className="relative w-full">
    <label htmlFor="site-search" className="sr-only">Search groceries</label>
    <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#718378]" />
    <input id="site-search" value={value} onChange={e=>setValue(e.target.value)} placeholder="Search for products, e.g. avocado" maxLength={100} className="h-11 w-full rounded-full border border-[#e1e7dc] bg-[#f7f8f2] pl-10 pr-24 text-[13px] text-[#20362a] outline-none transition placeholder:text-[#94a094] focus:border-[#4f9a74] focus:bg-white focus:ring-4 focus:ring-[#dbeee1]" />
    <button type="submit" className="absolute right-1 top-1 h-9 rounded-full bg-[#126448] px-4 text-[12px] font-bold text-white transition hover:bg-[#0a5038]">Search</button>
  </form>;
}
export default function Header() {
  const {count,cart,categories,user}=useStore(); const [drawer,setDrawer]=useState(false); const [mega,setMega]=useState(false); const [cartOpen,setCartOpen]=useState(false); const megaRef=useRef<HTMLDivElement>(null); const location=useLocation();
  useEffect(()=>{setDrawer(false);setMega(false);setCartOpen(false);},[location.pathname]);
  useEffect(()=>{const close=(e:MouseEvent)=>{if(megaRef.current&&!megaRef.current.contains(e.target as Node))setMega(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMega(false);setDrawer(false);setCartOpen(false);}};document.addEventListener('mousedown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',key);};},[]);
  const subtotal=cart.reduce((n,i)=>n+i.product.price*i.quantity,0); const progress=Math.min(100,Math.round(subtotal/2500000*100));
  return <>
    <div className="bg-[#173f30] text-white"><div className="container-x flex h-9 items-center justify-between text-[11px]"><p className="font-medium tracking-wide"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#8ee0a8] align-middle"/>Free delivery in Jos on orders over ₦25,000</p><div className="hidden items-center gap-4 sm:flex"><a href={`tel:${BRAND.phoneTel}`} className="hover:text-[#c9f0d6]">{BRAND.phoneDisplay}</a><span className="text-[#5b7b69]">|</span><Link to="/track" className="hover:text-[#c9f0d6]">Track your order</Link></div></div></div>
    <header className="sticky top-0 z-40 border-b border-[#ecefe6] bg-[#fbfaf5]/95 backdrop-blur-md">
      <div className="container-x flex h-[68px] items-center gap-3 lg:gap-6">
        <button onClick={()=>setDrawer(true)} aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full text-[#2a4636] hover:bg-[#eef2e9] lg:hidden"><Menu size={21}/></button>
        <Logo/>
        <div className="hidden flex-1 items-center gap-4 md:flex">
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#e4e8dc] bg-white px-3 py-2 text-[11px] font-semibold text-[#4e6455] xl:inline-flex"><MapPin size={13} className="text-[#15845c]"/>Rikkos, Jos North<ChevronDown size={12}/></span>
          <div className="max-w-[560px] flex-1"><SearchBox/></div>
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link to="/favorites" aria-label="Favourites" className="hidden h-10 w-10 place-items-center rounded-full text-[#2a4636] hover:bg-[#eef2e9] sm:grid"><Heart size={19}/></Link>
          <Link to={user?'/account':'/login'} className="hidden items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold text-[#2a4636] hover:bg-[#eef2e9] sm:flex"><User size={18}/><span className="hidden lg:inline">{user?user.name.split(' ')[0]:'Sign in'}</span></Link>
          <button onClick={()=>setCartOpen(true)} className="relative flex items-center gap-2 rounded-full bg-[#126448] px-3.5 py-2.5 text-white transition hover:bg-[#0a5038]" aria-label={`Open basket, ${count} items`}>
            <ShoppingBasket size={17}/><span className="hidden text-[12px] font-bold lg:inline">Basket</span>
            {count>0&&<span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f5c45e] px-1 text-[10px] font-extrabold text-[#3b2a08]">{count}</span>}
          </button>
        </div>
      </div>
      <div className="container-x pb-3 md:hidden"><SearchBox/></div>
      <div className="hidden border-t border-[#f0f1e9] lg:block"><div className="container-x flex h-11 items-center gap-1" ref={megaRef}>
        <div className="relative">
          <button onClick={()=>setMega(v=>!v)} aria-expanded={mega} className="mr-2 inline-flex items-center gap-2 rounded-full bg-[#eaf3e8] px-3.5 py-1.5 text-[12px] font-bold text-[#14573d] hover:bg-[#dcecdf]"><LayoutGrid size={13}/>All categories<ChevronDown size={12} className={`transition ${mega?'rotate-180':''}`}/></button>
          {mega&&<div className="absolute left-0 top-11 w-[620px] rounded-2xl border border-[#e7eadf] bg-white p-3 shadow-[0_24px_50px_-20px_rgba(23,63,48,.3)]">
            <div className="grid grid-cols-2 gap-1">{categories.map(c=><Link key={c.id} to={`/shop?category=${c.id}`} onClick={()=>setMega(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#f4f8f1]"><img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy"/><span><span className="block text-[12.5px] font-bold text-[#233b2c]">{c.name}</span><span className="block text-[10.5px] text-[#8a978a]">{c.product_count} items</span></span></Link>)}</div>
            <Link to="/categories" onClick={()=>setMega(false)} className="mt-2 flex items-center justify-center rounded-xl bg-[#f5f8f1] py-2 text-[12px] font-bold text-[#14573d] hover:bg-[#edf4e8]">Browse all categories</Link>
          </div>}
        </div>
        {categories.slice(0,6).map(c=><Link key={c.id} to={`/shop?category=${c.id}`} className="nav-link">{c.name}</Link>)}
        <Link to="/shop?sort=newest" className="nav-link ml-auto inline-flex items-center gap-1.5 text-[#b34f24]"><span className="h-1.5 w-1.5 rounded-full bg-[#e8925d]"/>Today’s fresh picks</Link>
      </div></div>
    </header>
    {drawer&&<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-[#102b20]/35 backdrop-blur-sm" onClick={()=>setDrawer(false)}/>
      <div className="absolute left-0 top-0 flex h-full w-[85%] max-w-[360px] flex-col overflow-y-auto bg-[#fbfaf5] p-5 shadow-2xl">
        <div className="flex items-center justify-between"><Logo compact/><button onClick={()=>setDrawer(false)} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full bg-white"><X size={18}/></button></div>
        <div className="mt-6 space-y-1">
          {[['Shop everything','/shop'],['Categories','/categories'],['Fresh picks','/shop?sort=newest'],['Favourites','/favorites'],['Track an order','/track'],['Contact us','/contact']].map(([label,href])=><Link key={href} to={href} onClick={()=>setDrawer(false)} className="block rounded-xl px-3 py-3 text-[14px] font-semibold text-[#263f30] hover:bg-[#eef3e9]">{label}</Link>)}
        </div>
        <p className="mt-6 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#8a988a]">Shop by category</p>
        <div className="mt-2">{categories.map(c=><Link key={c.id} to={`/shop?category=${c.id}`} onClick={()=>setDrawer(false)} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#eef3e9]"><img src={c.image} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy"/><span className="text-[13px] font-medium text-[#33493b]">{c.name}</span></Link>)}</div>
        <div className="mt-auto space-y-2 pt-6"><Link to={user?'/account':'/login'} onClick={()=>setDrawer(false)} className="btn-primary w-full">{user?'My account':'Sign in / Create account'}</Link><a href={`tel:${BRAND.phoneTel}`} className="btn-secondary w-full">Call {BRAND.phoneDisplay}</a></div>
      </div>
    </div>}
    {cartOpen&&<CartDrawer onClose={()=>setCartOpen(false)} subtotal={subtotal} progress={progress}/>}
  </>;
}
function CartDrawer({onClose,subtotal,progress}:{onClose:()=>void;subtotal:number;progress:number}) {
  const {cart,count,setQty,remove}=useStore();
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your basket">
    <div className="absolute inset-0 bg-[#102b20]/35 backdrop-blur-sm" onClick={onClose}/>
    <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-[#fbfaf5] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#e8ebe2] px-5 py-4"><div><h2 className="text-[17px] font-extrabold text-[#173f30]">Your basket</h2><p className="text-[11px] text-[#839182]">{count} {count===1?'item':'items'}</p></div><button onClick={onClose} aria-label="Close basket" className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"><X size={17}/></button></div>
      {cart.length===0?<div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><div className="grid h-16 w-16 place-items-center rounded-full bg-[#eaf3e8] text-[#317a53]"><ShoppingBasket size={27}/></div><h3 className="mt-4 text-[16px] font-bold">Your basket is empty</h3><p className="mt-1 text-[12.5px] text-[#839182]">Explore fresh fruit, pantry staples and more.</p><Link to="/shop" onClick={onClose} className="btn-primary mt-5">Start shopping</Link></div>
      :<><div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-xl border border-[#e5ecdd] bg-white p-3"><p className="text-[11px] font-semibold text-[#536b5b]">{subtotal>=2500000?'You unlocked free standard delivery 🎉':`Add ${money(2500000-subtotal)} more for free delivery`}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2e9]"><div className="h-full rounded-full bg-[#2d9a68] transition-all" style={{width:`${progress}%`}}/></div></div>
        {cart.map(item=><div key={item.id} className="flex gap-3 rounded-xl border border-[#ecefe6] bg-white p-3">
          <img src={item.product.image} alt="" className="h-16 w-16 rounded-lg object-cover"/>
          <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-bold text-[#213a2b]">{item.product.name}</p><p className="text-[10.5px] text-[#8a988a]">{item.product.unit}</p><div className="mt-2 flex items-center justify-between"><span className="text-[13px] font-extrabold">{money(item.product.price*item.quantity)}</span><span className="text-[10px] text-[#839182]">{money(item.product.price)} each</span></div></div>
          <div className="flex flex-col items-end justify-between"><button onClick={()=>remove(item.id)} aria-label={`Remove ${item.product.name}`} className="text-[10px] font-semibold text-[#a5ad9f] hover:text-[#c85648]">Remove</button><QtyControl value={item.quantity} max={item.product.stock} onChange={q=>setQty(item.id,q)}/></div>
        </div>)}
      </div>
      <div className="border-t border-[#e8ebe2] bg-white p-5"><div className="flex justify-between text-[12px] text-[#6a7c6e]"><span>Subtotal</span><b className="text-[#173f30]">{money(subtotal)}</b></div><p className="mt-1 text-[10.5px] text-[#95a094]">Delivery is calculated at checkout.</p><Link to="/cart" onClick={onClose} className="btn-secondary mt-3 w-full">View basket</Link><Link to="/checkout" onClick={onClose} className="btn-primary mt-2 w-full">Checkout securely</Link></div></>}
    </aside>
  </div>;
}
function QtyControl({value,max,onChange}:{value:number;max:number;onChange:(n:number)=>void}){return <div className="flex items-center rounded-full border border-[#e3e8dd]"><button onClick={()=>onChange(value-1)} aria-label="Decrease" className="h-6 w-6 text-[12px] font-bold text-[#4b6253] hover:bg-[#f2f5ee]">−</button><span className="min-w-5 text-center text-[10.5px] font-bold">{value}</span><button onClick={()=>onChange(value+1)} disabled={value>=max} aria-label="Increase" className="h-6 w-6 text-[12px] font-bold text-[#4b6253] disabled:opacity-30 hover:bg-[#f2f5ee]">+</button></div>;}
