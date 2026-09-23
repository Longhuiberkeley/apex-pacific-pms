import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../lib/store';
import { CHAPTERS } from '../lib/tour';
import { Btn, Modal } from './Ui';

/** Highlight ring: measured from the step's data-tour target; silently absent when the target is not mounted. */
function useRing(target: string | undefined, stepId: string | undefined) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const el = target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null;
      const r = el?.getBoundingClientRect();
      setRect(r && r.width > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height } : null);
    };
    measure();
    const timers = [60, 260].map((ms) => window.setTimeout(measure, ms));
    window.addEventListener('resize', measure);
    return () => { timers.forEach((t) => clearTimeout(t)); window.removeEventListener('resize', measure); };
  }, [target, stepId]);
  return rect;
}

/** Guided walkthrough: chapter-card chooser + coach panel + highlight ring. Both surfaces mount via createPortal(document.body) — structurally outside <main>, which is load-bearing for the language regex in scripts/verify-demo.mjs. */
export default function Tour() {
  const s = useStore();
  const chapter = CHAPTERS.find((c) => c.id === s.tourChapter) ?? null;
  const step = chapter?.steps[s.tourStep] ?? null;
  useEffect(() => {
    const st = useStore.getState();
    if (!st.tourActive || !st.tourChapter) return;
    CHAPTERS.find((c) => c.id === st.tourChapter)?.steps[st.tourStep]?.enter?.(st, st);
    st.setShell(false);
  }, [s.tourActive, s.tourChapter, s.tourStep]);
  const rect = useRing(step?.target, step?.id);
  const stepDone = step?.done?.(s) ?? false;
  if (!s.tourActive) return null;
  if (!chapter) return createPortal(
    <Modal open onClose={() => useStore.getState().exitTour()} title="Interactive demo" sub="Pick a chapter — any order · ~4 min end to end" width="w-[760px]">
      <div className="grid gap-3 sm:grid-cols-2">{CHAPTERS.map((c, i) => { const ok = s.tourDone.includes(c.id); const skipped = s.tourSkipped.includes(c.id); return (
        <button key={c.id} onClick={() => useStore.getState().openTourChapter(c.id)} className="rounded-lg border border-line bg-paper p-4 text-left transition-colors hover:border-ai hover:bg-ai/5">
          <div className="flex items-center justify-between gap-2"><b className="text-[13px] text-ink">{i + 1} · {c.title}</b>{ok ? <span className="text-[12px] text-pass">✓</span> : skipped ? <span className="text-[12px] text-muted">Skipped</span> : null}</div>
          <p className="mt-1 text-[12px] text-muted">{c.promise}</p>
          <p className="mt-2 text-[12px] text-muted">{c.steps.length} steps · {c.timebox}</p>
        </button>); })}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Btn tone="emerald" onClick={() => useStore.getState().openTourChapter(CHAPTERS[0].id)}>Start chapter 1</Btn><span className="text-[12px] text-muted">Guided walkthrough · refresh resets the demo state</span></div>
    </Modal>, document.body);
  const last = s.tourStep === chapter.steps.length - 1;
  return createPortal(<>
    {rect && <div className="tour-ring z-[105]" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />}
    <div tabIndex={0} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); useStore.getState().exitTour(); } }} className="fixed bottom-4 left-[226px] z-[110] w-[340px] animate-pop rounded-lg border border-line bg-surface shadow-pop">
      <div className="border-b border-line px-3 py-2"><b className="text-[13px] text-ink">{chapter.title}</b><p className="mt-0.5 text-[12px] text-muted">Step {s.tourStep + 1} of {chapter.steps.length}{stepDone ? ' · ✓ done' : ''}</p></div>
      <ul className="border-b border-line px-3 py-2 text-[12px]">{CHAPTERS.map((c) => <li key={c.id} className={s.tourDone.includes(c.id) ? 'text-pass' : c.id === chapter.id ? 'font-semibold text-ai' : s.tourSkipped.includes(c.id) ? 'text-muted' : 'text-ink'}>{s.tourDone.includes(c.id) ? '✓ ' : s.tourSkipped.includes(c.id) ? '— ' : '· '}{c.title}</li>)}</ul>
      <div className="px-3 py-2"><b className="text-[13px] text-ink">{step?.title}</b><p className="mt-1 text-[12px] leading-relaxed text-ink">{step?.body(useStore.getState())}</p>{step?.tech && <details className="mt-2"><summary className="cursor-pointer text-[12px] text-muted">Technical details</summary><p className="mt-1 font-mono text-[12px] text-muted">{step.tech}</p></details>}</div>
      <div className="border-t border-line px-3 py-2">
        <div className="flex items-center gap-2"><Btn size="sm" disabled={s.tourStep === 0} onClick={() => useStore.getState().tourBack()}>Back</Btn><Btn size="sm" tone={last ? 'emerald' : 'blue'} onClick={() => useStore.getState().tourNext(last)}>{last ? 'Finish chapter' : 'Next'}</Btn></div>
        <div className="mt-2 flex items-center gap-3 text-[12px]"><button onClick={() => useStore.getState().skipTourChapter()} className="text-muted hover:text-ink">Skip chapter</button><button onClick={() => useStore.getState().openTourChapter(null)} className="text-muted hover:text-ink">All chapters</button><button onClick={() => useStore.getState().exitTour()} className="text-muted hover:text-ink">Exit tour</button></div>
      </div>
    </div>
  </>, document.body);
}
