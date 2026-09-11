import { create } from 'zustand';
import { toast } from 'sonner';
import type { AppView, AuditEntry, DocRecord, EntityHistory, Fund, FundTab, Identity, IntakePolicy, LedgerEntry, QueueItem, ScreenerItem, VerdictRecord } from './types';
import { AGENT_BOOK_A, CASH_YTD, DOCS_SEED, EXTRACT_POOL, FUNDS_SEED, HUMAN_BOOK, NAV_USD, SCREENER_SEED } from '../data/seed';
import { daysSince } from '../data/seed';
import { validateBook } from './rules';
import { ddState, openFlags } from './dd';
import type { Via } from './verbs';
import { FENCE } from './verbs';

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
  ['09:41:04', 'ENGINE', 'Halcyon fee recompute −$27,360 filed — July NAV restated −0.8pp', 'a model read the note; the arithmetic was rails', 'HAL'],
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
  ['09:41:04', 'ENGINE', 'HAL', 'fee.accrual', '0', '-27360', 'navpack.v1'],
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
  silkRequested: boolean;
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
  approveQueue: (i: number, opts?: { note?: string; fieldsEdited?: string[] }) => void;
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
  addCandidate: (name: string, via: Via) => { ok: boolean; msg: string; dupId?: string };
  extractRun: () => { ok: boolean; msg: string; dupId?: string };
  triage: (id: string, s: ScreenerItem['status']) => void;
  ackHalcyon: () => void;
  openPack: (id: string | null) => void;
  setDdSel: (id: string) => void;
  fileVerdict: (fundId: string, note: string) => void;
  requestSilkPack: () => void;
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
  docs: DOCS_SEED.map((d) => ({ ...d, fields: d.fields.map((f) => ({ ...f })), editedFields: [] })),
  ledger: [{ rid: 'R-0001', title: 'August letters digest — 6 managers', wid: 'W-0001', by: 'Analyst', ts: '09-01 10:12' }],
  audit: seedAudit,
  history: seedHistory,
  verdictLog: [seedVerdicts.KES, seedVerdicts.MER],
  screener: SCREENER_SEED,
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
  silkRequested: false,
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
    set({ identity: id });
    get().pushAudit('YOU', `signed in as ${id.name} (${id.role})`);
  },
  logout: () => set({ identity: null }),
  setTab: (tab) =>
    set({
      tab,
      view: tab === 'construct' ? 'book' : tab === 'dd' ? 'fund' : 'today',
      ...(tab === 'dd' ? { fundId: get().ddSel } : {}),
    }),
  setView: (view) =>
    set({
      view,
      tab: view === 'book' ? 'construct' : view === 'fund' ? 'dd' : 'ops',
    }),
  openFund: (id) => set({ view: 'fund', fundId: id, fundTab: 'overview', ddSel: id, tab: 'dd' }),
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
      toast.error('BLOCKED — PM signature required', { description: 'apex book approve  # human-only lever' });
      return;
    }
    // Defense-in-depth: validate at commit, not just via disabled button.
    const violations = validateBook(staged, funds);
    if (violations.length > 0) {
      get().pushAudit('ENGINE', `BLOCKED commit — invariants failing`, violations.map((v) => v.msg).join(' | '), 'PORT');
      toast.error('BLOCKED — invariants failing at commit');
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
    toast.success(`committed — ticket #${ticket + 1} filed ${rid}`, { description: `apex book approve --ticket=${ticket + 1}` });
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
    nq[i] = { ...q, done: true, rid };
    const edited = opts?.fieldsEdited?.length ? `fields_edited ${opts.fieldsEdited.join(',')}` : '';
    const detail = [q.title, opts?.note, edited].filter(Boolean).join(' · ');
    set((s) => ({
      queue: nq,
      ledger: [{ rid, title: q.title, wid: q.wid, by: s.identity ? `${s.identity.name} (${s.identity.role})` : 'you', ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
    }));
    get().pushAudit('YOU', `APPROVED ${q.wid} — filed ${rid}`, detail, q.wid);
    get().emitCmd(`today approve ${q.wid}`, 'form');
    toast.success(`signed & filed ${rid}`, { description: `apex today approve ${q.wid}` });
  },

  rejectQueue: (i, reason, note = '') => {
    const q = get().queue[i];
    if (!q || q.done) return;
    const nq = get().queue.slice();
    nq[i] = { ...q, done: true, rejected: true };
    set({ queue: nq });
    get().pushAudit('YOU', `REJECTED ${q.wid} — ${reason}`, note, q.wid);
    get().emitCmd(`today reject ${q.wid}`, 'form');
    toast.message(`rejected ${q.wid}`);
  },

  approveDoc: (id) => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc || doc.status !== 'pending') return;
    const edited = doc.editedFields.length ? `fields_edited ${doc.editedFields.join(',')}` : '';
    get().pushAudit('AGENT', `drafted ${doc.id} — ${doc.title}`, `overall ${(doc.overall * 100).toFixed(0)}%`, doc.fundId ?? doc.id);
    set((s) => ({
      docs: s.docs.map((d) => (d.id === id ? { ...d, status: 'approved' as const } : d)),
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
    toast.success(`approved ${doc.title}`, { description: `apex docs approve ${id}` });
  },

  rejectDoc: (id, reason, note = '') => {
    const doc = get().docs.find((d) => d.id === id);
    if (!doc || doc.status !== 'pending') return;
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
    if (!doc || doc.status !== 'pending') return;
    const first = !doc.editedFields.includes(key);
    set((s) => ({
      docs: s.docs.map((d) => {
        if (d.id !== id) return d;
        return {
          ...d,
          editedFields: first ? [...d.editedFields, key] : d.editedFields,
          fields: d.fields.map((f) => (f.key === key ? { ...f, value, editedBy: 'YOU' } : f)),
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
    toast.success('FX break queued → Today', { description: 'apex ops queue-fx --break=unexpected_fx' });
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
    toast.success('escalated → Today', { description: 'apex ops escalate SAB --to=monitor' });
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
    const dup = get().screener.find((c) => norm(c.name) === norm(clean));
    if (dup) {
      get().pushAudit('ENGINE', `dedupe caught duplicate intake — "${clean}" ≈ ${dup.id} (${dup.name})`, '', dup.id);
      get().emitCmd(`screen add "${clean}"`, via);
      return { ok: false, msg: `dedupe caught — "${clean}" is already on the list as ${dup.id}`, dupId: dup.id };
    }
    const id = clean.slice(0, 3).toUpperCase() + Math.floor(Math.random() * 90 + 10);
    set((s) => ({
      screener: [
        { id, name: clean, ticker: id, score: null, tag: 'HUMAN INTAKE', reason: 'queued for the Monday 08:00 extract — 0 firm citations yet.', cite: `CIT-FRM-${id}`, status: 'NEW', origin: via === 'shell' ? 'SHELL' : 'FORM', addedAt: now().slice(0, 5) },
        ...s.screener,
      ],
    }));
    get().pushAudit('YOU', `screener intake — ${clean}`, `via ${via} · receipt filed · no score invented`, id);
    get().emitCmd(`screen add "${clean}"`, via);
    return { ok: true, msg: `intake ${clean} — receipt filed, no score invented` };
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
    set((s) => ({
      halAck: true,
      ledger: [{ rid, title: 'Halcyon restatement acknowledged — fee recompute −$27,360 filed', wid: 'W-OPS-HAL', by: who ? `${who.name} (${who.role})` : 'you', ts: '09-07 ' + now().slice(0, 5) }, ...s.ledger],
    }));
    get().pushAudit('YOU', 'acknowledged Halcyon restatement — fee recompute −$27,360 filed', `filed ${rid}`, 'HAL', {
      field: 'pack.ack',
      from: 'EXCEPTION',
      to: 'acknowledged',
      source: rid,
    });
    get().emitCmd('ops ack HAL.restatement', 'form');
    toast.success(`acknowledged — filed ${rid}`, { description: 'apex ops ack HAL.restatement' });
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
    toast.success(`verdict filed ${vid} — ${st} · report ${rid}`, { description: `apex dd verdict ${fundId} --state=${st}` });
  },

  requestSilkPack: () => {
    if (get().silkRequested) return;
    const wid = 'W-' + String(widN++).padStart(4, '0');
    set((s) => ({
      silkRequested: true,
      queue: [{ wid, origin: 'ONBOARDING · SILK RIVER', title: 'Silk River Frontier — request-pack chase (T+5)', draft: 'Administrator notified for 4 missing required sources (audit, NAVs, track, regulatory). Chase due 2026-09-12. Sign to file.', done: false }, ...s.queue],
    }));
    get().pushAudit('YOU', 'requested pack — Silk River Frontier (onboarding)', `chase ${wid} · 4 of 6 required sources missing`, SILK);
    get().emitCmd('dd request-pack SILK', 'form');
    toast.success('pack requested — chase queued → Today', { description: 'apex dd request-pack SILK' });
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
      const tag = via === 'engine' ? 'engine · scheduled' : s.identity ? `${s.identity.email.split('@')[0]} · ${s.identity.role} · via ${via}` : `anon · via ${via}`;
      return { shellLines: [...s.shellLines, `» ${cmd}    # ${tag}`] };
    }),
  closeAllOverlays: () =>
    set({ auditOpen: false, shellOpen: false, ddqOpen: false, paletteOpen: false, entityAudit: null, modulesOpen: false, policyOpen: false }),
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
