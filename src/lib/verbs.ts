// The command surface — every lever in the UI is a verb here.
// Same rails for humans (via form) and agents (via shell); gated verbs refuse agents.

export type Via = 'form' | 'shell' | 'engine' | 'cli';

export interface Verb {
  cmd: string;
  desc: string;
  gate?: 'HUMAN ONLY';
}

export const FENCE =
  'agents: read records · submit research · stage proposals | humans: review · approve';

export const VERBS: Verb[] = [
  { cmd: 'help', desc: 'this list' },
  { cmd: 'whoami', desc: 'who the shell is acting as' },
  { cmd: 'history', desc: 'every verb run this session — forms included' },
  { cmd: 'tasks list', desc: 'team assignments, owners and status' },
  { cmd: 'tasks get <ID>', desc: 'assignment brief, evidence and submissions' },
  { cmd: 'tasks submit A-101 --example', desc: 'submit the prepared research example to human review' },
  { cmd: 'tasks review <ID>', desc: 'accept or request changes', gate: 'HUMAN ONLY' },
  { cmd: 'funds add --json=candidate.json', desc: 'external CLI: add a candidate and research assignment' },
  { cmd: 'screening get', desc: 'applied criteria and evaluated candidates' },
  { cmd: 'records list|get <ID>', desc: 'approved structured data for your role' },
  { cmd: 'funds list', desc: 'portfolio and pipeline records' },
  { cmd: 'funds get <ID>', desc: 'fund with documents, assignments and history' },
  { cmd: 'docs list', desc: 'structured document records' },
  { cmd: 'docs get <ID>', desc: 'extracted fields and review status' },
  { cmd: 'book get', desc: 'committed book, proposal and rule results' },
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
  { cmd: 'audit tail <n>', desc: 'read the trail (checksum-chained)' },
  { cmd: 'agent demo', desc: 'the raw agent vs the rails, twice' },
];
