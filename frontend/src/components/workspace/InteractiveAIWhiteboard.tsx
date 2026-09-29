import React, { useState, useRef, useEffect } from 'react';
import { useNori } from '../../context/NoriContext';
import { askNori } from '../../services/api';
import { voiceEngine } from '../../services/voice';
import {
  PenTool,
  Eraser,
  Type,
  RotateCcw,
  Sparkles,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Plus,
  Download,
  Search,
  Mail,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Brush,
  Bot
} from 'lucide-react';

interface AIAnnotation {
  id: string;
  type: 'box' | 'text' | 'arrow' | 'badge';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
}

export const InteractiveAIWhiteboard: React.FC = () => {
  const { setNoriState, noriState, setActiveView, userProfile } = useNori();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'marker' | 'text' | 'eraser'>('pencil');
  const [color, setColor] = useState('#22d3ee');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  
  // Typed Canvas Note overlay
  const [activeNoteInput, setActiveNoteInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Search & Prompt
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState<string | null>(
    "✦ AI Whiteboard Active. Sketch diagrams, type notes, or ask me and I will write responses directly on the canvas."
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      ctx.putImageData(prevData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = containerRef.current || canvas.parentElement;
    canvas.width = parent?.clientWidth || 1100;
    canvas.height = parent?.clientHeight || 750;

    // Dark sleek workspace background matching reference screenshots
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle sleek grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    setDrawingHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setDrawingHistory((prev) => [...prev.slice(-15), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const undoCanvas = () => {
    if (drawingHistory.length <= 1) return;
    const newHistory = [...drawingHistory];
    newHistory.pop();
    const prevImage = newHistory[newHistory.length - 1];
    setDrawingHistory(newHistory);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !prevImage) return;
    ctx.putImageData(prevImage, 0, 0);
  };

  const startNewWorkspace = () => {
    setActiveNoteInput(null);
    initCanvas();
    setAiSpeechText("✦ Started a fresh whiteboard canvas. Draw with cursor or ask me to write a plan on the board.");
  };

  const exportCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard_workspace_${Date.now()}.png`;
    a.click();
  };

  // Pointer & Cursor Draw Handling
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (tool === 'text') {
      setActiveNoteInput({ x, y, text: '' });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#060911';
      ctx.lineWidth = strokeWidth * 6;
      ctx.globalAlpha = 1.0;
    } else if (tool === 'marker') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth * 4;
      ctx.globalAlpha = 0.45;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1.0;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState();
  };

  const commitTextNote = () => {
    if (!activeNoteInput || !activeNoteInput.text.trim()) {
      setActiveNoteInput(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw text directly on canvas
    ctx.fillStyle = color;
    ctx.font = '600 16px Inter, system-ui, sans-serif';
    ctx.fillText(activeNoteInput.text, activeNoteInput.x, activeNoteInput.y + 16);

    saveCanvasState();
    setActiveNoteInput(null);
  };

  // -------------------------------------------------------------
  // AI WRITING DIRECTLY ON CANVAS FEATURE
  // -------------------------------------------------------------
  const aiWriteOnCanvas = async (promptQuery?: string) => {
    const userQuery = promptQuery || searchPrompt.trim() || 'Create an architecture diagram and sprint task breakdown for this workspace';
    setIsAiWriting(true);
    setNoriState('thinking');
    setAiSpeechText(`✦ Nori AI is drawing and writing response on the whiteboard...`);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const res = await askNori(
        `User requested AI whiteboard response: "${userQuery}". Provide a clear headline, a 2-sentence summary, and 3 actionable sprint tasks.`
      );

      const headline = res.headline || 'System Architecture & Sprint Plan';
      const summary = res.summary || 'Architecture verified with local multi-modal reasoning.';
      const tasks = res.suggested_actions || res.breakdowns?.[0]?.items || [
        '1. Implement API Gateway & Context Dispatcher',
        '2. Configure Low-Latency Local NPU Acceleration',
        '3. Verify UI Whiteboard Canvas with User Feedback'
      ];

      // Draw AI response card directly on canvas
      const startX = 60;
      const startY = 60;
      const cardWidth = 520;
      const cardHeight = 280;

      // Card Background
      ctx.save();
      ctx.fillStyle = 'rgba(13, 18, 31, 0.92)';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = 'rgba(34, 211, 238, 0.35)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(startX, startY, cardWidth, cardHeight, 16);
      ctx.fill();
      ctx.stroke();

      // Card Header Badge
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('✦ NORI AI RESPONSE', startX + 24, startY + 36);

      // Headline
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(headline.slice(0, 48), startX + 24, startY + 68);

      // Summary Text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(summary.slice(0, 62), startX + 24, startY + 98);
      if (summary.length > 62) {
        ctx.fillText(summary.slice(62, 124), startX + 24, startY + 118);
      }

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX + 24, startY + 138);
      ctx.lineTo(startX + cardWidth - 24, startY + 138);
      ctx.stroke();

      // Tasks on canvas
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('ACTION ITEMS / TASKS:', startX + 24, startY + 164);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Inter, sans-serif';
      tasks.slice(0, 3).forEach((task, idx) => {
        ctx.fillText(`• ${task.slice(0, 56)}`, startX + 24, startY + 192 + idx * 24);
      });

      // Arrow and connector box to the right
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX + cardWidth, startY + 140);
      ctx.lineTo(startX + cardWidth + 60, startY + 140);
      ctx.stroke();

      // Architecture Node Box
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#818cf8';
      ctx.beginPath();
      ctx.roundRect(startX + cardWidth + 60, startY + 90, 200, 100, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('⚡ Core Engine Node', startX + cardWidth + 76, startY + 124);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Status: Active & Online', startX + cardWidth + 76, startY + 148);
      ctx.fillText('Latency: 14ms (Local)', startX + cardWidth + 76, startY + 166);

      ctx.restore();
      saveCanvasState();

      setAiSpeechText(`✦ AI Wrote: "${headline}" on the whiteboard.`);
      voiceEngine.speak(
        `${headline}. ${summary}`,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );

      setNoriState('ready');
      setSearchPrompt('');
    } catch (e) {
      console.error(e);
      setNoriState('idle');
    } finally {
      setIsAiWriting(false);
    }
  };

  const colors = [
    '#22d3ee', // Cyan
    '#818cf8', // Indigo
    '#c084fc', // Purple
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#f87171', // Red
    '#ffffff', // White
    '#94a3b8'  // Slate
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#060911] text-slate-100 overflow-hidden select-none">
      {/* 1. Top Bar Matching User's Reference Screenshots */}
      <header className="h-16 px-6 border-b border-white/[0.06] bg-[#070b13] flex items-center justify-between gap-4 flex-shrink-0">
        {/* Left: View Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white">
            <Layers className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight font-sans">
            AI Whiteboard
          </h1>
        </div>

        {/* Center: Search & Ask AI bar */}
        <div className="flex-1 max-w-xl flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && aiWriteOnCanvas()}
              placeholder="Search or ask AI to write on board (e.g. Plan sprint tasks, draw architecture)..."
              className="w-full bg-[#0d121f] border border-white/[0.08] focus:border-cyan-500/50 rounded-2xl pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            <button
              onClick={() => {
                if (isListening) {
                  voiceEngine.stopListening();
                  setIsListening(false);
                } else {
                  setIsListening(true);
                  voiceEngine.startListening(
                    (t) => {
                      setSearchPrompt(t);
                      setIsListening(false);
                    },
                    () => setIsListening(true),
                    () => setIsListening(false),
                    () => setIsListening(false)
                  );
                }
              }}
              title="Voice Input (STT)"
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${
                isListening ? 'text-red-400 animate-pulse' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => aiWriteOnCanvas()}
            disabled={isAiWriting}
            className="px-3.5 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAiWriting ? 'Writing...' : 'AI Write'}</span>
          </button>
        </div>

        {/* Right: User Profile Dropdown & Actions matching user screenshot */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => voiceEngine.stopSpeaking()}
            title={isSpeaking ? 'Mute AI' : 'Voice Ready'}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* User Profile Pill Dropdown matching picture */}
          <button
            onClick={() => setActiveView('settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#0d121f] border border-white/[0.08] hover:border-white/[0.2] transition-all cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white">{userProfile?.name || 'User'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={startNewWorkspace}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white text-black font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer shadow-lg shadow-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Board</span>
          </button>
        </div>
      </header>

      {/* 2. Floating Canvas Toolbar on Top of the Board */}
      <div className="relative z-20 px-6 py-2.5 bg-[#060911]/80 backdrop-blur-md border-b border-white/[0.04] flex items-center justify-between gap-3 flex-wrap">
        {/* Drawing & Text Tools */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0d121f] border border-white/[0.08]">
          <button
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
              tool === 'pencil' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Pencil Pen (Freehand cursor drawing)"
          >
            <PenTool className="w-4 h-4" />
            <span>Pencil</span>
          </button>

          <button
            onClick={() => setTool('marker')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
              tool === 'marker' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Highlighter"
          >
            <Brush className="w-4 h-4" />
            <span>Marker</span>
          </button>

          <button
            onClick={() => setTool('text')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
              tool === 'text' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Type Text Note (Click on canvas to type text)"
          >
            <Type className="w-4 h-4" />
            <span>Type Text</span>
          </button>

          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
              tool === 'eraser' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0d121f] border border-white/[0.08]">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pencil');
              }}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
                color === c && tool !== 'eraser' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#060911] scale-110' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>

        {/* Stroke Size, Undo, Export & Quick AI Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Size:</span>
            <input
              type="range"
              min="1"
              max="12"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-16 accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={undoCanvas}
            title="Undo stroke"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCanvasImage}
            title="Export as PNG"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => aiWriteOnCanvas('Generate Sprint Planning Architecture & Tasks')}
            disabled={isAiWriting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Sprint Blueprint</span>
          </button>
        </div>
      </div>

      {/* 3. Full-Screen Interactive Canvas Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-full block touch-none"
        />

        {/* Inline Text Input Overlay (When tool === 'text') */}
        {activeNoteInput && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(activeNoteInput.x, (containerRef.current?.clientWidth || 800) - 280)}px`,
              top: `${Math.min(activeNoteInput.y, (containerRef.current?.clientHeight || 600) - 70)}px`
            }}
            className="z-30 bg-[#0d121f]/95 border border-cyan-400 p-2 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in zoom-in-95 duration-100"
          >
            <input
              type="text"
              autoFocus
              value={activeNoteInput.text}
              onChange={(e) => setActiveNoteInput({ ...activeNoteInput, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTextNote();
                if (e.key === 'Escape') setActiveNoteInput(null);
              }}
              placeholder="Type note & press Enter..."
              className="bg-transparent text-sm text-white focus:outline-none font-sans px-2 py-1 w-64 placeholder-slate-500"
            />
            <button
              onClick={commitTextNote}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Place
            </button>
          </div>
        )}

        {/* Bottom Ambient Info Banner */}
        {aiSpeechText && (
          <div className="absolute bottom-4 left-6 right-6 pointer-events-none flex items-center justify-between">
            <div className="px-4 py-2 rounded-2xl bg-[#0d121f]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl flex items-center gap-2.5 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{aiSpeechText}</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span>✎ Draw with cursor</span>
              <span>•</span>
              <span>Type notes</span>
              <span>•</span>
              <span className="text-cyan-300">AI writes directly on board</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
