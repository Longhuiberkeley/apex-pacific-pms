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
    if (action === 'list') return { ok: true, data: s.assignments.map(({ draft, sources, revisions, ...a }) => ({ ...a, submissionCount: revisions.length })) };
    if (action === 'get') {
      const a = s.assignments.find((a) => a.id === id);
      return a ? { ok: true, data: a } : { ok: false, message: `No assignment ${id}.` };
    }
    if (action === 'submit') {
      const value = flags.includes('--example') && id === 'A-101' ? SILK_DRAFT : payload;
      if (value === undefined) return { ok: false, message: 'Provide submission JSON. In the demo console: tasks submit A-101 --example. CLI: tasks submit A-101 --json=research.json' };
      return s.submitResearch(id, value, via);
    }
  }
  if (resource === 'funds') {
    if (action === 'list') return { ok: true, data: { invested: s.funds, pipeline: s.screener } };
    if (action === 'get') {
      const fund = s.funds.find((f) => f.id === id) ?? s.screener.find((f) => f.id === id);
      return fund ? { ok: true, data: { fund, documents: s.docs.filter((d) => d.fundId === id), assignments: s.assignments.filter((a) => a.fundId === id), history: s.history.filter((h) => h.entityId === id), verdict: s.ddVerdicts[id] ?? null } } : { ok: false, message: `No fund ${id}.` };
    }
  }
  if (resource === 'docs') {
    if (action === 'list') return { ok: true, data: s.docs };
    if (action === 'get') {
      const doc = s.docs.find((d) => d.id === id);
      return doc ? { ok: true, data: doc } : { ok: false, message: `No document ${id}.` };
    }
  }
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
  return { ok: false, message: 'Available: tasks list|get|submit, funds list|get, docs list|get, book get|propose, audit tail. Research JSON uses recommendation, rationale, risks, conditions and sources.' };
}
