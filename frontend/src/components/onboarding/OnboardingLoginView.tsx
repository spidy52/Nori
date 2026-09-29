import React, { useRef, useState } from 'react';
import { useNori, CompanionStyle } from '../../context/NoriContext';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Cpu,
  Lock,
  Zap,
  Camera,
  Database,
  Activity,
  User,
  ChevronDown,
  X,
  Key,
  Mail,
  UserCheck,
  CheckCircle2,
  ShieldCheck,
  Bot
} from 'lucide-react';
import { Nori3DPetViewer } from '../globe/Nori3DPetViewer';
import { useToast } from '../common/ToastModalProvider';

export const OnboardingLoginView: React.FC = () => {
  const { setActiveView, userProfile, updateUserProfile } = useNori();
  const { showToast } = useToast();

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'ambica' | 'sara' | 'custom'>('ambica');
  const [loginName, setLoginName] = useState('Ambica');
  const [loginEmail, setLoginEmail] = useState('ambica@workspace.local');
  const [loginBio, setLoginBio] = useState('AI Code Architect & Master Host');
  const [accessKey, setAccessKey] = useState('NORI-HOST-8850');
  const [selectedAvatar, setSelectedAvatar] = useState<CompanionStyle>('orb');

  const handleSelectAmbica = () => {
    setSelectedPreset('ambica');
    setLoginName('Ambica');
    setLoginEmail('ambica@workspace.local');
    setLoginBio('AI Code Architect & Master Host');
    setAccessKey('NORI-HOST-8850');
    setSelectedAvatar('orb');
  };

  const handleSelectSara = () => {
    setSelectedPreset('sara');
    setLoginName('Sara');
    setLoginEmail('sara@workspace.local');
    setLoginBio('Hardware & ML Neural Collaborator');
    setAccessKey('NORI-COLLAB-2026');
    setSelectedAvatar('nova');
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleConfirmLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginName.trim() || !loginEmail.trim()) {
      showToast('Please enter a valid profile name and email address', 'error');
      return;
    }

    updateUserProfile({
      name: loginName.trim(),
      email: loginEmail.trim(),
      bio: loginBio.trim() || 'AI Workspace Developer',
      companionStyle: selectedAvatar
    });

    try {
      localStorage.setItem('nori_access_key', accessKey.trim());
    } catch (err) {}

    showToast(`Authenticated as ${loginName.trim()} (${loginEmail.trim()})`, 'success');
    setIsLoginModalOpen(false);
    setActiveView('permissions');
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full h-screen bg-[#07090e] text-slate-100 font-sans select-none overflow-y-auto overflow-x-hidden scroll-smooth">
      {/* ChitSetu Subtle Background Grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.5) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* Ambient Gradient Glows */}
      <div className="fixed top-10 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed bottom-10 left-1/3 w-[550px] h-[550px] bg-amber-600/10 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full px-8 sm:px-16 py-5 bg-[#07090e]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-400 p-[1px] shadow-lg shadow-orange-500/30">
            <div className="w-full h-full bg-[#0d0f17] rounded-[15px] flex items-center justify-center">
              <div className="w-3.5 h-3.5 rotate-45 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-[3px]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-wider text-white font-mono">NORI</span>
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Desktop AI Studio</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-xs font-semibold text-slate-400 tracking-wide">
          <button
            onClick={() => scrollToSection(featuresRef)}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection(howItWorksRef)}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            How It Works
          </button>
          <button
            onClick={() => setActiveView('home')}
            className="hover:text-white transition-colors cursor-pointer py-1"
          >
            Workspace
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={handleOpenLoginModal}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In / Get Started</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO (ChitSetu Screenshot 3) */}
      {/* ========================================================================= */}
      <section
        ref={heroRef}
        className="relative z-10 max-w-7xl mx-auto px-8 sm:px-16 min-h-[92vh] flex flex-col justify-center py-20 lg:py-28"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-8">
            {/* Platform Tag */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span>LIVE PLATFORM</span>
            </div>

            {/* Grand Headline */}
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.08]">
              AI Workspace, <br />
              <span className="text-orange-500">reimagined.</span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              A transparent, digital AI workspace powered by machine learning risk scoring, real-time DirectML neural inference, physical circuit camera inspection, and bank-grade secure privacy.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center gap-5 pt-3 flex-wrap">
              <button
                onClick={handleOpenLoginModal}
                className="px-8 py-4 rounded-2xl bg-[#fa5438] hover:bg-[#e03b20] text-white text-sm font-bold transition-all shadow-xl shadow-orange-500/30 flex items-center gap-2.5 cursor-pointer active:scale-95"
              >
                <span>Get Started & Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection(featuresRef)}
                className="px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-sm font-semibold transition-all cursor-pointer"
              >
                Learn More
              </button>
            </div>

            {/* Trust Badges Bar */}
            <div className="flex items-center gap-3 pt-6 flex-wrap text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Lock className="w-4 h-4 text-orange-400" />
                <span>256-bit AES</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Shield className="w-4 h-4 text-orange-400" />
                <span>Zero-Cloud Upload</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Database className="w-4 h-4 text-orange-400" />
                <span>Local SQLite</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>DirectML Accelerated</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Card with Orbiting Chips */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md p-8 rounded-3xl bg-[#10131f]/95 border border-white/[0.08] shadow-2xl space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

              {/* Status Header */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-300 font-mono text-[10px] font-bold">
                  ● ML Powered
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono text-[10px] font-bold">
                  ● Real-time
                </span>
              </div>

              {/* 3D Orb Display */}
              <div className="flex justify-center py-4">
                <Nori3DPetViewer
                  companionStyle={userProfile?.companionStyle || 'orb'}
                  size={240}
                  interactive={true}
                />
              </div>

              {/* Simulated Workspace Card Details */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">ENGINE</span>
                  <span className="text-orange-400 font-bold">DirectML NPU v2.4</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">DEVELOPER</span>
                  <span className="text-white font-bold">{userProfile?.name || 'Ambica'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          onClick={() => scrollToSection(featuresRef)}
          className="flex flex-col items-center gap-1.5 pt-12 cursor-pointer group opacity-60 hover:opacity-100 transition-opacity"
        >
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">SCROLL</span>
          <ChevronDown className="w-4 h-4 text-orange-400 animate-bounce" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: EVERYTHING YOU NEED (ChitSetu Screenshot 2) */}
      {/* ========================================================================= */}
      <section
        ref={featuresRef}
        className="relative z-10 max-w-7xl mx-auto px-8 sm:px-16 py-32 sm:py-40 border-t border-white/[0.06] space-y-20 min-h-[85vh] flex flex-col justify-center"
      >
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FEATURES</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Everything you need to <span className="text-orange-500">manage workspace</span>
          </h2>

          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Built with cutting-edge on-device technology for maximum transparency, security, and neural speed.
          </p>
        </div>

        {/* 4 Large Distinct Spacious Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between gap-8 shadow-xl min-h-[280px] group">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                ML Risk Scoring
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI-powered trust and code assessment using local AST parsing and DirectML tensor models with zero external cloud latency.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between gap-8 shadow-xl min-h-[280px] group">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Zap className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                Real-time Inference
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live sub-second neural execution with hardware accelerated NPU tensor cores and instant WebSocket telemetry updates.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between gap-8 shadow-xl min-h-[280px] group">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                Physical Vision
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time OpenCV and YOLO circuit inspection for hardware breadboards and physical desk components right in front of you.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between gap-8 shadow-xl min-h-[280px] group">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
              <Database className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
                Local Records
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All timeline logs, memory graphs, and IDE work sessions are stored on-device in immutable SQLite with full privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: GET STARTED IN 3 SIMPLE STEPS (ChitSetu Screenshot 4) */}
      {/* ========================================================================= */}
      <section
        ref={howItWorksRef}
        className="relative z-10 max-w-7xl mx-auto px-8 sm:px-16 py-32 sm:py-40 border-t border-white/[0.06] space-y-20 min-h-[85vh] flex flex-col justify-center"
      >
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5" />
            <span>HOW IT WORKS</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Get started in <span className="text-orange-500">3 simple steps</span>
          </h2>

          <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Frictionless on-device setup with no mandatory cloud account or external dependencies.
          </p>
        </div>

        {/* 3 Spacious Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 01 */}
          <div className="relative p-10 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 space-y-6 overflow-hidden group shadow-xl min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
            <div className="absolute top-6 right-8 text-7xl font-black text-white/[0.04] font-mono pointer-events-none group-hover:text-orange-500/15 transition-colors">
              01
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                  STEP 01
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Create Profile & Auth</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Set up your developer credentials, configure local storage directories, and establish your zero-trust encryption keys.
                </p>
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="relative p-10 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 space-y-6 overflow-hidden group shadow-xl min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
            <div className="absolute top-6 right-8 text-7xl font-black text-white/[0.04] font-mono pointer-events-none group-hover:text-orange-500/15 transition-colors">
              02
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                  STEP 02
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Grant Sensor Feeds</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Enable local microphone listening, physical camera vision analysis, and real-time active IDE window observation.
                </p>
              </div>
            </div>
          </div>

          {/* Step 03 */}
          <div className="relative p-10 rounded-3xl bg-[#0e111c] border border-white/[0.08] hover:border-orange-500/40 transition-all duration-300 space-y-6 overflow-hidden group shadow-xl min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
            <div className="absolute top-6 right-8 text-7xl font-black text-white/[0.04] font-mono pointer-events-none group-hover:text-orange-500/15 transition-colors">
              03
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                  STEP 03
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Build & Synthesize</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Use your local AI companion to pair program, debug hardware circuits, synthesize studio blueprints, and track timelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: READY TO GET STARTED CTA CARD (ChitSetu Screenshot 1) */}
      {/* ========================================================================= */}
      <section
        ref={ctaRef}
        className="relative z-10 max-w-4xl mx-auto px-8 py-32 sm:py-40 min-h-[75vh] flex flex-col justify-center items-center"
      >
        <div className="relative w-full p-12 sm:p-20 rounded-3xl bg-[#0d101a] border border-white/[0.08] shadow-2xl text-center space-y-8 overflow-hidden">
          {/* Top glowing orange line matching ChitSetu */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500" />

          {/* Glowing Star Icon */}
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Join thousands of developers who are using Nori to manage their AI workspace transparently and securely.
            </p>
          </div>

          <div className="flex items-center justify-center gap-5 pt-3 flex-wrap">
            <button
              onClick={handleOpenLoginModal}
              className="px-8 py-4 rounded-2xl bg-[#fa5438] hover:bg-[#e03b20] text-white text-sm font-bold shadow-xl shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('home')}
              className="px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-sm font-semibold transition-all cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 w-full py-12 border-t border-white/[0.06] text-center text-xs text-slate-500 font-mono">
        © 2026 Nori Desktop AI Suite. Built for on-device privacy and transparent workspace management.
      </footer>

      {/* ========================================================================= */}
      {/* INTERACTIVE PROFILE LOGIN & AUTHENTICATION MODAL */}
      {/* ========================================================================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0d0f17] border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 my-auto">
            {/* Top Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[11px] font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>STEP 1: DEVELOPER AUTHENTICATION</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Sign In to Nori Workspace
                </h3>
                <p className="text-xs text-slate-400">
                  Select a pre-configured developer profile or enter custom credentials.
                </p>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profile Presets */}
            <div className="space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Quick Profile Presets:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Profile 1: Ambica */}
                <button
                  type="button"
                  onClick={handleSelectAmbica}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedPreset === 'ambica'
                      ? 'bg-orange-500/15 border-orange-500/60 shadow-lg shadow-orange-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Ambica</span>
                      <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[9px] font-bold">
                        Host
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">ambica@workspace.local</p>
                    <p className="text-[10px] text-slate-500">AI Code Architect & Master Host</p>
                  </div>
                  {selectedPreset === 'ambica' && (
                    <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                  )}
                </button>

                {/* Profile 2: Sara */}
                <button
                  type="button"
                  onClick={handleSelectSara}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                    selectedPreset === 'sara'
                      ? 'bg-orange-500/15 border-orange-500/60 shadow-lg shadow-orange-500/10'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Sara</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">
                        Collaborator
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">sara@workspace.local</p>
                    <p className="text-[10px] text-slate-500">Hardware & ML Neural Collaborator</p>
                  </div>
                  {selectedPreset === 'sara' && (
                    <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Editable Credential Inputs Form */}
            <form onSubmit={handleConfirmLogin} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-400" />
                    <span>Developer Name</span>
                  </label>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => {
                      setLoginName(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    placeholder="e.g. Ambica or Sara"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] focus:border-orange-500 focus:outline-none text-white text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    placeholder="name@domain.local"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] focus:border-orange-500 focus:outline-none text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Role / Bio</span>
                  </label>
                  <input
                    type="text"
                    value={loginBio}
                    onChange={(e) => {
                      setLoginBio(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    placeholder="Developer Role"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] focus:border-orange-500 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-orange-400" />
                    <span>Access / Security Key</span>
                  </label>
                  <input
                    type="text"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="NORI-KEYS-XXXX"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.1] focus:border-orange-500 focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Avatar Companion Selection */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-orange-400" />
                  <span>Select Companion Avatar:</span>
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {(['orb', 'nova', 'kuro', 'lumi', 'rover', 'sprout'] as CompanionStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedAvatar(style)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedAvatar === style
                          ? 'bg-orange-500/20 border-orange-500 text-white font-bold'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[11px] font-mono capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <span>Authenticate & Setup Hardware</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
