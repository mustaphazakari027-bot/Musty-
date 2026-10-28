import {Minus,Plus} from 'lucide-react';
export default function Quantity({value,onChange,max=50,small=false}:{value:number;onChange:(n:number)=>void;max?:number;small?:boolean}) {
  return <div className={`inline-flex items-center rounded-full border border-[#e3e8dd] bg-white ${small?'h-8':'h-10'}`} aria-label="Quantity">
    <button type="button" onClick={()=>onChange(value-1)} disabled={value<=1} aria-label="Decrease quantity" className={`grid place-items-center rounded-full text-[#496254] disabled:opacity-30 hover:bg-[#f1f5ec] ${small?'h-8 w-8':'h-10 w-10'}`}><Minus size={small?13:15}/></button>
    <span className={`min-w-[24px] text-center font-bold text-[#173f30] ${small?'text-xs':'text-sm'}`} aria-live="polite">{value}</span>
    <button type="button" onClick={()=>onChange(value+1)} disabled={value>=max} aria-label="Increase quantity" className={`grid place-items-center rounded-full text-[#496254] disabled:opacity-30 hover:bg-[#f1f5ec] ${small?'h-8 w-8':'h-10 w-10'}`}><Plus size={small?13:15}/></button>
  </div>;
}
