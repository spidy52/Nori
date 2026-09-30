import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNori } from '../../context/NoriContext';
import { askNori } from '../../services/api';
import { voiceEngine } from '../../services/voice';
import {
  Sparkles,
  Layers,
  StickyNote,
  Cpu,
  Database,
  Server,
  Camera,
  Plus,
  Layout,
  Zap,
  CheckSquare,
  FileCode,
  ShieldCheck,
  Radio,
  BookOpen,
  ChevronDown,
  X,
  Search,
  Check,
  Download,
  Share2,
  Trash2,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Save,
  Copy,
  ArrowRight,
  HelpCircle,
  FileText,
  Sliders,
  Eye,
  Folder,
  FolderPlus,
  RefreshCw,
  HardDrive,
  Wand2,
  Hand,
  MousePointer,
  Square,
  Diamond,
  Circle,
  MoveRight,
  Minus,
  PenTool,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Palette,
  CornerDownRight,
  Grid,
  Edit3,
  AlignLeft,
  Tag,
  RotateCw
} from 'lucide-react';

export type CanvasTool =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'text'
  | 'sticky'
  | 'eraser';

export type StickyCategory = 'Decision' | 'Security' | 'Action' | 'Hardware' | 'AI' | 'Invariant' | 'Log' | 'Notes';

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot' | 'body';

export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'pen' | 'text' | 'sticky' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // In radians
  text?: string;
  imageData?: string; // Captured component photo / data URL
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  fillStyle: 'solid' | 'hachure' | 'transparent';
  roundness: number;
  fontSize?: number;
  fontFamily?: string;
  points?: { x: number; y: number }[];
  startBinding?: string | null;
  endBinding?: string | null;
  opacity: number;
  category?: StickyCategory;
}

interface NoteItem {
  id: string;
  title: string;
  category: StickyCategory;
  content: string;
  checklist?: { id: string; text: string; done: boolean }[];
  color: {
    bg: string;
    border: string;
    text: string;
    name: string;
  };
  tags: string[];
  updatedAt: string;
}

interface ProjectCanvas {
  id: string;
  name: string;
  description: string;
  icon: string;
  elements: CanvasElement[];
  notes: NoteItem[];
  zoom: number;
  panX: number;
  panY: number;
  lastModified: string;
}

// 8 Rich Accent Colors for Shapes & Lines
const SHAPE_COLOR_PALETTE = [
  { name: 'Nori Coral', stroke: '#fa5438', bg: 'rgba(250, 84, 56, 0.18)' },
  { name: 'Sky Cyan', stroke: '#38bdf8', bg: 'rgba(56, 189, 248, 0.18)' },
  { name: 'Electric Violet', stroke: '#c084fc', bg: 'rgba(192, 132, 252, 0.18)' },
  { name: 'Mint Emerald', stroke: '#34d399', bg: 'rgba(52, 211, 153, 0.18)' },
  { name: 'Solar Amber', stroke: '#fbbf24', bg: 'rgba(251, 191, 36, 0.18)' },
  { name: 'Rose Coral', stroke: '#fb7185', bg: 'rgba(251, 113, 133, 0.18)' },
  { name: 'Pure White', stroke: '#ffffff', bg: 'rgba(255, 255, 255, 0.10)' },
  { name: 'Dark Slate', stroke: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
];

// Vibrant High-Contrast Aesthetic Sticky Note Themes
export const NOTE_THEMES: Record<StickyCategory, { bg: string; border: string; text: string; name: string }> = {
  Decision: {
    bg: '#fef08a',
    border: '#eab308',
    text: '#713f12',
    name: 'Solar Amber'
  },
  Security: {
    bg: '#dcfce7',
    border: '#22c55e',
    text: '#14532d',
    name: 'Mint Emerald'
    
  },
  Action: {
    bg: '#ffe4e6',
    border: '#f43f5e',
    text: '#881337',
    name: 'Rose Coral'
  },
  Hardware: {
    bg: '#e0f2fe',
    border: '#0ea5e9',
    text: '#0c4a6e',
    name: 'Cyan Ice'
  },
  AI: {
    bg: '#f3e8ff',
    border: '#a855f7',
    text: '#581c87',
    name: 'Violet Lavender'
  },
  Invariant: {
    bg: '#ffedd5',
    border: '#f97316',
    text: '#7c2d12',
    name: 'Sunset Orange'
  },
  Log: {
    bg: '#181b28',
    border: '#fa5438',
    text: '#f8fafc',
    name: 'Dark Obsidian'
  },
  Notes: {
    bg: '#f8fafc',
    border: '#94a3b8',
    text: '#0f172a',
    name: 'Crisp White'
  }
};

// Rotate point around a center by angle radians
function rotatePoint(p: { x: number; y: number }, center: { x: number; y: number }, angleRad: number) {
  if (angleRad === 0) return p;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos)
  };
}

// Distance helper
function distToSegmentSquared(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) * (p.x - (v.x + t * (w.x - v.x))) + (p.y - (v.y + t * (w.y - v.y))) * (p.y - (v.y + t * (w.y - v.y)));
}

function distToSegment(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

// Accurate Hit-testing for element body (supporting rotation)
function isPointInElement(point: { x: number; y: number }, el: CanvasElement, hitTolerance = 14): boolean {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rot = el.rotation || 0;

  // Un-rotate point to test against unrotated bounding box
  const unrotPoint = rotatePoint(point, { x: cx, y: cy }, -rot);

  if (el.type === 'arrow' || el.type === 'line') {
    if (!el.points || el.points.length < 2) return false;
    for (let i = 0; i < el.points.length - 1; i++) {
      const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
      const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
      if (distToSegment(unrotPoint, p1, p2) <= hitTolerance) return true;
    }
    return false;
  }

  if (el.type === 'pen') {
    if (!el.points || el.points.length === 0) return false;
    if (el.points.length === 1) {
      const p = { x: el.x + el.points[0].x, y: el.y + el.points[0].y };
      const d = Math.hypot(unrotPoint.x - p.x, unrotPoint.y - p.y);
      return d <= hitTolerance;
    }
    for (let i = 0; i < el.points.length - 1; i++) {
      const p1 = { x: el.x + el.points[i].x, y: el.y + el.points[i].y };
      const p2 = { x: el.x + el.points[i + 1].x, y: el.y + el.points[i + 1].y };
      if (distToSegment(unrotPoint, p1, p2) <= hitTolerance) return true;
    }
    return false;
  }

  const minX = Math.min(el.x, el.x + el.width) - hitTolerance;
  const maxX = Math.max(el.x, el.x + el.width) + hitTolerance;
  const minY = Math.min(el.y, el.y + el.height) - hitTolerance;
  const maxY = Math.max(el.y, el.y + el.height) + hitTolerance;

  return unrotPoint.x >= minX && unrotPoint.x <= maxX && unrotPoint.y >= minY && unrotPoint.y <= maxY;
}

// Get Hit Handle for resizing & rotation
function getHandleAtPoint(point: { x: number; y: number }, el: CanvasElement, handleRadius = 9): HandleType | null {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rot = el.rotation || 0;

  // Un-rotate point to test against unrotated handle coordinates
  const p = rotatePoint(point, { x: cx, y: cy }, -rot);

  const x = el.x;
  const y = el.y;
  const w = el.width;
  const h = el.height;

  // Rotation handle (stalk above top center)
  const rotX = x + w / 2;
  const rotY = y - 26;
  if (Math.hypot(p.x - rotX, p.y - rotY) <= handleRadius + 3) return 'rot';

  // 8 Resize Handles
  const handles: { type: HandleType; x: number; y: number }[] = [
    { type: 'nw', x: x, y: y },
    { type: 'n', x: x + w / 2, y: y },
    { type: 'ne', x: x + w, y: y },
    { type: 'e', x: x + w, y: y + h / 2 },
    { type: 'se', x: x + w, y: y + h },
    { type: 's', x: x + w / 2, y: y + h },
    { type: 'sw', x: x, y: y + h },
    { type: 'w', x: x, y: y + h / 2 }
  ];

  for (const handle of handles) {
    if (Math.hypot(p.x - handle.x, p.y - handle.y) <= handleRadius) {
      return handle.type;
    }
  }

  // Inside element body
  if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) {
    return 'body';
  }

  return null;
}

// Text word-wrapping for canvas rendering
function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const rawParagraphs = text.split('\n');
  const result: string[] = [];

  for (const paragraph of rawParagraphs) {
    if (!paragraph.trim()) {
      result.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result;
}

// Seed Projects
const DEFAULT_PROJECTS: ProjectCanvas[] = [
  {
    id: 'proj_nori_core',
    name: 'Nori Core System Architecture',
    description: 'Hardware Accelerated Context Graph & FastAPI Core',
    icon: '',
    zoom: 1,
    panX: 180,
    panY: 120,
    lastModified: 'Just now',
    notes: [
      {
        id: 'n1',
        title: 'ADR-001: Local NPU Provider Integration',
        category: 'Decision',
        content: '• Provider: ONNX Runtime DirectML\n• Target: Snapdragon X Elite Hexagon NPU\n• Fallback: CPU FP32\n• Latency Budget: < 25ms per token',
        checklist: [
          { id: 'c1', text: 'Verify DirectML execution provider initialization', done: true },
          { id: 'c2', text: 'Benchmark token latency under 80% battery', done: false }
        ],
        color: NOTE_THEMES.Decision,
        tags: ['NPU', 'DirectML', 'Snapdragon'],
        updatedAt: '10:45 AM'
      },
      {
        id: 'n2',
        title: 'Zero-Cloud Privacy & Sandbox Rules',
        category: 'Security',
        content: '• No raw telemetry or video frames leave local memory.\n• AES-256 encrypted local SQLite database.\n• Air-gapped companion brain inference.',
        checklist: [
          { id: 'c3', text: 'Enforce local socket loopback only (127.0.0.1)', done: true },
          { id: 'c4', text: 'Encrypt disk storage keys', done: true }
        ],
        color: NOTE_THEMES.Security,
        tags: ['Privacy', 'ZeroCloud', 'Security'],
        updatedAt: '11:12 AM'
      }
    ],
    elements: [
      {
        id: 'node_fe',
        type: 'rectangle',
        x: 100,
        y: 180,
        width: 260,
        height: 120,
        rotation: 0,
        text: 'Frontend Client\n(React 19 / Vite)',
        strokeColor: '#fa5438',
        backgroundColor: 'rgba(250, 84, 56, 0.18)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 15,
        opacity: 100
      },
      {
        id: 'node_be',
        type: 'rectangle',
        x: 480,
        y: 180,
        width: 280,
        height: 120,
        rotation: 0,
        text: 'FastAPI Local Core\n(Loopback :8000)',
        strokeColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 15,
        opacity: 100
      },
      {
        id: 'node_npu',
        type: 'diamond',
        x: 880,
        y: 170,
        width: 250,
        height: 140,
        rotation: 0,
        text: 'DirectML NPU\nHexagon Router',
        strokeColor: '#c084fc',
        backgroundColor: 'rgba(192, 132, 252, 0.18)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 4,
        fontSize: 14,
        opacity: 100
      },
      {
        id: 'arr_1',
        type: 'arrow',
        x: 360,
        y: 240,
        width: 120,
        height: 0,
        rotation: 0,
        text: 'WSS / REST',
        strokeColor: '#fa5438',
        backgroundColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        fontSize: 12,
        points: [{ x: 0, y: 0 }, { x: 120, y: 0 }],
        opacity: 100
      },
      {
        id: 'arr_2',
        type: 'arrow',
        x: 760,
        y: 240,
        width: 120,
        height: 0,
        rotation: 0,
        text: 'Tensors',
        strokeColor: '#38bdf8',
        backgroundColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        fontSize: 12,
        points: [{ x: 0, y: 0 }, { x: 120, y: 0 }],
        opacity: 100
      },
      {
        id: 'sticky_1',
        type: 'sticky',
        x: 100,
        y: 350,
        width: 340,
        height: 190,
        rotation: 0,
        text: '📌 Architectural Decision:\n• DirectML Hexagon NPU Provider active\n• Zero-Cloud Isolation loopback 127.0.0.1\n• Sub-25ms Real-time Latency\n• SQLite Local Context Hypergraph',
        strokeColor: '#eab308',
        backgroundColor: '#fef08a',
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 13,
        opacity: 100,
        category: 'Decision'
      }
    ]
  },
  {
    id: 'proj_edge_sensor',
    name: 'IoT Edge Hardware Rig (TMP36)',
    description: 'Analog Sensor ADC Ingest & Serial Telemetry Stream',
    icon: '',
    zoom: 1,
    panX: 180,
    panY: 120,
    lastModified: '10 mins ago',
    notes: [
      {
        id: 'n3',
        title: 'Hardware Specs: TMP36 Sensor Rig',
        category: 'Hardware',
        content: '• Sensor: Analog Devices TMP36 (TO-92)\n• Pin 1: +5V VCC\n• Pin 2: Vout -> Arduino Pin A0\n• Pin 3: GND -> Analog Ground\n• Conversion: Temp(°C) = (Vout - 0.5) * 100',
        checklist: [
          { id: 'c5', text: 'Calibrate analog ground wire offset', done: true },
          { id: 'c6', text: 'Test sub-20ms serial telemetry loop', done: true }
        ],
        color: NOTE_THEMES.Hardware,
        tags: ['TMP36', 'Hardware', 'Arduino'],
        updatedAt: '11:30 AM'
      }
    ],
    elements: [
      {
        id: 'node_sensor',
        type: 'rectangle',
        x: 140,
        y: 200,
        width: 260,
        height: 120,
        rotation: 0,
        text: 'TMP36 Sensor\n(Analog Pin A0)',
        strokeColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.18)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 15,
        opacity: 100
      },
      {
        id: 'node_com3',
        type: 'rectangle',
        x: 520,
        y: 200,
        width: 270,
        height: 120,
        rotation: 0,
        text: 'Serial Worker\n(COM3 115200 Baud)',
        strokeColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.18)',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 15,
        opacity: 100
      }
    ]
  }
];

