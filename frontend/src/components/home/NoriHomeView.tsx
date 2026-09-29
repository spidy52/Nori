import React, { useState } from 'react';
import { useNori } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import {
  Search,
  Bell,
  Folder,
  ArrowRight,
  MessageSquare,
  Layout,
  Camera,
  FileText,
  Plus,
  Play,
  FileCode,
  Terminal,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  Heart,
  Tag,
  Check,
  Bot,
  X
} from 'lucide-react';
import { useToast } from '../common/ToastModalProvider';
import { voiceEngine } from '../../services/voice';

export const NoriHomeView: React.FC = () => {
  const {
    workSummary,
    userProfile,
    updateUserProfile,
    setActiveView,
    openAskWithQuery
  } = useNori();

  const { showToast } = useToast();

  const PRESET_INTERESTS = [
    '🍳 Cooking & Healthy Recipes',
    '🏋️ Gym, Workouts & Fitness',
    '📚 Reading & Books',
    '🎬 Movies & Series Suggestions',
    '💧 Hydration & Mindful Breaks',
    '🌿 Daily Well-being Check-ins',
    '🤖 AI Models & Neural Networks',
    '💻 Snapdragon NPU & DirectML',
    '📱 Web & Mobile Applications',
    '⚡ Python & System Automation'
  ];

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    userProfile?.interests || ['AI Models & Neural Networks', 'Snapdragon NPU & DirectML']
  );
  const [customInput, setCustomInput] = useState('');
  const [showInterestsCard, setShowInterestsCard] = useState(true);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) => {
      const next = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
      updateUserProfile({ interests: next });
      return next;
    });
  };

  const handleAddCustomInterest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;
    const item = customInput.trim();
    if (!selectedInterests.includes(item)) {
      const next = [...selectedInterests, item];
      setSelectedInterests(next);
      updateUserProfile({ interests: next });
      showToast(`Added interest: "${item}"`, 'success');
      voiceEngine.speak(`Added "${item}" to your companion preferences! I will proactively help you build projects in this area.`);
    }
    setCustomInput('');
  };

  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = () => {
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: String(Date.now()), text: newTaskInput.trim(), done: false }
    ]);
    setNewTaskInput('');
    setShowTaskInput(false);
  };

  const currentProjectName = workSummary?.project_name || null;
  const currentTaskText = workSummary?.current_task || null;
  const activeFile = workSummary?.active_file || null;
  const digitalContexts = workSummary?.digital_context || [];

  return (
    <div className="nori-page">
      {/* 1. Header */}
      <PageHeader
        title={`Good evening, ${userProfile?.name?.split(' ')[0] || 'User'}`}
        subtitle="Here's your active workspace overview and context status."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-[#141724] border border-white/[0.08] text-xs w-64 shadow-inner focus-within:border-orange-500/40">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search workspace (Ctrl+K)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openAskWithQuery((e.target as HTMLInputElement).value);
                }}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            <button
              onClick={() => openAskWithQuery('Show recent system updates')}
              className="p-2 rounded-md bg-[#141724] border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* 2. Main Content Grid - Full Width & Height Utilization */}
      <div className="nori-page-content">
        {/* PROACTIVE COMPANION INTEREST SELECTION CARD */}
        {showInterestsCard && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#121628] via-[#181c32] to-[#0e1220] border border-orange-500/35 shadow-2xl space-y-4 relative mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Tell Nori What You're Interested In
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[9px] font-bold">
                      Companion Memory
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Select your primary topics so Nori can proactively suggest ideas, help build projects, and discuss them during work.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInterestsCard(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                title="Minimize Card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interest Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 font-bold'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5 opacity-60" />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddCustomInterest} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom interest or project goal (e.g. YOLO vision, Arduino, Next.js)..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500/50"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* Left Column: Current Work & Recent Activity (7 cols on lg, 12 on mobile) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* CURRENT WORK CARD */}
            <div className="nori-card flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Current Focus
                </span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                  Local Context Graph
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Active Project</span>
                  <h3 className="text-base font-bold text-white text-wrap-safe">
                    {currentProjectName || 'No active project detected'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
                    {currentTaskText || 'Open a project folder or launch an application to begin indexing.'}
                  </p>
                  {activeFile && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span>{activeFile}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveView('projects')}
                  className="nori-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentProjectName ? 'Switch Project' : 'Create / Open Project'}</span>
                </button>
                <button
                  onClick={() => openAskWithQuery('Resume my work where I left off')}
                  className="nori-btn-secondary"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume State</span>
                </button>
              </div>
            </div>

            {/* RECENT ACTIVITY CARD */}
            <div className="nori-card flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Recent Activity
                </span>
                <button
                  onClick={() => setActiveView('timeline')}
                  className="text-xs text-orange-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {digitalContexts.length === 0 ? (
                <div className="p-8 rounded-md bg-white/[0.01] border border-white/[0.04] text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2 flex-1 min-h-[140px]">
                  <Layers className="w-6 h-6 text-slate-500" />
                  <p>No recent activity recorded yet.</p>
                  <span className="text-[11px] text-slate-400">Activity will appear automatically as you work.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  {digitalContexts.map((act, idx) => (
                    <div
                      key={idx}
                      className="h-12 px-4 rounded-md bg-[#101422] border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-between text-wrap-safe transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="font-semibold text-slate-200 truncate">{act}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono shrink-0 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions & Ongoing Tasks (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* QUICK ACTIONS CARD - Rich 2x2 Modern Grid */}
            <div className="nori-card flex flex-col gap-5" style={{ padding: '24px 28px' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Quick Actions
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400">
                  Direct Launcher
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Start a Chat */}
                <button
                  onClick={() => setActiveView('chat')}
                  className="p-5 rounded-md bg-[#101422] hover:bg-orange-500/10 border border-white/[0.06] hover:border-orange-500/40 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group shadow-sm min-h-[125px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-md bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-200">Start a Chat</h4>
                    <p className="text-xs text-slate-400 mt-1">Multi-modal AI assistance</p>
                  </div>
                </button>

                {/* 2. Open Canvas */}
                <button
                  onClick={() => setActiveView('canvas')}
                  className="p-5 rounded-md bg-[#101422] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/40 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group shadow-sm min-h-[125px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                      <Layout className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-200">Open Canvas</h4>
                    <p className="text-xs text-slate-400 mt-1">Interactive architecture studio</p>
                  </div>
                </button>

                {/* 3. Use Camera */}
                <button
                  onClick={() => setActiveView('physical')}
                  className="p-5 rounded-md bg-[#101422] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/40 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group shadow-sm min-h-[125px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-200">Use Camera</h4>
                    <p className="text-xs text-slate-400 mt-1">Live OpenCV vision inspector</p>
                  </div>
                </button>

                {/* 4. Create Note / Memory */}
                <button
                  onClick={() => setActiveView('memory')}
                  className="p-5 rounded-md bg-[#101422] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/40 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group shadow-sm min-h-[125px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="w-10 h-10 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-200">Create Note</h4>
                    <p className="text-xs text-slate-400 mt-1">Vector memory & snippets</p>
                  </div>
                </button>
              </div>
            </div>

            {/* LIFE & WELLNESS COMPANION CARD */}
            <div className="nori-card flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Personal Life & Companion
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20">
                  Care & Wellness
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openAskWithQuery('Check on me - how am I doing with food and water today?')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">🌿 Check On Me</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-rose-200">Daily wellness check</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAskWithQuery('Water and hydration check on me')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/[0.06] hover:border-cyan-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">💧 Hydration Check</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-cyan-200">Drink water reminder</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAskWithQuery('Suggest quick healthy meal recipes for me')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">🍳 Cooking & Food</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-200">15-min meal ideas</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAskWithQuery('Give me a 5-minute gym stretch and workout routine')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-emerald-500/10 border border-white/[0.06] hover:border-emerald-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">🏋️ Gym & Fitness</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-emerald-200">Stretches & workouts</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAskWithQuery('Recommend relaxing movies for tonight')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">🎬 Movie Suggestions</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-indigo-200">Relaxation & cinema</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAskWithQuery('Suggest top books for reading & focus')}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-purple-500/10 border border-white/[0.06] hover:border-purple-500/30 text-left transition-all cursor-pointer flex flex-col gap-1 group"
                >
                  <span className="text-sm">📚 Book Reading</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-purple-200">Growth & focus reads</span>
                </button>
              </div>
            </div>

            {/* ONGOING TASKS CARD */}
            <div className="nori-card flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Ongoing Tasks
                </span>
                <button
                  onClick={() => setShowTaskInput(!showTaskInput)}
                  className="text-xs text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task</span>
                </button>
              </div>

              {showTaskInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter task description..."
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    className="flex-1 p-2 rounded-md bg-white/[0.04] border border-orange-500/40 text-xs text-white outline-none"
                    autoFocus
                  />
                  <button
                    onClick={addTask}
                    className="px-3 py-2 rounded-md bg-orange-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="p-6 rounded-md bg-white/[0.01] border border-white/[0.04] text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 flex-1 min-h-[120px]">
                  <p>No active tasks recorded.</p>
                  <span className="text-[11px] text-slate-400">Click "+ New Task" to add items to track.</span>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-start gap-2.5 p-3 rounded-md border transition-all cursor-pointer ${
                        task.done
                          ? 'bg-white/[0.01] border-white/[0.04] text-slate-500 line-through'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-200 hover:border-orange-500/30'
                      }`}
                    >
                      {task.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug text-wrap-safe">{task.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
