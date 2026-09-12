import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useStore, SILK } from '../lib/store';
import { chkDisplay, chkFor, DD_CHECKS, ddState, flagItems } from '../lib/dd';
import { daysSince, NAV_USD } from '../data/seed';
import { validateBook } from '../lib/rules';
import type { EntityHistory, FundTab } from '../lib/types';
import { Badge, Btn, Input, RTabs, Sheet } from './Ui';
import DocReview from './DocReview';
import { cn } from '../lib/cn';
import { WorkCard } from './Team';
import { silkNextAction } from '../lib/work';

function compactUsd(n: number) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${(Math.abs(n) / 1e6).toFixed(1)}M`;
}
function usdOf(wt: number) {
  return (wt / 100) * NAV_USD;
}

function DollarsEditor({ value, onSave, className }: { value: number; onSave: (n: number) => void; className?: string }) {
  const [raw, setRaw] = useState(String(Math.round(value)));
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (!focus) setRaw(String(Math.round(value)));
  }, [value, focus]);
  const commit = () => {
    const n = Number(String(raw).replace(/[$,\s]/g, ''));
    if (Number.isFinite(n)) onSave(n);
    else setRaw(String(Math.round(value)));
    setFocus(false);
  };
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-[13px] tabular-nums', className)}>
      <span className="text-muted">$</span>
      <input
        value={focus ? raw : Math.round(value).toLocaleString('en-US')}
        onFocus={() => { setFocus(true); setRaw(String(Math.round(value))); }}
        onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
        className="w-[9.5rem] rounded border border-line bg-surface px-1.5 py-1 text-ink outline-none hover:border-line2 focus:border-ai"
      />
    </span>
  );
}

function actorTone(a: EntityHistory['actor']): 'emerald' | 'blue' | 'slate' {
  return a === 'YOU' ? 'emerald' : a === 'AGENT' ? 'blue' : 'slate';
}

const TABS: Array<{ id: FundTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'work', label: 'Research & work' },
  { id: 'exposure', label: 'Exposure' },
  { id: 'documents', label: 'Documents' },
  { id: 'history', label: 'History' },
  { id: 'verdicts', label: 'Verdicts' },
];

export default function FundPage() {
  const fundId = useStore((s) => s.fundId);
  const assignments = useStore((s) => s.assignments);
  const openAssignment = useStore((s) => s.openAssignment);
  const fundTab = useStore((s) => s.fundTab);
  const setFundTab = useStore((s) => s.setFundTab);
  const setView = useStore((s) => s.setView);
  const funds = useStore((s) => s.funds);
  const book = useStore((s) => s.book);
  const staged = useStore((s) => s.staged);
  const screener = useStore((s) => s.screener);
  const docs = useStore((s) => s.docs);
  const queue = useStore((s) => s.queue);
  const history = useStore((s) => s.history);
  const ddVerdicts = useStore((s) => s.ddVerdicts);
  const verdictLog = useStore((s) => s.verdictLog);
  const trigAssessed = useStore((s) => s.trigAssessed);
  const escalateSable = useStore((s) => s.escalateSable);
  const escalated = useStore((s) => s.escalated);
  const ackHalcyon = useStore((s) => s.ackHalcyon);
  const halAck = useStore((s) => s.halAck);
  const fileVerdict = useStore((s) => s.fileVerdict);
  const setDollars = useStore((s) => s.setDollars);
  const approveDoc = useStore((s) => s.approveDoc);
  const rejectDoc = useStore((s) => s.rejectDoc);
  const editDocField = useStore((s) => s.editDocField);

  const [inspect, setInspect] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');
  const [openHist, setOpenHist] = useState<string | null>(null);
  const [docSel, setDocSel] = useState<string | null>(null);

  const fund = funds.find((f) => f.id === fundId);
  const silkNext = silkNextAction(assignments);
  const pipe = screener.find((c) => c.id === fundId);
  const inBook = !!fund;
  const name = fund?.name ?? pipe?.name ?? fundId ?? 'Fund';
  const live = staged ?? book;
  const committedWt = fund ? (book[fund.id] ?? fund.wt) : 0;
  const liveWt = fund ? (live[fund.id] ?? committedWt) : 0;
  const committedUsd = usdOf(committedWt);
  const liveUsd = usdOf(liveWt);
  const st = fund ? ddState(fund.id) : null;
  const age = fund ? daysSince(fund.asOf) : null;
  const histRows = useMemo(
    () => (fundId ? [...history].filter((h) => h.entityId === fundId).reverse() : []),
    [history, fundId]
  );
  const fundDocs = useMemo(() => docs.filter((d) => d.fundId === fundId), [docs, fundId]);
  const currentV = fundId ? ddVerdicts[fundId] : undefined;
  const priors = fundId ? verdictLog.filter((v) => v.fundId === fundId && v.vid !== currentV?.vid) : [];

  useEffect(() => {
    setEditing(false);
    setNote('');
    setOpenHist(null);
    setDocSel(fundDocs.find((d) => d.status === 'pending')?.id ?? fundDocs[0]?.id ?? null);
  }, [fundId]);

  useEffect(() => {
    if (docSel && !fundDocs.some((d) => d.id === docSel)) {
      setDocSel(fundDocs.find((d) => d.status === 'pending')?.id ?? fundDocs[0]?.id ?? null);
    }
  }, [fundDocs, docSel]);

  if (!fundId || (!fund && !pipe)) {
    return (
      <div className="px-6 py-5">
        <button onClick={() => setView('today')} className="text-[12px] text-muted hover:text-ink">← Funds</button>
        <p className="mt-3 text-[13px] text-muted">Select a name from the rail.</p>
      </div>
    );
  }

  const inspectPayload = fund
    ? {
        id: fund.id,
        name: fund.name,
        mgr: fund.mgr,
        strat: fund.strat,
        sleeve: fund.sleeve,
        wt: liveWt,
        exposure_usd: Math.round(liveUsd),
        sla: fund.sla,
        asOf: fund.asOf,
        recd: fund.recd,
        ytd: fund.ytd,
        pack: fund.pack,
        state: st?.s,
        verdict: currentV ?? null,
        ...(fund.id === 'HAL' ? { acknowledged: halAck } : {}),
      }
    : {
        id: pipe!.id,
        name: pipe!.name,
        tag: pipe!.tag,
        status: 'Unscored',
        inBook: false,
        lifecycle: {
          intake: 'done',
          documents: pipe!.id === SILK ? silkNext.status : 'Not yet reviewed',
          firstNav: 'none',
          scoreable: 'none',
        },
      };

  const viol = fund ? validateBook(live, funds) : [];
  const ruleA = fund ? liveWt > 25 : false;
  const ruleE = fund ? viol.some((v) => v.rule === 'E' && v.msg.includes(fund.name)) : false;

  const openItems: Array<{ key: string; title: string; meta: string; go: () => void }> = [];
  assignments.filter((a) => a.fundId === fundId && a.status !== 'Done').forEach((a) => openItems.push({ key: a.id, title: a.title, meta: `${a.owner} · ${a.status}`, go: () => openAssignment(a.id) }));
  fundDocs.filter((d) => d.status === 'pending').forEach((d) => {
    openItems.push({
      key: d.id,
      title: d.title,
      meta: `${d.kind === 'email' ? 'Email' : 'Pdf'} · pending`,
      go: () => { setFundTab('documents'); setDocSel(d.id); },
    });
  });
  if (fundId === 'SAB' && !trigAssessed) {
    openItems.push({
      key: 'sable-sla',
      title: 'Sable Creek — August NAV 23d past SLA',
      meta: 'Task',
      go: () => setView('today'),
    });
  }
  queue.filter((q) => !q.done).forEach((q) => {
    const blob = `${q.title} ${q.origin}`.toLowerCase();
    const hit = blob.includes(fundId.toLowerCase()) || blob.includes(name.split(' ')[0].toLowerCase());
    if (hit) {
      openItems.push({ key: q.wid, title: q.title, meta: `Task · ${q.wid}`, go: () => setView('today') });
    }
  });

  const selectedDoc = fundDocs.find((d) => d.id === docSel);
  const flags = fund ? flagItems(fund.id) : [];
  const packLabel = !fund ? null : fund.pack === 'MISSING' ? 'Missing' : fund.pack === 'EXCEPTION' ? 'Exception' : fund.pack === 'CLOSED' ? 'Closed' : fund.pack;
  const stateLabel = st ? (st.s === 'OVERDUE' ? 'Overdue' : st.s === 'ATTENTION' ? 'Attention' : 'Current') : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-line bg-paper px-6 pt-3">
        <button onClick={() => setView('today')} className="text-[12px] text-muted hover:text-ink">← Funds</button>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-[20px] font-semibold text-ink">{name}</h1>
          {fund && (
            <span className="font-mono text-[13px] tabular-nums text-muted">
              {fund.mgr} — {fund.sleeve} — {compactUsd(liveUsd)}
            </span>
          )}
          {pipe && !fund && <span className="text-[13px] text-muted">Pipeline — not in the book</span>}
          {stateLabel && st && (
            <Badge tone={st.tone}>{stateLabel}</Badge>
          )}
          {packLabel && (
            <Badge tone={fund?.pack === 'MISSING' ? 'crimson' : fund?.pack === 'EXCEPTION' ? 'amber' : 'slate'}>{packLabel}</Badge>
          )}
          {pipe && !fund && <Badge>Unscored</Badge>}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Btn size="sm" onClick={() => setInspect(true)}>Inspect</Btn>
            {inBook && (
              <Btn size="sm" onClick={() => { setEditing((v) => !v); setFundTab('overview'); }}>
                Edit
              </Btn>
            )}
            {fundId === 'SAB' && (
              <Btn size="sm" tone="amber" onClick={escalateSable} disabled={escalated}>
                {escalated ? 'Escalated' : 'Escalate'}
              </Btn>
            )}
            {inBook && (
              currentV ? (
                <Btn size="sm" onClick={() => setFundTab('verdicts')}>Amend</Btn>
              ) : (
                <Btn size="sm" tone="emerald" onClick={() => fileVerdict(fundId, '')}>File verdict</Btn>
              )
            )}
            {fundId === 'HAL' && (
              <Btn size="sm" tone="emerald" onClick={ackHalcyon} disabled={halAck}>
                {halAck ? 'Acknowledged' : 'Acknowledge'}
              </Btn>
            )}
          </div>
        </div>
        {editing && inBook && (
          <div className="mt-2 flex items-center gap-2 pb-1 text-[12px] text-muted">
            Target exposure
            <DollarsEditor value={liveUsd} onSave={(n) => setDollars(fundId, n)} />
          </div>
        )}
        <RTabs.Root value={fundTab} onValueChange={(v) => setFundTab(v as FundTab)} className="mt-2">
          <RTabs.List>
            {TABS.map((t) => (
              <RTabs.Trigger key={t.id} value={t.id}>{t.label}</RTabs.Trigger>
            ))}
          </RTabs.List>
        </RTabs.Root>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <RTabs.Root value={fundTab} onValueChange={(v) => setFundTab(v as FundTab)}>
          <RTabs.Content value="overview" className="space-y-4 pt-0">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3 text-[12px]">
              {['Screening', 'Diligence', 'IC review', 'Onboarding', 'Invested', 'Monitoring'].map((stage, i) => {
                const current = inBook ? 5 : pipe?.status === 'IN DD' ? 1 : 0;
                return <span key={stage} className="inline-flex items-center gap-2">{i > 0 && <span className="text-line2">→</span>}<span className={cn('rounded px-2 py-1', i === current ? 'bg-rail font-medium text-white' : 'text-muted')}>{stage}</span></span>;
              })}
              <button onClick={() => setFundTab('work')} className="ml-auto text-ai hover:underline">Research, decisions & owners ↗</button>
            </div>
            {inBook && fund && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Fact label="$ exposure">
                  <DollarsEditor value={liveUsd} onSave={(n) => setDollars(fund.id, n)} />
                  <div className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">{liveWt.toFixed(1)}%</div>
                </Fact>
                <Fact label="YTD">
                  <span className={cn('font-mono text-[15px] tabular-nums', fund.ytd < 0 ? 'text-stop' : 'text-ink')}>
                    {fund.ytd >= 0 ? '+' : ''}{fund.ytd.toFixed(1)}%
                  </span>
                </Fact>
                <Fact label="NAV as-of">
                  <div className="font-mono text-[13px] tabular-nums text-ink">{fund.asOf ?? '—'}</div>
                  <div className="mt-0.5 font-mono text-[12px] tabular-nums text-muted">{age}d</div>
                </Fact>
                <Fact label="Pack">
                  <Badge tone={fund.pack === 'MISSING' ? 'crimson' : fund.pack === 'EXCEPTION' ? 'amber' : 'slate'}>{packLabel}</Badge>
                </Fact>
              </div>
            )}
            {!inBook && pipe && (
              <div className="rounded-lg border border-line bg-surface p-4">
                <Badge tone="blue">{pipe.tag}</Badge>
                {pipe.id === SILK ? (
                  <div className="mt-3">
                    <h3 className="text-[15px] font-semibold">Next step · {silkNext.status}</h3>
                    <p className="mt-1 text-[12px] text-muted">Owner: {silkNext.owner}</p>
                    <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed text-muted">{silkNext.detail}</p>
                    <Btn className="mt-3" tone="blue" onClick={() => openAssignment(silkNext.id)}>{silkNext.label}</Btn>
                  </div>
                ) : <p className="mt-3 text-[13px] text-muted">Prospective fund. Research and documents remain to be reviewed before an investment decision.</p>}
              </div>
            )}

            <section>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Open items</h3>
              {openItems.length === 0 ? (
                <p className="text-[13px] text-muted">None tagged to this name.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                  {openItems.map((it) => (
                    <li key={it.key}>
                      <button onClick={it.go} className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-paper">
                        <span className="text-[13px] text-ink">{it.title}</span>
                        <span className="shrink-0 text-[12px] text-muted">{it.meta}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {inBook && (
              <section>
                <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Flags</h3>
                {flags.length === 0 ? (
                  <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-muted">No open flags.</p>
                ) : (
                  <div className="space-y-2">
                    {flags.map((f) => (
                      <div key={f.label} className="rounded-lg border border-line bg-surface p-3">
                        <Badge tone={f.tone}>{f.label}</Badge>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{f.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <h3 className="mb-1.5 text-[13px] font-semibold text-ink">History</h3>
              {histRows.slice(0, 3).length === 0 ? (
                <p className="text-[13px] text-muted">No entries yet.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                  {histRows.slice(0, 3).map((h, i) => (
                    <li key={`${h.t}-${h.field}-${i}`}>
                      <button onClick={() => setFundTab('history')} className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-paper">
                        <span className="font-mono text-[12px] tabular-nums text-muted">{h.t}</span>
                        <Badge tone={actorTone(h.actor)}>{h.actor}</Badge>
                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink">{h.field}</span>
                        <span className="hidden font-mono text-[12px] tabular-nums text-muted sm:inline">
                          {h.from || '—'} → {h.to}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </RTabs.Content>

           <RTabs.Content value="work" className="space-y-4 pt-0">
             <div><h2 className="text-[17px] font-semibold">Research, decisions & work</h2><p className="mt-1 text-[13px] text-muted">The same assignments shown in Team — linked to this manager throughout its lifecycle.</p></div>
             <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assignments.filter((a) => a.fundId === fundId).map((a) => <WorkCard key={a.id} assignment={a} />)}</div>
             {!assignments.some((a) => a.fundId === fundId) && <p className="text-[13px] text-muted">No team assignments for this manager yet.</p>}
           </RTabs.Content>

           <RTabs.Content value="exposure" className="space-y-3 pt-0">
            {!inBook || !fund ? (
              <p className="text-[13px] text-muted">This name is not in the book.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Fact label="$ committed">
                    <span className="font-mono text-[15px] tabular-nums text-ink">{compactUsd(committedUsd)}</span>
                    <span className="ml-2 font-mono text-[12px] tabular-nums text-muted">{committedWt.toFixed(1)}%</span>
                  </Fact>
                  <Fact label="$ staged">
                    <span className="font-mono text-[15px] tabular-nums text-ink">{compactUsd(liveUsd)}</span>
                    <span className="ml-2 font-mono text-[12px] tabular-nums text-muted">{liveWt.toFixed(1)}%</span>
                  </Fact>
                  <Fact label="% derived">
                    <span className="font-mono text-[15px] tabular-nums text-muted">{liveWt.toFixed(1)}%</span>
                  </Fact>
                  <Fact label="Cash impact">
                    <span className="font-mono text-[15px] tabular-nums text-ink">
                      {liveUsd === committedUsd ? '—' : compactUsd(committedUsd - liveUsd)}
                    </span>
                    <div className="mt-0.5 text-[12px] text-muted">Cash absorbs residual</div>
                  </Fact>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ruleA && <Badge tone="crimson">Rule A</Badge>}
                  {ruleE && <Badge tone="crimson">Rule E</Badge>}
                  <button onClick={() => setView('book')} className="text-[13px] text-ai hover:underline">
                    Edit in Book
                  </button>
                </div>
              </>
            )}
          </RTabs.Content>

          <RTabs.Content value="documents" className="pt-0">
            {fundDocs.length === 0 ? (
              <p className="text-[13px] text-muted">No intake rows for this name.</p>
            ) : (
              <div className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-line bg-surface">
                <div className="shrink-0 border-b border-line">
                  {fundDocs.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDocSel(d.id)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 border-b border-line px-3 py-2 text-left last:border-0 hover:bg-paper',
                        docSel === d.id && 'bg-paper'
                      )}
                    >
                      <span className="text-[13px] text-ink">{d.title}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12px] tabular-nums text-muted">{(d.overall * 100).toFixed(0)}%</span>
                        <Badge tone={d.status === 'approved' ? 'emerald' : d.status === 'rejected' ? 'crimson' : 'amber'}>
                          {d.status === 'approved' ? 'Approved' : d.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </Badge>
                      </span>
                    </button>
                  ))}
                </div>
                {selectedDoc && selectedDoc.status === 'pending' && (
                  <div className="min-h-0 flex-1">
                    <DocReview
                      doc={selectedDoc}
                      onApprove={() => approveDoc(selectedDoc.id)}
                      onReject={(reason, n) => rejectDoc(selectedDoc.id, reason, n)}
                      onEdit={(key, value) => editDocField(selectedDoc.id, key, value)}
                    />
                  </div>
                )}
                {selectedDoc && selectedDoc.status !== 'pending' && (
                  <p className="px-3 py-3 text-[13px] text-muted">
                    {selectedDoc.status === 'approved' ? 'Approved' : 'Rejected'}
                    {selectedDoc.rejectReason ? ` — ${selectedDoc.rejectReason}` : ''}.
                  </p>
                )}
              </div>
            )}
          </RTabs.Content>

          <RTabs.Content value="history" className="pt-0">
            {histRows.length === 0 ? (
              <p className="text-[13px] text-muted">No history for this name.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line bg-surface">
                {histRows.map((h, i) => {
                  const key = `${h.t}-${h.field}-${h.h}-${i}`;
                  const on = openHist === key;
                  return (
                    <div key={key} className="border-b border-line last:border-0">
                      <button
                        onClick={() => setOpenHist(on ? null : key)}
                        className="flex w-full items-baseline gap-2 px-3 py-2.5 text-left hover:bg-paper"
                      >
                        <span className="w-[5.5rem] shrink-0 font-mono text-[12px] tabular-nums text-muted">{h.t}</span>
                        <Badge tone={actorTone(h.actor)}>{h.actor}</Badge>
                        <span className="font-mono text-[12px] text-ink">{h.field}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] tabular-nums text-muted">
                          {h.from || '—'} → {h.to}
                        </span>
                        {h.source && <span className="hidden font-mono text-[12px] text-muted sm:inline">{h.source}</span>}
                        <span className="font-mono text-[11px] text-muted">#{h.h}</span>
                      </button>
                      {on && (
                        <div className="grid grid-cols-2 gap-3 border-t border-dashed border-line bg-paper px-3 py-3">
                          <div>
                            <div className="mb-1 text-[12px] text-muted">Before</div>
                            <pre className="whitespace-pre-wrap font-mono text-[12px] text-ink">{h.from || '—'}</pre>
                          </div>
                          <div>
                            <div className="mb-1 text-[12px] text-muted">After</div>
                            <pre className="whitespace-pre-wrap font-mono text-[12px] text-ink">{h.to || '—'}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </RTabs.Content>

          <RTabs.Content value="verdicts" className="space-y-4 pt-0">
            {!inBook ? (
              <p className="text-[13px] text-muted">Not scoreable — pack incomplete.</p>
            ) : fund ? (
              <>
                {currentV ? (
                  <div className="rounded-lg border border-pass/30 bg-pass/[0.06] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="emerald">Filed {currentV.vid}</Badge>
                      <span className="font-mono text-[12px] text-ink">{currentV.state} · flags [{currentV.flags.join(', ') || '—'}]</span>
                      <span className="ml-auto font-mono text-[12px] text-muted">{currentV.signer} ({currentV.role}) · {currentV.ts}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink">“{currentV.note}”</p>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">No signed verdict yet.</p>
                )}
                {priors.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Priors</h3>
                    <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                      {priors.map((v) => (
                        <li key={v.vid} className="flex flex-wrap items-baseline gap-2 px-3 py-2 text-[12px]">
                          <span className="font-mono tabular-nums text-muted">{v.ts}</span>
                          <span className="font-mono text-ink">{v.vid}</span>
                          <span>{v.state}</span>
                          <span className="text-muted">{v.signer}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder={currentV ? 'Amend note…' : 'One-line verdict note…'}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-w-[220px] flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { fileVerdict(fund.id, note); setNote(''); } }}
                  />
                  <Btn tone="emerald" onClick={() => { fileVerdict(fund.id, note); setNote(''); }}>
                    {currentV ? 'Amend' : 'File verdict'}
                  </Btn>
                </div>
                <div>
                  <h3 className="mb-1.5 text-[13px] font-semibold text-ink">Checks</h3>
                  <div className="overflow-hidden rounded-lg border border-line bg-surface">
                    {DD_CHECKS.map((c) => {
                      const r = chkFor(fund.id, c.id);
                      const label = chkDisplay(r.s);
                      const tone = label === 'Pass' ? 'emerald' : label === 'Fail' ? 'crimson' : 'amber';
                      return (
                        <details key={c.id} open={r.s === 'FAIL' || r.s === 'PENDING' || r.s === 'BLOCKED'} className="border-b border-line last:border-0">
                          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px] hover:bg-paper [&::-webkit-details-marker]:hidden">
                            <Badge tone={tone}>{label}</Badge>
                            <span className="font-mono text-[12px] text-muted">{c.id}</span>
                            <span>{c.name}</span>
                            <span className="ml-auto font-mono text-[12px] text-muted">{r.obs}</span>
                          </summary>
                          {r.detail && <p className="px-3 pb-2 pl-[4.5rem] text-[12px] text-muted">{r.detail}</p>}
                        </details>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </RTabs.Content>
        </RTabs.Root>
      </div>

      <Sheet open={inspect} onClose={() => setInspect(false)} title="Inspect" sub={name} width="w-[480px]">
        <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-ink">
          {JSON.stringify(inspectPayload, null, 2)}
        </pre>
      </Sheet>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
