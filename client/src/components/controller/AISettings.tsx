import { LANGUAGES, type AISettings as AISettingsType } from '../../utils/promptBuilder';

interface Props {
  settings: AISettingsType;
  hasText: boolean;
  onChange: (settings: AISettingsType) => void;
}

export function AISettingsPanel({ settings, hasText, onChange }: Props) {
  const update = (partial: Partial<AISettingsType>) => onChange({ ...settings, ...partial });

  return (
    <div className="panel-section">
      <h3 className="font-bangers text-accent-primary text-lg mb-2">AI Settings</h3>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>Style intensity</span>
          <span className="font-mono">{settings.styleIntensity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.styleIntensity}
          onChange={(e) => update({ styleIntensity: Number(e.target.value) })}
          className="w-full accent-accent-primary min-h-[44px]"
        />
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>Color enhancement</span>
          <span className="font-mono">{settings.colorEnhancement}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.colorEnhancement}
          onChange={(e) => update({ colorEnhancement: Number(e.target.value) })}
          className="w-full accent-accent-primary min-h-[44px]"
        />
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>Texture detail</span>
          <span className="font-mono">{settings.textureDetail}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.textureDetail}
          onChange={(e) => update({ textureDetail: Number(e.target.value) })}
          className="w-full accent-accent-primary min-h-[44px]"
        />
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>Artistic freedom</span>
          <span className="font-mono">{settings.artisticFreedom}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.artisticFreedom}
          onChange={(e) => update({ artisticFreedom: Number(e.target.value) })}
          className="w-full accent-accent-primary min-h-[44px]"
        />
      </div>
      {[
        { key: 'addGlow' as const, label: 'Add glow effects' },
        { key: 'addDrips' as const, label: 'Add drips and textures' },
        { key: 'enhanceLetterforms' as const, label: 'Enhance letterforms' },
      ].map(({ key, label }) => (
        <label
          key={key}
          className={`flex items-center gap-2 mb-2 min-h-[44px] cursor-pointer ${
            key === 'enhanceLetterforms' && !hasText ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={settings[key]}
            onChange={(e) => update({ [key]: e.target.checked })}
            disabled={key === 'enhanceLetterforms' && !hasText}
            className="w-5 h-5 accent-accent-primary"
          />
          <span className="text-sm font-inter">{label}</span>
        </label>
      ))}
      <label className="block text-sm text-text-secondary mb-1">Language</label>
      <select
        value={settings.language}
        onChange={(e) => update({ language: e.target.value })}
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 min-h-[44px]"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
