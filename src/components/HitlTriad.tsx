import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { Btn } from './Ui';
import RejectBox from './RejectBox';

export default function HitlTriad({
  approveLabel = 'Approve',
  onFix,
  onApprove,
  onReject,
  wantReject,
  onWantRejectConsumed,
  hotkeys = false,
}: {
  approveLabel?: string;
  onFix: () => void;
  onApprove: () => void;
  onReject: (reason: string, note: string) => void;
  wantReject?: boolean;
  onWantRejectConsumed?: () => void;
  hotkeys?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (wantReject) {
      setOpen(true);
      onWantRejectConsumed?.();
    }
  }, [wantReject, onWantRejectConsumed]);

  useEffect(() => {
    if (!hotkeys) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
      if (e.key === 'Escape') {
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        }
        return;
      }
      if (typing || open) return;
      // hotkeys belong to the visible review surface — not to a doc hidden under a sheet
      const s = useStore.getState();
      if (s.auditOpen || s.ddqOpen || s.paletteOpen || s.shellOpen || s.modulesOpen || s.policyOpen || s.assignmentId) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onApprove();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onFix();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  }, [hotkeys, open, onFix, onApprove]);

  return (
    <footer className="relative flex shrink-0 flex-wrap items-center gap-2 border-t border-line bg-surface px-4 py-2.5">
      <Btn size="sm" onClick={onFix}>
        Fix and approve
      </Btn>
      <Btn size="sm" tone="emerald" onClick={onApprove}>
        {approveLabel}
      </Btn>
      <div className="relative">
        <Btn size="sm" tone="crimson" onClick={() => setOpen((v) => !v)}>
          Reject
        </Btn>
        {open && (
          <div className="absolute bottom-9 left-0 z-20">
            <RejectBox
              onCancel={() => setOpen(false)}
              onSubmit={(reason, note) => {
                setOpen(false);
                onReject(reason, note);
              }}
            />
          </div>
        )}
      </div>
    </footer>
  );
}
