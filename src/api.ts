export async function api<T = any>(url:string, options:RequestInit = {}):Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With','XMLHttpRequest');
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type','application/json');
  const response = await fetch(`/api${url}`,{...options,headers,credentials:'same-origin'});
  const body = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
  return body as T;
}
export const post = <T=any>(url:string,data:unknown)=>api<T>(url,{method:'POST',body:JSON.stringify(data)});
export const patch = <T=any>(url:string,data:unknown)=>api<T>(url,{method:'PATCH',body:JSON.stringify(data)});
export const money = (n:number) => `₦${Number(n||0).toLocaleString('en-NG')}`;
export const niceDate = (s:string) => { if (!s) return ''; const d=new Date(s.length===10 ? `${s}T12:00:00` : s); return Number.isNaN(d.valueOf())?s:d.toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}); };
export const statusText = (s:string) => ({pending:'Awaiting payment',confirmed:'Order received',processing:'Being packed',out_for_delivery:'Out for delivery',delivered:'Delivered',cancelled:'Cancelled',review:'Needs review',paid:'Paid',pay_on_delivery:'Pay on delivery',expired:'Payment expired'} as Record<string,string>)[s] || s.replaceAll('_',' ');
