import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

/* ------------------------------------------------------------------ button */

const buttonVariants = cva(
  'inline-flex h-8 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium transition-colors duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai',
  {
    variants: {
      tone: {
        ghost: 'border-line bg-transparent text-ink hover:bg-paper',
        emerald: 'border-rail bg-rail text-white hover:bg-ink',
        amber: 'border-wait/30 bg-wait/10 text-wait hover:bg-wait/15',
        crimson: 'border-transparent bg-transparent text-stop hover:bg-stop/10',
        blue: 'border-ai/30 bg-ai/10 text-ai hover:bg-ai/15',
      },
      size: {
        xs: 'h-7 px-2 text-[12px]',
        sm: 'h-8 px-2.5 text-[12px]',
        md: 'h-8 px-3 text-[13px]',
        lg: 'h-8 px-4 text-[13px]',
      },
    },
    defaultVariants: { tone: 'ghost', size: 'md' },
  }
);

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export function Btn({ className, tone, size, ...props }: BtnProps) {
  return <button className={cn(buttonVariants({ tone, size }), className)} {...props} />;
}

/* ------------------------------------------------------------------- badge */

export function Badge({ tone = 'slate', children, className }: { tone?: 'slate' | 'emerald' | 'amber' | 'crimson' | 'blue'; children: ReactNode; className?: string }) {
  const map: Record<string, string> = {
    slate: 'bg-paper text-muted',
    emerald: 'bg-pass/10 text-pass',
    amber: 'bg-wait/10 text-wait',
    crimson: 'bg-stop/10 text-stop',
    blue: 'bg-ai/10 text-ai',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px]', map[tone], className)}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- card */

export function Card({ title, sub, right, children, tone, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; tone?: 'amber' | 'crimson' | 'emerald' | 'blue'; className?: string }) {
  const edge = tone === 'amber' ? 'border-wait/40' : tone === 'crimson' ? 'border-stop/40' : tone === 'emerald' ? 'border-pass/30' : tone === 'blue' ? 'border-ai/30' : 'border-line';
  return (
    <section className={cn('rounded-lg border bg-surface shadow-card', edge, className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {sub && <p className="mt-0.5 text-[12px] leading-snug text-muted">{sub}</p>}
        </div>
        {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------- input */

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[12px] text-ink tabular-nums',
        'placeholder:text-muted/70 transition-colors',
        'hover:border-line2 focus:border-ai focus:shadow-[0_0_0_2px_rgb(33_82_199/0.18)] focus:outline-none',
        className
      )}
      {...props}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-paper px-1 py-px font-mono text-[12px] font-medium text-muted">{children}</kbd>;
}

/* ------------------------------------------------------------------ tables */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-line bg-surface', className)}>
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('h-10 border-b border-line bg-paper px-3 text-left text-[12px] font-medium text-muted', className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('h-10 border-b border-line px-3 align-middle', className)}>{children}</td>;
}

/* --------------------------------------------------------------------- bar */

export function Bar({ pct, tone = 'emerald', thick }: { pct: number; tone?: 'emerald' | 'amber' | 'crimson' | 'blue' | 'slate'; thick?: boolean }) {
  const map: Record<string, string> = {
    emerald: 'bg-pass',
    amber: 'bg-wait',
    crimson: 'bg-stop',
    blue: 'bg-ai',
    slate: 'bg-muted/50',
  };
  return (
    <span className={cn('block w-full overflow-hidden rounded-full bg-line', thick ? 'h-1.5' : 'h-1')}>
      <span className={cn('block h-full rounded-full transition-all duration-500', map[tone])} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  );
}

/* ------------------------------------------------------------------- sheet */

export function Sheet({ open, onClose, title, sub, right, children, footer, width = 'w-[480px]' }: {
  open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/30 animate-fade" />
        <Dialog.Content className={cn('fixed inset-y-0 right-0 z-[75] flex flex-col border-l border-line bg-paper shadow-pop animate-sheet', width, 'max-w-[94vw]')}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <Dialog.Title className="text-[15px] font-semibold text-ink">{title}</Dialog.Title>
              {sub && <Dialog.Description className="mt-0.5 text-[12px] text-muted">{sub}</Dialog.Description>}
            </div>
            <div className="flex items-center gap-2">
              {right}
              <Dialog.Close className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-ink" aria-label="close"><X size={15} /></Dialog.Close>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-paper">{children}</div>
          {footer && <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-4 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------------------------------------------- modal */

export function Modal({ open, onClose, title, sub, children, width = 'w-[860px]' }: {
  open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; width?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/35 animate-fade" />
        <Dialog.Content className={cn('fixed left-1/2 top-1/2 z-[85] max-h-[88vh] w-[860px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-surface shadow-pop animate-pop', width, 'max-w-[94vw]')}>
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
            <div className="min-w-0">
              <Dialog.Title className="text-[15px] font-semibold text-ink">{title}</Dialog.Title>
              {sub && <Dialog.Description className="mt-0.5 text-[12px] text-muted">{sub}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted transition-colors hover:bg-paper hover:text-ink" aria-label="close"><X size={15} /></Dialog.Close>
          </div>
          <div className="p-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* -------------------------------------------------------------------- tabs */

export const RTabs = {
  Root: Tabs.Root,
  List: ({ children, className }: { children: ReactNode; className?: string }) => (
    <Tabs.List className={cn('flex flex-wrap gap-1 border-b border-line px-1', className)}>{children}</Tabs.List>
  ),
  Trigger: ({ value, children }: { value: string; children: ReactNode }) => (
    <Tabs.Trigger
      value={value}
      className={cn(
        '-mb-px rounded-t-md border border-b-0 border-transparent px-3 py-2 text-[13px] font-medium text-muted transition-colors',
        'hover:text-ink data-[state=active]:border-line data-[state=active]:bg-surface data-[state=active]:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai'
      )}
    >
      {children}
    </Tabs.Trigger>
  ),
  Content: ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => (
    <Tabs.Content value={value} className={cn('focus-visible:outline-none animate-fade pt-4', className)}>{children}</Tabs.Content>
  ),
};

/* ----------------------------------------------------------------- tooltip */

export function Tip({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={220}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={6} className="z-[120] rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink shadow-pop animate-fade">
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

/* ------------------------------------------------------------------ arrows */

export function Delta({ v, digits = 1, unit = '' }: { v: number; digits?: number; unit?: string }) {
  if (Math.abs(v) < 0.051) return <span className="font-mono text-[12px] text-muted">·</span>;
  const up = v > 0;
  return (
    <span className={cn('font-mono text-[12px] font-medium tabular-nums', up ? 'text-wait' : 'text-ai')}>
      {up ? '▲' : '▼'} {Math.abs(v).toFixed(digits)}{unit}
    </span>
  );
}
