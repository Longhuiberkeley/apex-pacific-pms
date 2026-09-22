import { canReadWork } from '../lib/records';
import { useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { useStore, openApprovals } from '../lib/store';
import { ddState } from '../lib/dd';
import { cn } from '../lib/cn';
import { Tip } from './Ui';

function Logo({ size = 22, onPaper = false }: { size?: number; onPaper?: boolean }) {
  const stroke = onPaper ? '#1B2430' : '#F6F3EC';
  const fill = onPaper ? '#1B2430' : '#F6F3EC';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect x="3" y="3" width="26" height="26" rx="2" fill="none" stroke={stroke} strokeWidth="1.4" />
      <path d="M10 24 L16 8 L22 24" fill="none" stroke={fill} strokeWidth="1.8" />
      <path d="M12.4 18 H19.6" stroke={fill} strokeWidth="1.6" />
    </svg>
  );
}
export { Logo };

function StatusDots({ id }: { id: string }) {
  const s = ddState(id).s;
  if (s === 'OVERDUE') {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label="overdue">
        <span className="h-1.5 w-1.5 rounded-full bg-stop" />
        <span className="h-1.5 w-1.5 rounded-full bg-stop" />
      </span>
    );
  }
  if (s === 'ATTENTION') {
    return (
      <span className="inline-flex items-center" aria-label="attention">
        <span className="h-1.5 w-1.5 rounded-full bg-wait" />
      </span>
    );
  }
  return <span className="inline-block h-1.5 w-1.5" />;
}

