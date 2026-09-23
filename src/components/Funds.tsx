import { useStore } from '../lib/store';
import { ddState } from '../lib/dd';
import { STATUS_LABEL } from '../lib/language';
import Screening from './Screening';
export default function Funds(){
 const s=useStore();
 return <div className="space-y-5"><header><h1 className="text-2xl font-semibold">Funds</h1><p className="mt-1 text-sm text-muted">Compare candidates, then open a fund to continue the work.</p></header><div className="flex gap-2">{(['Candidates','Invested','All'] as const).map(f=><button key={f} onClick={()=>s.setFundsFilter(f)} className={`rounded border px-4 py-2 text-sm ${s.fundsFilter===f?'border-rail bg-rail text-white':'border-line bg-surface'}`}>{f}</button>)}</div>
 {s.fundsFilter!=='Candidates'&&<section className="rounded-lg border border-line bg-surface"><h2 className="p-4 font-semibold">Invested funds</h2>{s.funds.map(f=><button key={f.id} onClick={()=>s.openFund(f.id)} className="flex w-full items-center justify-between gap-5 border-t border-line p-4 text-left"><div><b className="text-sm">{f.name}</b><p className="mt-1 text-xs text-muted">{ddState(f.id).why}</p></div><span className="text-xs">{STATUS_LABEL[ddState(f.id).s]} →</span></button>)}</section>}
 {s.fundsFilter!=='Invested'&&<Screening embedded/>}</div>;
}
