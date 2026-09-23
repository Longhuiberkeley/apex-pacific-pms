// The command surface — every lever in the UI is a verb here, tagged with the surface
// that can actually run it: 'cli' (external agent), 'shell' (in-app demo trigger),
// 'form' (human UI lever — echoed here as a receipt, never runnable by agents).
// Same rails for humans (via form) and agents (via shell/cli); gated verbs refuse agents.

export type Via = 'form' | 'shell' | 'engine' | 'cli';

export interface Verb {
  cmd: string;
  desc: string;
  via: 'cli' | 'shell' | 'form';
  gate?: string;
}

export const FENCE =
  'agents: read records · submit research · stage proposals | humans: review · approve';

const FORM_GATE = 'HUMAN ONLY (UI lever — echoed here as a receipt)';

export const VERBS: Verb[] = [
  { cmd: 'help', desc: 'this list', via: 'cli' },
  { cmd: 'whoami', desc: 'signed-in human, role, fence and capabilities', via: 'cli' },
  { cmd: 'history', desc: 'every verb run this session — forms included', via: 'cli' },
  { cmd: 'today queue', desc: "today's review queue, pending documents and triggers", via: 'cli' },
  { cmd: 'queue list', desc: 'alias for today queue', via: 'cli' },
  { cmd: 'tasks list', desc: 'team assignments, owners and status', via: 'cli' },
  { cmd: 'tasks get <ID>', desc: 'assignment brief, evidence and submissions', via: 'cli' },
  { cmd: 'tasks submit A-101 --example', desc: 'submit the prepared research example to human review', via: 'cli' },
  { cmd: 'funds add --json=candidate.json', desc: 'external CLI: add a candidate and research assignment', via: 'cli' },
  { cmd: 'screening get', desc: 'applied criteria and evaluated candidates (with evidence)', via: 'cli' },
  { cmd: 'screening list', desc: 'the watchlist: id, name, status, score and evidence', via: 'cli' },
  { cmd: 'screen list', desc: 'alias for screening list', via: 'cli' },
  { cmd: 'records list|get <ID>', desc: 'approved structured data for your role', via: 'cli' },
  { cmd: 'funds list', desc: 'portfolio and pipeline records', via: 'cli' },
  { cmd: 'funds get <ID>', desc: 'fund with documents, assignments and history', via: 'cli' },
  { cmd: 'docs list', desc: 'structured document records', via: 'cli' },
  { cmd: 'docs get <ID>', desc: 'extracted fields and review status', via: 'cli' },
  { cmd: 'fees get <FUND>', desc: 'fee worksheet inputs, computed comparison and saved reviews', via: 'cli' },
  { cmd: 'monitoring get [FUND]', desc: 'NAV freshness checks and investigations', via: 'cli' },
  { cmd: 'dd get <FUND>', desc: 'diligence state, flags, checks and verdict', via: 'cli' },
  { cmd: 'book get', desc: 'committed book, proposal and rule results', via: 'cli' },
  { cmd: 'book propose', desc: 'agent stages a book JSON proposal — never commits', via: 'cli' },
  { cmd: 'book paste --raw', desc: 'stage the seeded raw agent book (Σ 101.3); book propose --raw is an alias', via: 'cli' },
  { cmd: 'audit tail <n>', desc: 'read the trail (checksum-chained)', via: 'cli' },
  { cmd: 'screen extract --now', desc: 'semantic extract (Type 1 · cited · deduped) (in-app demo trigger)', via: 'shell' },
  { cmd: 'screen add "<name>"', desc: 'intake a name — no score invented (in-app demo trigger)', via: 'shell' },
  { cmd: 'agent demo', desc: 'the raw agent vs the rails, twice (in-app demo trigger)', via: 'shell' },
];

