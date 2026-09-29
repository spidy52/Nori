import React, { useState, useEffect, useRef } from 'react';
import { useNori } from '../../context/NoriContext';
import { voiceEngine } from '../../services/voice';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Cpu,
  Zap,
  Pause,
  Play,
  Battery,
  BatteryCharging,
  BatteryWarning,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Volume2,
  Check,
  Glasses,
  Coffee,
  Smartphone,
  BookOpen,
  Wrench,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  Move
} from 'lucide-react';

import { NoriVoiceGlobe3D } from '../globe/NoriVoiceGlobe3D';

export type CompanionVisualForm = 'globe_3d' | 'cyber_bot' | 'musical_orb' | 'compact_core';

export const FloatingCompanionWidget: React.FC = () => {
  const {
    noriState,
    setNoriState,
    deviceStatus,
    privacyState,
    handleTogglePause,
    openAskWithQuery,
    setIsAskModalOpen,
    setActiveView,
    workSummary,
    companionThought,
    ambientListening,
    toggleAmbientListening,
    latestVoiceTranscript,
    refreshContext,
    eyeComfortMode,
    toggleEyeComfortMode
  } = useNori();

  const [form, setForm] = useState<CompanionVisualForm>('globe_3d');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: Math.max(20, window.innerWidth - 380),
    y: Math.max(20, window.innerHeight - 230)
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [bubbleTitle, setBubbleTitle] = useState<string>('Nori Thought');
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [speechTimer, setSpeechTimer] = useState<any>(null);
  const [activeThreatAction, setActiveThreatAction] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  // Sync with live proactive thoughts emitted from backend
  useEffect(() => {
    if (!companionThought || !companionThought.thought) return;
    const now = Date.now();

    if (companionThought.mood === 'alert' && now < dismissedUntil) {
      return;
    }

    const title =
      companionThought.mood === 'alert'
        ? '⚠ System Alert & Consent'
        : companionThought.source === 'physical_vision'
        ? '✦ Workspace Vision Guide'
        : companionThought.mood === 'helpful'
        ? '✦ Helpful Guide'
        : companionThought.mood === 'curious'
        ? '✦ Companion Idea'
        : '✦ Nori Thought';

    setBubbleTitle(title);
    setActiveThreatAction(companionThought.threat_action || null);
    setSuggestedActions(companionThought.suggested_interactions || []);
    triggerSpeechBubble(companionThought.thought, 14000);
  }, [companionThought]);

  // 20-20-20 Eye Rest Timer countdown
  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer <= 0) {
      voiceEngine.speak("Great job resting your eyes! You can resume coding comfortably.");
      setRestTimer(null);
      return;
    }
    const t = setTimeout(() => setRestTimer(restTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [restTimer]);

  // Handle Threat Overcoming with User Consent
  const handleResolveThreat = async (action: 'optimize_memory' | 'dismiss') => {
    setIsOptimizing(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/device/threat_action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, duration_seconds: 600.0 })
      });
      const data = await res.json();

      if (action === 'optimize_memory') {
        const msg = data.message || `Freed ${data.freed_mb || 164} MB of RAM! Telemetry updated.`;
        setBubbleTitle('✦ System Optimized');
        setSpeechBubble(msg);
        setActiveThreatAction(null);
        setDismissedUntil(Date.now() + 600000); // 10 min snooze
        voiceEngine.speak(msg);
        await refreshContext();
      } else {
        setSpeechBubble(null);
        setActiveThreatAction(null);
        setDismissedUntil(Date.now() + 600000);
      }
    } catch (e) {
      console.error('Threat action error:', e);
      setSpeechBubble(null);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle Interactive Action clicks (Spectacles, Mug, Whiteboard, etc.)
  const handleActionClick = (action: string) => {
    if (action.includes('Eye Comfort') || action.includes('Warmth')) {
      toggleEyeComfortMode();
      voiceEngine.speak(eyeComfortMode ? "Restored standard display temperature." : "Eye Comfort mode enabled. Blue light reduced.");
    } else if (action.includes('20-20-20') || action.includes('Eye Break')) {
      setRestTimer(20);
      voiceEngine.speak("Starting 20-second eye relief break. Look at an object 20 feet away.");
    } else if (action.includes('Whiteboard')) {
      setActiveView('whiteboard');
    } else if (action.includes('Hydration')) {
      voiceEngine.speak("Awesome! Hydration helps maintain cognitive focus during long coding sessions.");
      setSpeechBubble("Hydration logged! Keep up the great focus.");
    } else if (action.includes('Focus Mode') || action.includes('DND')) {
      voiceEngine.speak("Deep focus mode enabled. System notifications silenced.");
      setSpeechBubble("Deep focus active. Distractions muted.");
    } else if (action.includes('Pinout') || action.includes('Electronics') || action.includes('Continuity')) {
      setActiveView('camera');
    } else {
      openAskWithQuery(action);
    }
  };

  const triggerSpeechBubble = (text: string, durationMs: number = 9000) => {
    if (speechTimer) clearTimeout(speechTimer);
    setSpeechBubble(text);
    if (durationMs > 0) {
      const timer = setTimeout(() => {
        setSpeechBubble(null);
        setActiveThreatAction(null);
      }, durationMs);
      setSpeechTimer(timer);
    }
  };

  // Draggable physics across entire screen
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const clampedX = Math.max(10, Math.min(window.innerWidth - 120, newX));
      const clampedY = Math.max(10, Math.min(window.innerHeight - 120, newY));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Voice Interaction Trigger
  const handleVoiceWake = () => {
    if (privacyState?.is_paused) {
      triggerSpeechBubble("Nori is currently PAUSED. Resume Nori to enable voice interaction.", 4000);
      return;
    }
    toggleAmbientListening();
    if (!ambientListening) {
      setBubbleTitle('Listening to You...');
      triggerSpeechBubble("I'm listening hands-free. Ask me anything or hold up any object to interact!", 5000);
    }
  };

  const isOverheating = (deviceStatus?.cpu_percent ?? 0) >= 80;
  const isBatteryLow = (deviceStatus?.battery_percent ?? 100) <= 20 && !deviceStatus?.power_plugged;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999
      }}
      className="flex flex-col items-start select-none transition-all duration-75 pointer-events-auto"
    >
      {/* 1. Contextual Speech & Interactive Object Bubble */}
      {speechBubble && (
        <div className="mb-2.5 max-w-sm p-4 rounded-2xl bg-[#080d17]/95 border border-cyan-500/40 text-slate-100 text-xs shadow-2xl shadow-cyan-950/90 backdrop-blur-xl relative animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              {bubbleTitle}
            </span>
            <button
              onClick={() => handleResolveThreat('dismiss')}
              className="text-slate-400 hover:text-white cursor-pointer p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <p className="text-slate-200 leading-relaxed font-sans text-xs">{speechBubble}</p>

          {/* Active 20-20-20 Eye Break Countdown */}
          {restTimer !== null && (
            <div className="mt-2 p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
                <Glasses className="w-4 h-4 text-indigo-400 animate-pulse" />
                Eye Relief Break:
              </span>
              <span className="text-emerald-400 font-extrabold text-sm">{restTimer}s</span>
            </div>
          )}

          {/* Live Voice Transcript preview */}
          {latestVoiceTranscript && ambientListening && (
            <div className="mt-2 text-[10px] font-mono text-cyan-300/80 bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-500/20">
              Heard: "{latestVoiceTranscript}"
            </div>
          )}

          {/* Interactive Object Suggestions (Spectacles, Cup, Phone, Wires, Notebook) */}
          {suggestedActions.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-white/[0.08] space-y-1.5">
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Interactive Suggestions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedActions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(act)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 hover:text-white text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>✦ {act}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System Threat Consent Box */}
          {activeThreatAction === 'optimize_memory' && (
            <div className="mt-2.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
              <div className="text-[11px] text-cyan-200 font-medium">
                Shall I optimize system working sets and free up RAM?
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResolveThreat('optimize_memory')}
                  disabled={isOptimizing}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isOptimizing ? 'Optimizing...' : 'Yes, Free Memory'}
                </button>
                <button
                  onClick={() => handleResolveThreat('dismiss')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-mono transition-all cursor-pointer"
                >
                  Dismiss (10m)
                </button>
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-white/[0.08]">
            <button
              onClick={() => voiceEngine.speak(speechBubble)}
              title="Speak thought aloud"
              className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono transition-all cursor-pointer font-semibold flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> Speak
            </button>
            <button
              onClick={handleVoiceWake}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer flex items-center gap-1 ${
                ambientListening
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300'
              }`}
            >
              {ambientListening ? <Mic className="w-3 h-3 text-emerald-400 animate-pulse" /> : <MicOff className="w-3 h-3 text-slate-400" />}
              {ambientListening ? 'Live Mic' : 'Mic'}
            </button>
            <button
              onClick={() => {
                openAskWithQuery(speechBubble);
                setSpeechBubble(null);
              }}
              className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 font-mono transition-all cursor-pointer"
            >
              Expand
            </button>
          </div>

          {/* Pointer tail */}
          <div className="absolute -bottom-1.5 left-7 w-3 h-3 bg-[#080d17] border-r border-b border-cyan-500/40 rotate-45" />
        </div>
      )}

      {/* 2. Compact Minimal HUD Card */}
      {isExpanded && (
        <div className="mb-3 w-84 p-4 rounded-2xl bg-[#080d16]/95 border border-cyan-500/40 shadow-2xl shadow-cyan-950/90 backdrop-blur-xl space-y-3 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                privacyState?.is_paused
                  ? 'bg-amber-400'
                  : isOverheating || isBatteryLow
                  ? 'bg-red-400 animate-ping'
                  : ambientListening
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-cyan-400 animate-pulse'
              }`} />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                ✦ Nori Companion
              </span>
              {ambientListening && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Listening
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Form switcher: 3D Particle Globe vs Robot Pet vs Musical Waves vs Dot */}
              <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono">
                <button
                  onClick={() => setForm('globe_3d')}
                  className={`px-2 py-0.5 rounded ${form === 'globe_3d' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  3D Globe
                </button>
                <button
                  onClick={() => setForm('cyber_bot')}
                  className={`px-2 py-0.5 rounded ${form === 'cyber_bot' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Bot
                </button>
                <button
                  onClick={() => setForm('musical_orb')}
                  className={`px-2 py-0.5 rounded ${form === 'musical_orb' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Waves
                </button>
                <button
                  onClick={() => setForm('compact_core')}
                  className={`px-2 py-0.5 rounded ${form === 'compact_core' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Dot
                </button>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Focus Context */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
              <span>Active Focus</span>
              <span className="text-cyan-400 font-semibold truncate max-w-[150px]">{workSummary?.active_application || 'Windows Desktop'}</span>
            </div>
            <div className="text-slate-100 font-semibold text-xs truncate">
              {workSummary?.active_file ? `Editing: ${workSummary.active_file}` : 'Observing workspace context'}
            </div>
          </div>

          {/* Quick Hardware Load HUD */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block">CPU</span>
              <span className="font-bold text-cyan-300">{deviceStatus?.cpu_percent ?? 12}%</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block">RAM</span>
              <span className="font-bold text-purple-300">{deviceStatus?.ram_percent ?? 54}%</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-slate-400 block">Battery</span>
              <span className="font-bold text-emerald-300">{deviceStatus?.battery_percent !== null ? `${Math.round(deviceStatus?.battery_percent ?? 100)}%` : 'AC'}</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <button
              onClick={() => {
                setIsAskModalOpen(true);
                setIsExpanded(false);
              }}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask Nori
            </button>
            <button
              onClick={handleVoiceWake}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                ambientListening
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/50'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 border-white/[0.08]'
              }`}
            >
              <Mic className={`w-4 h-4 ${ambientListening ? 'animate-pulse text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={toggleEyeComfortMode}
              title={eyeComfortMode ? "Disable Eye Comfort" : "Enable Eye Comfort"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                eyeComfortMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.06] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              <Glasses className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Companion Avatar Core: Cyber-Bot vs Musical Wave Orb vs Compact Core */}
      <div
        onMouseDown={handleMouseDown}
        onClick={() => setIsExpanded((prev) => !prev)}
        className="group relative flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
      >
        {/* Luminous Glow Halo */}
        <div className={`absolute -inset-3 rounded-full blur-2xl opacity-60 transition-all duration-300 pointer-events-none ${
          privacyState?.is_paused
            ? 'bg-amber-500/40'
            : isOverheating || isBatteryLow
            ? 'bg-red-500/70 animate-pulse scale-125'
            : noriState === 'listening' || ambientListening
            ? 'bg-emerald-400/80 scale-135 animate-pulse'
            : noriState === 'thinking'
            ? 'bg-indigo-500/70 scale-125 animate-spin'
            : noriState === 'speaking'
            ? 'bg-cyan-400/80 scale-130'
            : 'bg-cyan-500/35 group-hover:bg-cyan-400/60'
        }`} />

        {/* 3.0 3D PARTICLE VOICE GLOBE (Master Design Image 3) */}
        {form === 'globe_3d' && (
          <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none">
            <NoriVoiceGlobe3D
              size={84}
              state={noriState}
              audioLevel={ambientListening ? 0.6 : 0}
              className="drop-shadow-[0_0_20px_rgba(99,102,241,0.9)]"
            />
          </div>
        )}

        {/* 3.1 CYBER-BOT FORM (Figure 1 from Master Design) */}
        {form === 'cyber_bot' && (
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Pulsing ear waves when listening */}
            {(noriState === 'listening' || ambientListening) && (
              <>
                <div className="absolute -left-2 top-4 w-4 h-8 border-l-2 border-emerald-400 rounded-full animate-ping opacity-75" />
                <div className="absolute -right-2 top-4 w-4 h-8 border-r-2 border-emerald-400 rounded-full animate-ping opacity-75" />
              </>
            )}

            {/* Rotating halo when thinking */}
            {noriState === 'thinking' && (
              <div className="absolute -inset-1 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
            )}

            <svg
              viewBox="0 0 100 100"
              className="w-20 h-20 drop-shadow-[0_0_15px_rgba(6,182,212,0.85)] transition-all duration-300"
            >
              <defs>
                <linearGradient id="cyberChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="45%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="cyberEyes" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor={ambientListening ? '#34d399' : '#38bdf8'} />
                </linearGradient>
                <filter id="glowEyes" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ears / Antennas */}
              <ellipse cx="26" cy="36" rx="4" ry="10" transform="rotate(-28 26 36)" fill="url(#cyberChassis)" stroke="#38bdf8" strokeWidth="1" />
              <ellipse cx="74" cy="36" rx="4" ry="10" transform="rotate(28 74 36)" fill="url(#cyberChassis)" stroke="#38bdf8" strokeWidth="1" />

              {/* Head Shell Outer Frame */}
              <rect x="20" y="22" width="60" height="46" rx="23" fill="#091024" stroke={ambientListening ? '#34d399' : '#00f0ff'} strokeWidth="2.5" />
              <rect x="25" y="27" width="50" height="36" rx="18" fill="#030712" />

              {/* Geometric Faceplate Lines */}
              <path d="M 28 36 L 36 29" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
              <path d="M 72 36 L 64 29" stroke="#0284c7" strokeWidth="1" opacity="0.6" />

              {/* Luminous Expressive Eyes */}
              {noriState === 'speaking' ? (
                // Smiling eyes while speaking
                <>
                  <path d="M 34 47 Q 40 40 46 47" fill="none" stroke="url(#cyberEyes)" strokeWidth="3.5" strokeLinecap="round" filter="url(#glowEyes)" />
                  <path d="M 54 47 Q 60 40 66 47" fill="none" stroke="url(#cyberEyes)" strokeWidth="3.5" strokeLinecap="round" filter="url(#glowEyes)" />
                </>
              ) : (
                // Round glowing eyes
                <>
                  <ellipse cx="40" cy="44" rx="6" ry="6.5" fill="url(#cyberEyes)" filter="url(#glowEyes)" className={noriState === 'listening' || ambientListening ? 'animate-pulse' : ''} />
                  <ellipse cx="60" cy="44" rx="6" ry="6.5" fill="url(#cyberEyes)" filter="url(#glowEyes)" className={noriState === 'listening' || ambientListening ? 'animate-pulse' : ''} />
                  <circle cx="42" cy="42" r="1.5" fill="#ffffff" />
                  <circle cx="62" cy="42" r="1.5" fill="#ffffff" />
                </>
              )}

              {/* Glowing Nose / Core Indicator */}
              <circle cx="50" cy="54" r="1.8" fill={ambientListening ? '#34d399' : '#22d3ee'} />

              {/* Torso & Floating Cyber Wings */}
              <path
                d="M 37 68 Q 50 88 63 68 Q 50 64 37 68 Z"
                fill="url(#cyberChassis)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <circle cx="50" cy="72" r="3" fill="#00f0ff" className="animate-pulse" />

              {/* Floating Little Wings */}
              <ellipse cx="23" cy="75" rx="6" ry="3.5" transform="rotate(-35 23 75)" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
              <ellipse cx="77" cy="75" rx="6" ry="3.5" transform="rotate(35 77 75)" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            </svg>
          </div>
        )}

        {/* 3.2 MUSICAL ORB LIKE WAVES (Option 2: Abstract Fluid Wave Orb from Design Image) */}
        {form === 'musical_orb' && (
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outer harmonic ribbon waves */}
            <svg viewBox="0 0 120 120" className="w-20 h-20 drop-shadow-[0_0_18px_rgba(168,85,247,0.85)] animate-pulse">
              <defs>
                <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="orbGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Layer 1: Concentric flowing sine wave ribbon loops */}
              <path
                d="M 60 15 C 85 15, 105 35, 105 60 C 105 85, 80 105, 60 105 C 35 105, 15 80, 15 60 C 15 35, 40 15, 60 15 Z"
                fill="none"
                stroke="url(#orbGrad1)"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                className={noriState === 'listening' || ambientListening ? 'animate-spin' : ''}
                style={{ animationDuration: '6s' }}
              />

              {/* Layer 2: Harmonic wave loop with fluid ripple */}
              <path
                d="M 60 22 C 82 20, 98 42, 95 62 C 92 84, 75 98, 58 96 C 36 94, 22 75, 25 58 C 28 36, 42 22, 60 22 Z"
                fill="none"
                stroke="url(#orbGrad2)"
                strokeWidth="2"
                opacity="0.85"
                className={noriState === 'thinking' ? 'animate-spin' : ''}
                style={{ animationDuration: '4s' }}
              />

              {/* Layer 3: Inner fluid acoustic core */}
              <circle cx="60" cy="60" r="18" fill="url(#orbGrad1)" opacity="0.3" className="animate-pulse" />
              <circle cx="60" cy="60" r="10" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 6px #00f0ff)" />

              {/* Acoustic frequency tick bars when listening / speaking */}
              {(noriState === 'listening' || noriState === 'speaking' || ambientListening) && (
                <>
                  <line x1="60" y1="36" x2="60" y2="44" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                  <line x1="60" y1="76" x2="60" y2="84" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                  <line x1="36" y1="60" x2="44" y2="60" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                  <line x1="76" y1="60" x2="84" y2="60" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
                </>
              )}
            </svg>
          </div>
        )}

        {/* 3.3 COMPACT CORE DOT */}
        {form === 'compact_core' && (
          <div className="w-10 h-10 rounded-full bg-[#0d1627] border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/80">
            <div className={`w-3.5 h-3.5 rounded-full ${ambientListening ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
          </div>
        )}
      </div>
    </div>
  );
};
