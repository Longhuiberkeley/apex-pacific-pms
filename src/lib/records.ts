import type { DocRecord, Identity } from './types';
export type Access = 'team' | 'PM';
export function canRead(identity: Identity | null, item: { access?: Access }) { return !!identity && (item.access !== 'PM' || identity.role === 'PM'); }
export interface ApprovedRecord {
  id: string; docId: string; fundId: string | null; title: string; access: Access;
  values: Record<string, string | number>; corrections: string[]; approvedBy: string; approvedAt: string;
  source: string; references: Record<string, string>;
}
const locations: Record<string, { filename: string; mailbox: string; rawPath: string }> = {
  'hal-nav-08': { filename: 'Harborline_August_NAV.pdf', mailbox: 'nav@apexpacific.example', rawPath: '/raw/Harborline_August_NAV.pdf' },
  'inv-pfs-q3': { filename: 'PacificFundServices_September_Invoice.pdf', mailbox: 'operations@apexpacific.example', rawPath: '/raw/PacificFundServices_September_Invoice.pdf' },
  'eml-mer-0807': { filename: 'Meridian_Statement.eml', mailbox: 'operations@apexpacific.example', rawPath: '/raw/Meridian_Statement.eml' },
  'fee-invoice-hal': { filename: 'Halcyon_August_Fee_Invoice.pdf', mailbox: 'operations@apexpacific.example', rawPath: '/raw/Halcyon_August_Fee_Invoice.pdf' },
  'terms-hal': { filename: 'Halcyon_Management_Terms.pdf', mailbox: 'Document repository / Agreements', rawPath: '/raw/Halcyon_Management_Terms.pdf' },
  'private-reference': { filename: 'Manager_Reference_Note.pdf', mailbox: 'Document repository / Restricted', rawPath: '/raw/Manager_Reference_Note.pdf' },
};
export const provenance = (doc: DocRecord) => locations[doc.id] ?? { filename: `${doc.id}.${doc.kind === 'pdf' ? 'pdf' : 'eml'}`, mailbox: 'Document repository', rawPath: '' };
export const rawUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export function makeRecord(doc: DocRecord, reviewer: string, at: string): ApprovedRecord {
  const numeric = /(_usd|_pct|_pp|_qty|_px)$|^fx_lines$/;
  return { id: `DATA-${doc.id}`, docId: doc.id, fundId: doc.fundId, title: doc.title, access: doc.access ?? 'team', values: Object.fromEntries(doc.fields.map(f => [f.key, numeric.test(f.key) && String(f.value).trim() ? Number(f.value) : f.value])), corrections: [...doc.editedFields], approvedBy: reviewer, approvedAt: at, source: provenance(doc).rawPath, references: Object.fromEntries(doc.fields.map(f => [f.key, f.key === 'fee_delta_usd' ? 'Derived by code from reviewed inputs' : `${provenance(doc).filename} · ${doc.kind === 'pdf' ? 'page 1' : 'message body'} · ${f.snippet}`])) };
}
export const EXTRA_DOCS: DocRecord[] = [
  { id: 'fee-invoice-hal', kind: 'pdf', fundId: 'HAL', title: 'Halcyon August management fee invoice', from: 'billing@harborline.example', arrived: '2026-09-02 10:00', overall: 1, status: 'approved', editedFields: [], reasoning: 'Invoice fields reviewed by Operations; fee reconciliation remains outstanding.', fields: [
    { key: 'amount_usd', label: 'Invoiced management fee', value: 22500, conf: 1, required: true, snippet: 'Amount due: $22,500.00' },
    { key: 'period_start', label: 'Period start', value: '2026-08-01', conf: 1, required: true, snippet: '1 August 2026' },
    { key: 'period_end', label: 'Period end', value: '2026-08-31', conf: 1, required: true, snippet: '31 August 2026' },
  ] },
  { id: 'terms-hal', kind: 'pdf', fundId: 'HAL', title: 'Halcyon management fee terms', from: 'Document repository', arrived: '2026-08-28 14:00', overall: 1, status: 'approved', access: 'PM', editedFields: [], reasoning: 'Signed terms transcribed and reviewed by the portfolio manager.', fields: [
    { key: 'annual_rate_pct', label: 'Annual management rate', value: 1.44, conf: 1, required: true, snippet: 'Annual management fee: 1.44%' },
    { key: 'basis', label: 'Accrual convention', value: 'Actual/365; constant NAV example', conf: 1, required: true, snippet: 'Calendar days, inclusive; constant NAV' },
  ] },
  { id: 'private-reference', kind: 'pdf', fundId: 'SIL', title: 'Manager reference note', from: 'Internal research', arrived: '2026-09-04 10:00', overall: 1, status: 'approved', access: 'PM', editedFields: [], reasoning: 'PM-only reference discussion; illustrative fictional content.', fields: [
    { key: 'finding', label: 'Reference finding', value: 'Former colleague describes a disciplined escalation process; independently corroborate staffing coverage.', conf: 1, required: true, snippet: 'Reference discussion, 4 September' },
  ] },
];
export function canReadWork(identity: Identity | null, work: { access?: Access; sources: { access?: Access; docId?: string }[] }, docs: DocRecord[]) {
  return canRead(identity, work) && work.sources.every(source => canRead(identity,source) && (!source.docId || !!docs.find(d=>d.id===source.docId && canRead(identity,d))));
}
