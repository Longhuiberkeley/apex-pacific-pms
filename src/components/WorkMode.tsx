import { Bot, ScanText, Workflow } from 'lucide-react';
import { MODE, type WorkMode } from '../lib/work';
import { Badge, Tip } from './Ui';

export function ModeBadge({ mode }: { mode: WorkMode }) {
  const Icon = mode === 'type2' ? Bot : mode === 'type1' ? ScanText : Workflow;
  return <Tip label={<div className="max-w-[280px] leading-relaxed">{MODE[mode].detail}</div>}><span tabIndex={0} className="inline-flex"><Badge tone={mode === 'deterministic' ? 'slate' : 'blue'}><Icon size={12} />{MODE[mode].label}</Badge></span></Tip>;
}

export default function WorkModes() {
  return (
    <div className="grid gap-2 lg:grid-cols-3">
      {(['deterministic', 'type1', 'type2'] as const).map((mode) => (
        <div key={mode} className="rounded-lg border border-line bg-surface px-3 py-3">
          <ModeBadge mode={mode} />
          <p className="mt-2 text-[12px] leading-relaxed text-muted">{mode === 'deterministic' ? 'One book, fixed checks, automatic handoffs.' : mode === 'type1' ? 'Read a document → verify fields → file a record.' : 'Research anywhere → submit here → human review.'}</p>
        </div>
      ))}
    </div>
  );
}
