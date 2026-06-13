import { useState, useRef, useCallback, useEffect } from 'react';
import { LeftToolbar } from '../components/controller/LeftToolbar';
import { CentreCanvas } from '../components/controller/CentreCanvas';
import { RightPanel } from '../components/controller/RightPanel';
import { BottomSheet } from '../components/shared/BottomSheet';
import { StatusIndicator } from '../components/shared/StatusIndicator';
import { useSocket } from '../hooks/useSocket';
import { useSubmission } from '../hooks/useSubmission';
import { useCanvas } from '../hooks/useCanvas';
import { exportCanvasJPEG, exportCanvasPNG } from '../utils/canvasHelpers';
import { enhanceCanvasImage } from '../utils/canvasEnhance';
import {
  DEFAULT_AI_SETTINGS,
  PRESET_PALETTES,
  type StylePreset,
  type ToolType,
  type BrushStyle,
  type AISettings,
} from '../utils/promptBuilder';

export default function Controller() {
  const { connected, emit, on } = useSocket('controller');
  const { status, rejectReason, cooldownMs, submit } = useSubmission(on, emit);

  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [textInput, setTextInput] = useState('');
  const [strokeColor, setStrokeColor] = useState('#FF2D95');
  const [backgroundColor, setBackgroundColor] = useState('#0d0d0d');
  const [brushSize, setBrushSize] = useState(12);
  const [brushOpacity, setBrushOpacity] = useState(0.85);
  const [brushHardness, setBrushHardness] = useState(0.6);
  const [brushSpacing, setBrushSpacing] = useState(8);
  const [brushStyle, setBrushStyle] = useState<BrushStyle>('round');
  const [stylePreset, setStylePreset] = useState<StylePreset>('Classic NYC Subway');
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [rightTab, setRightTab] = useState<'color' | 'brush' | 'style' | 'ai'>('color');
  const [aiMode, setAiMode] = useState<'demo' | 'ai' | 'loading'>('loading');

  const canvasApiRef = useRef<ReturnType<typeof useCanvas> | null>(null);

  useEffect(() => {
    const base = import.meta.env.VITE_SOCKET_URL || '';
    fetch(`${base}/api/health`)
      .then((r) => r.json())
      .then((d: { generationMode?: string }) => setAiMode(d.generationMode === 'ai' ? 'ai' : 'demo'))
      .catch(() => setAiMode('demo'));
  }, []);

  const brush = {
    color: strokeColor,
    size: brushSize,
    opacity: brushOpacity,
    hardness: brushHardness,
    spacing: brushSpacing,
    style: brushStyle,
    backgroundColor,
  };

  const handlePreset = (preset: StylePreset) => {
    setStylePreset(preset);
    const palette = PRESET_PALETTES[preset];
    setStrokeColor(palette.stroke);
    setBackgroundColor(palette.background);
  };

  const handleGenerate = useCallback(
    async (queueOnly = false) => {
      const api = canvasApiRef.current;
      const canvas = api?.getCanvas();
      if (!canvas) return;

      if (activeTool === 'text' && textInput.trim()) {
        api?.addText(textInput);
      }

      const rawPng = exportCanvasPNG(canvas);
      const enhancedPng = await enhanceCanvasImage(rawPng, stylePreset, aiSettings);

      submit({
        canvasDataURL: exportCanvasJPEG(canvas, 0.6),
        canvasDataURLFull: enhancedPng,
        textInput,
        stylePreset,
        aiSettings,
        queueOnly,
      });
    },
    [activeTool, textInput, stylePreset, aiSettings, submit]
  );

  const panelProps = {
    strokeColor,
    backgroundColor,
    brushSize,
    brushOpacity,
    brushHardness,
    brushSpacing,
    brushStyle,
    activeTool,
    stylePreset,
    aiSettings,
    hasText: Boolean(textInput.trim()),
    submissionStatus: status,
    rejectReason,
    cooldownMs,
    onStrokeColor: setStrokeColor,
    onBackgroundColor: setBackgroundColor,
    onBrushChange: (key: string, value: number) => {
      if (key === 'size') setBrushSize(value);
      if (key === 'opacity') setBrushOpacity(value);
      if (key === 'hardness') setBrushHardness(value);
      if (key === 'spacing') setBrushSpacing(value);
    },
    onBrushStyle: setBrushStyle,
    onStylePreset: handlePreset,
    onAISettings: setAISettings,
    onGenerate: () => handleGenerate(false),
    onQueue: () => handleGenerate(true),
    disabled: !connected,
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary overflow-hidden">
      <header className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
        <h1 className="font-bangers text-2xl text-accent-primary tracking-wide">AI Graffiti Wall</h1>
        <div className="flex flex-col items-end gap-0.5">
          <span className={`text-xs font-inter ${connected ? 'text-success' : 'text-danger'}`}>
            {connected ? '● Live' : '○ Offline'}
          </span>
          {aiMode === 'demo' && (
            <span className="text-[10px] text-warning font-inter max-w-[220px] text-right leading-tight">
              No AI yet — add REPLICATE_API_TOKEN to .env (see AI_SETUP.md)
            </span>
          )}
          {aiMode === 'ai' && (
            <span className="text-[10px] text-success font-inter">AI generation active</span>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0 pb-14 md:pb-0">
        <div className="hidden md:flex">
          <LeftToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onUndo={() => canvasApiRef.current?.undo()}
            onRedo={() => canvasApiRef.current?.redo()}
            onClear={() => canvasApiRef.current?.clear()}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <CentreCanvas
            activeTool={activeTool}
            brush={brush}
            textInput={textInput}
            canvasRef={canvasApiRef}
          />

          <div className="px-4 pb-2 shrink-0 space-y-2 md:px-4">
            {activeTool === 'text' && (
              <div>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value.slice(0, 80))}
                  placeholder="Type your word or phrase..."
                  maxLength={80}
                  className="w-full bg-bg-tertiary border border-border rounded px-3 py-2 font-inter min-h-[44px]"
                />
                <p className="text-right text-xs text-text-secondary font-mono mt-1">
                  {textInput.length}/80
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={!connected || cooldownMs > 0}
              className="generate-btn w-full py-3 lg:hidden disabled:opacity-50 min-h-[44px]"
            >
              <span className="font-bangers text-xl text-accent-primary">Generate Art</span>
            </button>
            <div className="lg:hidden">
              <StatusIndicator status={status} rejectReason={rejectReason} cooldownMs={cooldownMs} />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <RightPanel {...panelProps} />
        </div>

        {/* Tablet tabs */}
        <div className="hidden md:flex lg:hidden flex-col w-64 border-l border-border bg-bg-secondary overflow-y-auto">
          <div className="flex border-b border-border">
            {(['color', 'brush', 'style', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2 text-xs font-inter capitalize min-h-[44px] ${
                  rightTab === tab ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-2 overflow-y-auto flex-1">
            <RightPanel {...panelProps} section={rightTab} />
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        <LeftToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onUndo={() => canvasApiRef.current?.undo()}
          onRedo={() => canvasApiRef.current?.redo()}
          onClear={() => canvasApiRef.current?.clear()}
          horizontal
        />
      </div>

      <BottomSheet title="Settings">
        <RightPanel {...panelProps} />
      </BottomSheet>
    </div>
  );
}
