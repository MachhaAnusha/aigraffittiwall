import { useRef } from 'react';
import type { ToolType } from '../../utils/promptBuilder';
import type { BrushConfig } from '../../hooks/useCanvas';
import { useCanvas } from '../../hooks/useCanvas';
import { BRICK_BACKGROUND_STYLE } from '../../utils/brickTexture';

interface Props {
  activeTool: ToolType;
  brush: BrushConfig;
  textInput: string;
  onTextAdd?: (text: string) => void;
  canvasRef?: React.MutableRefObject<ReturnType<typeof useCanvas> | null>;
}

export function CentreCanvas({ activeTool, brush, textInput, canvasRef: externalRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasApi = useCanvas(containerRef, activeTool, brush);

  if (externalRef) {
    externalRef.current = canvasApi;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 p-2 md:p-4">
      <div
        ref={containerRef}
        className="relative w-full brick-texture rounded-lg overflow-hidden border border-border"
        style={{ aspectRatio: '16/9', touchAction: 'none' }}
        onTouchStart={canvasApi.handleTouchGestures}
        onTouchMove={canvasApi.handleTouchGestures}
        onTouchEnd={canvasApi.handleTouchGestures}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={BRICK_BACKGROUND_STYLE}
        />
        <canvas
          id="graffiti-canvas"
          className="relative z-10 w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>
      {activeTool === 'text' && textInput && (
        <p className="text-xs text-text-secondary mt-1 font-inter">
          Press Generate to add &quot;{textInput.slice(0, 20)}...&quot; to canvas before submit
        </p>
      )}
    </div>
  );
}
