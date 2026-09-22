import { z } from 'zod';

export type WorkMode = 'deterministic' | 'type1' | 'type2';
export type WorkStatus = 'Assigned' | 'In progress' | 'Needs review' | 'Waiting externally' | 'Done';
export const WORK_STAGES: WorkStatus[] = ['Assigned', 'In progress', 'Needs review', 'Waiting externally', 'Done'];
export const PEOPLE = [
  { name: 'A. Chan', initials: 'AC', role: 'Portfolio manager', focus: 'Investment decisions & review' },
  { name: 'L. Wu', initials: 'LW', role: 'Research analyst', focus: 'Manager research & diligence' },
  { name: 'M. Lee', initials: 'ML', role: 'Operations', focus: 'Documents, cash & administrator follow-ups' },
];
export const MODE = {
  deterministic: { label: 'Automatic checks', short: 'Automatic', detail: 'Fixed rules, arithmetic and workflow transitions. No model needed.' },
  type1: { label: 'AI document extraction', short: 'AI extraction', detail: 'The workflow invokes AI to read a document. Structured fields enter software checks and human review.' },
  type2: { label: 'Agent research', short: 'Agent research', detail: 'An analyst or external agent chooses how to research. It submits a structured deliverable; a person decides what happens next.' },
};

export const SubmissionSchema = z.object({
  recommendation: z.string().trim().min(8, 'Give a recommendation (at least 8 characters).').max(2000),
  rationale: z.string().trim().min(20, 'Explain the rationale (at least 20 characters).').max(10000),
  risks: z.string().trim().min(10, 'Document the key risks.').max(6000),
  conditions: z.string().trim().min(5, 'State the conditions, or explicitly say none.').max(6000),
  sources: z.array(z.string().trim().min(1)).min(1, 'Cite at least one source ID.').max(20),
}).strict();
export type Submission = z.infer<typeof SubmissionSchema>;
export interface WorkSource { access?: import('./records').Access; docId?: string; id: string; title: string; excerpt: string }
export interface WorkRevision {
  version: number; content: Submission; by: string; via: 'form' | 'shell' | 'cli'; at: string;
  decision?: 'accepted' | 'changes requested'; reviewer?: string; reviewNote?: string; reviewedAt?: string;
}
export interface Assignment {
  access?: import('./records').Access;
  id: string; fundId: string; title: string; owner: string; reviewer: string; due: string;
  mode: WorkMode; status: WorkStatus; brief: string; deliverables: string[]; sources: WorkSource[];
  next: string; blocker?: string; draft?: Submission; revisions: WorkRevision[];
  parentId?: string; docId?: string; destination?: 'book';
  activity?: { at: string; by: string; note: string; status: WorkStatus }[];
}
export interface WorkResult { ok: boolean; message: string; nextId?: string }

/** The fund page points to the same assignment as Team, rather than creating another request. */
export function silkNextAction(assignments: Assignment[]) {
  const research = assignments.find((a) => a.id === 'A-101');
  const request = assignments.find((a) => a.id === 'A-101-NEXT');
  if (request) {
    const waiting = request.status === 'Waiting externally';
    const done = request.status === 'Done';
    return {
      id: request.id, owner: request.owner,
      label: waiting ? 'View outstanding documents' : done ? 'View completed document task' : 'Open document-request task',
      status: waiting ? 'Waiting for a reply' : done ? 'Document task completed' : 'Document request to prepare',
      detail: waiting ? 'The team recorded a request as sent. Follow up on the reply in the same task.' : done ? 'The task is recorded as complete. Diligence and any investment decision still need separate review.' : 'Screening was accepted. Operations needs to request the listed documents; creating this task has not sent an email.',
    };
  }
  return {
    id: research?.id ?? 'A-101', owner: research?.status === 'Needs review' ? research.reviewer : research?.owner ?? 'L. Wu',
    label: research?.status === 'Needs review' ? 'Review screening submission' : 'Open screening assignment',
    status: research?.status === 'Needs review' ? 'Screening ready for review' : 'Screening in progress',
    detail: 'Review the research before beginning diligence. Accepting the submission will create a document-request task for Operations.',
  };
}
export const EMPTY_SUBMISSION: Submission = { recommendation: '', rationale: '', risks: '', conditions: '', sources: [] };

export function validateSubmission(value: unknown, assignment: Assignment): { ok: true; content: Submission } | { ok: false; message: string } {
  const parsed = SubmissionSchema.safeParse(value);
  if (!parsed.success) return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  const unknown = parsed.data.sources.filter((id) => !assignment.sources.some((s) => s.id === id));
  if (unknown.length) return { ok: false, message: `Unknown source IDs: ${unknown.join(', ')}. Read the assignment sources first.` };
  return { ok: true, content: parsed.data };
}

export const SILK_DRAFT: Submission = {
  recommendation: 'Proceed to operational due diligence; no allocation decision yet.',
  rationale: 'Silk River could diversify our existing EM equity managers through a frontier-market focus. The manager describes a concentrated, fundamental strategy. The supplied overview supports further investigation, but the performance series is manager-reported and has not been independently reconciled.',
  risks: 'Frontier-market liquidity may conflict with quarterly redemptions. Country concentration and independently verified performance remain open questions.',
  conditions: 'Obtain administrator confirmation of redemption terms and the audited track record before an IC recommendation.',
  sources: ['SIL-OVERVIEW', 'SIL-TERMS'],
};

