import React from 'react';
import { useNori } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Folder,
  Network,
  Lock,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Layers,
  Cpu
} from 'lucide-react';

interface PrivacyCenterProps {
  embedded?: boolean;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ embedded = false }) => {
  const { privacyState, updatePermissions, handleTogglePause } = useNori();
  const isPaused = privacyState?.is_paused;

  return (
    <div className={embedded ? "space-y-6 w-full" : "nori-page"}>
      {/* Header */}
      {!embedded && (
        <PageHeader
          title="Privacy & Sensor Permissions"
          subtitle="Manage local perception signals and on-device privacy isolation controls."
          actions={
            <button
              onClick={handleTogglePause}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${
                isPaused
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
              }`}
            >
              {isPaused ? <PlayCircle className="w-4 h-4 fill-current" /> : <PauseCircle className="w-4 h-4" />}
              <span>{isPaused ? 'Resume Observation' : 'Global Pause'}</span>
            </button>
          }
        />
      )}

      {/* Global Pause Alert Banner */}
      {isPaused && (
        <div className="p-5 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center gap-4 text-rose-300 text-xs">
          <ShieldAlert className="w-6 h-6 shrink-0 text-rose-400" />
          <div>
            <span className="font-bold text-sm block">Global Observation Pause is Active</span>
            <span className="text-xs text-rose-300/90 leading-relaxed block mt-0.5">
              All microphone audio, camera inspection, active screen context, and process telemetry are completely paused.
            </span>
          </div>
        </div>
      )}

      {/* Permission Cards Grid */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
          Perception Signals & Permissions
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Microphone Card */}
          <div className="nori-card flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-md bg-orange-500/10 text-orange-400 shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">Microphone & Voice Input</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Whisper On-Device STT</span>
                </div>
              </div>

              <button
                onClick={() => updatePermissions({ microphone_enabled: !privacyState?.microphone_enabled })}
                className={`w-12 h-6 rounded-md transition-colors cursor-pointer p-0.5 shrink-0 ${
                  privacyState?.microphone_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-sm bg-white transition-transform ${
                    privacyState?.microphone_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
              Enables real-time voice queries and audio transcription. Spoken frames are processed locally in RAM and never written to disk or cloud.
            </p>
          </div>

          {/* Camera Card */}
          <div className="nori-card flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">Camera & Desk Vision</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Local YOLOv8 Perception</span>
                </div>
              </div>

              <button
                onClick={() => updatePermissions({ camera_enabled: !privacyState?.camera_enabled })}
                className={`w-12 h-6 rounded-md transition-colors cursor-pointer p-0.5 shrink-0 ${
                  privacyState?.camera_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-sm bg-white transition-transform ${
                    privacyState?.camera_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
              Provides AR bounding boxes and hardware inspection for breadboards and electronics. Raw frames are immediately discarded after inference.
            </p>
          </div>

          {/* Screen Indexing Card */}
          <div className="nori-card flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-md bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">Application Context</h4>
                  <span className="text-[11px] text-slate-400 font-mono">OS Foreground Windows</span>
                </div>
              </div>

              <button
                onClick={() => updatePermissions({ screen_capture_enabled: !privacyState?.screen_capture_enabled })}
                className={`w-12 h-6 rounded-md transition-colors cursor-pointer p-0.5 shrink-0 ${
                  privacyState?.screen_capture_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-sm bg-white transition-transform ${
                    privacyState?.screen_capture_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
              Observes active code files and terminal sessions to maintain the local work context hypergraph in your local database.
            </p>
          </div>

          {/* Peer Sync Card */}
          <div className="nori-card flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-md bg-purple-500/10 text-purple-400 shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">Peer Mesh Sync</h4>
                  <span className="text-[11px] text-slate-400 font-mono">End-to-End Encrypted</span>
                </div>
              </div>

              <button
                onClick={() => updatePermissions({ network_collaboration_enabled: !privacyState?.network_collaboration_enabled })}
                className={`w-12 h-6 rounded-md transition-colors cursor-pointer p-0.5 shrink-0 ${
                  privacyState?.network_collaboration_enabled ? 'bg-gradient-to-r from-orange-500 to-rose-500' : 'bg-white/[0.1]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-sm bg-white transition-transform ${
                    privacyState?.network_collaboration_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
              Synchronizes shared whiteboard canvases and team tasks with trusted collaborator nodes using direct peer connections.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Architecture Isolation Guarantee Card */}
      <div className="nori-card space-y-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold text-white">
            Zero Cloud Surveillance Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <span className="font-bold text-slate-200 block">Private Context (Strictly Isolated)</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Personal notes, timeline history, secret credentials, raw audio streams, and camera frames are stored only on this PC.
            </p>
          </div>

          <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.04] space-y-1.5">
            <span className="font-bold text-slate-200 block">Shared Workspace Context (Explicit Consent)</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Only items you explicitly publish to team canvases or shared task lists are synchronized with collaborator nodes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