// Human UI levers — the code emits these receipts when a human pulls the lever (store.ts,
// Portfolio.tsx); they are enumerated from what is actually emitted, not aspirational.
export const FORM_RECEIPTS: Verb[] = [
  { cmd: 'ops parse monday.xls', desc: 'parse the broker file once → record', via: 'form', gate: FORM_GATE },
  { cmd: 'ops reconcile monday.xls', desc: 'ledger vs statement — math is code', via: 'form', gate: FORM_GATE },
  { cmd: 'ops ack HAL.restatement', desc: 'acknowledge the Halcyon fee recompute', via: 'form', gate: FORM_GATE },
  { cmd: 'ops queue-fx', desc: 'queue reconciliation breaks to Today', via: 'form', gate: FORM_GATE },
  { cmd: 'ops escalate', desc: 'escalate the missing Sable pack to Today', via: 'form', gate: FORM_GATE },
  { cmd: 'ops open-pack', desc: 'open a reporting pack', via: 'form', gate: FORM_GATE },
  { cmd: 'monitor assess', desc: 'assess a monitoring trigger into a workup', via: 'form', gate: FORM_GATE },
  { cmd: 'today approve', desc: 'sign a Today queue item to the ledger', via: 'form', gate: FORM_GATE },
  { cmd: 'today reject', desc: 'return a Today queue item without approval', via: 'form', gate: FORM_GATE },
  { cmd: 'docs approve', desc: 'approve and file a document record', via: 'form', gate: FORM_GATE },
  { cmd: 'docs reject', desc: 'reject a document with a reason', via: 'form', gate: FORM_GATE },
  { cmd: 'docs edit', desc: 'correct an extracted field before approval', via: 'form', gate: FORM_GATE },
  { cmd: 'tasks draft', desc: 'load the prepared research draft', via: 'form', gate: FORM_GATE },
  { cmd: 'tasks update', desc: 'record a task activity note', via: 'form', gate: FORM_GATE },
  { cmd: 'tasks review', desc: 'accept or request changes on a submission', via: 'form', gate: FORM_GATE },
  { cmd: 'book set', desc: 'edit an allocation cell', via: 'form', gate: FORM_GATE },
  { cmd: 'book stage --from=edit', desc: 'stage the proposal from a cell edit', via: 'form', gate: FORM_GATE },
  { cmd: 'book approve', desc: 'the IC lever — commit the target book', via: 'form', gate: FORM_GATE },
  { cmd: 'book discard', desc: 'discard the staged proposal', via: 'form', gate: FORM_GATE },
  { cmd: 'policy intake', desc: 'switch intake policy (AUTO/MANUAL)', via: 'form', gate: FORM_GATE },
  { cmd: 'screen triage', desc: 'route a candidate (park / send to diligence)', via: 'form', gate: FORM_GATE },
  { cmd: 'dd verdict', desc: 'record a diligence verdict', via: 'form', gate: FORM_GATE },
  { cmd: 'fee approve', desc: 'approve a fee reconciliation (PM)', via: 'form', gate: FORM_GATE },
  { cmd: 'criteria apply', desc: 'apply edited screening criteria', via: 'form', gate: FORM_GATE },
];

// The 'resource action' two-token prefix of every form receipt — the single source the
// agent gate consumes, so a future receipt can never again fall through ungated.
export const FORM_GATED: string[] = FORM_RECEIPTS.map((v) => v.cmd.split(/\s+/).slice(0, 2).join(' '));

export const helpGroups = (): { title: string; verbs: Verb[] }[] => [
  { title: 'CLI · external agent', verbs: VERBS.filter((v) => v.via === 'cli') },
  { title: 'In-app demo triggers', verbs: VERBS.filter((v) => v.via === 'shell') },
  { title: 'Human levers (UI; echoed as receipts; agents get BLOCKED + audit)', verbs: FORM_RECEIPTS },
];

export const helpLines = (): string[] => helpGroups().flatMap((g) => [g.title, ...g.verbs.map((v) => `  ${v.cmd.padEnd(32)} ${v.desc}${v.gate ? '  ⚠ ' + v.gate : ''}`)]);
