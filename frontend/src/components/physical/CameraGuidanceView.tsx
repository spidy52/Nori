import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNori } from '../../context/NoriContext';
import { voiceEngine } from '../../services/voice';
import {
  Camera,
  Layers,
  Cpu,
  Zap,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Share2,
  RefreshCw,
  Eye,
  Box,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode,
  Layout,
  Smile,
  Activity,
  Scan,
  ShieldCheck
} from 'lucide-react';

interface DetectedComponent {
  label: string;
  confidence: number;
  category: string;
  bbox?: number[];
  color: string;
  details?: Record<string, any>;
  dialogue?: string;
}

interface TrackedBox {
  id: string;
  label: string;
  confidence: number;
  category: string;
  currX: number;
  currY: number;
  currW: number;
  currH: number;
  targetX: number;
  targetY: number;
  targetW: number;
  targetH: number;
  alpha: number;
  targetAlpha: number;
  hue: number;
  missingFrames: number;
}

interface ActivityState {
  category: string;
  title: string;
  description: string;
  confidence: number;
  suggested_actions: string[];
}

export const CameraGuidanceView: React.FC = () => {
  const { privacyState, updatePermissions, setNoriState, setActiveView } = useNori();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const trackedBoxesRef = useRef<Map<string, TrackedBox>>(new Map());
  const rawDetectionsRef = useRef<{ objs: any[]; frameW: number; frameH: number }>({ objs: [], frameW: 640, frameH: 480 });

  const [hasBrowserStream, setHasBrowserStream] = useState<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detections, setDetections] = useState<DetectedComponent[]>([]);
  const [activityInfo, setActivityInfo] = useState<ActivityState>({
    category: 'work_and_coding',
    title: 'Workspace Perception Active',
    description: 'Autonomous multi-activity perception monitoring workspace and screen.',
    confidence: 0.95,
    suggested_actions: ['Manipulate Screen', 'Type Text', 'Draw Canvas Diagram']
  });
  const [userFocusState, setUserFocusState] = useState<string>('Active Screen Engagement');
  const [wiringAnalysis, setWiringAnalysis] = useState<string | null>(null);
  const [desktopNotice, setDesktopNotice] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isBuildingProject, setIsBuildingProject] = useState<boolean>(false);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('cover');

  // Enumerate video devices on mount and when USB devices change
  const probeCameras = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedCameraId(prev => {
            if (prev && videoInputs.some(v => v.deviceId === prev)) return prev;
            // Prefer USB / External camera if connected
            const usbCam = videoInputs.find(c => (c.label || '').toLowerCase().includes('usb') || (c.label || '').toLowerCase().includes('external'));
            return usbCam ? usbCam.deviceId : videoInputs[0].deviceId;
          });
        }
      } catch (e) {
        console.warn('Camera enumeration fallback:', e);
      }
    }
  }, []);

  useEffect(() => {
    probeCameras();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', probeCameras);
      return () => navigator.mediaDevices.removeEventListener('devicechange', probeCameras);
    }
  }, [probeCameras]);

  // Quick 1-click camera switcher between Laptop Webcam and USB Camera
  const toggleCameraSource = async () => {
    if (availableCameras.length < 2) return;
    const currentIdx = availableCameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIdx = (currentIdx + 1) % availableCameras.length;
    const nextCam = availableCameras[nextIdx];
    setSelectedCameraId(nextCam.deviceId);
    try {
      await fetch('http://127.0.0.1:8000/api/physical/select_camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camera_id: nextIdx })
      });
    } catch {}
  };

  // 1. Initialize native 60 FPS hardware-accelerated video stream with multi-camera selection
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const initWebcam = async () => {
      if (typeof navigator === 'undefined' || !('mediaDevices' in navigator)) return;
      try {
        let s: MediaStream;
        const videoConstraints: MediaTrackConstraints = selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } };

        try {
          s = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        } catch {
          s = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!isMounted) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        setHasBrowserStream(true);
        setStreamActive(true);
        // Refresh camera labels after user permission unlocks them
        probeCameras();
      } catch (err) {
        console.warn('getUserMedia webcam access fallback:', err);
        if (isMounted) {
          setHasBrowserStream(false);
          setStreamActive(true);
        }
      }
    };

    initWebcam();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedCameraId, probeCameras]);

  // 2. 60 FPS Continuous Linear Interpolation (Lerp) Animation Loop
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const currentCanvas = overlayCanvasRef.current;
      if (currentCanvas && video && video.clientWidth > 0 && video.clientHeight > 0) {
        if (currentCanvas.width !== video.clientWidth || currentCanvas.height !== video.clientHeight) {
          currentCanvas.width = video.clientWidth;
          currentCanvas.height = video.clientHeight;
        }

        const ctx = currentCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

          const { objs, frameW, frameH } = rawDetectionsRef.current;
          const vidW = video.videoWidth || frameW || 640;
          const vidH = video.videoHeight || frameH || 480;
          const videoRatio = vidW / vidH;
          const containerRatio = currentCanvas.width / currentCanvas.height;

          let renderW = currentCanvas.width;
          let renderH = currentCanvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (fitMode === 'cover') {
            if (containerRatio > videoRatio) {
              renderW = currentCanvas.width;
              renderH = currentCanvas.width / videoRatio;
              offsetY = (currentCanvas.height - renderH) / 2;
            } else {
              renderH = currentCanvas.height;
              renderW = currentCanvas.height * videoRatio;
              offsetX = (currentCanvas.width - renderW) / 2;
            }
          } else {
            // contain
            if (containerRatio > videoRatio) {
              renderW = currentCanvas.height * videoRatio;
              offsetX = (currentCanvas.width - renderW) / 2;
            } else {
              renderH = currentCanvas.width / videoRatio;
              offsetY = (currentCanvas.height - renderH) / 2;
            }
          }

          const scaleX = renderW / (frameW || 640);
          const scaleY = renderH / (frameH || 480);

          const tracked = trackedBoxesRef.current;
          const seenIds = new Set<string>();

          // Process current detection targets
          objs.forEach((obj) => {
            if (!obj.bbox || obj.bbox.length < 4) return;
            if (obj.category === 'user_focus') return;

            const [bx, by, bw, bh] = obj.bbox;
            const targetX = offsetX + bx * scaleX;
            const targetY = offsetY + by * scaleY;
            const targetW = bw * scaleX;
            const targetH = bh * scaleY;

            // Stable object key based on category and label
            const objKey = `${obj.category}_${obj.label}`;
            seenIds.add(objKey);

            let hue = 38;
            if (obj.category === 'human' || obj.category === 'human_mood') {
              hue = 188; // Neon Cyan for face / user
            } else if (obj.category === 'cooking_and_dining') {
              hue = 24; // Warm Coral / Tangerine for culinary & dining items
            } else if (obj.category === 'appliance') {
              hue = 170; // Cyan / Mint for room appliances
            } else if (obj.category === 'microcontroller' || obj.label.toLowerCase().includes('arduino')) {
              hue = 210; // Electric Royal Blue for Arduino / Microcontroller
            } else if (obj.category === 'electronics' || obj.category === 'handheld_gadget') {
              hue = 280; // Neon Purple / Magenta for electronics / phone / gadget
            } else if (obj.category === 'personal_accessory') {
              hue = 32; // Warm Amber / Gold for eyewear / spectacles
            } else if (obj.category === 'tool' || obj.category === 'hardware') {
              hue = 45; // Amber / Gold for tools
            } else if (obj.category === 'drinkware') {
              hue = 200; // Sky Blue for drinkware / cup
            } else if (obj.category === 'reading_material') {
              hue = 150; // Emerald for reading material
            } else {
              let hash = 0;
              for (let i = 0; i < obj.label.length; i++) {
                hash = obj.label.charCodeAt(i) + ((hash << 5) - hash);
              }
              hue = Math.abs(hash) % 360;
            }

            if (!tracked.has(objKey)) {
              // If another box with a different label is occupying this spatial region, eliminate the old one instantly (replaced object)
              tracked.forEach((existing, exKey) => {
                if (exKey !== objKey) {
                  const exCx = existing.currX + existing.currW / 2;
                  const exCy = existing.currY + existing.currH / 2;
                  const newCx = targetX + targetW / 2;
                  const newCy = targetY + targetH / 2;
                  const centerDist = Math.hypot(exCx - newCx, exCy - newCy);
                  if (centerDist < Math.max(existing.currW, targetW) * 0.55) {
                    tracked.delete(exKey);
                  }
                }
              });

              // Spawn new tracked box
              tracked.set(objKey, {
                id: objKey,
                label: obj.label,
                confidence: obj.confidence || 0.88,
                category: obj.category,
                currX: targetX,
                currY: targetY,
                currW: targetW,
                currH: targetH,
                targetX,
                targetY,
                targetW,
                targetH,
                alpha: 0.50,
                targetAlpha: 1.0,
                hue,
                missingFrames: 0
              });
            } else {
              // Update target coords immediately
              const b = tracked.get(objKey)!;
              b.targetX = targetX;
              b.targetY = targetY;
              b.targetW = targetW;
              b.targetH = targetH;
              b.targetAlpha = 1.0;
              b.confidence = obj.confidence || b.confidence;
              b.missingFrames = 0;
            }
          });

          // Mark missing boxes to fade out INSTANTLY when camera shifts or object is removed
          tracked.forEach((box, key) => {
            if (!seenIds.has(key)) {
              box.missingFrames += 1;
              box.targetAlpha = 0.0;
              box.alpha *= 0.40; // Super snappy decay (< 50ms)
            }

            // Snappy Real-Time Lerp Speed
            const dist = Math.hypot(box.targetX - box.currX, box.targetY - box.currY);
            const lerpSpeed = dist > 60 ? 0.90 : dist > 20 ? 0.82 : 0.70;

            box.currX += (box.targetX - box.currX) * lerpSpeed;
            box.currY += (box.targetY - box.currY) * lerpSpeed;
            box.currW += (box.targetW - box.currW) * lerpSpeed;
            box.currH += (box.targetH - box.currH) * lerpSpeed;
            box.alpha += (box.targetAlpha - box.alpha) * 0.60;

            // Remove box immediately if gone
            if (box.alpha < 0.04 || box.missingFrames > 2) {
              tracked.delete(key);
              return;
            }

            // Render box at (currX, currY, currW, currH)
            const x = box.currX;
            const y = box.currY;
            const w = box.currW;
            const h = box.currH;
            const alpha = Math.max(0, Math.min(1, box.alpha));

            ctx.save();
            ctx.globalAlpha = alpha;

            const strokeColor = `hsl(${box.hue}, 95%, 55%)`;
            const fillColor = `hsla(${box.hue}, 95%, 55%, 0.12)`;
            const labelBg = `hsla(${box.hue}, 85%, 22%, 0.94)`;

            // Subtle neon glow
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 8;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.4;
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Dynamic corner brackets
            const cornerLen = Math.min(20, w * 0.28, h * 0.28);
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            // Top-left
            ctx.moveTo(x, y + cornerLen);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cornerLen, y);
            // Top-right
            ctx.moveTo(x + w - cornerLen, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + cornerLen);
            // Bottom-right
            ctx.moveTo(x + w, y + h - cornerLen);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w - cornerLen, y + h);
            // Bottom-left
            ctx.moveTo(x + cornerLen, y + h);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x, y + h - cornerLen);
            ctx.stroke();

            // Label tag badge
            const confPct = Math.round(box.confidence * 100);
            const labelText = `${box.label} [${confPct}%]`;
            ctx.font = 'bold 12px monospace';
            const metrics = ctx.measureText(labelText);
            const textWidth = metrics.width;

            const tagY = Math.max(24, y - 6);
            ctx.shadowBlur = 0;
            ctx.fillStyle = labelBg;
            ctx.beginPath();
            ctx.roundRect(x, tagY - 18, textWidth + 16, 22, 4);
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x + 8, tagY - 3);

            ctx.restore();
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 3. Process analysis responses and update state
  const handleAnalysisData = useCallback((data: any, frameW: number, frameH: number) => {
    if (!data) return;

    const rawObjs = data.objects || [];
    rawDetectionsRef.current = { objs: rawObjs, frameW, frameH };

    // Check focus state
    const focus = rawObjs.find((o: any) => o.category === 'user_focus');
    if (focus) {
      setUserFocusState(focus.label.replace('User Focus: ', ''));
    }

    // Dynamic Activity Synthesis from backend
    if (data.activity) {
      setActivityInfo(data.activity);
    }

    // Filter desk objects for list display
    const deskObjs: DetectedComponent[] = rawObjs.map((obj: any) => {
      let color = 'border-orange-500 text-orange-400 bg-orange-500/10';
      if (obj.category === 'human_mood' || obj.category === 'human') color = 'border-cyan-500 text-cyan-400 bg-cyan-500/10';
      else if (obj.category === 'handheld_gadget' || obj.category === 'electronics') color = 'border-purple-500 text-purple-400 bg-purple-500/10';
      else if (obj.category === 'personal_accessory') color = 'border-amber-500 text-amber-400 bg-amber-500/10';
      else if (obj.category === 'tool') color = 'border-yellow-500 text-yellow-400 bg-yellow-500/10';
      else if (obj.category === 'drinkware') color = 'border-blue-500 text-blue-400 bg-blue-500/10';
      else if (obj.category === 'reading_material') color = 'border-emerald-500 text-emerald-400 bg-emerald-500/10';

      return {
        label: obj.label,
        confidence: obj.confidence || 0.9,
        category: obj.category || 'Workspace',
        bbox: obj.bbox,
        color,
        details: obj.details,
        dialogue: obj.interactive_dialogue
      };
    });

    setDetections(deskObjs);

    if (data.interactive_dialogue || data.proactive_advice) {
      setWiringAnalysis(data.interactive_dialogue || data.proactive_advice);
    }
  }, []);

  // 4. Continuous Autonomous Perception Loop (300ms for fast responsive updates)
  // 4. Low-Latency Continuous Autonomous Perception Loop
  useEffect(() => {
    if (!isRecording || isPaused) return;
    let active = true;

    const captureAndAnalyze = async () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.videoWidth > 0 && !isAnalyzingRef.current) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
          isAnalyzingRef.current = true;
          const video = videoRef.current;
          const offscreen = document.createElement('canvas');

          const vidW = video.videoWidth || 640;
          const vidH = video.videoHeight || 480;
          const targetW = 480;
          const targetH = Math.max(200, Math.round((vidH / vidW) * targetW));

          offscreen.width = targetW;
          offscreen.height = targetH;
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
            const imageBase64 = offscreen.toDataURL('image/jpeg', 0.65).split(',')[1];

            const res = await fetch('http://127.0.0.1:8000/api/physical/analyze_frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_base64: imageBase64, project_context: 'Workspace Perception' }),
              signal: controller.signal
            });

            if (res.ok) {
              const data = await res.json();
              handleAnalysisData(data, offscreen.width, offscreen.height);
            }
          }
        } catch {
        } finally {
          clearTimeout(timeoutId);
          isAnalyzingRef.current = false;
        }
      }

      if (active) {
        setTimeout(captureAndAnalyze, 45);
      }
    };

    captureAndAnalyze();
    return () => { active = false; };
  }, [isRecording, isPaused, handleAnalysisData]);

  // 5. Initial status sync on load
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/physical/camera/status');
        if (res.ok) {
          const data = await res.json();
          setIsRecording(data.is_active);
          if (data.latest_analysis) {
            handleAnalysisData(data.latest_analysis, 640, 480);
          }
        }
      } catch (e) {
        // quiet
      }
    };
    fetchStatus();
  }, [handleAnalysisData]);

  const toggleCameraActive = async () => {
    try {
      const nextActive = !isRecording;
      const endpoint = nextActive ? 'start' : 'stop';
      await fetch(`http://127.0.0.1:8000/api/physical/camera/${endpoint}`, { method: 'POST' });
      setIsRecording(nextActive);
      setStreamActive(nextActive);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualInspect = async () => {
    setIsAnalyzing(true);
    setNoriState('thinking');

    try {
      let imageBase64 = '';
      let w = 640;
      let h = 480;
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(videoRef.current.videoWidth, 640);
        canvas.height = Math.min(videoRef.current.videoHeight, 480);
        w = canvas.width;
        h = canvas.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        }
      }

      if (imageBase64) {
        const res = await fetch('http://127.0.0.1:8000/api/physical/analyze_frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: imageBase64, project_context: 'Manual Workspace Inspection' })
        });
        if (res.ok) {
          const data = await res.json();
          handleAnalysisData(data, w, h);
          if (data.interactive_dialogue) {
            voiceEngine.speak(data.interactive_dialogue);
          }
        }
      }
      setNoriState('ready');
    } catch (e) {
      setNoriState('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeDesktopAction = async (instruction: string) => {
    setDesktopNotice(`Executing: "${instruction}"...`);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/desktop/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });
      if (res.ok) {
        const data = await res.json();
        setDesktopNotice(data.message || 'Task completed successfully.');
        voiceEngine.speak(data.message || 'Task executed on your desktop.');
      } else {
        setDesktopNotice('Desktop task encountered an error.');
      }
    } catch (e) {
      setDesktopNotice('Failed to communicate with desktop agent.');
    }
    setTimeout(() => setDesktopNotice(null), 5000);
  };

  const extractComponentCrops = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return {};

    const crops: Record<string, { label: string; dataUrl: string; width: number; height: number }> = {};
    try {
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = video.videoWidth;
      fullCanvas.height = video.videoHeight;
      const fCtx = fullCanvas.getContext('2d');
      if (!fCtx) return {};

      fCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

      const { objs } = rawDetectionsRef.current;
      objs.forEach((obj, idx) => {
        if (obj.bbox && obj.bbox.length === 4) {
          const [bx, by, bw, bh] = obj.bbox;
          if (bw > 25 && bh > 25) {
            const padX = Math.round(bw * 0.12);
            const padY = Math.round(bh * 0.12);
            const sx = Math.max(0, bx - padX);
            const sy = Math.max(0, by - padY);
            const sw = Math.min(fullCanvas.width - sx, bw + padX * 2);
            const sh = Math.min(fullCanvas.height - sy, bh + padY * 2);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = sw;
            cropCanvas.height = sh;
            const cCtx = cropCanvas.getContext('2d');
            if (cCtx) {
              cCtx.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
              const key = obj.label || `component_${idx}`;
              crops[key] = {
                label: obj.label,
                dataUrl: cropCanvas.toDataURL('image/jpeg', 0.88),
                width: sw,
                height: sh
              };
            }
          }
        }
      });
    } catch (e) {
      console.warn('Component crop extraction fallback:', e);
    }
    return crops;
  };

  const handleBuildWorkspaceProject = async () => {
    setIsBuildingProject(true);
    voiceEngine.speak("Analyzing all components on your workspace to design a complete hardware project.");
    try {
      const res = await fetch('http://127.0.0.1:8000/api/physical/build_project', {
        method: 'POST'
      });
      if (res.ok) {
        const blueprint = await res.json();
        const componentsUsed = blueprint.detected_components_used?.join(', ') || 'workspace components';
        const msg = `Designed ${blueprint.title} using your ${componentsUsed}. Drawing complete wiring schematic and C++ code on Studio Canvas.`;
        voiceEngine.speak(msg);
        const crops = extractComponentCrops();
        setActiveView('canvas');
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('nori-auto-draw', {
              detail: {
                prompt: `Hardware Architecture for ${blueprint.title} (${componentsUsed})`,
                blueprint: blueprint,
                componentCrops: crops
              }
            })
          );
        }, 350);
      }
    } catch (e) {
      console.error('Failed to build project:', e);
    } finally {
      setIsBuildingProject(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#07090e] text-slate-100 select-none font-sans overflow-hidden">
      {/* 1. Top Header */}
      <header className="h-16 px-6 border-b border-white/[0.08] bg-[#0c0f18] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-[1px] shadow-md shadow-orange-500/20">
            <div className="w-full h-full bg-[#0c0f18] rounded-[5px] flex items-center justify-center">
              <Scan className="w-3.5 h-3.5 text-orange-400" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm sm:text-base font-bold text-white">Physical Workspace & Screen Perception</h1>
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
              isRecording
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-sm ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isRecording ? '60 FPS Smooth Object Following' : 'Perception Paused'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Multi-Camera Source Selector */}
          {availableCameras.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#121626] border border-white/10 text-xs">
              <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                value={selectedCameraId}
                onChange={async (e) => {
                  const devId = e.target.value;
                  setSelectedCameraId(devId);
                  const idx = availableCameras.findIndex(c => c.deviceId === devId);
                  if (idx !== -1) {
                    try {
                      await fetch('http://127.0.0.1:8000/api/physical/select_camera', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ camera_id: idx })
                      });
                    } catch {}
                  }
                }}
                className="bg-transparent text-slate-200 text-xs font-mono border-none outline-none cursor-pointer max-w-[140px] truncate"
              >
                {availableCameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId} className="bg-[#0c0f18] text-white">
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1-Click Quick Camera Switcher */}
          {availableCameras.length > 1 && (
            <button
              onClick={toggleCameraSource}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-md cursor-pointer transition-all"
              title="Click to switch between Laptop Webcam and USB Camera"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {availableCameras.find(c => c.deviceId === selectedCameraId)?.label?.replace(/\s*\([^)]*\)/g, '').slice(0, 16) || 'Switch Camera'}
              </span>
            </button>
          )}

          {/* Full-View & Fit Toggles */}
          <div className="flex items-center gap-1 bg-[#121626] p-0.5 rounded-md border border-white/10">
            <button
              onClick={() => setFitMode(fitMode === 'cover' ? 'contain' : 'cover')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                fitMode === 'cover' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Fill screen (cover, no black bars) vs Fit frame (contain)"
            >
              {fitMode === 'cover' ? 'Fill View' : 'Fit Frame'}
            </button>
            <button
              onClick={() => setIsFullView(!isFullView)}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title={isFullView ? 'Exit Full View' : 'Full Screen View (Hide Sidebar)'}
            >
              {isFullView ? <Minimize2 className="w-3.5 h-3.5 text-orange-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Autonomous Project Builder Action */}
          <button
            onClick={handleBuildWorkspaceProject}
            disabled={isBuildingProject}
            className="px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
            title="Synthesize Project & Auto-Draw on Studio Canvas using detected items"
          >
            <Cpu className={`w-3.5 h-3.5 ${isBuildingProject ? 'animate-spin' : ''}`} />
            <span>{isBuildingProject ? 'Designing...' : '⚡ Build Project'}</span>
          </button>

          {/* Dynamic Activity Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-[#121626] border border-orange-500/30 text-xs">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300 font-mono text-[11px]">Activity:</span>
            <span className="text-orange-300 font-bold">{activityInfo.title}</span>
          </div>

          <button
            onClick={handleManualInspect}
            disabled={isAnalyzing}
            className="nori-btn-primary text-xs py-1.5 px-3.5 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Inspect Workspace'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Dominant Camera Viewport */}
        <div className={`flex-1 bg-[#05070c] flex flex-col justify-between overflow-hidden transition-all ${
          isFullView ? 'p-0' : 'p-3 sm:p-5'
        }`}>
          <div className={`relative flex-1 bg-[#090b12] overflow-hidden flex items-center justify-center shadow-2xl transition-all ${
            isFullView ? 'rounded-none border-none' : 'rounded-lg border border-white/[0.08]'
          }`}>
            {isRecording ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {/* 1. Native Zero-Latency 60 FPS HTML5 Video (Dominant & Primary) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} ${hasBrowserStream ? 'block' : 'hidden'}`}
                />

                {/* 2. Fallback OpenCV DirectML Stream if browser camera unavailable */}
                {!hasBrowserStream && (
                  <img
                    src="http://127.0.0.1:8000/api/physical/video_feed"
                    alt="DirectML Hardware Stream"
                    className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                  />
                )}

                {/* 3. Transparent Interactive Overlay Canvas for Bounding Boxes & HUD */}
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                />

                {/* Top-Left Telemetry HUD Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono shadow-lg">
                  <span className="w-2 h-2 rounded-sm bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold">SMOOTH 60 FPS HUD</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-orange-400 font-semibold">Continuous Tracking</span>
                </div>

                {/* Top-Right Quick Controls Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {availableCameras.length > 1 && (
                    <button
                      onClick={toggleCameraSource}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-950/85 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-lg backdrop-blur-md cursor-pointer transition-all"
                      title="Switch between Laptop Webcam and USB Camera"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Switch Camera</span>
                    </button>
                  )}
                  <button
                    onClick={() => setFitMode(fitMode === 'cover' ? 'contain' : 'cover')}
                    className="px-2.5 py-1.5 rounded-md bg-black/80 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono shadow-lg backdrop-blur-md cursor-pointer transition-all"
                    title="Toggle Fill (no black bars) vs Fit Frame"
                  >
                    {fitMode === 'cover' ? 'Fill (No Bars)' : 'Fit Frame'}
                  </button>
                  <button
                    onClick={() => setIsFullView(!isFullView)}
                    className="p-1.5 rounded-md bg-black/80 hover:bg-white/10 border border-white/15 text-slate-200 text-xs shadow-lg backdrop-blur-md cursor-pointer transition-all"
                    title={isFullView ? 'Exit Full View' : 'Full View (Edge-to-Edge)'}
                  >
                    {isFullView ? <Minimize2 className="w-4 h-4 text-orange-400" /> : <Maximize2 className="w-4 h-4 text-slate-200" />}
                  </button>
                </div>

                {/* Desktop Notice Banner */}
                {desktopNotice && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md bg-purple-950/90 border border-purple-500/40 text-purple-200 text-xs font-mono shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400 animate-bounce" />
                    <span>{desktopNotice}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-[#080b14] to-[#121626] p-8 text-center gap-3">
                <div className="w-16 h-16 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Camera Monitoring Stopped</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Camera recording is paused. Say "Start camera" or click below to resume real-time workspace vision.
                </p>
                <button
                  onClick={toggleCameraActive}
                  className="nori-btn-primary mt-2 cursor-pointer"
                >
                  Start Real-Time Camera Monitoring
                </button>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="mt-4 flex items-center justify-between p-3.5 rounded-md bg-[#121522] border border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-300">
                Mode: <strong className="text-orange-400">60 FPS Autonomous Perception + Desktop Agent</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualInspect}
                disabled={isAnalyzing}
                className="p-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 cursor-pointer transition-colors"
                title="Capture and Inspect Instant"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={toggleCameraActive}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                  isRecording ? 'bg-rose-600 ring-4 ring-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
                title={isRecording ? "Stop Camera" : "Start Camera"}
              >
                {isRecording ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Voice: "Type [text]", "What am I doing?", or "See my screen"
            </span>
          </div>
        </div>

        {/* Right Analysis Panel (380px) - Hidden in Full View */}
        <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0c0f18] p-6 space-y-6 overflow-y-auto shrink-0 transition-all ${
          isFullView ? 'hidden' : 'block'
        }`}>
          {/* 1. Dynamic Activity & Context */}
          <div className="p-4 rounded-md bg-[#121626] border border-orange-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Current Activity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                {Math.round(activityInfo.confidence * 100)}% Conf
              </span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white">{activityInfo.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{activityInfo.description}</p>
            </div>

            <div className="pt-1 border-t border-white/[0.06]">
              <span className="text-[11px] text-slate-400 block font-mono">Cognitive Attention:</span>
              <span className="text-xs font-bold text-emerald-400">{userFocusState}</span>
            </div>
          </div>

          {/* 2. Autonomous Desktop Manipulation Agent */}
          <div className="p-4 rounded-md bg-[#151226] border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Desktop Agent
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Ready
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nori can see your PC screen, type code/notes into your active apps, and automate workflows.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => executeDesktopAction('see screen and summarize active window')}
                className="p-2 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-xs font-mono text-purple-200 cursor-pointer flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                See Screen
              </button>
              <button
                onClick={() => executeDesktopAction('type hello from nori autonomous desktop agent into notepad')}
                className="p-2 rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 text-xs font-mono text-purple-200 cursor-pointer flex items-center justify-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5" />
                Test Typing
              </button>
            </div>
          </div>

          {/* 3. Detected Workspace & Handheld Objects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Tracked Workspace Items ({detections.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">60 FPS Lerp</span>
            </div>

            {detections.length === 0 ? (
              <div className="p-6 rounded-md bg-[#121522] border border-white/[0.06] text-center text-xs text-slate-400">
                <Box className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                <p>Tracking your workspace...</p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Hold your earbuds, phone, gadgets, tools, or circuits in front of the lens.
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {detections.map((d, idx) => {
                  let hash = 0;
                  for (let i = 0; i < d.label.length; i++) {
                    hash = d.label.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const hue = d.category === 'human_mood' ? 188 : d.category === 'handheld_gadget' ? 280 : Math.abs(hash) % 360;
                  const dotColor = `hsl(${hue}, 90%, 55%)`;

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-md bg-[#121522] border border-white/[0.08] flex items-center justify-between transition-all hover:bg-[#151928]"
                      style={{ borderLeftColor: dotColor, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{d.label}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            {d.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 ml-2 shrink-0">
                        {Math.round(d.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Diagnostics & Grounded Advice */}
          <div className="nori-card space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Perception Insights
            </span>

            <p className="text-xs text-slate-300 leading-relaxed">
              {wiringAnalysis || 'Point camera at your desk items or face to receive grounded contextual guidance.'}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  voiceEngine.speak(wiringAnalysis || "Perception is active. Your workspace is being monitored smoothly.");
                }}
                className="nori-btn-secondary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-orange-400" />
                <span>Read Diagnostics Aloud</span>
              </button>

              <button
                onClick={() => {
                  const diagText = wiringAnalysis || 'Workspace Diagnosis & Circuit Fix Guide';
                  const detectedLabels = detections.map(d => d.label).join(', ') || 'Workspace Inspection Setup';
                  const prompt = `Workspace Fix & Diagram: ${detectedLabels} — ${diagText}`;
                  
                  const crops = extractComponentCrops();
                  setActiveView('canvas');
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('nori-auto-draw', {
                        detail: {
                          prompt,
                          detections,
                          wiringAnalysis: diagText,
                          componentCrops: crops
                        }
                      })
                    );
                  }, 350);
                  voiceEngine.speak("Opening Studio Canvas to diagram the solution now.");
                }}
                className="nori-btn-primary w-full text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Draw Fix on Studio Canvas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
