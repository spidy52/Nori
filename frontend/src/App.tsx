import React, { useState } from 'react';
import { NoriProvider, useNori, NavView } from './context/NoriContext';
import { NoriSidebar } from './components/shell/NoriSidebar';
import { OnboardingLoginView } from './components/onboarding/OnboardingLoginView';
import { PermissionsSetupView } from './components/onboarding/PermissionsSetupView';
import { DesktopCompanionView } from './components/companion/DesktopCompanionView';
import { NoriHomeView } from './components/home/NoriHomeView';
import { ChatHistoryView } from './components/chat/ChatHistoryView';
import { CreativeStudioCanvas } from './components/studio/CreativeStudioCanvas';
import { CameraGuidanceView } from './components/physical/CameraGuidanceView';
import { ProjectsView } from './components/projects/ProjectsView';
import { DeviceContextView } from './components/device/DeviceContextView';
import { WorkTimeline } from './components/timeline/WorkTimeline';
import { MemoryView } from './components/memory/MemoryView';
import { SharedWorkspaceView } from './components/workspace/SharedWorkspaceView';
import { SnapdragonEngineView } from './components/snapdragon/SnapdragonEngineView';
import { PrivacyCenter } from './components/privacy/PrivacyCenter';
import { AccountSettingsView } from './components/settings/AccountSettingsView';
import { AskNoriModal } from './components/command/AskNoriModal';
import { GlobalPauseBanner } from './components/shell/GlobalPauseBanner';
import { FloatingPetWidget } from './components/companion/FloatingPetWidget';
import { GlobalCameraPerceptionDaemon } from './components/physical/GlobalCameraPerceptionDaemon';

const MainScreenArea: React.FC<{ activeView: NavView }> = ({ activeView }) => {
  switch (activeView) {
    case 'onboarding':
      return <OnboardingLoginView />;
    case 'permissions':
      return <PermissionsSetupView />;
    case 'companion':
      return <DesktopCompanionView />;
    case 'home':
      return <NoriHomeView />;
    case 'chat':
      return <ChatHistoryView />;
    case 'projects':
      return <ProjectsView />;
    case 'canvas':
    case 'whiteboard':
      return <CreativeStudioCanvas />;
    case 'physical':
    case 'camera':
      return <CameraGuidanceView />;
    case 'team':
    case 'workspace':
      return <SharedWorkspaceView />;
    case 'memory':
      return <MemoryView />;
    case 'device':
      return <DeviceContextView />;
    case 'timeline':
      return <WorkTimeline />;
    case 'aimodels':
    case 'snapdragon':
      return <SnapdragonEngineView />;
    case 'privacy':
      return <PrivacyCenter />;
    case 'settings':
      return <AccountSettingsView />;
    default:
      return <NoriHomeView />;
  }
};

const NoriApp: React.FC = () => {
  const { activeView, setActiveView, isAuthenticated } = useNori();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Mandatory Authentication / Onboarding Gate
  if (!isAuthenticated) {
    if (activeView === 'permissions') {
      return (
        <div className="w-full h-full bg-[#07090e] text-slate-100 overflow-hidden font-sans">
          <PermissionsSetupView />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-[#07090e] text-slate-100 overflow-hidden font-sans">
        <OnboardingLoginView />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#07090e] text-slate-100 overflow-hidden select-none flex flex-col font-sans">
      {/* 1. Global Pause Notification Banner */}
      <GlobalPauseBanner />

      {/* 2. Autonomous Background Camera Perception Daemon (runs across tabs) */}
      <GlobalCameraPerceptionDaemon />

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 w-full min-h-0 flex overflow-hidden p-2.5 gap-2.5 bg-[#07090e]">
        {/* Unified ChronoDesk-Inspired Navigation Sidebar */}
        <NoriSidebar
          activeView={activeView}
          onSelectView={(view) => setActiveView(view)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Active Studio Viewport */}
        <main className="flex-1 h-full min-h-0 min-w-0 bg-[#0d0f17] border border-white/[0.08] rounded-lg relative z-10 flex flex-col overflow-y-auto overflow-x-hidden shadow-2xl">
          <MainScreenArea activeView={activeView} />
        </main>
      </div>
    </div>
  );
};

import { ToastProvider } from './components/common/ToastModalProvider';

export const App: React.FC = () => {
  const isPetMode = typeof window !== 'undefined' && window.location.search.includes('mode=pet');

  if (isPetMode) {
    return (
      <NoriProvider>
        <div className="w-screen h-screen bg-transparent overflow-hidden select-none flex items-center justify-center pointer-events-auto">
          <FloatingPetWidget />
        </div>
      </NoriProvider>
    );
  }

  return (
    <NoriProvider>
      <ToastProvider>
        <NoriApp />
      </ToastProvider>
    </NoriProvider>
  );
};

export default App;
