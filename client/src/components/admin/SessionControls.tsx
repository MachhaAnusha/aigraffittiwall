interface Props {
  onClear: () => void;
  paused: boolean;
  onPauseToggle: () => void;
  onExport: () => void;
}

export function SessionControls({ onClear, paused, onPauseToggle, onExport }: Props) {
  return (
    <section className="mb-6 panel-section">
      <h2 className="font-bangers text-2xl text-accent-primary mb-3">Session Controls</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 border border-danger text-danger rounded min-h-[44px] font-inter text-sm hover:bg-danger/10 transition-all duration-150"
        >
          Clear wall
        </button>
        <button
          type="button"
          onClick={onPauseToggle}
          className={`px-4 py-2 border rounded min-h-[44px] font-inter text-sm transition-all duration-150 ${
            paused
              ? 'border-warning text-warning'
              : 'border-accent-secondary text-accent-secondary'
          }`}
        >
          {paused ? 'Resume submissions' : 'Pause submissions'}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="px-4 py-2 border border-accent-primary text-accent-primary rounded min-h-[44px] font-inter text-sm hover:bg-accent-primary/10 transition-all duration-150"
        >
          Export wall
        </button>
      </div>
    </section>
  );
}
