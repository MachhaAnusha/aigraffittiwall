import { SubmissionCard } from './SubmissionCard';

interface PendingSubmission {
  submissionId: string;
  previewDataURL: string;
  metadata: {
    textInput?: string;
    stylePreset?: string;
    deviceId?: string;
    timestamp?: number;
  };
}

interface Props {
  pending: PendingSubmission[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalQueue({ pending, onApprove, onReject }: Props) {
  return (
    <section className="mb-6">
      <h2 className="font-bangers text-2xl text-accent-primary mb-3">Approval Queue</h2>
      {pending.length === 0 ? (
        <p className="text-text-secondary font-inter text-sm">No pending submissions</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pending.map((s) => (
            <SubmissionCard
              key={s.submissionId}
              submission={s}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </section>
  );
}
