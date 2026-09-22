import type { ScreenerItem } from './types';
export const METRICS = [
  { key: 'return', label: 'Annualized return', unit: '%', min: 11, direction: 'min', floor: -100, ceiling: 1000 },
  { key: 'volatility', label: 'Annualized volatility', unit: '%', min: 14, direction: 'max', floor: 0, ceiling: 1000 },
  { key: 'drawdown', label: 'Maximum drawdown magnitude', unit: '%', min: 17, direction: 'max', floor: 0, ceiling: 100 },
  { key: 'sharpe', label: 'Sharpe ratio', unit: 'ratio', min: 1.1, direction: 'min', floor: -100, ceiling: 100 },
  { key: 'history', label: 'Live track record', unit: 'months', min: 42, direction: 'min', floor: 0, ceiling: 1200 },
  { key: 'notice', label: 'Redemption notice', unit: 'days', min: 75, direction: 'max', floor: 0, ceiling: 3650 },
  { key: 'concentration', label: 'Largest position', unit: '% NAV', min: 9, direction: 'max', floor: 0, ceiling: 100 },
  { key: 'correlation', label: 'Correlation to demo portfolio', unit: '−1 to +1', min: 0.35, direction: 'max', floor: -1, ceiling: 1 },
] as const;
export type MetricKey = typeof METRICS[number]['key'];
export type Metrics = Partial<Record<MetricKey, number>>;
export type Criterion = { key: MetricKey; threshold: number; enabled: boolean };
export const DEFAULT_CRITERIA: Criterion[] = METRICS.map(m => ({ key: m.key, threshold: m.min, enabled: true }));
export function evaluate(metrics: Metrics = {}, criteria = DEFAULT_CRITERIA) {
  const checks = criteria.filter(c => c.enabled).map(c => {
    const m = METRICS.find(m => m.key === c.key)!;
    const value = metrics[c.key];
    return { ...c, label: m.label, unit: m.unit, value, status: value == null ? 'Needs evidence' : (m.direction === 'min' ? value >= c.threshold : value <= c.threshold) ? 'Pass' : 'Fail' };
  });
  return { checks, status: !checks.length ? 'No checks enabled' : checks.some(c => c.status === 'Fail') ? 'Outside criteria' : checks.some(c => c.status === 'Needs evidence') ? 'Needs evidence' : 'Eligible' };
}
export function validCriteria(criteria: Criterion[]) {
  return criteria.length === METRICS.length && METRICS.every(m => criteria.filter(c => c.key === m.key).length === 1) && criteria.every(c => { const m = METRICS.find(m => m.key === c.key); return m && typeof c.enabled === 'boolean' && Number.isFinite(c.threshold) && c.threshold >= m.floor && c.threshold <= m.ceiling; });
}
export function validateMetrics(input: unknown): input is Metrics {
  return !!input && typeof input === 'object' && !Array.isArray(input) && Object.entries(input).every(([key, value]) => { const m = METRICS.find(m => m.key === key); return m && typeof value === 'number' && Number.isFinite(value) && value >= m.floor && value <= m.ceiling; });
}
const names = ['Alder Systematic', 'Briar Relative Value', 'Cobalt Macro', 'Dovetail Equity', 'Elm Credit', 'Fable Arbitrage', 'Grove Markets', 'Heather Defensive', 'Indigo Opportunities', 'Juniper Quant', 'Larch Global', 'Morrow Multi Strategy', 'Orchard Income', 'Peregrine Value', 'Tamarind Neutral', 'Willow Diversified'];
export const SCREENING_SEED: ScreenerItem[] = names.map((name, i) => ({
  id: `C-${String(i + 1).padStart(3, '0')}`, name, ticker: `C${i+1}`, score: null, tag: ['Systematic', 'Relative value', 'Discretionary'][i%3], reason: 'Illustrative candidate; evidence requires analyst review.', cite: `C-${i+1}-PACK`, status: 'NEW', origin: 'EXTRACT',
  metrics: { return: 8 + (i * 7 % 15), volatility: 7 + i % 10, drawdown: 6 + i % 14, sharpe: 0.8 + (i%7)*0.2, history: 36 + i*6, notice: [30, 60, 90][i%3], concentration: 4 + i%8, ...(i === 7 ? {} : { correlation: Number((0.08 + (i%6)*0.07).toFixed(2)) }) },
  metricSource: 'Fictional manager pack · live monthly series Sep 2023–Aug 2026; holdings and terms at 31 Aug 2026', metricAsOf: '2026-08-31',
}));
