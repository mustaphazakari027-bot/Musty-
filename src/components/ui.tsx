import {AlertCircle,CheckCircle2,Loader2,ShoppingBasket} from 'lucide-react';
import {useEffect} from 'react';
import {Link,Navigate,useLocation} from 'react-router-dom';
import {useStore} from '../store';
export function Toast(){const {toastMessage}=useStore();if(!toastMessage)return null;return <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#173f30] px-5 py-3 text-[12px] font-semibold text-white shadow-[0_16px_40px_-12px_rgba(0,0,0,.45)] sm:bottom-8"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#8ee0a8] align-middle"/>{toastMessage}</div>;}
export function PageHead({title,description}:{title:string;description?:string}){
  useEffect(()=>{document.title=`${title} | Rikkos Fresh`;if(description){let tag=document.querySelector('meta[name="description"]');if(!tag){tag=document.createElement('meta');tag.setAttribute('name','description');document.head.appendChild(tag);}tag.setAttribute('content',description);}return ()=>{document.title='Rikkos Fresh | Good food, delivered';};},[title,description]);
  return null;
}
export function ScrollTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo({top:0,behavior:'instant' as ScrollBehavior});},[pathname]);return null;}
export function Protected({children,admin=false}:{children:React.ReactNode;admin?:boolean}){
  const {user,authReady}=useStore(); const location=useLocation();
  if(!authReady) return <div className="container-x flex items-center justify-center py-24"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#7b8b7d]"><Spinner/>Checking your session…</div></div>;
  if(!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace/>;
  if(admin && user.role!=='admin') return <div className="container-x py-24 text-center"><h1 className="text-2xl font-extrabold">This area is for store staff only</h1><p className="mt-2 text-[13px] text-[#75837a]">Sign in with an administrator account to continue.</p><Link className="btn-primary mt-6" to="/">Back to the shop</Link></div>;
  return <>{children}</>;
}
export function Alert({kind='error',children,className=''}:{kind?:'error'|'success'|'info';children:React.ReactNode;className?:string}){
  if(!children) return null; const styles={error:'border-[#f3d6cf] bg-[#fdf1ee] text-[#9c3f2d]',success:'border-[#cbe8d5] bg-[#eef9f0] text-[#1f6a48]',info:'border-[#dbe5d8] bg-[#f5f8f2] text-[#43584a]'}[kind];
  return <div role={kind==='error'?'alert':'status'} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12px] font-medium ${styles} ${className}`}>{kind==='error'?<AlertCircle size={15} className="mt-0.5 shrink-0"/>:<CheckCircle2 size={15} className="mt-0.5 shrink-0"/>}<span>{children}</span></div>;
}
export function Spinner({light=false}:{light?:boolean}){return <Loader2 size={16} className={`animate-spin ${light?'text-white':'text-[#15845c]'}`}/>;}
export function EmptyState({title,text,action,to='/shop',icon}:{title:string;text:string;action:string;to?:string;icon?:React.ReactNode}){
  return <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#dce5d8] bg-white px-6 py-16 text-center">{icon||<div className="grid h-16 w-16 place-items-center rounded-full bg-[#eef5e9] text-[#3b7d59]"><ShoppingBasket size={26}/></div>}<h2 className="mt-4 text-[18px] font-extrabold text-[#1d3527]">{title}</h2><p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-[#7d8c80]">{text}</p><Link to={to} className="btn-primary mt-5">{action}</Link></div>;
}
export function SectionHead({eyebrow,title,link,linkLabel='See all'}:{eyebrow?:string;title:string;link?:string;linkLabel?:string}){
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div>{eyebrow&&<p className="section-eyebrow mb-1.5">{eyebrow}</p>}<h2 className="serif text-[26px] leading-tight text-[#173f30] sm:text-[30px]">{title}</h2></div>{link&&<Link to={link} className="group inline-flex items-center gap-1.5 text-[12px] font-bold text-[#15704c] hover:text-[#0b4c34]">{linkLabel}<span className="transition-transform group-hover:translate-x-0.5">→</span></Link>}</div>;
}
