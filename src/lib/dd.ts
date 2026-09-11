// Shared diligence-state model — used by the fund page, the store
// (structured verdict records), and cross-lane navigation.

export type DdState = 'OVERDUE' | 'ATTENTION' | 'CURRENT';

export function ddState(id: string): { s: DdState; tone: 'crimson' | 'amber' | 'emerald'; why: string } {
  if (id === 'SAB') return { s: 'OVERDUE', tone: 'crimson', why: 'open crimson flag · August NAV 23d past SLA' };
  if (id === 'HAL') return { s: 'ATTENTION', tone: 'amber', why: 'July restatement · Σ autocorr 0.31 FAIL' };
  if (id === 'KUR') return { s: 'ATTENTION', tone: 'amber', why: 'β 0.62 vs mandate ≤ 0.35' };
  if (id === 'NOR') return { s: 'ATTENTION', tone: 'amber', why: 'CHK-08 pending — SOC-1 missing (blocked ≠ failed)' };
  return { s: 'CURRENT', tone: 'emerald', why: 'sources fresh · checks passing · no open flags' };
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
        { tone: 'crimson', label: 'SLA-02', body: 'August NAV 23d past SLA.' },
        { tone: 'amber', label: 'Contradiction', body: 'Claim: “independent admin marks within T+15” — computed: level-3 31% of book, queries open 60+d.' },
      ];
    case 'HAL':
      return [
        { tone: 'amber', label: 'Restatement', body: 'July NAV restated −0.8pp after final pricing → fee accrual recomputed −$27,360.' },
      ];
    case 'KUR':
      return [
        { tone: 'amber', label: 'β drift', body: 'Claim: “market-neutral” — computed β to TOPIX 0.62 (12m rolling, band ≤ 0.35).' },
      ];
    case 'NOR':
      return [
        { tone: 'amber', label: 'Pending', body: 'CHK-08 pending — admin SOC-1 missing (blocked is not failed).' },
      ];
    default:
      return [];
  }
}

export const DD_CHECKS = [
  { id: 'CHK-01', name: 'NAV ↔ track record tie' },
  { id: 'CHK-02', name: 'beta to reference index' },
  { id: 'CHK-03', name: 'correlation regime' },
  { id: 'CHK-04', name: 'max drawdown claim' },
  { id: 'CHK-05', name: 'Sharpe recompute' },
  { id: 'CHK-06', name: 'style drift' },
  { id: 'CHK-07', name: 'return smoothing signal' },
  { id: 'CHK-08', name: 'valuation coverage' },
  { id: 'CHK-09', name: 'fees charged vs terms' },
  { id: 'CHK-10', name: 'liquidity terms across docs' },
] as const;

export type ChkStat = 'PASS' | 'FAIL' | 'PENDING' | 'BLOCKED';

const CHK_OVERRIDES: Record<string, Record<string, { s: ChkStat; obs: string; detail?: string }>> = {
  NOR: {
    'CHK-08': { s: 'PENDING', obs: 'blocked — admin SOC-1 missing', detail: 'blocked is not failed: required source missing' },
  },
  HAL: {
    'CHK-05': { s: 'PASS', obs: '1.12 vs 1.10 claimed · 32 obs', detail: 'recomputed 1.12 vs claimed 1.10 — rolling 32-obs Sharpe' },
    'CHK-07': { s: 'FAIL', obs: 'Σ autocorr 0.31 > 0.25', detail: 'Σ autocorr (lag 1–4) 0.31 — illiquidity signal' },
  },
  SAB: {
    'CHK-08': { s: 'FAIL', obs: '31% level-3', detail: 'level-3 31% of book; pricing queries open 60+d' },
  },
  KUR: {
    'CHK-02': { s: 'FAIL', obs: 'β 0.62 vs band ≤ 0.35', detail: '12m rolling β to TOPIX 0.62 — mandate band ≤ 0.35' },
  },
};

export function chkFor(fundId: string, id: string): { s: ChkStat; obs: string; detail?: string } {
  const ov = CHK_OVERRIDES[fundId]?.[id];
  if (ov) return ov;
  return { s: 'PASS', obs: 'tied out · within band' };
}

/** Display status — blocked checks render as Pending. */
export function chkDisplay(s: ChkStat): 'Pass' | 'Fail' | 'Pending' {
  if (s === 'FAIL') return 'Fail';
  if (s === 'PASS') return 'Pass';
  return 'Pending';
}
