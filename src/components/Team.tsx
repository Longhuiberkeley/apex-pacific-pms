import { canReadWork } from '../lib/records';
import { useState } from 'react';
import { ArrowUpRight, Clock3, UserRound, Terminal } from 'lucide-react';
import { useStore } from '../lib/store';
import { PEOPLE, WORK_STAGES, type Assignment } from '../lib/work';
import { cn } from '../lib/cn';
import { Badge, Btn, Tip } from './Ui';
import WorkModes, { ModeBadge } from './WorkMode';

export function WorkCard({ assignment: a }: { assignment: Assignment }) {
  const permitted = useStore(s=>canReadWork(s.identity,a,s.docs));
  const openAssignment = useStore((s) => s.openAssignment);
  const funds = useStore((s) => s.funds);
  const screener = useStore((s) => s.screener);
  const name = funds.find((f) => f.id === a.fundId)?.name ?? screener.find((f) => f.id === a.fundId)?.name ?? a.fundId;
  const overdue = a.due < '2026-09-07' && a.status !== 'Done';
  if (!permitted) return <div className="rounded border border-line p-3 text-xs text-muted">Restricted assignment · PM access required</div>;
  return (
    <button onClick={() => openAssignment(a.id)} className="group block w-full rounded-lg border border-line bg-surface p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-ai/40 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai">
      <div className="mb-2 flex items-center justify-between gap-2 text-[12px] text-muted"><span>{a.fundId} · {a.id}</span><ArrowUpRight size={14} className="text-muted group-hover:text-ai" /></div>
      <h3 className="text-[14px] font-semibold leading-snug text-ink">{a.title}</h3>
      <p className="mt-1 truncate text-[12px] text-muted" title={name}>{name}</p>
      <div className="mt-3"><ModeBadge mode={a.mode} /></div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">{a.blocker ?? (a.status === 'Needs review' ? `Submission ready for ${a.reviewer}` : a.status === 'Done' ? 'Filed in the shared record' : a.draft ? 'Research draft ready to submit' : a.next)}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[12px]">
        <span className="flex items-center gap-1.5 text-ink"><UserRound size={12} />{a.owner}</span>
        <span className={cn('flex items-center gap-1 font-mono', overdue ? 'text-stop' : 'text-muted')}><Clock3 size={12} />{overdue ? 'Overdue' : a.due.slice(5)}</span>
      </div>
    </button>
  );
}

export default function Team() {
  const allAssignments = useStore((s) => s.assignments);
  const docs = useStore(s=>s.docs);
  const identity = useStore((s) => s.identity);
  const login = useStore((s) => s.login);
  const setShell = useStore((s) => s.setShell);
  const [person, setPerson] = useState('all');
  const [scope, setScope] = useState<'all' | 'mine' | 'review'>('all');
  const [group, setGroup] = useState<'stage' | 'person'>('stage');
  const assignments = allAssignments.filter(a=>canReadWork(identity,a,docs));
  const rows = assignments.filter((a) => (person === 'all' || a.owner === person) && (scope === 'all' || (scope === 'mine' ? a.owner === identity?.name : a.reviewer === identity?.name && a.status === 'Needs review')));
  const reviews = assignments.filter((a) => a.status === 'Needs review' && a.reviewer === identity?.name).length;
  const blocked = assignments.filter((a) => a.status === 'Waiting externally').length;
  const overdue = assignments.filter((a) => a.due < '2026-09-07' && a.status !== 'Done').length;
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-[24px] font-semibold tracking-tight">Team workspace</h1><p className="mt-1 text-[13px] text-muted">People, agents and operations — working from the same fund record.</p></div>
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-muted">Demo role <select aria-label="Demo role" value={identity?.role} onChange={(e) => login(e.target.value === 'PM' ? 'a.chan@apexpacific.example' : 'l.wu@apexpacific.example')} className="ml-1 rounded border border-line bg-surface p-1.5 text-ink"><option value="PM">A. Chan · PM</option><option value="Analyst">L. Wu · Analyst</option></select></label>
          <Btn onClick={() => setShell(true)}><Terminal size={13} />Agent console</Btn>
        </div>
      </header>
      <WorkModes />
      <div className="flex flex-wrap gap-3 text-[13px]">
        <button onClick={() => { setScope('review'); setPerson('all'); }} className="rounded-md border border-ai/20 bg-ai/5 px-3 py-2 text-ai hover:bg-ai/10"><strong>{reviews}</strong> submissions need your review</button>
        <span className="rounded-md border border-line bg-surface px-3 py-2"><strong>{blocked}</strong> waiting externally</span>
        <span className="rounded-md border border-line bg-surface px-3 py-2"><strong className="text-stop">{overdue}</strong> overdue</span>
        <span className="ml-auto self-center text-[12px] text-muted">Demo day · 7 September 2026</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PEOPLE.map((p) => {
          const active = assignments.filter((a) => a.owner === p.name && a.status !== 'Done').length;
          return <Tip key={p.name} label={<div className="max-w-[240px]"><p className="font-medium">{p.role}</p><p className="mt-1">{p.focus}</p><p className="mt-1">{active} active assignments · click to filter</p></div>}><button onClick={() => setPerson(person === p.name ? 'all' : p.name)} className={cn('flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px]', person === p.name ? 'border-ai bg-ai/5 text-ai' : 'border-line bg-surface text-ink hover:border-line2')}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper font-mono">{p.initials}</span>{p.name}<span className="text-muted">{active}</span></button></Tip>;
        })}
        {person !== 'all' && <Btn size="sm" onClick={() => setPerson('all')}>Clear person filter</Btn>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex gap-1">{([['all', 'Team work'], ['mine', 'My assignments'], ['review', 'My reviews']] as const).map(([value, label]) => <button key={value} onClick={() => setScope(value)} className={cn('rounded px-3 py-1.5 text-[12px]', scope === value ? 'bg-rail text-white' : 'text-muted hover:bg-surface')}>{label}</button>)}</div>
        <label className="text-[12px] text-muted">Group by <select aria-label="Group work by" value={group} onChange={(e) => setGroup(e.target.value as 'stage' | 'person')} className="ml-1 rounded border border-line bg-surface px-2 py-1.5 text-ink"><option value="stage">Stage</option><option value="person">Person</option></select></label>
      </div>
      {rows.length === 0 ? <div className="rounded-lg border border-dashed border-line p-8 text-center text-[13px] text-muted">No assignments in this view. Choose Team work or clear the person filter.</div> : (
        <div className="overflow-x-auto pb-4"><div className={cn('grid gap-3', group === 'stage' ? 'min-w-[1080px] grid-cols-5' : 'min-w-[760px] grid-cols-3')}>
          {(group === 'stage' ? WORK_STAGES : PEOPLE.map((p) => p.name)).map((column) => {
            const items = rows.filter((a) => (group === 'stage' ? a.status : a.owner) === column);
            return <section key={column} className="rounded-lg bg-line/25 p-2"><h2 className="mb-3 flex items-center justify-between px-1 pt-1 text-[13px] font-medium">{column}<Badge>{items.length}</Badge></h2><div className="space-y-2.5">{items.map((a) => <WorkCard key={a.id} assignment={a} />)}{!items.length && <p className="p-3 text-[12px] text-muted">Nothing here.</p>}</div></section>;
          })}
        </div></div>
      )}
      <p className="text-[12px] text-muted">Open Silk River to try the research → submission → review → diligence handoff. Hover on a person or mode for context.</p>
    </div>
  );
}
