/** Same-period comparison only: rates are percentages on the supplied NAV base. */
export function feeAdjustment(nav: number, chargedPct: number, expectedPct: number) {
  return Math.round(nav * (expectedPct - chargedPct)) / 100;
}

export interface FeeInputs { nav: number; annualRate: number; start: string; end: string; invoiced: number }
export function reconcileFee(input: FeeInputs) {
  const date = (s: string) => { const n = Date.parse(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(n) && new Date(n).toISOString().slice(0,10) === s ? n : NaN; };
  const start = date(input.start), end = date(input.end);
  if (![input.nav,input.annualRate,input.invoiced,start,end].every(Number.isFinite) || input.nav <= 0 || input.annualRate < 0 || input.annualRate > 100 || input.invoiced < 0 || end < start) return { ok: false as const, error: 'Use a positive NAV, a 0–100% annual rate, a non-negative invoice and valid inclusive dates in order.' };
  const days = Math.round((end-start)/86400000)+1;
  const expected = Math.round(input.nav * input.annualRate / 100 * days / 365 * 100)/100;
  const variance = Math.round((input.invoiced-expected)*100)/100;
  return { ok: true as const, days, expected, variance, needsReview: Math.abs(variance)>1 };
}
export interface FeeReview { id: string; inputs: FeeInputs; expected: number; variance: number; days: number; note: string; reviewer: string; at: string; sources: string[]; access: 'PM' }
