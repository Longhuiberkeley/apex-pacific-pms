import { useState } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { useStore } from '../lib/store';
import { Badge, Btn, Sheet } from './Ui';
import { cn } from '../lib/cn';
import type { AuditEntry } from '../lib/types';

const ACTORS: Array<AuditEntry['actor'] | 'ALL'> = ['ALL', 'YOU', 'AGENT', 'ENGINE'];

/** per-row slice of the trail — opened from a row's "last event" line */
export function EntityAudit() {
  const entity = useStore((s) => s.entityAudit);
  const setEntityAudit = useStore((s) => s.setEntityAudit);
  const audit = useStore((s) => s.audit);
  const ddVerdicts = useStore((s) => s.ddVerdicts);
  const funds = useStore((s) => s.funds);

  const rows = entity ? audit.filter((a) => a.tag === entity.id) : [];
  const verdict = entity ? ddVerdicts[entity.id] : undefined;
  const fund = entity ? funds.find((f) => f.id === entity.id) : undefined;

  return (
    <Sheet
      open={!!entity}
      onClose={() => setEntityAudit(null)}
      title={`Trail — ${entity?.label ?? ''}`}
      sub={entity ? `tag ${entity.id} · ${rows.length} attributed ${rows.length === 1 ? 'entry' : 'entries'}` : ''}
      width="w-[440px]"
    >
      <div>
        {verdict && (
          <div className="m-3 rounded-lg border border-pass/30 bg-pass/[0.06] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald">Filed verdict {verdict.vid}</Badge>
              <span className="font-mono text-[12px] text-ink">{verdict.state} · flags [{verdict.flags.join(', ') || '—'}]</span>
            </div>
            <p className="mt-1 text-[13px] text-ink">“{verdict.note}”</p>
            <p className="mt-1 font-mono text-[12px] text-muted">{verdict.signer} ({verdict.role}) · {verdict.ts}</p>
          </div>
        )}
        {rows.length === 0 && (
          <p className="px-4 py-6 text-center text-[12px] text-muted">
            no entries yet{fund ? ' — this row&rsquo;s first touch lands here' : ''}
          </p>
        )}
        {[...rows].reverse().map((a, i) => (
          <div key={`${a.t}-${i}`} className="border-b border-dashed border-line/70 px-4 py-2 transition-colors hover:bg-paper">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[12px] tabular-nums text-muted">{a.t}</span>
              <Badge tone={a.actor === 'YOU' ? 'emerald' : a.actor === 'AGENT' ? 'blue' : 'slate'}>{a.actor}</Badge>
              <span className="min-w-0 flex-1 text-[12px] leading-snug">{a.action}</span>
              <span className="font-mono shrink-0 text-[11px] tabular-nums text-muted">#{a.h}</span>
            </div>
            {a.detail && <div className="mt-0.5 pl-[76px] font-mono text-[12px] leading-snug text-muted">{a.detail}</div>}
          </div>
        ))}
        <div className="border-t border-line px-4 py-2 text-[12px] text-muted">
          This row&rsquo;s slice of the trail — the whole thing lives in Audit
        </div>
      </div>
    </Sheet>
  );
}

