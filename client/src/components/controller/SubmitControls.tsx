import { StatusIndicator } from '../shared/StatusIndicator';
import type { SubmissionStatus } from '../../hooks/useSubmission';

interface Props {
  onGenerate: () => void;
  onQueue: () => void;
  status: SubmissionStatus;
  rejectReason?: string | null;
  cooldownMs?: number;
  disabled?: boolean;
}

export function SubmitControls({
  onGenerate,
  onQueue,
  status,
  rejectReason,
  cooldownMs,
  disabled,
}: Props) {
  return (
    <div className="panel-section hidden lg:block">
      <h3 className="font-bangers text-accent-primary text-lg mb-2">Submit</h3>
      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled || cooldownMs! > 0}
        className="generate-btn w-full py-3 mb-2 disabled:opacity-50 min-h-[44px]"
      >
        <span className="font-bangers text-xl text-accent-primary">Generate Art</span>
      </button>
      <button
        type="button"
        onClick={onQueue}
        disabled={disabled}
        className="w-full py-2 border border-accent-secondary text-accent-secondary rounded font-inter text-sm mb-3 min-h-[44px] hover:bg-bg-tertiary transition-all duration-150"
      >
        Add to Queue
      </button>
      <StatusIndicator status={status} rejectReason={rejectReason} cooldownMs={cooldownMs} />
    </div>
  );
}
