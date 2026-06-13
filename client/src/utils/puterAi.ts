import { puter } from '@heyputer/puter.js';

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
}

function buildPrompt(input: GenerationInput): string {
  const styleKeywords = STYLE_KEYWORDS[input.stylePreset] ?? STYLE_KEYWORDS['Classic NYC Subway'];
  const { aiSettings, textInput } = input;

  const colorEnhancement = aiSettings.colorEnhancement ?? 50;
  const textureDetail = aiSettings.textureDetail ?? 50;
  const artisticFreedom = aiSettings.artisticFreedom ?? 50;

  const parts = [
    styleKeywords,
    'graffiti art, spray paint, urban street art, on a brick wall',
    `vibrant colours, high detail, photorealistic texture, color saturation ${colorEnhancement / 100 + 1}`,
    `texture detail level ${textureDetail / 100 + 1}, surface imperfections, wall texture`,
    `artistic interpretation level ${artisticFreedom / 100 + 1}, creative enhancement`,
    'based on the input sketch, preserve composition and shapes',
    textInput ? `graffiti text "${textInput}"` : '',
    'professional graffiti mural, street art masterpiece',
    aiSettings.addGlow ? 'neon glow, luminous highlights, light bloom effect' : '',
    aiSettings.addDrips ? 'paint drips, wet paint texture, running paint, splatter effects' : '',
    aiSettings.enhanceLetterforms && textInput ? 'graffiti lettering, stylised typography, calligraphic flow' : '',
  ].filter(Boolean);

  return parts.join(', ');
}

export async function generateArtworkWithPuter(input: GenerationInput): Promise<string> {
  try {
    const prompt = buildPrompt(input);
    console.log(`Puter AI generating with preset "${input.stylePreset}"`);

    // Use Puter.js txt2img with enhanced prompt
    const enhancedPrompt = `${prompt}, transform this sketch into professional graffiti art, maintain the original composition and shapes`;

    const imageElement = await puter.ai.txt2img(enhancedPrompt, {
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
    });

    // Convert the image element to data URL
    const canvas = document.createElement('canvas');
    canvas.width = 1344;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw the image to canvas
    ctx.drawImage(imageElement, 0, 0, 1344, 768);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Puter AI generation failed:', error);
    // Fallback to original image if AI fails
    console.warn('Falling back to original canvas image');
    return input.canvasDataURL;
  }
}

export function getGenerationMode(): 'demo' | 'puter' {
  return 'puter';
}