export function AuditDrawer() {
  const open = useStore((s) => s.auditOpen);
  const setAudit = useStore((s) => s.setAudit);
  const audit = useStore((s) => s.audit);
  const ledger = useStore((s) => s.ledger);
  const setDdq = useStore((s) => s.setDdq);
  const [filter, setFilter] = useState<(typeof ACTORS)[number]>('ALL');

  const shown = filter === 'ALL' ? audit : audit.filter((a) => a.actor === filter);

  return (
    <Sheet
      open={open}
      onClose={() => setAudit(false)}
      title="Audit trail"
      width="w-[480px]"
      right={
        <Btn size="xs" onClick={() => setDdq(true)}><FileDown size={11} /> LP DDQ §7</Btn>
      }
    >
      <div className="border-b border-line px-4 py-2.5">
        <div className="text-[12px] text-muted">Report register</div>
        {ledger.length === 0 ? (
          <p className="py-2 text-[12px] text-muted">No signed reports yet.</p>
        ) : ledger.map((l) => (
          <div key={l.rid} className="flex flex-wrap items-baseline gap-2 border-b border-dashed border-line py-1.5 text-[12px] last:border-0">
            <span className="font-mono text-pass">{l.rid}</span>
            <span className="min-w-0 flex-1 truncate" title={l.title}>{l.title}</span>
            <span className="font-mono text-[12px] tabular-nums text-muted">{l.wid} · {l.by} · {l.ts}</span>
          </div>
        ))}
      </div>

      <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b border-line bg-paper px-4 py-2">
        {ACTORS.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={cn(
              'rounded border px-2.5 py-0.5 text-[12px] font-medium transition-colors',
              filter === a
                ? a === 'YOU' ? 'border-pass/50 bg-pass/10 text-pass' : a === 'AGENT' ? 'border-ai/50 bg-ai/10 text-ai' : a === 'ENGINE' ? 'border-line bg-surface text-ink' : 'border-ink/20 bg-surface text-ink'
                : 'border-line text-muted hover:text-ink'
            )}
          >
            {a}
          </button>
        ))}
        <span className="ml-auto font-mono text-[12px] tabular-nums text-muted">{shown.length} / {audit.length}</span>
      </div>

      <div>
        {[...shown].reverse().map((a, i) => (
          <div key={`${a.t}-${i}`} className="border-b border-dashed border-line/70 px-4 py-2 transition-colors hover:bg-paper">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[12px] tabular-nums text-muted">{a.t}</span>
              <Badge tone={a.actor === 'YOU' ? 'emerald' : a.actor === 'AGENT' ? 'blue' : 'slate'}>{a.actor}</Badge>
              <span className="min-w-0 flex-1 text-[12px] leading-snug">{a.action}</span>
              <span className="font-mono shrink-0 text-[11px] tabular-nums text-muted" title="checksum">#{a.h}</span>
            </div>
            {a.detail && <div className="mt-0.5 pl-[76px] font-mono text-[12px] leading-snug text-muted">{a.detail}</div>}
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-2 text-[12px] text-muted">Demo-grade checksum — tamper-evidence, not crypto.</div>
    </Sheet>
  );
}

export function DdqExport() {
  const open = useStore((s) => s.ddqOpen);
  const setDdq = useStore((s) => s.setDdq);
  const audit = useStore((s) => s.audit);
  const ledger = useStore((s) => s.ledger);
  const ddVerdicts = useStore((s) => s.ddVerdicts);
  const funds = useStore((s) => s.funds);

  const byActor = (a: AuditEntry['actor']) => audit.filter((x) => x.actor === a).length;

  return (
    <Sheet
      open={open}
      onClose={() => setDdq(false)}
      title="LP DDQ §7 — operational controls export"
      sub="generated from the live trail · print or save as PDF"
      width="w-[640px]"
      footer={
        <>
          <Btn tone="emerald" onClick={() => window.print()}><Printer size={12} /> print / save PDF</Btn>
          <Btn onClick={() => setDdq(false)}>close</Btn>
        </>
      }
    >
      <div id="ddq-sheet" className="bg-white p-5 text-[12px] leading-relaxed text-ink">
        <h3 className="text-[15px] font-semibold text-ink">Section 7 — Operational Controls &amp; Auditability</h3>
        <p className="mt-0.5 font-mono text-[12px] text-muted">Apex Pacific Absolute Return Fund · as of 2026-09-07 · generated {new Date().toISOString().slice(0, 10)}</p>

        <h4 className="mt-4 text-[13px] font-semibold text-ink">7.1 Deterministic invariants</h4>
        <p className="mt-1">Five portfolio invariants (single-name cap, sleeve cap, liquidity floor, book-total identity, staleness cap) are enforced in code at stage and again at commit.</p>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.2 Action attribution</h4>
        <table className="mt-1 w-full border-collapse font-mono text-[12px] text-ink">
          <tbody>
            <tr className="border-b border-line"><td className="py-1 pr-4">human actions (YOU)</td><td className="py-1 text-right tabular-nums">{byActor('YOU')}</td></tr>
            <tr className="border-b border-line"><td className="py-1 pr-4">agent actions (AGENT)</td><td className="py-1 text-right tabular-nums">{byActor('AGENT')}</td></tr>
            <tr><td className="py-1 pr-4">engine actions (ENGINE)</td><td className="py-1 text-right tabular-nums">{byActor('ENGINE')}</td></tr>
          </tbody>
        </table>
        <p className="mt-1 text-[12px] text-muted">Agents may add intake and stage proposals; triage, weights, packs, verdicts and approvals are human-only and technically gated.</p>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.3 Signed diligence verdicts</h4>
        <div className="mt-1 space-y-1">
          {Object.values(ddVerdicts).map((v) => (
            <div key={v.vid} className="font-mono text-[12px] text-ink">
              <span className="text-pass">{v.vid}</span> {funds.find((f) => f.id === v.fundId)?.name ?? v.fundId} — <b>{v.state}</b> · flags [{v.flags.join(', ') || '—'}] · {v.signer} ({v.role}) · {v.ts}
            </div>
          ))}
        </div>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.4 Report register</h4>
        <div className="mt-1 space-y-1">
          {ledger.map((l) => (
            <div key={l.rid} className="font-mono text-[12px] text-ink"><span className="text-pass">{l.rid}</span> {l.title} · {l.by} · {l.ts}</div>
          ))}
        </div>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.5 Trail integrity</h4>
        <p className="mt-1 text-ink">Each of the {audit.length} trail entries carries a checksum chained over the preceding entry ({audit[0]?.h} … {audit[audit.length - 1]?.h}).</p>
      </div>
    </Sheet>
  );
}
