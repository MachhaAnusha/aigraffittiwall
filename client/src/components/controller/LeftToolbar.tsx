import { useState } from 'react';
import type { ToolType } from '../../utils/promptBuilder';

const TOOLS: { id: ToolType; icon: string; label: string }[] = [
  { id: 'text', icon: 'T', label: 'Text' },
  { id: 'brush', icon: '🖌', label: 'Brush' },
  { id: 'spray', icon: '🎨', label: 'Spray' },
  { id: 'fill', icon: '🪣', label: 'Fill' },
  { id: 'eraser', icon: '⌫', label: 'Eraser' },
  { id: 'select', icon: '↖', label: 'Select' },
];

interface Props {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  horizontal?: boolean;
}

export function LeftToolbar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onClear,
  horizontal = false,
}: Props) {
  const [confirmClear, setConfirmClear] = useState(false);

  const btnClass = (active: boolean) =>
    `min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border transition-all duration-150 ${
      active
        ? 'border-accent-glow tool-active bg-bg-tertiary text-accent-primary'
        : 'border-border bg-bg-secondary text-text-secondary hover:border-accent-primary'
    }`;

  const containerClass = horizontal
    ? 'flex flex-row gap-2 overflow-x-auto px-2 py-2 bg-bg-secondary border-t border-border'
    : 'flex flex-col gap-2 p-2 bg-bg-secondary border-r border-border w-14 shrink-0';

  return (
    <div className={containerClass}>
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          className={btnClass(activeTool === t.id)}
          onClick={() => onToolChange(t.id)}
        >
          <span className="font-bangers text-lg">{t.icon}</span>
        </button>
      ))}
      <div className={horizontal ? 'w-px bg-border mx-1' : 'h-px bg-border my-1'} />
      <button type="button" className={btnClass(false)} onClick={onUndo} title="Undo">
        ↩
      </button>
      <button type="button" className={btnClass(false)} onClick={onRedo} title="Redo">
        ↪
      </button>
      <button
        type="button"
        className={btnClass(false)}
        onClick={() => {
          if (confirmClear) {
            onClear();
            setConfirmClear(false);
          } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
          }
        }}
        title={confirmClear ? 'Tap again to confirm' : 'Clear'}
      >
        {confirmClear ? '✓' : '🗑'}
      </button>
    </div>
  );
}