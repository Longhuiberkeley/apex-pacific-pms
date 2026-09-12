/** Same-period comparison only: rates are percentages on the supplied NAV base. */
export function feeAdjustment(nav: number, chargedPct: number, expectedPct: number) {
  return Math.round(nav * (expectedPct - chargedPct)) / 100;
}
