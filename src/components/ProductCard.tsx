import {Heart,Plus} from 'lucide-react';
import {Link} from 'react-router-dom';
import {money} from '../api';
import {useStore} from '../store';
import type {Product} from '../types';
import Stars from './Stars';

export function ProductCard({product,index=0}:{product:Product;index?:number}) {
  const {add,favorites,toggleFavorite}=useStore(); const favorite=favorites.includes(product.id); const soldOut=product.stock<=0;
  return <article className="group relative flex flex-col rounded-[20px] border border-[#edf0e8] bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_-18px_rgba(23,63,48,.25)]">
    <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden rounded-[15px] bg-[#f2f4ed]">
      <div className="absolute inset-0 bg-white" aria-hidden/><img src={product.image} alt={product.name} loading={index<4?'eager':'lazy'} className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.055]" width="700" height="700" />
      {product.badge&&<span className={`pill absolute left-2 top-2 ${product.badge.includes('OFF')?'bg-[#fff0ea] text-[#b34f24]':'bg-[#e9f6ea] text-[#1b714f]'}`}>{product.badge}</span>}
      {soldOut&&<span className="absolute inset-0 grid place-items-center rounded-[15px] bg-white/65 text-[11px] font-extrabold uppercase tracking-widest text-[#5d6b5e]">Sold out</span>}
    </Link>
    <button onClick={()=>toggleFavorite(product.id)} aria-label={favorite?'Remove from favourites':'Save to favourites'} aria-pressed={favorite} className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full shadow-sm transition ${favorite?'bg-[#ffe9e5] text-[#c85648]':'bg-white/95 text-[#6c7b70] hover:text-[#c85648]'}`}><Heart size={14} className={favorite?'fill-current':''}/></button>
    <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
      <div className="mb-1 flex items-center justify-between gap-2"><span className="truncate text-[9.5px] font-bold uppercase tracking-[.04em] text-[#819286]">{product.category_name}</span><Stars rating={product.rating} count={product.review_count}/></div>
      <Link to={`/product/${product.id}`} className="line-clamp-1 text-[13.5px] font-bold text-[#1c3327] hover:text-[#0e6749]">{product.name}</Link>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8d998f]">{product.unit} · {product.stock>0&&product.stock<10?`Only ${product.stock} left`:'in stock'}</p>
      <div className="mt-auto flex items-end justify-between pt-3">
        <div><span className="text-[15px] font-extrabold tracking-tight text-[#133d2d]">{money(product.price)}</span>{product.old_price&&<span className="ml-1.5 text-[11px] text-[#a0aaa0] line-through">{money(product.old_price)}</span>}</div>
        <button onClick={()=>add(product)} disabled={soldOut} aria-label={`Add ${product.name} to basket`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#126448] text-white transition hover:bg-[#0a4f39] disabled:bg-[#d5ddd3]"><Plus size={15} strokeWidth={2.6}/></button>
      </div>
    </div>
  </article>;
}
export function ProductSkeleton(){return <div className="rounded-[20px] border border-[#edf0e8] bg-white p-2.5"><div className="skeleton aspect-square rounded-[15px]"/><div className="skeleton mt-4 h-3 w-2/3 rounded"/><div className="skeleton mt-2 h-3 w-1/2 rounded"/><div className="skeleton mt-4 h-3 w-1/3 rounded"/></div>;}
