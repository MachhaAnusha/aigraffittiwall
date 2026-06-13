export type SensitivityLevel = 'strict' | 'moderate' | 'permissive';

export interface ModerationSettings {
  sensitivity: SensitivityLevel;
  bannedWords: string[];
  autoApprove: boolean;
}

const SENSITIVITY_THRESHOLDS: Record<SensitivityLevel, number> = {
  strict: 0.5,
  moderate: 0.7,
  permissive: 0.85,
};

const isProduction = process.env.NODE_ENV === 'production';

let settings: ModerationSettings = {
  sensitivity: 'moderate',
  bannedWords: [],
  // Auto-approve in dev so you can test without opening /admin
  autoApprove:
    process.env.AUTO_APPROVE === 'true' ||
    (!isProduction && process.env.AUTO_APPROVE !== 'false'),
};

export function getModerationSettings(): ModerationSettings {
  return { ...settings, bannedWords: [...settings.bannedWords] };
}

export function updateModerationSettings(partial: Partial<ModerationSettings>): void {
  settings = { ...settings, ...partial };
  if (partial.bannedWords) {
    settings.bannedWords = partial.bannedWords.map((w) => w.toLowerCase().trim()).filter(Boolean);
  }
}

function checkBannedWords(text: string): string | null {
  const lower = text.toLowerCase();
  for (const word of settings.bannedWords) {
    if (word && lower.includes(word)) {
      return `Content contains banned word`;
    }
  }
  return null;
}

export async function moderateText(text: string): Promise<{ pass: boolean; reason?: string }> {
  if (!text.trim()) return { pass: true };

  const banned = checkBannedWords(text);
  if (banned) return { pass: false, reason: banned };

  const apiKey = process.env.PERSPECTIVE_API_KEY;
  if (!apiKey) {
    console.warn('PERSPECTIVE_API_KEY not set — skipping text moderation');
    return { pass: true };
  }

  try {
    const res = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: { text },
          languages: ['en'],
          requestedAttributes: { TOXICITY: {}, SEVERE_TOXICITY: {} },
        }),
      }
    );

    if (!res.ok) {
      console.error('Perspective API error', await res.text());
      return { pass: true };
    }

    const data = (await res.json()) as {
      attributeScores?: {
        TOXICITY?: { summaryScore?: { value?: number } };
        SEVERE_TOXICITY?: { summaryScore?: { value?: number } };
      };
    };

    const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity];
    const toxicity = data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
    const severe = data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value ?? 0;

    if (toxicity > threshold || severe > threshold) {
      return { pass: false, reason: 'Text failed toxicity check' };
    }

    return { pass: true };
  } catch (err) {
    console.error('Text moderation error', err);
    return { pass: true };
  }
}

type Likelihood = 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';

function isLikelyOrWorse(likelihood: Likelihood | undefined): boolean {
  return likelihood === 'LIKELY' || likelihood === 'VERY_LIKELY';
}

export async function moderateImage(canvasDataURL: string): Promise<{ pass: boolean; reason?: string }> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_CLOUD_VISION_KEY not set — skipping image moderation');
    return { pass: true };
  }

  const base64 = canvasDataURL.replace(/^data:image\/\w+;base64,/, '');

  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'SAFE_SEARCH_DETECTION' }],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      console.error('Vision API error', await res.text());
      return { pass: true };
    }

    const data = (await res.json()) as {
      responses?: Array<{
        safeSearchAnnotation?: {
          adult?: Likelihood;
          violence?: Likelihood;
          racy?: Likelihood;
        };
      }>;
    };

    const safe = data.responses?.[0]?.safeSearchAnnotation;
    if (
      isLikelyOrWorse(safe?.adult) ||
      isLikelyOrWorse(safe?.violence) ||
      isLikelyOrWorse(safe?.racy)
    ) {
      return { pass: false, reason: 'Image failed safe search check' };
    }

    return { pass: true };
  } catch (err) {
    console.error('Image moderation error', err);
    return { pass: true };
  }
}

export function shouldAutoApprove(): boolean {
  return settings.autoApprove;
}
