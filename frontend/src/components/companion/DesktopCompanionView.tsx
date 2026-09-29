import React, { useState, useEffect } from 'react';
import { useNori, CompanionStyle } from '../../context/NoriContext';
import { voiceEngine } from '../../services/voice';
import {
  MessageSquare,
  Layout,
  Mic,
  MicOff,
  Settings,
  Pause,
  Play,
  Sparkles,
  Command,
  Layers,
  ChevronDown,
  Monitor
} from 'lucide-react';
import { Nori3DPetViewer } from '../globe/Nori3DPetViewer';

export const DesktopCompanionView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    setActiveView,
    openAskWithQuery,
    privacyState,
    handleTogglePause,
    ambientListening,
    toggleAmbientListening,
    companionThought,
    latestVoiceTranscript
  } = useNori();

  const [companionStyle, setCompanionStyle] = useState<CompanionStyle>(
    userProfile?.companionStyle || 'orb'
  );
  const [speechText, setSpeechText] = useState<string>(
    `Hello ${userProfile?.name?.split(' ')[0] || 'there'}! I'm Nori. How can I help you right now?`
  );

  useEffect(() => {
    if (userProfile?.companionStyle) {
      setCompanionStyle(userProfile.companionStyle);
    }
  }, [userProfile?.companionStyle]);

  useEffect(() => {
    if (companionThought?.thought) {
      setSpeechText(companionThought.thought);
    }
  }, [companionThought]);

  useEffect(() => {
    if (latestVoiceTranscript) {
      setSpeechText(`Heard: "${latestVoiceTranscript}"`);
    }
  }, [latestVoiceTranscript]);

  const handlePetClick = () => {
    const name = userProfile?.name?.split(' ')[0] || 'there';
    const helloMsg = `Hello ${name}! I'm right here beside you. Ask me anything, or tell me what you'd like to do!`;
    setSpeechText(helloMsg);
    voiceEngine.speak(helloMsg);
  };

  const handleSelectStyle = (style: CompanionStyle) => {
    setCompanionStyle(style);
    updateUserProfile({ companionStyle: style });
  };

  const companions: { id: CompanionStyle; name: string; desc: string }[] = [
    { id: 'orb', name: 'Aura Orb', desc: 'Bioluminescent dynamic particle sphere' },
    { id: 'nova', name: 'Cyber Prism', desc: 'Quantum gemstone with orbital lattice' },
    { id: 'kuro', name: 'Hyper Cube', desc: 'Tesseract matrix with glowing cyber vertices' },
    { id: 'lumi', name: 'Plasma Wisp', desc: 'Cosmic particle vortex around starlight core' },
    { id: 'rover', name: 'Nexus Bot', desc: 'Floating AI drone with reactive digital visor' },
    { id: 'sprout', name: 'Bio Lotus', desc: 'Harmonic blooming lotus with bio-spore cloud' }
  ];

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#101424] via-[#090c16] to-[#05070c] flex flex-col items-center justify-between p-6 sm:p-10 select-none font-sans">
      {/* Atmospheric Landscape Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-b from-orange-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#05070c] via-[#070a13]/80 to-transparent" />
      </div>

      {/* Top Companion Selector Bar */}
      <div className="relative z-20 flex items-center gap-2 p-1.5 rounded-md bg-[#141724]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl flex-wrap justify-center max-w-full">
        <span className="text-xs font-mono text-slate-400 px-3 flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          Avatar:
        </span>
        {companions.map((comp) => (
          <button
            key={comp.id}
            onClick={() => handleSelectStyle(comp.id)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              companionStyle === comp.id
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {comp.name}
          </button>
        ))}
      </div>

      {/* Center 3D Companion with Speech Bubble */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-4 my-auto">
        {/* Dynamic Speech Bubble */}
        <div className="relative px-6 py-4 rounded-md bg-[#161a2b]/95 border border-orange-500/30 text-white text-center shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 max-w-md">
          <p className="text-sm sm:text-base font-semibold text-wrap-safe">{speechText}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#161a2b] border-r border-b border-orange-500/30 rotate-45" />
        </div>

        {/* 3D Animated Mesh */}
        <div className="py-2 cursor-pointer hover:scale-105 transition-transform" onClick={handlePetClick} title="Click to talk to your pet!">
          <Nori3DPetViewer
            companionStyle={companionStyle}
            size={320}
            interactive={true}
            isSpeaking={ambientListening}
          />
        </div>

        <p className="text-xs text-slate-400 font-mono tracking-wide text-center">
          {companions.find((c) => c.id === companionStyle)?.desc}
        </p>
      </div>

      {/* Bottom Floating Glass Action Card */}
      <div className="relative z-20 w-full max-w-md rounded-lg bg-[#131726]/95 border border-white/[0.1] shadow-2xl backdrop-blur-xl p-3 space-y-1">
        <button
          onClick={() => openAskWithQuery('')}
          className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.06] text-xs font-medium text-slate-200 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Command className="w-4 h-4 text-orange-400" />
            <span>Ask Nori</span>
          </div>
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-400">
            Ctrl+Space
          </kbd>
        </button>

        <button
          onClick={() => setActiveView('home')}
          className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.06] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Open Main Workspace</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('canvas')}
          className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.06] text-xs font-medium text-slate-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Layout className="w-4 h-4 text-cyan-400" />
            <span>Open Architecture Canvas</span>
          </div>
        </button>

        <div className="flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.06] text-xs font-medium text-slate-200 transition-colors">
          <div className="flex items-center gap-2.5">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Continuous Voice Listening</span>
          </div>
          <button
            onClick={toggleAmbientListening}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 ${
              ambientListening ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                ambientListening ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
