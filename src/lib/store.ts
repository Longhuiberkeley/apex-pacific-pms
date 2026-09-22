import { canRead, canReadWork, makeRecord, EXTRA_DOCS, type ApprovedRecord } from './records';
import { DEFAULT_CRITERIA, SCREENING_SEED, evaluate, validCriteria, type Criterion } from './screening';
import { create } from 'zustand';
import { toast } from 'sonner';
import type { AppView, AuditEntry, DocRecord, EntityHistory, Fund, FundTab, Identity, IntakePolicy, LedgerEntry, QueueItem, ScreenerItem, VerdictRecord } from './types';
import { AGENT_BOOK_A, CASH_YTD, DOCS_SEED, EXTRACT_POOL, FUNDS_SEED, HUMAN_BOOK, NAV_USD, SCREENER_SEED } from '../data/seed';
import { daysSince } from '../data/seed';
import { validateBook } from './rules';
import { ddState, openFlags } from './dd';
import type { Via } from './verbs';
import { FENCE } from './verbs';
import { documentErrors } from './docs';
import { feeAdjustment, reconcileFee, type FeeInputs, type FeeReview } from './fees';
import { ASSIGNMENTS_SEED, SILK_DRAFT, validateSubmission, type Assignment, type Submission, type WorkResult } from './work';

let widN = 7;
let ridN = 2;
let vidN = 3;

