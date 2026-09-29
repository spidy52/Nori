import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  NoriState,
  WorkSummary,
  DeviceStatus,
  PrivacyState,
  ContextNode
} from '../types';
import {
  fetchCurrentContext,
  fetchDeviceStatus,
  fetchPrivacyStatus,
  togglePrivacyPause,
  askNori
} from '../services/api';
import { voiceEngine } from '../services/voice';

export type NavView =
  | 'onboarding'
  | 'permissions'
  | 'companion'
  | 'home'
  | 'chat'
  | 'projects'
  | 'canvas'
  | 'physical'
  | 'team'
  | 'memory'
  | 'aimodels'
  | 'device'
  | 'timeline'
  | 'privacy'
  | 'settings'
  | 'whiteboard'
  | 'camera'
  | 'workspace'
  | 'snapdragon';

export type CompanionStyle = 'orb' | 'nova' | 'kuro' | 'lumi' | 'rover' | 'sprout';

export interface UserProfile {
  name: string;
  email: string;
  username: string;
  bio: string;
  companionStyle?: CompanionStyle;
  interests?: string[];
  onboardingCompleted?: boolean;
}

export interface CompanionThoughtPayload {
  id: string;
  timestamp: number;
  mood: 'friendly' | 'curious' | 'observing' | 'helpful' | 'alert' | 'thinking';
  thought: string;
  detail?: string;
  action_suggestion?: string;
  threat_action?: string;
  suggested_interactions?: string[];
  speak_aloud?: boolean;
  source: string;
}

interface NoriContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  noriState: NoriState;
  setNoriState: (state: NoriState) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  workSummary: WorkSummary | null;
  deviceStatus: DeviceStatus | null;
  privacyState: PrivacyState | null;
  selectedNode: ContextNode | null;
  setSelectedNode: (node: ContextNode | null) => void;
  isAskModalOpen: boolean;
  setIsAskModalOpen: (open: boolean) => void;
  commandQuery: string;
  setCommandQuery: (q: string) => void;
  openAskWithQuery: (q: string) => void;
  handleTogglePause: () => Promise<void>;
  updatePermissions: (perms: Partial<PrivacyState>) => Promise<void>;
  refreshContext: () => Promise<void>;
  companionThought: CompanionThoughtPayload | null;
  setCompanionThought: (t: CompanionThoughtPayload | null) => void;
  ambientListening: boolean;
  toggleAmbientListening: () => void;
  latestVoiceTranscript: string;
  eyeComfortMode: boolean;
  toggleEyeComfortMode: () => void;
  audioResonanceLevel: number;
}

const NoriContext = createContext<NoriContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: 'Ambica',
  email: 'ambica@workspace.local',
  username: 'ambica',
  bio: 'AI Work Companion Workspace',
  companionStyle: 'orb',
  interests: ['AI Models', 'Snapdragon NPU', 'Web Applications', 'Hardware Circuits']
};

