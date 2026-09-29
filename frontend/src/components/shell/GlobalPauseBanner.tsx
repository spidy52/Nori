import React from 'react';
import { useNori } from '../../context/NoriContext';
import { ShieldAlert, Play, EyeOff, MicOff, Network } from 'lucide-react';

export const GlobalPauseBanner: React.FC = () => {
  const { privacyState, handleTogglePause } = useNori();

  if (!privacyState?.is_paused) return null;

  return (
    <div className="w-full bg-slate-900/95 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between z-50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Nori Global Pause Active
            </span>
            <span className="text-[11px] text-slate-400">
              All sensors and context observation are completely halted.
            </span>
          </div>
          <div className="flex items-center gap-4 mt-0.5 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1"><EyeOff className="w-3 h-3 text-red-400" /> Camera OFF</span>
            <span className="flex items-center gap-1"><MicOff className="w-3 h-3 text-red-400" /> Microphone OFF</span>
            <span className="flex items-center gap-1"><Network className="w-3 h-3 text-red-400" /> Network PAUSED</span>
            <span>Nothing is being observed</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleTogglePause}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        Resume Nori
      </button>
    </div>
  );
};
