import { useEffect, useRef } from 'react';
import type { DocRecord } from '../lib/types';
import { cn } from '../lib/cn';

function Hl({
  k,
  active,
  onAct,
  children,
}: {
  k: string;
  active: boolean;
  onAct: (k: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span
      data-field={k}
      onClick={(e) => {
        e.stopPropagation();
        onAct(k);
      }}
      onMouseEnter={() => onAct(k)}
      className="relative inline cursor-pointer"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-x-0.5 -inset-y-px"
        style={{
          background: active ? 'rgba(33,82,199,0.32)' : 'rgba(33,82,199,0.18)',
          borderBottom: '2px solid #2152C7',
          borderLeft: active ? '2px solid #2152C7' : '2px solid transparent',
        }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

function Paper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[612px] max-w-full border border-line bg-[#FFFEFA] px-10 py-8 text-[13px] leading-relaxed text-ink shadow-card',
        className
      )}
    >
      {children}
    </div>
  );
}

function HalNav({ active, onAct }: { active: string | null; onAct: (k: string) => void }) {
  const H = (k: string, children: React.ReactNode) => (
    <Hl k={k} active={active === k} onAct={onAct}>
      {children}
    </Hl>
  );
  return (
    <Paper>
      <div className="flex items-start justify-between border-b border-ink/20 pb-3">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Harborline</div>
          <div className="text-[12px] text-muted">Fund Administration</div>
        </div>
        <div className="text-right text-[12px] text-muted">
          <div>NAV statement</div>
          <div>Confidential</div>
        </div>
      </div>
      <div className="mt-5 space-y-1.5">
        <div>
          Fund{' '}
          {H('fund_id', <span className="font-medium">Halcyon Event-Driven Credit</span>)}
        </div>
        <div>
          Share class <span className="font-medium">Apex Pacific ARF</span>
        </div>
        <div>
          Valuation date {H('as_of', <span className="font-mono tabular-nums">31 August 2026</span>)}
        </div>
      </div>
      <table className="mt-5 w-full text-[13px]">
        <tbody>
          <tr className="border-t border-line">
            <td className="py-2">Net asset value</td>
            <td className="py-2 text-right font-mono tabular-nums">
              {H('nav_usd', '$17,100,000')}
            </td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-2">Management fee charged</td>
            <td className="py-2 text-right font-mono tabular-nums">
              {H('fee_charged_pct', '0.15%')}
            </td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-2 text-muted">Fee per LPA</td>
            <td className="py-2 text-right font-mono tabular-nums text-muted">
              {H('fee_expected_pct', '0.12%')}
            </td>
          </tr>
          <tr className="border-t border-line">
            <td className="py-2">Fee delta (rails)</td>
            <td className="py-2 text-right font-mono tabular-nums">
              {H('fee_delta_usd', '−$27,360')}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-6 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
        <div className="mb-1 font-medium text-ink">Notes</div>
        <p>
          4.{' '}
          {H(
            'restatement_pp',
            <>July NAV restated −0.8pp after final pricing</>
          )}
          ; fee accrual recomputed.
        </p>
      </div>
    </Paper>
  );
}

function PfsInvoice({ active, onAct }: { active: string | null; onAct: (k: string) => void }) {
  const H = (k: string, children: React.ReactNode) => (
    <Hl k={k} active={active === k} onAct={onAct}>
      {children}
    </Hl>
  );
  return (
    <Paper>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[15px] font-semibold">{H('vendor', 'Pacific Fund Services Ltd')}</div>
          <div className="mt-0.5 text-[12px] text-muted">Fund administration</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-muted">Invoice</div>
          <div className="font-mono text-[13px] tabular-nums">{H('invoice_no', 'PFS-2026-0944')}</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          Date <span className="font-mono tabular-nums">1 Sep 2026</span>
        </div>
        <div>
          Due {H('due', <span className="font-mono tabular-nums">30 Sep 2026</span>)}
        </div>
      </div>
      <div className="mt-4 text-[13px]">
        Bill to {H('entity', <span className="font-medium">Apex Pacific Absolute Return Fund</span>)}
      </div>
      <table className="mt-5 w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[12px] text-muted">
            <th className="py-1.5 font-medium">Description</th>
            <th className="py-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-2">
              Q3 2026 {H('gl_code', 'fund administration')}
            </td>
            <td className="py-2 text-right font-mono tabular-nums">{H('amount_usd', '$48,750.00')}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-4 text-[12px] text-muted">
        Memo: Includes restatement processing ({H('alloc_fund_id', 'Halcyon')}).
      </p>
      <div className="mt-5 flex justify-end border-t border-ink/20 pt-3">
        <div className="text-right">
          <div className="text-[12px] text-muted">Amount due</div>
          <div className="font-mono text-[15px] font-semibold tabular-nums">$48,750.00</div>
        </div>
      </div>
    </Paper>
  );
}

function MeridianMail({ active, onAct }: { active: string | null; onAct: (k: string) => void }) {
  const H = (k: string, children: React.ReactNode) => (
    <Hl k={k} active={active === k} onAct={onAct}>
      {children}
    </Hl>
  );
  return (
    <Paper className="px-0 py-0">
      <div className="border-b border-line bg-paper px-6 py-3 text-[12px]">
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-muted">From</span>
          <span>{H('fund_id', 'ops@meridianam.example')}</span>
        </div>
        <div className="mt-1 flex gap-2">
          <span className="w-14 shrink-0 text-muted">Subject</span>
          <span className="font-medium">Quick confirm on this week statement</span>
        </div>
      </div>
      <div className="px-6 py-5 text-[13px] leading-relaxed">
        Quick confirm on {H('as_of', 'this week')} statement: we are showing{' '}
        {H('aapl_qty', '12,500')} AAPL marked at {H('aapl_px', '201.30')}, cash sits at{' '}
        {H('cash_usd', '3.42M')}, and the {H('fee_charged_pct', '0.15%')} management fee looks off — we
        had {H('fee_expected_pct', '0.12%')} last month. There are also {H('fx_lines', 'two FX lines')} I
        did not expect.
        <span className="mt-3 block text-[12px] text-muted">
          {H('flags', 'fee_delta, unexpected_fx')}
        </span>
      </div>
    </Paper>
  );
}

export default function DocOriginal({
  doc,
  activeKey,
  onActivate,
}: {
  doc: DocRecord;
  activeKey: string | null;
  onActivate: (k: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeKey || !root.current) return;
    root.current
      .querySelector(`[data-field="${activeKey}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeKey]);

  return (
    <div ref={root} className="flex justify-center">
      {doc.id === 'hal-nav-08' && <HalNav active={activeKey} onAct={onActivate} />}
      {doc.id === 'inv-pfs-q3' && <PfsInvoice active={activeKey} onAct={onActivate} />}
      {doc.id === 'eml-mer-0807' && <MeridianMail active={activeKey} onAct={onActivate} />}
    </div>
  );
}
