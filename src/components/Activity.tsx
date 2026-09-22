import { useState } from 'react';
import { useStore } from '../lib/store';
import { ACTOR_LABEL, plainText, fieldLabel } from '../lib/language';
import { canReadWork } from '../lib/records';
export default function Activity({fundId}:{fundId?:string}){
 const s=useStore();const [actor,setActor]=useState('ALL');
 const restricted=(source?:string)=>source?s.assignments.some(a=>a.id===source&&!canReadWork(s.identity,a,s.docs)):false;
 const describe=(action:string)=>{
   if(action.startsWith('system boot'))return 'Portfolio checks are ready';
   let text=plainText(action);
   for(const a of [...s.assignments].sort((a,b)=>b.id.length-a.id.length))text=text.split(a.id).join(canReadWork(s.identity,a,s.docs)?a.title:'restricted assignment');
   for(const d of s.docs)text=text.split(d.id).join(d.access==='PM'&&s.identity?.role!=='PM'?'restricted document':d.title);
   return text.replace(/\b[RVW]-\d+\b/g,'record').replace(/\bverdict\b/gi,'review decision').replace(/\bFAILING\b/g,'needs attention');
 };
 const audit=s.audit.filter(a=>(!fundId||a.tag===fundId)&&!restricted(a.tag));
 const history=fundId?s.history.filter(h=>h.entityId===fundId&&!restricted(h.source)&&!audit.some(a=>a.h===h.h)):[];
 const rows=[...history.map(h=>({t:h.t,actor:h.actor,title:`${fieldLabel(h.field)} changed from ${plainText(h.from||'not recorded')} to ${plainText(h.to)}`,raw:h,tag:h.entityId})),...audit.map(a=>({t:a.t,actor:a.actor,title:describe(a.action),raw:a,tag:a.tag}))].reverse().filter(a=>actor==='ALL'||a.actor===actor);
 return <section className="space-y-4"><div><h2 className="text-lg font-semibold">{fundId?'Fund activity':'All activity'}</h2><p className="mt-1 text-sm text-muted">The record of reviews, decisions, and changes.</p></div><div className="flex flex-wrap gap-2">{(['ALL','YOU','AGENT','ENGINE'] as const).map(key=><button key={key} onClick={()=>setActor(key)} className={`rounded border px-3 py-1.5 text-xs ${actor===key?'border-rail bg-rail text-white':'border-line bg-surface'}`}>{ACTOR_LABEL[key]}</button>)}</div>{rows.length===0&&<p className="text-sm text-muted">No activity in this view yet.</p>}{rows.map((row,i)=><article key={i} className="rounded-lg border border-line bg-surface p-4"><div className="flex justify-between text-xs text-muted"><span>{ACTOR_LABEL[row.actor]}</span><time>{row.t}</time></div><p className="mt-2 text-sm">{row.title}</p>{!fundId && row.tag && (s.funds.some(f=>f.id===row.tag)||s.screener.some(f=>f.id===row.tag)) && <button className="mt-2 text-xs text-ai" onClick={()=>{s.setAudit(false);s.openFund(row.tag!);s.setFundTab('history');}}>Open fund activity ↗</button>}<details className="mt-3"><summary className="cursor-pointer text-xs text-muted">Technical details</summary><pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted">{JSON.stringify(row.raw,null,2)}</pre></details></article>)}</section>;
}
