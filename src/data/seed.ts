import type { DocRecord, Fund, ScreenerItem } from '../lib/types';

// Clock pinned like v1 — boot parity depends on it.
export const DEMO_NOW = new Date(2026, 8, 7); // 2026-09-07
export const NAV_USD = 142_500_000;

export function daysSince(iso: string | null): number {
  if (!iso) return 999;
  const d = new Date(iso + 'T00:00:00');
  return Math.round((DEMO_NOW.getTime() - d.getTime()) / 86400000);
}

export const FUNDS_SEED: Fund[] = [
  { id: 'NOR', name: 'Northgate Systematic Credit', mgr: 'Northgate CM', strat: 'Systematic credit', sleeve: 'Credit', wt: 22.5, sla: 10, asOf: '2026-08-31', recd: '2026-09-03', ytd: 7.9, pack: 'CLOSED' },
  { id: 'KES', name: 'Kestrel APAC Equity L/S', mgr: 'Kestrel Partners', strat: 'APAC equity hedge', sleeve: 'Equity Hedge', wt: 18.0, sla: 15, asOf: '2026-08-31', recd: '2026-09-04', ytd: 12.6, pack: 'CLOSED' },
  { id: 'MER', name: 'Meridian Global Macro', mgr: 'Meridian AM', strat: 'Discretionary macro', sleeve: 'Macro', wt: 15.5, sla: 12, asOf: '2026-08-31', recd: '2026-09-03', ytd: 9.4, pack: 'CLOSED' },
  { id: 'HAL', name: 'Halcyon Event-Driven Credit', mgr: 'Halcyon Capital', strat: 'Event-driven credit', sleeve: 'Credit', wt: 12.0, sla: 15, asOf: '2026-08-31', recd: '2026-09-05', ytd: 2.1, pack: 'EXCEPTION' },
  { id: 'SAB', name: 'Sable Creek EM Equities', mgr: 'Sable Creek AM', strat: 'EM equities L/S', sleeve: 'Equity Hedge', wt: 11.0, sla: 15, asOf: '2026-07-31', recd: '2026-08-01', ytd: 1.4, pack: 'MISSING' },
  { id: 'KUR', name: 'Kuramoto Japan Market-Neutral', mgr: 'Kuramoto AM K.K.', strat: 'Japan stat-arb', sleeve: 'RV', wt: 10.0, sla: 10, asOf: '2026-08-31', recd: '2026-09-02', ytd: 5.7, pack: 'CLOSED' },
];

export const CASH_YTD = 2.2;

export const HUMAN_BOOK: Record<string, number> = {
  NOR: 22.5, KES: 18.0, MER: 15.5, HAL: 12.0, SAB: 11.0, KUR: 10.0, CASH: 11.0,
};

// The untrusted raw-agent output — same prompt, different book, no citations.
// Run A drifts high, run B drifts low: non-determinism is the point. Both fail Rule D.
export const AGENT_BOOK_A: Record<string, number> = {
  NOR: 26.4, KES: 19.0, MER: 15.5, HAL: 12.0, SAB: 11.0, KUR: 10.4, CASH: 7.0,
};
export const AGENT_SUM_A = 101.3;
export const AGENT_BOOK_B: Record<string, number> = {
  NOR: 24.9, KES: 15.5, MER: 18.2, HAL: 14.4, SAB: 10.0, KUR: 9.8, CASH: 7.0,
};
export const AGENT_SUM_B = 99.8;

export const SCREENER_SEED: ScreenerItem[] = [
  { id: 'OXM', name: 'Oxbridge Macro', ticker: 'OXM', score: 81, tag: 'Capacity', reason: 'Filing indicates 42% growth in European enterprise orders.', cite: 'CIT-SCR-OXM-01', status: 'NEW', origin: 'EXTRACT', addedAt: '09:22' },
  { id: 'CAL', name: 'Caldera Commodities', ticker: 'CAL', score: 74, tag: 'Key-person', reason: 'Advanced packaging capex raised 18%; guidance beat.', cite: 'CIT-SCR-CAL-02', status: 'NEW', origin: 'EXTRACT', addedAt: '09:24' },
  { id: 'SIL', name: 'Silk River Frontier', ticker: 'SILK', score: 68, tag: 'Style drift', reason: 'Component localization cutting per-unit BOM ~6.4%.', cite: 'CIT-SCR-SIL-03', status: 'NEW', origin: 'EXTRACT', addedAt: '09:26' },
];

// Type-1 extract pool — cited, deduped against the watchlist on every run.
export const EXTRACT_POOL: Array<Omit<ScreenerItem, 'status'>> = [
  { id: 'VAN', name: 'Vantar Robotics', ticker: 'VANT', score: 77, tag: 'Capacity', reason: 'Two consecutive quarters of booking-to-revenue gap > 18%; channel checks pending.', cite: 'CIT-SCR-VAN-04', origin: 'EXTRACT' },
  { id: 'SIL', name: 'Silk River Frontier', ticker: 'SILK', score: 68, tag: 'Style drift', reason: 'Component localization cutting per-unit BOM ~6.4% (re-surfaced on new filings).', cite: 'CIT-SCR-SIL-03', origin: 'EXTRACT' },
];

export const EQUITY_HEDGE = ['KES', 'SAB'];

