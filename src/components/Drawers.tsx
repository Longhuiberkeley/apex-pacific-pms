import { Printer } from 'lucide-react';
import { useStore } from '../lib/store';
import { Btn, Sheet } from './Ui';
import type { AuditEntry } from '../lib/types';
import { plainText } from '../lib/language';
import Activity from './Activity';
export function EntityAudit(){
 const s=useStore();return <Sheet open={!!s.entityAudit} onClose={()=>s.setEntityAudit(null)} title="Fund activity" width="w-[680px]"><div className="p-5"><Activity fundId={s.entityAudit?.id}/></div></Sheet>;
}
export function AuditDrawer(){
 const s=useStore();return <Sheet open={s.auditOpen} onClose={()=>s.setAudit(false)} title="Activity across funds" width="w-[720px]" right={<Btn size="sm" onClick={()=>s.setDdq(true)}>Export controls summary</Btn>}><div className="p-5"><Activity/><details className="mt-6 rounded border border-line p-4"><summary className="cursor-pointer text-sm">Approved reports</summary>{s.ledger.map(l=><div key={l.rid} className="mt-3 border-t border-line pt-3 text-sm"><p>{plainText(l.title)}</p><p className="mt-1 text-xs text-muted">{l.by} · {l.ts}</p><details className="mt-2"><summary className="text-xs text-muted">Technical reference</summary><code className="text-xs">{l.rid} · {l.wid}</code></details></div>)}</details></div></Sheet>;
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
      title="Operational controls summary"
      sub="Generated from recorded activity · print or save as PDF"
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

        <h4 className="mt-4 text-[13px] font-semibold text-ink">7.1 Portfolio limits</h4>
        <p className="mt-1">Five portfolio checks cover individual fund allocations, strategy exposure, cash reserves, total allocations, and outdated NAVs. They run when a proposal is prepared and again before approval.</p>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.2 Action attribution</h4>
        <table className="mt-1 w-full border-collapse font-mono text-[12px] text-ink">
          <tbody>
            <tr className="border-b border-line"><td className="py-1 pr-4">Team member actions</td><td className="py-1 text-right tabular-nums">{byActor('YOU')}</td></tr>
            <tr className="border-b border-line"><td className="py-1 pr-4">AI assistant actions</td><td className="py-1 text-right tabular-nums">{byActor('AGENT')}</td></tr>
            <tr><td className="py-1 pr-4">Automatic system actions</td><td className="py-1 text-right tabular-nums">{byActor('ENGINE')}</td></tr>
          </tbody>
        </table>
        <p className="mt-1 text-[12px] text-muted">Agents can add candidates, submit research and propose allocations. People review the evidence and make the final decisions.</p>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.3 Recorded diligence decisions</h4>
        <div className="mt-1 space-y-1">
          {Object.values(ddVerdicts).map((v) => (
            <div key={v.vid} className="font-mono text-[12px] text-ink">
              <span className="text-pass">{v.vid}</span> {funds.find((f) => f.id === v.fundId)?.name ?? v.fundId} — <b>{plainText(v.state)}</b> · flags [{plainText(v.flags.join(', ')) || 'None'}] · {v.signer} ({v.role}) · {v.ts}
            </div>
          ))}
        </div>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.4 Approved reports</h4>
        <div className="mt-1 space-y-1">
          {ledger.map((l) => (
            <div key={l.rid} className="font-mono text-[12px] text-ink"><span className="text-pass">{l.rid}</span> {plainText(l.title)} · {l.by} · {l.ts}</div>
          ))}
        </div>

        <h4 className="mt-3 text-[13px] font-semibold text-ink">7.5 Trail integrity</h4>
        <p className="mt-1 text-ink">Each of the {audit.length} trail entries carries a checksum chained over the preceding entry ({audit[0]?.h} … {audit[audit.length - 1]?.h}).</p>
      </div>
    </Sheet>
  );
}
