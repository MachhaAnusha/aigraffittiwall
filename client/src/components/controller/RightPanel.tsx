import { ColorPicker } from './ColorPicker';
import { BrushSettings } from './BrushSettings';
import { StylePresets } from './StylePresets';
import { AISettingsPanel } from './AISettings';
import { SubmitControls } from './SubmitControls';
import {
  FOREGROUND_COLORS,
  BACKGROUND_COLORS,
  type StylePreset,
  type BrushStyle,
  type AISettings,
} from '../../utils/promptBuilder';
import type { SubmissionStatus } from '../../hooks/useSubmission';

interface Props {
  strokeColor: string;
  backgroundColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  brushSpacing: number;
  brushStyle: BrushStyle;
  activeTool: string;
  stylePreset: StylePreset;
  aiSettings: AISettings;
  hasText: boolean;
  submissionStatus: SubmissionStatus;
  rejectReason?: string | null;
  cooldownMs?: number;
  onStrokeColor: (c: string) => void;
  onBackgroundColor: (c: string) => void;
  onBrushChange: (key: string, value: number) => void;
  onBrushStyle: (s: BrushStyle) => void;
  onStylePreset: (p: StylePreset) => void;
  onAISettings: (s: AISettings) => void;
  onGenerate: () => void;
  onQueue: () => void;
  disabled?: boolean;
  /** On tablet, show only one section per tab */
  section?: 'all' | 'color' | 'brush' | 'style' | 'ai';
}

const BRUSH_STYLES: { id: BrushStyle; label: string }[] = [
  { id: 'round', label: 'Round' },
  { id: 'flat', label: 'Flat' },
  { id: 'marker', label: 'Marker' },
  { id: 'aerosol', label: 'Aerosol' },
  { id: 'drip', label: 'Drip' },
];

export function RightPanel(props: Props) {
  const showSpacing = props.activeTool === 'spray' || props.brushStyle === 'aerosol';
  const section = props.section ?? 'all';
  const show = (s: typeof section) => section === 'all' || section === s;

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-bg-secondary border-l border-border overflow-y-auto p-4 shrink-0 max-h-full">
      {show('color') && (
        <>
          <ColorPicker
            colors={FOREGROUND_COLORS}
            selected={props.strokeColor}
            onSelect={props.onStrokeColor}
            label="Stroke colour"
          />
          <ColorPicker
            colors={BACKGROUND_COLORS}
            selected={props.backgroundColor}
            onSelect={props.onBackgroundColor}
            label="Wall colour"
            showPicker={false}
          />
        </>
      )}
      {show('brush') && (
      <>
      <BrushSettings
        size={props.brushSize}
        opacity={props.brushOpacity}
        hardness={props.brushHardness}
        spacing={props.brushSpacing}
        showSpacing={showSpacing}
        onChange={(key, value) => props.onBrushChange(key, value)}
      />
      <div className="panel-section">
        <h3 className="font-bangers text-accent-primary text-lg mb-2">Brush Style</h3>
        <div className="flex flex-wrap gap-1">
          {BRUSH_STYLES.map((s) => (
            <label key={s.id} className="pill-toggle cursor-pointer">
              <input
                type="radio"
                name="brushStyle"
                className="sr-only"
                checked={props.brushStyle === s.id}
                onChange={() => props.onBrushStyle(s.id)}
              />
              <span className="inline-block px-3 py-2 rounded-full text-xs border border-border bg-bg-tertiary min-h-[44px] flex items-center transition-all duration-150">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      </>
      )}
      {show('style') && (
      <StylePresets selected={props.stylePreset} onSelect={props.onStylePreset} />
      )}
      {show('ai') && (
      <AISettingsPanel
        settings={props.aiSettings}
        hasText={props.hasText}
        onChange={props.onAISettings}
      />
      )}
      <SubmitControls
        onGenerate={props.onGenerate}
        onQueue={props.onQueue}
        status={props.submissionStatus}
        rejectReason={props.rejectReason}
        cooldownMs={props.cooldownMs}
        disabled={props.disabled}
      />
    </aside>
  );
}
