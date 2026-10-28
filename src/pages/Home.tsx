import {ArrowRight,CalendarClock,BadgeCheck,ChevronRight,Leaf,LockKeyhole,MapPin,Quote,ShoppingBasket,Truck} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {api,post} from '../api';
import {ProductCard,ProductSkeleton} from '../components/ProductCard';
import {PageHead,SectionHead} from '../components/ui';
import {BRAND} from '../brand';
import {useStore} from '../store';
import type {Product} from '../types';

const testimonials=[
  {name:'Amina Y.',location:'Rikkos, Jos',text:'The vegetables arrived crisp and beautifully packed. Ordering was simple and the delivery was earlier than I expected.',initial:'A',tone:'#e8f3e4'},
  {name:'Tunde O.',location:'Rayfield, Jos',text:'I do my weekly shop here now. The naira prices are clear, the produce is fresh, and checkout takes less than a minute.',initial:'T',tone:'#f7efe1'},
  {name:'Grace M.',location:'Jos North',text:'Lovely, friendly service. I especially appreciate the delivery updates — I always know when my basket is on the way.',initial:'G',tone:'#eef1e5'},
];
function Newsletter(){const [email,setEmail]=useState('');const [state,setState]=useState<'idle'|'loading'|'done'|'error'>('idle');const [message,setMessage]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setState('loading');try{await post('/newsletter',{email});setState('done');setEmail('');}catch(err){setState('error');setMessage((err as Error).message);}}
  return <section className="container-x mt-16"><div className="relative overflow-hidden rounded-[28px] bg-[#173f30] px-6 py-10 sm:px-12 sm:py-12"><div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#2a6a4d]/60 blur-2xl"/><div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#3f7a54]/40 blur-3xl"/>
    <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[1.1fr_1fr]">
      <div><p className="text-[10.5px] font-extrabold uppercase tracking-[.17em] text-[#9ad0ae]">The fresh letter</p><h2 className="serif mt-2 text-[27px] leading-tight text-white sm:text-[34px]">Good food, good prices — straight to your inbox.</h2><p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-[#b9d2c3]">Seasonal picks, pantry inspiration and small offers. One thoughtful email, never spam.</p></div>
      <div>{state==='done'?<div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-6 text-center"><BadgeCheck className="mx-auto text-[#a8e6b9]"/><p className="mt-2 text-[14px] font-bold text-white">You’re on the list.</p><p className="mt-1 text-[11.5px] text-[#b9d2c3]">Watch your inbox for our next fresh letter.</p></div>:
        <form onSubmit={submit}><label htmlFor="home-newsletter" className="sr-only">Email address</label><div className="flex flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row"><input id="home-newsletter" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" className="min-w-0 flex-1 rounded-xl bg-[#f7f8f2] px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-[#a9d9bd]"/><button className="btn-primary shrink-0" disabled={state==='loading'}>{state==='loading'?'Joining…':'Subscribe'}<ArrowRight size={15}/></button></div>{state==='error'&&<p role="alert" className="mt-2 text-[11px] text-[#f6b8a9]">{message}</p>}<p className="mt-2 text-[10.5px] text-[#8fae9d]">By subscribing you agree to our <Link to="/policies" className="underline">privacy note</Link>. Unsubscribe anytime.</p></form>}
      </div>
    </div></div></section>;
}
function bootProducts():Product[]|undefined{const b=(globalThis as any).__RF_CATALOGUE__;if(!b?.products?.length)return undefined;return b.products as Product[];}
export default function Home(){
  const {categories}=useStore(); const initial=bootProducts();
  const [best,setBest]=useState<Product[]|null>(initial?[...initial].sort((a,b)=>a.price-b.price).slice(0,8):null); const [fresh,setFresh]=useState<Product[]|null>(initial?[...initial].reverse().slice(0,4):null);
  useEffect(()=>{api<{products:Product[]}>('/products?sort=price-low&limit=8').then(r=>setBest(r.products)).catch(()=>setBest(prev=>prev||[]));api<{products:Product[]}>('/products?sort=newest&limit=4').then(r=>setFresh(r.products)).catch(()=>setFresh(prev=>prev||[]));
    const onReady=()=>{const p=bootProducts();if(p)setFresh([...p].reverse().slice(0,4));};window.addEventListener('rf-catalogue-ready',onReady);onReady();return()=>window.removeEventListener('rf-catalogue-ready',onReady);},[]);
  return <>
    <PageHead title="Fresh groceries, delivered in Jos" description="Shop fresh fruit, vegetables, dairy, bakery and everyday essentials at Rikkos Fresh. Clear naira prices and careful delivery in Jos, Plateau State."/>
    <section className="relative overflow-hidden hero-gradient">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#d6ead4]/70 blur-3xl"/><div aria-hidden className="pointer-events-none absolute right-1/4 top-0 h-64 w-64 rounded-full bg-[#f6e6cf]/80 blur-3xl"/>
      <div className="container-x relative grid gap-10 py-10 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:gap-6 lg:py-16">
        <div className="rise max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe2cf] bg-white/70 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[.12em] text-[#2a6c4d]"><Leaf size={12}/>Fresh from the market, daily</span>
          <h1 className="serif mt-5 text-[42px] leading-[1.03] text-[#133d2d] sm:text-[54px] lg:text-[58px]">Fresh Groceries<br className="hidden sm:block"/> Delivered to<br className="hidden sm:block"/> Your <span className="relative inline-block italic text-[#15704c]">Doorstep<span aria-hidden className="absolute -bottom-1 left-0 h-[6px] w-full rounded-full bg-[#c9e3c5]/80"/></span>.</h1>
          <p className="mt-5 max-w-[430px] text-[13.5px] leading-relaxed text-[#5a7163] sm:text-[14.5px]">Shop fresh fruits, vegetables, dairy, bakery products, and everyday essentials with ease — handpicked in Jos and delivered with care.</p>
          <div className="mt-7 flex flex-wrap items-center gap-3"><Link to="/shop" className="btn-primary h-12 px-6 text-[13.5px]">Shop now<ArrowRight size={16}/></Link><Link to="/categories" className="btn-secondary h-12 px-5 text-[13px] bg-white/70">Browse categories</Link></div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2"><div className="flex -space-x-2">{['#dbead4','#f4e3cb','#e7e7cc','#dcebe8'].map((c,i)=><span key={i} style={{background:c}} className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f4f3e9] text-[9px] font-extrabold text-[#41604c]">{['A','T','G','M'][i]}</span>)}</div><span className="text-[11px] font-semibold leading-tight text-[#4f6557]">Loved by<br/>Jos households</span></div>
            <div className="h-8 w-px bg-[#d7dfce]"/><div><p className="text-[13px] font-extrabold text-[#173f30]">₦25,000+</p><p className="text-[10.5px] text-[#718374]">Free delivery threshold</p></div>
            <div className="h-8 w-px bg-[#d7dfce]"/><div><p className="text-[13px] font-extrabold text-[#173f30]">Same day</p><p className="text-[10.5px] text-[#718374]">Local delivery in Jos</p></div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[540px]">
          <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[#e4eee0] shadow-[0_30px_60px_-30px_rgba(23,63,48,.35)] lg:rounded-[42px]">
            <img src="/images/hero-basket.webp" alt="A basket of fresh vegetables, fruit, bread and milk" width="1408" height="768" className="h-[300px] w-full bg-[#e4eee0] object-cover sm:h-[380px] lg:h-[450px]"/>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#173f30]/25 to-transparent"/>
          </div>
          <div className="absolute -left-1 top-6 flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2.5 shadow-[0_12px_30px_-12px_rgba(23,63,48,.35)] backdrop-blur sm:-left-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8f4e2] text-[#2d7d52]"><Truck size={15}/></span><div><p className="text-[10px] font-bold leading-tight text-[#173f30]">Local delivery</p><p className="text-[9.5px] text-[#83927f]">Jos &amp; environs</p></div></div>
          <div className="absolute -right-1 bottom-5 flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2.5 shadow-[0_12px_30px_-12px_rgba(23,63,48,.35)] backdrop-blur sm:-right-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#fcf0da] text-[#b07826]"><CalendarClock size={15}/></span><div><p className="text-[10px] font-bold leading-tight text-[#173f30]">Choose a slot</p><p className="text-[9.5px] text-[#83927f]">Morning or afternoon</p></div></div>
        </div>
      </div>
      <div className="container-x relative pb-8"><div className="grid gap-2 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
        {[{icon:Leaf,title:'Handpicked fresh',text:'Quality checked before dispatch'},{icon:Truck,title:'Delivered in Jos',text:'Standard or express delivery'},{icon:LockKeyhole,title:'Secure checkout',text:'Paystack-hosted payment'},{icon:MapPin,title:'Local & personal',text:'Rikkos, Jos North'}].map(({icon:Icon,title,text})=><div key={title} className="flex items-center gap-2.5 px-1 py-1.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eaf3e6] text-[#2f7a54]"><Icon size={14}/></span><span><span className="block text-[11.5px] font-bold text-[#25402f]">{title}</span><span className="block text-[10px] text-[#80907f]">{text}</span></span></div>)}
      </div></div>
    </section>

    <section className="container-x mt-10 lg:mt-14">
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="section-eyebrow">Shop by category</p><h2 className="serif mt-1 text-[25px] text-[#173f30] sm:text-[28px]">What are you cooking today?</h2></div><Link to="/categories" className="hidden items-center gap-1.5 text-[12px] font-bold text-[#15704c] hover:text-[#0b4c34] sm:inline-flex">All categories<ChevronRight size={14}/></Link></div>
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        {categories.map(c=><Link key={c.id} to={`/shop?category=${c.id}`} className="group flex w-[86px] shrink-0 flex-col items-center gap-2 sm:w-auto">
          <span className="grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-full border border-[#e7ebe0] shadow-sm transition group-hover:-translate-y-1 group-hover:border-[#b9d4bf] sm:h-[86px] sm:w-[86px]" style={{background:c.color}}><img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-95 transition duration-500 group-hover:scale-110"/></span>
          <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-[#304b3a] group-hover:text-[#0f6547]">{c.name}</span>
        </Link>)}
        {!categories.length&&[0,1,2,3,4,5,6,7].map(i=><div key={i} className="flex w-[86px] flex-col items-center gap-2 sm:w-auto"><div className="skeleton h-[76px] w-[76px] rounded-full sm:h-[86px] sm:w-[86px]"/><div className="skeleton h-2.5 w-16 rounded"/></div>)}
      </div>
    </section>

    <section className="container-x mt-12">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative min-h-[246px] overflow-hidden rounded-[26px] bg-[#eaf2e4]">
          <img src="/images/promo-greens.webp" alt="Fresh greens and avocados" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f3c2b]/85 via-[#123f2d]/55 to-transparent"/>
          <div className="relative z-10 max-w-[330px] p-7 sm:p-9">
            <span className="pill bg-[#d9f0d5] text-[#1d6242]">This week’s offer</span>
            <h2 className="serif mt-3 text-[28px] leading-[1.08] text-white sm:text-[33px]">Fresh greens<br/>up to 30% off</h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-[#cbe2d2]">Crisp, colourful and ready for your table. While stocks last.</p>
            <Link to="/shop?category=fruits-vegetables" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-bold text-[#145239] transition hover:bg-[#eef7ea]">Shop the greens<ArrowRight size={14}/></Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="relative overflow-hidden rounded-[26px] bg-[#fbf0e5]"><img src="/images/promo-fruit.webp" alt="Strawberries, oranges and tomatoes" loading="lazy" className="h-full w-full object-cover sm:h-[115px] lg:h-[118px]"/>
            <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-[#fdf4ea]/95 via-[#fdf4ea]/60 to-transparent p-5"><p className="text-[9.5px] font-extrabold uppercase tracking-[.13em] text-[#b0602e]">Market favourites</p><h3 className="serif mt-1 text-[19px] leading-tight text-[#3c2b1c]">Sweet, ripe<br/>and in season</h3><Link to="/shop?category=fruits-vegetables" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#a5542a]">Shop fruit<ArrowRight size={12}/></Link></div></div>
          <div className="relative overflow-hidden rounded-[26px] bg-[#eef3e8]">
            <div className="relative z-10 flex items-center justify-between gap-3 p-5"><div><p className="text-[9.5px] font-extrabold uppercase tracking-[.13em] text-[#6b8254]">Pantry made easy</p><h3 className="serif mt-1 text-[19px] leading-tight text-[#243a24]">Everyday<br/>essentials</h3><Link to="/shop?category=pantry" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#4e6b39]">Stock up<ArrowRight size={12}/></Link></div><img src="/images/rice.jpg" alt="" loading="lazy" className="h-[92px] w-[92px] shrink-0 rounded-2xl object-cover"/></div>
          </div>
        </div>
      </div>
    </section>

    <section className="container-x mt-14">
      <SectionHead eyebrow="Bestsellers" title="The basket favourites" link="/shop?sort=price-low" linkLabel="Shop all products"/>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {best?best.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>):[0,1,2,3,4,5,6,7].map(i=><ProductSkeleton key={i}/>)}
      </div>
    </section>

    <section className="container-x mt-14">
      <div className="grid gap-4 rounded-[28px] bg-[#eef3e6] p-4 sm:p-5 lg:grid-cols-[0.9fr_1.35fr]">
        <div className="relative overflow-hidden rounded-[22px] bg-[#f8e9d5] p-6 sm:p-7">
          <p className="text-[9.5px] font-extrabold uppercase tracking-[.15em] text-[#b0602e]">Everyday essentials</p>
          <h2 className="serif mt-2 max-w-[230px] text-[27px] leading-[1.05] text-[#3a2a1b] sm:text-[31px]">Big savings on everyday essentials</h2>
          <p className="mt-2 max-w-[210px] text-[11px] leading-relaxed text-[#8a7259]">Pantry, dairy and household favourites — priced kindly, every day.</p>
          <Link to="/shop?category=pantry" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[11px] font-bold text-[#7d4b23] shadow-sm transition hover:bg-[#fffaf3]">Shop now<ArrowRight size={13}/></Link>
          <img src="/images/rice.jpg" alt="" className="mt-5 h-[108px] w-full rounded-xl object-cover"/>
          <span className="absolute right-4 top-4 grid h-11 w-11 rotate-6 place-items-center rounded-full bg-[#126448] text-[13px] font-extrabold text-white shadow-md">%</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[{img:'/images/tomato.jpg',eyebrow:'Market favourites',title:'Sweet, ripe and in season',text:'Handpicked produce at its best.',to:'/shop?category=fruits-vegetables',label:'Shop fresh',tone:'#fdf1e9'},{img:'/images/eggs.jpg',eyebrow:'Breakfast made easy',title:'Farm eggs & dairy',text:'The everyday essentials, ready for you.',to:'/shop?category=dairy-eggs',label:'Shop dairy',tone:'#f3f6ea'},{img:'/images/juice.jpg',eyebrow:'Something refreshing',title:'Juices & drinks',text:'A little sunshine in every glass.',to:'/shop?category=beverages',label:'Shop drinks',tone:'#fbf3e2'},{img:'/images/bread.jpg',eyebrow:'Fresh from the oven',title:'Bakery favourites',text:'Loaves worth waking up for.',to:'/shop?category=bakery',label:'Shop bakery',tone:'#f6efe4'}].map(p=><Link key={p.title} to={p.to} className="group flex min-h-[168px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/70 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-20px_rgba(23,63,48,.35)]" style={{background:p.tone}}>
            <div><p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#7f9160]">{p.eyebrow}</p><h3 className="serif mt-1 text-[18px] leading-tight text-[#233a25]">{p.title}</h3><p className="mt-1 text-[10.5px] leading-relaxed text-[#77866f]">{p.text}</p></div>
            <div className="mt-3 flex items-center justify-between"><span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#3f6b45] group-hover:underline">{p.label}<ArrowRight size={11}/></span><img src={p.img} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover shadow-sm"/></div>
          </Link>)}
        </div>
      </div>
    </section>

    <section className="container-x mt-14">
      <SectionHead eyebrow="Just arrived" title="Fresh on the shelf" link="/shop?sort=newest" linkLabel="See new arrivals"/>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">{fresh?fresh.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>):[0,1,2,3].map(i=><ProductSkeleton key={i}/>)}</div>
    </section>

    <section className="container-x mt-16">
      <div className="mb-6 text-center"><p className="section-eyebrow">Kind words</p><h2 className="serif mt-1.5 text-[27px] text-[#173f30] sm:text-[31px]">From our neighbours</h2><p className="mx-auto mt-2 max-w-md text-[12px] text-[#7b8b7d]">Sample feedback shown for this storefront build. Replace with verified reviews before launch.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{testimonials.map(t=><figure key={t.name} className="flex flex-col rounded-3xl border border-[#e9ece1] bg-white p-6"><Quote size={20} className="text-[#bcd4be]" aria-hidden/><blockquote className="mt-3 flex-1 text-[12.5px] leading-relaxed text-[#4c6253]">“{t.text}”</blockquote><figcaption className="mt-5 flex items-center gap-3 border-t border-[#f0f2ea] pt-4"><span style={{background:t.tone}} className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-extrabold text-[#48604f]">{t.initial}</span><span><span className="block text-[12px] font-bold text-[#203a2a]">{t.name}</span><span className="block text-[10.5px] text-[#8b988c]">{t.location}</span></span></figcaption></figure>)}</div>
    </section>

    <Newsletter/>
    <section className="container-x mt-10"><div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#e8ece0] bg-white px-6 py-5 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf3e6] text-[#2f7a54]"><ShoppingBasket size={18}/></span><p className="text-[12.5px] leading-snug text-[#5a7163]"><b className="text-[#203a2a]">Need help with an order?</b> Our team is in {BRAND.address.split(',')[0]}, Jos — reach us any weekday.</p></div><Link to="/contact" className="btn-secondary shrink-0">Contact the store</Link></div></section>
  </>;
}
