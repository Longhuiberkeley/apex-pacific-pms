// Shared diligence-state model — used by the fund page, the store
// (structured verdict records), and cross-lane navigation.

export type DdState = 'OVERDUE' | 'ATTENTION' | 'CURRENT';

export function ddState(id: string): { s: DdState; tone: 'crimson' | 'amber' | 'emerald'; why: string } {
  if (id === 'SAB') return { s: 'OVERDUE', tone: 'crimson', why: 'August NAV report is 23 days overdue' };
  if (id === 'HAL') return { s: 'ATTENTION', tone: 'amber', why: 'NAV correction and return smoothing require review' };
  if (id === 'KUR') return { s: 'ATTENTION', tone: 'amber', why: 'Market sensitivity is 0.62, above the 0.35 mandate limit' };
  if (id === 'NOR') return { s: 'ATTENTION', tone: 'amber', why: 'Administrator controls report is missing; request the report' };
  return { s: 'CURRENT', tone: 'emerald', why: 'Reporting is current and no issues are outstanding' };
}

export function openFlags(id: string): string[] {
  switch (id) {
    case 'SAB': return ['SLA-02', 'CHK-08'];
    case 'HAL': return ['CHK-07'];
    case 'KUR': return ['CHK-02'];
    case 'NOR': return ['CHK-08'];
    default: return [];
  }
}

export type FlagTone = 'crimson' | 'amber' | 'emerald';

export function flagItems(id: string): Array<{ tone: FlagTone; label: string; body: string }> {
  switch (id) {
    case 'SAB':
      return [
        { tone: 'crimson', label: 'Overdue NAV report', body: 'August NAV is 23 days past the reporting deadline. Operations needs to obtain the administrator’s report.' },
        { tone: 'amber', label: 'Valuation evidence needs review', body: 'The manager promises independent valuations within 15 days. However, 31% of holdings use unobservable valuation inputs and pricing questions have remained open for more than 60 days.' },
      ];
    case 'HAL':
      return [
        { tone: 'amber', label: 'Restatement', body: 'July NAV restated −0.8pp after final pricing. Separately, the current pack shows a 0.15% fee versus 0.12% expected; inspect the code-computed comparison in Documents.' },
      ];
    case 'KUR':
      return [
        { tone: 'amber', label: 'Market sensitivity above mandate', body: 'The manager describes the strategy as market-neutral. Its measured sensitivity to the TOPIX index is 0.62 over 12 months, above the 0.35 mandate limit. Research should investigate the exposure.' },
      ];
    case 'NOR':
      return [
        { tone: 'amber', label: 'Pending', body: 'The administrator controls report (SOC 1) has not been received. Operations should request it before this review can be completed.' },
      ];
    default:
      return [];
  }
}

export const DD_CHECKS = [
  { id: 'CHK-01', name: 'NAV and performance records agree' },
  { id: 'CHK-02', name: 'Market sensitivity within mandate' },
  { id: 'CHK-03', name: 'Diversification across market conditions' },
  { id: 'CHK-04', name: 'Reported maximum drawdown verified' },
  { id: 'CHK-05', name: 'Risk-adjusted return verified' },
  { id: 'CHK-06', name: 'Strategy remains consistent with mandate' },
  { id: 'CHK-07', name: 'Unusually smooth returns investigated' },
  { id: 'CHK-08', name: 'Independent valuation controls' },
  { id: 'CHK-09', name: 'Fees match agreed terms' },
  { id: 'CHK-10', name: 'Redemption terms agree across documents' },
] as const;

export type ChkStat = 'PASS' | 'FAIL' | 'PENDING' | 'BLOCKED';

const CHK_OVERRIDES: Record<string, Record<string, { s: ChkStat; obs: string; detail?: string }>> = {
  NOR: {
    'CHK-08': { s: 'PENDING', obs: 'Awaiting administrator controls report', detail: 'Request the administrator controls report (SOC 1). The evidence is missing; the review has not concluded that controls failed.' },
  },
  HAL: {
    'CHK-05': { s: 'PASS', obs: 'Calculated Sharpe 1.12; manager reports 1.10', detail: 'Calculated using 32 monthly observations; the difference is within the review tolerance.' },
    'CHK-07': { s: 'FAIL', obs: 'Return smoothing measure 0.31; limit 0.25', detail: 'Returns are more closely related across consecutive months than expected. Ask whether valuation timing or illiquid holdings explain the pattern.' },
  },
  SAB: {
    'CHK-08': { s: 'FAIL', obs: '31% relies on unobservable valuation inputs', detail: '31% of holdings rely on unobservable inputs (Level 3). Pricing questions have been open for more than 60 days.' },
  },
  KUR: {
    'CHK-02': { s: 'FAIL', obs: 'Sensitivity 0.62; mandate limit 0.35', detail: 'Market sensitivity to TOPIX is 0.62 over the past 12 months. Research should investigate why it exceeds the 0.35 mandate limit.' },
  },
};

export function chkFor(fundId: string, id: string): { s: ChkStat; obs: string; detail?: string } {
  const ov = CHK_OVERRIDES[fundId]?.[id];
  if (ov) return ov;
  return { s: 'PASS', obs: 'Reviewed figures agree and are within limits' };
}

/** Display status — blocked checks render as Pending. */
export function chkDisplay(s: ChkStat): 'Pass' | 'Fail' | 'Pending' {
  if (s === 'FAIL') return 'Fail';
  if (s === 'PASS') return 'Pass';
  return 'Pending';
}
