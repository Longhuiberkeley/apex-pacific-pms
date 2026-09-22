import { canReadWork } from '../lib/records';
import { provenance } from '../lib/records';
import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useStore } from '../lib/store';
import { isEligible } from '../lib/docs';
import { cn } from '../lib/cn';
import { Badge, Btn } from './Ui';
import DocReview from './DocReview';
import HitlTriad from './HitlTriad';

type Filter = 'all' | 'docs' | 'tasks';
type Sel =
  | { kind: 'gate' }
  | { kind: 'doc'; id: string }
  | { kind: 'sable' }
  | { kind: 'queue'; wid: string }
  | { kind: 'broker' };

function rowKey(s: Sel): string {
  if (s.kind === 'doc') return `doc:${s.id}`;
  if (s.kind === 'queue') return `q:${s.wid}`;
  return s.kind;
}

function PolicyChip() {
  const policy = useStore((s) => s.intakePolicy);
  const setIntakePolicy = useStore((s) => s.setIntakePolicy);
  return (
    <button
      onClick={() => setIntakePolicy(policy === 'AUTO' ? 'MANUAL' : 'AUTO')}
      className="rounded border border-line bg-surface px-2 py-1 text-[12px] text-ink hover:bg-paper"
    >
      Policy {policy}
    </button>
  );
}

function Pip({ tone }: { tone: 'wait' | 'stop' | 'ai' }) {
  const map = { wait: 'bg-wait', stop: 'bg-stop', ai: 'bg-ai' };
  return <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', map[tone])} />;
}

