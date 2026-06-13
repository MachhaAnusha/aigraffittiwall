interface Settings {
  sensitivity: 'strict' | 'moderate' | 'permissive';
  bannedWords: string[];
  autoApprove: boolean;
}

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function ModerationSettings({ settings, onChange }: Props) {
  return (
    <section className="mb-6 panel-section">
      <h2 className="font-bangers text-2xl text-accent-primary mb-3">Moderation</h2>
      <label className="block text-sm text-text-secondary mb-1">Sensitivity</label>
      <select
        value={settings.sensitivity}
        onChange={(e) =>
          onChange({
            ...settings,
            sensitivity: e.target.value as Settings['sensitivity'],
          })
        }
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 mb-3 min-h-[44px]"
      >
        <option value="strict">Strict</option>
        <option value="moderate">Moderate</option>
        <option value="permissive">Permissive</option>
      </select>
      <label className="block text-sm text-text-secondary mb-1">Banned words (one per line)</label>
      <textarea
        value={settings.bannedWords.join('\n')}
        onChange={(e) =>
          onChange({
            ...settings,
            bannedWords: e.target.value.split('\n').filter(Boolean),
          })
        }
        rows={5}
        className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 font-mono text-sm mb-3"
      />
      <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
        <input
          type="checkbox"
          checked={settings.autoApprove}
          onChange={(e) => onChange({ ...settings, autoApprove: e.target.checked })}
          className="w-5 h-5 accent-accent-primary"
        />
        <span className="text-sm font-inter">Auto-approve all</span>
      </label>
    </section>
  );
}
