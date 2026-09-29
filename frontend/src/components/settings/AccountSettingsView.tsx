import React, { useState } from 'react';
import { useNori, CompanionStyle } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import { DeviceContextView } from '../device/DeviceContextView';
import { SnapdragonEngineView } from '../snapdragon/SnapdragonEngineView';
import { PrivacyCenter } from '../privacy/PrivacyCenter';
import {
  User,
  Volume2,
  Sparkles,
  Check,
  Shield,
  Save,
  Cpu,
  Zap,
  Lock,
  LogOut,
  Sliders,
  Moon,
  Sun
} from 'lucide-react';
import { Nori3DPetViewer } from '../globe/Nori3DPetViewer';
import { useToast } from '../common/ToastModalProvider';

export const AccountSettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    eyeComfortMode,
    toggleEyeComfortMode,
    logout
  } = useNori();

  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'companion' | 'device' | 'aimodels' | 'privacy' | 'voice'
  >('profile');

  const [name, setName] = useState(userProfile?.name || 'Ambica');
  const [email, setEmail] = useState(userProfile?.email || 'ambica@workspace.local');
  const [bio, setBio] = useState(userProfile?.bio || 'AI Work Companion Workspace');
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionStyle>(
    userProfile?.companionStyle || 'orb'
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

interface CompanionMeta {
  id: CompanionStyle;
  name: string;
  tag: string;
  desc: string;
  tagClass: string;
}

const CompanionBadgeVisual: React.FC<{ id: CompanionStyle }> = ({ id }) => {
  if (id === 'orb') {
    return (
      <div className="w-20 h-20 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-cyan-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent blur-sm" />
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-cyan-400 relative z-10 animate-pulse" fill="none">
          <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="24" cy="24" r="9" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="24" cy="24" r="4" fill="#a855f7" />
          <ellipse cx="24" cy="24" rx="19" ry="7" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 4" transform="rotate(-25 24 24)" />
        </svg>
      </div>
    );
  }
  if (id === 'nova') {
    return (
      <div className="w-20 h-20 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-amber-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent blur-sm" />
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-amber-400 relative z-10" fill="none">
          <polygon points="24,6 38,24 24,42 10,24" stroke="currentColor" strokeWidth="1.8" />
          <polygon points="24,14 32,24 24,34 16,24" stroke="#fbbf24" strokeWidth="1.2" fill="#f59e0b" fillOpacity="0.25" />
          <ellipse cx="24" cy="24" rx="20" ry="7" stroke="#f97316" strokeWidth="1" transform="rotate(30 24 24)" />
        </svg>
      </div>
    );
  }
  if (id === 'kuro') {
    return (
      <div className="w-20 h-20 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-purple-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-transparent blur-sm" />
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-purple-400 relative z-10" fill="none">
          <rect x="14" y="14" width="20" height="20" rx="3" stroke="#c084fc" strokeWidth="1.8" fill="#9333ea" fillOpacity="0.2" />
          <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
          <circle cx="8" cy="8" r="2.5" fill="#f43f5e" />
          <circle cx="40" cy="8" r="2.5" fill="#f43f5e" />
          <circle cx="8" cy="40" r="2.5" fill="#f43f5e" />
          <circle cx="40" cy="40" r="2.5" fill="#f43f5e" />
        </svg>
      </div>
    );
  }
  if (id === 'lumi') {
    return (
      <div className="w-20 h-20 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-sky-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-cyan-500/10 to-transparent blur-sm" />
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-cyan-400 relative z-10" fill="none">
          <circle cx="24" cy="24" r="6" fill="#00f0ff" />
          <path d="M24 10 C32 10 38 16 38 24 C38 34 26 38 24 38" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 38 C16 38 10 32 10 24 C10 14 22 10 24 10" stroke="#d946ef" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="34" cy="14" r="2" fill="#fff" />
          <circle cx="14" cy="34" r="2" fill="#fff" />
        </svg>
      </div>
    );
  }
  if (id === 'rover') {
    return (
      <div className="w-20 h-20 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-blue-500/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-transparent blur-sm" />
        <svg viewBox="0 0 48 48" className="w-12 h-12 text-blue-400 relative z-10" fill="none">
          <ellipse cx="24" cy="24" rx="14" ry="12" fill="#0f172a" stroke="currentColor" strokeWidth="1.8" />
          <ellipse cx="24" cy="22" rx="9" ry="5" fill="#00f0ff" fillOpacity="0.8" />
          <circle cx="24" cy="22" r="2" fill="#fff" />
          <rect x="5" y="20" width="4" height="8" rx="2" fill="#38bdf8" />
          <rect x="39" y="20" width="4" height="8" rx="2" fill="#38bdf8" />
          <ellipse cx="24" cy="10" rx="9" ry="2.5" stroke="#38bdf8" strokeWidth="1" />
        </svg>
      </div>
    );
  }
  // sprout / bio lotus
  return (
    <div className="w-20 h-20 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center relative overflow-hidden group-hover:border-emerald-500/50 transition-colors">
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-sm" />
      <svg viewBox="0 0 48 48" className="w-12 h-12 text-emerald-400 relative z-10" fill="none">
        <circle cx="24" cy="24" r="5" fill="#10b981" />
        <ellipse cx="24" cy="15" rx="4" ry="8" stroke="currentColor" strokeWidth="1.5" fill="#34d399" fillOpacity="0.25" />
        <ellipse cx="24" cy="33" rx="4" ry="8" stroke="currentColor" strokeWidth="1.5" fill="#34d399" fillOpacity="0.25" />
        <ellipse cx="15" cy="24" rx="8" ry="4" stroke="currentColor" strokeWidth="1.5" fill="#34d399" fillOpacity="0.25" />
        <ellipse cx="33" cy="24" rx="8" ry="4" stroke="currentColor" strokeWidth="1.5" fill="#34d399" fillOpacity="0.25" />
        <circle cx="17" cy="17" r="1.5" fill="#a7f3d0" />
        <circle cx="31" cy="31" r="1.5" fill="#a7f3d0" />
      </svg>
    </div>
  );
};

  const companions: CompanionMeta[] = [
    {
      id: 'orb',
      name: 'Aura Core (Voice Orb)',
      tag: 'Bioluminescent',
      tagClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25',
      desc: 'Dynamic 2,200 particle Fibonacci fluid sphere responding in real-time to speech frequencies and hypergraph updates.'
    },
    {
      id: 'nova',
      name: 'Cyber Prism (Quantum Gem)',
      tag: 'Quantum Grid',
      tagClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      desc: 'Floating 3D multi-faceted octahedron gemstone with glowing inner core, counter-rotating wireframe lattice, and orbital rings.'
    },
    {
      id: 'kuro',
      name: 'Hyper Cube (Tesseract Matrix)',
      tag: 'Cyber Matrix',
      tagClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      desc: '4D tesseract cyber-entity with nested rotating wireframe frames, pulsating neon vertices, and data matrix trails.'
    },
    {
      id: 'lumi',
      name: 'Plasma Wisp (Cosmic Vortex)',
      tag: 'Cosmic Energy',
      tagClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
      desc: 'Swirling logarithmic dual-spiral galaxy of stardust particles orbiting a radiant starlight core with dual halo rings.'
    },
    {
      id: 'rover',
      name: 'Nexus Bot (Aero AI Drone)',
      tag: 'Autonomous Bot',
      tagClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
      desc: 'Futuristic floating AI drone sphere with an expressive digital eye visor that tracks movement, blinks, and levitating ion thrusters.'
    },
    {
      id: 'sprout',
      name: 'Bio Lotus (Sacred Bloom)',
      tag: 'Eco Harmonic',
      tagClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      desc: 'Harmonic sacred-geometry blooming energy lotus with pulsing translucent emerald petals and floating bio-spore field.'
    }
  ];

  const handleSave = () => {
    updateUserProfile({
      name,
      email,
      bio,
      companionStyle: selectedCompanion
    });

    // Explicit direct push to backend companion sync
    try {
      fetch('http://127.0.0.1:8000/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companion: selectedCompanion })
      }).catch(() => {});
    } catch (e) {}

    setSavedFeedback(true);
    const compName = companions.find((c) => c.id === selectedCompanion)?.name || 'AI Companion';
    showToast(`Preferences saved! Desktop floating pet set to ${compName}.`, 'success');
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="nori-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Settings & System Hub"
        subtitle="Manage user credentials, 3D companion avatars, hardware telemetry, AI engine, and security."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="nori-btn-primary"
            >
              {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedFeedback ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        }
      />

      {/* 2. Horizontal Navigation Tabs Bar */}
      <div className="w-full flex items-center gap-2 p-1.5 rounded-md bg-white/[0.02] border border-white/[0.08] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <User className="w-4 h-4 text-indigo-400" />
          <span>User Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('companion')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'companion'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>3D Companion</span>
        </button>

        <button
          onClick={() => setActiveTab('device')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'device'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Device Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('aimodels')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'aimodels'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>AI Engine & NPU</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'voice'
              ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 font-bold border border-orange-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-purple-400" />
          <span>Voice & Audio</span>
        </button>
      </div>

      {/* 3. Tab Content Area */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto pb-8">
        {/* TAB 1: PROFILE & ACCOUNT */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="nori-card flex flex-col gap-6" style={{ padding: '28px 32px' }}>
                <div className="border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                    Developer Credentials & User Profile
                  </span>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="nori-input"
                      style={{ height: '48px', padding: '12px 18px' }}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Workspace Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="nori-input"
                      style={{ height: '48px', padding: '12px 18px' }}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Workspace Bio / Role
                    </label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="nori-input"
                      style={{ height: '48px', padding: '12px 18px' }}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="h-11 px-6 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20"
                    >
                      {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{savedFeedback ? 'Saved!' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Display & Comfort Settings */}
              <div className="nori-card flex flex-col gap-5" style={{ padding: '28px 32px' }}>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Workspace Display
                </span>

                <div className="flex items-center justify-between p-6 rounded-md bg-white/[0.02] border border-white/[0.06]">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-white block">Eye Comfort Filter</span>
                    <span className="text-xs text-slate-400">Warm ambient tone for night coding sessions</span>
                  </div>
                  <button
                    onClick={toggleEyeComfortMode}
                    className={`h-11 px-5 rounded-md text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                      eyeComfortMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:border-white/[0.16]'
                    }`}
                  >
                    {eyeComfortMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                    <span>{eyeComfortMode ? 'Comfort Active' : 'Normal'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Account Card & Log Out */}
            <div className="lg:col-span-4">
              <div className="nori-card text-center flex flex-col items-center gap-6" style={{ padding: '36px 28px' }}>
                <div className="w-20 h-20 rounded-md bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 p-[2px] mx-auto shadow-xl shadow-orange-500/20">
                  <div className="w-full h-full bg-[#121522] rounded-[4px] flex items-center justify-center font-black text-2xl text-white">
                    {name.charAt(0) || 'A'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">{name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{email}</p>
                </div>

                <div>
                  <span className="text-xs font-mono px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Authenticated Local User
                  </span>
                </div>

                <div className="w-full pt-6 border-t border-white/[0.06]">
                  <button
                    onClick={logout}
                    className="w-full h-12 px-6 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out of Workspace</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 3D COMPANION */}
        {activeTab === 'companion' && (
          <div className="space-y-8">
            <div className="p-8 rounded-lg bg-[#121522] border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="my-2">
                <Nori3DPetViewer
                  companionStyle={selectedCompanion}
                  size={280}
                  interactive={true}
                />
              </div>

              <div className="space-y-1.5 z-10 max-w-lg mt-2">
                <h3 className="text-lg font-bold text-white">
                  {companions.find((c) => c.id === selectedCompanion)?.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
                  {companions.find((c) => c.id === selectedCompanion)?.desc}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
                Choose Companion Model
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {companions.map((c) => {
                  const isSelected = selectedCompanion === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCompanion(c.id)}
                      className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                        isSelected
                          ? 'bg-[#101424] border-rose-500/80 shadow-xl shadow-rose-500/15 ring-1 ring-rose-500/40'
                          : 'bg-[#0e121d] hover:bg-[#121626] border-white/[0.08] hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white tracking-wide">{c.name}</h4>
                        <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${c.tagClass}`}>
                          {c.tag}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400 leading-relaxed min-w-0 flex-1">
                          {c.desc}
                        </p>
                        <div className="shrink-0 flex items-center justify-center">
                          <CompanionBadgeVisual id={c.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEVICE TELEMETRY */}
        {activeTab === 'device' && (
          <div className="w-full">
            <DeviceContextView embedded={true} />
          </div>
        )}

        {/* TAB 4: AI ENGINE & NPU */}
        {activeTab === 'aimodels' && (
          <div className="w-full">
            <SnapdragonEngineView embedded={true} />
          </div>
        )}

        {/* TAB 5: PRIVACY & PERMISSIONS */}
        {activeTab === 'privacy' && (
          <div className="w-full">
            <PrivacyCenter embedded={true} />
          </div>
        )}

        {/* TAB 6: VOICE & AUDIO */}
        {activeTab === 'voice' && (
          <div className="nori-card space-y-6 max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Audio Synthesis & Whisper Recognition
            </span>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Text-to-Speech Engine</span>
                  <span className="text-[11px] text-slate-400">On-device neural voice generator</span>
                </div>
                <span className="text-orange-400 font-mono font-bold">Local NPU TTS Engine</span>
              </div>

              <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Speech Recognition Provider</span>
                  <span className="text-[11px] text-slate-400">Streaming microphone voice transcription</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold">Whisper ONNX Local</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
