import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, PencilBrush, SprayBrush, FabricText, Shadow } from 'fabric';
import type { ToolType, BrushStyle } from '../utils/promptBuilder';
import { addDripTrails } from '../utils/dripEffects';

export interface BrushConfig {
  color: string;
  size: number;
  opacity: number;
  hardness: number;
  spacing: number;
  style: BrushStyle;
  backgroundColor: string;
}

function hexWithAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function brushShadow(brush: BrushConfig): Shadow | null {
  if (brush.style === 'drip') {
    // Wet paint look on the stroke itself; drip trails added on path:created
    return new Shadow({
      color: hexWithAlpha(brush.color, 0.35),
      blur: 4,
      offsetX: 0,
      offsetY: 2,
    });
  }
  if (brush.hardness >= 0.95) return null;
  return new Shadow({
    color: hexWithAlpha(brush.color, brush.opacity * 0.6),
    blur: (1 - brush.hardness) * 18,
    offsetX: 0,
    offsetY: 0,
  });
}

function usesSpray(tool: ToolType, style: BrushStyle): boolean {
  return tool === 'spray' || style === 'aerosol';
}

function updateDrawingBrush(canvas: Canvas, brush: BrushConfig, tool: ToolType): void {
  if (tool === 'fill' || tool === 'select' || tool === 'text') {
    canvas.isDrawingMode = false;
    return;
  }

  canvas.isDrawingMode = true;

  if (tool === 'eraser') {
    if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }
    const eraser = canvas.freeDrawingBrush as PencilBrush;
    eraser.color = brush.backgroundColor;
    eraser.width = brush.size;
    eraser.shadow = null;
    return;
  }

  if (usesSpray(tool, brush.style)) {
    if (!(canvas.freeDrawingBrush instanceof SprayBrush)) {
      canvas.freeDrawingBrush = new SprayBrush(canvas);
    }
    const spray = canvas.freeDrawingBrush as SprayBrush;
    spray.color = hexWithAlpha(brush.color, brush.opacity);
    spray.width = brush.size * 2;
    spray.density = Math.max(5, Math.round(brush.spacing * 2.5));
    spray.dotWidth = Math.max(1, brush.size / 6);
    spray.shadow = brushShadow(brush);
    return;
  }

  if (!(canvas.freeDrawingBrush instanceof PencilBrush)) {
    canvas.freeDrawingBrush = new PencilBrush(canvas);
  }
  const pencil = canvas.freeDrawingBrush as PencilBrush;
  pencil.color = hexWithAlpha(brush.color, brush.opacity);
  pencil.width = brush.size;
  pencil.strokeLineCap = brush.style === 'flat' || brush.style === 'marker' ? 'square' : 'round';
  pencil.strokeLineJoin = brush.style === 'marker' ? 'miter' : 'round';
  pencil.shadow = brushShadow(brush);
}

export function useCanvas(
  containerRef: React.RefObject<HTMLDivElement | null>,
  activeTool: ToolType,
  brush: BrushConfig
) {
  const canvasRef = useRef<Canvas | null>(null);
  const [ready, setReady] = useState(false);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const brushRef = useRef(brush);
  const activeToolRef = useRef(activeTool);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);

  brushRef.current = brush;
  activeToolRef.current = activeTool;

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || canvasRef.current) return;

    const width = container.clientWidth || 640;
    const height = Math.round((width * 9) / 16);

    const canvas = new Canvas('graffiti-canvas', {
      width,
      height,
      backgroundColor: brush.backgroundColor,
      isDrawingMode: true,
      selection: false,
    });

    canvasRef.current = canvas;
    updateDrawingBrush(canvas, brush, activeTool);

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 640;
      const h = Math.round((w * 9) / 16);
      canvas.setDimensions({ width: w, height: h });
      canvas.renderAll();
    });
    resizeObserver.observe(container);

    canvas.on('path:created', (e) => {
      const b = brushRef.current;
      if (b.style === 'drip' && e.path) {
        addDripTrails(canvas, e.path, b);
      }
      saveHistory();
    });

    // Pressure simulation — reads live brush from ref (not stale closure)
    canvas.on('mouse:move', (opt) => {
      if (!canvas.isDrawingMode || !canvas.freeDrawingBrush) return;
      const e = opt.e as PointerEvent;
      if (e.buttons === 0) return;
      const b = brushRef.current;
      const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.85;
      const alpha = Math.max(0.35, Math.min(1, pressure)) * b.opacity;
      if (canvas.freeDrawingBrush instanceof PencilBrush) {
        canvas.freeDrawingBrush.color = hexWithAlpha(b.color, alpha);
      }
    });

    canvas.on('mouse:down', () => {
      if (activeToolRef.current !== 'fill') return;
      const b = brushRef.current;
      canvas.backgroundColor = b.color;
      canvas.renderAll();
      saveHistory();
    });

    saveHistory();
    setReady(true);

    return () => {
      resizeObserver.disconnect();
      canvas.dispose();
      canvasRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.backgroundColor = brush.backgroundColor;
    updateDrawingBrush(canvas, brush, activeTool);
    canvas.selection = activeTool === 'select';
    canvas.defaultCursor =
      activeTool === 'select' ? 'default' : activeTool === 'fill' ? 'cell' : 'crosshair';
    canvas.renderAll();
  }, [brush, activeTool]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvas.renderAll());
  }, []);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvas.renderAll());
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = brushRef.current.backgroundColor;
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const addText = useCallback(
    (text: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !text.trim()) return;
      const b = brushRef.current;
      const textObj = new FabricText(text, {
        left: canvas.width! / 2 - 80,
        top: canvas.height! / 2 - 30,
        fill: b.color,
        fontFamily: 'Bangers, cursive',
        fontSize: Math.max(24, b.size * 4),
        shadow: brushShadow(b) ?? undefined,
      });
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
      canvas.renderAll();
      saveHistory();
    },
    [saveHistory]
  );

  const floodFill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.backgroundColor = brushRef.current.color;
    canvas.renderAll();
    saveHistory();
  }, [saveHistory]);

  const getCanvas = useCallback(() => canvasRef.current, []);

  const handleTouchGestures = useCallback((e: React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (!pinchRef.current) {
        pinchRef.current = { distance: dist, zoom: canvas.getZoom() };
        canvas.isDrawingMode = false;
      } else {
        const scale = dist / pinchRef.current.distance;
        canvas.setZoom(Math.min(3, Math.max(0.5, pinchRef.current.zoom * scale)));
        canvas.renderAll();
      }
    } else if (e.touches.length < 2 && pinchRef.current) {
      pinchRef.current = null;
      const tool = activeToolRef.current;
      updateDrawingBrush(canvas, brushRef.current, tool);
    }
  }, []);

  return {
    ready,
    undo,
    redo,
    clear,
    addText,
    floodFill,
    getCanvas,
    handleTouchGestures,
    saveHistory,
  };
}
