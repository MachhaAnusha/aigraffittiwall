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
  submission: PendingSubmission;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function SubmissionCard({ submission, onApprove, onReject }: Props) {
  const { submissionId, previewDataURL, metadata } = submission;
  const time = metadata.timestamp
    ? new Date(metadata.timestamp).toLocaleTimeString()
    : '';

  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 flex flex-col gap-2">
      <img
        src={previewDataURL}
        alt="Preview"
        className="w-full aspect-video object-contain bg-bg-primary rounded"
      />
      {metadata.textInput && (
        <p className="text-sm text-text-secondary truncate">&quot;{metadata.textInput}&quot;</p>
      )}
      <p className="text-xs text-text-secondary">
        {metadata.stylePreset} · {time}
      </p>
      <p className="text-xs font-mono text-text-secondary truncate">
        Device: {metadata.deviceId?.slice(0, 8)}…
      </p>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => onApprove(submissionId)}
          className="flex-1 py-2 bg-success/20 text-success border border-success rounded min-h-[44px] font-inter text-sm"
        >
          Approve ✓
        </button>
        <button
          type="button"
          onClick={() => onReject(submissionId)}
          className="flex-1 py-2 bg-danger/20 text-danger border border-danger rounded min-h-[44px] font-inter text-sm"
        >
          Reject ✗
        </button>
      </div>
    </div>
  );
}