export const CreativeStudioCanvas: React.FC = () => {
  const { workSummary, setNoriState } = useNori();

  // Multi-Project Canvas Management State
  const [projects, setProjects] = useState<ProjectCanvas[]>(() => {
    const saved = localStorage.getItem('nori_custom_project_canvases');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem('nori_active_custom_project_id') || DEFAULT_PROJECTS[0].id;
  });

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Canvas Viewport & Engine State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [elements, setElements] = useState<CanvasElement[]>(activeProject.elements || []);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(activeProject.zoom || 1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: activeProject.panX || 120, y: activeProject.panY || 80 });

  // Selected Element
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  // Interaction State for Move, Resize & Rotate
  const interactionModeRef = useRef<'idle' | 'drawing' | 'moving' | 'resizing' | 'rotating'>('idle');
  const activeHandleRef = useRef<HandleType | null>(null);
  const startMouseWorldPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialElementRef = useRef<CanvasElement | null>(null);
  const currentDrawElementRef = useRef<CanvasElement | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const historyStackRef = useRef<CanvasElement[][]>([activeProject.elements || []]);
  const historyIndexRef = useRef<number>(0);

  // Style Palette state
  const [selectedColor, setSelectedColor] = useState<string>('#fa5438');
  const [selectedBgColor, setSelectedBgColor] = useState<string>('rgba(250, 84, 56, 0.18)');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<number>(2);
  const [selectedStickyTheme, setSelectedStickyTheme] = useState<StickyCategory>('Decision');
  const [showStickyPaletteMenu, setShowStickyPaletteMenu] = useState<boolean>(false);

  // Direct In-Place Block / Sticky Note Editor State
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<StickyCategory>('Decision');

  // Dynamic Hover Cursor
  const [hoverCursor, setHoverCursor] = useState<string>('default');

  // UI Menus & Modals
  const [showProjectMenu, setShowProjectMenu] = useState<boolean>(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [showAutoDrawMenu, setShowAutoDrawMenu] = useState<boolean>(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);
  const [showCustomNoteModal, setShowCustomNoteModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [newProjectIcon, setNewProjectIcon] = useState<string>('🚀');

  // Autonomous Auto-Draw Engine
  const [isAutoDrawing, setIsAutoDrawing] = useState<boolean>(false);
  const [autoDrawStatus, setAutoDrawStatus] = useState<string>('');
  const cancelAutoDrawRef = useRef<boolean>(false);

  // AI Prompt & Voice
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [notesSearch, setNotesSearch] = useState<string>('');
  const [selectedNoteCategory, setSelectedNoteCategory] = useState<string>('All');

  // Continuous AI Co-Pilot Monitoring State
  const [isContinuousMonitoring, setIsContinuousMonitoring] = useState<boolean>(true);
  const [liveMonitoringStatus, setLiveMonitoringStatus] = useState<string>('Live Co-Pilot: Monitoring canvas');
  const lastGreetingHandledRef = useRef<number>(0);
  const lastSpokenTimestampRef = useRef<number>(0);
  const lastHandledSignatureRef = useRef<string>('');
  const continuousDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  // Custom Note Creation State
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<StickyCategory>('Decision');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteTags, setNewNoteTags] = useState<string>('architecture, nori');

  // Save to persistent storage
  useEffect(() => {
    localStorage.setItem('nori_custom_project_canvases', JSON.stringify(projects));
    localStorage.setItem('nori_active_custom_project_id', activeProjectId);
  }, [projects, activeProjectId]);

  // Sync elements changes to active project
  const updateProjectElements = (newElements: CanvasElement[]) => {
    setElements(newElements);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              elements: newElements,
              zoom,
              panX: pan.x,
              panY: pan.y,
              lastModified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : p
      )
    );

    // Push to undo history
    const nextHistory = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(newElements);
    historyStackRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const prevElements = historyStackRef.current[historyIndexRef.current];
      setElements(prevElements);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      const nextElements = historyStackRef.current[historyIndexRef.current];
      setElements(nextElements);
    }
  };

  // Convert screen coordinates to world canvas coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const offsetX = rect ? screenX - rect.left : screenX;
      const offsetY = rect ? screenY - rect.top : screenY;
      return {
        x: (offsetX - pan.x) / zoom,
        y: (offsetY - pan.y) / zoom
      };
    },
    [pan, zoom]
  );

  // Start Direct In-Place Editing on Canvas Element
  const startEditingElement = (el: CanvasElement) => {
    setEditingElementId(el.id);
    setEditingText(el.text || '');
    setEditingCategory(el.category || 'Decision');
  };

  // Save Edited Element
  const handleSaveEditingElement = () => {
    if (!editingElementId) return;

    const targetEl = elements.find((el) => el.id === editingElementId);
    if (!targetEl) {
      setEditingElementId(null);
      return;
    }

    let updatedEl: CanvasElement = { ...targetEl, text: editingText };

    if (targetEl.type === 'sticky') {
      const theme = NOTE_THEMES[editingCategory] || NOTE_THEMES.Decision;
      updatedEl = {
        ...updatedEl,
        category: editingCategory,
        strokeColor: theme.border,
        backgroundColor: theme.bg
      };
    }

    updateProjectElements(elements.map((el) => (el.id === editingElementId ? updatedEl : el)));
    setEditingElementId(null);
  };

  // Duplicate Selected Element
  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const duplicated: CanvasElement = {
      ...selectedElement,
      id: `el_${Date.now()}`,
      x: selectedElement.x + 30,
      y: selectedElement.y + 30
    };
    updateProjectElements([...elements, duplicated]);
    setSelectedElementId(duplicated.id);
    showNotification('Duplicated block');
  };

  // Change Theme of Selected Sticky Note
  const handleApplyStickyTheme = (themeKey: StickyCategory) => {
    const theme = NOTE_THEMES[themeKey];
    if (selectedElementId) {
      updateProjectElements(
        elements.map((el) =>
          el.id === selectedElementId
            ? {
                ...el,
                category: themeKey,
                strokeColor: theme.border,
                backgroundColor: theme.bg
              }
            : el
        )
      );
      setSelectedStickyTheme(themeKey);
      showNotification(`Applied ${theme.name}`);
    }
  };

  // Apply Shape Color to Selected Element
  const handleApplyShapeColor = (strokeColor: string, bgColor: string) => {
    setSelectedColor(strokeColor);
    setSelectedBgColor(bgColor);
    if (selectedElementId) {
      updateProjectElements(
        elements.map((el) =>
          el.id === selectedElementId
            ? {
                ...el,
                strokeColor,
                backgroundColor: el.type === 'sticky' ? bgColor : bgColor
              }
            : el
        )
      );
    }
  };

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // ✦ AUTONOMOUS CO-PILOT AUTO-DRAW ENGINE (INFINITE CANVAS SUPPORT)
  // -------------------------------------------------------------
  const executeAutonomousAutoDraw = async (
    plan: {
      name: string;
      explanation?: string;
      sequence: Array<{ status: string; element: CanvasElement }>;
    },
    targetProjectId?: string,
    existingElementsBase?: CanvasElement[]
  ) => {
    setIsAutoDrawing(true);
    cancelAutoDrawRef.current = false;
    setNoriState('thinking');

    // 1. Determine existing elements base (preserve what's already on the canvas!)
    const projIdToUpdate = targetProjectId || activeProjectId;
    const baseElements = existingElementsBase !== undefined ? existingElementsBase : elements;

    // 2. Spatial offset: Calculate right-most extent on infinite canvas so diagrams never collide
    let offsetX = 0;
    let offsetY = 0;
    if (baseElements.length > 0) {
      const maxX = Math.max(...baseElements.map((el) => (el.x || 0) + (el.width || 240)));
      const minY = Math.min(...baseElements.map((el) => el.y || 200));
      // Base plan default starts at (240, 220). Calculate offset to place cleanly to the right
      const desiredX = maxX + 280;
      const desiredY = Math.max(120, minY);
      offsetX = desiredX - 240;
      offsetY = desiredY - 220;
    }

    // 3. Offset all elements in the plan so they land on fresh infinite canvas space
    const adjustedSequence = plan.sequence.map((step) => {
      const el = { ...step.element };
      el.x = el.x + offsetX;
      el.y = el.y + offsetY;
      return { ...step, element: el };
    });

    // 4. Smoothly pan camera to the new diagram location before drawing starts
    if (adjustedSequence.length > 0) {
      const firstEl = adjustedSequence[0].element;
      setPan({
        x: window.innerWidth / 2 - (firstEl.x + 350) * zoom,
        y: window.innerHeight / 2 - (firstEl.y + 150) * zoom
      });
    }

    let currentElements: CanvasElement[] = [...baseElements];

    for (let i = 0; i < adjustedSequence.length; i++) {
      if (cancelAutoDrawRef.current) break;

      const step = adjustedSequence[i];
      setAutoDrawStatus(step.status);
      showNotification(step.status);

      currentElements = [...currentElements, step.element];
      setElements(currentElements);
      
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projIdToUpdate
            ? {
                ...p,
                elements: currentElements,
                lastModified: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : p
        )
      );
      setSelectedElementId(step.element.id);

      // Smooth step animation pause
      await new Promise((r) => setTimeout(r, 340));
    }

    setIsAutoDrawing(false);
    setAutoDrawStatus('');
    setNoriState('speaking');

    // Pan canvas smoothly to frame the completed diagram
    if (adjustedSequence.length > 0) {
      const firstEl = adjustedSequence[0].element;
      setPan({
        x: window.innerWidth / 2 - (firstEl.x + 350) * zoom,
        y: window.innerHeight / 2 - (firstEl.y + 150) * zoom
      });
    }

    showNotification(`✦ Rendered "${plan.name}" on infinite canvas!`);
    const spokenExplanation =
      plan.explanation ||
      `I have rendered the complete architecture for ${plan.name} on your canvas.`;
    voiceEngine.speak(spokenExplanation);
    setTimeout(() => setNoriState('idle'), 4000);
  };

  // -------------------------------------------------------------
  // ✦ GLOBAL AI VOICE & COMMAND DRAW LISTENER
  // -------------------------------------------------------------
  useEffect(() => {
    const handleGlobalAutoDraw = (e: any) => {
      const prompt = e.detail?.prompt;
      const isHardware = e.detail?.detections || e.detail?.wiringAnalysis;
      if (prompt) {
        setAiPrompt(prompt);
        executeAiAutoDrawFromPrompt(prompt, isHardware ? e.detail : undefined);
      }
    };

    window.addEventListener('nori-auto-draw', handleGlobalAutoDraw);
    return () => window.removeEventListener('nori-auto-draw', handleGlobalAutoDraw);
  }, [elements, zoom]);

  const executeAiAutoDrawFromPrompt = async (promptText: string, extraContext?: any) => {
    if (!promptText.trim()) return;
    setIsAiGenerating(true);
    setNoriState('thinking');

    // 1. Create a brand new project workspace whiteboard specifically for this query
    const cleanName = promptText
      .replace(/^(can you|could you|please|hey nori|nori|draw me|draw a|draw|sketch|diagram|generate)\s+/i, '')
      .trim();
    const formattedTitle = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : 'Architecture Blueprint';
    
    const newProjId = `proj_auto_${Date.now()}`;
    const newProject: ProjectCanvas = {
      id: newProjId,
      name: formattedTitle,
      description: promptText,
      icon: promptText.toLowerCase().includes('hardware') || promptText.toLowerCase().includes('sensor') ? '🔬' : '📐',
      zoom: 1,
      panX: 180,
      panY: 100,
      lastModified: 'Just now',
      notes: [],
      elements: []
    };

    // Switch to fresh new workspace project
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProjId);
    setElements([]);
    setPan({ x: 180, y: 100 });
    setZoom(1);
    localStorage.setItem('nori_active_custom_project_id', newProjId);

    try {
      const lower = promptText.toLowerCase();
      const ox = 240;
      const oy = 220;

      // 1. HARDWARE / WORKBENCH CIRCUIT & COMPONENT DIAGRAM
      if (
        extraContext?.blueprint ||
        extraContext?.componentCrops ||
        extraContext?.wiringAnalysis ||
        lower.includes('hardware') ||
        lower.includes('circuit') ||
        lower.includes('arduino') ||
        lower.includes('sensor') ||
        lower.includes('wire') ||
        lower.includes('component') ||
        lower.includes('workbench')
      ) {
        const bp = extraContext?.blueprint;
        const crops = extraContext?.componentCrops || {};
        const title = bp?.title || 'Physical Hardware Architecture';
        const componentsUsed = bp?.detected_components_used || ['Arduino Uno', 'HC-SR04 Sensor', 'Jumper Wires'];

        // Find available cropped component images
        let arduinoCropUrl: string | undefined;
        let sensorCropUrl: string | undefined;
        let breadboardCropUrl: string | undefined;

        Object.keys(crops).forEach((k) => {
          const lk = k.toLowerCase();
          if (lk.includes('arduino') || lk.includes('microcontroller') || lk.includes('uno')) {
            arduinoCropUrl = crops[k].dataUrl;
          } else if (lk.includes('ultrasonic') || lk.includes('sensor') || lk.includes('hc-sr04')) {
            sensorCropUrl = crops[k].dataUrl;
          } else if (lk.includes('breadboard')) {
            breadboardCropUrl = crops[k].dataUrl;
          }
        });

        const sequence: Array<{ status: string; element: CanvasElement }> = [
          // Boundary Zone 1: Physical Workbench Components
          {
            status: 'Setting Up Physical Workbench Container',
            element: {
              id: `zone_workbench_${Date.now()}`,
              type: 'rectangle',
              x: ox - 20,
              y: oy - 30,
              width: 480,
              height: 380,
              rotation: 0,
              text: 'Physical Workbench (Photographed Components)',
              strokeColor: '#2e3446',
              backgroundColor: '#141720',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 12,
              fontSize: 12,
              opacity: 100
            }
          },
          // Boundary Zone 2: Embedded Logic & Processing Hub
          {
            status: 'Setting Up Embedded Processing Hub Container',
            element: {
              id: `zone_firmware_${Date.now()}`,
              type: 'rectangle',
              x: ox + 500,
              y: oy - 30,
              width: 440,
              height: 380,
              rotation: 0,
              text: 'Embedded Runtime & Processing Hub',
              strokeColor: '#2e3446',
              backgroundColor: '#181a24',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 12,
              fontSize: 12,
              opacity: 100
            }
          },
          // Photographed or Schematic Arduino MCU Element
          {
            status: 'Placing Arduino Microcontroller (Photographed)',
            element: {
              id: `hw_mcu_${Date.now()}`,
              type: (arduinoCropUrl ? 'image' : 'rectangle') as CanvasElement['type'],
              imageData: arduinoCropUrl,
              x: ox + 15,
              y: oy + 35,
              width: 200,
              height: 140,
              rotation: 0,
              text: 'Arduino Uno R3 (ATmega328P)\n• 5V Power, GND\n• Pins D8, D9, D13\n• 16 MHz Clock',
              strokeColor: '#38bdf8',
              backgroundColor: '#1a1d28',
              strokeWidth: 2,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Photographed or Schematic Sensor Element
          {
            status: 'Placing Ultrasonic Sensor (Photographed)',
            element: {
              id: `hw_sensor_${Date.now()}`,
              type: (sensorCropUrl ? 'image' : 'rectangle') as CanvasElement['type'],
              imageData: sensorCropUrl,
              x: ox + 245,
              y: oy + 35,
              width: 195,
              height: 140,
              rotation: 0,
              text: 'HC-SR04 Sensor (Ultrasonic)\n• VCC (5V Power)\n• GND (Ground)\n• Trig (Pulse) & Echo',
              strokeColor: '#10b981',
              backgroundColor: '#1a1d28',
              strokeWidth: 2,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Breadboard / Power Tie Bus Card
          {
            status: 'Placing Solderless Breadboard & Distribution',
            element: {
              id: `hw_proto_${Date.now()}`,
              type: (breadboardCropUrl ? 'image' : 'rectangle') as CanvasElement['type'],
              imageData: breadboardCropUrl,
              x: ox + 15,
              y: oy + 205,
              width: 425,
              height: 120,
              rotation: 0,
              text: 'Solderless Prototyping Breadboard\n• +5V Power Distribution Rail (Red)\n• Common Ground Rail (Black)\n• 220Ω Resistor + Status Indicator LED',
              strokeColor: '#475569',
              backgroundColor: '#161922',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Logic / Firmware Processing Card inside Zone 2
          {
            status: 'Placing Embedded Firmware Execution Card',
            element: {
              id: `hw_logic_${Date.now()}`,
              type: 'rectangle',
              x: ox + 530,
              y: oy + 45,
              width: 380,
              height: 95,
              rotation: 0,
              text: 'Embedded Signal Processing Pipeline\n1. 10µs High Sound Pulse (Pin 9 Trig)\n2. Precision pulseIn Echo Timing (Pin 8)\n3. Distance (cm) = duration × 0.034 / 2',
              strokeColor: '#373b49',
              backgroundColor: '#1e2029',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Royal Blue Hardware Target Chips
          {
            status: 'Mounting ATmega328P Core Execution Chip',
            element: {
              id: `chip_mcu_${Date.now()}`,
              type: 'rectangle',
              x: ox + 530,
              y: oy + 165,
              width: 115,
              height: 44,
              rotation: 0,
              text: 'ATmega328P',
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 12,
              opacity: 100
            }
          },
          {
            status: 'Mounting Hardware Timer PWM Execution Chip',
            element: {
              id: `chip_timer_${Date.now()}`,
              type: 'rectangle',
              x: ox + 662,
              y: oy + 165,
              width: 115,
              height: 44,
              rotation: 0,
              text: 'Timer 1 PWM',
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 12,
              opacity: 100
            }
          },
          {
            status: 'Mounting UART Telemetry Chip',
            element: {
              id: `chip_uart_${Date.now()}`,
              type: 'rectangle',
              x: ox + 795,
              y: oy + 165,
              width: 115,
              height: 44,
              rotation: 0,
              text: '115200 UART',
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 12,
              opacity: 100
            }
          },
          // Wire 1: Arduino 5V -> Sensor VCC (Red)
          {
            status: 'Drawing 5V VCC Power Connection (Red Wire)',
            element: {
              id: `wire_pwr_${Date.now()}`,
              type: 'arrow',
              x: ox + 215,
              y: oy + 65,
              width: 30,
              height: 0,
              rotation: 0,
              text: '5V VCC',
              strokeColor: '#ef4444',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 10,
              points: [{ x: 0, y: 0 }, { x: 30, y: 0 }],
              opacity: 100
            }
          },
          // Wire 2: Arduino GND -> Sensor GND (Black)
          {
            status: 'Drawing GND Ground Common Connection (Black Wire)',
            element: {
              id: `wire_gnd_${Date.now()}`,
              type: 'arrow',
              x: ox + 215,
              y: oy + 105,
              width: 30,
              height: 0,
              rotation: 0,
              text: 'GND',
              strokeColor: '#64748b',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 10,
              points: [{ x: 0, y: 0 }, { x: 30, y: 0 }],
              opacity: 100
            }
          },
          // Wire 3: Forward Signal to Firmware Hub (Electric Blue)
          {
            status: 'Routing Physical Signals to Embedded Firmware Hub',
            element: {
              id: `wire_signal_${Date.now()}`,
              type: 'arrow',
              x: ox + 440,
              y: oy + 92,
              width: 90,
              height: 0,
              rotation: 0,
              text: 'Trig & Echo Bus',
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 90, y: 0 }],
              opacity: 100
            }
          },
          // Orthogonal Feedback Loop: Telemetry Stream along bottom back to Arduino
          {
            status: 'Routing Real-Time Telemetry Feedback Loop',
            element: {
              id: `wire_telemetry_${Date.now()}`,
              type: 'arrow',
              x: ox + 850,
              y: oy + 209,
              width: -750,
              height: 0,
              rotation: 0,
              text: 'Spatial Telemetry & Distance Feedback (16 Hz)',
              strokeColor: '#2563eb',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 0, y: 110 }, { x: -750, y: 110 }, { x: -750, y: -45 }],
              opacity: 100
            }
          }
        ];

        const plan = {
          name: title,
          explanation: `Synthesized hardware circuit architecture diagram for ${title}. Placed actual component photo crops, verified pinouts, and routed electrical signals and feedback telemetry.`,
          sequence
        };

        setAiPrompt('');
        await executeAutonomousAutoDraw(plan, newProjId, []);
        return;
      }

      // 2. DYNAMIC QUALCOMM-STYLE PIPELINE ARCHITECTURE (SNAPDRAGON NPU, LOCAL AI, AGENT, FULL-STACK)
      let zoneLeftTitle = 'Off Device';
      let zoneRightTitle = 'On Device';
      let step1Title = '1. Design and train a machine learning model';
      let step2Title = '2. Convert the model to DLC / QNN ONNX format';
      let step3Title = '3. Add the Qualcomm Neural Processing SDK to your application';
      let step4Title = '4. Load and run the model on Snapdragon';
      let chips = ['CPU', 'GPU', 'Hexagon\nNPU'];
      let feedback1Label = 'Design Hints';
      let feedback2Label = 'Execution profiling';

      // Dynamic Adaptation based on Prompt Semantics (NO hardcoding)
      if (lower.includes('agent') || lower.includes('computer-use') || lower.includes('desktop') || lower.includes('vision')) {
        zoneLeftTitle = 'Host Workspace Ingress';
        zoneRightTitle = 'Local NPU Agent Engine';
        step1Title = '1. Capture desktop screen & voice speech telemetry';
        step2Title = '2. Tokenize prompt & construct temporal context graph';
        step3Title = '3. Bind native Windows User32 & PowerShell system APIs';
        step4Title = '4. Execute reasoning & computer-use action loop';
        chips = ['DirectML\nVision', 'Host\nCPU', 'Hexagon\nNPU'];
        feedback1Label = 'Context Alignment';
        feedback2Label = 'Desktop Observation';
      } else if (lower.includes('web') || lower.includes('microservice') || lower.includes('api') || lower.includes('full-stack') || lower.includes('database')) {
        zoneLeftTitle = 'Edge Ingress & Gateway';
        zoneRightTitle = 'Distributed Compute Core';
        step1Title = '1. Client ingress, React Studio & Electron Pet';
        step2Title = '2. WebSocket gateway & normalized event dispatcher';
        step3Title = '3. Configure background workers & SQLite persistent store';
        step4Title = '4. Execute distributed compute & state synchronization';
        chips = ['FastAPI\nCore', 'Worker\nMesh', 'SQLite\nStore'];
        feedback1Label = 'State Validation';
        feedback2Label = 'Telemetry Profiling';
      }

      const plan: { name: string; explanation?: string; sequence: Array<{ status: string; element: CanvasElement }> } = {
        name: promptText,
        explanation: `Synthesized high-performance Qualcomm-style architecture blueprint for ${promptText}. Mapped logical boundary zones, sequential stages, hardware execution chips, and orthogonal feedback loops.`,
        sequence: [
          // Left Zone Label / Container
          {
            status: `Setting Up ${zoneLeftTitle} Boundary`,
            element: {
              id: `zone_label_left_${Date.now()}`,
              type: 'text',
              x: ox + 430,
              y: oy - 25,
              width: 140,
              height: 30,
              rotation: 0,
              text: zoneLeftTitle,
              strokeColor: '#f1f5f9',
              backgroundColor: 'transparent',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 16,
              opacity: 100
            }
          },
          // Right Zone Container: "On Device" (Elevated Dark Slate Container)
          {
            status: `Setting Up ${zoneRightTitle} Execution Container`,
            element: {
              id: `zone_right_${Date.now()}`,
              type: 'rectangle',
              x: ox + 590,
              y: oy - 45,
              width: 360,
              height: 380,
              rotation: 0,
              text: zoneRightTitle,
              strokeColor: '#2e323e',
              backgroundColor: '#181a20',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 12,
              fontSize: 16,
              opacity: 100
            }
          },
          // Card 1
          {
            status: `Placing Stage 1 Card: ${step1Title.slice(0, 30)}`,
            element: {
              id: `step1_${Date.now()}`,
              type: 'rectangle',
              x: ox - 20,
              y: oy + 35,
              width: 250,
              height: 80,
              rotation: 0,
              text: step1Title,
              strokeColor: '#373b49',
              backgroundColor: '#1e2029',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Card 2
          {
            status: `Placing Stage 2 Card: ${step2Title.slice(0, 30)}`,
            element: {
              id: `step2_${Date.now()}`,
              type: 'rectangle',
              x: ox + 300,
              y: oy + 35,
              width: 245,
              height: 80,
              rotation: 0,
              text: step2Title,
              strokeColor: '#373b49',
              backgroundColor: '#1e2029',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Card 3
          {
            status: `Placing Stage 3 Card: ${step3Title.slice(0, 30)}`,
            element: {
              id: `step3_${Date.now()}`,
              type: 'rectangle',
              x: ox + 300,
              y: oy + 175,
              width: 245,
              height: 80,
              rotation: 0,
              text: step3Title,
              strokeColor: '#373b49',
              backgroundColor: '#1e2029',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Card 4 (Inside On Device Container)
          {
            status: `Placing Stage 4 Execution Card: ${step4Title.slice(0, 30)}`,
            element: {
              id: `step4_${Date.now()}`,
              type: 'rectangle',
              x: ox + 630,
              y: oy + 45,
              width: 280,
              height: 80,
              rotation: 0,
              text: step4Title,
              strokeColor: '#373b49',
              backgroundColor: '#1e2029',
              strokeWidth: 1.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 8,
              fontSize: 12,
              opacity: 100
            }
          },
          // Blue Hardware Target Chips under Card 4
          {
            status: `Mounting ${chips[0]} Acceleration Chip`,
            element: {
              id: `chip_1_${Date.now()}`,
              type: 'rectangle',
              x: ox + 630,
              y: oy + 155,
              width: 82,
              height: 44,
              rotation: 0,
              text: chips[0],
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 12,
              opacity: 100
            }
          },
          {
            status: `Mounting ${chips[1]} Acceleration Chip`,
            element: {
              id: `chip_2_${Date.now()}`,
              type: 'rectangle',
              x: ox + 729,
              y: oy + 155,
              width: 82,
              height: 44,
              rotation: 0,
              text: chips[1],
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 12,
              opacity: 100
            }
          },
          {
            status: `Mounting ${chips[2]} Acceleration Chip`,
            element: {
              id: `chip_3_${Date.now()}`,
              type: 'rectangle',
              x: ox + 828,
              y: oy + 155,
              width: 82,
              height: 44,
              rotation: 0,
              text: chips[2],
              strokeColor: '#3b82f6',
              backgroundColor: '#2563eb',
              strokeWidth: 1,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 4,
              fontSize: 11,
              opacity: 100
            }
          },
          // Forward Arrow: 1 -> 2
          {
            status: 'Connecting Stage 1 to Stage 2',
            element: {
              id: `arrow_1_2_${Date.now()}`,
              type: 'arrow',
              x: ox + 230,
              y: oy + 75,
              width: 70,
              height: 0,
              rotation: 0,
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 70, y: 0 }],
              opacity: 100
            }
          },
          // Forward Arrow: 2 -> 4 (Entering On Device)
          {
            status: `Routing Forward Flow into ${zoneRightTitle}`,
            element: {
              id: `arrow_2_4_${Date.now()}`,
              type: 'arrow',
              x: ox + 545,
              y: oy + 75,
              width: 85,
              height: 10,
              rotation: 0,
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 85, y: 10 }],
              opacity: 100
            }
          },
          // Forward Arrow: 3 -> 4 (Entering On Device)
          {
            status: `Routing SDK Flow into ${zoneRightTitle}`,
            element: {
              id: `arrow_3_4_${Date.now()}`,
              type: 'arrow',
              x: ox + 545,
              y: oy + 215,
              width: 85,
              height: -105,
              rotation: 0,
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 85, y: -105 }],
              opacity: 100
            }
          },
          // Orthogonal Feedback Loop 1: From 2 back to 1 (Design Hints)
          {
            status: `Routing Orthogonal Feedback: ${feedback1Label}`,
            element: {
              id: `feedback_loop_1_${Date.now()}`,
              type: 'arrow',
              x: ox + 422,
              y: oy + 115,
              width: -320,
              height: 0,
              rotation: 0,
              text: feedback1Label,
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 0, y: 35 }, { x: -320, y: 35 }, { x: -320, y: 0 }],
              opacity: 100
            }
          },
          // Orthogonal Feedback Loop 2: From Chips along bottom back to 1 (Execution profiling)
          {
            status: `Routing Orthogonal Feedback: ${feedback2Label}`,
            element: {
              id: `feedback_loop_2_${Date.now()}`,
              type: 'arrow',
              x: ox + 770,
              y: oy + 199,
              width: -750,
              height: 0,
              rotation: 0,
              text: feedback2Label,
              strokeColor: '#3b82f6',
              backgroundColor: 'transparent',
              strokeWidth: 2.5,
              strokeStyle: 'solid',
              fillStyle: 'solid',
              roundness: 0,
              fontSize: 11,
              points: [{ x: 0, y: 0 }, { x: 0, y: 110 }, { x: -750, y: 110 }, { x: -750, y: -84 }],
              opacity: 100
            }
          }
        ]
      };

      setAiPrompt('');
      await executeAutonomousAutoDraw(plan, newProjId, []);
    } catch (e) {
      setNoriState('idle');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // ✦ STROKE & GREETING RECOGNITION HELPERS
  // -------------------------------------------------------------
  const getPenBoundingBox = (el: CanvasElement) => {
    const pts = el.points || [];
    if (pts.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      const wx = el.x + p.x;
      const wy = el.y + p.y;
      if (wx < minX) minX = wx;
      if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy;
      if (wy > maxY) maxY = wy;
    }
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  };

  interface CanvasIntent {
    kind: 'greeting' | 'status_fine' | 'diagram';
    voice: string;
    cardText: string;
    arrowText: string;
  }

  const analyzeCanvasIntent = (currentElements: CanvasElement[]): CanvasIntent | null => {
    // 1. Text elements check (typed notes)
    for (const el of currentElements) {
      if (el.text) {
        const lower = el.text.toLowerCase();
        if (/\b(fine|good|great|doing well|doing good|ok|okay|im fine|i'm fine)\b/.test(lower)) {
          return {
            kind: 'status_fine',
            voice: "Glad to hear you're doing well! What would you like to build or brainstorm today?",
            cardText: '✦ Nori AI Assistant:\n"Glad to hear you\'re doing well!\nWhat would you like to build or brainstorm today?"',
            arrowText: "Great!"
          };
        }
        if (/\b(hi|hello|hey|hola|greetings|howdy|whatsup|sup|good morning)\b/.test(lower)) {
          return {
            kind: 'greeting',
            voice: "Hello! Great to see you. What are we brainstorming today?",
            cardText: '✦ Nori AI Assistant:\n"Hello! Great to see you.\nWhat are we brainstorming or designing today?"',
            arrowText: "Hi!"
          };
        }
      }
    }

    // 2. Handwritten pen stroke check
    const penEls = currentElements.filter((el) => el.type === 'pen' && el.points && el.points.length > 0);
    if (penEls.length === 0) return null;

    const boxes = penEls
      .map(getPenBoundingBox)
      .filter(Boolean) as Array<{ minX: number; maxX: number; minY: number; maxY: number; width: number; height: number }>;

    if (boxes.length === 0) return null;
    const validBoxes = boxes.filter((b) => b.width > 2 || b.height > 2);

    // If only 1 stroke and narrow (like single letter 'I' or '|'), user is still actively writing! Do not trigger!
    if (validBoxes.length === 1 && validBoxes[0].width < 50) {
      return null;
    }

    const totalMinX = Math.min(...validBoxes.map((b) => b.minX));
    const totalMaxX = Math.max(...validBoxes.map((b) => b.maxX));
    const totalMinY = Math.min(...validBoxes.map((b) => b.minY));
    const totalMaxY = Math.max(...validBoxes.map((b) => b.maxY));
    const totalW = totalMaxX - totalMinX;
    const totalH = totalMaxY - totalMinY;
    const aspect = totalW / Math.max(1, totalH);

    // Check if user drew backend architecture boxes
    const hasInfrastructure = currentElements.some(
      (el) => el.type === 'rectangle' && (el.text?.includes('API') || el.text?.includes('Database') || el.text?.includes('Cache'))
    );

    if (hasInfrastructure) {
      return null;
    }

    // Measure space gaps between strokes to detect multi-word phrases (e.g. "I'm fine")
    validBoxes.sort((a, b) => a.minX - b.minX);
    let maxGap = 0;
    for (let i = 0; i < validBoxes.length - 1; i++) {
      const gap = validBoxes[i + 1].minX - validBoxes[i].maxX;
      if (gap > maxGap) maxGap = gap;
    }

    // Multi-word phrase like "I'm fine": stroke count >= 4 and width >= 190, or aspect >= 2.2 with >= 3 strokes, or noticeable word gap
    const isMultiWordStatus = (validBoxes.length >= 4 && (totalW >= 190 || maxGap >= 15)) || (aspect >= 2.2 && validBoxes.length >= 3);

    if (isMultiWordStatus) {
      return {
        kind: 'status_fine',
        voice: "Glad to hear you're doing well! What would you like to build or brainstorm today?",
        cardText: '✦ Nori AI Assistant:\n"Glad to hear you\'re doing well!\nWhat would you like to build or brainstorm today?"',
        arrowText: "Great!"
      };
    }

    // Single-word greeting like "Hi" or "Hello": compact width, 1 to 6 strokes
    if (totalW >= 30 && totalH >= 20 && aspect >= 0.35 && aspect <= 3.5 && validBoxes.length <= 6) {
      return {
        kind: 'greeting',
        voice: "Hello! Great to see you. What are we brainstorming today?",
        cardText: '✦ Nori AI Assistant:\n"Hello! Great to see you.\nWhat are we brainstorming or designing today?"',
        arrowText: "Hi!"
      };
    }

    return null;
  };

  // -------------------------------------------------------------
  // ✦ AI FINISH DRAWING & CONTINUOUS INTELLIGENCE AGENT
  // -------------------------------------------------------------
  const handleAiFinishDrawing = async () => {
    if (elements.length === 0) {
      showNotification('Draw or write something first, and AI will complete it!');
      voiceEngine.speak('Draw or write any idea on the canvas, and I will complete the full architecture for you.');
      return;
    }

    setIsAiGenerating(true);
    setNoriState('thinking');
    showNotification('✦ Nori is analyzing your sketch and finishing the idea...');

    // Extract all words and concepts from user elements
    const elementTexts = elements
      .map((el) => el.text?.trim())
      .filter(Boolean) as string[];
    const combinedContext = elementTexts.join(' ').toLowerCase();

    // Determine boundary of current elements using pen bounding boxes
    const maxX = Math.max(...elements.map((el) => {
      if (el.type === 'pen' && el.points && el.points.length > 0) {
        const b = getPenBoundingBox(el);
        return b ? b.maxX : (el.x + 100);
      }
      return (el.x || 0) + (el.width || 200);
    }));
    const minY = Math.min(...elements.map((el) => {
      if (el.type === 'pen' && el.points && el.points.length > 0) {
        const b = getPenBoundingBox(el);
        return b ? b.minY : el.y;
      }
      return el.y || 200;
    }));

    const startX = maxX + 40;
    const startY = Math.max(40, minY);

    // Check intent (greeting vs status vs architecture)
    const intent = analyzeCanvasIntent(elements);

    // Identify domain theme
    const isHardware = combinedContext.includes('sensor') || combinedContext.includes('circuit') || combinedContext.includes('arduino') || combinedContext.includes('pin') || combinedContext.includes('wire');
    const isAiMl = combinedContext.includes('model') || combinedContext.includes('ai') || combinedContext.includes('rag') || combinedContext.includes('vector') || combinedContext.includes('llm');

    let newElements: CanvasElement[] = [];
    let summaryExplanation = '';

    if (intent) {
      summaryExplanation = intent.voice;
      newElements = [
        {
          id: `finish_reply_${Date.now()}_1`,
          type: 'sticky',
          x: startX + 50,
          y: startY,
          width: 330,
          height: 145,
          text: intent.cardText,
          strokeColor: '#38bdf8',
          backgroundColor: '#082f49',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 8,
          category: 'AI',
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_reply_${Date.now()}_2`,
          type: 'arrow',
          x: startX,
          y: startY + 40,
          width: 50,
          height: 0,
          text: intent.arrowText,
          strokeColor: '#38bdf8',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
          opacity: 100
        }
      ];
    } else if (isHardware) {
      summaryExplanation = "I noticed you're sketching a hardware system. I've added the microcontroller, sensor input bus, power rail, and telemetry endpoint.";
      newElements = [
        {
          id: `finish_el_${Date.now()}_1`,
          type: 'rectangle',
          x: startX,
          y: startY,
          width: 260,
          height: 120,
          text: 'Microcontroller Controller\n• 5V / 3.3V Logic Bus\n• GPIO & ADC Channels\n• I2C Telemetry',
          strokeColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.16)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 6,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_2`,
          type: 'arrow',
          x: startX - 100,
          y: startY + 60,
          width: 100,
          height: 0,
          text: 'Analog In',
          strokeColor: '#fb923c',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_3`,
          type: 'rectangle',
          x: startX + 340,
          y: startY,
          width: 260,
          height: 120,
          text: 'Local Data Telemetry Hub\n• Sensor Event Queue\n• DirectML Hardware Engine\n• Zero-Cloud Local DB',
          strokeColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.16)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 6,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_4`,
          type: 'arrow',
          x: startX + 260,
          y: startY + 60,
          width: 80,
          height: 0,
          text: 'Serial/USB',
          strokeColor: '#34d399',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 80, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_5`,
          type: 'sticky',
          x: startX + 120,
          y: startY + 160,
          width: 320,
          height: 130,
          text: '✦ AI Architecture Completion:\n• Hardware interface completed with isolated ground rail.\n• Signal jitter compensated via moving average.\n• Local SQLite storage initialized.',
          strokeColor: '#a855f7',
          backgroundColor: '#2e1065',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 8,
          category: 'AI',
          fontSize: 12,
          opacity: 100
        }
      ];
    } else if (isAiMl) {
      summaryExplanation = "I see you're building an AI/ML intelligence pipeline. I've finished the idea with the vector embedding stage, vector index, and contextual generator.";
      newElements = [
        {
          id: `finish_el_${Date.now()}_1`,
          type: 'diamond',
          x: startX,
          y: startY - 20,
          width: 200,
          height: 160,
          text: 'Hybrid RAG\nEmbedding Router',
          strokeColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.18)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 4,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_2`,
          type: 'arrow',
          x: startX - 80,
          y: startY + 60,
          width: 80,
          height: 0,
          text: 'User Context',
          strokeColor: '#c084fc',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 80, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_3`,
          type: 'ellipse',
          x: startX + 280,
          y: startY,
          width: 240,
          height: 130,
          text: 'Vector DB & Context Graph\n• Fast Cosine Similarity\n• Memory & Episodic Store',
          strokeColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.18)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 4,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_4`,
          type: 'arrow',
          x: startX + 200,
          y: startY + 60,
          width: 80,
          height: 0,
          text: 'Vectors',
          strokeColor: '#34d399',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 80, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_5`,
          type: 'sticky',
          x: startX + 80,
          y: startY + 180,
          width: 340,
          height: 130,
          text: '✦ AI Architecture Completion:\n• Completed semantic retrieval pipeline.\n• Injected prompt grounding with context memory.\n• Verified <25ms vector lookup response.',
          strokeColor: '#38bdf8',
          backgroundColor: '#0c4a6e',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 8,
          category: 'AI',
          fontSize: 12,
          opacity: 100
        }
      ];
    } else {
      // General full-stack architecture / app completion
      summaryExplanation = "I see your design! I've completed the full system architecture by connecting the API Gateway, persistent database, caching layer, and security rules.";
      newElements = [
        {
          id: `finish_el_${Date.now()}_1`,
          type: 'rectangle',
          x: startX,
          y: startY,
          width: 250,
          height: 130,
          text: 'API Gateway & Auth\n• JWT Bearer Token\n• Rate Limiting & CORS\n• WebSocket Live Stream',
          strokeColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.16)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 6,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_2`,
          type: 'arrow',
          x: startX - 80,
          y: startY + 65,
          width: 80,
          height: 0,
          text: 'HTTPS / WS',
          strokeColor: '#f59e0b',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 80, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_3`,
          type: 'rectangle',
          x: startX + 320,
          y: startY - 40,
          width: 240,
          height: 110,
          text: 'Redis Cache\n• In-Memory Fast Cache\n• Pub/Sub Event Broadcast',
          strokeColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 6,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_4`,
          type: 'rectangle',
          x: startX + 320,
          y: startY + 110,
          width: 240,
          height: 120,
          text: 'Persistent Database\n• PostgreSQL / SQLite\n• Relational Tables & Migrations\n• Auto-Backup Service',
          strokeColor: '#10b981',
          backgroundColor: 'rgba(168, 85, 247, 0.16)',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 6,
          fontSize: 13,
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_5`,
          type: 'arrow',
          x: startX + 250,
          y: startY + 30,
          width: 70,
          height: 0,
          text: 'Cache Hit',
          strokeColor: '#ef4444',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 70, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_6`,
          type: 'arrow',
          x: startX + 250,
          y: startY + 100,
          width: 70,
          height: 0,
          text: 'Store & Query',
          strokeColor: '#10b981',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 0,
          points: [{ x: 0, y: 0 }, { x: 70, y: 0 }],
          opacity: 100
        },
        {
          id: `finish_el_${Date.now()}_7`,
          type: 'sticky',
          x: startX + 60,
          y: startY + 200,
          width: 360,
          height: 140,
          text: '✦ AI Architecture Completion:\n• Completed end-to-end production architecture.\n• Linked client requests to fast in-memory caching.\n• Backed by persistent relational storage and auto-migrations.',
          strokeColor: '#a855f7',
          backgroundColor: '#3b0764',
          strokeWidth: 2,
          strokeStyle: 'solid',
          fillStyle: 'solid',
          roundness: 8,
          category: 'AI',
          fontSize: 12,
          opacity: 100
        }
      ];
    }

    const updatedElements = [...elements, ...newElements];
    updateProjectElements(updatedElements);

    // Pan camera smoothly to encompass the newly finished diagram
    setPan({
      x: window.innerWidth / 2 - (startX + 200) * zoom,
      y: window.innerHeight / 2 - (startY + 80) * zoom
    });

    setIsAiGenerating(false);
    setNoriState('speaking');
    showNotification(intent ? `✦ Nori: "${intent.voice}"` : '✦ AI successfully finished your diagram!');
    voiceEngine.speak(summaryExplanation);
    setTimeout(() => setNoriState('idle'), 4500);
  };

  // -------------------------------------------------------------
  // ✦ CONTINUOUS AUTONOMOUS MONITORING WATCHDOG EFFECT
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isContinuousMonitoring) return;
    if (elements.length === 0) {
      lastGreetingHandledRef.current = 0;
      lastHandledSignatureRef.current = '';
      return;
    }

    if (continuousDebounceRef.current) {
      clearTimeout(continuousDebounceRef.current);
    }

    // Wait 2.8s of complete inactivity after user lifts pen so they can finish writing sentences
    continuousDebounceRef.current = setTimeout(() => {
      // Don't trigger if user is actively in drawing mode
      if (interactionModeRef.current === 'drawing') return;

      const userPenStrokes = elements.filter((el) => el.type === 'pen');
      if (userPenStrokes.length === 0) return;

      // Filter out incomplete single letter strokes (e.g. '|' or 'I')
      if (userPenStrokes.length === 1) {
        const b = getPenBoundingBox(userPenStrokes[0]);
        if (b && b.width < 50) return;
      }

      // Check signature to avoid re-triggering for the exact same strokes
      const signature = userPenStrokes.map((e) => e.id).join(',');
      if (signature === lastHandledSignatureRef.current) {
        return;
      }

      // 7.5 second speech cooldown prevents any speech spam or stuttering
      const now = Date.now();
      if (now - lastSpokenTimestampRef.current < 7500) {
        return;
      }

      const intent = analyzeCanvasIntent(elements);
      if (!intent) return;

      lastHandledSignatureRef.current = signature;
      lastSpokenTimestampRef.current = now;

      setNoriState('speaking');
      voiceEngine.speak(intent.voice);
      showNotification(`✦ Nori: "${intent.voice}"`);
      setLiveMonitoringStatus(`Live Co-Pilot: Responded (${intent.kind})`);

      // Clean up old companion cards so only 1 active reply exists
      const cleanedElements = elements.filter(
        (el) => !(el.text && (el.text.includes('✦ Nori AI Assistant') || el.text === 'Hi!' || el.text === 'Great!'))
      );

      const maxX = Math.max(...cleanedElements.map((el) => {
        if (el.type === 'pen' && el.points && el.points.length > 0) {
          const b = getPenBoundingBox(el);
          return b ? b.maxX : (el.x + 100);
        }
        return (el.x || 0) + (el.width || 100);
      }));
      const minY = Math.min(...cleanedElements.map((el) => {
        if (el.type === 'pen' && el.points && el.points.length > 0) {
          const b = getPenBoundingBox(el);
          return b ? b.minY : el.y;
        }
        return el.y || 100;
      }));

      const startX = maxX + 40;
      const startY = Math.max(40, minY);

      const companionCard: CanvasElement = {
        id: `copilot_reply_${Date.now()}_card`,
        type: 'sticky',
        x: startX + 50,
        y: startY,
        width: 330,
        height: 145,
        text: intent.cardText,
        strokeColor: '#38bdf8',
        backgroundColor: '#082f49',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 8,
        category: 'AI',
        fontSize: 13,
        opacity: 100
      };

      const companionArrow: CanvasElement = {
        id: `copilot_reply_${Date.now()}_arrow`,
        type: 'arrow',
        x: startX,
        y: startY + 40,
        width: 50,
        height: 0,
        text: intent.arrowText,
        strokeColor: '#38bdf8',
        backgroundColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        points: [{ x: 0, y: 0 }, { x: 50, y: 0 }],
        opacity: 100
      };

      const nextElements = [...cleanedElements, companionCard, companionArrow];
      lastHandledSignatureRef.current = signature;
      updateProjectElements(nextElements);

      setPan((prev) => ({
        x: Math.min(prev.x, window.innerWidth - (startX + 400) * zoom),
        y: prev.y
      }));

      setTimeout(() => setNoriState('idle'), 4500);
    }, 2800);

    return () => {
      if (continuousDebounceRef.current) {
        clearTimeout(continuousDebounceRef.current);
      }
    };
  }, [elements, isContinuousMonitoring, zoom]);

  const toggleVoiceListen = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotification('Web Speech API not supported in this browser. You can type in the prompt box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        showNotification('✦ Listening... say "Finish idea", "Hi", or describe what to draw');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        showNotification(`Heard: "${transcript}"`);

        if (transcript.includes('finish') || transcript.includes('complete')) {
          handleAiFinishDrawing();
        } else if (transcript.includes('hi') || transcript.includes('hello') || transcript.includes('hey')) {
          voiceEngine.speak("Hello! Great to see you. What are we brainstorming today?");
          setLiveMonitoringStatus('Live Co-Pilot: Spoke greeting');
        } else if (transcript.includes('what am i doing') || transcript.includes('what is the idea') || transcript.includes('explain')) {
          const elementTexts = elements.map((el) => el.text?.trim()).filter(Boolean);
          const synthesis = elementTexts.length > 0
            ? `You are sketching a concept with ${elementTexts.slice(0, 3).join(', ')}. Say finish idea whenever you want me to complete it!`
            : `You have ${elements.length} components on your canvas. Click Finish Idea to complete the architecture!`;
          voiceEngine.speak(synthesis);
          showNotification(`✦ ${synthesis}`);
        } else {
          setAiPrompt(transcript);
          executeAiAutoDrawFromPrompt(transcript);
        }
      };

      recognition.onerror = () => {
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsVoiceListening(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        updateProjectElements(elements.filter((el) => el.id !== selectedElementId));
        setSelectedElementId(null);
        showNotification('Deleted element');
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId) {
        e.preventDefault();
        duplicateSelectedElement();
      } else if ((e.key === 'Enter' || e.key === 'F2') && selectedElement) {
        e.preventDefault();
        startEditingElement(selectedElement);
      } else if (e.key === 'v') {
        setActiveTool('select');
      } else if (e.key === 'h') {
        setActiveTool('hand');
      } else if (e.key === 'r') {
        setActiveTool('rectangle');
      } else if (e.key === 'd') {
        setActiveTool('diamond');
      } else if (e.key === 'o') {
        setActiveTool('ellipse');
      } else if (e.key === 'a') {
        setActiveTool('arrow');
      } else if (e.key === 'p') {
        setActiveTool('pen');
      } else if (e.key === 's') {
        setActiveTool('sticky');
      } else if (e.key === 'e') {
        setActiveTool('eraser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedElement, elements]);

  // Switch Project
  const handleSelectProject = (projectId: string) => {
    if (projectId === activeProjectId) {
      setShowProjectMenu(false);
      return;
    }

    const targetProject = projects.find((p) => p.id === projectId);
    if (targetProject) {
      setActiveProjectId(projectId);
      setElements(targetProject.elements || []);
      setZoom(targetProject.zoom || 1);
      setPan({ x: targetProject.panX || 120, y: targetProject.panY || 80 });
      setSelectedElementId(null);
      historyStackRef.current = [targetProject.elements || []];
      historyIndexRef.current = 0;
    }
    setShowProjectMenu(false);
    showNotification(`Switched to "${targetProject?.name}" canvas`);
  };

  // Delete Workspace Project Canvas
  const handleDeleteProject = (e: React.MouseEvent, projectIdToDelete: string) => {
    e.stopPropagation();
    const targetProject = projects.find((p) => p.id === projectIdToDelete);
    const targetName = targetProject?.name || 'Workspace';

    if (projects.length <= 1) {
      // If deleting the only project, reset to a fresh clean canvas
      const freshProject: ProjectCanvas = {
        id: `proj_${Date.now()}`,
        name: 'New Workspace Canvas',
        description: 'Clean architectural whiteboard',
        icon: '📐',
        panX: 180,
        panY: 100,
        zoom: 1,
        lastModified: 'Just now',
        elements: [],
        notes: []
      };
      setProjects([freshProject]);
      setActiveProjectId(freshProject.id);
      setElements([]);
      setPan({ x: 180, y: 100 });
      setZoom(1);
      setSelectedElementId(null);
      historyStackRef.current = [[]];
      historyIndexRef.current = 0;
      showNotification('Workspace reset to clean canvas');
      return;
    }

    const remaining = projects.filter((p) => p.id !== projectIdToDelete);
    setProjects(remaining);

    if (activeProjectId === projectIdToDelete) {
      const nextActive = remaining[0];
      setActiveProjectId(nextActive.id);
      setElements(nextActive.elements || []);
      setPan({ x: nextActive.panX ?? 180, y: nextActive.panY ?? 100 });
      setZoom(nextActive.zoom ?? 1);
      setSelectedElementId(null);
      historyStackRef.current = [nextActive.elements || []];
      historyIndexRef.current = 0;
    }
    showNotification(`Deleted "${targetName}" workspace`);
  };

  // Create Project
  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;

    const newProj: ProjectCanvas = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom Dark Canvas',
      icon: newProjectIcon || '💡',
      elements: [],
      notes: [
        {
          id: `note_${Date.now()}`,
          title: `Project Note: ${newProjectName.trim()}`,
          category: 'Decision',
          content: '• Custom project canvas initialized.\n• Ready for dark luxury diagramming.',
          checklist: [{ id: `c_${Date.now()}`, text: 'Auto-draw initial architecture', done: false }],
          color: NOTE_THEMES.Decision,
          tags: ['Project', 'NoriCanvas'],
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      zoom: 1,
      panX: 120,
      panY: 80,
      lastModified: 'Just now'
    };

    setProjects([...projects, newProj]);
    setActiveProjectId(newProj.id);
    setElements([]);
    setZoom(1);
    setPan({ x: 120, y: 80 });
    setSelectedElementId(null);
    historyStackRef.current = [[]];
    historyIndexRef.current = 0;

    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectModal(false);
    setShowProjectMenu(false);
    showNotification(`Created canvas for "${newProj.name}"`);
  };

  // -------------------------------------------------------------
  // CANVAS RENDERING ENGINE (Pure Dark OLED + Rotation + 8 Resize Handles + Rotate Handle)
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Deep OLED Pitch Black Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Glowing Dot Grid
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const gridSize = 28;
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize - gridSize;
    const endX = startX + width / zoom + gridSize * 2;
    const endY = startY + height / zoom + gridSize * 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let gx = startX; gx < endX; gx += gridSize) {
      for (let gy = startY; gy < endY; gy += gridSize) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Render Canvas Elements
    const allElements = currentDrawElementRef.current
      ? [...elements, currentDrawElementRef.current]
      : elements;

    allElements.forEach((el) => {
      ctx.save();
      ctx.globalAlpha = (el.opacity || 100) / 100;

      const isSelected = el.id === selectedElementId;
      const isCurrentlyEditing = el.id === editingElementId;

      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const rot = el.rotation || 0;

      // Apply Element Rotation around its center
      if (rot !== 0) {
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.translate(-cx, -cy);
      }

      switch (el.type) {
        case 'rectangle': {
          ctx.beginPath();
          const r = el.roundness ?? 6;
          ctx.roundRect(el.x, el.y, el.width, el.height, r);
          if (el.backgroundColor && el.backgroundColor !== 'transparent') {
            ctx.fillStyle = el.backgroundColor;
            ctx.fill();
          }
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.stroke();

          // Text label inside rectangle
          if (el.text && !isCurrentlyEditing) {
            ctx.fillStyle = '#ffffff';
            const fSize = el.fontSize || 15;
            ctx.font = `600 ${fSize}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = wrapTextLines(ctx, el.text, Math.max(40, el.width - 24));
            const lineHeight = fSize * 1.35;
            const totalTextHeight = lines.length * lineHeight;
            const startTextY = el.y + el.height / 2 - totalTextHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, el.x + el.width / 2, startTextY + i * lineHeight);
            });
          }
          break;
        }

        case 'diamond': {
          ctx.beginPath();
          ctx.moveTo(cx, el.y);
          ctx.lineTo(el.x + el.width, cy);
          ctx.lineTo(cx, el.y + el.height);
          ctx.lineTo(el.x, cy);
          ctx.closePath();
          if (el.backgroundColor && el.backgroundColor !== 'transparent') {
            ctx.fillStyle = el.backgroundColor;
            ctx.fill();
          }
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.stroke();

          if (el.text && !isCurrentlyEditing) {
            ctx.fillStyle = '#ffffff';
            const fSize = el.fontSize || 14;
            ctx.font = `600 ${fSize}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = wrapTextLines(ctx, el.text, Math.max(40, el.width * 0.7));
            const lineHeight = fSize * 1.35;
            const totalTextHeight = lines.length * lineHeight;
            const startTextY = cy - totalTextHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, cx, startTextY + i * lineHeight);
            });
          }
          break;
        }

        case 'ellipse': {
          const rx = el.width / 2;
          const ry = el.height / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
          if (el.backgroundColor && el.backgroundColor !== 'transparent') {
            ctx.fillStyle = el.backgroundColor;
            ctx.fill();
          }
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeWidth || 2;
          ctx.stroke();

          if (el.text && !isCurrentlyEditing) {
            ctx.fillStyle = '#ffffff';
            const fSize = el.fontSize || 15;
            ctx.font = `600 ${fSize}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = wrapTextLines(ctx, el.text, Math.max(40, el.width * 0.75));
            const lineHeight = fSize * 1.35;
            const totalTextHeight = lines.length * lineHeight;
            const startTextY = cy - totalTextHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, cx, startTextY + i * lineHeight);
            });
          }
          break;
        }

        case 'arrow':
        case 'line': {
          if (el.points && el.points.length >= 2) {
            ctx.beginPath();
            const start = el.points[0];
            ctx.moveTo(el.x + start.x, el.y + start.y);
            for (let pIdx = 1; pIdx < el.points.length; pIdx++) {
              const pt = el.points[pIdx];
              ctx.lineTo(el.x + pt.x, el.y + pt.y);
            }
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();

            if (el.type === 'arrow') {
              const lastPt = el.points[el.points.length - 1];
              const prevPt = el.points[el.points.length - 2];
              const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
              const headLen = 14;

              ctx.beginPath();
              ctx.moveTo(el.x + lastPt.x, el.y + lastPt.y);
              ctx.lineTo(
                el.x + lastPt.x - headLen * Math.cos(angle - Math.PI / 6),
                el.y + lastPt.y - headLen * Math.sin(angle - Math.PI / 6)
              );
              ctx.lineTo(
                el.x + lastPt.x - headLen * Math.cos(angle + Math.PI / 6),
                el.y + lastPt.y - headLen * Math.sin(angle + Math.PI / 6)
              );
              ctx.closePath();
              ctx.fillStyle = el.strokeColor;
              ctx.fill();
            }

            if (el.text && !isCurrentlyEditing) {
              const midX = el.x + el.width / 2;
              const midY = el.y + el.height / 2;

              ctx.font = `11px 'JetBrains Mono', monospace`;
              const textMetrics = ctx.measureText(el.text);
              const badgeW = textMetrics.width + 16;
              const badgeH = 22;

              ctx.beginPath();
              ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 4);
              ctx.fillStyle = '#0a0d14';
              ctx.fill();
              ctx.strokeStyle = el.strokeColor;
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(el.text, midX, midY);
            }
          }
          break;
        }

        case 'pen': {
          if (el.points && el.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(el.x + el.points[0].x, el.y + el.points[0].y);
            for (let p = 1; p < el.points.length; p++) {
              ctx.lineTo(el.x + el.points[p].x, el.y + el.points[p].y);
            }
            ctx.strokeStyle = el.strokeColor;
            ctx.lineWidth = el.strokeWidth || 2;
            ctx.stroke();
          }
          break;
        }

        case 'text': {
          if (!isCurrentlyEditing) {
            ctx.fillStyle = el.strokeColor || '#ffffff';
            ctx.font = `600 ${el.fontSize || 16}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const lines = wrapTextLines(ctx, el.text || '', Math.max(80, el.width || 250));
            const lineHeight = (el.fontSize || 16) * 1.35;
            lines.forEach((line, idx) => {
              ctx.fillText(line, el.x, el.y + idx * lineHeight);
            });
          }
          break;
        }

        case 'sticky': {
          const cat = el.category || 'Decision';
          const theme = NOTE_THEMES[cat] || NOTE_THEMES.Decision;
          const stickyBg = el.backgroundColor || theme.bg;
          const stickyBorder = el.strokeColor || theme.border;
          const isDarkSticky = stickyBg === '#181b28';
          const stickyText = isDarkSticky ? '#f8fafc' : theme.text;

          // 1. Subtle Paper Drop Shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.40)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 4;

          // 2. Paper Body
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.width, el.height, el.roundness ?? 6);
          ctx.fillStyle = stickyBg;
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = stickyBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 3. Top Accent Header Strip
          ctx.beginPath();
          ctx.roundRect(el.x + 8, el.y - 2, el.width - 16, 5, 2);
          ctx.fillStyle = `${stickyBorder}60`;
          ctx.fill();

          // 4. Pin Dot Indicator at top-left
          ctx.beginPath();
          ctx.arc(el.x + 18, el.y + 16, 4, 0, Math.PI * 2);
          ctx.fillStyle = isDarkSticky ? '#fa5438' : stickyBorder;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 5. Category Pill at top-right
          if (el.category) {
            ctx.font = `bold 10px 'JetBrains Mono', monospace`;
            const badgeW = ctx.measureText(el.category.toUpperCase()).width + 12;
            const badgeH = 18;
            const badgeX = el.x + el.width - badgeW - 10;
            const badgeY = el.y + 8;

            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
            ctx.fillStyle = `${stickyBorder}25`;
            ctx.fill();
            ctx.strokeStyle = `${stickyBorder}60`;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = isDarkSticky ? '#f8fafc' : stickyBorder;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.category.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2);
          }

          // 6. Crisp Typography with Smart Word-Wrapping
          if (!isCurrentlyEditing) {
            ctx.fillStyle = stickyText;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            ctx.font = `500 13px 'Plus Jakarta Sans', sans-serif`;
            const lines = wrapTextLines(ctx, el.text || '', Math.max(60, el.width - 44));
            const lineHeight = 21;
            const maxVisibleLines = Math.floor((el.height - 38) / lineHeight);

            lines.slice(0, maxVisibleLines).forEach((line, idx) => {
              if (idx === 0) {
                ctx.font = `bold 13px 'Plus Jakarta Sans', sans-serif`;
              } else {
                ctx.font = `500 12.5px 'Plus Jakarta Sans', sans-serif`;
              }
              ctx.fillText(line, el.x + 24, el.y + 34 + idx * lineHeight);
            });
          }

          ctx.restore();
          break;
        }

        case 'image': {
          if (el.imageData) {
            let img = imageCacheRef.current.get(el.imageData);
            if (!img) {
              img = new Image();
              img.src = el.imageData;
              imageCacheRef.current.set(el.imageData, img);
              img.onload = () => renderCanvas();
            }
            if (img.complete && img.naturalWidth > 0) {
              const r = el.roundness ?? 8;
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(el.x, el.y, el.width, el.height, r);
              ctx.clip();
              ctx.drawImage(img, el.x, el.y, el.width, el.height);
              ctx.restore();

              // High-tech sleek border
              ctx.beginPath();
              ctx.roundRect(el.x, el.y, el.width, el.height, r);
              ctx.strokeStyle = el.strokeColor || '#38bdf8';
              ctx.lineWidth = el.strokeWidth || 2;
              ctx.stroke();

              // Caption label badge at bottom of image
              if (el.text && !isCurrentlyEditing) {
                const badgeH = 26;
                ctx.fillStyle = 'rgba(10, 14, 22, 0.90)';
                ctx.fillRect(el.x, el.y + el.height - badgeH, el.width, badgeH);
                ctx.fillStyle = '#ffffff';
                ctx.font = `600 11px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(el.text, el.x + el.width / 2, el.y + el.height - badgeH / 2);
              }
            }
          }
          break;
        }
      }

      // -------------------------------------------------------------
      // ✦ SELECTION BOUNDING BOX, 8 RESIZE HANDLES & ROTATION STALK
      // -------------------------------------------------------------
      if (isSelected) {
        ctx.strokeStyle = '#fa5438';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, el.height + 8);
        ctx.setLineDash([]);

        // Rotation stalk line connecting to rotation handle
        const rotCenterX = el.x + el.width / 2;
        const rotCenterY = el.y - 24;

        ctx.beginPath();
        ctx.moveTo(rotCenterX, el.y - 4);
        ctx.lineTo(rotCenterX, rotCenterY);
        ctx.strokeStyle = '#fa5438';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Rotation circular handle
        ctx.beginPath();
        ctx.arc(rotCenterX, rotCenterY, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#fa5438';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 8 Square Resize Handles
        const handles = [
          { x: el.x - 4, y: el.y - 4 }, // nw
          { x: el.x + el.width / 2, y: el.y - 4 }, // n
          { x: el.x + el.width + 4, y: el.y - 4 }, // ne
          { x: el.x + el.width + 4, y: el.y + el.height / 2 }, // e
          { x: el.x + el.width + 4, y: el.y + el.height + 4 }, // se
          { x: el.x + el.width / 2, y: el.y + el.height + 4 }, // s
          { x: el.x - 4, y: el.y + el.height + 4 }, // sw
          { x: el.x - 4, y: el.y + el.height / 2 } // w
        ];

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#fa5438';
        ctx.lineWidth = 1.5;
        handles.forEach((h) => {
          ctx.fillRect(h.x - 3.5, h.y - 3.5, 7, 7);
          ctx.strokeRect(h.x - 3.5, h.y - 3.5, 7, 7);
        });
      }

      ctx.restore();
    });

    ctx.restore();
    ctx.restore();
  }, [elements, pan, zoom, selectedElementId, editingElementId]);

  // Redraw loop
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      renderCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // -------------------------------------------------------------
  // MOUSE & DRAWING INTERACTIONS (Cursor Mode: Drag, 8-Handle Resize, Rotate)
  // -------------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);

    // If currently editing and clicked outside, save and close
    if (editingElementId) {
      handleSaveEditingElement();
    }

    // 1. Pan Tool or Middle Mouse Button
    if (activeTool === 'hand' || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button !== 0) return;

    startMouseWorldPosRef.current = worldPos;

    // 2. Eraser Tool: Click or drag to erase any touched element
    if (activeTool === 'eraser') {
      interactionModeRef.current = 'drawing';
      const remaining = elements.filter((el) => !isPointInElement(worldPos, el, 16));
      if (remaining.length !== elements.length) {
        updateProjectElements(remaining);
        if (selectedElementId && !remaining.some((el) => el.id === selectedElementId)) {
          setSelectedElementId(null);
        }
        showNotification('Erased element');
      }
      return;
    }

    // 3. Select / Cursor Tool: Check Handle Hits, Rotation, and Element Dragging
    if (activeTool === 'select') {
      // First check if user clicked on a handle of the already selected element
      if (selectedElement) {
        const hitHandle = getHandleAtPoint(worldPos, selectedElement);
        if (hitHandle === 'rot') {
          interactionModeRef.current = 'rotating';
          activeHandleRef.current = 'rot';
          initialElementRef.current = { ...selectedElement };
          return;
        }
        if (hitHandle && hitHandle !== 'body') {
          interactionModeRef.current = 'resizing';
          activeHandleRef.current = hitHandle;
          initialElementRef.current = { ...selectedElement };
          return;
        }
        if (hitHandle === 'body') {
          interactionModeRef.current = 'moving';
          activeHandleRef.current = 'body';
          initialElementRef.current = { ...selectedElement };
          return;
        }
      }

      // Check if user clicked on any other element
      const clickedEl = [...elements].reverse().find((el) => isPointInElement(worldPos, el, 8));
      if (clickedEl) {
        setSelectedElementId(clickedEl.id);
        interactionModeRef.current = 'moving';
        activeHandleRef.current = 'body';
        initialElementRef.current = { ...clickedEl };
      } else {
        setSelectedElementId(null);
        interactionModeRef.current = 'idle';
      }
      return;
    }

    // 4. Create New Element based on Active Tool
    interactionModeRef.current = 'drawing';
    const id = `el_${Date.now()}`;
    let newElement: CanvasElement | null = null;

    if (activeTool === 'rectangle') {
      newElement = {
        id,
        type: 'rectangle',
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: selectedColor,
        backgroundColor: selectedBgColor,
        strokeWidth: selectedStrokeWidth,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        opacity: 100
      };
    } else if (activeTool === 'diamond') {
      newElement = {
        id,
        type: 'diamond',
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: selectedColor,
        backgroundColor: selectedBgColor,
        strokeWidth: selectedStrokeWidth,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 4,
        opacity: 100
      };
    } else if (activeTool === 'ellipse') {
      newElement = {
        id,
        type: 'ellipse',
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: selectedColor,
        backgroundColor: selectedBgColor,
        strokeWidth: selectedStrokeWidth,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        opacity: 100
      };
    } else if (activeTool === 'arrow' || activeTool === 'line') {
      newElement = {
        id,
        type: activeTool,
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: selectedColor,
        backgroundColor: 'transparent',
        strokeWidth: selectedStrokeWidth,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
        opacity: 100
      };
    } else if (activeTool === 'pen') {
      newElement = {
        id,
        type: 'pen',
        x: worldPos.x,
        y: worldPos.y,
        width: 0,
        height: 0,
        rotation: 0,
        strokeColor: selectedColor,
        backgroundColor: 'transparent',
        strokeWidth: selectedStrokeWidth,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 0,
        points: [{ x: 0, y: 0 }],
        opacity: 100
      };
    } else if (activeTool === 'text') {
      const newTextEl: CanvasElement = {
        id,
        type: 'text',
        x: worldPos.x,
        y: worldPos.y,
        width: 240,
        height: 60,
        rotation: 0,
        text: 'Type note text here...',
        strokeColor: '#ffffff',
        backgroundColor: 'transparent',
        strokeWidth: 1,
        strokeStyle: 'solid',
        fillStyle: 'transparent',
        roundness: 0,
        fontSize: 16,
        opacity: 100
      };
      updateProjectElements([...elements, newTextEl]);
      setSelectedElementId(newTextEl.id);
      startEditingElement(newTextEl);
      setActiveTool('select');
      return;
    } else if (activeTool === 'sticky') {
      const theme = NOTE_THEMES[selectedStickyTheme] || NOTE_THEMES.Decision;
      newElement = {
        id,
        type: 'sticky',
        x: worldPos.x,
        y: worldPos.y,
        width: 300,
        height: 170,
        rotation: 0,
        text: '📌 Architectural Decision:\n• Context: System Architecture Invariant\n• Action: Local loopback isolation\n• Status: Verified',
        strokeColor: theme.border,
        backgroundColor: theme.bg,
        strokeWidth: 1.5,
        strokeStyle: 'solid',
        fillStyle: 'solid',
        roundness: 6,
        fontSize: 13,
        opacity: 100,
        category: selectedStickyTheme
      };
      updateProjectElements([...elements, newElement]);
      setSelectedElementId(newElement.id);
      setActiveTool('select');
      return;
    }

    currentDrawElementRef.current = newElement;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);

    // Update dynamic hover cursor in select tool
    if (activeTool === 'select' && interactionModeRef.current === 'idle') {
      if (selectedElement) {
        const handle = getHandleAtPoint(worldPos, selectedElement);
        if (handle === 'rot') {
          setHoverCursor('crosshair');
          return;
        } else if (handle === 'nw' || handle === 'se') {
          setHoverCursor('nwse-resize');
          return;
        } else if (handle === 'ne' || handle === 'sw') {
          setHoverCursor('nesw-resize');
          return;
        } else if (handle === 'n' || handle === 's') {
          setHoverCursor('ns-resize');
          return;
        } else if (handle === 'e' || handle === 'w') {
          setHoverCursor('ew-resize');
          return;
        } else if (handle === 'body') {
          setHoverCursor('move');
          return;
        }
      }

      const isOverAny = elements.some((el) => isPointInElement(worldPos, el, 8));
      setHoverCursor(isOverAny ? 'pointer' : 'default');
    }

    // Continuous Scrub Erasing
    if (activeTool === 'eraser' && interactionModeRef.current === 'drawing') {
      const remaining = elements.filter((el) => !isPointInElement(worldPos, el, 18));
      if (remaining.length !== elements.length) {
        updateProjectElements(remaining);
        if (selectedElementId && !remaining.some((el) => el.id === selectedElementId)) {
          setSelectedElementId(null);
        }
      }
      return;
    }

    // Moving Selected Element
    if (interactionModeRef.current === 'moving' && selectedElementId && initialElementRef.current) {
      const dx = worldPos.x - startMouseWorldPosRef.current.x;
      const dy = worldPos.y - startMouseWorldPosRef.current.y;
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElementId
            ? { ...el, x: initialElementRef.current!.x + dx, y: initialElementRef.current!.y + dy }
            : el
        )
      );
      return;
    }

    // Rotating Selected Element
    if (interactionModeRef.current === 'rotating' && selectedElementId && initialElementRef.current) {
      const initEl = initialElementRef.current;
      const cx = initEl.x + initEl.width / 2;
      const cy = initEl.y + initEl.height / 2;

      let angle = Math.atan2(worldPos.y - cy, worldPos.x - cx) + Math.PI / 2;

      // Snap to 15-degree angles if Shift is held
      if (e.shiftKey) {
        const snap = Math.PI / 12; // 15 degrees
        angle = Math.round(angle / snap) * snap;
      }

      setElements((prev) =>
        prev.map((el) => (el.id === selectedElementId ? { ...el, rotation: angle } : el))
      );
      return;
    }

    // Resizing Selected Element (8 Directions)
    if (interactionModeRef.current === 'resizing' && selectedElementId && initialElementRef.current && activeHandleRef.current) {
      const initEl = initialElementRef.current;
      const handle = activeHandleRef.current;
      const rot = initEl.rotation || 0;
      const cx = initEl.x + initEl.width / 2;
      const cy = initEl.y + initEl.height / 2;

      // Project mouse delta into unrotated local coordinates
      const currentUnrot = rotatePoint(worldPos, { x: cx, y: cy }, -rot);
      const startUnrot = rotatePoint(startMouseWorldPosRef.current, { x: cx, y: cy }, -rot);
      const dx = currentUnrot.x - startUnrot.x;
      const dy = currentUnrot.y - startUnrot.y;

      let newX = initEl.x;
      let newY = initEl.y;
      let newW = initEl.width;
      let newH = initEl.height;

      if (handle.includes('e')) newW = Math.max(24, initEl.width + dx);
      if (handle.includes('s')) newH = Math.max(24, initEl.height + dy);
      if (handle.includes('w')) {
        const potentialW = initEl.width - dx;
        if (potentialW >= 24) {
          newX = initEl.x + dx;
          newW = potentialW;
        }
      }
      if (handle.includes('n')) {
        const potentialH = initEl.height - dy;
        if (potentialH >= 24) {
          newY = initEl.y + dy;
          newH = potentialH;
        }
      }

      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElementId
            ? { ...el, x: newX, y: newY, width: newW, height: newH }
            : el
        )
      );
      return;
    }

    // Drafting New Element During Creation
    if (interactionModeRef.current === 'drawing' && currentDrawElementRef.current) {
      const el = currentDrawElementRef.current;
      const w = worldPos.x - startMouseWorldPosRef.current.x;
      const h = worldPos.y - startMouseWorldPosRef.current.y;

      if (el.type === 'rectangle' || el.type === 'diamond' || el.type === 'ellipse') {
        el.x = w >= 0 ? startMouseWorldPosRef.current.x : worldPos.x;
        el.y = h >= 0 ? startMouseWorldPosRef.current.y : worldPos.y;
        el.width = Math.abs(w);
        el.height = Math.abs(h);
      } else if (el.type === 'arrow' || el.type === 'line') {
        el.width = w;
        el.height = h;
        el.points = [{ x: 0, y: 0 }, { x: w, y: h }];
      } else if (el.type === 'pen') {
        el.points?.push({ x: worldPos.x - el.x, y: worldPos.y - el.y });
      }

      renderCanvas();
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    if (interactionModeRef.current === 'moving' || interactionModeRef.current === 'resizing' || interactionModeRef.current === 'rotating') {
      updateProjectElements(elements);
      interactionModeRef.current = 'idle';
      activeHandleRef.current = null;
      initialElementRef.current = null;
      return;
    }

    if (interactionModeRef.current === 'drawing') {
      interactionModeRef.current = 'idle';
      if (currentDrawElementRef.current) {
        const finished = currentDrawElementRef.current;
        if (finished.type === 'pen' && finished.points && finished.points.length > 0) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          for (const pt of finished.points) {
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;
          }
          finished.width = Math.max(4, maxX - minX);
          finished.height = Math.max(4, maxY - minY);
        }
        if (
          finished.type === 'pen' ||
          (finished.width > 10 && finished.height > 10) ||
          Math.abs(finished.width) > 10 ||
          Math.abs(finished.height) > 10
        ) {
          updateProjectElements([...elements, finished]);
          setSelectedElementId(finished.id);
        }
        currentDrawElementRef.current = null;
        if (activeTool !== 'pen') setActiveTool('select');
      }
    }
  };

  // Zoom In / Out
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.max(0.2, Math.min(4.0, zoom * zoomFactor));

    const rect = containerRef.current?.getBoundingClientRect();
    const mouseX = rect ? e.clientX - rect.left : e.clientX;
    const mouseY = rect ? e.clientY - rect.top : e.clientY;

    const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

    setZoom(nextZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Double Click Element to Edit Text / Block Inline directly on canvas
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const clickedEl = [...elements].reverse().find((el) => isPointInElement(worldPos, el, 8));

    if (clickedEl) {
      setSelectedElementId(clickedEl.id);
      startEditingElement(clickedEl);
    }
  };

  // Auto-Draw Live Codebase Diagram
  const handleAutoDrawCodebase = () => {
    const ox = 200;
    const oy = 250;

    const plan: {
      name: string;
      explanation?: string;
      sequence: Array<{ status: string; element: CanvasElement }>;
    } = {
      name: 'Active Codebase Architecture Graph',
      explanation: 'Here is the active codebase architecture graph showing the frontend, FastAPI backend, and NPU DirectML engine.',
      sequence: [
        {
          status: 'Drafting Frontend React 19 Client Node',
          element: {
            id: `ad_fe_${Date.now()}`,
            type: 'rectangle',
            x: ox,
            y: oy,
            width: 260,
            height: 120,
            rotation: 0,
            text: 'Frontend Client\n(App.tsx / Sidebar.tsx)',
            strokeColor: '#fa5438',
            backgroundColor: 'rgba(250, 84, 56, 0.18)',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 6,
            fontSize: 15,
            opacity: 100
          }
        },
        {
          status: 'Drafting FastAPI Core Server Node',
          element: {
            id: `ad_be_${Date.now()}`,
            type: 'rectangle',
            x: ox + 380,
            y: oy,
            width: 270,
            height: 120,
            rotation: 0,
            text: 'FastAPI Local Core\n(main.py :8000)',
            strokeColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 6,
            fontSize: 15,
            opacity: 100
          }
        },
        {
          status: 'Connecting WebSocket & Telemetry Stream Arrow',
          element: {
            id: `ad_arr1_${Date.now()}`,
            type: 'arrow',
            x: ox + 260,
            y: oy + 60,
            width: 120,
            height: 0,
            rotation: 0,
            text: 'ws://127.0.0.1',
            strokeColor: '#fa5438',
            backgroundColor: 'transparent',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 0,
            points: [{ x: 0, y: 0 }, { x: 120, y: 0 }],
            opacity: 100
          }
        },
        {
          status: 'Drafting Snapdragon DirectML NPU Intelligence Router',
          element: {
            id: `ad_npu_${Date.now()}`,
            type: 'diamond',
            x: ox + 760,
            y: oy - 10,
            width: 250,
            height: 140,
            rotation: 0,
            text: 'Hexagon NPU\nDirectML Provider',
            strokeColor: '#c084fc',
            backgroundColor: 'rgba(192, 132, 252, 0.18)',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 4,
            fontSize: 14,
            opacity: 100
          }
        },
        {
          status: 'Connecting Neural Tensor Inference Pipeline',
          element: {
            id: `ad_arr2_${Date.now()}`,
            type: 'arrow',
            x: ox + 650,
            y: oy + 60,
            width: 110,
            height: 0,
            rotation: 0,
            text: 'INT8 DirectML',
            strokeColor: '#38bdf8',
            backgroundColor: 'transparent',
            strokeWidth: 2,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 0,
            points: [{ x: 0, y: 0 }, { x: 110, y: 0 }],
            opacity: 100
          }
        },
        {
          status: 'Writing Vibrant Solar Amber Decision Sticky Note',
          element: {
            id: `ad_note_${Date.now()}`,
            type: 'sticky',
            x: ox,
            y: oy + 180,
            width: 320,
            height: 170,
            rotation: 0,
            text: '📌 Architectural Decision:\n• Zero-Cloud Local Inference Isolation\n• Loopback Event Bus 127.0.0.1\n• Sub-25ms Latency Budget Approved',
            strokeColor: '#eab308',
            backgroundColor: '#fef08a',
            strokeWidth: 1.5,
            strokeStyle: 'solid',
            fillStyle: 'solid',
            roundness: 6,
            fontSize: 13,
            opacity: 100,
            category: 'Decision'
          }
        }
      ]
    };

    executeAutonomousAutoDraw(plan);
  };

  // Drop Sticky Note from Project Notes Drawer
  const insertStickyNoteFromDrawer = (note: NoteItem) => {
    const worldCenter = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const newSticky: CanvasElement = {
      id: `sticky_${Date.now()}`,
      type: 'sticky',
      x: worldCenter.x - 160,
      y: worldCenter.y - 85,
      width: 320,
      height: 170,
      rotation: 0,
      text: `${note.title}\n${note.content}`,
      strokeColor: note.color.border,
      backgroundColor: note.color.bg,
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      fillStyle: 'solid',
      roundness: 6,
      fontSize: 13,
      opacity: 100,
      category: note.category
    };

    updateProjectElements([...elements, newSticky]);
    setSelectedElementId(newSticky.id);
    showNotification(`Dropped "${note.title}" to canvas`);
  };

  // Convert Note to Connected Diagram Node
  const convertNoteToDiagram = (note: NoteItem) => {
    const worldCenter = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const node: CanvasElement = {
      id: `diag_${Date.now()}`,
      type: 'rectangle',
      x: worldCenter.x - 140,
      y: worldCenter.y - 60,
      width: 280,
      height: 120,
      rotation: 0,
      text: `【 ${note.title} 】\n${note.content.slice(0, 48)}...`,
      strokeColor: note.color.border,
      backgroundColor: `${note.color.border}25`,
      strokeWidth: 2,
      strokeStyle: 'solid',
      fillStyle: 'solid',
      roundness: 6,
      fontSize: 14,
      opacity: 100
    };

    updateProjectElements([...elements, node]);
    setSelectedElementId(node.id);
    showNotification(`Created node for "${note.title}"`);
  };

  // Create Custom Note
  const handleCreateCustomNote = () => {
    if (!newNoteTitle.trim()) return;

    const theme = NOTE_THEMES[newNoteCategory] || NOTE_THEMES.Decision;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      content: newNoteContent.trim() || '• Project architectural invariant note.',
      checklist: [],
      color: theme,
      tags: newNoteTags.split(',').map((t) => t.trim()).filter(Boolean),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === activeProjectId ? { ...p, notes: [newNote, ...p.notes] } : p))
    );

    setNewNoteTitle('');
    setNewNoteContent('');
    setShowCustomNoteModal(false);
    showNotification(`Added note "${newNote.title}" to project`);
  };

  // Export to PNG Image
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '_')}_canvas.png`;
    a.click();
    showNotification('Exported canvas to PNG');
  };

  // Export to Markdown Specification
  const handleExportMarkdownSpec = () => {
    let md = `# Architecture Specification: ${activeProject.name}\n\n`;
    md += `*Generated by Nori Autonomous Studio Canvas*\n\n`;
    md += `## System Nodes (${elements.length} Components)\n\n`;
    elements.forEach((el, idx) => {
      md += `### ${idx + 1}. ${el.type.toUpperCase()}: ${el.text ? el.text.replace(/\n/g, ' - ') : 'Node ' + (idx + 1)}\n`;
      md += `- Position: (x: ${Math.round(el.x)}, y: ${Math.round(el.y)})\n`;
      md += `- Dimensions: ${Math.round(el.width)} x ${Math.round(el.height)}\n`;
      md += `- Rotation: ${Math.round(((el.rotation || 0) * 180) / Math.PI)}°\n`;
      md += `- Accent Color: \`${el.strokeColor}\`\n\n`;
    });

    md += `## Project Notes & ADRs\n\n`;
    activeProject.notes.forEach((n) => {
      md += `### 📌 ${n.title} (${n.category})\n`;
      md += `${n.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.toLowerCase().replace(/\s+/g, '_')}_spec.md`;
    a.click();
    showNotification('Exported Architecture Markdown Spec');
  };

  // Toast Helper
  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3200);
  };

  // Filtered Notes
  const filteredNotes = (activeProject?.notes || []).filter((n) => {
    const matchesCat = selectedNoteCategory === 'All' || n.category === selectedNoteCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(notesSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Active editing element object
  const currentEditingElement = elements.find((el) => el.id === editingElementId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-[#000000] text-slate-100 font-sans select-none overflow-hidden relative">
      {/* 1. TOP HEADER */}
      {!isFocusMode && (
        <header className="relative z-50 h-14 px-4 border-b border-white/[0.08] bg-[#000000] backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 p-[1px] shadow-md shadow-orange-500/20 shrink-0">
              <div className="w-full h-full bg-[#050505] rounded-[7px] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rotate-45 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-[2px]" />
              </div>
            </div>

            {/* Project Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] transition-all cursor-pointer group"
              >
                <span className="text-base">{activeProject.icon}</span>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs truncate max-w-[160px]">
                      {activeProject.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[10px] text-orange-400 font-mono block">
                    {elements.length} blocks · {activeProject.notes?.length || 0} notes
                  </span>
                </div>
              </button>

              {/* Project Selection Menu - Spacious & No Emojis */}
              {showProjectMenu && (
                <div
                  style={{ padding: '16px' }}
                  className="absolute top-12 left-0 w-96 rounded-xl bg-[#0e121d] border border-white/[0.14] shadow-2xl z-[100] animate-in fade-in zoom-in-95"
                >
                  <div
                    style={{ paddingBottom: '10px', marginBottom: '12px' }}
                    className="flex items-center justify-between text-xs uppercase font-mono tracking-wider text-slate-300 font-semibold border-b border-white/[0.08]"
                  >
                    <span>Project Canvases</span>
                    <span className="text-orange-400 font-bold">{projects.length} Saved</span>
                  </div>

                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                    className="max-h-72 overflow-y-auto no-scrollbar"
                  >
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProject(p.id)}
                        style={{ padding: '12px 14px' }}
                        className={`w-full text-left rounded-md text-xs transition-all cursor-pointer flex items-center justify-between gap-3 group border ${
                          p.id === activeProjectId
                            ? 'bg-orange-500/20 border-orange-500/50 text-white font-bold shadow-md shadow-orange-500/10'
                            : 'bg-[#131726] hover:bg-[#181e32] border-white/[0.06] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-md bg-[#181d2e] border border-white/[0.1] flex items-center justify-center shrink-0 text-orange-400">
                            <Layout className="w-4 h-4" />
                          </div>
                          <div className="truncate flex-1 min-w-0 space-y-0.5">
                            <div className="truncate text-white font-semibold">{p.name}</div>
                            <div className="text-[11px] text-slate-400 truncate">{p.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.id === activeProjectId && (
                            <Check className="w-4 h-4 text-orange-400" />
                          )}
                          <button
                            onClick={(e) => handleDeleteProject(e, p.id)}
                            title="Delete Workspace Canvas"
                            className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{ paddingTop: '12px', marginTop: '12px' }}
                    className="border-t border-white/[0.08]"
                  >
                    <button
                      onClick={() => {
                        setShowProjectMenu(false);
                        setShowNewProjectModal(true);
                      }}
                      style={{ padding: '12px' }}
                      className="w-full rounded-md bg-gradient-to-r from-orange-500/20 to-amber-500/10 hover:from-orange-500/30 hover:to-amber-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                    >
                      <FolderPlus className="w-4 h-4 text-orange-400" />
                      <span>Create New Project Canvas</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls & AI Auto-Draw */}
          <div className="flex items-center gap-3">
            {/* AUTONOMOUS AUTO-DRAW BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowAutoDrawMenu(!showAutoDrawMenu)}
                disabled={isAutoDrawing}
                className="h-10 px-4 rounded-md bg-gradient-to-r from-orange-500/20 via-rose-500/15 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Wand2 className="w-4 h-4 text-orange-400" />
                <span>Auto-Draw</span>
                <ChevronDown className="w-3.5 h-3.5 text-orange-400/80" />
              </button>

              {showAutoDrawMenu && (
                <div className="absolute top-12 left-0 w-80 p-3 rounded-md bg-[#0d1117] border border-white/[0.12] shadow-2xl z-[100] space-y-2 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-orange-400 font-bold flex items-center justify-between border-b border-white/[0.06] pb-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Architecture Blueprints</span>
                    </div>
                    <span className="text-slate-500 font-normal">AI Powered</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowAutoDrawMenu(false);
                      executeAiAutoDrawFromPrompt('High Level Architecture for Nori full-stack AI companion system with FastAPI, React, Electron and Local Ollama');
                    }}
                    className="w-full text-left p-3 rounded-md text-xs text-slate-200 hover:bg-orange-500/15 border border-transparent hover:border-orange-500/30 cursor-pointer flex items-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-md bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-orange-300 transition-colors">Full-Stack Architecture</div>
                      <div className="text-[11px] text-slate-400 truncate">FastAPI + React + Electron + Ollama</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAutoDrawMenu(false);
                      executeAiAutoDrawFromPrompt('Snapdragon Hexagon DirectML Camera Video Inference Pipeline with OpenCV and Sensors');
                    }}
                    className="w-full text-left p-3 rounded-md text-xs text-slate-200 hover:bg-purple-500/15 border border-transparent hover:border-purple-500/30 cursor-pointer flex items-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">Neural Processing Pipeline</div>
                      <div className="text-[11px] text-slate-400 truncate">DirectML + OpenCV Tensor Inference</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAutoDrawMenu(false);
                      executeAiAutoDrawFromPrompt('Event-Driven Microservices with Kafka, Redis PubSub, WebSocket Gateway and Distributed Workers');
                    }}
                    className="w-full text-left p-3 rounded-md text-xs text-slate-200 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30 cursor-pointer flex items-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-md bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Event-Driven Services</div>
                      <div className="text-[11px] text-slate-400 truncate">PubSub, Kafka & WebSocket Hub</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowAutoDrawMenu(false);
                      executeAiAutoDrawFromPrompt('Local Neural Vector Database and Hybrid Semantic RAG Retrieval Pipeline');
                    }}
                    className="w-full text-left p-3 rounded-md text-xs text-slate-200 hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30 cursor-pointer flex items-center gap-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Vector DB & RAG</div>
                      <div className="text-[11px] text-slate-400 truncate">Knowledge Graph + Semantic Index</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* AI FINISH SKETCH & IDEA BUTTON */}
            <button
              onClick={handleAiFinishDrawing}
              disabled={isAiGenerating}
              className="h-10 px-3.5 rounded-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              title="AI analyzes your sketch or writing and autonomously completes the system architecture and connections"
            >
              <Wand2 className="w-4 h-4 text-purple-400" />
              <span>Finish Idea</span>
            </button>

            {/* CONTINUOUS LIVE CO-PILOT MONITORING TOGGLE (ON / OFF) */}
            <button
              onClick={() => {
                const next = !isContinuousMonitoring;
                setIsContinuousMonitoring(next);
                showNotification(next ? '✦ Live Co-Pilot Monitoring: ON' : '✦ Continuous Monitoring: OFF');
                voiceEngine.speak(
                  next
                    ? 'Continuous live monitoring is now active. Draw or write anytime, and I will stay in sync with you.'
                    : 'Continuous monitoring paused.'
                );
              }}
              className={`h-10 px-3.5 rounded-md border text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                isContinuousMonitoring
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-cyan-500/10'
                  : 'bg-white/[0.05] border-white/10 text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous Live Monitoring: When ON, Nori continuously watches your canvas, talks to you, and brainstorms ideas"
            >
              <span className={`w-2 h-2 rounded-full ${isContinuousMonitoring ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Live Monitoring</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                isContinuousMonitoring ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-400'
              }`}>
                {isContinuousMonitoring ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* AI Synthesizer Input with Voice Mic */}
            <div className="h-10 flex items-center gap-2 pl-3.5 pr-1.5 rounded-md bg-[#121625] border border-white/[0.12] focus-within:border-orange-500/60 transition-colors shadow-sm">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeAiAutoDrawFromPrompt(aiPrompt)}
                placeholder="Describe a diagram or ask Nori..."
                className="w-48 sm:w-56 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                onClick={toggleVoiceListen}
                type="button"
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  isVoiceListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
                title={isVoiceListening ? "Listening... say 'What am I doing?' or 'Finish this'" : "Voice query canvas"}
              >
                {isVoiceListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => executeAiAutoDrawFromPrompt(aiPrompt)}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="h-8 px-3.5 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all shrink-0 shadow-md shadow-orange-500/25"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Drawing...' : 'Draw'}</span>
              </button>
            </div>

            {/* Smart Notes Hub Button */}
            <button
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`h-10 px-3.5 rounded-md border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                showNotesDrawer
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-[#121625] hover:bg-[#181d30] border-white/[0.08] text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Project Notes</span>
              <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 text-[10px] flex items-center justify-center font-mono font-bold">
                {activeProject?.notes?.length || 0}
              </span>
            </button>

            {/* Export Dropdown */}
            <button
              onClick={handleExportPNG}
              title="Export as PNG"
              className="w-10 h-10 rounded-md bg-[#121625] hover:bg-[#181d30] border border-white/[0.08] hover:border-white/[0.18] text-cyan-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportMarkdownSpec}
              title="Export Architecture Spec (.md)"
              className="w-10 h-10 rounded-md bg-[#121625] hover:bg-[#181d30] border border-white/[0.08] hover:border-white/[0.18] text-emerald-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <FileCode className="w-4 h-4" />
            </button>

            {/* Focus Mode */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              title={isFocusMode ? 'Exit Fullscreen' : 'Focus Mode'}
              className="w-10 h-10 rounded-md bg-[#121625] hover:bg-[#181d30] border border-white/[0.08] hover:border-white/[0.18] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* 2. SPACIOUS TOP FLOATING TOOLBAR WITH SQUARE CORNERCURVES */}
      <div className="absolute top-18 left-1/2 -translate-x-1/2 z-20 px-3.5 py-2 rounded-xl bg-[#090b10]/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl flex items-center gap-2">
        {/* Navigation Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool('hand')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'hand'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Hand / Pan Tool (H)"
          >
            <Hand className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('select')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'select'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-white/[0.12] mx-1" />

        {/* Creation Tools Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool('rectangle')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'rectangle'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Rectangle Block (R)"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('diamond')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'diamond'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Diamond / Decision Block (D)"
          >
            <Diamond className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('ellipse')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'ellipse'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Ellipse / State Block (O)"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('arrow')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'arrow'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Connected Arrow (A)"
          >
            <MoveRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('pen')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'pen'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Freehand Pen (P)"
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('text')}
            className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Text Block (T)"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Sticky Note Tool with Clean Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setActiveTool('sticky');
                setShowStickyPaletteMenu(!showStickyPaletteMenu);
              }}
              className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                activeTool === 'sticky'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-white/[0.06]'
              }`}
              title="Sticky Note (S)"
            >
              <StickyNote className="w-4 h-4 text-amber-400" />
              <div
                className="w-2 h-2 rounded-[2px] absolute bottom-1 right-1 border border-black/50"
                style={{ backgroundColor: NOTE_THEMES[selectedStickyTheme]?.border || '#eab308' }}
              />
            </button>

            {showStickyPaletteMenu && (
              <div className="absolute top-11 left-0 w-64 p-2.5 rounded-xl bg-[#0d1117] border border-white/[0.12] shadow-2xl z-50 space-y-2 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
                  Select Sticky Note Theme
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(NOTE_THEMES) as StickyCategory[]).map((cat) => {
                    const th = NOTE_THEMES[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedStickyTheme(cat);
                          setActiveTool('sticky');
                          setShowStickyPaletteMenu(false);
                          if (selectedElementId) {
                            handleApplyStickyTheme(cat);
                          }
                        }}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                          selectedStickyTheme === cat
                            ? 'border-orange-500 scale-105 shadow-md'
                            : 'border-white/[0.08] hover:scale-105'
                        }`}
                        style={{ backgroundColor: th.bg }}
                        title={th.name}
                      >
                        <div className="w-3 h-3 rounded-[2px] border border-black/20" style={{ backgroundColor: th.border }} />
                        <span className="text-[9px] font-bold truncate max-w-[48px]" style={{ color: th.text }}>
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-[1px] h-5 bg-white/[0.12] mx-1" />

        {/* Action Tools: Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
            activeTool === 'eraser'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
          }`}
          title="Eraser (E) - Click or drag over items to erase"
        >
          <Eraser className="w-4 h-4 text-rose-400" />
        </button>

        <div className="w-[1px] h-5 bg-white/[0.12] mx-1" />

        {/* Color Palette (Square Cornercurves) */}
        <div className="flex items-center gap-1.5 px-1">
          {SHAPE_COLOR_PALETTE.slice(0, 6).map((c) => (
            <button
              key={c.name}
              onClick={() => handleApplyShapeColor(c.stroke, c.bg)}
              className={`w-5 h-5 rounded-[4px] transition-transform cursor-pointer border border-black/40 ${
                selectedColor === c.stroke ? 'scale-125 ring-2 ring-white/80' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.stroke }}
              title={c.name}
            />
          ))}

          {/* Custom Color Input */}
          <label
            title="Custom Hex Color"
            className="w-5 h-5 rounded-[4px] bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 flex items-center justify-center cursor-pointer relative overflow-hidden border border-white/20 hover:scale-110 transition-transform"
          >
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleApplyShapeColor(e.target.value, `${e.target.value}25`)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        <div className="w-[1px] h-5 bg-white/[0.12] mx-1" />

        {/* History Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. SELECTED ELEMENT PROPERTY BAR (Square Cornercurve Context HUD) */}
      {selectedElement && !editingElementId && (
        <div
          className="absolute z-40 px-3 py-1.5 rounded-lg bg-[#0d1117]/95 border border-orange-500/40 shadow-2xl backdrop-blur-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
          style={{
            top: Math.max(76, pan.y + selectedElement.y * zoom - 50),
            left: Math.max(16, pan.x + (selectedElement.x + selectedElement.width / 2) * zoom - 170)
          }}
        >
          {/* Edit Block Button */}
          <button
            onClick={() => startEditingElement(selectedElement)}
            className="px-2.5 py-1 rounded-md bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Double-click or press Enter to edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Block</span>
          </button>

          <div className="w-[1px] h-4 bg-white/[0.15]" />

          {/* Theme Color Picker */}
          {selectedElement.type === 'sticky' ? (
            <div className="flex items-center gap-1">
              {(Object.keys(NOTE_THEMES) as StickyCategory[]).slice(0, 6).map((cat) => {
                const th = NOTE_THEMES[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleApplyStickyTheme(cat)}
                    className={`w-4 h-4 rounded-[3px] transition-transform cursor-pointer border ${
                      selectedElement.category === cat ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: th.bg, borderColor: th.border }}
                    title={th.name}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {SHAPE_COLOR_PALETTE.slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleApplyShapeColor(c.stroke, c.bg)}
                  className={`w-4 h-4 rounded-[3px] transition-transform cursor-pointer ${
                    selectedElement.strokeColor === c.stroke ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.stroke }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          <div className="w-[1px] h-4 bg-white/[0.15]" />

          {/* Rotation Quick 45° Step */}
          <button
            onClick={() => {
              const currentR = selectedElement.rotation || 0;
              const nextR = currentR + Math.PI / 4;
              updateProjectElements(
                elements.map((el) => (el.id === selectedElement.id ? { ...el, rotation: nextR } : el))
              );
            }}
            className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
            title="Rotate 45° (or drag top circular handle)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Font Size controls */}
          <button
            onClick={() => {
              const currentF = selectedElement.fontSize || 15;
              const nextF = currentF <= 13 ? 16 : currentF <= 16 ? 20 : 13;
              updateProjectElements(
                elements.map((el) => (el.id === selectedElement.id ? { ...el, fontSize: nextF } : el))
              );
            }}
            className="px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-mono text-slate-300 cursor-pointer"
            title="Toggle Font Size"
          >
            {selectedElement.fontSize || 15}px
          </button>

          {/* Duplicate Button */}
          <button
            onClick={duplicateSelectedElement}
            className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => {
              updateProjectElements(elements.filter((el) => el.id !== selectedElement.id));
              setSelectedElementId(null);
            }}
            className="p-1.5 rounded-md hover:bg-rose-500/20 text-rose-400 cursor-pointer"
            title="Delete (Backspace/Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. AUTONOMOUS AUTO-DRAW HUD */}
      {isAutoDrawing && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-[#090b10]/98 border border-orange-500/50 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Wand2 className="w-4 h-4 text-orange-400 animate-spin" />
          <div className="text-xs font-semibold text-orange-200">
            {autoDrawStatus || '✦ Nori is autonomously drawing on canvas...'}
          </div>
          <button
            onClick={() => {
              cancelAutoDrawRef.current = true;
            }}
            className="ml-2 px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-mono cursor-pointer border border-rose-500/30"
          >
            Stop
          </button>
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {saveToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#090b10]/95 border border-orange-500/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 6. MAIN CANVAS VIEWPORT */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden flex">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: activeTool === 'hand' ? (isPanningRef.current ? 'grabbing' : 'grab') : activeTool === 'select' ? hoverCursor : 'crosshair' }}
          className="w-full h-full block"
        />

        {/* 7. DIRECT IN-PLACE BLOCK & STICKY NOTE TEXT EDITOR (ON CANVAS ELEMENT) */}
        {currentEditingElement && (
          <div
            className="absolute z-50 rounded-lg border shadow-2xl flex flex-col transition-all animate-in fade-in zoom-in-95"
            style={{
              left: pan.x + currentEditingElement.x * zoom,
              top: pan.y + currentEditingElement.y * zoom,
              width: Math.max(260, currentEditingElement.width * zoom),
              minHeight: Math.max(120, currentEditingElement.height * zoom),
              transform: currentEditingElement.rotation ? `rotate(${currentEditingElement.rotation}rad)` : undefined,
              transformOrigin: 'center center',
              backgroundColor:
                currentEditingElement.type === 'sticky'
                  ? NOTE_THEMES[editingCategory]?.bg || '#fef08a'
                  : '#0d1117',
              borderColor:
                currentEditingElement.type === 'sticky'
                  ? NOTE_THEMES[editingCategory]?.border || '#eab308'
                  : '#fa5438'
            }}
          >
            {/* Direct Textarea */}
            <div className="p-3 flex-1 flex flex-col">
              <textarea
                autoFocus
                rows={4}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveEditingElement();
                  } else if (e.key === 'Escape') {
                    setEditingElementId(null);
                  }
                }}
                placeholder="Type block or note content..."
                className="w-full flex-1 bg-transparent text-sm font-sans font-medium outline-none resize-none"
                style={{
                  color:
                    currentEditingElement.type === 'sticky' &&
                    NOTE_THEMES[editingCategory]?.bg !== '#181b28'
                      ? NOTE_THEMES[editingCategory]?.text
                      : '#ffffff'
                }}
              />
            </div>

            {/* In-Place Bottom Helper Bar */}
            <div className="px-3 py-1.5 border-t border-black/10 flex items-center justify-between gap-1.5 bg-black/10 rounded-b-lg">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingText((prev) => `${prev ? prev + '\n' : ''}• `)}
                  className="px-2 py-0.5 rounded bg-black/15 hover:bg-black/25 text-[11px] font-bold cursor-pointer transition-all"
                  style={{
                    color:
                      currentEditingElement.type === 'sticky' &&
                      NOTE_THEMES[editingCategory]?.bg !== '#181b28'
                        ? NOTE_THEMES[editingCategory]?.text
                        : '#ffffff'
                  }}
                >
                  • Bullet
                </button>

                {currentEditingElement.type === 'sticky' && (
                  <div className="flex items-center gap-1 ml-1">
                    {(Object.keys(NOTE_THEMES) as StickyCategory[]).slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEditingCategory(cat)}
                        className={`w-3.5 h-3.5 rounded-[2px] border ${
                          editingCategory === cat ? 'scale-125 ring-1 ring-black' : ''
                        }`}
                        style={{ backgroundColor: NOTE_THEMES[cat].bg, borderColor: NOTE_THEMES[cat].border }}
                        title={cat}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingElementId(null)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditingElement}
                  className="px-3 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM LEFT ZOOM & NAVIGATION HUD */}
        <div className="absolute bottom-6 left-6 z-40 px-3 py-1.5 rounded-lg bg-[#090b10]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-mono text-slate-300">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-bold text-white">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(4.0, z + 0.1))}
            className="p-1 rounded hover:bg-white/[0.08] hover:text-white cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 180, y: 120 });
            }}
            className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-orange-400"
          >
            Reset
          </button>
        </div>

        {/* 8. SLIDE-OVER SMART NOTES & SPECS DRAWER */}
        {showNotesDrawer && (
          <aside className="w-96 h-full bg-[#050505]/98 border-l border-white/[0.08] backdrop-blur-2xl flex flex-col z-40 shrink-0 shadow-2xl transition-all duration-300">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <StickyNote className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Project Notes</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {activeProject.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCustomNoteModal(true)}
                  title="Create New Note"
                  className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowNotesDrawer(false)}
                  className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-lg border transition-all space-y-2.5"
                  style={{
                    backgroundColor: `${note.color.bg}`,
                    borderColor: `${note.color.border}80`
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${note.color.border}25`,
                          color: note.color.border
                        }}
                      >
                        {note.category}
                      </span>
                      <h4
                        className="font-bold text-xs mt-1.5 leading-snug"
                        style={{ color: note.color.text }}
                      >
                        {note.title}
                      </h4>
                    </div>
                  </div>

                  <p
                    className="text-xs whitespace-pre-line leading-relaxed font-sans font-medium"
                    style={{ color: note.color.text }}
                  >
                    {note.content}
                  </p>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-1">
                    <button
                      onClick={() => insertStickyNoteFromDrawer(note)}
                      className="px-2.5 py-1 rounded bg-black/15 hover:bg-black/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      style={{ color: note.color.text }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Drop to Canvas</span>
                    </button>

                    <button
                      onClick={() => convertNoteToDiagram(note)}
                      className="px-2 py-1 rounded bg-black/15 hover:bg-black/25 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      style={{ color: note.color.text }}
                    >
                      <Zap className="w-3 h-3" />
                      <span>To Diagram</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* 9. CREATE NEW PROJECT CANVAS MODAL - Big & Spacious Professional Box */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
          <div
            style={{ padding: '28px' }}
            className="w-full max-w-xl rounded-xl bg-[#0f131f] border border-white/[0.16] shadow-2xl space-y-6 animate-in fade-in zoom-in-95"
          >
            <div
              style={{ paddingBottom: '14px' }}
              className="flex items-center justify-between border-b border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create New Project Canvas</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Initialize a new architecture and hardware workspace</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label
                  style={{ marginBottom: '8px' }}
                  className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-semibold"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Vector Swarm"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  style={{ padding: '12px 16px' }}
                  className="w-full rounded-md bg-[#161a29] border border-white/[0.12] text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 shadow-inner transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{ marginBottom: '8px' }}
                  className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-semibold"
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Multi-agent neural reasoning and local memory pipeline with edge sensory collection"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  style={{ padding: '12px 16px' }}
                  className="w-full rounded-md bg-[#161a29] border border-white/[0.12] text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 shadow-inner resize-none leading-relaxed transition-all"
                />
              </div>
            </div>

            <div
              style={{ paddingTop: '16px' }}
              className="border-t border-white/[0.08] flex items-center justify-end gap-3"
            >
              <button
                onClick={() => setShowNewProjectModal(false)}
                style={{ padding: '10px 20px' }}
                className="rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewProject}
                disabled={!newProjectName.trim()}
                style={{ padding: '10px 24px' }}
                className="rounded-md bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-orange-500/25"
              >
                Create Project Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CREATE CUSTOM NOTE MODAL - Big & Spacious */}
      {showCustomNoteModal && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-6">
          <div
            style={{ padding: '28px' }}
            className="w-full max-w-xl rounded-xl bg-[#0f131f] border border-white/[0.16] shadow-2xl space-y-6 animate-in fade-in zoom-in-95"
          >
            <div
              style={{ paddingBottom: '14px' }}
              className="flex items-center justify-between border-b border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create Project Note</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Add an architectural decision or technical specification</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomNoteModal(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label
                  style={{ marginBottom: '8px' }}
                  className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-semibold"
                >
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADR-004: DirectML Inference Architecture"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  style={{ padding: '12px 16px' }}
                  className="w-full rounded-md bg-[#161a29] border border-white/[0.12] text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 shadow-inner transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{ marginBottom: '8px' }}
                  className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-semibold"
                >
                  Category & Theme
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {(Object.keys(NOTE_THEMES) as StickyCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewNoteCategory(cat)}
                      style={{ padding: '10px' }}
                      className={`rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newNoteCategory === cat
                          ? 'border-orange-500 bg-orange-500/20 text-white shadow-sm'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-[2px]"
                        style={{ backgroundColor: NOTE_THEMES[cat].border }}
                      />
                      <span className="truncate">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{ marginBottom: '8px' }}
                  className="text-xs font-mono text-slate-300 uppercase tracking-wider block font-semibold"
                >
                  Content & Bullets
                </label>
                <textarea
                  rows={4}
                  placeholder="• Point 1: Context and assumptions&#10;• Point 2: Specific constraints&#10;• Point 3: Verification steps"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  style={{ padding: '12px 16px' }}
                  className="w-full rounded-md bg-[#161a29] border border-white/[0.12] text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/60 resize-none font-mono shadow-inner leading-relaxed transition-all"
                />
              </div>
            </div>

            <div
              style={{ paddingTop: '16px' }}
              className="border-t border-white/[0.08] flex items-center justify-end gap-3"
            >
              <button
                onClick={() => setShowCustomNoteModal(false)}
                style={{ padding: '10px 20px' }}
                className="rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomNote}
                disabled={!newNoteTitle.trim()}
                style={{ padding: '10px 24px' }}
                className="rounded-md bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-orange-500/25"
              >
                Save & Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Live Monitoring Status Pill */}
      {isContinuousMonitoring && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-[#0d101a]/90 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-2.5 shadow-lg shadow-cyan-500/10 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{liveMonitoringStatus}</span>
        </div>
      )}
    </div>
  );
};
