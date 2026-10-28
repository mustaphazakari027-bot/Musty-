import {AlertTriangle,CheckCircle2,Loader2,XCircle} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {post} from '../api';
import {PageHead} from '../components/ui';
export default function CheckoutReturn(){
  const [params]=useSearchParams(); const navigate=useNavigate(); const reference=params.get('reference')||params.get('trxref')||sessionStorage.getItem('rf-pending-order')||'';
  const [state,setState]=useState<'checking'|'paid'|'failed'|'error'>('checking'); const [message,setMessage]=useState('');
  useEffect(()=>{if(!reference){setState('error');setMessage('No order reference was returned by Paystack.');return;}
    const token=localStorage.getItem(`rf-order-${reference}`)||'';
    post<{verified:boolean;status:string}>('/paystack/verify',{reference,token}).then(r=>{if(r.verified){sessionStorage.removeItem('rf-pending-order');navigate(`/order/${reference}?new=1`,{replace:true});}else{setState('failed');setMessage(`Payment status: ${r.status}. No charge was completed.`);}}).catch(e=>{setState('error');setMessage(e.message);});
  },[reference,navigate]);
  return <><PageHead title="Confirming payment"/><div className="container-x mt-12"><div className="mx-auto max-w-md rounded-3xl border border-[#ecefe6] bg-white p-8 text-center">
    {state==='checking'&&<><Loader2 size={30} className="mx-auto animate-spin text-[#2f8a5f]"/><h1 className="mt-4 text-[19px] font-extrabold text-[#173f30]">Confirming your payment…</h1><p className="mt-2 text-[12px] leading-relaxed text-[#7b8b7d]">We’re checking with Paystack directly. Please keep this page open.</p></>}
    {state==='failed'&&<><XCircle size={32} className="mx-auto text-[#c8785f]"/><h1 className="mt-4 text-[19px] font-extrabold text-[#173f30]">Payment wasn’t completed</h1><p className="mt-2 text-[12px] leading-relaxed text-[#7b8b7d]">{message} Your stock hold will expire automatically in 30 minutes. You can try again from your basket.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link to="/cart" className="btn-primary">Back to basket</Link><Link to="/contact" className="btn-secondary">Get help</Link></div></>}
    {state==='error'&&<><AlertTriangle size={32} className="mx-auto text-[#d19a3f]"/><h1 className="mt-4 text-[19px] font-extrabold text-[#173f30]">We couldn’t confirm that payment</h1><p className="mt-2 text-[12px] leading-relaxed text-[#7b8b7d]">{message}</p><p className="mt-2 text-[11px] leading-relaxed text-[#93a294]">If you were charged, don’t worry — contact us with your reference and we’ll check it with Paystack.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><Link to="/track" className="btn-primary">Track an order</Link><Link to="/contact" className="btn-secondary">Contact us</Link></div></>}
    {state==='paid'&&<><CheckCircle2 size={32} className="mx-auto text-[#2f8a5f]"/><h1 className="mt-4 text-[19px] font-extrabold">Payment confirmed</h1></>}
  </div></div></>;
}
