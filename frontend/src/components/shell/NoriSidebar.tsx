import React from 'react';
import { useNori, NavView } from '../../context/NoriContext';
import {
  Home,
  MessageSquare,
  Folder,
  Layout,
  Camera,
  Users,
  Brain,
  Clock,
  Settings,
  Sparkles,
  PauseCircle,
  PlayCircle,
  Battery,
  BatteryCharging,
  BatteryWarning,
  LifeBuoy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NoriSidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const NoriSidebar: React.FC<NoriSidebarProps> = ({
  activeView,
  onSelectView,
  isCollapsed,
  onToggleCollapse
}) => {
  const {
    deviceStatus,
    privacyState,
    userProfile,
    handleTogglePause,
    openAskWithQuery
  } = useNori();

  const isPaused = privacyState?.is_paused;
  const batteryPct = deviceStatus?.battery_percent ?? 100;
  const isBatteryLow = batteryPct <= 20 && !deviceStatus?.power_plugged;

  const allNavItems = [
    { label: 'Home', icon: <Home size={18} />, view: 'home' as NavView },
    { label: 'Chats', icon: <MessageSquare size={18} />, view: 'chat' as NavView },
    { label: 'Studio Canvas', icon: <Layout size={18} />, view: 'canvas' as NavView },
    { label: 'Physical Vision', icon: <Camera size={18} />, view: 'physical' as NavView },
    { label: 'Projects', icon: <Folder size={18} />, view: 'projects' as NavView },
    { label: 'Team Workspace', icon: <Users size={18} />, view: 'team' as NavView },
    { label: 'Memory Graph', icon: <Brain size={18} />, view: 'memory' as NavView },
    { label: 'Timeline History', icon: <Clock size={18} />, view: 'timeline' as NavView }
  ];

  const isViewActive = (view: NavView) => {
    if (activeView === view) return true;
    if (view === 'canvas' && activeView === 'whiteboard') return true;
    if (view === 'physical' && activeView === 'camera') return true;
    if (view === 'team' && activeView === 'workspace') return true;
    return false;
  };

  return (
    <aside
      className={`h-full bg-[#0a0d14] border border-white/[0.08] rounded-lg flex flex-col shrink-0 select-none z-40 transition-all duration-200 overflow-hidden shadow-xl ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* 1. BRAND & HEADER (Clean top with no profile) */}
      <div className="p-3.5 border-b border-white/[0.08] shrink-0">
        <div className={`h-11 flex items-center ${isCollapsed ? 'w-11 justify-center' : 'w-full justify-between'}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center p-1 shadow-sm shrink-0">
                  <div className="w-3 h-3 bg-white rotate-45 rounded-[1px]" />
                </div>
                <span className="font-extrabold text-sm text-white tracking-wider font-mono">
                  NORI AI
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleTogglePause}
                  title={isPaused ? 'Resume Observation' : 'Pause Observation'}
                  className={`w-8 h-8 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                    isPaused
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-[#101422] hover:bg-[#161c2e] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  {isPaused ? <PlayCircle className="w-4 h-4 text-emerald-400" /> : <PauseCircle className="w-4 h-4" />}
                </button>

                <button
                  onClick={onToggleCollapse}
                  title="Collapse Sidebar"
                  className="w-8 h-8 rounded-md bg-[#101422] hover:bg-[#161c2e] border border-white/[0.06] hover:border-white/[0.15] text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              className="w-11 h-11 rounded-md bg-[#101422] hover:bg-[#161c2e] border border-white/[0.06] hover:border-orange-500/40 text-orange-400 flex items-center justify-center cursor-pointer transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION LIST - With Profile at Bottom */}
      <div className="p-3.5 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3">
        {allNavItems.map((item) => {
          const active = isViewActive(item.view);

          return (
            <button
              key={item.label}
              onClick={() => onSelectView(item.view)}
              title={isCollapsed ? item.label : undefined}
              className={`h-11 rounded-md border flex items-center transition-all cursor-pointer shrink-0 ${
                isCollapsed ? 'w-11 justify-center' : 'w-full justify-start'
              } ${
                active
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-md shadow-orange-500/10'
                  : 'bg-[#101422] hover:bg-[#161c2e] border-white/[0.06] hover:border-white/[0.15] text-slate-300 hover:text-white'
              }`}
            >
              <div className="w-11 h-11 shrink-0 flex items-center justify-center text-current">
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="font-medium text-xs leading-none truncate pr-3 select-none">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Profile Card Button (In place of Logout, navigates to Profile Settings) */}
        <button
          onClick={() => onSelectView('settings')}
          title={isCollapsed ? `${userProfile?.name || 'Profile'} - Account Settings` : undefined}
          className={`h-11 rounded-md border flex items-center transition-all cursor-pointer shrink-0 ${
            isCollapsed ? 'w-11 justify-center' : 'w-full px-2.5 justify-between'
          } ${
            isViewActive('settings')
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-md shadow-orange-500/10'
              : 'bg-[#101422] hover:bg-[#161c2e] border-white/[0.06] hover:border-white/[0.15] text-slate-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-md bg-[#1a2030] border border-white/10 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {userProfile?.name?.charAt(0) || 'A'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-sm border border-[#0a0d14]" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 text-left space-y-0.5">
                <span className="font-semibold text-xs text-white truncate block leading-none">
                  {userProfile?.name || 'Ambica'}
                </span>
                <p className="text-[10px] text-slate-400 truncate leading-none">
                  {userProfile?.email || 'ambica@workspace.local'}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </button>
      </div>

      {/* 3. FOOTER TELEMETRY */}
      <div className="p-3.5 border-t border-white/[0.08] bg-[#07090e] shrink-0">
        {isCollapsed ? (
          <div
            title={`Battery: ${batteryPct}%`}
            className="w-11 h-11 rounded-md bg-[#101422] border border-white/[0.06] flex items-center justify-center text-slate-400 shrink-0"
          >
            {deviceStatus?.power_plugged ? (
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            ) : isBatteryLow ? (
              <BatteryWarning className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Battery className="w-4 h-4 text-slate-400" />
            )}
          </div>
        ) : (
          <button
            onClick={() => openAskWithQuery('What can Nori do in my workspace?')}
            className="w-full h-11 rounded-md bg-[#101422] hover:bg-[#161c2e] border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-between px-3 text-xs text-slate-300 cursor-pointer shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <LifeBuoy size={18} className="text-orange-400 shrink-0" />
              <span className="font-medium">Help Center</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              {deviceStatus?.power_plugged ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : isBatteryLow ? (
                <BatteryWarning className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{batteryPct}%</span>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
};