export const ASSIGNMENTS_SEED: Assignment[] = [
  {
    id: 'A-101', fundId: 'SIL', title: 'Screen Silk River for the EM allocation', owner: 'L. Wu', reviewer: 'A. Chan', due: '2026-09-11', mode: 'type2', status: 'In progress',
    brief: 'Assess whether Silk River merits full diligence. Compare the proposed strategy with our existing EM exposure. Your submission is a research recommendation, not permission to invest.',
    deliverables: ['Recommendation & investment rationale', 'Key risks and conditions to carry forward', 'References to supplied evidence'],
    sources: [
      { id: 'SIL-OVERVIEW', title: 'Manager overview · Aug 2026', excerpt: 'Fictional source: Silk River runs a concentrated frontier-market equity strategy, with 25–35 positions. Its supplied performance series is manager-reported. Independent audit and administrator NAV history are not yet on file.' },
      { id: 'SIL-TERMS', title: 'Preliminary terms · §4 liquidity', excerpt: 'Fictional source: quarterly redemptions with 90 calendar days notice, subject to gates and side-pocket provisions. Terms in the marketing pack require confirmation against signed fund documents and administrator records.' },
    ],
    next: 'PM acceptance opens diligence and assigns a document request to Operations.', revisions: [],
  },
  {
    id: 'A-102', fundId: 'KUR', title: 'Review the Japan market-neutral mandate', owner: 'L. Wu', reviewer: 'A. Chan', due: '2026-09-07', mode: 'type2', status: 'Needs review',
    brief: 'Review whether reported beta is consistent with the mandate and propose the next monitoring action.',
    deliverables: ['Recommendation', 'Risk assessment', 'Evidence and follow-up'],
    sources: [{ id: 'KUR-LETTER', title: 'August manager letter · risk section', excerpt: 'Fictional source: the August letter reports beta of 0.62 during the month. The manager attributes this to temporary exposure around a rebalance. A daily exposure series has been requested.' }],
    next: 'Acceptance creates a follow-up assignment; request changes returns it to the analyst.',
    revisions: [{ version: 1, by: 'L. Wu', via: 'form', at: '09-07 09:12', content: { recommendation: 'Retain on watch and request the daily exposure series.', rationale: 'The August letter reports beta of 0.62. This warrants a mandate discussion before concluding that the change is temporary. Existing holdings remain unchanged pending review.', risks: 'A persistent directional exposure would weaken the intended portfolio diversification.', conditions: 'Confirm the duration of the beta spike with the manager.', sources: ['KUR-LETTER'] } }],
  },
  {
    id: 'A-103', fundId: 'HAL', title: 'Review the NAV-pack extraction', owner: 'M. Lee', reviewer: 'A. Chan', due: '2026-09-07', mode: 'type1', status: 'In progress', docId: 'hal-nav-08',
    brief: 'The intake workflow has prepared fields from the NAV pack. Inspect the original and the extracted values before filing the record.', deliverables: ['Verified document fields', 'Human approval or rejection'], sources: [], revisions: [], next: 'Approve in document review to file the record and complete this assignment.',
  },
  {
    id: 'A-104', fundId: 'SAB', title: 'Chase the missing August NAV pack', owner: 'M. Lee', reviewer: 'A. Chan', due: '2026-09-04', mode: 'deterministic', status: 'Waiting externally',
    brief: 'The SLA check identified the missing August pack. Operations is waiting for the administrator; the stale-NAV rule remains in force.', deliverables: ['Administrator reply', 'Validated NAV pack'], sources: [], revisions: [], blocker: 'Waiting for administrator · last chased 4 Sep', next: 'Receive and validate the pack, then reassess the stale-NAV exception.',
  },
  {
    id: 'A-105', fundId: 'SAB', title: 'Prepare a compliant allocation proposal', owner: 'A. Chan', reviewer: 'A. Chan', due: '2026-09-07', mode: 'deterministic', status: 'Assigned', destination: 'book',
    brief: 'Sable is above the stale-NAV cap. Stage an exposure of $7,125,000 (5%) in Book. Code calculates residual cash and checks Rules A–E before the PM signature.', deliverables: ['Validated proposed book', 'PM decision'], sources: [], revisions: [], next: 'A signed book creates an Operations instruction-review assignment.',
  },
  {
    id: 'A-106', fundId: 'MER', title: 'File the monthly manager contact note', owner: 'L. Wu', reviewer: 'A. Chan', due: '2026-09-04', mode: 'type2', status: 'Done',
    brief: 'Capture the discussion and its monitoring implications in the shared fund record.', deliverables: ['Contact note and sources'],
    sources: [{ id: 'MER-CALL', title: 'Manager call · 4 Sep', excerpt: 'Fictional source: manager confirmed no change to the investment mandate. The team agreed to revisit positioning at the next monthly meeting.' }],
    next: 'Included in the next monthly review.',
    revisions: [{ version: 1, by: 'L. Wu', via: 'form', at: '09-04 15:20', decision: 'accepted', reviewer: 'A. Chan', reviewedAt: '09-04 16:05', reviewNote: 'Filed for the next monthly review.', content: { recommendation: 'Maintain the current monitoring cadence.', rationale: 'The manager call confirmed that the investment mandate is unchanged. Follow-up questions are recorded against the next monthly review.', risks: 'Positioning can change between monthly reporting dates.', conditions: 'Revisit positioning at the next monthly meeting.', sources: ['MER-CALL'] } }],
  },
];
