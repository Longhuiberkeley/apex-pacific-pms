import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../lib/store';
import { CHAPTERS } from '../lib/tour';
import { cn } from '../lib/cn';
import { Btn, Modal } from './Ui';

/** Highlight: the ring is an outline ON the target element itself, so scrolling, layout shifts and
 *  unmounts keep it attached by construction. The coach docks opposite the target's centre so it
 *  does not cover what it is pointing at. */
function useHighlight(active: boolean, target: string | undefined, stepId: string | undefined, roleKey: string | undefined) {
  const [side, setSide] = useState<'left' | 'right'>('left');
  useEffect(() => {
    const clear = () => document.querySelectorAll('.tour-target').forEach((el) => el.classList.remove('tour-target'));
    if (!active || !target) { clear(); return; }
    const apply = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!el || !(el.offsetWidth || el.offsetHeight)) return false;
      el.classList.add('tour-target');
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const r = el.getBoundingClientRect();
      setSide(r.left + r.width / 2 < window.innerWidth / 2 ? 'right' : 'left');
      return true;
    };
    if (apply()) return clear;
    // targets inside sheets/modals mount a beat after the store update that reveals them — bounded retry
    const timers = [60, 200, 450].map((ms) => window.setTimeout(apply, ms));
    return () => { timers.forEach((t) => clearTimeout(t)); clear(); };
  }, [active, target, stepId, roleKey]);
  return side;
}

/** Guided walkthrough: chapter-card chooser + coach panel + element highlight. Both surfaces mount via createPortal(document.body) — structurally outside <main>, which is load-bearing for the language regex in scripts/verify-demo.mjs. */
export default function Tour() {
  const s = useStore();
  const chapter = CHAPTERS.find((c) => c.id === s.tourChapter) ?? null;
  const step = chapter?.steps[s.tourStep] ?? null;
  useEffect(() => {
    const st = useStore.getState();
    if (!st.tourActive || !st.tourChapter) return;
    CHAPTERS.find((c) => c.id === st.tourChapter)?.steps[st.tourStep]?.enter?.(st, st);
    st.setShell(false);
    // identity is a dep on purpose: role switches re-run enter, so the assignment reopens on the same step
  }, [s.tourActive, s.tourChapter, s.tourStep, s.identity?.email]);
  const targetKey = !step?.target ? undefined : typeof step.target === 'function' ? step.target(s) : step.target;
  const side = useHighlight(s.tourActive && !!chapter, targetKey, step?.id, s.identity?.email);
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
    <div tabIndex={0} onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); useStore.getState().exitTour(); } }} className={cn('pointer-events-auto fixed bottom-4 z-[110] w-[320px] max-w-[calc(100vw-246px)] animate-pop rounded-lg border border-line bg-surface shadow-pop', side === 'right' ? 'right-4' : 'left-[226px]')}>
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
