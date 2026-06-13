import { STYLE_PRESETS, PRESET_PALETTES, type StylePreset } from '../../utils/promptBuilder';

interface Props {
  selected: StylePreset;
  onSelect: (preset: StylePreset) => void;
}

export function StylePresets({ selected, onSelect }: Props) {
  return (
    <div className="panel-section">
      <h3 className="font-bangers text-accent-primary text-lg mb-2">Graffiti Style</h3>
      <div className="grid grid-cols-2 gap-2">
        {STYLE_PRESETS.map((preset) => {
          const palette = PRESET_PALETTES[preset];
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onSelect(preset)}
              className={`text-left p-2 rounded border min-h-[44px] transition-all duration-150 ${
                selected === preset
                  ? 'border-accent-glow tool-active bg-bg-tertiary'
                  : 'border-border bg-bg-secondary hover:border-accent-primary'
              }`}
            >
              <div className="flex gap-1 mb-1">
                <span className="w-3 h-3 rounded-full" style={{ background: palette.stroke }} />
                <span className="w-3 h-3 rounded-full" style={{ background: palette.background }} />
              </div>
              <span className="text-xs font-inter text-text-primary leading-tight">{preset}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
