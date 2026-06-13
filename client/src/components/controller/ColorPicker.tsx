import { HexColorPicker } from 'react-colorful';

interface Props {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
  label: string;
  showPicker?: boolean;
}

export function ColorPicker({ colors, selected, onSelect, label, showPicker = true }: Props) {
  return (
    <div className="panel-section">
      <h3 className="font-bangers text-accent-primary text-lg mb-2">{label}</h3>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className={`swatch w-10 h-10 rounded-full border-2 min-h-[44px] min-w-[44px] ${
              selected === c ? 'border-accent-glow tool-active' : 'border-border'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onSelect(c)}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      {showPicker && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full border-2 border-accent-primary shrink-0"
              style={{ backgroundColor: selected }}
            />
            <input
              type="text"
              value={selected}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) onSelect(v);
              }}
              className="flex-1 bg-bg-tertiary border border-border rounded px-2 py-2 font-mono text-sm min-h-[44px]"
              maxLength={7}
            />
          </div>
          <HexColorPicker color={selected} onChange={onSelect} className="w-full !h-32" />
        </>
      )}
    </div>
  );
}