// Clock: pinned base 09:41:12, then advances with real elapsed time.
// Seeded boot entries keep their fixed 09:41:0x stamps — parity holds.
const BOOT_MS = Date.now();
const BASE_MS = new Date(2026, 8, 7, 9, 41, 12).getTime();
const p2 = (n: number) => (n < 10 ? '0' + n : '' + n);
const now = () => {
  const d = new Date(BASE_MS + (Date.now() - BOOT_MS));
  return `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
};

// demo-grade checksum (djb2/6hex) — honest label, honest purpose: tamper-evidence, not crypto.
const h6 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return ('000000' + h.toString(16)).slice(-6);
};
export const shortHash = h6;

const entryHash = (prev: string, t: string, actor: string, action: string, detail: string) =>
  h6(prev + '|' + t + '|' + actor + '|' + action + '|' + detail);

const seedAuditRows: Array<[string, AuditEntry['actor'], string, string, string | undefined]> = [
  ['09:41:02', 'ENGINE', 'system boot — rules engine loaded (5 invariants, incl. cross-lane Rule E)', 'same input, same output', undefined],
  ['09:41:03', 'ENGINE', 'Rule E FAILING at boot — Sable Creek NAV 38d stale at 11.0% > 5.0% cap', 'cross-lane rule already biting', 'SAB'],
  ['09:41:04', 'ENGINE', 'Halcyon fee comparison −$5,130 prepared', '$17.1M × (0.12% − 0.15%) · same-period comparison; restatement assessed separately', 'HAL'],
];
const seedAudit: AuditEntry[] = seedAuditRows.reduce<AuditEntry[]>((acc, [t, actor, action, detail, tag]) => {
  const prev = acc.length ? acc[acc.length - 1].h : 'genesis';
  acc.push({ t, actor, action, detail, tag, h: entryHash(prev, t, actor, action, detail) });
  return acc;
}, []);

const auditH = (t: string, tag: string) => seedAudit.find((a) => a.t === t && a.tag === tag)?.h;

const seedHistoryRows: Array<[string, EntityHistory['actor'], string, string, string, string, string | undefined]> = [
  ['08-01 18:40', 'ENGINE', 'SAB', 'nav.asOf', '', '2026-07-31', 'received'],
  ['08-15 00:00', 'ENGINE', 'SAB', 'pack.sla', '', 'BREACH', 'T+15'],
  ['09-03 09:02', 'YOU', 'HAL', 'exposure.usd', '17.10M', '17.10M', 'confirm'],
  ['09-05 11:12', 'ENGINE', 'HAL', 'pack', 'CLOSED', 'EXCEPTION', 'July restatement -0.8pp'],
  ['09-05 16:40', 'YOU', 'KES', 'verdict.state', '', 'CURRENT', 'V-0001 L. Wu'],
  ['09:41:03', 'ENGINE', 'SAB', 'rule.E', '', 'FAIL', 'NAV 38d stale 11.0% > 5.0%'],
  ['09:41:04', 'ENGINE', 'HAL', 'fee.adjustment.proposed', '0', '-5130', 'navpack.v1'],
];
const seedHistory: EntityHistory[] = seedHistoryRows.reduce<EntityHistory[]>((acc, [t, actor, entityId, field, from, to, source]) => {
  const prev = acc.length ? acc[acc.length - 1].h : 'genesis';
  const piggy = (t === '09:41:03' || t === '09:41:04') ? auditH(t, entityId) : undefined;
  const h = piggy ?? entryHash(prev, t, actor, field, `${from}→${to}`);
  acc.push({ t, actor, entityId, field, from, to, source, h });
  return acc;
}, []);

const seedQueue: QueueItem[] = [
  {
    wid: 'W-0001',
    origin: 'OPS · LETTERS DIGEST',
    title: 'August letters digest — 6 managers, awaiting sign-off',
    draft: 'Digest drafted from 6 letters. Kuramoto β 0.62 flagged; Halcyon restatement noted. Sign to file.',
    done: false,
  },
];

const seedVerdicts: Record<string, VerdictRecord> = {
  KES: { vid: 'V-0001', fundId: 'KES', state: 'CURRENT', flags: [], note: 'confirmed CURRENT — sources reviewed', signer: 'L. Wu', role: 'Analyst', ts: '09-05 16:40' },
  MER: { vid: 'V-0002', fundId: 'MER', state: 'CURRENT', flags: [], note: 'confirmed CURRENT — sources reviewed', signer: 'L. Wu', role: 'Analyst', ts: '09-05 16:52' },
};

export const SILK = 'SIL';
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

interface State {
  operationsSection: 'reporting' | 'fees';
  setOperationsSection: (section: 'reporting' | 'fees') => void;
  todayMode: 'mine' | 'team' | 'intake';
  setTodayMode: (mode: 'mine' | 'team' | 'intake') => void;
  feeReviews: FeeReview[];
  approveFee: (inputs: FeeInputs, note: string) => WorkResult;
  runMonitoring: (fundId?:string) => void;
  records: ApprovedRecord[];
  librarySelection: string | null;
  openRecord: (id: string) => void;
  criteria: Criterion[];
  applyCriteria: (criteria: Criterion[]) => void;
  startResearch: (fundId: string) => void;
  assignments: Assignment[];
  assignmentId: string | null;
  openAssignment: (id: string | null) => void;
  prepareResearch: (id: string) => void;
  saveResearch: (id: string, draft: Submission) => void;
  submitResearch: (id: string, content: unknown, via: 'form' | 'shell' | 'cli') => WorkResult;
  reviewResearch: (id: string, decision: 'accepted' | 'changes requested', note: string) => WorkResult;
  updateWork: (id: string, status: 'In progress' | 'Waiting externally' | 'Done', note: string) => WorkResult;
  identity: Identity | null;
  tab: 'screen' | 'dd' | 'construct' | 'ops';
  view: AppView;
  fundId: string | null;
  fundTab: FundTab;
  intakePolicy: IntakePolicy;
  funds: Fund[];
  book: Record<string, number>;
  staged: Record<string, number> | null;
  ticket: number;
  gateOpen: boolean;
  queue: QueueItem[];
  docs: DocRecord[];
  ledger: LedgerEntry[];
  audit: AuditEntry[];
  history: EntityHistory[];
  verdictLog: VerdictRecord[];
  screener: ScreenerItem[];
  auditOpen: boolean;
  shellOpen: boolean;
  brokerParsed: boolean;
  reconciled: boolean;
  fxQueued: boolean;
  escalated: boolean;
  linkConfirmed: boolean;
  trigAssessed: boolean;
  rawRuns: number;
  agentDemos: number;
  capitalNotes: string[];
  halAck: boolean;
  opsPackOpen: string | null;
  ddqOpen: boolean;
  paletteOpen: boolean;
  modulesOpen: boolean;
  policyOpen: boolean;
  ddSel: string;
  ddVerdicts: Record<string, VerdictRecord>;
  extractRuns: number;
  shellLines: string[];
  entityAudit: { id: string; label: string } | null;

  login: (email: string) => void;
  logout: () => void;
  setTab: (t: State['tab']) => void;
  setView: (v: AppView) => void;
  openFund: (id: string) => void;
  setFundTab: (t: FundTab) => void;
  setIntakePolicy: (p: IntakePolicy) => void;
  setBook: (b: Record<string, number>) => void;
  stage: (b: Record<string, number>) => void;
  clearStage: () => void;
  approveGate: () => void;
  setWeight: (id: string, wt: number) => void;
  setDollars: (id: string, usd: number) => void;
  pasteAgentProposal: (via: Via) => void;
  pushAudit: (actor: AuditEntry['actor'], action: string, detail?: string, tag?: string, hist?: { field: string; from: string; to: string; source?: string }) => void;
  approveQueue: (i: number, opts?: { note?: string; draft?: string; fieldsEdited?: string[] }) => void;
  rejectQueue: (i: number, reason: string, note?: string) => void;
  approveDoc: (id: string) => void;
  rejectDoc: (id: string, reason: string, note?: string) => void;
  editDocField: (id: string, key: string, value: string) => void;
  queueFx: () => void;
  escalateSable: () => void;
  parseBroker: () => void;
  reconcile: () => void;
  confirmLink: () => void;
  assessSable: () => void;
  runRawAgent: () => void;
  agentDemo: () => void;
  addCandidate: (name: string, via: Via) => { ok: boolean; msg: string; dupId?: string; id?: string };
  extractRun: () => { ok: boolean; msg: string; dupId?: string; id?: string };
  triage: (id: string, s: ScreenerItem['status']) => void;
  ackHalcyon: () => void;
  openPack: (id: string | null) => void;
  setDdSel: (id: string) => void;
  fileVerdict: (fundId: string, note: string) => void;
  setAudit: (b: boolean) => void;
  setShell: (b: boolean) => void;
  setDdq: (b: boolean) => void;
  setPalette: (b: boolean) => void;
  setModules: (b: boolean) => void;
  setPolicy: (b: boolean) => void;
  setEntityAudit: (e: { id: string; label: string } | null) => void;
  shellPrint: (s: string) => void;
  emitCmd: (cmd: string, via: Via) => void;
  closeAllOverlays: () => void;
}

export const useStore = create<State>((set, get) => ({
  operationsSection: 'reporting',
  setOperationsSection: (operationsSection) => set({operationsSection}),
  todayMode: 'mine',
  setTodayMode: (todayMode) => set({todayMode,view:'today'}),
  feeReviews: [],
  approveFee: (inputs,note) => {
    const who = get().identity;
    const sources=['hal-nav-08','terms-hal','fee-invoice-hal'].map(id=>get().records.find(r=>r.docId===id));
    if (who?.role !== 'PM' || !sources.every(r=>r && canRead(who,r))) return {ok:false,message:'PM access and all approved source records are required.'};
    const result=reconcileFee(inputs);
    if (!result.ok) return {ok:false,message:result.error};
    if (result.needsReview && !note.trim()) return {ok:false,message:'Explain the discrepancy before approval.'};
    const duplicate = get().feeReviews.find(r=>JSON.stringify(r.inputs)===JSON.stringify(inputs) && r.note===note.trim());
    if (duplicate) return {ok:true,message:'This reconciliation has already been saved.'};
    const record: FeeReview={id:`FEE-${get().feeReviews.length+1}`,inputs:structuredClone(inputs),expected:result.expected,variance:result.variance,days:result.days,note:note.trim(),reviewer:who.name,at:now(),sources:sources.map(r=>r!.id),access:'PM'};
    set(s=>({feeReviews:[...s.feeReviews,record]}));
    get().pushAudit('YOU', `Approved reconciliation ${record.id}`, 'PM-only reconciliation saved; no payment sent', 'HAL');
    return {ok:true,message:'Reconciliation saved with its approved source records.'};
  },
  runMonitoring: (fundId) => {
    if (!get().identity) return;
    const breaches=get().funds.filter(f=>(!fundId||f.id===fundId)&&(!f.asOf || daysSince(f.asOf)>30));
    const next=breaches.filter(f=>!get().assignments.some(a=>a.id===`MON-${f.id}`)).map(f=>({id:`MON-${f.id}`,fundId:f.id,title:`Investigate NAV freshness: ${f.name}`,owner:'L. Wu',reviewer:'A. Chan',due:'2026-09-08',mode:'type2' as const,status:'Assigned' as const,brief:`The latest NAV is dated ${f.asOf ?? 'unknown'} (${daysSince(f.asOf)} days old). The freshness limit is 30 days. Determine the reason and recommend follow-up. Research acceptance cannot clear this numerical breach.`,deliverables:['Verified cause and evidence','Impact on liquidity and valuation confidence','Recommended action and unresolved questions'],sources:[{id:`${f.id}-FRESHNESS`,title:'NAV freshness check',excerpt:`Computed on 7 September 2026: NAV date ${f.asOf}; age ${daysSince(f.asOf)} days; limit 30 days. Source: existing approved fund record.`}],revisions:[],next:'PM reviews the investigation and Operations receives the follow-up conditions.'}));
    set(s=>({assignments:[...s.assignments,...next]}));
    get().pushAudit('ENGINE', 'NAV freshness checks completed', `${breaches.length} breaches; ${next.length} investigations created`);
    toast.success(`${next.length} investigations created`,{description:'Existing investigations are not duplicated.'});
  },
  records: EXTRA_DOCS.map(d => makeRecord(d, 'A. Chan', d.arrived)),
  librarySelection: null,
  openRecord: (librarySelection) => {
    if (!librarySelection) { set({librarySelection:null}); return; }
    const record=get().records.find(r=>r.id===librarySelection);
    if (!record || !canRead(get().identity,record)) return;
    set(record.fundId ? {librarySelection,view:'fund',fundId:record.fundId,fundTab:'documents'} : {librarySelection,view:'today',todayMode:'intake'});
  },
  criteria: structuredClone(DEFAULT_CRITERIA),
  applyCriteria: (criteria) => {
    if (!get().identity || !validCriteria(criteria)) return;
    set({ criteria: structuredClone(criteria) });
    get().pushAudit('YOU', 'Applied screening criteria', JSON.stringify(criteria));
  },
  startResearch: (fundId) => {
    const fund = get().screener.find(f => f.id === fundId);
    if (!fund || !get().identity) return;
    const existing = get().assignments.find(a => a.fundId === fundId && a.mode === 'type2' && !a.parentId);
    if (existing) { get().openAssignment(existing.id); return; }
    const id = `RESEARCH-${fundId}`;
    const result = evaluate(fund.metrics, get().criteria);
    const sources = [{ id: `${fundId}-SCREEN`, title: 'Screening snapshot', excerpt: `${fund.metricSource ?? 'No evidence supplied'}; as of ${fund.metricAsOf ?? 'unknown'}. ${result.checks.map(c=>`${c.label}: ${c.value??'not supplied'} ${c.unit}; ${c.status}`).join('. ')}` }];
    const assignment: Assignment = { id, fundId, title: `Investigate ${fund.name}`, owner: 'L. Wu', reviewer: 'A. Chan', due: '2026-09-14', mode: 'type2', status: 'Assigned', brief: `Screening: ${result.status}. Assess strategy robustness, team continuity, liquidity alignment and operational controls. Explain missing evidence and distinguish manager claims from verified facts.`, deliverables: ['Evidence-backed findings', 'Uncertainties and risks', 'Recommendation and follow-up conditions'], sources, revisions: [], next: 'Analyst submits findings; PM reviews and assigns diligence follow-up.' };
    set(s => ({ assignments: [...s.assignments, assignment], assignmentId: id }));
    get().pushAudit('ENGINE', `Created ${id}`, 'Screening snapshot attached; human research required', fundId);
  },
  assignments: [...structuredClone(ASSIGNMENTS_SEED), { id: 'PM-REF', fundId: 'SIL', title: 'Review confidential reference', access: 'PM', owner: 'A. Chan', reviewer: 'A. Chan', due: '2026-09-12', mode: 'type2', status: 'Assigned', brief: 'Assess the reference note and identify independent corroboration needed before diligence proceeds.', deliverables: ['Reference assessment', 'Unresolved questions'], sources: [{id:'REF-SOURCE',docId:'private-reference',access:'PM',title:'Private reference note',excerpt:'Former colleague describes a disciplined escalation process; independently corroborate staffing coverage.'}], revisions: [], next: 'PM reviews the report; follow-up retains the restricted classification.' }],
  assignmentId: null,
  updateWork: (id, status, note) => {
    const a = get().assignments.find((x) => x.id === id);
    const who = get().identity;
    if (!a || !canReadWork(who,a,get().docs) || !who || a.mode !== 'deterministic' || a.destination || a.status === 'Done') return { ok: false, message: 'Use the dedicated workflow for this assignment.' };
    if (!note.trim()) return { ok: false, message: 'Record what happened before updating the task.' };
    set((s) => ({ assignments: s.assignments.map((x) => x.id === id ? { ...x, status, blocker: status === 'Waiting externally' ? note.trim() : undefined, activity: [...(x.activity ?? []), { at: now(), by: who.name, note: note.trim(), status }] } : x) }));
    get().pushAudit('YOU', `${id} → ${status} by ${who.name}`, a.access === 'PM' ? 'Restricted activity recorded' : note.trim(), a.fundId);
    get().emitCmd(`tasks update ${id} --status="${status}"`, 'form');
    return { ok: true, message: 'Activity saved. Fund documents and investment decisions remain separate records.' };
  },
  openAssignment: (assignmentId) => set({ assignmentId }),
  prepareResearch: (id) => {
    const a = get().assignments.find((a) => a.id === id);
    if (!a || !canReadWork(get().identity,a,get().docs) || a.mode !== 'type2' || a.status === 'Done' || a.status === 'Needs review') return;
    const draft = id === 'A-101' ? structuredClone(SILK_DRAFT) : { recommendation: 'Continue evidence gathering before an investment decision.', rationale: 'The attached screening or monitoring evidence identifies questions for investigation. Strategy robustness, liquidity alignment, team continuity and operational controls still require independent verification.', risks: 'Manager claims and missing evidence may change the assessment. Numerical eligibility alone does not establish investment quality.', conditions: 'Obtain independent records and document unresolved questions for the reviewer.', sources: a.sources.map(s => s.id) };
    if (!draft) return;
    set((s) => ({ assignments: s.assignments.map((a) => a.id === id ? { ...a, draft, status: 'In progress' } : a) }));
    get().pushAudit('AGENT', `prepared research draft for ${id}`, 'Prepared demo response · sources attached · awaiting submission', a.fundId);
    get().emitCmd(`tasks draft ${id} --example`, 'form');
  },
  saveResearch: (id, draft) => set((s) => ({ assignments: s.assignments.map((a) => canReadWork(s.identity,a,s.docs) && a.id === id && a.status !== 'Done' && a.status !== 'Needs review' ? { ...a, draft, access: a.access ?? (a.sources.some(source => source.access === 'PM' || s.docs.some(d=>d.id===source.docId && d.access==='PM')) ? 'PM' : 'team') } : a) })),
  submitResearch: (id, content, via) => {
    const a = get().assignments.find((a) => a.id === id);
    if (!get().identity) return { ok: false, message: 'Sign in to the demo first.' };
    if (!a || !canReadWork(get().identity,a,get().docs)) return { ok: false, message: 'Assignment unavailable for this role.' };
    if (a.mode !== 'type2') return { ok: false, message: 'This assignment uses its dedicated document or deterministic workflow.' };
    if (a.status !== 'Assigned' && a.status !== 'In progress') return { ok: false, message: 'This assignment is not accepting a submission. A reviewer must request changes before resubmission.' };
    const checked = validateSubmission(content, a);
    if (!checked.ok) return checked;
    const by = via === 'form' ? get().identity!.name : `External agent (${via})`;
    const revision = { version: a.revisions.length + 1, content: checked.content, by, via, at: now() };
    set((s) => ({ assignments: s.assignments.map((x) => x.id === id ? { ...x, draft: checked.content, status: 'Needs review', revisions: [...x.revisions, revision] } : x) }));
    get().pushAudit(via === 'form' ? 'YOU' : 'AGENT', `submitted ${id} v${revision.version} by ${by}`, `Schema and source IDs checked · awaiting ${a.reviewer}`, a.fundId, { field: 'research.submission', from: a.status, to: 'Needs review', source: id });
    get().emitCmd(`tasks submit ${id} --json=research.json`, via);
    return { ok: true, message: `Research submitted for ${a.reviewer} to review. Portfolio unchanged.` };
  },
  reviewResearch: (id, decision, note) => {
    const a = get().assignments.find((a) => a.id === id);
    const who = get().identity;
    if (!a || !canReadWork(get().identity,a,get().docs) || a.status !== 'Needs review' || !a.revisions.length) return { ok: false, message: 'No submission awaiting review.' };
    if (who?.role !== 'PM' || who.name !== a.reviewer) return { ok: false, message: `Review is assigned to ${a.reviewer} (PM).` };
    if (!note.trim()) return { ok: false, message: 'Add a review note or the changes you need.' };
    const nextId = `${id}-NEXT`;
    const latest = a.revisions[a.revisions.length - 1];
    const next: Assignment = {
      id: nextId, parentId: id, fundId: a.fundId,
      title: id === 'A-101' ? 'Request Silk River diligence documents' : `Follow up: ${a.title}`,
      owner: 'M. Lee', reviewer: a.reviewer, due: '2026-09-12', mode: 'deterministic', status: 'Assigned',
      brief: `Carry-forward conditions: ${latest.content.conditions}\nReviewer instruction: ${note.trim()}`,
      deliverables: id === 'A-101' ? ['Audited track record', 'Administrator-confirmed redemption terms', 'Independent NAV history'] : ['Response to the review conditions'],
      access: a.access, sources: a.sources, revisions: [], next: 'Collect the evidence for analyst review. Investment approval remains a separate IC decision.',
    };
    set((s) => ({
      assignments: [
        ...s.assignments.map((x) => x.id === id ? { ...x, status: decision === 'accepted' ? 'Done' as const : 'In progress' as const, revisions: x.revisions.map((r, i) => i === x.revisions.length - 1 ? { ...r, decision, reviewNote: note.trim(), reviewer: who.name, reviewedAt: now() } : r) } : x),
        ...(decision === 'accepted' && !s.assignments.some((x) => x.id === nextId) ? [next] : []),
      ],
      ...(decision === 'accepted' ? { screener: s.screener.map((c) => c.id === a.fundId ? { ...c, status: 'IN DD' as const } : c) } : {}),
    }));
    get().pushAudit('YOU', `${decision} ${id} v${latest.version} — ${who.name}`, a.access === 'PM' ? 'Restricted review recorded' : note.trim(), a.fundId, { field: 'research.decision', from: 'Needs review', to: decision, source: id });
    get().emitCmd(`tasks review ${id} --decision="${decision}"`, 'form');
    if (decision === 'accepted') get().pushAudit('ENGINE', `created ${nextId} → M. Lee`, `Conditions copied from ${id}; ${id === 'A-101' ? 'Silk River moved to diligence' : 'follow-up assigned'}`, a.fundId);
    return { ok: true, message: decision === 'accepted' ? 'Accepted. Operations has a follow-up assignment containing the review conditions.' : 'Returned to the analyst. The previous submission and review are retained.', ...(decision === 'accepted' ? { nextId } : {}) };
  },
  identity: null,
  tab: 'ops',
  view: 'today',
  fundId: null,
  fundTab: 'overview',
  intakePolicy: 'AUTO',
  funds: FUNDS_SEED,
  book: { ...HUMAN_BOOK },
  staged: null,
  ticket: 0,
  gateOpen: false,
  queue: seedQueue,
  docs: [...DOCS_SEED, ...EXTRA_DOCS].map((d) => ({ ...d, fields: d.fields.map((f) => ({ ...f })), editedFields: [] })),
  ledger: [{ rid: 'R-0001', title: 'August letters digest — 6 managers', wid: 'W-0001', by: 'Analyst', ts: '09-01 10:12' }],
  audit: seedAudit,
  history: seedHistory,
  verdictLog: [seedVerdicts.KES, seedVerdicts.MER],
  screener: [...SCREENER_SEED, ...SCREENING_SEED],
  auditOpen: false,
  shellOpen: false,
  brokerParsed: false,
  reconciled: false,
  fxQueued: false,
  escalated: false,
  linkConfirmed: false,
  trigAssessed: false,
  rawRuns: 0,
  agentDemos: 0,
  capitalNotes: [],
  halAck: false,
  opsPackOpen: null,
  ddqOpen: false,
  paletteOpen: false,
  modulesOpen: false,
  policyOpen: false,
  ddSel: 'SAB',
  ddVerdicts: seedVerdicts,
  extractRuns: 0,
  shellLines: [
    'apex shell — same rails, for agents and power users · try `help`',
    FENCE,
    'every form you click in the UI echoes here as a command — the shell is the receipt.',
  ],
  entityAudit: null,

  login: (email) => {
    const e = email.trim().toLowerCase();
    const id: Identity =
      e.startsWith('l.wu') ? { name: 'L. Wu', email, role: 'Analyst' } : { name: 'A. Chan', email, role: 'PM' };
    set({ identity: id, assignmentId: null, librarySelection: null, shellLines: [], shellOpen: false, auditOpen: false, ddqOpen: false, entityAudit: null });
    get().pushAudit('YOU', `signed in as ${id.name} (${id.role})`);
  },
  logout: () => set({ identity: null }),
  setTab: (tab) =>
    set({
      tab,
      view: tab === 'construct' ? 'book' : tab === 'dd' ? 'fund' : 'today',
      ...(tab === 'dd' ? { fundId: get().ddSel } : {}),
    }),
  setView: (view) => {
    if (view==='team') { set({view:'today',todayMode:'team'}); return; }
    if (view==='library') { set({view:'today',todayMode:'intake',librarySelection:null}); return; }
    if (view==='screening') { set({view:'funds'}); return; }
    if (view==='fees') { set({view:'fund',fundId:'HAL',fundTab:'operations',operationsSection:'fees'}); return; }
    if (view==='monitoring') { set({view:'fund',fundId:get().fundId ?? 'SAB',fundTab:'operations',operationsSection:'reporting'}); return; }
    set({view,tab:view==='book'?'construct':view==='fund'?'dd':'ops'});
  },
  openFund: (id) => set({ view: 'fund', fundId: id, fundTab: 'overview', operationsSection: 'reporting', librarySelection: null, ddSel: id, tab: 'dd' }),
  setFundTab: (fundTab) => set({ fundTab }),
  setIntakePolicy: (p) => {
    const prev = get().intakePolicy;
    if (prev === p) return;
    set({ intakePolicy: p });
    get().pushAudit('YOU', `policy.intake ${prev} to ${p}`);
    get().emitCmd(`policy intake ${p}`, 'form');
  },
  setBook: (book) => set({ book }),
  stage: (b) => set({ staged: { ...b }, gateOpen: true }),
  clearStage: () => {
    set({ staged: null, gateOpen: false });
    get().pushAudit('YOU', 'discarded staged proposal — IC gate closed');
    get().emitCmd('book discard', 'form');
  },
  approveGate: () => {
    const { identity, staged, ticket, funds } = get();
    if (!staged) return;
    if (identity?.role !== 'PM') {
      get().pushAudit('YOU', `BLOCKED approve attempt by ${identity?.name ?? 'unknown'} (Analyst) — PM signature required`);
      toast.error('Portfolio manager approval required');
      return;
    }
    // Defense-in-depth: validate at commit, not just via disabled button.
    const violations = validateBook(staged, funds);
    if (violations.length > 0) {
      get().pushAudit('ENGINE', `BLOCKED commit — invariants failing`, violations.map((v) => v.msg).join(' | '), 'PORT');
      toast.error('Resolve the portfolio limit issues before approval');
      return;
    }
    const rid = 'R-' + String(ridN++).padStart(4, '0');
    const committed = { ...staged };
    const prevBook = get().book;
    const changedPairs = Object.entries(committed).filter(([k, v]) => Math.abs(v - (prevBook[k] ?? 0)) >= 0.05);
    const changed = changedPairs.map(([k, v]) => `${k} ${(prevBook[k] ?? 0).toFixed(1)}→${v.toFixed(1)}`).join(', ');
    set((s) => ({
      book: committed,
      funds: s.funds.map((f) => (committed[f.id] !== undefined ? { ...f, wt: committed[f.id] } : f)),
      staged: null,
      gateOpen: false,
      ticket: ticket + 1,
      capitalNotes: [
        `Ticket #${ticket + 1} — IC signed by ${identity.name} (PM): ${changed || 'no weight change'} · instruction lands on OPS · 90-day clock`,
        ...s.capitalNotes,
      ],
      ledger: [{ rid, title: `Allocation ticket #${ticket + 1} — IC signed`, wid: 'W-PORT', by: `${identity.name} (PM)`, ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
      assignments: [
        ...s.assignments.map((a) => a.destination === 'book' && a.status !== 'Done' ? { ...a, status: 'Done' as const, next: `Allocation ticket #${ticket + 1} signed; Operations instruction review assigned.` } : a),
        { id: `IC-${ticket + 1}-OPS`, fundId: 'SAB', title: `Review capital instructions · ticket #${ticket + 1}`, owner: 'M. Lee', reviewer: identity.name, due: '2026-09-08', mode: 'deterministic' as const, status: 'Assigned' as const, brief: `PM-approved target changes: ${changed || 'no weight change'}. Prepare the instructions and verify dealing dates before external execution. Approval of a target book does not mean a trade has settled.`, deliverables: ['Instruction review', 'Dealing dates and administrator confirmation'], sources: [], revisions: [], next: 'Record dispatch and administrator response. Track execution separately from the target book.' },
      ],
    }));
    changedPairs.forEach(([k, v]) => {
      if (k === 'CASH') return;
      get().pushAudit('YOU', `exposure.wt ${(prevBook[k] ?? 0).toFixed(1)} to ${v.toFixed(1)}`, `ticket #${ticket + 1}`, k, {
        field: 'exposure.wt',
        from: (prevBook[k] ?? 0).toFixed(1),
        to: v.toFixed(1),
        source: rid,
      });
    });
    get().pushAudit('YOU', `APPROVED allocation ticket #${ticket + 1} as ${identity.name} (PM) — filed ${rid}`, 'weights committed · 90-day clock', 'PORT');
    get().emitCmd(`book approve --ticket=${ticket + 1}`, 'form');
    toast.success('Allocation approved', {description:'Operations has received the instruction-review assignment.'});
  },
  setWeight: (id, wt) => {
    if (!Number.isFinite(wt)) return;
    const base = { ...(get().staged ?? get().book) };
    base[id] = Math.round(wt * 10) / 10;
    // Residual arithmetic: cash always absorbs so Σ = 100.0 (Rule D repairable).
    const nonCash = Object.entries(base)
      .filter(([k]) => k !== 'CASH')
      .reduce((a, [, v]) => a + v, 0);
    base.CASH = Math.round((100 - nonCash) * 10) / 10;
    set({ staged: base, gateOpen: true });
  },
  setDollars: (id, usd) => {
    if (!Number.isFinite(usd)) return;
    const wt = Math.round((usd / NAV_USD) * 1000) / 10;
    const prev = get().staged ?? get().book;
    const oldWt = prev[id] ?? get().funds.find((f) => f.id === id)?.wt ?? 0;
    const oldUsd = Math.round((oldWt / 100) * NAV_USD);
    const nextUsd = Math.round(usd);
    if (nextUsd === oldUsd) return;
    get().setWeight(id, wt);
    get().pushAudit('YOU', `exposure.usd ${oldUsd} to ${nextUsd}`, '', id, {
      field: 'exposure.usd',
      from: String(oldUsd),
      to: String(nextUsd),
      source: 'edit',
    });
    get().emitCmd(`book set ${id} --usd=${nextUsd}`, 'form');
  },
  pasteAgentProposal: (via) => {
    get().stage({ ...AGENT_BOOK_A });
    get().setView('book');
    get().pushAudit('AGENT', 'pasted agent proposal — Σ 101.3 staged', 'A/C/D/E', 'PORT');
    get().emitCmd('book paste --raw', via);
    toast.message('agent proposal staged — Σ 101.3');
  },

  pushAudit: (actor, action, detail = '', tag, hist) =>
    set((s) => {
      const t = now();
      const prev = s.audit.length ? s.audit[s.audit.length - 1].h : 'genesis';
      const h = entryHash(prev, t, actor, action, detail);
      const tracked = !!tag && (s.funds.some((f) => f.id === tag) || s.screener.some((c) => c.id === tag));
      const row: EntityHistory | null =
        tracked && tag
          ? {
              t,
              actor,
              entityId: tag,
              field: hist?.field ?? 'event',
              from: hist?.from ?? '',
              to: hist?.to ?? action,
              source: hist?.source ?? (detail || undefined),
              h,
            }
          : null;
      return {
        audit: [...s.audit, { t, actor, action, detail, tag, h }],
        history: row ? [...s.history, row] : s.history,
      };
    }),

  approveQueue: (i, opts) => {
    const q = get().queue[i];
    if (!q || q.done) return;
    const rid = 'R-' + String(ridN++).padStart(4, '0');
    const nq = get().queue.slice();
    nq[i] = { ...q, draft: opts?.draft ?? q.draft, done: true, rid };
    const edited = opts?.fieldsEdited?.length ? `fields_edited ${opts.fieldsEdited.join(',')}` : '';
    const detail = [q.title, opts?.draft ?? q.draft, opts?.note, edited].filter(Boolean).join(' · ');
    set((s) => ({
      queue: nq,
      ledger: [{ rid, title: q.title, wid: q.wid, by: s.identity ? `${s.identity.name} (${s.identity.role})` : 'you', ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
    }));
    get().pushAudit('YOU', `APPROVED ${q.wid} — filed ${rid}`, detail, q.wid);
    get().emitCmd(`today approve ${q.wid}`, 'form');
    toast.success('Review approved and saved');
  },

  rejectQueue: (i, reason, note = '') => {
    const q = get().queue[i];
    if (!q || q.done) return;
    const nq = get().queue.slice();
    nq[i] = { ...q, done: true, rejected: true };
    set({ queue: nq });
    get().pushAudit('YOU', `REJECTED ${q.wid} — ${reason}`, note, q.wid);
    get().emitCmd(`today reject ${q.wid}`, 'form');
    toast.message('Item returned without approval');
  },

  approveDoc: (id) => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc || doc.status !== 'pending' || !canRead(get().identity, doc)) return;
    const errors = documentErrors(doc);
    if (errors.length) { toast.error('Record needs correction', { description: errors.join(' ') }); return; }
    const record = makeRecord(doc, get().identity!.name, new Date(BASE_MS + Date.now() - BOOT_MS).toISOString());
    const edited = doc.editedFields.length ? `fields_edited ${doc.editedFields.join(',')}` : '';
    get().pushAudit('AGENT', `drafted ${doc.id} — ${doc.title}`, `overall ${(doc.overall * 100).toFixed(0)}%`, doc.fundId ?? doc.id);
    set((s) => ({
      docs: s.docs.map((d) => (d.id === id ? { ...d, status: 'approved' as const } : d)),
      records: [...s.records.filter(r => r.docId !== id), record],
      assignments: s.assignments.map((a) => a.docId === id ? { ...a, status: 'Done', next: 'Document approved and filed in the shared fund record.' } : a),
    }));
    if (id === 'hal-nav-08') {
      get().ackHalcyon();
    } else {
      const rid = 'R-' + String(ridN++).padStart(4, '0');
      const who = get().identity;
      set((s) => ({
        ledger: [{ rid, title: doc.title, wid: doc.id, by: who ? `${who.name} (${who.role})` : 'you', ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
      }));
    }
    get().pushAudit('YOU', `approved ${doc.id}`, edited, doc.fundId ?? doc.id, {
      field: 'doc.status',
      from: 'pending',
      to: 'approved',
      source: doc.id,
    });
    get().emitCmd(`docs approve ${id}`, 'form');
    toast.success('Approved record saved', { description: record.title, action: { label: 'View saved record', onClick: () => get().openRecord(record.id) } });
  },

  rejectDoc: (id, reason, note = '') => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc || doc.status !== 'pending' || !canRead(get().identity, doc)) return;
    set((s) => ({
      docs: s.docs.map((d) => (d.id === id ? { ...d, status: 'rejected' as const, rejectReason: reason, rejectNote: note } : d)),
    }));
    get().pushAudit('YOU', `rejected ${doc.id} — ${reason}`, note, doc.fundId ?? doc.id, {
      field: 'doc.status',
      from: 'pending',
      to: 'rejected',
      source: doc.id,
    });
    get().emitCmd(`docs reject ${id}`, 'form');
    toast.message(`rejected ${doc.title}`);
  },

  editDocField: (id, key, value) => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc || doc.status !== 'pending' || !canRead(get().identity, doc)) return;
    if (key === 'fee_delta_usd') return;
    const first = !doc.editedFields.includes(key);
    set((s) => ({
      docs: s.docs.map((d) => {
        if (d.id !== id) return d;
        const fields = d.fields.map((f) => (f.key === key ? { ...f, value, editedBy: 'YOU' as const } : { ...f }));
        if (id === 'hal-nav-08') {
          const n = (k: string) => Number(fields.find((f) => f.key === k)?.value);
          const delta = feeAdjustment(n('nav_usd'), n('fee_charged_pct'), n('fee_expected_pct'));
          fields.forEach((f) => { if (f.key === 'fee_delta_usd') f.value = delta; });
        }
        return {
          ...d,
          editedFields: first ? [...d.editedFields, key] : d.editedFields,
          fields,
        };
      }),
    }));
    if (first) get().emitCmd(`docs edit ${id} ${key}`, 'form');
  },

  queueFx: () => {
    if (get().fxQueued) return;
    const wid = 'W-' + String(widN++).padStart(4, '0');
    set((s) => ({
      fxQueued: true,
      queue: [{ wid, origin: 'OPS · RECONCILIATION', title: 'FX break — 2 unexpected lines need human explanation', draft: 'Draft: confirm with broker; sign to file.', done: false }, ...s.queue],
    }));
    get().pushAudit('ENGINE', 'reconciliation breaks queued → Today (fee_delta, unexpected_fx)', '', 'MONDAY');
    get().emitCmd('ops queue-fx --break=unexpected_fx', 'form');
    toast.success('FX discrepancy added to Today for review');
  },
  escalateSable: () => {
    if (get().escalated) return;
    const wid = 'W-' + String(widN++).padStart(4, '0');
    set((s) => ({
      escalated: true,
      queue: [{ wid, origin: 'OPS · NAV DESK', title: 'Call Sable Creek administrator — August pack missing', draft: 'Call script drafted. 23d past SLA. Sign to file.', done: false }, ...s.queue],
    }));
    get().pushAudit('YOU', 'escalated missing pack → Today (Sable Creek)', '', 'SAB', {
      field: 'ops.escalate',
      from: '',
      to: 'queued',
      source: wid,
    });
    get().emitCmd('ops escalate SAB --to=monitor', 'form');
    toast.success('Follow-up added to Today');
  },
  parseBroker: () => {
    set({ brokerParsed: true });
    get().pushAudit('ENGINE', 'broker .xls parsed once → navpack.v1 record', 'office format → record, not spreadsheet', 'MONDAY');
    get().emitCmd('ops parse monday.xls', 'form');
  },
  reconcile: () => {
    set({ reconciled: true });
    get().pushAudit('ENGINE', 'reconciled ledger vs statement — 2 breaks (fee_delta, unexpected_fx)', 'math is code', 'MONDAY');
    get().emitCmd('ops reconcile monday.xls', 'form');
  },
  confirmLink: () => {
    set({ linkConfirmed: true });
    get().pushAudit('YOU', 'confirmed Type-1 link suggestion', 'monitor event ↔ Sable Creek SLA trigger', 'SAB');
  },
  assessSable: () => {
    if (get().trigAssessed) return;
    // Trigger is consumed into a real reviewable workup — the workup replaces the trigger in the open count.
    const wid = 'W-' + String(widN++).padStart(4, '0');
    const item: QueueItem = {
      wid,
      origin: 'MONITOR · SLA-02 WORKUP',
      title: 'Sable Creek — assessment: cap at 5% under Rule E, queue re-DD',
      draft: 'Agent workup: August NAV 23d past SLA (as-of 2026-07-31). Level-3 31%, queries open 60+d. Recommendation: cap allocation at 5% under Rule E, queue re-DD, prepare 90d redemption notice. Exposure contained, not exit. Sign to file.',
      done: false,
    };
    set((s) => ({ trigAssessed: true, queue: [item, ...s.queue] }));
    get().pushAudit('AGENT', `${wid} — Sable assessment drafted, awaiting human`, 'cap at 5% under Rule E', 'SAB');
    get().emitCmd('monitor assess SLA-02 --draft', 'shell');
  },
  runRawAgent: () => set({ rawRuns: get().rawRuns + 1 }),

  agentDemo: () => {
    const n = get().agentDemos + 1;
    set({ agentDemos: n });
    const P = (s: string) => get().shellPrint(s);
    if (n % 2 === 1) {
      // Run 1 — the raw agent: claims VALIDATED on a 101.3% book. The engine disagrees, on stage.
      P('agent: prompt → "rebalance the book"');
      P('agent: "weights look reasonably balanced — Σ 101.3%, close enough" · claims ✓ VALIDATED');
      P('agent: (it graded its own homework — no invariant run, no citations)');
      get().stage(AGENT_BOOK_A);
      get().setTab('construct');
      P('engine: ⛔ BLOCKED — A/C/D/E FAIL (Σ 101.3 ≠ 100.0 · NOR 26.4 > 25.0 · reserve 7.0 < 10.0 · Sable stale 38d at 11.0%)');
      P('→ the raw book now sits staged at the IC gate, exposed for the humans. the agent never touches the lever.');
      P('→ run `agent demo` again to see the fenced version.');
      get().pushAudit('AGENT', 'raw agent demo — Σ 101.3 book staged; agent claimed VALIDATED, invariants BLOCKED', 'A/C/D/E', 'PORT');
      get().emitCmd('book propose --raw', 'shell');
      toast.error('agent claimed VALIDATED — engine says BLOCKED (A/C/D/E)');
    } else {
      // Run 2 — the fenced agent: works through the rails, repairs, waits for the human.
      P('agent: reading LPA + DDQ… running book propose → ⛔ BLOCKED by Rule E (Sable 38d stale 11.0% > 5.0%)');
      P('agent: revising — Sable capped at 5.0% under Rule E');
      const repaired: Record<string, number> = { ...get().book, SAB: 5.0 };
      const nonCash = Object.entries(repaired)
        .filter(([k]) => k !== 'CASH')
        .reduce((a, [, v]) => a + v, 0);
      repaired.CASH = Math.round((100 - nonCash) * 10) / 10; // derive — never hardcode against a committed book
      get().stage(repaired);
      get().setTab('construct');
      P('engine: ✓ VALIDATED — Σ 100.0 · A–E pass · verdict rendered by the ENGINE, not the agent');
      P('→ ticket drafted → AWAITING HUMAN');
      get().pushAudit('AGENT', 'fenced agent demo — repaired book staged (SAB capped 5.0%), awaiting human', '', 'PORT');
      get().emitCmd('book propose --fenced', 'shell');
      toast.success('fenced agent: repaired book staged → AWAITING HUMAN');
    }
  },

  addCandidate: (name, via) => {
    const clean = name.trim();
    if (!clean) return { ok: false, msg: 'empty name' };
    const dup = [...get().screener, ...get().funds].find((c) => norm(c.name) === norm(clean));
    if (dup) {
      get().pushAudit('ENGINE', `dedupe caught duplicate intake — "${clean}" ≈ ${dup.id} (${dup.name})`, '', dup.id);
      get().emitCmd(`screen add "${clean}"`, via);
      return { ok: false, msg: `dedupe caught — "${clean}" is already on the list as ${dup.id}`, dupId: dup.id };
    }
    const id = `NEW-${crypto.randomUUID().slice(0,8)}`;
    set((s) => ({
      screener: [
        { id, name: clean, ticker: id, score: null, tag: 'HUMAN INTAKE', reason: 'New candidate; metrics and evidence need analyst review.', cite: `CIT-FRM-${id}`, status: 'NEW', origin: via === 'shell' || via === 'cli' ? 'SHELL' : 'FORM', addedAt: now().slice(0, 5) },
        ...s.screener,
      ],
    }));
    get().pushAudit(via === 'cli' || via === 'shell' ? 'AGENT' : 'YOU', `screener intake — ${clean}`, `via ${via} · receipt filed · no score invented`, id);
    get().emitCmd(`screen add "${clean}"`, via);
    return { ok: true, id, msg: `intake ${clean} — receipt filed, no score invented` };
  },

  extractRun: () => {
    const n = get().extractRuns;
    set({ extractRuns: n + 1 });
    const pool = EXTRACT_POOL[Math.min(n, EXTRACT_POOL.length - 1)];
    const dup = get().screener.find((c) => norm(c.name) === norm(pool.name));
    get().emitCmd('screen extract --now', 'engine');
    if (dup) {
      get().pushAudit('ENGINE', `semantic extract — dedupe: ${pool.name} already on list (${pool.cite})`, '', dup.id);
      return { ok: false, msg: `dedupe caught — ${pool.name} already on the list (${pool.cite})`, dupId: dup.id };
    }
    set((s) => ({ screener: [{ ...pool, status: 'NEW', addedAt: now().slice(0, 5) }, ...s.screener] }));
    get().pushAudit('ENGINE', `semantic extract — 1 new name: ${pool.name} (${pool.cite})`, 'Type 1 · cited · deterministic dedupe', pool.id);
    return { ok: true, msg: `extract: 1 new name — ${pool.name} · ${pool.cite}` };
  },

  triage: (id, st) => {
    const c = get().screener.find((x) => x.id === id);
    set((s) => ({ screener: s.screener.map((x) => (x.id === id ? { ...x, status: st } : x)) }));
    if (c) {
      get().pushAudit('YOU', `triage ${c.name} → ${st}`, '', id);
      get().emitCmd(`screen triage ${id} ${st === 'PARKED' ? 'park' : 'dd'}`, 'form');
    }
  },

  ackHalcyon: () => {
    if (get().halAck) return;
    const rid = 'R-' + String(ridN++).padStart(4, '0');
    const who = get().identity;
    const approved = get().records.find(r => r.docId === 'hal-nav-08');
    if (!approved) { toast.error('Review and save the NAV record first.'); return; }
    const delta = approved.values.fee_delta_usd;
    set((s) => ({
      halAck: true,
      ledger: [{ rid, title: `Halcyon restatement acknowledged — fee comparison $${delta} filed`, wid: 'W-OPS-HAL', by: who ? `${who.name} (${who.role})` : 'you', ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
    }));
    get().pushAudit('YOU', `acknowledged Halcyon restatement — fee comparison $${delta} filed`, `filed ${rid}`, 'HAL', {
      field: 'pack.ack',
      from: 'EXCEPTION',
      to: 'acknowledged',
      source: rid,
    });
    get().emitCmd('ops ack HAL.restatement', 'form');
    toast.success('NAV correction reviewed and saved');
  },

  openPack: (id) => {
    if (id === 'HAL' && get().opsPackOpen !== 'HAL') {
      get().pushAudit('YOU', 'opened pack — halcyon_nav_2026-08.xlsx', '', 'HAL');
      get().emitCmd('ops open-pack HAL', 'form');
    }
    set({ opsPackOpen: id });
  },

  setDdSel: (id) => set({ ddSel: id }),

  fileVerdict: (fundId, note) => {
    const f = get().funds.find((x) => x.id === fundId);
    if (!f) return;
    const who = get().identity;
    const st = ddState(fundId).s;
    const flags = openFlags(fundId);
    const vid = 'V-' + String(vidN++).padStart(4, '0');
    const rec: VerdictRecord = {
      vid,
      fundId,
      state: st,
      flags,
      note: note || (st === 'CURRENT' ? 'confirmed CURRENT — sources reviewed' : 'upheld — filed as structured data'),
      signer: who?.name ?? 'you',
      role: who?.role ?? 'Analyst',
      ts: '09-07 ' + now().slice(0, 5),
    };
    const rid = 'R-' + String(ridN++).padStart(4, '0');
    const prevState = get().ddVerdicts[fundId]?.state ?? '';
    set((s) => ({
      ddVerdicts: { ...s.ddVerdicts, [fundId]: rec },
      verdictLog: [rec, ...s.verdictLog],
      ledger: [{ rid, title: `Diligence verdict — ${f.name} (${st})`, wid: vid, by: who ? `${who.name} (${who.role})` : 'you', ts: rec.ts }, ...s.ledger],
    }));
    get().pushAudit('YOU', `recorded diligence verdict — ${f.name} (${vid})`, `${st} · flags [${flags.join(', ') || '—'}] · ${rec.note} · filed ${rid}`, fundId, {
      field: 'verdict.state',
      from: prevState,
      to: st,
      source: `${vid} ${who?.name ?? ''}`.trim(),
    });
    get().emitCmd(`dd verdict ${fundId} --state=${st}`, 'form');
    toast.success('Diligence review recorded', {description:f.name});
  },

  setAudit: (b) => set({ auditOpen: b }),
  setShell: (b) => set({ shellOpen: b }),
  setDdq: (b) => set({ ddqOpen: b }),
  setPalette: (b) => set({ paletteOpen: b }),
  setModules: (b) => set({ modulesOpen: b }),
  setPolicy: (b) => set({ policyOpen: b }),
  setEntityAudit: (e) => set({ entityAudit: e }),

  shellPrint: (s) => set((st) => ({ shellLines: [...st.shellLines, s] })),
  emitCmd: (cmd, via) =>
    set((s) => {
      const tag = via === 'engine' ? 'engine · scheduled' : via === 'cli' || via === 'shell' ? `agent · via ${via}` : s.identity ? `${s.identity.email.split('@')[0]} · ${s.identity.role} · via ${via}` : `anon · via ${via}`;
      return { shellLines: [...s.shellLines, `» ${cmd}    # ${tag}`] };
    }),
  closeAllOverlays: () =>
    set({ auditOpen: false, shellOpen: false, ddqOpen: false, paletteOpen: false, entityAudit: null, modulesOpen: false, policyOpen: false, assignmentId: null }),
}));

export function openApprovals(s: Pick<State, 'queue' | 'trigAssessed' | 'gateOpen' | 'docs'>): number {
  const q = s.queue.filter((x) => !x.done).length;
  const docs = s.docs.filter((d) => d.status === 'pending').length;
  return q + docs + (s.trigAssessed ? 0 : 1) + (s.gateOpen ? 1 : 0);
}

export function worstNav(funds: Fund[]): { age: number; name: string } {
  let w = 0;
  let n = '—';
  funds.forEach((f) => {
    const a = daysSince(f.asOf);
    if (a < 900 && a > w) {
      w = a;
      n = f.name;
    }
  });
  return { age: w, name: n };
}

export { CASH_YTD };
