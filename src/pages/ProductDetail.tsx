import {ArrowRight,ChevronRight,Clock,Heart,Leaf,Minus,Plus,ShieldCheck,ShoppingBasket,Truck} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {api,money} from '../api';
import Quantity from '../components/Quantity';
import {ProductCard,ProductSkeleton} from '../components/ProductCard';
import Stars from '../components/Stars';
import {Alert,EmptyState,PageHead} from '../components/ui';
import {useStore} from '../store';
import type {Product} from '../types';
export default function ProductDetail(){
  const {id}=useParams(); const navigate=useNavigate(); const {add,favorites,toggleFavorite,toast}=useStore();
  const [product,setProduct]=useState<Product|null>(null); const [related,setRelated]=useState<Product[]>([]); const [qty,setQty]=useState(1); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  useEffect(()=>{let ignore=false;setLoading(true);setError('');setQty(1);window.scrollTo({top:0});
    api<Product>(`/products/${id}`).then(p=>{if(ignore)return;setProduct(p);return api<{products:Product[]}>(`/products?category=${p.category_id}&limit=5`).then(r=>{if(!ignore)setRelated(r.products.filter(x=>x.id!==p.id).slice(0,4));});}).catch(e=>{if(!ignore)setError(e.message);}).finally(()=>{if(!ignore)setLoading(false);});
    return ()=>{ignore=true;};},[id]);
  if(loading) return <div className="container-x mt-8 grid gap-8 lg:grid-cols-2">{[0,1].map(i=><div key={i} className="skeleton h-[420px] rounded-3xl"/>)}</div>;
  if(error||!product) return <div className="container-x mt-10"><EmptyState title="We couldn’t find that product" text="It may have sold out or been removed. Have a look at the rest of the shop instead." action="Back to the shop"/></div>;
  const favorite=favorites.includes(product.id); const soldOut=product.stock<=0; const saving=product.old_price?product.old_price-product.price:0;
  const buyNow=()=>{add(product,qty);navigate('/cart');};
  return <>
    <PageHead title={product.name} description={product.description.slice(0,155)}/>
    <div className="container-x mt-6"><nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[10.5px] font-medium text-[#8b988c]"><Link to="/" className="hover:text-[#15704c]">Home</Link><ChevronRight size={11}/><Link to="/shop" className="hover:text-[#15704c]">Shop</Link><ChevronRight size={11}/><Link to={`/shop?category=${product.category_id}`} className="hover:text-[#15704c]">{product.category_name}</Link><ChevronRight size={11}/><span className="text-[#4e6556]">{product.name}</span></nav></div>
    <section className="container-x mt-4 grid gap-8 lg:grid-cols-[1.02fr_1fr] lg:gap-12">
      <div>
        <div className="relative overflow-hidden rounded-[28px] border border-[#e9ece1] bg-[#f1f4ea]"><img src={product.image} alt={product.name} width="700" height="700" className="aspect-square w-full object-cover"/>
          {product.badge&&<span className="pill absolute left-4 top-4 bg-white/95 text-[#b34f24] shadow-sm">{product.badge}</span>}
          <button onClick={()=>toggleFavorite(product.id)} aria-pressed={favorite} aria-label={favorite?'Remove from favourites':'Save to favourites'} className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full shadow-sm transition ${favorite?'bg-[#ffe9e5] text-[#c85648]':'bg-white/95 text-[#60766a] hover:text-[#c85648]'}`}><Heart size={17} className={favorite?'fill-current':''}/></button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[{icon:Leaf,label:'Quality checked'},{icon:Truck,label:'Jos delivery'},{icon:ShieldCheck,label:'Secure payment'}].map(({icon:Icon,label})=><div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-[#ebeee5] bg-white px-2 py-3 text-center"><Icon size={15} className="text-[#2f7a54]"/><span className="text-[10px] font-semibold text-[#5b7161]">{label}</span></div>)}
        </div>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2"><span className="pill bg-[#eef4e8] text-[#3a7352]">{product.category_name}</span>{product.stock>0?<span className="pill bg-[#eaf6ec] text-[#1f7147]"><span className="h-1.5 w-1.5 rounded-full bg-[#2fa268]"/>In stock</span>:<span className="pill bg-[#f6ece8] text-[#a75a3d]">Sold out</span>}{product.stock>0&&product.stock<=10&&<span className="pill bg-[#fdf3e2] text-[#a87318]">Only {product.stock} left</span>}</div>
        <h1 className="serif mt-3 text-[30px] leading-tight text-[#173f30] sm:text-[36px]">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3"><Stars rating={product.rating} count={product.review_count}/><span className="text-[10.5px] text-[#93a294]">{product.unit}</span></div>
        <div className="mt-4 flex flex-wrap items-end gap-2.5"><span className="text-[28px] font-extrabold tracking-tight text-[#133d2d]">{money(product.price)}</span>{product.old_price&&<><span className="pb-1 text-[14px] text-[#a0aaa0] line-through">{money(product.old_price)}</span><span className="mb-1.5 pill bg-[#ffece4] text-[#b34f24]">Save {money(saving)}</span></>}</div>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-[#5c7062]">{product.description}</p>
        <dl className="mt-5 grid max-w-sm grid-cols-2 gap-2 text-[11.5px]"><div className="rounded-xl border border-[#ebeee5] bg-white px-3 py-2.5"><dt className="text-[10px] font-semibold uppercase tracking-wide text-[#93a294]">Pack size</dt><dd className="mt-0.5 font-bold text-[#274434]">{product.unit}</dd></div><div className="rounded-xl border border-[#ebeee5] bg-white px-3 py-2.5"><dt className="text-[10px] font-semibold uppercase tracking-wide text-[#93a294]">Category</dt><dd className="mt-0.5 font-bold text-[#274434]">{product.category_name}</dd></div></dl>
        <div className="mt-6 flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 rounded-full border border-[#e3e8dd] bg-white p-1 pl-3"><span className="text-[11px] font-semibold text-[#7c8d7f]">Qty</span><Quantity value={qty} max={Math.max(1,product.stock)} onChange={n=>setQty(Math.max(1,Math.min(n,product.stock,50)))}/></div><button onClick={()=>{add(product,qty);}} disabled={soldOut} className="btn-primary h-11 flex-1 sm:flex-none sm:px-7"><ShoppingBasket size={16}/>{soldOut?'Sold out':'Add to basket'}</button></div>
        <button onClick={buyNow} disabled={soldOut} className="btn-secondary mt-2.5 h-11 w-full sm:w-auto sm:px-6">Go to basket<ArrowRight size={14}/></button>
        <Alert kind="info" className="mt-5"><span className="block leading-relaxed">Free delivery on orders over ₦25,000 in Jos. Standard delivery is ₦1,000; express is ₦1,500. <Link to="/policies" className="font-bold underline">Delivery details</Link></span></Alert>
        <div className="mt-5 divide-y divide-[#eff1e9] border-y border-[#eff1e9]">
          {[{icon:Truck,t:'Delivery in Jos',d:'Choose a morning, afternoon or evening slot at checkout. Orders placed before 11am can often arrive the same day.'},{icon:Clock,t:'Freshness promise',d:'Produce is checked before dispatch. If something isn’t right, contact us within 24 hours and we’ll make it right.'},{icon:ShieldCheck,t:'Secure payment',d:'Card payment is handled on Paystack’s secure checkout. We never store your card details.'}].map(({icon:Icon,t,d})=><details key={t} className="group py-3.5"><summary className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-bold text-[#274434] marker:content-none"><Icon size={15} className="text-[#3f8a5f]"/>{t}<Plus size={13} className="ml-auto text-[#93a294] transition group-open:rotate-45"/></summary><p className="mt-2 pl-[26px] text-[11.5px] leading-relaxed text-[#77887b]">{d}</p></details>)}
        </div>
      </div>
    </section>
    <section className="container-x mt-14"><div className="mb-5 flex items-end justify-between"><div><p className="section-eyebrow">You may also like</p><h2 className="serif mt-1 text-[24px] text-[#173f30]">More from {product.category_name}</h2></div><Link to={`/shop?category=${product.category_id}`} className="hidden items-center gap-1 text-[12px] font-bold text-[#15704c] sm:inline-flex">See all<ChevronRight size={14}/></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">{related.length?related.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>):[0,1,2,3].map(i=><ProductSkeleton key={i}/>)}</div></section>
    <button onClick={()=>{add(product,qty);toast(`${product.name} added — ${qty} in your basket`);}} disabled={soldOut} className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#126448] text-white shadow-lg sm:hidden" aria-label="Add to basket"><Plus size={20}/></button>
  </>;
}