export const NoriProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nori_authenticated') === 'true';
    }
    return false;
  });

  const [activeView, setActiveView] = useState<NavView>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('nori_authenticated') === 'true') {
      return 'home';
    }
    return 'onboarding';
  });

  const login = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nori_authenticated', 'true');
    }
    setActiveView('home');
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nori_authenticated', 'false');
    }
    setActiveView('onboarding');
  };

  const [noriState, setNoriState] = useState<NoriState>('idle');
  const [workSummary, setWorkSummary] = useState<WorkSummary | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [privacyState, setPrivacyState] = useState<PrivacyState | null>(null);
  const [selectedNode, setSelectedNode] = useState<ContextNode | null>(null);
  const [companionThought, setCompanionThought] = useState<CompanionThoughtPayload | null>(null);
  const [ambientListening, setAmbientListening] = useState<boolean>(false);
  const [latestVoiceTranscript, setLatestVoiceTranscript] = useState<string>('');
  const [eyeComfortMode, setEyeComfortMode] = useState<boolean>(false);

  const toggleEyeComfortMode = () => {
    setEyeComfortMode((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.documentElement.style.filter = next
          ? 'sepia(0.25) hue-rotate(-12deg) brightness(0.95)'
          : '';
      }
      return next;
    });
  };

  const isSpeakingRef = useRef<boolean>(false);
  const lastVoiceTimeRef = useRef<number>(0);
  const lastVoiceTranscriptRef = useRef<string>('');

  // Dynamic user profile with localStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nori_user_profile');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_PROFILE;
  });

  // Cross-window and Cross-process Synchronization (BroadcastChannel, Electron IPC, Storage Events)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('nori_companion_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'PROFILE_UPDATE') {
            setUserProfile((prev) => ({ ...prev, ...event.data.payload }));
          }
        };
      }
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nori_user_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUserProfile(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let cleanupElectron: (() => void) | undefined;
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onCompanionChanged) {
      cleanupElectron = (window as any).electronAPI.onCompanionChanged((newStyle: CompanionStyle) => {
        setUserProfile((prev) => ({ ...prev, companionStyle: newStyle }));
      });
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      if (cleanupElectron) cleanupElectron();
    };
  }, []);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('nori_user_profile', JSON.stringify(next));
      } catch (e) {}

      // Broadcast across all windows via BroadcastChannel
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('nori_companion_sync');
          bc.postMessage({ type: 'PROFILE_UPDATE', payload: updates });
          bc.close();
        }
      } catch (e) {}

      // Electron IPC broadcast across all browser windows
      if (updates.companionStyle && (window as any).electronAPI?.notifyCompanionChanged) {
        try {
          (window as any).electronAPI.notifyCompanionChanged(updates.companionStyle);
        } catch (e) {}
      }

      // Synchronize with backend API to trigger WebSocket broadcast to floating Electron HUD
      if (updates.companionStyle) {
        try {
          fetch('http://127.0.0.1:8000/api/companion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companion: updates.companionStyle })
          }).catch(() => {});
        } catch (e) {}
      }

      return next;
    });
  };

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');

  const refreshContext = async () => {
    try {
      const [summary, dev, priv] = await Promise.all([
        fetchCurrentContext(),
        fetchDeviceStatus(),
        fetchPrivacyStatus()
      ]);
      setWorkSummary(summary);
      setDeviceStatus(dev);
      setPrivacyState(priv);

      if (priv.is_paused) {
        setNoriState('paused');
      }
    } catch (e) {
      console.warn('Backend offline or connecting...', e);
    }
  };

  const handleTogglePause = async () => {
    try {
      const updated = await togglePrivacyPause();
      setPrivacyState(updated);
      setNoriState(updated.is_paused ? 'paused' : 'ready');
      if (updated.is_paused) {
        voiceEngine.stopAmbientListening();
        setAmbientListening(false);
      }
    } catch (e) {
      console.error('Failed to toggle pause', e);
    }
  };

  const handleUpdatePermissions = async (perms: Partial<PrivacyState>) => {
    try {
      const { updatePermissions: apiUpdate } = await import('../services/api');
      const updated = await apiUpdate(perms);
      setPrivacyState(updated);
    } catch (e) {
      console.error('Failed to update permissions', e);
    }
  };

  const openAskWithQuery = (q: string) => {
    setCommandQuery(q);
    setActiveView('chat');
  };

  // Toggle ambient listening hands-free
  const toggleAmbientListening = () => {
    if (privacyState?.is_paused) return;

    if (ambientListening) {
      voiceEngine.stopAmbientListening();
      setAmbientListening(false);
      setNoriState('idle');
    } else {
      setAmbientListening(true);
      setNoriState('listening');
      voiceEngine.startAmbientListening(
        async (transcript: string, isFinal: boolean) => {
          setLatestVoiceTranscript(transcript);
          if (isFinal && transcript.trim().length >= 2) {
            const textTrimmed = transcript.trim();
            const now = Date.now();

            // Debounce exact duplicate transcripts within 4 seconds or rapid triggers within 2.5s
            if (textTrimmed.toLowerCase() === lastVoiceTranscriptRef.current.toLowerCase() && (now - lastVoiceTimeRef.current < 4500)) {
              return;
            }
            if (now - lastVoiceTimeRef.current < 2500) {
              return;
            }

            lastVoiceTranscriptRef.current = textTrimmed;
            lastVoiceTimeRef.current = now;

            // Process voice command
            const textLower = textTrimmed.toLowerCase();
            try {
              // 1. Direct Voice Task / Navigation Intent Routing
              if (textLower.includes('canvas') || textLower.includes('whiteboard') || textLower.includes('diagram')) {
                setActiveView('canvas');
              } else if (textLower.includes('chat') || textLower.includes('message')) {
                setActiveView('chat');
              } else if (textLower.includes('camera') || textLower.includes('vision') || textLower.includes('desk')) {
                setActiveView('physical');
              } else if (textLower.includes('project')) {
                setActiveView('projects');
              } else if (textLower.includes('team') || textLower.includes('collab')) {
                setActiveView('team');
              } else if (textLower.includes('memory') || textLower.includes('graph')) {
                setActiveView('memory');
              } else if (textLower.includes('timeline') || textLower.includes('history')) {
                setActiveView('timeline');
              } else if (textLower.includes('setting') || textLower.includes('telemetry') || textLower.includes('device') || textLower.includes('privacy')) {
                setActiveView('settings');
              } else if (textLower.includes('pause') || textLower.includes('stop watching')) {
                await handleTogglePause();
              } else if (textLower.includes('eye comfort') || textLower.includes('night mode')) {
                toggleEyeComfortMode();
              }

              // Autonomous Draw Trigger via Voice
              if (
                textLower.includes('draw') ||
                textLower.includes('diagram') ||
                textLower.includes('sketch') ||
                textLower.includes('architecture') ||
                textLower.includes('canvas')
              ) {
                setActiveView('canvas');
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent('nori-auto-draw', { detail: { prompt: transcript.trim() } })
                  );
                }, 300);
              }

              setNoriState('thinking');
              const res = await askNori(transcript.trim());
              const answerText = res.summary || res.headline || `Processed voice request for "${transcript.trim()}".`;

              setNoriState('speaking');
              isSpeakingRef.current = true;

              // Speak aloud out loud via Voice Engine TTS
              voiceEngine.speak(
                answerText,
                () => { setNoriState('speaking'); },
                () => {
                  setNoriState('idle');
                  isSpeakingRef.current = false;
                }
              );

              setCompanionThought({
                id: `thought_voice_${Date.now()}`,
                timestamp: Date.now() / 1000,
                mood: 'friendly',
                thought: answerText,
                detail: `Voice Query: "${transcript.trim()}"`,
                action_suggestion: 'Spoken Answer',
                speak_aloud: true,
                source: 'voice_input'
              });
            } catch (err) {
              console.error('Voice answer error:', err);
              const fallbackText = "Hello! I am Nori. How can I assist with your workstation or life goals today?";
              setNoriState('speaking');
              voiceEngine.speak(fallbackText, undefined, () => setNoriState('idle'));
            }
          }

        },
        (state) => {
          if (state === 'listening' && noriState !== 'thinking' && noriState !== 'speaking') {
            setNoriState('listening');
          }
        }
      );
    }
  };

  const lastThoughtIdRef = useRef<string>('');

  // Setup WebSocket for live telemetry & events
  useEffect(() => {
    refreshContext();

    const wsUrl = 'ws://127.0.0.1:8000/ws/events';
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          console.log('[Nori] Connected to local event bus');
        };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INITIAL_STATE' || data.type === 'TELEMETRY_UPDATE') {
              if (data.telemetry) setDeviceStatus(data.telemetry);
              if (data.companion) {
                setUserProfile((prev) => ({ ...prev, companionStyle: data.companion }));
              }
              if (data.privacy) {
                setPrivacyState(data.privacy);
                if (data.privacy.is_paused) setNoriState('paused');
              }
              if (data.summary) setWorkSummary(data.summary);
              if (data.thought && data.thought.id !== lastThoughtIdRef.current) {
                lastThoughtIdRef.current = data.thought.id;
                setCompanionThought(data.thought);
              }
            }
            if (data.type === 'COMPANION_CHANGED' && data.companion) {
              setUserProfile((prev) => {
                const next = { ...prev, companionStyle: data.companion };
                try { localStorage.setItem('nori_user_profile', JSON.stringify(next)); } catch (e) {}
                return next;
              });
            }
            if (data.type === 'PRIVACY_UPDATE') {
              setPrivacyState(data.privacy);
              setNoriState(data.privacy.is_paused ? 'paused' : 'ready');
            }
            if (data.type === 'STATE_CHANGED' && data.data?.state) {
              setNoriState(data.data.state);
            }
            if (data.type === 'VOICE_HEARD' && data.data?.text) {
              setLatestVoiceTranscript(data.data.text);
              setNoriState('listening');
            }
            if (data.type === 'AUTO_DRAW') {
              const prompt = data.data?.prompt || 'Neural Architecture';
              setActiveView('canvas');
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent('nori-auto-draw', { detail: { prompt } })
                );
              }, 300);
            }
            if (data.type === 'PHYSICAL_DETECTION' && data.data) {
              const diag = data.data.interactive_dialogue;
              const primary = data.data.primary_item;
              if (diag) {
                setCompanionThought({
                  id: `cam_${Date.now()}`,
                  timestamp: Date.now(),
                  mood: 'curious',
                  thought: diag,
                  detail: primary ? `Detected in workspace: ${primary}` : undefined,
                  source: 'physical_vision'
                });
              }
            }
          } catch (err) {
            console.error('WS parse error', err);
          }
        };
        socket.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 3000);
        };
      } catch (err) {
        reconnectTimer = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    // Global shortcut Ctrl+Space for Ask Nori command palette
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        setIsAskModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  const [audioResonanceLevel, setAudioResonanceLevel] = useState<number>(0);

  // Live Microphone Audio Resonance Listener for 3D Companion Orb
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;
    let micStream: MediaStream | null = null;

    const startMicResonance = async () => {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(micStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalized = Math.min(1.0, avg / 42);
          setAudioResonanceLevel(normalized);
          animId = requestAnimationFrame(analyze);
        };
        analyze();
      } catch (e) {
        // Fallback simulation when mic access not granted
      }
    };

    startMicResonance();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx) audioCtx.close();
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <NoriContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        activeView,
        setActiveView,
        noriState,
        setNoriState,
        userProfile,
        updateUserProfile,
        workSummary,
        deviceStatus,
        privacyState,
        selectedNode,
        setSelectedNode,
        isAskModalOpen,
        setIsAskModalOpen,
        commandQuery,
        setCommandQuery,
        openAskWithQuery,
        handleTogglePause,
        updatePermissions: handleUpdatePermissions,
        refreshContext,
        companionThought,
        setCompanionThought,
        ambientListening,
        toggleAmbientListening,
        latestVoiceTranscript,
        eyeComfortMode,
        toggleEyeComfortMode,
        audioResonanceLevel
      }}
    >
      {children}
    </NoriContext.Provider>
  );
};

export const useNori = () => {
  const context = useContext(NoriContext);
  if (!context) throw new Error('useNori must be used within NoriProvider');
  return context;
};
