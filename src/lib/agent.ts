import { canRead, canReadWork, provenance } from './records';
import { evaluate, validateMetrics } from './screening';
import { useStore } from './store';
import { BookSchema, validateBook } from './rules';
import { SILK_DRAFT } from './work';

export interface AgentResult { ok: boolean; message?: string; data?: unknown }

/** Shared command contract for the in-app shell and the local HTTP/CLI bridge. */
export function executeAgentCommand(command: string, payload?: unknown, via: 'shell' | 'cli' = 'shell'): AgentResult {
  const s = useStore.getState();
  if (!s.identity) return { ok: false, message: 'Sign in to the demo browser first.' };
  const [resource, action, id, ...flags] = command.trim().split(/\s+/);
  if (['approve', 'review', 'update', 'verdict', 'triage'].includes(action)) {
    s.pushAudit('AGENT', `BLOCKED ${command} via ${via}`, 'Human decision required');
    return { ok: false, message: 'This decision belongs to a human in the platform. Agents may read, submit research and stage proposals.' };
  }
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
  if (resource === 'screening' && action === 'get') return {ok:true,data:{criteria:s.criteria,results:s.screener.map(f=>({id:f.id,name:f.name,...evaluate(f.metrics,s.criteria)}))}};
  if (resource === 'book') {
    if (action === 'get') return { ok: true, data: { committed: s.book, proposed: s.staged, violations: validateBook(s.staged ?? s.book, s.funds) } };
    if (action === 'propose') {
      const checked = BookSchema.safeParse(payload ?? s.book);
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
  return { ok: false, message: 'Available: tasks list|get|submit, funds list|get|add, docs list|get, records list|get, screening get, book get|propose, audit tail. Research JSON uses recommendation, rationale, risks, conditions and sources.' };
}
