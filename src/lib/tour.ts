import type { AppView, DocRecord, Fund, FundTab, Identity, ScreenerItem } from './types';
import { DEFAULT_CRITERIA, type Criterion } from './screening';
import type { Assignment } from './work';

/** Chapter CONTENT only — never imports './store' (the store↔tour cycle is structural). Tour.tsx passes useStore.getState() as nav and snap. */
export type TourNav = { setView: (v: AppView) => void; setTodayMode: (mode: 'mine' | 'team' | 'intake') => void; setFundsFilter: (f: 'Candidates' | 'Invested' | 'All') => void; openFund: (id: string) => void; setFundTab: (t: FundTab) => void; setOperationsSection: (section: 'reporting' | 'fees') => void; openAssignment: (id: string | null) => void; setShell: (b: boolean) => void };
export type TourSnap = { identity: Identity | null; assignments: Assignment[]; docs: DocRecord[]; criteria: Criterion[]; records: { docId: string }[]; feeReviews: { id: string }[]; ticket: number; gateOpen: boolean; screener: ScreenerItem[]; funds: Fund[] };
export type TourStep = { id: string; title: string; body: (snap: TourSnap) => string; target?: string; tech?: string; enter?: (nav: TourNav, snap: TourSnap) => void; done?: (snap: TourSnap) => boolean };
export type TourChapter = { id: string; title: string; promise: string; timebox: string; steps: TourStep[] };

const silk = (snap: TourSnap) => snap.assignments.find((a) => a.id === 'A-101');
const invoiceDone = (snap: TourSnap) => snap.docs.some((d) => d.id === 'inv-pfs-q3' && d.status!=='pending');
const deskEnter = (nav: TourNav) => nav.setTodayMode('mine');
const screeningEnter = (nav: TourNav) => { nav.setView('funds'); nav.setFundsFilter('Candidates'); };
const silkEnter = (nav: TourNav) => { nav.setShell(false); nav.openAssignment('A-101'); };

