import type { StylePreset, AISettings } from './promptBuilder';

const PRESET_FILTERS: Record<StylePreset, string> = {
  'Classic NYC Subway': 'saturate(1.7) contrast(1.35) brightness(1.05)',
  Wildstyle: 'saturate(1.8) contrast(1.4) brightness(0.95)',
  'Bubble Letters': 'saturate(1.9) contrast(1.2) brightness(1.1)',
  Cyberpunk: 'saturate(2.2) contrast(1.5) brightness(1.15) hue-rotate(15deg)',
  'Nature & Organic': 'saturate(1.4) contrast(1.2) sepia(0.15)',
  'Abstract Geometric': 'saturate(1.6) contrast(1.45) brightness(1.05)',
  Stencil: 'contrast(1.6) brightness(1.1) saturate(0.8)',
  Throwup: 'saturate(1.8) contrast(1.3) brightness(1.08)',
  'Neon Glow': 'saturate(2.5) contrast(1.6) brightness(1.2) hue-rotate(-10deg)',
  'Graffiti Cartoon': 'saturate(1.5) contrast(1.3) brightness(1.15)',
  '3D Block': 'saturate(1.4) contrast(1.5) brightness(0.9)',
  Vaporwave: 'saturate(1.3) contrast(1.2) brightness(1.1) hue-rotate(20deg)',
  'Metallic Chrome': 'saturate(0.8) contrast(1.4) brightness(1.1)',
  'Pastel Dreams': 'saturate(0.9) contrast(1.1) brightness(1.2)',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Apply graffiti-style post-processing when AI API is unavailable (demo mode). */
export async function enhanceCanvasImage(
  dataUrl: string,
  stylePreset: StylePreset,
  aiSettings: AISettings
): Promise<string> {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  const intensity = aiSettings.styleIntensity / 100;
  const baseFilter = PRESET_FILTERS[stylePreset] ?? PRESET_FILTERS['Classic NYC Subway'];
  const parts = [baseFilter];

  if (aiSettings.addGlow) {
    parts.push(`drop-shadow(0 0 ${8 + intensity * 12}px rgba(255,45,149,0.55))`);
    parts.push(`drop-shadow(0 0 ${4 + intensity * 8}px rgba(0,207,255,0.35))`);
  }

  ctx.filter = parts.join(' ');
  ctx.drawImage(img, 0, 0, w, h);

  if (aiSettings.addDrips) {
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.25 + intensity * 0.2;
    const drip = ctx.createLinearGradient(0, 0, 0, h);
    drip.addColorStop(0, 'transparent');
    drip.addColorStop(0.6, 'rgba(255,45,149,0.15)');
    drip.addColorStop(1, 'rgba(255,45,149,0.35)');
    ctx.fillStyle = drip;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL('image/png');
}
