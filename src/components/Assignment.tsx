import { plainText } from '../lib/language';
import { canReadWork } from '../lib/records';
import { useState, type ChangeEvent } from 'react';
import { ArrowRight, Bot, Download, FileText, Terminal, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { EMPTY_SUBMISSION, SILK_DRAFT, validateSubmission, type Assignment as Work, type Submission } from '../lib/work';
import { Badge, Btn, Sheet } from './Ui';
import { ModeBadge } from './WorkMode';
import { cn } from '../lib/cn';
import { agentSession } from '../lib/agentBridge';

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Assignment() {
  const id = useStore((s) => s.assignmentId);
  const assignment = useStore((s) => s.assignments.find((a) => a.id === id && canReadWork(s.identity,a,s.docs)));
  const openAssignment = useStore((s) => s.openAssignment);
  return <Sheet open={!!assignment} onClose={() => openAssignment(null)} title={plainText(assignment?.title ?? 'Assignment')} sub={assignment ? `${assignment.owner} → ${assignment.reviewer} · due ${assignment.due}` : undefined} width="w-[1040px]">{assignment && <AssignmentBody key={assignment.id} a={assignment} />}</Sheet>;
}

function AssignmentBody({ a }: { a: Work }) {
  const identity = useStore((s) => s.identity);
  const openFund = useStore((s) => s.openFund);
  const setFundTab = useStore((s) => s.setFundTab);
  const openAssignment = useStore((s) => s.openAssignment);
  const setView = useStore((s) => s.setView);
  const prepare = useStore((s) => s.prepareResearch);
  const save = useStore((s) => s.saveResearch);
  const submit = useStore((s) => s.submitResearch);
  const review = useStore((s) => s.reviewResearch);
  const update = useStore((s) => s.updateWork);
  const assignments = useStore((s) => s.assignments);
  const [tab, setTab] = useState<'work' | 'agent'>('work');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const latest = a.revisions[a.revisions.length - 1];
  const editable = a.mode === 'type2' && (a.status === 'Assigned' || a.status === 'In progress');
  const draft = editable ? a.draft ?? latest?.content ?? EMPTY_SUBMISSION : latest?.content ?? a.draft ?? EMPTY_SUBMISSION;
  const next = assignments.find((x) => x.parentId === a.id);
  const canReview = a.status === 'Needs review' && identity?.role === 'PM' && identity.name === a.reviewer;
  const goFund = (documents = false) => { openAssignment(null); openFund(a.fundId); if (documents) setFundTab('documents'); };
  const report = (result: { ok: boolean; message: string }) => { setFeedback(result.message); result.ok ? toast.success(result.message) : toast.error(result.message); };
  const change = (key: keyof Submission, value: string | string[]) => save(a.id, { ...draft, [key]: value });
  const command = `export APEX_URL="${location.origin}"\nexport APEX_SESSION="${agentSession}"\n\nnode scripts/apex.mjs tasks get ${a.id}\nnode scripts/apex.mjs tasks submit ${a.id} --json=research.json`;
  const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 131072) throw new Error('Submission JSON must be under 128 KB.');
      const result = validateSubmission(JSON.parse(await file.text()), a);
      if (!result.ok) throw new Error(result.message);
      save(a.id, result.content);
      toast.success('Imported as a draft. Review and submit when ready.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid JSON');
    }
    input.value = '';
  };
  return (
    <div className="p-5">
      <div className="flex flex-wrap items-center gap-2"><ModeBadge mode={a.mode} /><Badge tone={a.status === 'Done' ? 'emerald' : a.status === 'Needs review' ? 'amber' : 'slate'}>{a.status}</Badge><button onClick={() => goFund()} className="ml-auto text-[12px] text-ai hover:underline">Open fund record ↗</button></div>
      <div className="mt-4 rounded border border-line bg-paper p-3 text-[13px]"><b>Your part:</b> inspect the cited evidence, correct the prepared findings, and state what must be confirmed next. <b>{a.reviewer}</b> reviews the recommendation before the next handoff.</div>
      <div className="mt-4 flex flex-wrap gap-1 border-b border-line pb-2">{([['work', 'Assignment & submission'], ['agent', 'Agent access / CLI']] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={cn('rounded px-3 py-1.5 text-[13px]', tab === key ? 'bg-rail text-white' : 'text-muted hover:bg-surface')}>{label}</button>)}</div>
      {tab === 'agent' ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-ai/25 bg-ai/5 p-4">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Terminal size={16} />Research anywhere. Submit into the shared workflow.</h3>
            <p className="mt-2 text-[13px] leading-relaxed">Claude Code, another agent, or an analyst can read the assignment and submit the same JSON deliverable. The platform validates the structure and source references, records who submitted it, and routes it to {a.reviewer}.</p>
            <p className="mt-2 text-[12px] text-muted">{import.meta.env.DEV
              ? 'Local demo bridge: keep this browser signed in. The CLI targets this browser’s in-memory session; refresh resets the demo.'
              : 'Public demo: use the built-in agent console below. External terminal submissions require the local development server; the presenter guide explains that optional setup.'}</p>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-line bg-deep p-4 font-mono text-[12px] leading-relaxed text-paper">{import.meta.env.DEV
            ? a.mode === 'type2' ? command : `node scripts/apex.mjs tasks get ${a.id}\nnode scripts/apex.mjs funds get ${a.fundId}\nnode scripts/apex.mjs book get`
            : `tasks get ${a.id}\n${a.id === 'A-101' ? 'tasks submit A-101 --example' : `funds get ${a.fundId}`}\nbook get`}</pre>
          {!import.meta.env.DEV && <Btn onClick={() => { openAssignment(null); useStore.getState().setShell(true); }}><Terminal size={13} />Open browser agent console</Btn>}
          <div className="flex flex-wrap gap-2"><Btn onClick={() => download(`${a.id}-assignment.json`, a)}><Download size={13} />Download brief & sources</Btn>{a.mode === 'type2' && <Btn onClick={() => download('research.json', a.id === 'A-101' ? SILK_DRAFT : draft)}><Download size={13} />Download submission JSON</Btn>}</div>
          <div className="grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-line bg-surface p-4"><h3 className="text-[13px] font-semibold">Agent tools</h3><p className="mt-2 text-[13px] leading-relaxed text-muted">Read funds, documents, tasks, book and audit. Submit research or stage a proposed book. The agent works externally and submits its findings for human review.</p></div><div className="rounded-lg border border-line bg-surface p-4"><h3 className="text-[13px] font-semibold">Platform contract</h3><p className="mt-2 text-[13px] leading-relaxed text-muted">Required fields and recognized source IDs are checked by code. Human acceptance is separate from submission. Investment approval remains with the PM.</p></div></div>
          {a.mode === 'type2' && <details><summary className="cursor-pointer text-[13px] text-muted">Submission shape</summary><pre className="mt-2 overflow-x-auto rounded border border-line bg-surface p-3 text-[12px]">{JSON.stringify({ recommendation: '...', rationale: '...', risks: '...', conditions: '...', sources: a.sources.map((s) => s.id) }, null, 2)}</pre></details>}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-lg border border-line bg-surface p-4"><h3 className="text-[13px] font-semibold">The brief</h3><p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{plainText(a.brief)}</p><h4 className="mt-4 text-[12px] font-medium">Required deliverables</h4><ul className="mt-2 space-y-2 text-[12px] text-muted">{a.deliverables.map((d) => <li key={d} className="flex gap-2"><FileText size={12} className="mt-0.5 shrink-0" />{d}</li>)}</ul></section>
            <section><h3 className="mb-2 text-[13px] font-semibold">Source library <span className="font-normal text-muted">· {a.sources.length}</span></h3>{a.sources.map((s) => <details key={s.id} className="mb-2 rounded-lg border border-line bg-surface p-3"><summary className="cursor-pointer text-[12px] font-medium">{s.title}</summary><p className="mt-3 text-[12px] leading-relaxed text-muted">{s.excerpt}</p></details>)}{!a.sources.length && <p className="text-[12px] text-muted">Evidence is available in the linked operational workflow.</p>}</section>
            <section className="rounded-lg border border-dashed border-line p-3"><h3 className="text-[12px] font-semibold">What happens next</h3><p className="mt-2 text-[12px] leading-relaxed text-muted">{plainText(a.next)}</p>{a.parentId && <button onClick={() => openAssignment(a.parentId!)} className="mt-2 text-[12px] text-ai hover:underline">View originating decision ↗</button>}</section>
          </aside>
          <div className="min-w-0 space-y-4">
            {a.mode === 'type2' ? <>
              {editable && (
                <div className="rounded-lg border border-ai/25 bg-ai/5 p-4">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-ai"><Bot size={16} />AI-assisted research</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted">Let an agent investigate and prepare the work. Add your judgment, then submit a structured recommendation.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.mode === 'type2' && <Btn tone="blue" disabled={!!a.draft} onClick={() => prepare(a.id)}>{a.draft ? 'Prepared draft loaded' : 'Load prepared AI research'}</Btn>}
                    <button onClick={() => setTab('agent')} className="text-[12px] text-ai hover:underline">Use an external agent ↗</button>
                    <label className="inline-flex cursor-pointer items-center gap-1 text-[12px] text-ai">
                      <Upload size={12} />Import JSON
                      <input type="file" accept=".json,application/json" className="sr-only" onChange={importDraft} />
                    </label>
                  </div>
                  <p className="mt-2 text-[12px] text-muted">{import.meta.env.DEV ? 'The prepared example illustrates agent output; external CLI submissions are live.' : 'Prepared research for the demo. You can also submit through the browser agent console.'}</p>
                </div>
              )}
              <section data-tour="assignment.submit" className="rounded-lg border border-line bg-surface p-4">
                <div className="mb-4 flex items-center justify-between gap-2"><h3 className="text-[15px] font-semibold">{editable ? 'Working submission' : `Submitted work · v${latest?.version ?? 1}`}</h3>{latest && !editable && <Badge tone="blue">{latest.via === 'form' ? 'Portal' : latest.via.toUpperCase()}</Badge>}</div>
                {latest && !editable && <p className="mb-3 text-[12px] text-muted">Submitted by {latest.by} · {latest.at}</p>}
                <div className="space-y-4">{([['recommendation', 'Recommendation'], ['rationale', 'Investment rationale'], ['risks', 'Key risks'], ['conditions', 'Conditions & follow-up']] as const).map(([key, label]) => <label key={key} className="block text-[12px] font-medium text-ink">{label}{editable ? <textarea aria-label={label} value={draft[key]} onChange={(e) => change(key, e.target.value)} rows={key === 'rationale' ? 5 : 3} placeholder={key === 'conditions' ? 'What must be confirmed before the next decision?' : `Enter ${label.toLowerCase()}…`} className="mt-1.5 block w-full resize-y rounded border border-line bg-paper px-3 py-2 text-[13px] font-normal leading-relaxed outline-none focus:border-ai" /> : <p className="mt-1.5 whitespace-pre-wrap text-[13px] font-normal leading-relaxed text-muted">{draft[key]}</p>}</label>)}</div>
                <h4 className="mt-4 text-[12px] font-medium">Source references</h4><div className="mt-2 flex flex-wrap gap-2">{a.sources.map((s) => editable ? <label key={s.id} className="flex items-center gap-1.5 rounded border border-line px-2 py-1 text-[12px]"><input type="checkbox" checked={draft.sources.includes(s.id)} onChange={(e) => change('sources', e.target.checked ? [...draft.sources, s.id] : draft.sources.filter((id) => id !== s.id))} />{s.title}</label> : draft.sources.includes(s.id) && <Badge key={s.id} tone="blue">{s.title}</Badge>)}</div>
                {editable && <div className="mt-5 border-t border-line pt-3"><Btn tone="emerald" onClick={() => report(submit(a.id, draft, 'form'))}>Submit for review <ArrowRight size={13} /></Btn><p className="mt-2 text-[12px] text-muted">Required sections and evidence references are checked automatically. {a.reviewer} reviews the recommendation.</p></div>}
              </section>
              {a.status === 'Needs review' && <section data-tour="assignment.submit" className="rounded-lg border border-wait/30 bg-surface p-4"><h3 className="text-[15px] font-semibold">Human decision</h3><p className="mt-1 text-[12px] text-muted">{canReview ? 'Add the judgment that should travel with this work.' : `Awaiting ${a.reviewer}. Switch the demo role to PM to review.`}</p><textarea aria-label="Review note" value={note} onChange={(e) => setNote(e.target.value)} disabled={!canReview} rows={3} placeholder="E.g. Proceed to diligence; independently confirm redemption terms first." className="mt-3 w-full rounded border border-line bg-paper p-3 text-[13px] outline-none focus:border-ai disabled:opacity-50" /><div className="mt-3 flex flex-wrap gap-2"><Btn tone="emerald" disabled={!canReview} onClick={() => report(review(a.id, 'accepted', note))}>{a.id === 'A-101' ? 'Accept → begin diligence' : 'Accept & assign follow-up'}</Btn><Btn disabled={!canReview} onClick={() => report(review(a.id, 'changes requested', note))}>Request changes</Btn></div></section>}
            </> : (
              <section className="rounded-lg border border-line bg-surface p-4">
                <h3 className="text-[15px] font-semibold">Operational work</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{a.blocker ?? a.next}</p>
                {a.id === 'A-101-NEXT' && (
                  <p className="mt-2 text-[12px] text-muted">Record what you sent and who you sent it to. This demo saves the task status; it does not send an email or receive documents.</p>
                )}
                {a.docId ? (
                  <Btn className="mt-4" tone="blue" onClick={() => goFund(true)}>Open document review <ArrowRight size={13} /></Btn>
                ) : a.destination === 'book' ? (
                  <Btn className="mt-4" onClick={() => { openAssignment(null); setView('book'); }}>Open portfolio & limits <ArrowRight size={13} /></Btn>
                ) : a.status !== 'Done' && (
                  <>
                    <textarea aria-label="Activity note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Record the action taken or the reply received…" className="mt-4 w-full rounded border border-line bg-paper p-3 text-[13px] outline-none focus:border-ai" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn onClick={() => report(update(a.id, 'In progress', note))}>Record progress</Btn>
                      <Btn onClick={() => report(update(a.id, 'Waiting externally', note))}>{a.id === 'A-101-NEXT' ? 'Record request sent' : 'Mark waiting for reply'}</Btn>
                      <Btn tone="emerald" onClick={() => report(update(a.id, 'Done', note))}>Complete task</Btn>
                    </div>
                  </>
                )}
              </section>
            )}
            {feedback && <p role="status" className="rounded-lg border border-line bg-surface p-3 text-[13px]">{feedback}</p>}
            {next && <div className="rounded-lg border border-pass/30 bg-pass/5 p-4"><Badge tone="emerald">Handoff created</Badge><h3 className="mt-2 text-[15px] font-semibold">{next.title}</h3><p className="mt-1 text-[12px] text-muted">Assigned to {next.owner} · due {next.due}</p><p className="mt-2 text-[13px] text-muted">The submitted conditions and review note are attached to the new assignment.</p><Btn className="mt-3" onClick={() => openAssignment(next.id)}>Open next assignment <ArrowRight size={13} /></Btn></div>}
            {!!a.activity?.length && <section><h3 className="mb-2 text-[13px] font-semibold">Activity</h3>{[...a.activity].reverse().map((event, i) => <div key={i} className="mb-2 rounded border border-line bg-surface p-3 text-[12px]"><p className="text-muted">{event.at} · {event.by} · {event.status}</p><p className="mt-1 whitespace-pre-wrap">{event.note}</p></div>)}</section>}
            {!!a.revisions.length && <section><h3 className="mb-2 text-[13px] font-semibold">Submission & decision history</h3>{[...a.revisions].reverse().map((r) => <details key={r.version} className="mb-2 rounded border border-line bg-surface p-3"><summary className="cursor-pointer text-[12px]">v{r.version} · {r.by} · {r.decision ?? 'Awaiting review'}</summary>{r.reviewNote && <p className="mt-3 text-[13px] leading-relaxed">{r.reviewer} · {r.reviewedAt}<br />{r.reviewNote}</p>}<p className="mt-3 text-sm">{r.content.recommendation}</p><details className="mt-2"><summary className="text-xs text-muted">Technical details · submission JSON</summary><pre className="mt-3 whitespace-pre-wrap break-words text-[12px] text-muted">{JSON.stringify(r.content, null, 2)}</pre></details></details>)}</section>}
          </div>
        </div>
      )}
    </div>
  );
}
