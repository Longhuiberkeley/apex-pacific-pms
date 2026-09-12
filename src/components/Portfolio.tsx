import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useStore, CASH_YTD } from '../lib/store';
import { bookTotal, validateBook, weightedYtd } from '../lib/rules';
import { NAV_USD } from '../data/seed';
import type { Fund } from '../lib/types';
import { Badge, Bar, Btn, Card } from './Ui';
import { cn } from '../lib/cn';
import { ModeBadge } from './WorkMode';

const RULE_LABEL: Record<string, string> = {
  A: 'Rule A — single name ≤ $35.6M (25%)',
  B: 'Rule B — Equity-hedge sleeve ≤ $49.9M (35%)',
  C: 'Rule C — liquidity reserve ≥ $14.3M (10%)',
  D: 'Rule D — Σ dollars = NAV $142.5M',
  E: 'Rule E — NAV stale > 30d → ≤ $7.1M (5%)',
};

function usdOf(wt: number) {
  return (wt / 100) * NAV_USD;
}
function compactUsd(n: number) {
  return `$${(n / 1e6).toFixed(1)}M`;
}

function MoneyDelta({ from, to }: { from: number; to: number }) {
  const d = to - from;
  if (Math.abs(d) < 500) return <span className="font-mono text-[12px] text-muted">—</span>;
  const up = d > 0;
  return (
    <span className={cn('font-mono text-[12px] font-medium tabular-nums', up ? 'text-wait' : 'text-ai')}>
      {up ? '▲' : '▼'} {compactUsd(Math.abs(d))}
    </span>
  );
}

