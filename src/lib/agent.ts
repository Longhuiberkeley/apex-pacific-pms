import { canRead, canReadWork, provenance } from './records';
import { evaluate, validateMetrics } from './screening';
import { useStore, openApprovals } from './store';
import { BookSchema, validateBook } from './rules';
import { SILK_DRAFT } from './work';
import { isEligible } from './docs';
import { reconcileFee } from './fees';
import { ddState, openFlags, DD_CHECKS, chkFor } from './dd';
import { FENCE, FORM_GATED, VERBS, helpGroups } from './verbs';
import { AGENT_BOOK_A, daysSince } from '../data/seed';

export interface AgentResult { ok: boolean; message?: string; data?: unknown }

/** Shared command contract for the in-app shell and the local HTTP/CLI bridge. */
export function executeAgentCommand(command: string, payload?: unknown, via: 'shell' | 'cli' = 'shell'): AgentResult {
  const s = useStore.getState();
  if (!s.identity) return { ok: false, message: 'Sign in to the demo browser first.' };
  const [resource, action, id, ...flags] = command.trim().split(/\s+/);
  // One gate for every human lever: action tokens and the two-token prefix of every form receipt.
  if (['approve', 'review', 'update', 'verdict', 'triage'].includes(action) || FORM_GATED.includes(`${resource} ${action}`)) {
    s.pushAudit('AGENT', `BLOCKED ${command} via ${via}`, 'Human decision required');
    return { ok: false, message: ['approve', 'reject', 'review', 'verdict', 'triage'].includes(action) ? 'This decision belongs to a human in the platform. Agents may read, submit research and stage proposals.' : ['update', 'draft', 'edit'].includes(action) ? 'Activity notes are recorded by the task assignee in the platform; agents may read tasks and submit research.' : 'This lever is operated by a human in the platform UI; agents may read state and stage proposals.' };
  }
  if (resource === 'help') return { ok: true, data: helpGroups() };
  if (resource === 'whoami') return { ok: true, data: { signedIn: s.identity ? { name: s.identity.name, email: s.identity.email, role: s.identity.role } : null, actingAs: 'external agent', via, fence: FENCE, writes: ['tasks submit', 'funds add', 'book propose'], gated: ['tasks review', 'docs approve', 'docs reject', 'screen triage', 'dd verdict', 'book approve', 'today approve', 'fee approve', 'criteria apply'], note: 'Reads follow the signed-in browser role.' } };
  if (resource === 'history') return { ok: true, data: { lines: s.shellLines.filter((l) => l.startsWith('apex$') || l.startsWith('»')).slice(-20) } };
  if ((resource === 'today' && action === 'queue') || (resource === 'queue' && action === 'list')) return { ok: true, data: { openApprovals: openApprovals(s), intakePolicy: s.intakePolicy, gateOpen: s.gateOpen, queue: s.queue.map(({ wid, origin, title, draft, done, rid, rejected }) => ({ wid, origin, title, draft, done, rid, rejected })), pendingDocs: s.docs.filter((d) => d.status === 'pending' && canRead(s.identity, d)).map((d) => ({ id: d.id, title: d.title, fundId: d.fundId, overall: d.overall, quickEligible: isEligible(d) })), triggers: { sableAssessed: s.trigAssessed, linkConfirmed: s.linkConfirmed }, broker: { parsed: s.brokerParsed, reconciled: s.reconciled, fxQueued: s.fxQueued } } };
  if (resource === 'tasks') {
    if (action === 'list') return { ok: true, data: s.assignments.filter(a=>canReadWork(s.identity,a,s.docs)).map(({ draft, sources, revisions, ...a }) => ({ ...a, submissionCount: revisions.length })) };
    if (action === 'get') {
      const a = s.assignments.find((a) => a.id === id && canReadWork(s.identity,a,s.docs));
      return a ? { ok: true, data: a } : { ok: false, message: `No assignment ${id}.` };
    }
    if (action === 'submit') {
      const value = flags.includes('--example') && id === 'A-101' ? SILK_DRAFT : payload;
      if (value === undefined) return { ok: false, message: 'Provide submission JSON. In the demo console: tasks submit A-101 --example. CLI: tasks submit A-101 --json=research.json' };
      return s.submitResearch(id, value, via);
    }
  }
  if (resource === 'funds') {
    if (action === 'add') {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {ok:false,message:'Provide candidate JSON with name, optional metrics, metricSource and metricAsOf.'};
      const p = payload as Record<string, unknown>;
      if (Object.keys(p).some(k=>!['name','metrics','metricSource','metricAsOf'].includes(k)) || typeof p.name !== 'string' || !p.name.trim() || p.name.length > 120 || (p.metrics !== undefined && !validateMetrics(p.metrics)) || (p.metricSource !== undefined && (typeof p.metricSource !== 'string' || !p.metricSource.trim() || p.metricSource.length>2000)) || (p.metricAsOf !== undefined && (typeof p.metricAsOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.metricAsOf) || Number.isNaN(Date.parse(p.metricAsOf)) || new Date(p.metricAsOf).toISOString().slice(0,10)!==p.metricAsOf))) return {ok:false,message:'Invalid candidate fields, metrics or source date.'};
      if (p.metrics && Object.keys(p.metrics).length && (!p.metricSource || !p.metricAsOf)) return {ok:false,message:'Metrics require metricSource and metricAsOf.'};
      const result = s.addCandidate(p.name,via);
      if (!result.ok) return {ok:false,message:result.msg};
      useStore.setState(state=>({screener:state.screener.map(f=>f.id===result.id?{...f,metrics:p.metrics as import('./screening').Metrics|undefined,metricSource:p.metricSource as string|undefined,metricAsOf:p.metricAsOf as string|undefined}:f)}));
      s.startResearch(result.id!); s.openAssignment(null);
      return {ok:true,message:'Candidate and research assignment created.',data:{id:result.id,assignmentId:`RESEARCH-${result.id}`}};
    }
    if (action === 'list') return { ok: true, data: { invested: s.funds, pipeline: s.screener } };
    if (action === 'get') {
      const fund = s.funds.find((f) => f.id === id) ?? s.screener.find((f) => f.id === id);
      return fund ? { ok: true, data: { fund, documents: s.docs.filter((d) => d.fundId === id && canRead(s.identity,d)), assignments: s.assignments.filter((a) => a.fundId === id && canReadWork(s.identity,a,s.docs)), history: s.history.filter((h) => h.entityId === id), verdict: s.ddVerdicts[id] ?? null } } : { ok: false, message: `No fund ${id}.` };
    }
  }
  if (resource === 'docs') {
    if (action === 'list') return { ok: true, data: s.docs.filter(d=>canRead(s.identity,d)).map(d=>({...d,location:provenance(d)})) };
    if (action === 'get') {
      const doc = s.docs.find((d) => d.id === id && canRead(s.identity,d));
      return doc ? { ok: true, data: doc } : { ok: false, message: `No document ${id}.` };
    }
  }
  if (resource === 'records') {
    const records = s.records.filter(r=>canRead(s.identity,r));
    if (action === 'list') return {ok:true,data:records};
    if (action === 'get') { const record=records.find(r=>r.id===id); return record?{ok:true,data:record}:{ok:false,message:'Record unavailable for this role.'}; }
  }
  if ((resource === 'screening' || resource === 'screen') && action === 'list') return {ok:true,data:{pipeline:s.screener.map(f=>({id:f.id,name:f.name,status:f.status,score:f.score,metricSource:f.metricSource??null,metricAsOf:f.metricAsOf??null}))}};
  if (resource === 'screening' && action === 'get') return {ok:true,data:{criteria:s.criteria,results:s.screener.map(f=>({id:f.id,name:f.name,metricSource:f.metricSource??null,metricAsOf:f.metricAsOf??null,metrics:f.metrics??null,...evaluate(f.metrics,s.criteria)}))}};
  if (resource === 'fees' && action === 'get') {
    const reviews = s.feeReviews.filter(r=>canRead(s.identity,r)).map(({id,expected,variance,days,note,reviewer,at})=>({id,expected,variance,days,note,reviewer,at}));
    if (id !== 'HAL') return {ok:true,data:{fundId:id??null,ready:false,inputs:null,reviews:[],reason:'No fee invoice and approved terms are on file for this fund yet.'}};
    const recs = ['hal-nav-08','terms-hal','fee-invoice-hal'].map(docId=>s.records.find(r=>r.docId===docId));
    const sources = ['hal-nav-08','terms-hal','fee-invoice-hal'].map(docId=>{const r=s.records.find(r=>r.docId===docId);return {docId,recordId:r?.id??null,access:r?.access??'team',present:!!r&&canRead(s.identity,r)}});
    const permitted = recs.every(r=>!r||canRead(s.identity,r));
    const ready = recs.every(Boolean) && permitted;
    const inputs = recs.every(Boolean) && permitted ? {nav:Number(recs[0]!.values.nav_usd??0),annualRate:Number(recs[1]!.values.annual_rate_pct??0),start:String(recs[2]!.values.period_start??''),end:String(recs[2]!.values.period_end??''),invoiced:Number(recs[2]!.values.amount_usd??0)} : null;
    return {ok:true,data:{fundId:'HAL',ready,restricted:!permitted,sources,inputs,computed:inputs?reconcileFee(inputs):null,reviews}};
  }
  if (resource === 'monitoring' && action === 'get') return {ok:true,data:{thresholdDays:30,checks:s.funds.filter(f=>!id||f.id===id).map(f=>{const ageDays=daysSince(f.asOf);const a=s.assignments.find(a=>a.id===`MON-${f.id}`);return {fundId:f.id,name:f.name,navAsOf:f.asOf,ageDays,result:!f.asOf?'Needs evidence':ageDays>30?'Breach':'Pass',investigation:a?{id:a.id,status:a.status,owner:a.owner,reviewer:a.reviewer}:null}})}};
  if (resource === 'dd' && action === 'get') return {ok:true,data:{state:ddState(id).s,why:ddState(id).why,flags:openFlags(id),checks:DD_CHECKS.map(c=>({id:c.id,name:c.name,...chkFor(id,c.id)})),verdict:s.ddVerdicts[id]??null}};
  if (resource === 'book') {
    if (action === 'get') return { ok: true, data: { committed: s.book, proposed: s.staged, violations: validateBook(s.staged ?? s.book, s.funds) } };
    if (action === 'paste' || (action === 'propose' && (id === '--raw' || flags.includes('--raw')))) {
      s.pasteAgentProposal(via);
      return { ok: true, message: 'staged raw agent book Σ 101.3; awaiting human', data: { violations: validateBook(AGENT_BOOK_A, s.funds) } };
    }
    if (action === 'propose') {
      if (payload === undefined) return { ok: false, message: 'Provide book JSON (--json=book.json). In the demo console: book paste --raw stages the seeded raw proposal.' };
      const checked = BookSchema.safeParse(payload);
      if (!checked.success) return { ok: false, message: 'Book must be a JSON object of fund IDs to numeric percentage weights.' };
      const keys = [...s.funds.map((f) => f.id), 'CASH'];
      if (Object.keys(checked.data).length !== keys.length || keys.some((k) => !(k in checked.data)) || Object.entries(checked.data).some(([k, v]) => !keys.includes(k) || !Number.isFinite(v) || v < 0)) return { ok: false, message: 'Include every portfolio fund and CASH, with finite, non-negative weights.' };
      s.stage(checked.data);
      s.pushAudit('AGENT', `book proposal staged via ${via}`, 'Awaiting PM decision', 'PORT');
      s.emitCmd('book propose --json=book.json', via);
      return { ok: true, message: 'Proposal staged; committed book unchanged.', data: { violations: validateBook(checked.data, s.funds) } };
    }
  }
  if (resource === 'audit' && action === 'tail') {
    const count = Math.min(50, Math.max(1, Number(id) || 10));
    return { ok: true, data: s.audit.slice(-count) };
  }
  return { ok: false, message: `unknown command: ${command} — try help.\nCLI verbs: ${VERBS.filter((v) => v.via === 'cli').map((v) => v.cmd).join(', ')}\nin-app demo only (run in the shell or ⌘K palette): ${VERBS.filter((v) => v.via === 'shell').map((v) => v.cmd).join(', ')}\nhuman levers echoed as receipts (BLOCKED + audit for agents): ${FORM_GATED.join(', ')}\nDid you mean: screening get · screening list · funds list · today queue · fees get · monitoring get · dd get · whoami` };
}