export default function Rail() {
  const identity = useStore((s) => s.identity);
  const logout = useStore((s) => s.logout);
  const view = useStore((s) => s.view);
  const fundId = useStore((s) => s.fundId);
  const setView = useStore((s) => s.setView);
  const openFund = useStore((s) => s.openFund);
  const funds = useStore((s) => s.funds);
  const screener = useStore((s) => s.screener);
  const addCandidate = useStore((s) => s.addCandidate);
  const setAudit = useStore((s) => s.setAudit);
  const setModules = useStore((s) => s.setModules);
  const setShell = useStore((s) => s.setShell);
  const queue = useStore((s) => s.queue);
  const docs = useStore((s) => s.docs);
  const trigAssessed = useStore((s) => s.trigAssessed);
  const gateOpen = useStore((s) => s.gateOpen);
  const allAssignments = useStore((s) => s.assignments);
  const workReader = useStore(s=>s.identity);
  const workDocs = useStore(s=>s.docs);
  const assignments = allAssignments.filter(a=>canReadWork(workReader,a,workDocs));
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');

  const approvals = openApprovals({ queue, trigAssessed, gateOpen, docs });
  const ranked = [...funds].sort((a, b) => {
    const rank = (id: string) => {
      const s = ddState(id).s;
      return s === 'OVERDUE' ? 0 : s === 'ATTENTION' ? 1 : 2;
    };
    return rank(a.id) - rank(b.id);
  });
  const pipeline = screener.filter((c) => c.id === 'SIL' || c.origin === 'FORM' || c.origin === 'SHELL');
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

  const submitName = () => {
    const r = addCandidate(name, 'form');
    setNotice(r.msg);
    if (r.ok) {
      setName('');
      setAdding(false);
    }
  };

  const onName = (v: string) => {
    setName(v);
    const dup = screener.find((c) => norm(c.name) === norm(v.trim()) && v.trim().length > 0);
    setNotice(dup ? `Already on the list as ${dup.id} — ${dup.name}` : '');
  };

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col bg-rail text-[#F6F3EC]">
      <div className="flex items-center gap-2 px-3.5 pb-3 pt-4">
        <Logo size={22} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight tracking-tight">APEX PACIFIC</div>
        </div>
      </div>

      {identity && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px]">
          <div className="min-w-0 flex-1 truncate">
            <select aria-label="Workspace role" value={identity.role} onChange={e=>useStore.getState().login(e.target.value==='PM'?'a.chan@apexpacific.example':'l.wu@apexpacific.example')} className="w-full bg-rail text-[12px] text-white"><option value="PM">A. Chan · PM</option><option value="Analyst">L. Wu · Analyst</option></select>
          </div>
          <button onClick={logout} title="sign out" className="rounded p-0.5 text-white/50 transition-colors hover:text-white">
            <LogOut size={11} />
          </button>
        </div>
      )}

      <div className="mx-3 mb-4 grid grid-cols-2 gap-1 rounded border border-white/10 p-0.5">
        <Tip label="See what needs your attention today."><button
          onClick={() => setView('today')}
          className={cn(
            'rounded px-2 py-1.5 text-[12px] font-medium transition-colors',
            view === 'today' ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'
          )}
        >
          Today{approvals > 0 ? <span className="ml-1 font-mono tabular-nums text-wait">{approvals}</span> : null}
          <span className="ml-2 font-mono text-[12px] text-white/30">1</span>
        </button></Tip>
        <Tip label="View allocations and review proposed changes."><button
          onClick={() => setView('book')}
          className={cn(
            'rounded px-2 py-1.5 text-[12px] font-medium transition-colors',
            view === 'book' ? 'bg-white/12 text-white' : 'text-white/55 hover:text-white'
          )}
        >
          Book
          <span className="ml-auto float-right font-mono text-[12px] text-white/30">2</span>
        </button></Tip>
      </div>

      <Tip label="See who is doing what, and review their work."><button onClick={() => setView('team')} className={cn('mx-3 mb-4 flex items-center gap-2 rounded border px-3 py-2.5 text-left text-[13px] transition-colors', view === 'team' ? 'border-white/20 bg-white/12 text-white' : 'border-white/10 text-white/75 hover:bg-white/[0.06] hover:text-white')}>
        <span className="flex-1">Team workspace</span><span className="font-mono text-wait">{assignments.filter((a) => a.status === 'Needs review').length}</span><span className="font-mono text-[12px] text-white/30">4</span>
      </button></Tip>
      <div className="mx-3 mb-3 grid gap-1">{([['screening','Screening'],['library','Data library'],['monitoring','Monitoring'],['fees','Fees']] as const).map(([key,label]) => <button key={key} onClick={() => setView(key)} className={cn('rounded px-3 py-2 text-left text-[13px]',view === key ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/5')}>{label}</button>)}</div>
      <Tip label="Open a fund’s documents, tasks and history."><div tabIndex={0} className="px-3.5 pb-1.5 text-[12px] text-white/40">Funds</div></Tip>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2" aria-label="funds">
        {ranked.map((f) => {
          const on = view === 'fund' && fundId === f.id;
          return (
            <Tip key={f.id} label={<div className="max-w-[270px] space-y-1"><p className="font-semibold">{f.name}</p><p>{ddState(f.id).s} · NAV {f.asOf}</p><p>{assignments.filter((a) => a.fundId === f.id && a.status !== 'Done').length} active assignments</p><p className="text-muted">{assignments.find((a) => a.fundId === f.id && a.status !== 'Done')?.title ?? 'No open team work'}</p></div>}><button
              onClick={() => openFund(f.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left text-[12px] transition-colors',
                on ? 'bg-white/12 text-white' : 'text-white/75 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              <StatusDots id={f.id} />
              <span className="min-w-0 flex-1 truncate">{f.name.split(' ').slice(0, 2).join(' ')}</span>
              <span className="font-mono text-[12px] tabular-nums text-white/40">{f.id}</span>
            </button></Tip>
          );
        })}
      </nav>

      <div className="mx-2 mb-2 max-h-40 overflow-y-auto rounded border border-dashed border-white/15 px-2 py-2">
        <Tip label="Follow funds we are considering investing in."><div tabIndex={0} className="mb-1 text-[12px] text-white/40">Pipeline</div></Tip>
        {pipeline.map((c) => {
          const flash = notice.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => openFund(c.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[12px] transition-colors',
                view === 'fund' && fundId === c.id ? 'bg-white/12 text-white' : 'text-white/75 hover:text-white',
                flash && 'bg-wait/20 text-white'
              )}
            >
              <span className="min-w-0 flex-1 truncate">{c.name.split(' ').slice(0, 2).join(' ')}</span>
              <span className="text-[12px] text-white/40">{c.status === 'IN DD' ? 'Diligence' : c.status === 'PARKED' ? 'Parked' : 'Screening'}</span>
            </button>
          );
        })}
        {adding ? (
          <div className="mt-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => onName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitName();
                if (e.key === 'Escape') { setAdding(false); setNotice(''); }
              }}
              placeholder="Add a name"
              className="w-full rounded border border-white/15 bg-white/[0.06] px-1.5 py-1 text-[12px] text-white outline-none placeholder:text-white/35"
            />
            {notice && <p className="mt-1 text-[12px] leading-snug text-wait">{notice}</p>}
          </div>
        ) : (
          <button
            onClick={() => { setAdding(true); setNotice(''); }}
            className="mt-1 inline-flex items-center gap-1 text-[12px] text-white/50 transition-colors hover:text-white"
          >
            <Plus size={11} /> Add name
          </button>
        )}
      </div>

      <div className="mt-auto border-t border-white/10 px-3 py-2.5">
        <a href={import.meta.env.DEV ? "/DEMO_V3_WALKTHROUGH.md" : "https://github.com/Longhuiberkeley/apex-pacific-pms/blob/main/DEMO_V3_WALKTHROUGH.md"} target="_blank" rel="noopener noreferrer" className="mb-2 block text-[12px] text-white/65 transition-colors hover:text-white">Presenter guide ↗</a>
        <div className="flex items-center gap-3 text-[12px]">
          <Tip label="View recent history — who did what."><button onClick={() => setAudit(true)} className="text-white/65 transition-colors hover:text-white">Audit <span className="ml-0.5 font-mono text-[12px] text-white/30">3</span></button></Tip>
          <Tip label="See the tools in this platform and what could be added."><button onClick={() => setModules(true)} className="text-white/65 transition-colors hover:text-white">Modules</button></Tip>
          <Tip label="Use commands to read records and submit work."><button onClick={() => setShell(true)} className="ml-auto font-mono text-[12px] text-white/35 transition-colors hover:text-white/70" aria-label="Agent console">
            `
          </button></Tip>
        </div>
      </div>
    </aside>
  );
}
