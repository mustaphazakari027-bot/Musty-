import {ArrowRight} from 'lucide-react';
import {Link} from 'react-router-dom';
import {PageHead} from '../components/ui';
import {useStore} from '../store';
export default function Categories(){const {categories}=useStore();return <>
  <PageHead title="Shop by category" description="Explore all grocery categories at Rikkos Fresh: fruit and vegetables, dairy, meat, bakery, snacks, drinks and household essentials."/>
  <section className="border-b border-[#eef0e7] bg-[#f0f4e8]"><div className="container-x py-10 sm:py-12"><p className="section-eyebrow">Browse the aisles</p><h1 className="serif mt-2 text-[32px] leading-tight text-[#173f30] sm:text-[40px]">Everything for a well-stocked kitchen.</h1><p className="mt-2 max-w-lg text-[13px] leading-relaxed text-[#61776a]">Eight thoughtfully curated categories, from farm-fresh produce to the little household things you always seem to need.</p></div></section>
  <div className="container-x mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {categories.map((c,i)=><Link key={c.id} to={`/shop?category=${c.id}`} className="group relative overflow-hidden rounded-[24px] border border-[#ebeee5] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-22px_rgba(23,63,48,.3)]" style={{animationDelay:`${i*40}ms`}}>
      <div className="relative h-[170px] overflow-hidden" style={{background:c.color}}><img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"/><div className="absolute inset-0 bg-gradient-to-t from-[#143326]/45 to-transparent"/><span className="pill absolute left-3 top-3 bg-white/90 text-[#356a4d]">{c.product_count} {c.product_count===1?'item':'items'}</span></div>
      <div className="flex items-start justify-between gap-3 p-5"><div><h2 className="text-[15px] font-extrabold text-[#1d3527] group-hover:text-[#0e6749]">{c.name}</h2><p className="mt-1 text-[11.5px] leading-relaxed text-[#829084]">{c.description}</p></div><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef4e9] text-[#2d7a53] transition group-hover:bg-[#126448] group-hover:text-white"><ArrowRight size={15}/></span></div>
    </Link>)}
    {!categories.length&&[0,1,2,3,4,5].map(i=><div key={i} className="rounded-[24px] border border-[#ebeee5] bg-white p-3"><div className="skeleton h-[170px] rounded-2xl"/><div className="skeleton mt-4 h-4 w-2/3 rounded"/><div className="skeleton mt-2 h-3 w-1/2 rounded"/></div>)}
  </div>
  <div className="container-x mt-10"><div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-[#173f30] px-6 py-8 text-center sm:flex-row sm:text-left"><div><h2 className="serif text-[22px] text-white">Looking for something specific?</h2><p className="mt-1 text-[12px] text-[#b9d2c3]">Tell us what you need and we’ll do our best to source it locally.</p></div><Link to="/contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#e3f0dd] px-6 py-3 text-[12.5px] font-bold text-[#173f30] transition hover:bg-white">Make a request</Link></div></div>
</>;}
