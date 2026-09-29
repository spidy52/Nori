import React from 'react';
import { useNori, NavView } from '../../context/NoriContext';
import {
  Home,
  Plus,
  Bot,
  Sparkles,
  Layers
} from 'lucide-react';

interface NoriSideRailProps {
  onOpenNewBoard: () => void;
}

export const NoriSideRail: React.FC<NoriSideRailProps> = ({ onOpenNewBoard }) => {
  const { activeView, setActiveView } = useNori();

  return (
    <div className="w-16 h-screen bg-[#04060a] border-r border-white/[0.06] flex flex-col items-center py-5 justify-between select-none z-50 flex-shrink-0">
      {/* Top: Home / Whiteboard & New Workspace buttons */}
      <div className="flex flex-col items-center gap-5 w-full">
        {/* Active Home / Whiteboard icon with left white pill highlight */}
        <div className="relative flex items-center justify-center w-full">
          {activeView === 'whiteboard' && (
            <div className="absolute left-0 w-1.5 h-7 bg-white rounded-r-full" />
          )}
          
          <button
            onClick={() => setActiveView('whiteboard')}
            title="Nori AI Whiteboard Workspace"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeView === 'whiteboard'
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Subtle separator */}
        <div className="w-6 h-[1px] bg-white/[0.12]" />

        {/* Plus: Quick New Canvas */}
        <button
          onClick={onOpenNewBoard}
          title="New Whiteboard Canvas"
          className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {/* Floating Companion Quick Toggle */}
        <button
          onClick={() => setActiveView(activeView === 'companion' ? 'whiteboard' : 'companion')}
          title="Floating Desktop Companion"
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
            activeView === 'companion'
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-950/40'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400 hover:text-cyan-300'
          }`}
        >
          <Bot className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom status dot */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20 animate-pulse"
          title="Nori AI Companion Active"
        />
      </div>
    </div>
  );
};
