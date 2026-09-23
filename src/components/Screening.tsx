import { useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { DEFAULT_CRITERIA, METRICS, evaluate, validCriteria } from '../lib/screening';
import { Btn, Input } from './Ui';
export default function Screening({embedded=false}:{embedded?:boolean}) {
  const s = useStore();
  const [draft, setDraft] = useState(() => structuredClone(s.criteria));
  const [filter, setFilter] = useState('All');
  const [selected, select] = useState('C-001');
  const [name, setName] = useState('');
  const add = () => { const r=s.addCandidate(name,'form'); if(r.ok){setName('');toast.success(r.msg);}else toast.message(r.msg); };
  const candidates = s.screener;
  const results = candidates.map(f => ({ fund: f, ...evaluate(f.metrics, draft) }));
  const current = results.find(r => r.fund.id === selected);
  const changed = JSON.stringify(draft) !== JSON.stringify(s.criteria);
  return <div className="space-y-5">
    <header><h1 className="text-xl font-semibold">{embedded?'Candidate screening':'Screening'}</h1><p className="mt-1 text-sm text-muted">Prepare a shortlist. Inspect the evidence. Decide what deserves an analyst’s time.</p></header>
    <div className="grid grid-cols-4 gap-3">{['All', 'Eligible', 'Outside criteria', 'Needs evidence'].map(label => <button key={label} onClick={() => setFilter(label)} className={`rounded-lg border p-4 text-left ${filter === label ? 'border-ai bg-ai/5' : 'border-line bg-surface'}`}><div className="text-2xl font-mono">{label === 'All' ? results.length : results.filter(r => r.status === label).length}</div><div className="text-sm">{label}</div></button>)}</div>
    <div data-tour="intake.form" className="flex items-center gap-2 rounded-lg border border-line bg-surface p-3"><Input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Manager name" aria-label="Candidate name" className="w-64"/><Btn onClick={add}>Add candidate</Btn></div>
    <details open data-tour="screening.criteria" className="rounded-lg border border-line bg-surface p-4"><summary className="cursor-pointer font-semibold">Editable criteria <span className="text-xs font-normal text-muted">· illustrative settings · all enabled checks must pass</span></summary>
      <div className="my-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{draft.map((c,i) => { const m=METRICS.find(m=>m.key===c.key)!; return <label key={c.key} className="text-xs"><span className="mb-2 flex gap-2"><input type="checkbox" checked={c.enabled} onChange={e => setDraft(draft.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/>{m.label}</span><span className="flex items-center gap-2">{m.direction==='min'?'≥':'≤'}<input aria-label={m.label} type="number" step="any" min={m.floor} max={m.ceiling} value={Number.isNaN(c.threshold)?'':c.threshold} onChange={e=>setDraft(draft.map((x,j)=>j===i?{...x,threshold:e.target.value===''?NaN:Number(e.target.value)}:x))} className="w-20 rounded border border-line bg-paper p-2"/>{m.unit}</span></label>; })}</div>
      <div className="flex items-center gap-3"><Btn disabled={!changed || !validCriteria(draft)} onClick={()=>s.applyCriteria(draft)}>Apply settings</Btn><Btn onClick={()=>setDraft(structuredClone(DEFAULT_CRITERIA))}>Restore defaults</Btn><span className="text-xs text-muted">{!validCriteria(draft)?'Enter valid thresholds.':changed?'Preview · apply before starting research':'Applied settings'}</span></div>
    </details>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]"><section data-tour="screening.table" className="overflow-hidden rounded-lg border border-line bg-surface"><table className="w-full text-sm"><thead className="bg-paper text-left"><tr><th className="p-3">Candidate</th><th>Screen</th><th>Evidence</th></tr></thead><tbody>{results.filter(r=>filter==='All'||r.status===filter).map(r=><tr key={r.fund.id} className={`border-t border-line ${selected===r.fund.id?'bg-ai/5':''}`}><td className="p-3"><button onClick={()=>select(r.fund.id)} className="text-left text-ai">{r.fund.name}</button></td><td className="text-xs">{r.status}</td><td className="text-xs">{r.checks.filter(c=>c.status==='Needs evidence').length} missing</td></tr>)}</tbody></table></section>
    {current && <section data-tour="screening.next" className="rounded-lg border border-line bg-surface p-4"><h2 className="text-lg font-semibold">{current.fund.name}</h2><p className="my-2 text-xs text-muted">{current.fund.metricSource ?? 'No metric source on file'} · {current.fund.metricAsOf ?? 'Date unknown'}</p><p className="mb-3 text-xs text-muted">Live performance window: Sep 2023–Aug 2026. Backtests are not substituted for live evidence.</p>{current.checks.map(c=><div key={c.key} className="flex justify-between gap-3 border-t border-line py-2 text-xs"><span>{c.label}</span><span>{c.value??'—'} {c.unit} · <b>{c.status}</b></span></div>)}<div className="mt-4 rounded bg-paper p-3 text-sm"><b>Analyst judgment still needed</b><p className="mt-1 text-muted">Strategy robustness · team continuity · operational controls · evidence reliability</p></div><div className="mt-4 flex gap-2"><Btn disabled={changed || !validCriteria(draft)} onClick={()=>s.startResearch(current.fund.id)}>Open research assignment</Btn><Btn onClick={()=>s.openFund(current.fund.id)}>Fund record</Btn><Btn onClick={()=>s.triage(current.fund.id,'PARKED')}>Park</Btn><Btn onClick={()=>s.triage(current.fund.id,'IN DD')}>Send to diligence</Btn></div></section>}
    </div>
    <details className="rounded-lg border border-line bg-surface p-4"><summary className="cursor-pointer text-xs text-muted">Technical details · agents and CLI</summary><pre className="mt-2 overflow-x-auto text-xs">{`screen add "…"   # agent console\nnode scripts/apex.mjs funds add --json=examples/candidate.json   # external CLI`}</pre></details>
  </div>;
}
