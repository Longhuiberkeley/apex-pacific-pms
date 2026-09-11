import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { VERBS, FENCE } from '../lib/verbs';
import { cn } from '../lib/cn';

function lineTone(l: string) {
  if (l.startsWith('»')) return 'text-pass-lt/80';
  if (l.startsWith('⛔') || l.includes('BLOCKED')) return 'text-stop-lt';
  if (l.startsWith('✓')) return 'text-pass-lt';
  if (l.startsWith('agent:')) return 'text-ai-lt';
  if (l.startsWith('engine:')) return 'text-wait-lt';
  if (l.startsWith('apex$')) return 'text-paper';
  return 'text-white/55';
}

export default function Shell() {
  const open = useStore((s) => s.shellOpen);
  const setShell = useStore((s) => s.setShell);
  const closeAllOverlays = useStore((s) => s.closeAllOverlays);
  const lines = useStore((s) => s.shellLines);
  const shellPrint = useStore((s) => s.shellPrint);
  const emitCmd = useStore((s) => s.emitCmd);
  const pushAudit = useStore((s) => s.pushAudit);
  const screener = useStore((s) => s.screener);
  const addCandidate = useStore((s) => s.addCandidate);
  const extractRun = useStore((s) => s.extractRun);
  const stage = useStore((s) => s.stage);
  const book = useStore((s) => s.book);
  const audit = useStore((s) => s.audit);
  const identity = useStore((s) => s.identity);
  const setTab = useStore((s) => s.setTab);
  const agentDemo = useStore((s) => s.agentDemo);
  const pasteAgentProposal = useStore((s) => s.pasteAgentProposal);
  const [cmd, setCmd] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, open]);

  if (!open) return null;

  const P = (s: string) => shellPrint(s);
  const blocked = (why: string, cmdStr: string) => {
    P(`⛔ BLOCKED — ${why}`);
    P('  the lever lives in the UI — when a human pulls it, the verb echoes here with --via=form');
    pushAudit('AGENT', `blocked ${cmdStr} via shell`, `fence: ${why}`);
    toast.error(`blocked — ${why}`);
  };

  const run = (raw: string) => {
    const c = raw.trim();
    if (!c) return;
    P(`apex$ ${c}`);
    const [verb, ...rest] = c.split(/\s+/);
    if (verb === 'help') {
      P('every verb maps to a form, a row, or a lever — forms echo back here:');
      VERBS.forEach((v) => P(`  ${v.cmd.padEnd(30)} ${v.desc}${v.gate ? '  ⚠ ' + v.gate : ''}`));
    } else if (verb === 'whoami') {
      P(identity ? `shell session — acting as agent (fenced) · signed-in human: ${identity.name} (${identity.role})` : 'no session');
      P('gated verbs (triage / weights / packs / verdicts / approvals) refuse agents — human-only levers.');
    } else if (verb === 'history') {
      const hist = lines.filter((l) => l.startsWith('apex$') || l.startsWith('»'));
      if (!hist.length) P('nothing yet — click anything in the UI, or run `agent demo`');
      hist.forEach((l) => P(l));
    } else if (verb === 'screen' && rest[0] === 'list') {
      screener.forEach((x) => P(`${x.id}  ${x.name.padEnd(24)} ${x.status.padEnd(7)} score ${x.score ?? '—'}`));
    } else if (verb === 'screen' && rest[0] === 'extract') {
      const r = extractRun();
      P(r.ok ? `✓ ${r.msg}` : `⛔ ${r.msg}`);
    } else if (verb === 'screen' && rest[0] === 'add') {
      const m = c.match(/"([^"]+)"/);
      const name = m?.[1] ?? rest[1] ?? 'Unnamed';
      const r = addCandidate(name, 'shell');
      P(r.ok ? `✓ ${r.msg}` : `⛔ ${r.msg}`);
    } else if (verb === 'screen' && rest[0] === 'triage') {
      blocked('agents may never change triage (fence line). a human triages in the pipeline.', `triage ${rest[1] ?? ''}`);
    } else if (verb === 'book' && rest[0] === 'approve') {
      blocked('the IC lever is human-only. a PM approves in Book.', 'book approve');
    } else if (verb === 'dd' && rest[0] === 'verdict') {
      blocked('the verdict is a human act. file it on the fund page.', `dd verdict ${rest[1] ?? ''}`);
    } else if (verb === 'audit' && rest[0] === 'tail') {
      const parsed = Number(rest[1] ?? 5);
      const n = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : 5;
      audit.slice(-n).forEach((a) => P(`${a.t} [${a.actor}] ${a.action}  #${a.h}`));
    } else if (verb === 'book' && (rest[0] === 'paste' || (rest[0] === 'propose' && rest.includes('--raw')))) {
      pasteAgentProposal('shell');
      P('✓ pasted raw agent book Σ 101.3 → Book · BLOCKED A/C/D/E');
    } else if (verb === 'book' && rest[0] === 'propose') {
      stage({ ...book });
      setTab('construct');
      P('✓ staged proposal → Book gate up · AWAITING HUMAN (shell never commits)');
      pushAudit('AGENT', 'book propose via shell — staged, awaiting human', '', 'PORT');
      emitCmd('book propose', 'shell');
    } else if (verb === 'agent' && rest[0] === 'demo') {
      agentDemo();
    } else {
      P(`unknown: ${c} — try help`);
    }
    setCmd('');
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex h-[42vh] min-h-[260px] flex-col border-t border-white/10 bg-deep shadow-pop">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2 text-[12px] text-white/45">
        <span className="font-medium text-[#F6F3EC]">shell</span>
        <span className="hidden sm:inline">same rails · agents work through the rails</span>
        <span className="ml-auto hidden font-mono text-[12px] text-white/30 md:inline">{FENCE}</span>
        <button onClick={() => setShell(false)} className="rounded p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white" title="close (esc)"><X size={13} /></button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-2 font-mono text-[12px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className={cn(lineTone(l), l.startsWith('»') && 'border-l border-white/15 pl-2')}>{l}</div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 px-4 py-2">
        <span className="font-mono text-[12px] font-semibold text-[#F6F3EC]">apex$</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run(cmd);
            if (e.key === 'Escape') closeAllOverlays();
          }}
          placeholder="try: agent demo · help · history"
          className="flex-1 bg-transparent font-mono text-[12px] text-[#F6F3EC] outline-none placeholder:text-white/25"
        />
      </div>
    </div>
  );
}