function DollarsCell({ usd, pct, hot, onCommit }: { usd: number; pct: number; hot?: boolean; onCommit: (n: number) => void }) {
  const [raw, setRaw] = useState(String(Math.round(usd)));
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (!focus) setRaw(String(Math.round(usd)));
  }, [usd, focus]);
  const commit = () => {
    const n = Number(String(raw).replace(/[$,\s]/g, ''));
    if (Number.isFinite(n)) onCommit(n);
    else setRaw(String(Math.round(usd)));
    setFocus(false);
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn('inline-flex items-center gap-0.5 font-mono text-[13px] tabular-nums', hot ? 'text-stop' : 'text-ink')}>
        <span className="text-muted">$</span>
        <input
          value={focus ? raw : Math.round(usd).toLocaleString('en-US')}
          onFocus={() => {
            setFocus(true);
            setRaw(String(Math.round(usd)));
          }}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className={cn(
            'w-[9.5rem] rounded border border-line bg-surface px-1.5 py-1 outline-none hover:border-line2 focus:border-ai focus:shadow-[0_0_0_2px_rgb(33_82_199/0.18)]',
            hot ? 'text-stop' : 'text-ink'
          )}
          title="cash absorbs the residual — Σ stays 100.0"
        />
      </span>
      <span className="font-mono text-[12px] tabular-nums text-muted">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default function Portfolio() {
  const funds = useStore((s) => s.funds);
  const book = useStore((s) => s.book);
  const staged = useStore((s) => s.staged);
  const gateOpen = useStore((s) => s.gateOpen);
  const identity = useStore((s) => s.identity);
  const setDollars = useStore((s) => s.setDollars);
  const clearStage = useStore((s) => s.clearStage);
  const approveGate = useStore((s) => s.approveGate);
  const stage = useStore((s) => s.stage);
  const pushAudit = useStore((s) => s.pushAudit);
  const emitCmd = useStore((s) => s.emitCmd);
  const openFund = useStore((s) => s.openFund);
  const pasteAgentProposal = useStore((s) => s.pasteAgentProposal);

  const live = staged ?? book;
  const viol = useMemo(() => validateBook(live, funds), [live, funds]);
  const fails = new Set(viol.map((v) => v.rule));
  const total = bookTotal(live);
  const ytd = weightedYtd(live, funds, CASH_YTD);

  const columnHelper = createColumnHelper<Fund>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Fund',
        cell: (info) => {
          const f = info.row.original;
          return (
            <div className="min-w-[220px]">
              <button
                onClick={() => openFund(f.id)}
                className="text-left text-[13px] font-semibold text-ink transition-colors hover:text-ai hover:underline decoration-dotted"
                title="open fund"
              >
                {f.name}
              </button>
              <div className="mt-0.5 font-mono text-[12px] text-muted">{f.id} · {f.sleeve}</div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'usd',
        header: staged ? '$ proposed' : '$ committed',
        cell: ({ row }) => {
          const f = row.original;
          const w = live[f.id] ?? 0;
          const hot = fails.has('A') && w > 25;
          return <DollarsCell usd={usdOf(w)} pct={w} hot={hot} onCommit={(n) => setDollars(f.id, n)} />;
        },
      }),
      columnHelper.display({
        id: 'delta',
        header: 'Δ staged',
        cell: ({ row }) => {
          const id = row.original.id;
          if (!staged) return <span className="font-mono text-[12px] text-muted">—</span>;
          return <MoneyDelta from={usdOf(book[id] ?? 0)} to={usdOf(staged[id] ?? 0)} />;
        },
      }),
      columnHelper.accessor('ytd', {
        header: 'YTD',
        cell: (info) => (
          <span className={cn('font-mono text-[12px] tabular-nums', info.getValue() < 0 ? 'text-stop' : 'text-ink')}>
            {info.getValue() >= 0 ? '+' : ''}{info.getValue().toFixed(1)}%
          </span>
        ),
      }),
      columnHelper.display({
        id: 'contrib',
        header: 'Contrib',
        cell: ({ row }) => {
          const f = row.original;
          const c = ((live[f.id] ?? 0) * f.ytd) / 100;
          return <span className="font-mono text-[12px] tabular-nums text-ink">+{c.toFixed(2)}pp</span>;
        },
      }),
    ],
    [live, staged, book, fails, setDollars, openFund]
  );

  const table = useReactTable({ data: funds, columns, getCoreRowModel: getCoreRowModel() });

  const stageProposal = () => {
    stage(live);
    pushAudit('YOU', 'staged proposal — IC gate opened', '', 'PORT');
    emitCmd('book stage --from=edit', 'form');
    toast.success('staged — IC gate open');
  };

  const cashWt = live.CASH ?? 0;
  const cashUsd = usdOf(cashWt);

  return (
    <div className="space-y-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h1 className="text-[20px] font-semibold text-ink">Book</h1><ModeBadge mode="deterministic" /></div>

      <Card
        title={staged ? 'Proposed dollars — awaiting PM signature' : 'Committed dollars'}
        sub={`NAV ${compactUsd(NAV_USD)} · YTD +${ytd.toFixed(2)}pp · Σ ${total.toFixed(1)}%`}
        right={
          staged ? <Badge tone="amber">Staged — IC gate open</Badge> : <Badge tone="emerald">Committed</Badge>
        }
      >
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="h-10 border-b border-line bg-paper px-3 text-left text-[12px] font-medium text-muted">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="h-10 transition-colors hover:bg-paper">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-10 border-b border-line px-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-paper">
                <td className="px-3 py-2 text-[13px] text-muted">Cash and liquidity sleeve</td>
                <td className="px-3 py-2">
                  <div className="flex min-w-[220px] items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{compactUsd(cashUsd)}</span>
                    <span className="font-mono text-[12px] tabular-nums text-muted">{cashWt.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-[92px]"><Bar pct={((cashWt) / 28) * 100} tone={fails.has('C') ? 'crimson' : 'emerald'} /></div>
                    <span className="text-[12px] text-muted">absorbs residual</span>
                  </div>
                </td>
                <td className="px-3 py-2">{staged ? <MoneyDelta from={usdOf(book.CASH ?? 0)} to={usdOf(staged.CASH ?? 0)} /> : <span className="font-mono text-[12px] text-muted">—</span>}</td>
                <td className="px-3 py-2 font-mono text-[12px] tabular-nums text-muted">+{CASH_YTD.toFixed(1)}%</td>
                <td className="px-3 py-2 font-mono text-[12px] tabular-nums text-ink">+{((cashWt * CASH_YTD) / 100).toFixed(2)}pp</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* A–E verdict strip — the book's own footer, live, deterministic */}
        <div className="mt-4 rounded-lg border border-line bg-paper p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted">Rules A–E</span>
            <div className="flex flex-wrap gap-1.5">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((r) => (
                <span
                  key={r}
                  title={RULE_LABEL[r]}
                  className={cn(
                    'cursor-help rounded px-2 py-1 font-mono text-[12px] font-medium tabular-nums',
                    fails.has(r) ? 'bg-stop/10 text-stop' : 'bg-pass/10 text-pass'
                  )}
                >
                  {r} {fails.has(r) ? 'Fail' : 'Pass'}
                </span>
              ))}
            </div>
          </div>

          <div className={cn('mt-2.5 whitespace-pre-wrap rounded-md border p-3 font-mono text-[12px] leading-relaxed', viol.length ? 'border-stop/40 bg-stop/10 text-stop' : 'border-pass/40 bg-pass/10 text-pass')}>
            {viol.length
              ? `BLOCKED\n${viol.map((v) => v.msg).join('\n')}`
              : `Validated — NAV $142.5M · A–E pass`}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {!staged ? (
              <Btn tone="emerald" onClick={stageProposal}>Stage proposal</Btn>
            ) : (
              <>
                <Btn tone="emerald" onClick={approveGate} disabled={viol.length > 0 || identity?.role !== 'PM'}>Approve — IC {identity?.role !== 'PM' ? '(PM only)' : ''}</Btn>
                <Btn onClick={clearStage}>Discard</Btn>
              </>
            )}
            <Btn size="sm" onClick={() => pasteAgentProposal('form')}>Paste agent proposal</Btn>
            {gateOpen && viol.length === 0 && <span className="text-[12px] text-pass">Gate open — PM signature commits</span>}
            {gateOpen && viol.length > 0 && <span className="text-[12px] text-stop">Gate held — fix the red rows or discard</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}
