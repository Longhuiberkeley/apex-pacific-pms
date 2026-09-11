import { z } from 'zod';
import { daysSince, EQUITY_HEDGE, NAV_USD } from '../data/seed';
import type { Fund } from './types';

// Type-1 deterministic invariants. Pure, zero model calls.
// A ≤25% single · B equity-hedge sleeve ≤35% · C cash ≥10% · D Σ=100±0.05 · E stale>30d → ≤5%
// Messages speak money; thresholds stay in weight space.

export const BookSchema = z.record(z.string(), z.number());

export interface Violation {
  rule: 'A' | 'B' | 'C' | 'D' | 'E';
  msg: string;
}

function m1(pct: number): string {
  return ((pct / 100) * NAV_USD / 1e6).toFixed(1);
}
function moneyVsCap(havePct: number, capPct: number): { have: string; cap: string; gap: string } {
  const have = m1(havePct);
  const cap = m1(capPct);
  const gap = Math.abs(Number(have) - Number(cap)).toFixed(1);
  return { have: `$${have}M`, cap: `$${cap}M`, gap: `$${gap}M` };
}

export function validateBook(book: Record<string, number>, funds: Fund[]): Violation[] {
  const v: Violation[] = [];
  const byId: Record<string, Fund> = {};
  funds.forEach((f) => (byId[f.id] = f));

  Object.entries(book).forEach(([id, wt]) => {
    if (id === 'CASH') return;
    if (wt > 25.0) {
      const f = byId[id];
      const x = moneyVsCap(wt, 25);
      v.push({ rule: 'A', msg: `${f?.name ?? id} ${x.have} is ${x.gap} over the 25% single-name cap (${x.cap}).` });
    }
  });

  const sleeve = EQUITY_HEDGE.reduce((a, id) => a + (book[id] ?? 0), 0);
  if (sleeve > 35.0) {
    const x = moneyVsCap(sleeve, 35);
    v.push({ rule: 'B', msg: `Equity-hedge sleeve ${x.have} is ${x.gap} over the 35% cap (${x.cap}).` });
  }

  const cash = book.CASH ?? 0;
  if (cash < 10.0) {
    const x = moneyVsCap(cash, 10);
    v.push({ rule: 'C', msg: `Liquidity reserve ${x.have} is ${x.gap} under the 10% floor (${x.cap}).` });
  }

  const total = Object.values(book).reduce((a, b) => a + b, 0);
  if (Math.abs(total - 100) >= 0.05) {
    const have = m1(total);
    const nav = m1(100);
    const gap = Math.abs(Number(have) - Number(nav)).toFixed(1);
    v.push({ rule: 'D', msg: `Book totals $${have}M, $${gap}M off NAV $${nav}M.` });
  }

  funds.forEach((f) => {
    const age = daysSince(f.asOf);
    const w = book[f.id] ?? 0;
    if (age > 30 && w > 5.0) {
      const x = moneyVsCap(w, 5);
      v.push({ rule: 'E', msg: `${f.name} ${x.have} is ${x.gap} over the 5% stale-NAV cap (${x.cap}) — NAV ${age}d stale.` });
    }
  });

  return v;
}

export function bookTotal(book: Record<string, number>): number {
  return Object.values(book).reduce((a, b) => a + b, 0);
}

export function weightedYtd(book: Record<string, number>, funds: Fund[], cashYtd: number): number {
  let y = 0;
  funds.forEach((f) => {
    y += ((book[f.id] ?? 0) * f.ytd) / 100;
  });
  y += ((book.CASH ?? 0) * cashYtd) / 100;
  return y;
}
