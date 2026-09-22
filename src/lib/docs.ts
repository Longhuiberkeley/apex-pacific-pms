import type { DocRecord } from './types';

export function documentErrors(doc: DocRecord): string[] {
  const errors: string[] = [];
  const numeric = /(_usd|_pct|_pp|_qty|_px)$|^fx_lines$/;
  for (const field of doc.fields) {
    const value = String(field.value).trim();
    if (field.required && !value) errors.push(`${field.label} is required.`);
    if (value && numeric.test(field.key) && !Number.isFinite(Number(value))) errors.push(`${field.label} must be a number.`);
    if (value && ['nav_usd','amount_usd'].includes(field.key) && Number(value) <= 0) errors.push(`${field.label} must be positive.`);
    if (value && ['as_of', 'due', 'period_start', 'period_end'].includes(field.key)) {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) errors.push(`${field.label} needs a valid YYYY-MM-DD date.`);
    }
  }
  return errors;
}

/** AUTO quick-approve: overall ≥ 0.90 and every required field conf ≥ 0.85. */
export function isEligible(doc: DocRecord): boolean {
  if (doc.status !== 'pending') return false;
  if (documentErrors(doc).length) return false;
  if (doc.overall < 0.9) return false;
  return doc.fields.every((f) => !f.required || f.conf >= 0.85);
}

/** First required field still below 0.85 that the human has not stamped. */
export function firstWeakRequired(doc: DocRecord): string | null {
  const f = doc.fields.find((x) => x.required && x.conf < 0.85 && !doc.editedFields.includes(x.key) && !x.editedBy);
  return f?.key ?? null;
}

export function domainOf(from: string): string {
  const m = from.match(/@([A-Za-z0-9.-]+)/);
  if (m) return m[1];
  const angle = from.match(/<[^>]+>/);
  if (angle) return domainOf(angle[0].slice(1, -1));
  return '';
}

export function fromName(from: string): string {
  const trimmed = from.replace(/<[^>]+>/, '').trim();
  return trimmed || from;
}
