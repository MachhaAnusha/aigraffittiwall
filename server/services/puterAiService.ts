// Puter.js is primarily designed for client-side use and requires browser APIs
// For server-side use, we'll implement a fallback to enhanced canvas processing
// This provides free enhancement without requiring API keys or billing

const STYLE_KEYWORDS: Record<string, string> = {
  'Classic NYC Subway': '1980s New York subway graffiti, MTA train style, classic old school, vibrant spray paint, urban decay texture',
  Wildstyle: 'wildstyle graffiti, complex interlocking letters, arrows and extensions, intricate flow, master piece style',
  'Bubble Letters': 'bubble letter graffiti, rounded soft letters, outlined, filled, playful cartoon style, thick outlines',
  Cyberpunk: 'cyberpunk neon graffiti, futuristic, glowing circuitry, dark background, holographic effects, tech noir aesthetic',
  'Nature & Organic': 'organic graffiti, floral elements, vines, nature, earthy tones, botanical patterns, environmental art',
  'Abstract Geometric': 'geometric abstract graffiti, sharp angles, tessellation, bold shapes, mathematical precision, optical illusion',
  Stencil: 'stencil graffiti, banksy style, high contrast, minimal colours, clean lines, political art style',
  Throwup: 'throwup graffiti, quick fill, two-tone, bubble outline, fast style, street bombing aesthetic',
  'Neon Glow': 'neon glow graffiti, luminous fluorescent colors, electric lighting effects, night city vibe, radioactive glow',
  'Graffiti Cartoon': 'graffiti cartoon style, animated characters, comic book aesthetic, bold outlines, playful and fun',
  '3D Block': '3D block letters graffiti, dimensional depth, shadow effects, architectural perspective, monumental scale',
  Vaporwave: 'vaporwave aesthetic, retro 80s and 90s, pastel gradients, glitch effects, digital dream landscape',
  'Metallic Chrome': 'metallic chrome graffiti, reflective surfaces, silver and gold tones, shiny finish, luxury aesthetic',
  'Pastel Dreams': 'pastel dreams graffiti, soft colors, dreamy atmosphere, ethereal quality, gentle and whimsical',
};

export interface AISettings {
  styleIntensity: number;
  addGlow: boolean;
  addDrips: boolean;
  enhanceLetterforms: boolean;
  language?: string;
  colorEnhancement?: number;
  textureDetail?: number;
  artisticFreedom?: number;
}

export interface GenerationInput {
  canvasDataURL: string;
  textInput?: string;
  stylePreset: string;
  aiSettings: AISettings;
  submissionId: string;
}

// Enhanced canvas processing as free alternative to paid AI APIs
import { createCanvas, loadImage } from 'canvas';

const PRESET_FILTERS: Record<string, string> = {
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

export async function generateArtworkWithPuter(input: GenerationInput): Promise<string> {
  try {
    console.log(`Enhanced canvas processing with preset "${input.stylePreset}"`);

    // Load the original image
    const img = await loadImage(input.canvasDataURL);
    const width = 1344;
    const height = 768;

    // Create canvas with enhanced processing
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const intensity = input.aiSettings.styleIntensity / 100;
    const baseFilter = PRESET_FILTERS[input.stylePreset] ?? PRESET_FILTERS['Classic NYC Subway'];

    // Apply base filter
    ctx.filter = baseFilter;
    ctx.drawImage(img, 0, 0, width, height);

    // Add glow effects if enabled
    if (input.aiSettings.addGlow) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.3 + intensity * 0.2;

      // Create gradient glow
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      gradient.addColorStop(0, 'rgba(255,45,149,0.4)');
      gradient.addColorStop(0.5, 'rgba(0,207,255,0.2)');
      gradient.addColorStop(1, 'rgba(255,45,149,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Add drip effects if enabled
    if (input.aiSettings.addDrips) {
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.2 + intensity * 0.15;

      const dripGradient = ctx.createLinearGradient(0, 0, 0, height);
      dripGradient.addColorStop(0, 'transparent');
      dripGradient.addColorStop(0.5, 'rgba(255,45,149,0.1)');
      dripGradient.addColorStop(1, 'rgba(255,45,149,0.3)');

      ctx.fillStyle = dripGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Add texture overlay
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1 + intensity * 0.05;

    // Add noise texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, y, size, size);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Enhanced processing failed:', error);
    // Fallback to original image if processing fails
    console.warn('Falling back to original canvas image');
    return input.canvasDataURL;
  }
}

export function getGenerationMode(): 'demo' | 'enhanced' {
  return 'enhanced';
}
