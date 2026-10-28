import {Star} from 'lucide-react';
export default function Stars({rating,count=0,size=11}:{rating:string|number;count?:number;size?:number}) {
  const n=Math.round(Number(rating)||0); if(!Number(rating)) return null;
  return <span className="inline-flex items-center gap-1 text-[11px] text-[#758378]"><Star size={size} className="fill-[#f0a93b] text-[#f0a93b]" /><b className="font-bold text-[#435349]">{Number(rating).toFixed(1)}</b>{count>0&&<span>({count})</span>}</span>;
}
