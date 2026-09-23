import Funds from './components/Funds';
import TodayWorkspace from './components/TodayWorkspace';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useStore, openApprovals, worstNav, CASH_YTD } from './lib/store';
import { validateBook, weightedYtd } from './lib/rules';
import Rail from './components/Rail';
import StatusBar from './components/StatusBar';
import FundPage from './components/FundPage';
import ModulesSheet from './components/ModulesSheet';
import Login from './components/Login';
import Portfolio from './components/Portfolio';
import Shell from './components/Shell';
import Palette from './components/Palette';
import Tour from './components/Tour';
import Assignment from './components/Assignment';
import { startAgentBridge } from './lib/agentBridge';
import { AuditDrawer, DdqExport, EntityAudit } from './components/Drawers';

/** dev-only boot-parity assertion — the demo checks itself the way it checks books */
function parityCheck() {
  const s = useStore.getState();
  const errs: string[] = [];
  const received = s.funds.filter((f) => f.pack !== 'MISSING').length;
  if (received !== 5) errs.push(`packs received ${received} ≠ 5/6`);
  const ytd = weightedYtd(s.book, s.funds, CASH_YTD);
  if (Math.abs(ytd - 6.7) > 0.05) errs.push(`ytd ${ytd.toFixed(2)} ≠ 6.7`);
  const cash = s.book.CASH ?? 0;
  if (Math.abs(cash - 11.0) > 0.001) errs.push(`cash ${cash} ≠ 11.0`);
  const w = worstNav(s.funds);
  if (w.age !== 38) errs.push(`worst nav ${w.age}d ≠ 38d (Sable)`);
  const approvals = openApprovals(s);
  if (approvals !== 5) errs.push(`open approvals ${approvals} ≠ 5`);
  const [a1, a2] = s.audit;
  if (!a1 || a1.t !== '09:41:02' || !a2 || a2.t !== '09:41:03') errs.push('seed audit stamps moved');
  if (!validateBook(s.book, s.funds).some((v) => v.rule === 'E')) errs.push('Rule E not failing at boot');
  if (errs.length) console.error('[parity] BROKEN —', errs.join(' · '));
  else console.info('[parity] boot state OK — 5/6 packs · +6.7% · cash 11.0 · Sable 38d · badge 5 · Rule E BLOCKED');
}

export default function App() {
  const identity = useStore((s) => s.identity);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const setAudit = useStore((s) => s.setAudit);
  const setShell = useStore((s) => s.setShell);
  const setPalette = useStore((s) => s.setPalette);
  const shellOpen = useStore((s) => s.shellOpen);

  useEffect(() => {
    if (import.meta.env.DEV && identity) return startAgentBridge();
  }, [identity]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(!useStore.getState().paletteOpen);
        return;
      }
      // Esc exits the tour even while typing (e.g. the intake input), unless an overlay owns the key
      if (e.key === 'Escape' && typing) {
        const st = useStore.getState();
        if (st.tourActive && !(st.auditOpen || st.ddqOpen || st.paletteOpen || st.shellOpen || st.modulesOpen || st.policyOpen || st.assignmentId)) st.exitTour();
        return;
      }
      if (typing) return;
      if (e.key === 'Escape') {
        if (useStore.getState().tourActive) useStore.getState().exitTour();
        useStore.getState().closeAllOverlays();
        return;
      }
      // never switch views under an open overlay — the visible surface owns the keys
      const s = useStore.getState();
      if (s.tourActive || s.auditOpen || s.ddqOpen || s.paletteOpen || s.shellOpen || s.modulesOpen || s.policyOpen || s.assignmentId) return;
      if (e.key === '1') setView('today');
      else if (e.key === '2') setView('book');
      else if (e.key === '3') setAudit(true);
      else if (e.key === '4') setView('team');
      else if (e.key === '`') setShell(!useStore.getState().shellOpen);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [setView, setAudit, setShell, setPalette]);

  useEffect(() => {
    if (import.meta.env.DEV) parityCheck();
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Toaster
        theme="light"
        position="bottom-right"
        offset={shellOpen ? '45vh' : 16}
        duration={3200}
        toastOptions={{ style: { borderRadius: '6px', border: '1px solid #E6E1D8', background: '#FFFDF8', color: '#1B2430' } }}
      />
      {!identity ? (
        <Login />
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Rail />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <StatusBar />
            <main
              className={`min-h-0 flex-1 ${
                view === 'today' || view === 'fund' ? 'overflow-hidden' : 'overflow-y-auto px-6 py-5'
              } ${shellOpen ? (view === 'today' || view === 'fund' ? 'pb-[42vh]' : 'pb-[46vh]') : ''}`}
            >
              {view === 'today' && <TodayWorkspace />}
              {view === 'book' && <Portfolio />}
              {view === 'fund' && <FundPage />}
              {view === 'funds' && <Funds />}
            </main>
          </div>
          <AuditDrawer />
          <DdqExport />
          <EntityAudit />
          <ModulesSheet />
          <Assignment />
          <Palette />
          <Shell />
          <Tour />
        </div>
      )}
    </div>
  );
}
