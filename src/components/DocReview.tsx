import { useStore } from '../lib/store';
import { canRead, provenance, rawUrl } from '../lib/records';
import { Btn } from './Ui';
import { useEffect, useState } from 'react';
import { ChevronDown, FileText, Mail } from 'lucide-react';
import type { DocRecord } from '../lib/types';
import { domainOf, firstWeakRequired, fromName, documentErrors } from '../lib/docs';
import { cn } from '../lib/cn';
import DocOriginal from './DocOriginal';
import HitlTriad from './HitlTriad';
import { ModeBadge } from './WorkMode';

export default function DocReview({
  doc,
  policyChip,
  onApprove,
  onReject,
  onEdit,
  wantReject,
  onWantRejectConsumed,
}: {
  doc: DocRecord;
  policyChip?: React.ReactNode;
  onApprove: () => void;
  onReject: (reason: string, note: string) => void;
  onEdit: (key: string, value: string) => void;
  wantReject?: boolean;
  onWantRejectConsumed?: () => void;
}) {
  const [active, setActive] = useState<string | null>(doc.fields[0]?.key ?? null);
  const [reasoning, setReasoning] = useState(true);
  const [original, setOriginal] = useState(false);
  const identity = useStore(s=>s.identity);
  const openRecord = useStore(s=>s.openRecord);

  useEffect(() => {
    setActive(doc.fields[0]?.key ?? null);
  }, [doc.id]);

  const focusFix = () => {
    const key = firstWeakRequired(doc);
    if (key) {
      setActive(key);
      const el = document.querySelector<HTMLInputElement>(`[data-field-input="${key}"]`);
      el?.focus();
      el?.select();
      return false;
    }
    return true;
  };

  const fixAndApprove = () => {
    if (focusFix()) onApprove();
  };

  const domain = domainOf(doc.from);
  const errors = documentErrors(doc);
  const Icon = doc.kind === 'email' ? Mail : FileText;

  if (!canRead(identity, doc)) return <p className="p-5 text-sm">Restricted document · PM access required</p>;
  const location = provenance(doc);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon size={14} className="shrink-0 text-muted" />
              <h2 className="text-[15px] font-semibold text-ink">{doc.title}</h2>
            </div>
            <p className="mt-1 break-all text-[12px] text-muted">{location.mailbox} → {location.filename}</p><p className="text-[12px] text-muted">{location.rawPath} · Original retained unchanged</p>
            <div className="mt-2"><ModeBadge mode="type1" /></div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
              <span>{fromName(doc.from)}</span>
              {domain && (
                <>
                  <span className="text-line2">·</span>
                  <span>
                    {domain}
                  </span>
                </>
              )}
              <span className="text-line2">·</span>
              <span className="font-mono tabular-nums">{doc.arrived}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {policyChip}
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                <span className="block h-full bg-ai" style={{ width: `${doc.overall * 100}%` }} />
              </span>
              <span className="font-mono text-[12px] tabular-nums text-ink">{(doc.overall * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2 text-xs">
        {doc.kind === 'pdf' && <><button onClick={()=>setOriginal(false)} className={!original?'font-semibold text-ai':''}>Annotated review</button><button onClick={()=>setOriginal(true)} className={original?'font-semibold text-ai':''}>Original PDF</button><span>Page 1 of 1</span><a className="text-ai" href={rawUrl(location.rawPath)} target="_blank" rel="noreferrer">Open PDF ↗</a><a className="text-ai" href={rawUrl(location.rawPath)} download={location.filename}>Download</a></>}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[48%] overflow-auto border-r border-line bg-paper p-4 2xl:w-[55%]">
          {original && doc.kind === 'pdf' ? <iframe title={location.filename} src={rawUrl(location.rawPath)} className="h-full min-h-[500px] w-full border-0"/> : <><DocOriginal doc={doc} activeKey={active} onActivate={setActive} /><p className="mt-3 text-center text-xs text-muted">{location.filename} · {doc.kind === 'pdf' ? '1 / 1' : 'Original message'}</p></>}
        </div>
        <div className="flex w-[52%] min-w-0 flex-col overflow-auto 2xl:w-[45%]">
          <table className="w-full table-fixed border-collapse text-[13px]">
            <colgroup><col className="w-[27%]" /><col className="w-[53%]" /><col className="w-[20%]" /></colgroup>
            <thead>
              <tr className="text-left text-[12px] text-muted">
                <th className="h-10 bg-paper px-3 font-medium">Field</th>
                <th className="h-10 bg-paper px-3 font-medium">{doc.status === 'pending' ? 'Draft value' : 'Reviewed value'}</th>
                <th className="h-10 bg-paper px-3 font-medium">Conf</th>
              </tr>
            </thead>
            <tbody>
              {doc.fields.map((f) => {
                const human = Boolean(f.editedBy) || doc.editedFields.includes(f.key);
                const on = active === f.key;
                return (
                  <tr
                    key={f.key}
                    onMouseEnter={() => setActive(f.key)}
                    onClick={() => setActive(f.key)}
                    className={cn('cursor-pointer border-t border-line', on && 'bg-paper')}
                  >
                    <td
                      className={cn(
                        'h-10 px-3 align-middle',
                        human ? 'border-l-4 border-ink' : 'border-l-4 border-ai'
                      )}
                    >
                      <div className="text-ink">{f.label}</div>{['gl_code','alloc_fund_id'].includes(f.key) && <div className="text-[12px] text-muted">Proposed classification</div>}
                      {f.required && f.conf < 0.85 && !human && (
                        <div className="text-[12px] text-stop">Required</div>
                      )}
                    </td>
                    <td className="h-10 px-2 align-middle">
                      <input
                        data-field-input={f.key}
                         value={String(f.value)}
                         readOnly={doc.status !== 'pending' || f.key === 'fee_delta_usd'}
                        onChange={(e) => onEdit(f.key, e.target.value)}
                        onFocus={() => setActive(f.key)}
                        className="h-7 w-full rounded border border-transparent bg-transparent px-1 font-mono text-[12px] tabular-nums text-ink hover:border-line focus:border-ai focus:outline-none"
                      />
                      <div className="truncate px-1 text-[12px] text-muted" title={f.snippet}>
                        {f.snippet}
                      </div>
                    </td>
                    <td className="h-10 px-3 align-middle">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            human ? 'bg-ink' : f.conf >= 0.85 ? 'bg-ai' : f.conf >= 0.7 ? 'bg-wait' : 'bg-stop'
                          )}
                        />
                        {f.key === 'fee_delta_usd' ? 'code' : human ? 'human' : f.conf.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-line">
            <button
              onClick={() => setReasoning((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-muted hover:text-ink"
            >
              Reasoning
              <ChevronDown size={13} className={cn('transition-transform', reasoning && 'rotate-180')} />
            </button>
            {reasoning && (
              <p className="px-3 pb-3 text-[12px] leading-relaxed text-ink">{doc.reasoning}</p>
            )}
          </div>
        </div>
      </div>

      {errors.length > 0 && <p role="alert" className="border-t border-line px-4 py-2 text-[12px] text-stop">{errors.join(' ')}</p>}
      <div className="border-t border-line bg-paper px-4 py-2 text-xs">{doc.status === 'pending' ? 'Approve the reviewed values below into Data library → Structured records. The original file stays unchanged.' : `Document ${doc.status}. Saved records are read-only.`}</div>
      {doc.status === 'pending' ? <HitlTriad
        approveLabel="Approve & save record"
        hotkeys
        wantReject={wantReject}
        onWantRejectConsumed={onWantRejectConsumed}
        onFix={fixAndApprove}
        onApprove={onApprove}
        onReject={onReject}
      /> : doc.status === 'approved' ? <div className="p-3"><Btn onClick={()=>openRecord(`DATA-${doc.id}`)}>View saved record</Btn></div> : null}
    </div>
  );
}
