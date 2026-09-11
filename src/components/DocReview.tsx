import { useEffect, useState } from 'react';
import { ChevronDown, FileText, Mail } from 'lucide-react';
import type { DocRecord } from '../lib/types';
import { domainOf, firstWeakRequired, fromName } from '../lib/docs';
import { cn } from '../lib/cn';
import DocOriginal from './DocOriginal';
import HitlTriad from './HitlTriad';

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
  const Icon = doc.kind === 'email' ? Mail : FileText;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon size={14} className="shrink-0 text-muted" />
              <h2 className="text-[15px] font-semibold text-ink">{doc.title}</h2>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
              <span>{fromName(doc.from)}</span>
              {domain && (
                <>
                  <span className="text-line2">·</span>
                  <span>
                    {domain} <span className="text-pass">verified</span>
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

      <div className="flex min-h-0 flex-1">
        <div className="w-[55%] overflow-auto border-r border-line bg-paper p-4">
          <DocOriginal doc={doc} activeKey={active} onActivate={setActive} />
        </div>
        <div className="flex w-[45%] min-w-0 flex-col overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[12px] text-muted">
                <th className="h-10 bg-paper px-3 font-medium">Field</th>
                <th className="h-10 bg-paper px-3 font-medium">Value</th>
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
                      <div className="text-ink">{f.label}</div>
                      {f.required && f.conf < 0.85 && !human && (
                        <div className="text-[12px] text-stop">Required</div>
                      )}
                    </td>
                    <td className="h-10 px-2 align-middle">
                      <input
                        data-field-input={f.key}
                        value={String(f.value)}
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
                        {human ? 'human' : f.conf.toFixed(2)}
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

      <HitlTriad
        hotkeys
        wantReject={wantReject}
        onWantRejectConsumed={onWantRejectConsumed}
        onFix={fixAndApprove}
        onApprove={onApprove}
        onReject={onReject}
      />
    </div>
  );
}