export default function Today() {
  const docs = useStore((s) => s.docs);
  const queue = useStore((s) => s.queue);
  const intakePolicy = useStore((s) => s.intakePolicy);
  const gateOpen = useStore((s) => s.gateOpen);
  const trigAssessed = useStore((s) => s.trigAssessed);
  const linkConfirmed = useStore((s) => s.linkConfirmed);
  const confirmLink = useStore((s) => s.confirmLink);
  const assessSable = useStore((s) => s.assessSable);
  const brokerParsed = useStore((s) => s.brokerParsed);
  const reconciled = useStore((s) => s.reconciled);
  const fxQueued = useStore((s) => s.fxQueued);
  const parseBroker = useStore((s) => s.parseBroker);
  const reconcile = useStore((s) => s.reconcile);
  const queueFx = useStore((s) => s.queueFx);
  const approveDoc = useStore((s) => s.approveDoc);
  const rejectDoc = useStore((s) => s.rejectDoc);
  const editDocField = useStore((s) => s.editDocField);
  const approveQueue = useStore((s) => s.approveQueue);
  const rejectQueue = useStore((s) => s.rejectQueue);
  const setView = useStore((s) => s.setView);
  const openFund = useStore((s) => s.openFund);
  const funds = useStore((s) => s.funds);
  const allAssignments = useStore((s) => s.assignments);
  const workReader = useStore(s=>s.identity);
  const workDocs = useStore(s=>s.docs);
  const assignments = allAssignments.filter(a=>canReadWork(workReader,a,workDocs));
  const openAssignment = useStore((s) => s.openAssignment);
  const teamFollowUps = assignments.filter((a) => a.status === 'Needs review' || (a.parentId && a.status !== 'Done'));
  const fundLabel = (id: string) => funds.find((f) => f.id === id)?.name.split(' ').slice(0, 2).join(' ') ?? id;

  const [filter, setFilter] = useState<Filter>('all');
  const [sel, setSel] = useState<Sel | null>(null);
  const [wantReject, setWantReject] = useState(false);
  const [taskNote, setTaskNote] = useState('');
  const [taskDraft, setTaskDraft] = useState('');
  const [showRecord, setShowRecord] = useState(false);

  const pendingDocs = docs.filter((d) => d.status === 'pending');
  const pendingQ = queue.filter((q) => !q.done);
  const showBroker = !fxQueued;

  const rows = useMemo(() => {
    const list: Sel[] = [];
    if (gateOpen) list.push({ kind: 'gate' });
    const docsRows: Sel[] = pendingDocs.map((d) => ({ kind: 'doc' as const, id: d.id }));
    const taskRows: Sel[] = [];
    if (!trigAssessed) taskRows.push({ kind: 'sable' });
    pendingQ.forEach((q) => taskRows.push({ kind: 'queue', wid: q.wid }));
    if (showBroker) taskRows.push({ kind: 'broker' });
    if (filter === 'docs') return docsRows;
    if (filter === 'tasks') return [...(gateOpen ? [{ kind: 'gate' } as Sel] : []), ...taskRows];
    return [...list, ...docsRows, ...taskRows];
  }, [filter, gateOpen, pendingDocs, pendingQ, showBroker, trigAssessed]);

  useEffect(() => {
    if (!sel) {
      if (rows[0]) setSel(rows[0]);
      return;
    }
    const still = rows.some((r) => rowKey(r) === rowKey(sel));
    if (!still) setSel(rows[0] ?? null);
  }, [rows, sel]);

  useEffect(() => {
    setTaskNote('');
    const q = sel?.kind === 'queue' ? queue.find((x) => x.wid === sel.wid) : undefined;
    setTaskDraft(q?.draft ?? '');
  }, [sel && rowKey(sel)]);

  const selectedDoc = sel?.kind === 'doc' ? docs.find((d) => d.id === sel.id) : undefined;
  const selectedQ = sel?.kind === 'queue' ? queue.find((q) => q.wid === sel.wid) : undefined;
  const qIndex = selectedQ ? queue.findIndex((q) => q.wid === selectedQ.wid) : -1;

  const compact = (id: string) => {
    const d = docs.find((x) => x.id === id);
    return intakePolicy === 'AUTO' && d && isEligible(d);
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex w-[300px] shrink-0 flex-col border-r border-line bg-surface 2xl:w-[350px]">
        <div className="shrink-0 border-b border-line px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-[15px] font-semibold text-ink">Today</h1>
            <PolicyChip />
          </div>
          <div className="flex gap-1">
            {([
              ['docs', 'Documents'],
              ['tasks', 'Tasks'],
              ['all', 'All'],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  'rounded px-2 py-1 text-[12px] transition-colors',
                  filter === k ? 'bg-rail text-white' : 'text-muted hover:bg-paper hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setView('team')} className="border-b border-line bg-ai/5 px-3 py-3 text-left text-[12px] text-ai hover:bg-ai/10"><span className="block font-medium">Team assignments & research ↗</span><span className="mt-1 block">{assignments.filter((a) => a.status === 'Needs review').length} submissions awaiting human review</span></button>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filter !== 'docs' && teamFollowUps.length > 0 && (
            <section className="border-b border-line bg-ai/[0.03]">
              <h2 className="px-3 pt-3 text-[12px] font-medium text-muted">Team reviews & follow-ups</h2>
              {teamFollowUps.map((a) => (
                <button key={a.id} onClick={() => openAssignment(a.id)} className="block w-full px-3 py-2.5 text-left hover:bg-paper">
                  <span className="block text-[13px] font-medium text-ink">{a.title} ↗</span>
                  <span className="mt-1 block text-[12px] text-muted">{a.owner} · {a.status} · {a.id}</span>
                </button>
              ))}
            </section>
          )}
          {rows.map((r) => {
            const on = sel ? rowKey(sel) === rowKey(r) : false;
            if (r.kind === 'gate') {
              return (
                <div role="group" tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget && (e.key==='Enter' || e.key===' ')){e.preventDefault();setSel(r);}}}
                  key="gate"
                  onClick={() => setSel(r)}
                  className={cn('flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left hover:bg-paper', on && 'bg-paper')}
                >
                  <Pip tone="wait" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">Allocation ticket awaiting IC signature</div>
                    <div className="mt-0.5 text-[12px] text-muted">Task · Book · staged</div>
                  </div>
                  <Btn size="sm" onClick={(e) => { e.stopPropagation(); setView('book'); }}>
                    Review
                  </Btn>
                </div>
              );
            }
            if (r.kind === 'doc') {
              const d = docs.find((x) => x.id === r.id);
              if (!d) return null;
              const ok = compact(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => setSel(r)}
                  className={cn('flex w-full cursor-pointer items-start gap-2.5 border-b border-line px-3 py-2.5 hover:bg-paper', on && 'bg-paper')}
                >
                  <Pip tone={ok ? 'ai' : 'wait'} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">{d.title}</div><div className="mt-1 break-all text-[12px] text-muted">{provenance(d).mailbox}<br/>{provenance(d).filename}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
                      <span>{d.kind === 'email' ? 'Email' : 'Pdf'}</span>
                      {d.fundId && (
                        <>
                          <span>·</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); openFund(d.fundId!); }}
                            className="hover:text-ink hover:underline"
                          >
                            {fundLabel(d.fundId)}
                          </button>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-mono tabular-nums">{d.arrived.split(' ').slice(-1)[0]}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-[12px] tabular-nums text-muted">{(d.overall * 100).toFixed(0)}%</span>
                    {ok ? (
                      <div className="flex gap-1">
                        <Btn size="xs" tone="emerald" onClick={(e) => { e.stopPropagation(); approveDoc(d.id); }}>
                          Approve
                        </Btn>
                        <Btn
                          size="xs"
                          tone="crimson"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSel(r);
                            setWantReject(true);
                          }}
                        >
                          Reject
                        </Btn>
                      </div>
                    ) : (
                      <Btn size="xs" onClick={(e) => { e.stopPropagation(); setSel(r); }}>
                        Review
                      </Btn>
                    )}
                  </div>
                </div>
              );
            }
            if (r.kind === 'sable') {
              return (
                <div role="group" tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget && (e.key==='Enter' || e.key===' ')){e.preventDefault();setSel(r);}}}
                  key="sable"
                  onClick={() => setSel(r)}
                  className={cn('flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left hover:bg-paper', on && 'bg-paper')}
                >
                  <Pip tone="stop" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">Sable Creek — August NAV 23d past SLA</div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      Task ·{' '}
                      <span
                        role="link"
                        onClick={(e) => { e.stopPropagation(); openFund('SAB'); }}
                        className="hover:text-ink hover:underline"
                      >
                        Sable Creek
                      </span>
                      {' '}· last as-of 2026-07-31
                    </div>
                  </div>
                  <Btn size="sm" onClick={(e) => { e.stopPropagation(); setSel(r); }}>
                    Review
                  </Btn>
                </div>
              );
            }
            if (r.kind === 'broker') {
              const state = !brokerParsed ? 'Arrived' : !reconciled ? 'Parsed' : 'Reconciled';
              return (
                <div role="group" tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget && (e.key==='Enter' || e.key===' ')){e.preventDefault();setSel(r);}}}
                  key="broker"
                  onClick={() => setSel(r)}
                  className={cn('flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left hover:bg-paper', on && 'bg-paper')}
                >
                  <Pip tone="wait" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">prime_broker_statement_2026-08.xls</div>
                    <div className="mt-0.5 text-[12px] text-muted">Task · Broker · {state}</div>
                  </div>
                  <Btn size="sm" onClick={(e) => { e.stopPropagation(); setSel(r); }}>
                    Review
                  </Btn>
                </div>
              );
            }
            const q = queue.find((x) => x.wid === r.wid);
            if (!q) return null;
            return (
              <div role="group" tabIndex={0} onKeyDown={e=>{if(e.target===e.currentTarget && (e.key==='Enter' || e.key===' ')){e.preventDefault();setSel(r);}}}
                key={q.wid}
                onClick={() => setSel(r)}
                className={cn('flex w-full items-start gap-2.5 border-b border-line px-3 py-2.5 text-left hover:bg-paper', on && 'bg-paper')}
              >
                <Pip tone="wait" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-ink">{q.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted">Task · {q.origin} · {q.wid}</div>
                </div>
                <Btn size="sm" onClick={(e) => { e.stopPropagation(); setSel(r); }}>
                  Review
                </Btn>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-muted">Nothing waiting.</p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 bg-paper">
        {selectedDoc && selectedDoc.status === 'pending' && (
          <DocReview
            doc={selectedDoc}
            policyChip={<PolicyChip />}
            wantReject={wantReject}
            onWantRejectConsumed={() => setWantReject(false)}
            onApprove={() => approveDoc(selectedDoc.id)}
            onReject={(reason, note) => rejectDoc(selectedDoc.id, reason, note)}
            onEdit={(key, value) => editDocField(selectedDoc.id, key, value)}
          />
        )}

        {sel?.kind === 'gate' && (
          <div className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Allocation ticket awaiting IC signature</h2>
            <p className="mt-2 text-[13px] text-muted">Staged proposal is at the Book gate. Approve is PM-only.</p>
            <div className="mt-4">
              <Btn tone="emerald" onClick={() => setView('book')}>
                Review
              </Btn>
            </div>
          </div>
        )}

        {sel?.kind === 'sable' && (
          <div className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Sable Creek — August NAV 23d past SLA</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Last as-of 2026-07-31. Type-1 link suggestion needs confirm; explain-and-assess drafts a reviewable workup.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={confirmLink}
                className={cn(
                  'rounded border border-dashed border-ai px-2 py-1 text-[12px] text-ai transition-colors hover:bg-ai/10',
                  linkConfirmed && 'border-solid bg-ai/10'
                )}
              >
                {linkConfirmed ? 'Link confirmed' : 'Confirm Type-1 link'}
              </button>
              <Btn
                size="sm"
                tone="amber"
                onClick={() => {
                  assessSable();
                  const next = useStore.getState().queue[0];
                  if (next) setSel({ kind: 'queue', wid: next.wid });
                }}
              >
                Explain and assess
              </Btn>
            </div>
          </div>
        )}

        {sel?.kind === 'broker' && (
          <BrokerPane
            brokerParsed={brokerParsed}
            reconciled={reconciled}
            fxQueued={fxQueued}
            showRecord={showRecord}
            setShowRecord={setShowRecord}
            parseBroker={parseBroker}
            reconcile={reconcile}
            queueFx={queueFx}
            openFund={openFund}
          />
        )}

        {selectedQ && !selectedQ.done && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-auto p-5">
              <div className="text-[12px] text-muted">{selectedQ.origin} · {selectedQ.wid}</div>
              <h2 className="mt-1 text-[15px] font-semibold text-ink">{selectedQ.title}</h2>
              <textarea
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
                className="mt-4 h-40 w-full resize-none rounded-md border border-line bg-surface p-3 text-[13px] leading-relaxed text-ink outline-none focus:border-ai"
              />
              <label className="mt-4 block text-[12px] text-muted">
                Note
                <textarea
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  className="mt-1 h-16 w-full resize-none rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] text-ink outline-none focus:border-ai"
                />
              </label>
            </div>
            <HitlTriad
              hotkeys
              onFix={() => {
                if (qIndex < 0) return;
                const edited = [
                  ...(taskDraft !== selectedQ.draft ? ['draft'] : []),
                  ...(taskNote.trim() ? ['note'] : []),
                ];
                approveQueue(qIndex, {
                  draft: taskDraft,
                  note: taskNote.trim() || undefined,
                  fieldsEdited: edited.length ? edited : undefined,
                });
              }}
              onApprove={() => qIndex >= 0 && approveQueue(qIndex, { draft: taskDraft, note: taskNote })}
              onReject={(reason, note) => {
                if (qIndex >= 0) rejectQueue(qIndex, reason, note);
              }}
            />
          </div>
        )}

        {!sel && <p className="p-6 text-[13px] text-muted">Select an item.</p>}
      </div>
    </div>
  );
}

