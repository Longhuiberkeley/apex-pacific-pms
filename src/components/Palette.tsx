import { Command } from 'cmdk';
import { toast } from 'sonner';
import { useStore } from '../lib/store';
import { VERBS } from '../lib/verbs';

/** ⌘K — the command palette. Same verbs as the shell, same rails as the forms. */
export default function Palette() {
  const open = useStore((s) => s.paletteOpen);
  const setPalette = useStore((s) => s.setPalette);
  const setView = useStore((s) => s.setView);
  const setAudit = useStore((s) => s.setAudit);
  const setShell = useStore((s) => s.setShell);
  const setModules = useStore((s) => s.setModules);
  const shellPrint = useStore((s) => s.shellPrint);
  const extractRun = useStore((s) => s.extractRun);
  const agentDemo = useStore((s) => s.agentDemo);

  const nav = (fn: () => void) => () => {
    fn();
    setPalette(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(o) => setPalette(o)}
      label="command palette"
      overlayClassName="fixed inset-0 z-[90] bg-ink/30 animate-fade"
      contentClassName="fixed left-1/2 top-[18%] z-[95] w-[560px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-surface shadow-pop animate-pop"
      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-muted"
    >
      <Command.Input
        autoFocus
        placeholder="Run a verb…"
        className="w-full border-b border-line bg-transparent px-4 py-3 font-mono text-[13px] text-ink outline-none placeholder:text-muted"
      />
      <Command.List className="max-h-[46vh] overflow-y-auto p-1.5">
        <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted">No such verb — try help in the shell</Command.Empty>

        <Command.Group heading="Go">
          <Item onSelect={nav(() => setView('today'))}>Today</Item>
          <Item onSelect={nav(() => setView('book'))}>Book</Item>
          <Item onSelect={nav(() => setAudit(true))}>Audit</Item>
          <Item onSelect={nav(() => setModules(true))}>Modules</Item>
          <Item onSelect={nav(() => setShell(true))}>Shell</Item>
        </Command.Group>

        <Command.Group heading="Verbs">
          <Item
            onSelect={nav(() => {
              const r = extractRun();
              r.ok ? toast.success(r.msg) : toast.message(r.msg);
            })}
          >
            screen extract --now <span className="text-muted">· Type 1, cited, deduped</span>
          </Item>
          <Item
            onSelect={nav(() => {
              setShell(true);
              agentDemo();
            })}
          >
            agent demo <span className="text-muted">· raw agent vs the rails</span>
          </Item>
          <Item
            onSelect={nav(() => {
              setShell(true);
              shellPrint('verbs — every one maps to a form, a row, or a lever:');
              VERBS.forEach((v) => shellPrint(`  ${v.cmd.padEnd(34)} ${v.desc}${v.gate ? '  ⚠ ' + v.gate : ''}`));
            })}
          >
            help <span className="text-muted">· print the verb list in the shell</span>
          </Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}

function Item({ children, onSelect, hint }: { children: React.ReactNode; onSelect: () => void; hint?: string }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-mono text-[12px] text-ink transition-colors data-[selected=true]:bg-paper data-[selected=true]:text-ink"
    >
      {hint && <kbd className="rounded border border-line bg-paper px-1 font-mono text-[12px] text-muted">{hint}</kbd>}
      {children}
    </Command.Item>
  );
}