export const CHAPTERS: TourChapter[] = [
  {
    id: 'desk', title: 'The daily desk: documents on Today', promise: 'Every decision due today, in one queue.', timebox: '~60s',
    steps: [
      { id: 'desk.queue', title: 'Today is one queue', target: 'today.queue', enter: deskEnter,
        body: () => 'Documents and tasks that need a decision all land in this one queue. Each row names the source and the fund it belongs to. The chip above the queue switches Quick review (clean documents can be approved in one click) and Full review (every document gets the full pane).' },
      { id: 'desk.open', title: 'Open a document: original → extracted draft → your review', target: 'doc.review', enter: deskEnter, done: invoiceDone,
        body: (snap) => !snap.docs.some((d) => d.status === 'pending')
          ? 'Everything here is already reviewed — open Document intake to compare originals with saved records.'
          : 'Click the Pacific Fund Services invoice ($48,750). The left pane shows the original message exactly as it arrived; the right shows the values the AI extracted. The original file is never changed by your review.' },
      { id: 'desk.approve', title: 'Correct a field, then approve', target: 'doc.review', enter: deskEnter, done: invoiceDone,
        body: (snap) => invoiceDone(snap)
          ? 'Already reviewed — the saved record keeps your correction and the original keeps its $48,750. Move on, or open Document intake to re-read both.'
          : 'The expense classification was a guess — the review marks the weak field. Correct it, then press Approve & save record. Your correction is stamped onto the saved record and named in the activity trail; the original PDF keeps its $48,750.' },
    ],
  },
  {
    id: 'screening', title: 'Screening: thresholds decide who gets an analyst', promise: 'How the shortlist is judged — and where judgment still counts.', timebox: '~45s',
    steps: [
      { id: 'screening.table', title: 'The shortlist and its evidence', target: 'screening.table', enter: screeningEnter,
        body: () => 'Every candidate is checked against the live thresholds. Evidence must carry a source and a date: a missing figure reads "Needs evidence", never a pass. No score is invented for a name without evidence.' },
      { id: 'screening.criteria', title: 'Edit a threshold, then Apply settings', target: 'screening.criteria', enter: screeningEnter,
        done: (snap) => JSON.stringify(snap.criteria)!==JSON.stringify(DEFAULT_CRITERIA),
        body: (snap) => (JSON.stringify(snap.criteria)!==JSON.stringify(DEFAULT_CRITERIA)
          ? 'You have already adjusted the criteria — watch the counts above move as you change more of them. '
          : 'Open Editable criteria, change one threshold, then press Apply settings. The counts above move at once. ') + 'Applying is recorded with your name — the thresholds are a human decision, not an agent setting.' },
      { id: 'screening.judgment', title: 'Judgment still needed: open the research assignment', enter: screeningEnter,
        body: () => 'Numbers only get a candidate so far. Select Silk River Frontier and press Open research assignment — the work goes to an analyst, whose research then needs a portfolio manager decision. Chapter 3 follows exactly that path.' },
    ],
  },
  {
    id: 'silk', title: 'Due diligence: Silk River, analyst → PM', promise: 'One research assignment, two signatures, a real handoff.', timebox: '~90s',
    steps: [
      { id: 'silk.brief', title: 'The brief: evidence, deliverables, what happens next', target: 'assignment.submit', enter: silkEnter, tech: 'Assignment A-101 · carry-forward A-101-NEXT',
        body: () => 'The Silk River screening assignment carries its brief, the evidence excerpts it may cite, and the required deliverables. This is research with named sources — not an investment decision.' },
      { id: 'silk.submit', title: 'As the analyst: prepare, judge, submit', target: 'role.switch', enter: silkEnter, tech: 'Assignment A-101 · carry-forward A-101-NEXT',
        done: (snap) => silk(snap)?.status==='Needs review',
        body: (snap) => {
          const a = silk(snap);
          if (a?.status==='Needs review') return 'This submission is already with the reviewer — continue to the portfolio manager step.';
          if (a?.status==='Done') return 'This review is already accepted — continue to the handoff step.';
          return (snap.identity?.role!=='Analyst' ? 'Switch to L. Wu · Analyst with the workspace selector at the top-left. ' : '') + 'Role changes are real sign-ins, so the assignment sheet closes on purpose — press Next and the tour reopens it. Watch restricted notes appear and disappear as you switch: that is role-level viewing. Then press Load prepared AI research, add your judgment to the draft, and Submit for review. The platform checks the structure and the source references before routing it to A. Chan.';
        } },
      { id: 'silk.accept', title: 'As the PM: read it, write the note, accept', target: 'role.switch', enter: silkEnter, tech: 'Assignment A-101 · carry-forward A-101-NEXT',
        done: (snap) => silk(snap)?.status==='Done',
        body: (snap) => {
          const a = silk(snap);
          if (a?.status==='Done') return 'Already accepted — continue to the handoff step.';
          if (!a || a.status!=='Needs review') return 'The analyst has not submitted yet — finish the analyst step first, then come back.';
          return (snap.identity?.role!=='PM' ? 'Switch to A. Chan · PM with the workspace selector — review is assigned to the named portfolio manager. ' : '') + 'Read the submission, write the review note, then press Accept → begin diligence. That decision is yours: the tour never clicks it for you, and agents are blocked from it.';
        } },
      { id: 'silk.handoff', title: 'The handoff: conditions travel to Operations', tech: 'Assignment A-101 · carry-forward A-101-NEXT',
        enter: (nav, snap) => { nav.setShell(false); const nxt = snap.assignments.find((x) => x.parentId==='A-101'); if (nxt) nav.openAssignment(nxt.id); else nav.openAssignment('A-101'); },
        body: (snap) => snap.assignments.some((x) => x.parentId==='A-101')
          ? 'Acceptance opened the follow-up automatically: Operations must request the audited track record, the administrator-confirmed redemption terms and the independent NAV history. Silk River moved to due diligence, and the conditions you read travel with the task.'
          : 'Accept the submission in the previous step and the platform hands its conditions to Operations as a follow-up task — Silk River then moves to due diligence and the conditions travel with the work.' },
    ],
  },
  {
    id: 'intake', title: 'Add a fund candidate', promise: 'Intake a name in the form — receipt filed, no score invented.', timebox: '~30s',
    steps: [
      { id: 'intake.add', title: 'Intake a name — no score invented', target: 'intake.form', enter: screeningEnter,
        done: (snap) => snap.screener.some((c) => c.tag==='HUMAN INTAKE'),
        body: (snap) => snap.screener.some((c) => c.tag==='HUMAN INTAKE')
          ? 'A name you added is already on the list — receipt filed, no score invented. Add another one if you like.'
          : 'Type a manager name (try Harbourline Quant Strategies) and press Add candidate. The row lands with no score and no fabricated metrics — evidence arrives later, with a source and a date.' },
      { id: 'intake.dedupe', title: 'Dedupe is deterministic — add it again', target: 'intake.form', enter: screeningEnter,
        body: () => 'Add the same name again. The intake log catches the duplicate and points at the existing row instead of creating a second one. Moving a candidate on stays a human decision: Park keeps it on hold, Send to diligence starts real work.' },
    ],
  },
  {
    id: 'book', title: 'Portfolio and fees', promise: 'Stage a proposal, meet the limits, sign the fee comparison.', timebox: '~90s',
    steps: [
      { id: 'book.table', title: 'Allocation dollars, and the five limits that judge the book', target: 'book.table', enter: (nav) => nav.setView('book'),
        body: () => 'Every row is editable dollars with the percentage beside it. Cash absorbs the residual, so the total always reads 100.0%. The strip below judges the book against five limits: single fund, equity strategy, minimum cash, total allocation, and NAV freshness.' },
      { id: 'book.stage', title: 'Edit one dollar cell — the proposal stages itself', target: 'book.approve', enter: (nav) => nav.setView('book'),
        done: (snap) => snap.gateOpen,
        body: (snap) => snap.gateOpen
          ? 'A proposal is already staged: the gate is open and the buttons already read Approve allocation and Discard.'
          : 'Before the first edit the row offers Prepare proposal. Editing a dollar cell stages the proposal at once: the gate opens, the change column shows your delta, and the buttons become Approve allocation and Discard. Change one dollar cell now and read that row — nothing commits until a portfolio manager signs.' },
      { id: 'book.limits', title: 'The limits can refuse: an outdated NAV caps allocation', target: 'book.approve', enter: (nav) => nav.setView('book'),
        done: (snap) => snap.ticket>0,
        body: (snap) => snap.ticket>0
          ? 'Already signed — the allocation is committed and Operations holds the instruction review. Skipping onward keeps the book exactly as it is now.'
          : 'One limit fails at the start: Sable Creek’s NAV is 38 days old, and while it stays stale its allocation is capped at 5%. Reduce Sable Creek to 5%, watch the limit strip clear, then press Approve allocation. Skipping this step keeps the book as-is.' },
      { id: 'book.fee', title: 'Management fee: reviewed sources → calculation → human sign-off', target: 'fees.worksheet',
        enter: (nav, snap) => { nav.openFund('HAL'); nav.setFundTab(snap.records.some((r) => r.docId==='hal-nav-08') ? 'operations' : 'documents'); nav.setOperationsSection('fees'); },
        done: (snap) => snap.feeReviews.length>0,
        body: (snap) => {
          if (!snap.records.some((r) => r.docId==='hal-nav-08')) return 'The fee worksheet waits on the August NAV correction — approve that document in chapter 1 first. Showing the fund documents for now.';
          if (snap.identity?.role!=='PM') return 'Switch to PM: the fee terms are restricted, so the worksheet stays hidden from analysts.';
          if (snap.feeReviews.length>0) return 'Already reconciled — open the saved review instead of signing a second time.';
          return 'The worksheet compares the August invoice with the terms on file. The fee discrepancy the NAV pack flagged — −$5,130, 0.15% charged against 0.12% in the terms — is the story behind it, and any gap the worksheet shows needs your explanation note before Approve reconciliation enables. The signature is yours; nothing is paid, the explained comparison is filed.';
        } },
    ],
  },
];