function BrokerPane({
  brokerParsed,
  reconciled,
  fxQueued,
  showRecord,
  setShowRecord,
  parseBroker,
  reconcile,
  queueFx,
  openFund,
}: {
  brokerParsed: boolean;
  reconciled: boolean;
  fxQueued: boolean;
  showRecord: boolean;
  setShowRecord: (v: boolean) => void;
  parseBroker: () => void;
  reconcile: () => void;
  queueFx: () => void;
  openFund: (id: string) => void;
}) {
  const state = !brokerParsed ? 'Arrived' : !reconciled ? 'Parsed' : 'Reconciled';
  return (
    <div className="p-5">
      <div className="flex items-center gap-2">
        <FileSpreadsheet size={14} className="text-muted" />
        <h2 className="font-mono text-[15px] font-semibold text-ink">prime_broker_statement_2026-08.xls</h2>
        <Badge tone={state === 'Arrived' ? 'slate' : state === 'Parsed' ? 'blue' : 'amber'}>{state}</Badge>
      </div>
      <p className="mt-1 text-[12px] text-muted">2.1 MB · arrived Mon 09-07 08:02</p>

      <div className="mt-4 space-y-3">
        {!brokerParsed && (
          <Btn size="sm" tone="blue" onClick={parseBroker}>
            Parse
          </Btn>
        )}
        {brokerParsed && !reconciled && (
          <div className="flex flex-wrap items-center gap-2">
            <Btn size="sm" onClick={() => setShowRecord(!showRecord)}>
              {showRecord ? 'Hide record' : 'Inspect record'}
            </Btn>
            <Btn size="sm" tone="blue" onClick={reconcile}>
              Reconcile
            </Btn>
          </div>
        )}
        {brokerParsed && !reconciled && showRecord && (
          <pre className="overflow-x-auto rounded-md border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink">{`{
  "schema": "navpack.v1",
  "date": "2026-09-07",
  "positions": [{ "ticker": "AAPL", "qty": 12500, "price": 201.30 }],
  "cash_usd": 3420000.00,
  "fee_expected_pct": 0.12,
  "fee_charged_pct": 0.15,
  "flags": ["fee_delta", "unexpected_fx"]
}`}</pre>
        )}
        {reconciled && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openFund('HAL')}
              className="rounded border border-line bg-surface px-2 py-1 text-[12px] text-ink hover:bg-paper"
            >
              fee_delta → Halcyon
            </button>
            {fxQueued ? (
              <Badge tone="emerald">Fx explanation queued</Badge>
            ) : (
              <Btn size="sm" tone="amber" onClick={queueFx}>
                unexpected_fx — queue explanation
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
