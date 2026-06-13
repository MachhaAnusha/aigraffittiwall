import Replicate from 'replicate';
import { uploadImageFromUrl } from './cloudinaryService.js';

/** Official SDXL img2img version (Replicate docs) */
const SDXL_IMG2IMG =
  'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

function isDemoMode(): boolean {
  // Token present → use real AI (unless demo explicitly forced)
  if (process.env.REPLICATE_API_TOKEN?.trim()) {
    return process.env.DEMO_MODE === 'true';
  }
  return true;
}

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

const NEGATIVE_PROMPT =
  'text, words, letters, writing, nsfw, nude, sexual, violent, gore, weapons, offensive symbols, hate symbols, watermark, blurry, low quality, ugly, soft, out of focus';

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

function mapIntensityToGuidance(intensity: number): number {
  const clamped = Math.max(0, Math.min(100, intensity));
  return 3 + (clamped / 100) * 9;
}

function mapIntensityToPromptStrength(intensity: number): number {
  const clamped = Math.max(0, Math.min(100, intensity));
  // 0.45–0.85 keeps your drawing visible while AI restyles it
  return 0.45 + (clamped / 100) * 0.4;
}

export async function generateArtworkImg2Img(input: GenerationInput): Promise<string> {
  if (isDemoMode()) {
    console.warn(
      'Demo mode: add REPLICATE_API_TOKEN to .env for SDXL AI enhancement (see AI_SETUP.md)'
    );
    return input.canvasDataURL;
  }

  const token = process.env.REPLICATE_API_TOKEN!.trim();
  const replicate = new Replicate({ auth: token });
  const prompt = buildPrompt(input);
  const intensity = input.aiSettings.styleIntensity ?? 70;
  const guidanceScale = mapIntensityToGuidance(intensity);
  const promptStrength = mapIntensityToPromptStrength(intensity);

  console.log(`AI generating with preset "${input.stylePreset}", strength ${promptStrength.toFixed(2)}`);

  const output = await replicate.run(SDXL_IMG2IMG, {
    input: {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      image: input.canvasDataURL,
      width: 1344,
      height: 768,
      num_inference_steps: 30,
      guidance_scale: guidanceScale,
      prompt_strength: promptStrength,
      scheduler: 'K_EULER',
      refine: 'no_refiner',
      num_outputs: 1,
    },
  });

  let imageUrl: string;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    imageUrl = typeof first === 'string' ? first : String(first);
  } else if (typeof output === 'string') {
    imageUrl = output;
  } else if (output && typeof output === 'object' && 'url' in output) {
    imageUrl = String((output as { url: () => string }).url?.() ?? output);
  } else {
    imageUrl = String(output);
  }

  if (!imageUrl.startsWith('http')) {
    throw new Error('Replicate returned an unexpected output format');
  }

  try {
    return await uploadImageFromUrl(imageUrl, `art-${input.submissionId}`);
  } catch (uploadErr) {
    console.warn('Cloudinary upload failed, using Replicate URL directly', uploadErr);
    return imageUrl;
  }
}

export function getGenerationMode(): 'demo' | 'ai' {
  return isDemoMode() ? 'demo' : 'ai';
}
