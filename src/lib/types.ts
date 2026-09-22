export type Role = 'PM' | 'Analyst';

export interface Identity {
  name: string;
  email: string;
  role: Role;
}

export interface Fund {
  id: string;
  name: string;
  mgr: string;
  strat: string;
  sleeve: string;
  wt: number;
  sla: number;
  asOf: string | null; // ISO date
  recd: string | null;
  ytd: number;
  pack: 'CLOSED' | 'EXCEPTION' | 'MISSING' | '—';
}

export interface ScreenerItem {
  metrics?: import('./screening').Metrics;
  metricSource?: string;
  metricAsOf?: string;
  id: string;
  name: string;
  ticker: string;
  score: number | null;
  tag: string;
  reason: string;
  cite: string;
  status: 'NEW' | 'PARKED' | 'IN DD';
  origin: 'EXTRACT' | 'FORM' | 'SHELL';
  addedAt?: string;
}

export interface QueueItem {
  wid: string;
  origin: string;
  title: string;
  draft: string;
  done: boolean;
  rid?: string;
  rejected?: boolean;
}

export interface LedgerEntry {
  rid: string;
  title: string;
  wid: string;
  by: string;
  ts: string;
}

export interface AuditEntry {
  t: string;
  actor: 'YOU' | 'AGENT' | 'ENGINE';
  action: string;
  detail: string;
  /** demo-grade checksum chain — djb2/6hex over (prev + entry) */
  h: string;
  /** entity tag — lets a row own its slice of the trail (fund id, candidate id, MONDAY, PORT…) */
  tag?: string;
}

export interface VerdictRecord {
  vid: string;
  fundId: string;
  state: 'CURRENT' | 'ATTENTION' | 'OVERDUE';
  flags: string[];
  note: string;
  signer: string;
  role: Role;
  ts: string;
}

/** Field-level entity history — checksum piggybacks the audit chain hash when tagged. */
export interface EntityHistory {
  t: string;
  actor: 'YOU' | 'AGENT' | 'ENGINE';
  entityId: string;
  field: string;
  from: string;
  to: string;
  source?: string;
  h: string;
}

export type Book = Record<string, number>;

export type AppView = 'today' | 'book' | 'fund' | 'team' | 'screening' | 'library' | 'fees' | 'monitoring';
export type FundTab = 'overview' | 'exposure' | 'documents' | 'history' | 'verdicts' | 'work';
export type IntakePolicy = 'AUTO' | 'MANUAL';

export type DocKind = 'pdf' | 'email';
export type DocStatus = 'pending' | 'approved' | 'rejected';

export interface DocField {
  key: string;
  label: string;
  value: string | number;
  conf: number;
  required: boolean;
  snippet: string;
  editedBy?: string;
}

export interface DocRecord {
  access?: import('./records').Access;
  id: string;
  kind: DocKind;
  fundId: string | null;
  title: string;
  from: string;
  arrived: string;
  overall: number;
  fields: DocField[];
  reasoning: string;
  status: DocStatus;
  rejectReason?: string;
  rejectNote?: string;
  editedFields: string[];
}

export const REJECT_REASONS = [
  'Wrong document',
  'Wrong entity',
  'Figures do not match source',
  'Needs different process',
  'Other',
] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];
