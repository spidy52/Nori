import React, { useState } from 'react';
import { useNori } from '../../context/NoriContext';
import {
  Mic,
  Camera,
  Folder,
  Layers,
  Network,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  User,
  Laptop
} from 'lucide-react';
import { useToast } from '../common/ToastModalProvider';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { privacyState, updatePermissions, userProfile, updateUserProfile } = useNori();
  const { showToast } = useToast();
  const [step, setStep] = useState<number>(1); // 1: Welcome/Auth, 2: Permissions, 3: Complete

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none font-sans">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0a0c13] border border-white/[0.1] shadow-2xl p-8 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Soft Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 1: Welcome / Login Choice matching Image 4 Screen 1 */}
        {step === 1 && (
          <div className="space-y-6 text-center">
            {/* Glowing Geometric Obsidian Diamond */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-[1.5px] shadow-2xl shadow-orange-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0c13] rounded-[14px] flex items-center justify-center">
                <div className="w-6 h-6 rotate-45 bg-gradient-to-tr from-orange-500 to-amber-300 rounded-sm shadow-md" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">NORI</span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Your AI Workspace</h1>
              <p className="text-xs text-slate-400">Understand. Design. Build. Together.</p>
            </div>

            <div className="space-y-3 max-w-md mx-auto pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-orange-300">Continue with Account</h4>
                  <p className="text-[11px] text-slate-400">Sync your work across devices</p>
                </div>
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">Create a new account</h4>
                  <p className="text-[11px] text-slate-400">Get started with Nori</p>
                </div>
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/15 to-rose-500/10 hover:from-orange-500/25 border border-orange-500/30 text-left transition-all cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-300">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-orange-200 group-hover:text-orange-100">Continue locally</h4>
                  <p className="text-[11px] text-slate-400">Use Nori without an account</p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-4">
              <span>Why an account?</span>
              <span>·</span>
              <span className="text-slate-400">Privacy first</span>
            </div>
          </div>
        )}

        {/* Step 2: Permissions Setup matching Image 4 Screen 2 */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Step Navigation Bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-4 h-4 rounded-full bg-white/[0.1] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Welcome</span>
              </div>
              <div className="flex items-center gap-2 text-orange-400 font-bold">
                <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Permissions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-4 h-4 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px]">3</span>
                <span>Workspace</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Choose what Nori can access</h2>
              <p className="text-xs text-slate-400">You can change these anytime in Settings.</p>
            </div>

            {/* Permission Toggles matching Image 4 Screen 2 */}
            <div className="space-y-3">
              {/* Microphone */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-4 h-4 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Microphone</h4>
                    <p className="text-[10px] text-slate-400">For voice interaction</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ microphone_enabled: !privacyState?.microphone_enabled })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                    privacyState?.microphone_enabled ? 'bg-orange-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacyState?.microphone_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Camera */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Camera</h4>
                    <p className="text-[10px] text-slate-400">For physical workspace and object understanding</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ camera_enabled: !privacyState?.camera_enabled })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                    privacyState?.camera_enabled ? 'bg-orange-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacyState?.camera_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Application Context */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Application Context</h4>
                    <p className="text-[10px] text-slate-400">Understand the apps you work in</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ process_telemetry_enabled: !privacyState?.process_telemetry_enabled })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                    privacyState?.process_telemetry_enabled ? 'bg-orange-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacyState?.process_telemetry_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Project Folders */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Project Folders</h4>
                    <p className="text-[10px] text-slate-400">Select folders to include in work context</p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Folder selection opened: demo/sensor_monitoring active')}
                  className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Choose
                </button>
              </div>

              {/* Network & Collaboration */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Network className="w-4 h-4 text-slate-400" />
                  <div>
                    <h4 className="text-xs font-semibold text-white">Network & Collaboration</h4>
                    <p className="text-[10px] text-slate-400">For shared workspaces and team features</p>
                  </div>
                </div>
                <button
                  onClick={() => updatePermissions({ network_collaboration_enabled: !privacyState?.network_collaboration_enabled })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer p-0.5 ${
                    privacyState?.network_collaboration_enabled ? 'bg-orange-500' : 'bg-white/[0.1]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      privacyState?.network_collaboration_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Step 2 Actions matching Image 4 Screen 2 */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Skip for now
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
