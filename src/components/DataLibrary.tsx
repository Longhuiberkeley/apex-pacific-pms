import { fieldLabel } from '../lib/language';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { canRead, provenance, rawUrl } from '../lib/records';
import DocReview from './DocReview';
import { Btn } from './Ui';
export default function DataLibrary({fundId,intake=false}:{fundId?:string;intake?:boolean}) {
  const s = useStore();
  const [tab, setTab] = useState<'originals'|'records'>(s.librarySelection ? 'records' : 'originals');
  const [docId, setDocId] = useState<string|null>(null);
  useEffect(()=>{if(s.librarySelection){setTab('records');setDocId(null);}},[s.librarySelection]);
  const visibleDocs = s.docs.filter(d=>!fundId || d.fundId===fundId);
  const visibleRecords = s.records.filter(r=>!fundId || r.fundId===fundId);
  const doc = visibleDocs.find(d=>d.id===docId);
  const record = visibleRecords.find(r=>r.id===s.librarySelection);
  return <div className="space-y-4"><header><h1 className="text-2xl font-semibold">{intake?'Document intake':'Documents & data'}</h1><p className="mt-1 text-sm text-muted">Original → Extracted draft → Human review → Approved record</p><p className="mt-1 text-xs text-muted">Saved in this browser’s demo session · refresh resets records and edits</p></header>
    <div className="flex gap-2"><Btn onClick={()=>{setTab('originals');s.openRecord('');}}>Original files</Btn><Btn onClick={()=>{setTab('records');setDocId(null);}}>Approved data</Btn></div>
    {tab==='originals' && !visibleDocs.length && <p className="rounded border border-dashed border-line p-5 text-sm text-muted">No documents are on file for this fund yet. Track requests in Research & diligence.</p>}
    {tab==='originals' && <div className="grid gap-3 md:grid-cols-2">{visibleDocs.map(d=>canRead(s.identity,d)?<button key={d.id} onClick={()=>setDocId(d.id)} className={`rounded-lg border p-4 text-left ${docId===d.id?'border-ai':'border-line'} bg-surface`}><b className="text-sm">{provenance(d).filename}</b><p className="mt-1 break-all text-xs text-muted">{provenance(d).mailbox} → {provenance(d).rawPath}</p><p className="mt-2 text-xs">{d.status} · {d.access==='PM'?'PM only':'Team'} · {d.from}</p></button>:<div key={d.id} className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Restricted document · PM access required</div>)}</div>}
    {tab==='originals' && doc && canRead(s.identity,doc) && <div className="h-[730px] overflow-hidden rounded-lg border border-line"><DocReview key={doc.id} doc={doc} onApprove={()=>s.approveDoc(doc.id)} onReject={(r,n)=>s.rejectDoc(doc.id,r,n)} onEdit={(k,v)=>s.editDocField(doc.id,k,v)}/></div>}
    {(tab==='records' || !!s.librarySelection) && <section className="rounded-lg border border-line bg-surface p-4"><h2 className="mb-3 font-semibold">Approved records</h2>{visibleRecords.filter(r=>canRead(s.identity,r)).map(r=><button key={r.id} onClick={()=>{setTab('records');s.openRecord(r.id);}} className="flex w-full justify-between border-t border-line py-3 text-left text-sm"><span>{r.title}</span><span className="font-mono text-xs text-ai">View record →</span></button>)}{!visibleRecords.some(r=>canRead(s.identity,r))&&<p className="text-sm text-muted">No accessible approved records yet. Review an original and choose Approve & save record.</p>}</section>}
    {record && canRead(s.identity,record) && <section className="rounded-lg border border-pass/30 bg-surface p-5"><h2 className="text-lg font-semibold">{record.title}</h2><p className="my-2 text-xs text-muted">Approved by {record.approvedBy} · {record.approvedAt} · read-only snapshot</p><button className="text-sm text-ai" onClick={()=>{setDocId(record.docId);setTab('originals');s.openRecord('');}}>View source {record.source} ↗</button><table className="my-4 w-full text-sm"><thead><tr className="text-left"><th>Field</th><th>Saved value</th><th>Evidence</th></tr></thead><tbody>{Object.entries(record.values).map(([key,value])=><tr key={key} className="border-t border-line"><td className="py-3">{s.docs.find(d=>d.id===record.docId)?.fields.find(f=>f.key===key)?.label??fieldLabel(key)}{record.corrections.includes(key)&&<span className="block text-xs text-ai">Human corrected</span>}</td><td className="p-2 font-mono">{String(value)}</td><td className="max-w-64 p-2 text-xs text-muted">{record.references[key]}</td></tr>)}</tbody></table><details><summary className="cursor-pointer text-sm">Technical details · saved JSON</summary><pre className="mt-2 overflow-x-auto rounded bg-paper p-3 text-xs">{JSON.stringify(record,null,2)}</pre></details></section>}
  </div>;
}
