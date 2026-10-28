import {ChevronDown,Filter,Search,SlidersHorizontal,X} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {api} from '../api';
import {ProductCard,ProductSkeleton} from '../components/ProductCard';
import {EmptyState,PageHead} from '../components/ui';
import {useStore} from '../store';
import type {Product} from '../types';

const sortOptions=[['featured','Featured'],['newest','Newest first'],['price-low','Price: low to high'],['price-high','Price: high to low'],['name','Name A–Z']];
export default function Shop(){
  const {categories}=useStore(); const [params,setParams]=useSearchParams();
  const search=params.get('search')||''; const category=params.get('category')||''; const sort=params.get('sort')||'featured'; const min=params.get('min')||''; const max=params.get('max')||'';
  const [products,setProducts]=useState<Product[]|null>(null); const [total,setTotal]=useState(0); const [pages,setPages]=useState(1); const [page,setPage]=useState(1); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [filtersOpen,setFiltersOpen]=useState(false);
  const [minInput,setMinInput]=useState(min); const [maxInput,setMaxInput]=useState(max);
  function update(key:string,value:string){const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);setParams(next,{replace:false});}
  function applyPrice(e:React.FormEvent){e.preventDefault();const next=new URLSearchParams(params);minInput?next.set('min',String(Math.max(0,Number(minInput)||0))):next.delete('min');maxInput?next.set('max',String(Math.max(0,Number(maxInput)||0))):next.delete('max');setParams(next);setFiltersOpen(false);}
  useEffect(()=>{
    let ignore=false; setLoading(true); setError('');
    const q=new URLSearchParams({sort,page:String(page),limit:'12'}); if(search)q.set('search',search);if(category)q.set('category',category);if(min)q.set('min',min);if(max)q.set('max',max);
    api<{products:Product[];total:number;pages:number}>(`/products?${q}`).then(r=>{if(ignore)return;setProducts(prev=>page===1?r.products:[...(prev||[]),...r.products]);setTotal(r.total);setPages(r.pages);}).catch(e=>{if(!ignore)setError(e.message);}).finally(()=>{if(!ignore)setLoading(false);});
    return ()=>{ignore=true;};
  },[search,category,sort,min,max,page]);
  useEffect(()=>{setPage(1);setProducts(null);},[search,category,sort,min,max]);
  const activeCategory=categories.find(c=>c.id===category); const filtered=Boolean(search||category||min||max);
  const clearAll=()=>{setParams(new URLSearchParams());setMinInput('');setMaxInput('');};
  const FilterPanel=()=><div className="space-y-6">
    <div><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#7d8e80]">Categories</h3><div className="space-y-0.5">
      <button onClick={()=>{update('category','');setFiltersOpen(false);}} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition ${!category?'bg-[#eaf3e8] font-bold text-[#14573d]':'text-[#4e6556] hover:bg-[#f4f7ef]'}`}>All products</button>
      {categories.map(c=><button key={c.id} onClick={()=>{update('category',c.id);setFiltersOpen(false);}} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] transition ${category===c.id?'bg-[#eaf3e8] font-bold text-[#14573d]':'text-[#4e6556] hover:bg-[#f4f7ef]'}`}><span className="truncate">{c.name}</span><span className="ml-2 shrink-0 text-[10px] text-[#93a294]">{c.product_count}</span></button>)}
    </div></div>
    <form onSubmit={applyPrice}><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#7d8e80]">Price range (₦)</h3><div className="flex items-center gap-2"><input aria-label="Minimum price" type="number" min="0" inputMode="numeric" placeholder="Min" value={minInput} onChange={e=>setMinInput(e.target.value)} className="input h-10 !px-3 text-[12px]"/><span className="text-[#a3b0a4]">–</span><input aria-label="Maximum price" type="number" min="0" inputMode="numeric" placeholder="Max" value={maxInput} onChange={e=>setMaxInput(e.target.value)} className="input h-10 !px-3 text-[12px]"/></div><button className="btn-secondary mt-3 h-9 w-full text-[11.5px]">Apply price</button></form>
    <div><h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#7d8e80]">Popular picks</h3><div className="flex flex-wrap gap-1.5">{[['Under ₦2,500','0','2500'],['₦2,500 – ₦5,000','2500','5000'],['₦5,000+','5000','']].map(([label,a,b])=><button key={label} onClick={()=>{const next=new URLSearchParams(params);next.set('min',a);b?next.set('max',b):next.delete('max');setParams(next);}} className="rounded-full border border-[#e2e8db] px-2.5 py-1 text-[10.5px] font-medium text-[#556b5b] hover:border-[#a9c8b0] hover:bg-[#f2f7ee]">{label}</button>)}</div></div>
    {filtered&&<button onClick={clearAll} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#eadfd7] px-3 py-2 text-[11.5px] font-semibold text-[#a1573c] hover:bg-[#fdf4ef]"><X size={12}/>Clear all filters</button>}
  </div>;
  return <>
    <PageHead title={activeCategory?activeCategory.name:search?`Search: ${search}`:'Shop groceries'} description="Browse fresh produce, dairy, bakery, pantry staples and household essentials with clear naira pricing."/>
    <div className="border-b border-[#eef0e7] bg-[#f3f5eb]"><div className="container-x py-7"><nav aria-label="Breadcrumb" className="text-[10.5px] font-medium text-[#8b988c]"><Link to="/" className="hover:text-[#15704c]">Home</Link><span className="mx-1.5">/</span>{activeCategory?<><Link to="/shop" className="hover:text-[#15704c]">Shop</Link><span className="mx-1.5">/</span><span className="text-[#4e6556]">{activeCategory.name}</span></>:<span className="text-[#4e6556]">Shop</span>}</nav>
      <h1 className="serif mt-2 text-[29px] leading-tight text-[#173f30] sm:text-[34px]">{activeCategory?activeCategory.name:search?`Results for “${search}”`:'Fresh groceries, all in one place'}</h1>
      <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-[#718374]">{activeCategory?activeCategory.description:'Handpicked produce, everyday essentials and pantry favourites — delivered in Jos.'}</p></div></div>
    <div className="container-x mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block"><div className="sticky top-32"><FilterPanel/><div className="mt-6 rounded-2xl bg-[#eaf2e3] p-4"><p className="text-[11px] font-extrabold text-[#24523a]">Free delivery</p><p className="mt-1 text-[10.5px] leading-relaxed text-[#5c7663]">On orders over ₦25,000 within Jos. Standard delivery is ₦1,000 otherwise.</p><Link to="/policies" className="mt-2 inline-block text-[10.5px] font-bold text-[#15704c] underline">Delivery details</Link></div></div></aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ecefe6] bg-white px-3.5 py-2.5">
          <p className="text-[11.5px] text-[#7a8b7d]">{products===null?'Loading products…':<><b className="text-[#2c4636]">{total}</b> {total===1?'product':'products'}{search&&<> matching “{search}”</>}</>}</p>
          <div className="flex items-center gap-2">
            <button onClick={()=>setFiltersOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e6da] px-3 py-1.5 text-[11px] font-semibold text-[#4e6556] lg:hidden"><SlidersHorizontal size={12}/>Filters</button>
            <label htmlFor="sort" className="sr-only">Sort products</label><div className="relative"><select id="sort" value={sort} onChange={e=>update('sort',e.target.value)} className="appearance-none rounded-full border border-[#e0e6da] bg-white py-1.5 pl-3 pr-8 text-[11px] font-semibold text-[#4e6556] outline-none focus:border-[#4f9a74]">{sortOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8b7d]"/></div>
          </div>
        </div>
        {(search||min||max)&&<div className="mb-4 flex flex-wrap items-center gap-1.5"><span className="text-[10.5px] text-[#8b988c]">Active:</span>{search&&<Chip label={`Search: ${search}`} onClear={()=>update('search','')}/>}{min&&<Chip label={`From ₦${Number(min).toLocaleString()}`} onClear={()=>{update('min','');setMinInput('');}}/>}{max&&<Chip label={`Up to ₦${Number(max).toLocaleString()}`} onClear={()=>{update('max','');setMaxInput('');}}/>}</div>}
        {error?<div className="rounded-2xl border border-[#f0d6cf] bg-[#fdf1ee] p-4 text-[12px] text-[#9c3f2d]">{error}</div>:!products?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">{[0,1,2,3,4,5].map(i=><ProductSkeleton key={i}/>)}</div>:products.length===0?<EmptyState title="Nothing matched that search" text="Try a different keyword, browse a category, or clear your filters to see everything in the store." action="Clear filters" to="/shop"/>:<>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4 xl:grid-cols-4">{products.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>
          {page<pages&&<div className="mt-8 text-center"><button onClick={()=>setPage(p=>p+1)} disabled={loading} className="btn-secondary px-6">{loading?<>Loading…</>:<>Load more products <ChevronDown size={14}/></>}</button><p className="mt-2 text-[10.5px] text-[#93a294]">Showing {products.length} of {total}</p></div>}
        </>}
        {!filtered&&!search&&<div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-[#e8ece0] bg-white/60 p-6 text-center"><Search size={18} className="text-[#9cb29f]"/><p className="text-[11.5px] text-[#718374]">Can’t find something? Ask us — we may be able to source it for you.</p><Link to="/contact" className="text-[11.5px] font-bold text-[#15704c] underline">Send a request</Link></div>}
      </div>
    </div>
    {filtersOpen&&<div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-[#102b20]/35 backdrop-blur-sm" onClick={()=>setFiltersOpen(false)}/><div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#fbfaf5] p-5"><div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-[15px] font-extrabold"><Filter size={15}/>Filters</h2><button onClick={()=>setFiltersOpen(false)} aria-label="Close filters" className="grid h-8 w-8 place-items-center rounded-full bg-white"><X size={16}/></button></div><FilterPanel/><button onClick={()=>setFiltersOpen(false)} className="btn-primary mt-5 w-full">Show {total} products</button></div></div>}
  </>;
}
function Chip({label,onClear}:{label:string;onClear:()=>void}){return <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3e8] px-2.5 py-1 text-[10px] font-semibold text-[#266146]">{label}<button onClick={onClear} aria-label={`Remove ${label} filter`} className="text-[#629179] hover:text-[#20503a]"><X size={11}/></button></span>;}
