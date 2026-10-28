import {Heart} from 'lucide-react';
import {useEffect,useState} from 'react';
import {api} from '../api';
import {ProductCard,ProductSkeleton} from '../components/ProductCard';
import {EmptyState,PageHead} from '../components/ui';
import {useStore} from '../store';
import type {Product} from '../types';
export default function Favorites(){const {favorites}=useStore();const [products,setProducts]=useState<Product[]|null>(null);
  useEffect(()=>{api<{products:Product[]}>('/products?limit=40').then(r=>setProducts(r.products)).catch(()=>setProducts([]));},[]);
  const saved=(products||[]).filter(p=>favorites.includes(p.id));
  return <><PageHead title="Saved favourites" description="Your saved grocery favourites at Rikkos Fresh."/><div className="border-b border-[#eef0e7] bg-[#f3f5eb]"><div className="container-x py-8"><p className="section-eyebrow">For later</p><h1 className="serif mt-1.5 flex items-center gap-2 text-[29px] text-[#173f30]">Saved favourites<Heart size={22} className="fill-[#d9776a] text-[#d9776a]"/></h1><p className="mt-1 text-[12px] text-[#76887b]">Keep the things you love close at hand.</p></div></div>
    <div className="container-x mt-6">{!products?<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[0,1,2,3].map(i=><ProductSkeleton key={i}/>)}</div>:saved.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">{saved.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>:<EmptyState title="No favourites yet" text="Tap the heart on any product to keep it here for your next shop." action="Find something lovely" icon={<div className="grid h-16 w-16 place-items-center rounded-full bg-[#fdf0eb] text-[#c8887b]"><Heart size={26}/></div>}/>}</div>
  </>;}
