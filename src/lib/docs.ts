import type { DocRecord } from './types';

/** AUTO quick-approve: overall ≥ 0.90 and every required field conf ≥ 0.85. */
export function isEligible(doc: DocRecord): boolean {
  if (doc.status !== 'pending') return false;
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
