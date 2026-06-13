import type { Canvas } from 'fabric';

export function exportCanvasJPEG(canvas: Canvas, quality = 0.6): string {
  return canvas.toDataURL({ format: 'jpeg', quality, multiplier: 1 });
}

export function exportCanvasPNG(canvas: Canvas): string {
  return canvas.toDataURL({ format: 'png', multiplier: 2 });
}
