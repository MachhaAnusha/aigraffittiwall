export const STYLE_PRESETS = [
  'Classic NYC Subway',
  'Wildstyle',
  'Bubble Letters',
  'Cyberpunk',
  'Nature & Organic',
  'Abstract Geometric',
  'Stencil',
  'Throwup',
] as const;

export type StylePreset = (typeof STYLE_PRESETS)[number];

export const PRESET_PALETTES: Record<StylePreset, { stroke: string; background: string }> = {
  'Classic NYC Subway': { stroke: '#FF0000', background: '#1a1a2e' },
  Wildstyle: { stroke: '#7B2FFF', background: '#0d0d0d' },
  'Bubble Letters': { stroke: '#FF2D95', background: '#16213e' },
  Cyberpunk: { stroke: '#00CFFF', background: '#0f3460' },
  'Nature & Organic': { stroke: '#39FF14', background: '#1b1b2f' },
  'Abstract Geometric': { stroke: '#FFD700', background: '#111827' },
  Stencil: { stroke: '#FFFFFF', background: '#000000' },
  Throwup: { stroke: '#FF6B00', background: '#2d1b69' },
};

export const FOREGROUND_COLORS = [
  '#FF0000', '#FF6B00', '#FFD700', '#00FF41', '#00CFFF', '#7B2FFF', '#FF2D95', '#FFFFFF',
  '#FF4444', '#FF9500', '#FFEF00', '#39FF14', '#00BFFF', '#9B59B6', '#FF69B4', '#C0C0C0',
];

export const BACKGROUND_COLORS = [
  '#0d0d0d', '#1a1a2e', '#0f3460', '#16213e', '#1b1b2f', '#2d1b69', '#1a0a2e', '#000000',
  '#0a1628', '#071a35', '#190a28', '#0d1117', '#1c1c1c', '#111827', '#1f2937', '#030712',
];

export type BrushStyle = 'round' | 'flat' | 'marker' | 'aerosol' | 'drip';
export type ToolType = 'text' | 'brush' | 'spray' | 'fill' | 'eraser' | 'select';

export interface AISettings {
  styleIntensity: number;
  addGlow: boolean;
  addDrips: boolean;
  enhanceLetterforms: boolean;
  language: string;
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  styleIntensity: 70,
  addGlow: true,
  addDrips: true,
  enhanceLetterforms: true,
  language: 'English',
};

export const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Japanese', 'Korean', 'Mandarin',
];
