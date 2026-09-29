import React, { useState } from 'react';
import { useNori } from '../../context/NoriContext';
import {
  Mic,
  Camera,
  Layers,
  Folder,
  Network,
  Check,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../common/ToastModalProvider';

export const PermissionsSetupView: React.FC = () => {
  const { privacyState, updatePermissions, setActiveView, login, userProfile } = useNori();
  const { showPrompt, showToast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string>('C:/Users/Projects/NoriWorkspace');

  const handleFolderSelect = () => {
    showPrompt({
      title: 'Select Project Folder',
      message: 'Enter your primary project directory path:',
      placeholder: 'C:/Users/Projects/NoriWorkspace',
      defaultValue: selectedFolder,
      confirmLabel: 'Set Folder',
      onConfirm: (custom) => {
        if (custom.trim()) {
          setSelectedFolder(custom.trim());
          showToast(`Project folder set to: ${custom.trim()}`, 'success');
        }
      }
    });
  };

  const handleContinue = () => {
    login();
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 select-none font-sans relative overflow-y-auto">
      {/* ChitSetu Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 p-[1px] shadow-lg shadow-orange-500/30">
            <div className="w-full h-full bg-[#0d0f17] rounded-[11px] flex items-center justify-center">
              <div className="w-3.5 h-3.5 rotate-45 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-[2px]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-wider text-white font-mono">NORI</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">System Permissions Setup</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs text-orange-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-bold">Step 2 of 5</span>
          </div>
          <button
            onClick={() => setActiveView('home')}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Main Expansive 2-Column Grid: Fully Utilizes Viewport Height */}
      <main className="relative z-10 w-full max-w-7xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 my-auto">
        {/* Left Column: Progress Stepper & Hardware Isolation Shield (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-7 rounded-3xl bg-[#0d101a] border border-white/[0.08] shadow-2xl space-y-6">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-orange-400 uppercase font-bold">
                Setup Progress
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                Workspace Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your environment for hardware-accelerated assistance.
              </p>
            </div>

            {/* Stepper Steps */}
            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-300 p-3 rounded-2xl bg-white/[0.02] border border-emerald-500/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {userProfile?.name || 'Ambica'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono truncate">
                      {userProfile?.email || 'ambica@workspace.local'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('onboarding')}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono text-slate-300 transition-colors shrink-0"
                >
                  Change Profile
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-orange-400">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-orange-500/30 shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-orange-300 text-sm">Hardware Permissions</div>
                  <div className="text-[11px] text-orange-400/80 font-mono">Active Configuration</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] text-slate-500 flex items-center justify-center font-bold text-xs border border-white/[0.06] shrink-0">
                  3
                </div>
                <div>
                  <div className="font-medium text-slate-400 text-sm">Project Workspace</div>
                  <div className="text-[11px] text-slate-500 font-mono">Select workspace path</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] text-slate-500 flex items-center justify-center font-bold text-xs border border-white/[0.06] shrink-0">
                  4
                </div>
                <div>
                  <div className="font-medium text-slate-400 text-sm">3D Companion Pet</div>
                  <div className="text-[11px] text-slate-500 font-mono">Personalize voice avatar</div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Isolation Callout Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/25 text-xs text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm">Hardware Isolation Shield</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every toggle operates purely on your local Windows DirectML / ONNX runtime. Zero audio, video frames, or files are sent outside this PC.
            </p>
          </div>
        </div>

        {/* Right Column: Permission Cards Grid (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-7 rounded-3xl bg-[#0d101a] border border-white/[0.08] shadow-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">
                Access Feeds
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                Grant Local System Access
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Select which on-device streams Nori can analyze to provide real-time contextual assistance.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {/* 1. Microphone Feed */}
              <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-orange-500/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 shrink-0">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-white">Continuous Voice Input</h3>
                      <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 text-[10px] font-mono font-bold">
                        DirectML Whisper
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Enables spoken queries, interactive voice discussions, and hands-free canvas commands.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ microphone_enabled: !privacyState?.microphone_enabled })}
                  className={`w-14 h-7 rounded-full transition-colors cursor-pointer p-0.5 shrink-0 ${
                    privacyState?.microphone_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      privacyState?.microphone_enabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 2. Camera & Physical Desk Stream */}
              <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-white">Physical Desk & Camera Vision</h3>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-mono font-bold">
                        OpenCV + YOLO
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Inspects circuit boards, whiteboard sketches, and physical hardware components in real-time.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ camera_enabled: !privacyState?.camera_enabled })}
                  className={`w-14 h-7 rounded-full transition-colors cursor-pointer p-0.5 shrink-0 ${
                    privacyState?.camera_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      privacyState?.camera_enabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3. Screen Context & Active Window */}
              <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-cyan-500/30 transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-white">Active App & Code Context</h3>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold">
                        Win32 GUI API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Reads titles of active IDEs and browser tabs to provide contextual development assistance automatically.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ screen_capture_enabled: !privacyState?.screen_capture_enabled })}
                  className={`w-14 h-7 rounded-full transition-colors cursor-pointer p-0.5 shrink-0 ${
                    privacyState?.screen_capture_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      privacyState?.screen_capture_enabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. Project Workspace Directory */}
              <div className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-all flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white">Default Projects Directory</h3>
                    <p className="text-xs text-slate-400 font-mono truncate mt-1">{selectedFolder}</p>
                  </div>
                </div>
                <button
                  onClick={handleFolderSelect}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-white border border-white/[0.08] cursor-pointer transition-colors shrink-0"
                >
                  Browse...
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => setActiveView('onboarding')}
              className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
            >
              ← Back to Sign-in
            </button>
            <button
              onClick={handleContinue}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white text-sm font-bold transition-all shadow-xl shadow-orange-500/30 flex items-center gap-2 cursor-pointer"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-orange-400" />
          <span>Strict Local Execution • No telemetry transmitted without explicit confirmation</span>
        </div>
        <div className="font-mono text-[11px]">NORI OS v2.4</div>
      </footer>
    </div>
  );
};


