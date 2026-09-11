// The command surface — every lever in the UI is a verb here.
// Same rails for humans (via form) and agents (via shell); gated verbs refuse agents.

export type Via = 'form' | 'shell' | 'engine';

export interface Verb {
  cmd: string;
  desc: string;
  gate?: 'HUMAN ONLY';
}

export const FENCE =
  'fence: agents may add intake, extract, and stage proposals. never triage / weights / packs / verdicts / approvals.';

export const VERBS: Verb[] = [
  { cmd: 'help', desc: 'this list' },
  { cmd: 'whoami', desc: 'who the shell is acting as' },
  { cmd: 'history', desc: 'every verb run this session — forms included' },
  { cmd: 'screen list', desc: 'dump the watchlist' },
  { cmd: 'screen extract --now', desc: 'semantic extract (Type 1 · cited · deduped)' },
  { cmd: 'screen add "<name>"', desc: 'intake a name — no score invented' },
  { cmd: 'screen triage <ID> park|dd', desc: 'route a candidate', gate: 'HUMAN ONLY' },
  { cmd: 'book propose', desc: 'agent stages a proposal — never commits' },
  { cmd: 'book paste --raw', desc: 'stage the seeded raw agent book (Σ 101.3)' },
  { cmd: 'book approve', desc: 'the IC lever', gate: 'HUMAN ONLY' },
  { cmd: 'ops parse monday.xls', desc: 'parse the broker file once → record' },
  { cmd: 'ops reconcile monday.xls', desc: 'ledger vs statement — math is code' },
  { cmd: 'ops ack HAL.restatement', desc: 'acknowledge the Halcyon fee recompute' },
  { cmd: 'dd verdict <FUND>', desc: 'record a diligence verdict', gate: 'HUMAN ONLY' },
  { cmd: 'dd request-pack SILK', desc: 'chase the onboarding pack' },
  { cmd: 'audit tail <n>', desc: 'read the trail (checksum-chained)' },
  { cmd: 'agent demo', desc: 'the raw agent vs the rails, twice' },
];
