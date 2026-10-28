import React, {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {api,post} from './api';
import type {CartItem,Category,Config,Product,Quote,User} from './types';

const boot=(globalThis as any).__RF_CATALOGUE__ as {categories:Category[];products:Product[]}|undefined;
type Store = {cart:CartItem[];count:number;authReady:boolean;add:(p:Product,qty?:number)=>void;setQty:(id:string,qty:number)=>void;remove:(id:string)=>void;clear:()=>void;categories:Category[];user:User|null;refreshUser:()=>Promise<void>;config:Config;favorites:string[];toggleFavorite:(id:string)=>void;toast:(s:string)=>void;toastMessage:string};
const Context=createContext<Store|null>(null);
function load<T>(key:string,fallback:T):T {try {const val=localStorage.getItem(key);return val?JSON.parse(val):fallback;}catch{return fallback;}}
const emptyConfig:Config={demo:true,paystack_enabled:false,cod_enabled:false,reset_enabled:false,image_upload_enabled:false};
export function StoreProvider({children}:{children:React.ReactNode}) {
  const [cart,setCart]=useState<CartItem[]>(()=>load('rf-cart',[]));
  const [favorites,setFavorites]=useState<string[]>(()=>load('rf-favorites',[]));
  const [categories,setCategories]=useState<Category[]>(boot?.categories?.length?boot.categories:[]); const [user,setUser]=useState<User|null>(null);
  const [config,setConfig]=useState<Config>(emptyConfig); const [toastMessage,setToastMessage]=useState(''); const [authReady,setAuthReady]=useState(false);
  useEffect(()=>{localStorage.setItem('rf-cart',JSON.stringify(cart));},[cart]);
  useEffect(()=>{localStorage.setItem('rf-favorites',JSON.stringify(favorites));},[favorites]);
  useEffect(()=>{api<Category[]>('/categories').then(setCategories).catch(()=>{});window.dispatchEvent(new Event('rf-catalogue-ready'));api<Config>('/config').then(setConfig).catch(()=>{});api<{user:User|null}>('/auth/session').then(r=>setUser(r.user)).catch(()=>{}).finally(()=>setAuthReady(true));},[]);
  useEffect(()=>{if(!toastMessage)return;const t=setTimeout(()=>setToastMessage(''),3200);return()=>clearTimeout(t);},[toastMessage]);
  const value=useMemo<Store>(()=>({cart,count:cart.reduce((n,i)=>n+i.quantity,0),authReady,categories,user,config,favorites,toastMessage,toast:setToastMessage,
    add:(p,qty=1)=>{setCart(current=>{const found=current.find(x=>x.id===p.id);if(found){return current.map(x=>x.id===p.id?{...x,quantity:Math.min(x.quantity+qty,p.stock,50),product:p}:x);}return [...current,{id:p.id,quantity:Math.min(qty,p.stock,50),product:p}];});setToastMessage(`${p.name} added to your basket`);},
    setQty:(id,qty)=>setCart(current=>qty<=0?current.filter(x=>x.id!==id):current.map(x=>x.id===id?{...x,quantity:Math.min(qty,x.product.stock,50)}:x)),
    remove:id=>setCart(current=>current.filter(x=>x.id!==id)),clear:()=>setCart([]),
    refreshUser:async()=>{const r=await api<{user:User|null}>('/auth/session');setUser(r.user);},
    toggleFavorite:id=>setFavorites(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]),
  }),[cart,authReady,categories,user,config,favorites,toastMessage]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore(){const x=useContext(Context);if(!x)throw new Error('StoreProvider required');return x;}
export function useQuote(promo='',delivery:'standard'|'express'='standard') {
  const {cart}=useStore(); const [quote,setQuote]=useState<Quote|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  useEffect(()=>{let current=true;setLoading(true);setError('');post<Quote>('/quote',{items:cart.map(({id,quantity})=>({id,quantity})),promo,delivery}).then(q=>{if(current)setQuote(q);}).catch(e=>{if(current){setError(e.message);setQuote(null);}}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[cart,promo,delivery]);
  return {quote,error,loading};
}
