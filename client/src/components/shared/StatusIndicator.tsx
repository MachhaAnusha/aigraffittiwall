import type { SubmissionStatus } from '../../hooks/useSubmission';

const LABELS: Record<SubmissionStatus, string> = {
  idle: 'Idle',
  waiting: 'Waiting for approval',
  generating: 'Generating',
  displaying: 'Displaying',
  rejected: 'Rejected',
};

const COLORS: Record<SubmissionStatus, string> = {
  idle: 'text-text-secondary',
  waiting: 'text-warning',
  generating: 'text-accent-secondary',
  displaying: 'text-success',
  rejected: 'text-danger',
};

interface Props {
  status: SubmissionStatus;
  rejectReason?: string | null;
  cooldownMs?: number;
}

export function StatusIndicator({ status, rejectReason, cooldownMs = 0 }: Props) {
  const cooldownSec = Math.ceil(cooldownMs / 1000);

  return (
    <div className="font-inter text-sm">
      <span className={`font-medium ${COLORS[status]}`}>{LABELS[status]}</span>
      {rejectReason && status === 'rejected' && (
        <p className="text-danger text-xs mt-1">{rejectReason}</p>
      )}
      {cooldownMs > 0 && (
        <p className="text-warning text-xs mt-1 font-mono">
          Cooldown: {Math.floor(cooldownSec / 60)}:{String(cooldownSec % 60).padStart(2, '0')}
        </p>
      )}
    </div>
  );
}
