import { useStore } from '../lib/store';
import { DD_CHECKS } from '../lib/dd';
import { Badge, Sheet } from './Ui';
import WorkModes from './WorkMode';

function Status({ live }: { live: boolean }) {
  return live
    ? <Badge tone="slate">Live</Badge>
    : <Badge tone="slate">Slot</Badge>;
}

export default function ModulesSheet() {
  const open = useStore((s) => s.modulesOpen);
  const setModules = useStore((s) => s.setModules);
  const intakePolicy = useStore((s) => s.intakePolicy);
  const setIntakePolicy = useStore((s) => s.setIntakePolicy);
  const funds = useStore((s) => s.funds);
  const docs = useStore((s) => s.docs);
  const capitalNotes = useStore((s) => s.capitalNotes);

  const hal = funds.find((f) => f.id === 'HAL');
  const feeDelta = docs.find((d) => d.id === 'hal-nav-08')?.fields.find((f) => f.key === 'fee_delta_usd');

  return (
    <Sheet open={open} onClose={() => setModules(false)} title="Modules" width="w-[480px]">
      <div className="divide-y divide-line">
        <div className="p-4"><h3 className="mb-3 text-[15px] font-semibold">One platform, three ways to work</h3><WorkModes /><p className="mt-3 text-[12px] leading-relaxed text-muted">Team assignments accept agent submissions through the portal or local CLI. Records and rules are shared with the human interface.</p></div>
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-ink">Book and Rules A–E</div>
            <div className="mt-0.5 text-[12px] text-muted">Invariants in code.</div>
          </div>
          <Status live />
        </div>

        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">Diligence checks</div>
              <div className="mt-0.5 text-[12px] text-muted">CHK-01..10</div>
            </div>
            <Status live />
          </div>
          <div className="mt-2 overflow-hidden rounded border border-line bg-surface">
            {DD_CHECKS.map((c) => (
              <div key={c.id} className="flex items-center gap-2 border-b border-line px-2.5 py-1.5">
                <span className="w-[4.2rem] shrink-0 font-mono text-[12px] tabular-nums text-muted">{c.id}</span>
                <span className="text-[12px] text-ink">{c.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-paper px-2.5 py-1.5 opacity-50" aria-disabled="true">
              <span className="w-[4.2rem] shrink-0 font-mono text-[12px] tabular-nums">CHK-11</span>
              <span className="text-[12px]">Vacant</span>
            </div>
          </div>
          <p className="mt-1.5 text-[12px] text-muted">Checks are data. Add one without changing the app.</p>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">Documents intake</div>
              <div className="mt-0.5 text-[12px] text-muted">AUTO / MANUAL policy.</div>
            </div>
            <Status live />
          </div>
          <button
            onClick={() => setIntakePolicy(intakePolicy === 'AUTO' ? 'MANUAL' : 'AUTO')}
            className="mt-2 rounded border border-line bg-surface px-2 py-1 text-[12px] text-ink hover:bg-paper"
          >
            Policy {intakePolicy}
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">Capital instructions</div>
              <div className="mt-0.5 text-[12px] text-muted">90-day clock.</div>
            </div>
            <Status live />
          </div>
          {capitalNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              {capitalNotes.map((n, i) => (
                <div key={i} className="rounded border border-line bg-paper px-2.5 py-1.5 font-mono text-[12px] leading-snug text-ink">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">Fee comparison</div>
              <div className="mt-0.5 text-[12px] text-muted">Same-period rate comparison in code. Full accrual engine is a future module.</div>
            </div>
            <Status live />
          </div>
          {hal && (
            <div className="mt-2 rounded border border-line bg-paper p-2.5">
              <div className="text-[12px] text-ink">{hal.name}</div>
              <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-[12px] tabular-nums">
                <span className="text-muted">fee_delta_usd</span>
                <span className="text-ink">{feeDelta ? String(feeDelta.value) : '—'}</span>
              </div>
            </div>
          )}
          <pre className="mt-2 whitespace-pre-wrap rounded border border-dashed border-line bg-paper px-3 py-2 font-mono text-[12px] text-muted">NAV × (expected % − charged %) / 100</pre>
        </div>

        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">LP portal</div>
              <div className="mt-0.5 text-[12px] text-muted">Same fund record, not built.</div>
            </div>
            <Status live={false} />
          </div>
          <div className="mt-2 space-y-0.5">
            {funds.map((f) => (
              <div key={f.id} className="flex items-baseline justify-between gap-2 text-[12px] text-muted">
                <span>{f.name}</span>
                <span className="font-mono tabular-nums">{f.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
