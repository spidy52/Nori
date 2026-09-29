import React, { useState, useEffect, useRef } from 'react';
import { useNori } from '../../context/NoriContext';
import { Nori3DPetViewer } from '../globe/Nori3DPetViewer';
import { voiceEngine } from '../../services/voice';

import { CompanionStyle } from '../../context/NoriContext';

export const FloatingPetWidget: React.FC = () => {
  const {
    userProfile,
    openAskWithQuery,
    noriState,
    setNoriState,
    ambientListening,
    toggleAmbientListening
  } = useNori();

  const [activeCompanion, setActiveCompanion] = useState<CompanionStyle>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nori_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.companionStyle) return parsed.companionStyle;
        }
      } catch (e) {}
    }
    return userProfile?.companionStyle || 'orb';
  });

  useEffect(() => {
    if (userProfile?.companionStyle) {
      setActiveCompanion(userProfile.companionStyle);
    }
  }, [userProfile?.companionStyle]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nori_companion_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'PROFILE_UPDATE' && event.data.payload?.companionStyle) {
            setActiveCompanion(event.data.payload.companionStyle);
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nori_user_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.companionStyle) {
            setActiveCompanion(parsed.companionStyle);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let cleanupElectron: (() => void) | undefined;
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onCompanionChanged) {
      cleanupElectron = (window as any).electronAPI.onCompanionChanged((newStyle: CompanionStyle) => {
        setActiveCompanion(newStyle);
      });
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      if (cleanupElectron) cleanupElectron();
    };
  }, []);

  const [isSleeping, setIsSleeping] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isStandalonePetMode = typeof window !== 'undefined' && window.location.search.includes('mode=pet');

  useEffect(() => {
    if (isStandalonePetMode) {
      document.body.classList.add('pet-mode-transparent');
    }
  }, [isStandalonePetMode]);

  // 15-second Inactivity Sleep Timer
  const resetSleepTimer = () => {
    if (isSleeping) {
      setIsSleeping(false);
    }
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    // After 15 seconds of silence/inactivity, transition into serene sleeping mode
    sleepTimerRef.current = setTimeout(() => {
      if (!isStopped && noriState === 'idle') {
        setIsSleeping(true);
      }
    }, 15000);
  };

  useEffect(() => {
    // Reset timer on any state change or activity
    resetSleepTimer();
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    };
  }, [noriState, ambientListening, isStopped]);

  const handleOrbClick = () => {
    const name = userProfile?.name?.split(' ')[0] || 'there';
    const helloMsg = `Hello ${name}! I'm right here. How can I help you right now?`;
    voiceEngine.speak(helloMsg);

    if (isStopped) {
      setIsStopped(false);
      setIsSleeping(false);
      resetSleepTimer();
      return;
    }

    if (isSleeping) {
      setIsSleeping(false);
      resetSleepTimer();
      return;
    }

    // Wake / Trigger Ask Nori or Full Workspace
    if (isStandalonePetMode) {
      if ((window as any).electronAPI?.openMainWindow) {
        (window as any).electronAPI.openMainWindow();
      }
    } else {
      openAskWithQuery('');
    }
    resetSleepTimer();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStopped(!isStopped);
  };

  if (isStopped && !isStandalonePetMode) {
    return (
      <div
        onClick={() => {
          setIsStopped(false);
          resetSleepTimer();
        }}
        className="fixed bottom-6 right-6 z-50 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
        title="Click to awaken Nori Orb"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg">
          <span className="w-3 h-3 rounded-full bg-slate-500" />
        </div>
      </div>
    );
  }

  // Active or Sleeping State
  const computedState = isStopped ? 'paused' : isSleeping ? 'sleeping' : noriState;
  const orbSize = isStandalonePetMode ? 160 : 130;

  return (
    <div
      className={`${
        isStandalonePetMode
          ? 'w-full h-full flex items-center justify-center select-none bg-transparent overflow-hidden'
          : 'fixed bottom-6 right-6 z-50 flex items-center justify-center select-none pointer-events-auto'
      }`}
      style={{ WebkitAppRegion: 'drag' } as any}
      onMouseMove={resetSleepTimer}
    >
      {/* Pure Floating Glowing Orb — Zero borders, zero headers, zero symbols */}
      <div
        onClick={handleOrbClick}
        onContextMenu={handleContextMenu}
        className="relative cursor-pointer transition-transform duration-300 hover:scale-105 select-none"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title={
          isSleeping
            ? 'Nori is resting (Sleeping mode). Click or speak to wake up.'
            : isStopped
            ? 'Nori is paused. Click to resume.'
            : 'Nori 24/7 AI Companion. Click to interact • Right-click to pause'
        }
      >
        <Nori3DPetViewer
          companionStyle={activeCompanion}
          size={orbSize}
          interactive={true}
        />
      </div>
    </div>
  );
};
