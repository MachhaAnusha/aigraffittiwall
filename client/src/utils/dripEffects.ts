import { Path, type Canvas, type FabricObject } from 'fabric';
import type { BrushConfig } from '../hooks/useCanvas';

function hexWithAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Add paint drip trails below a finished stroke (graffiti drip effect). */
export function addDripTrails(
  canvas: Canvas,
  stroke: FabricObject,
  brush: BrushConfig
): void {
  if (brush.style !== 'drip') return;

  const bounds = stroke.getBoundingRect();
  const dripCount = Math.max(2, Math.min(12, Math.floor(bounds.width / 25)));
  const color = hexWithAlpha(brush.color, brush.opacity * 0.85);

  for (let i = 0; i < dripCount; i++) {
    const x = bounds.left + (bounds.width * (i + 0.5)) / dripCount + (Math.random() - 0.5) * 8;
    const y = bounds.top + bounds.height * (0.5 + Math.random() * 0.5);
    const length = 12 + Math.random() * (brush.size * 2.5);
    const wobble = (Math.random() - 0.5) * 6;
    const width = 1 + Math.random() * Math.max(1, brush.size / 8);

    const pathStr = `M ${x} ${y} Q ${x + wobble} ${y + length * 0.45} ${x + wobble * 1.5} ${y + length}`;
    const drip = new Path(pathStr, {
      stroke: color,
      fill: '',
      strokeWidth: width,
      strokeLineCap: 'round',
      selectable: false,
      evented: false,
      opacity: 0.55 + Math.random() * 0.35,
    });

    // Bulb at drip end (wet paint drop)
    const dropY = y + length;
    const drop = new Path(
      `M ${x + wobble * 1.5 - width} ${dropY} Q ${x + wobble * 1.5} ${dropY + width * 2} ${x + wobble * 1.5 + width} ${dropY} Z`,
      {
        fill: hexWithAlpha(brush.color, brush.opacity * 0.7),
        stroke: '',
        selectable: false,
        evented: false,
        opacity: 0.65,
      }
    );

    canvas.add(drip, drop);
  }

  canvas.renderAll();
}
