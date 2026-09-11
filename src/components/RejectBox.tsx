import { useState } from 'react';
import { REJECT_REASONS } from '../lib/types';
import { Btn } from './Ui';

export default function RejectBox({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (reason: string, note: string) => void;
}) {
  const [reason, setReason] = useState<string>(REJECT_REASONS[0]);
  const [note, setNote] = useState('');

  return (
    <div className="w-[280px] rounded-md border border-line bg-surface p-3 shadow-pop">
      <div className="mb-2 text-[13px] font-medium text-ink">Reject</div>
      <div className="space-y-1">
        {REJECT_REASONS.map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 text-[12px] text-ink">
            <input
              type="radio"
              name="reject-reason"
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-ink"
            />
            {r}
          </label>
        ))}
      </div>
      <textarea
        value={note}
        maxLength={140}
        onChange={(e) => setNote(e.target.value.slice(0, 140))}
        placeholder="Note"
        className="mt-2 h-16 w-full resize-none rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] text-ink outline-none focus:border-ai"
      />
      <div className="mt-0.5 text-right font-mono text-[12px] tabular-nums text-muted">{note.length}/140</div>
      <div className="mt-2 flex justify-end gap-2">
        <Btn size="sm" onClick={onCancel}>
          Cancel
        </Btn>
        <Btn size="sm" tone="crimson" onClick={() => onSubmit(reason, note)}>
          Reject
        </Btn>
      </div>
    </div>
  );
}
