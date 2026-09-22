import { useState } from 'react';
import { useStore } from '../lib/store';
import { canRead } from '../lib/records';
import { reconcileFee, type FeeInputs } from '../lib/fees';
import { Btn } from './Ui';
export default function Fees() {
  const s = useStore();
  const [inputs, setInputs] = useState<FeeInputs|null>(null);
  const [note,setNote] = useState('');
  const [message,setMessage] = useState('');
  const sources = ['hal-nav-08','terms-hal','fee-invoice-hal'].map(id=>s.records.find(r=>r.docId===id));
  const permitted = sources.every(r=>!r || canRead(s.identity,r));
  const ready = sources.every(Boolean) && permitted;
  const baseline: FeeInputs = { nav: Number(sources[0]?.values.nav_usd ?? 0), annualRate: Number(sources[1]?.values.annual_rate_pct ?? 0), start: String(sources[2]?.values.period_start ?? ''), end: String(sources[2]?.values.period_end ?? ''), invoiced: Number(sources[2]?.values.amount_usd ?? 0) };
  const value = inputs ?? baseline;
  const result = reconcileFee(value);
  const money=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
  return <div className="space-y-5"><header><h1 className="text-2xl font-semibold">Management fee reconciliation</h1><p className="mt-1 text-sm text-muted">Reviewed source data → calculation → human decision</p></header>
    {!permitted ? <div className="rounded-lg border border-line bg-surface p-5">Restricted terms are required for this worksheet. Switch to PM to review the calculation.</div> : <>
      <section className="rounded-lg border border-line bg-surface p-4"><h2 className="font-semibold">Approved inputs</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{sources.map((r,i)=><div key={i} className="rounded border border-line p-3 text-sm">{r?<><b>{r.title}</b><button className="mt-2 block text-xs text-ai" onClick={()=>s.openRecord(r.id)}>{r.id} ↗</button><p className="mt-1 text-xs text-muted">Reviewed by {r.approvedBy}</p></>:<><b>NAV record awaiting review</b><Btn className="mt-2" onClick={()=>s.setView('library')}>Review original</Btn></>}</div>)}</div></section>
      {ready && <section className="rounded-lg border border-line bg-surface p-5"><h2 className="font-semibold">Proposed reconciliation</h2><p className="mt-1 text-sm text-muted">Constant NAV × annual rate × inclusive calendar days / 365. Editing this worksheet does not change approved source records.</p><div className="my-5 grid grid-cols-2 gap-4 xl:grid-cols-5">{([['nav','NAV (USD)','number'],['annualRate','Annual rate (%)','number'],['start','Start date','date'],['end','End date','date'],['invoiced','Invoiced (USD)','number']] as const).map(([key,label,type])=><label key={key} className="text-xs">{label}<input aria-label={label} type={type} step="any" value={typeof value[key]==='number' && Number.isNaN(value[key])?'':value[key]} onChange={e=>{setInputs({...value,[key]:type==='number'?(e.target.value===''?NaN:Number(e.target.value)):e.target.value});setMessage('');}} className="mt-2 block w-full rounded border border-line bg-paper p-2 text-sm"/></label>)}</div>
      {result.ok?<div className="grid grid-cols-3 gap-3 rounded bg-paper p-4"><div className="text-sm">Expected fee<b className="mt-1 block text-xl font-mono">{money(result.expected)}</b></div><div className="text-sm">Invoice − expected<b className="mt-1 block text-xl font-mono">{money(result.variance)}</b></div><div className="text-sm">{result.days} days · Actual/365<b className="mt-1 block">{result.needsReview?'Discrepancy requires review':'Within $1 tolerance'}</b></div></div>:<p role="alert" className="text-sm text-stop">{result.error}</p>}
      <label className="mt-4 block text-sm">Review explanation<textarea aria-label="Fee review explanation" value={note} onChange={e=>setNote(e.target.value)} placeholder="Explain the discrepancy and the agreed correction or follow-up." className="mt-2 block w-full rounded border border-line p-3"/></label><div className="mt-3 flex gap-2"><Btn disabled={!result.ok || (result.needsReview && !note.trim())} tone="emerald" onClick={()=>{const r=s.approveFee(value,note);setMessage(r.message);}}>Approve reconciliation</Btn><Btn onClick={()=>{setInputs(null);setNote('');setMessage('');}}>Restore approved inputs</Btn></div>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</section>}
    </>}
    <section><h2 className="mb-3 font-semibold">Saved reconciliations</h2>{s.feeReviews.filter(r=>canRead(s.identity,r)).map(r=><details key={r.id} className="mb-2 rounded border border-line bg-surface p-4"><summary className="cursor-pointer text-sm">{r.id} · {money(r.expected)} expected · reviewed by {r.reviewer}</summary><p className="mt-3 text-sm">{r.note}</p><pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(r,null,2)}</pre></details>)}</section>
  </div>;
}