export const DOCS_SEED: DocRecord[] = [
  {
    id: 'hal-nav-08',
    kind: 'pdf',
    fundId: 'HAL',
    title: 'Halcyon August NAV pack',
    from: 'Harborline Fund Services <nav@harborline.example>',
    arrived: '2026-09-05 11:12',
    overall: 0.96,
    status: 'pending',
    editedFields: [],
    reasoning:
      'The pack names Halcyon Event-Driven Credit (fund_id) with valuation date 31 August 2026 (as_of) and NAV $17,100,000 (nav_usd). Fee charged 0.15 (fee_charged_pct) versus LPA 0.12 (fee_expected_pct) is a fee_delta; rails recompute fee_delta_usd = −$27,360 — arithmetic from code, not the model. Note 4 restatement_pp −0.8pp after final pricing is supporting context.',
    fields: [
      { key: 'fund_id', label: 'Fund', value: 'HAL', conf: 0.99, required: true, snippet: 'Halcyon Event-Driven Credit' },
      { key: 'as_of', label: 'Valuation date', value: '2026-08-31', conf: 0.97, required: true, snippet: '31 August 2026' },
      { key: 'nav_usd', label: 'NAV', value: 17100000, conf: 0.98, required: true, snippet: '$17,100,000' },
      { key: 'fee_charged_pct', label: 'Fee charged', value: 0.15, conf: 0.94, required: true, snippet: 'management fee charged 0.15%' },
      { key: 'fee_expected_pct', label: 'Fee (LPA)', value: 0.12, conf: 0.91, required: true, snippet: 'LPA 0.12%' },
      { key: 'restatement_pp', label: 'Restatement', value: -0.8, conf: 0.93, required: false, snippet: 'July NAV restated −0.8pp' },
      { key: 'fee_delta_usd', label: 'Fee delta', value: -27360, conf: 0.96, required: true, snippet: 'fee accrual recomputed −$27,360' },
    ],
  },
  {
    id: 'inv-pfs-q3',
    kind: 'pdf',
    fundId: null,
    title: 'Pacific Fund Services invoice',
    from: 'Pacific Fund Services Ltd <billing@pfs.example>',
    arrived: '2026-09-01 09:14',
    overall: 0.71,
    status: 'pending',
    editedFields: [],
    reasoning:
      'Vendor and amount_usd print clearly on the face of invoice_no PFS-2026-0944. GL code (gl_code) is a guess from fund administration; the memo mentions Halcyon so alloc_fund_id is tagged low confidence — it could be firm-level.',
    fields: [
      { key: 'vendor', label: 'Vendor', value: 'Pacific Fund Services Ltd', conf: 0.94, required: true, snippet: 'Pacific Fund Services Ltd' },
      { key: 'invoice_no', label: 'Invoice', value: 'PFS-2026-0944', conf: 0.92, required: true, snippet: 'Invoice PFS-2026-0944' },
      { key: 'amount_usd', label: 'Amount due', value: 48750.0, conf: 0.91, required: true, snippet: '$48,750.00' },
      { key: 'due', label: 'Due date', value: '2026-09-30', conf: 0.9, required: true, snippet: 'due 30 Sep 2026' },
      { key: 'entity', label: 'Bill to', value: 'Apex Pacific Absolute Return Fund', conf: 0.88, required: true, snippet: 'Apex Pacific Absolute Return Fund' },
      { key: 'gl_code', label: 'GL code', value: '6100-Admin', conf: 0.62, required: true, snippet: 'Q3 2026 fund administration' },
      { key: 'alloc_fund_id', label: 'Alloc. fund', value: 'HAL', conf: 0.55, required: false, snippet: 'Includes restatement processing (Halcyon)' },
    ],
  },
  {
    id: 'eml-mer-0807',
    kind: 'email',
    fundId: 'MER',
    title: 'Meridian manager email',
    from: 'ops@meridianam.example',
    arrived: '2026-09-07 08:07',
    overall: 0.41,
    status: 'pending',
    editedFields: [],
    reasoning:
      'Prose, no schema; date (as_of) inferred from “this week” plus mailbox time — weak. Positions (aapl_qty, aapl_px) and cash_usd are readable in the sentence. flags [fee_delta, unexpected_fx] are rules run on extracted numbers, not read from the sentence.',
    fields: [
      { key: 'fund_id', label: 'Fund', value: 'MER', conf: 0.67, required: true, snippet: 'ops@meridianam.example' },
      { key: 'as_of', label: 'As-of', value: '2026-09-07', conf: 0.44, required: true, snippet: 'this week statement' },
      { key: 'aapl_qty', label: 'AAPL qty', value: 12500, conf: 0.86, required: false, snippet: '12,500 AAPL' },
      { key: 'aapl_px', label: 'AAPL price', value: 201.3, conf: 0.86, required: false, snippet: 'marked at 201.30' },
      { key: 'cash_usd', label: 'Cash', value: 3420000, conf: 0.8, required: true, snippet: 'cash sits at 3.42M' },
      { key: 'fee_charged_pct', label: 'Fee charged', value: 0.15, conf: 0.78, required: true, snippet: '0.15% management fee' },
      { key: 'fee_expected_pct', label: 'Fee expected', value: 0.12, conf: 0.74, required: true, snippet: 'we had 0.12% last month' },
      { key: 'fx_lines', label: 'FX lines', value: 2, conf: 0.7, required: false, snippet: 'two FX lines I did not expect' },
      { key: 'flags', label: 'Flags', value: 'fee_delta, unexpected_fx', conf: 0.63, required: true, snippet: 'fee looks off · two FX lines' },
    ],
  },
];
