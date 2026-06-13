interface Props {
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  showSpacing: boolean;
  onChange: (key: 'size' | 'opacity' | 'hardness' | 'spacing', value: number) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm font-inter text-text-secondary mb-1">
        <span>{label}</span>
        <span className="font-mono text-text-primary">
          {unit === '%' ? Math.round(value * 100) : Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={unit === '%' ? value * 100 : value}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(unit === '%' ? v / 100 : v);
        }}
        className="w-full accent-accent-primary min-h-[44px]"
      />
    </div>
  );
}

export function BrushSettings({
  size,
  opacity,
  hardness,
  spacing,
  showSpacing,
  onChange,
}: Props) {
  return (
    <div className="panel-section">
      <h3 className="font-bangers text-accent-primary text-lg mb-2">Brush Settings</h3>
      <Slider label="Brush size" value={size} min={1} max={80} unit="px" onChange={(v) => onChange('size', v)} />
      <Slider label="Opacity" value={opacity} min={10} max={100} unit="%" onChange={(v) => onChange('opacity', v)} />
      <Slider label="Hardness" value={hardness} min={0} max={100} unit="%" onChange={(v) => onChange('hardness', v)} />
      {showSpacing && (
        <Slider label="Spacing" value={spacing} min={1} max={30} unit="" onChange={(v) => onChange('spacing', v)} />
      )}
    </div>
  );
}
