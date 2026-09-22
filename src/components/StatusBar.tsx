import { useStore, openApprovals, worstNav, CASH_YTD } from '../lib/store';
import { weightedYtd } from '../lib/rules';
import { NAV_USD } from '../data/seed';

export default function StatusBar() {
  const funds = useStore((s) => s.funds);
  const book = useStore((s) => s.book);
  const staged = useStore((s) => s.staged);
  const queue = useStore((s) => s.queue);
  const docs = useStore((s) => s.docs);
  const trigAssessed = useStore((s) => s.trigAssessed);
  const gateOpen = useStore((s) => s.gateOpen);
  const setView = useStore((s) => s.setView);
  const openFund = useStore((s) => s.openFund);

  const live = book;
  const ytd = weightedYtd(live, funds, CASH_YTD);
  const cashPct = live.CASH ?? 0;
  const cashUsd = (cashPct / 100) * NAV_USD;
  const approvals = openApprovals({ queue, trigAssessed, gateOpen, docs });
  const w = worstNav(funds);
  const sable = funds.find((f) => f.id === 'SAB');

  const sep = <span className="text-line2">·</span>;

  return (
    <div className="flex h-8 shrink-0 items-center gap-2.5 overflow-x-auto border-b border-line bg-surface px-4 text-[12px] text-ink">
      <span>
        NAV <span className="font-mono tabular-nums">${(NAV_USD / 1e6).toFixed(1)}M</span>
      </span>
      {sep}
      <span>
        YTD <span className="font-mono tabular-nums text-ink">+{ytd.toFixed(1)}%</span>
      </span>
      {sep}
      <span>
        Cash <span className="font-mono tabular-nums">${(cashUsd / 1e6).toFixed(1)}M</span>{' '}
        <span className="font-mono tabular-nums text-muted">({cashPct.toFixed(1)}%)</span>
      </span>
      {sep}
      <button onClick={() => setView('today')} className="hover:underline">
        Awaiting review <span className="font-mono tabular-nums">{approvals}</span>
      </button>
      {sep}
      <button onClick={() => openFund(sable?.id ?? 'SAB')} className="hover:underline">
        Oldest NAV <span className="font-mono tabular-nums">{w.age}d</span> {w.name.split(' ')[0]}
      </button>
    </div>
  );
}
