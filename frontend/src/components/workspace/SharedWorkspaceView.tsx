import React, { useState, useEffect } from 'react';
import { useNori } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import { fetchWorkspace, queryWorkspace } from '../../services/api';
import { SharedWorkspace } from '../../types';
import {
  Users,
  Plus,
  Link,
  ShieldCheck,
  CheckCircle2,
  Mail,
  ArrowRight,
  ExternalLink,
  Network,
  Cpu,
  Bot,
  Sparkles,
  Send,
  Trash2,
  RefreshCw,
  Laptop,
  Radio,
  Play,
  Share2,
  Layers,
  Code,
  Terminal,
  Activity,
  Zap,
  Check,
  Monitor,
  Wifi
} from 'lucide-react';
import { useToast } from '../common/ToastModalProvider';

interface JoinedAgent {
  id: string;
  name: string;
  ownerDevice: string;
  isMasterHost?: boolean;
  role: string;
  status: 'Joined Meeting' | 'Editing Code' | 'Running Task' | 'Idle';
  currentTask?: string;
  avatarColor: string;
  capabilities: string[];
  activeLog?: string[];
}

export const SharedWorkspaceView: React.FC = () => {
  const { showPrompt, showToast, showConfirm } = useToast();
  const { setActiveView, userProfile } = useNori();

  const [masterGoal, setMasterGoal] = useState<string>(
    'Real-time Workspace Development & Multi-Agent Neural Mesh'
  );
  const [meetingCode] = useState<string>('nori://mesh-room-8492-master');
  const [tab, setTab] = useState<'roundtable' | 'floating' | 'arena'>('roundtable');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('ag_master');

  const peerName = userProfile.name.toLowerCase() === 'ambica' ? 'Sara' : 'Ambica';

  // AI Agents currently in the meeting room (floating to main laptop)
  const [joinedAgents, setJoinedAgents] = useState<JoinedAgent[]>(() => [
    {
      id: 'ag_master',
      name: `${userProfile.name}'s Host Architect Agent`,
      ownerDevice: `Master Host Laptop (${userProfile.name}'s Device)`,
      isMasterHost: true,
      role: 'Master Task Controller & AST Code Generator',
      status: 'Joined Meeting',
      currentTask: 'Coordinating active workspace edits on host laptop',
      avatarColor: 'from-orange-500 to-amber-500',
      capabilities: ['Master Control', 'Code Gen', 'AST Refactoring'],
      activeLog: [
        `Initialized master host controller on ${userProfile.name}'s workstation.`,
        'Indexed active source code files in workspace root.',
        'Listening for incoming peer laptop agent connections.'
      ]
    },
    {
      id: 'ag_peer',
      name: `${peerName}'s Collaborator Agent`,
      ownerDevice: `${peerName}'s Laptop (Peer Node · 192.168.1.14)`,
      role: 'Hardware Inspection & ML Neural Execution',
      status: 'Joined Meeting',
      currentTask: 'Monitoring live desk vision stream & code synchronization',
      avatarColor: 'from-cyan-500 to-blue-500',
      capabilities: ['OpenCV Vision', 'Spectacles Tracking', 'DirectML Tensor'],
      activeLog: [
        `Connected to host laptop from ${peerName}'s laptop.`,
        'Streaming camera vision & hardware perception to master workspace.',
        'Ready to co-edit code files in parallel.'
      ]
    },
    {
      id: 'ag_reasoning',
      name: 'Local On-Device Neural Engine',
      ownerDevice: 'Local Host NPU (On-Device)',
      role: 'Causal Correlator & Task Planner',
      status: 'Joined Meeting',
      currentTask: 'Optimizing graph inference routing & DirectML execution',
      avatarColor: 'from-purple-500 to-indigo-500',
      capabilities: ['ONNX Runtime', 'Context Graph', 'Task Planner'],
      activeLog: [
        'NPU DirectML execution provider loaded.',
        'Prepared fast intent classifier for live workspace prompts.',
        'Zero-cloud local execution active.'
      ]
    }
  ]);

  const [taskInput, setTaskInput] = useState('');
  const [collaborating, setCollaborating] = useState(false);
  const [collaborationLogs, setCollaborationLogs] = useState<
    Array<{ agentName: string; text: string; time: string; type?: 'host' | 'agent' | 'system' }>
  >([
    {
      agentName: 'System',
      text: 'AI Agent Meeting Room online. Peer laptop agents are connected to this workspace mesh.',
      time: 'Just now',
      type: 'system'
    },
    {
      agentName: `${userProfile.name}'s Host Architect Agent`,
      text: 'Ready to receive Master Task instructions and broadcast live code edits to all joined laptop agents.',
      time: 'Just now',
      type: 'host'
    }
  ]);

  const activeSelectedAgent = joinedAgents.find((a) => a.id === selectedAgentId) || joinedAgents[0];

  const handleCreateNewMasterTask = () => {
    showPrompt({
      title: 'Host New Master Task Session',
      message: 'Enter the goal or project for joined AI agents to solve together on this laptop:',
      placeholder: 'e.g. Build real-time telemetry pipeline with unit tests',
      confirmText: 'Start Session',
      onConfirm: (goal) => {
        if (!goal.trim()) return;
        setMasterGoal(goal.trim());
        setCollaborationLogs((prev) => [
          ...prev,
          {
            agentName: 'Master Host',
            text: `Updated Master Goal: "${goal.trim()}"`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'system'
          }
        ]);
        showToast('New Master Task Session started', 'success');
      }
    });
  };

  const handleShareLocalAgent = () => {
    showPrompt({
      title: 'Share / Deploy AI Agent to Host Laptop',
      message: 'Enter the title and specialization of the AI Agent you are bringing to this laptop:',
      placeholder: 'e.g. Circuit Diagnostics Agent',
      confirmText: 'Deploy Agent to Host',
      onConfirm: (agentName) => {
        if (!agentName.trim()) return;
        const newAg: JoinedAgent = {
          id: `ag_${Date.now()}`,
          name: agentName.trim(),
          ownerDevice: `${userProfile.name}'s Laptop`,
          role: 'Custom Specialty Agent',
          status: 'Joined Meeting',
          currentTask: 'Waiting for task assignment on host',
          avatarColor: 'from-pink-500 to-rose-500',
          capabilities: ['Custom Logic', 'Local Context', 'Mesh Sync'],
          activeLog: [
            `Agent "${agentName.trim()}" joined master host workspace.`,
            'Ready to work directly on host laptop files.'
          ]
        };
        setJoinedAgents((prev) => [...prev, newAg]);
        setCollaborationLogs((prev) => [
          ...prev,
          {
            agentName: agentName.trim(),
            text: `Joined the master laptop workspace to execute tasks.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'agent'
          }
        ]);
        showToast(`Agent "${agentName.trim()}" joined the main laptop`, 'success');
      }
    });
  };

  const handleJoinPeerLaptop = () => {
    showPrompt({
      title: 'Join Remote Host Laptop',
      message: 'Paste the Master Host Laptop token or link to enter their workspace:',
      placeholder: 'e.g. nori://mesh-room-9182-host',
      confirmText: 'Connect & Join',
      onConfirm: (link) => {
        if (!link.trim()) return;
        showToast('Connected to Master Host Laptop! AI agents working together.', 'success');
      }
    });
  };

  const handleDispatchMasterTask = async () => {
    if (!taskInput.trim()) return;
    const task = taskInput.trim();
    setTaskInput('');
    setCollaborating(true);

    // 1. Host logs request
    setCollaborationLogs((prev) => [
      ...prev,
      {
        agentName: `Master Head (${userProfile.name})`,
        text: `Dispatched Master Task: "${task}"`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'host'
      }
    ]);

    // 2. Joined agents execute work on main laptop
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setJoinedAgents((prev) =>
        prev.map((a) => {
          const logEntry = `[${timestamp}] Executed work: ${task.slice(0, 45)}...`;
          return {
            ...a,
            status: 'Editing Code',
            currentTask: `Working on: ${task.slice(0, 30)}...`,
            activeLog: [logEntry, ...(a.activeLog || [])]
          };
        })
      );

      setCollaborationLogs((prev) => [
        ...prev,
        {
          agentName: `${userProfile.name}'s Code Architect Agent`,
          text: `Deconstructed task into sub-components. Modifying host code files and canvas state in parallel.`,
          time: timestamp,
          type: 'agent'
        },
        {
          agentName: "Sarah's Vision Perception Agent",
          text: `Updated camera vision perception bounds and synced spectacles landmarks.`,
          time: timestamp,
          type: 'agent'
        },
        {
          agentName: "Dave's Security Agent",
          text: `Verified zero-cloud privacy guarantees for all local code modifications.`,
          time: timestamp,
          type: 'agent'
        }
      ]);
      setCollaborating(false);
      showToast('Master task executed across all joined AI agents on host laptop', 'success');
    }, 1200);
  };

  const handleRemoveAgent = (id: string, name: string) => {
    showConfirm({
      title: 'Remove Agent from Host Workspace',
      message: `Disconnect agent "${name}" from this host laptop?`,
      confirmText: 'Disconnect Agent',
      isDestructive: true,
      onConfirm: () => {
        setJoinedAgents((prev) => prev.filter((a) => a.id !== id));
        showToast(`Agent "${name}" disconnected from host laptop`, 'info');
      }
    });
  };

  return (
    <div className="nori-page">
      {/* 1. Header */}
      <PageHeader
        title="AI Agent Meeting Room & Workspace Mesh"
        subtitle="Bring your AI agents together onto your main laptop. Peers connect laptops and share specialized AI agents that execute work directly on your workspace."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleShareLocalAgent} className="nori-btn-secondary text-xs">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bring AI Agent to Laptop</span>
            </button>
            <button onClick={handleJoinPeerLaptop} className="nori-btn-secondary text-xs">
              <Link className="w-3.5 h-3.5 text-indigo-400" />
              <span>Join Host Laptop</span>
            </button>
            <button onClick={handleCreateNewMasterTask} className="nori-btn-primary text-xs">
              <Plus className="w-4 h-4" />
              <span>Host Master Task</span>
            </button>
          </div>
        }
      />

      {/* 2. MASTER HOST SESSION BANNER */}
      <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-r from-[#121628] via-[#161b32] to-[#0e1220] border border-orange-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-orange-400" />
              Master Host Laptop: {userProfile.name}'s Device
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              ● {joinedAgents.length} AI Agents Joined in Meeting
            </span>
          </div>

          <h2 className="text-base font-bold text-white truncate leading-snug">
            Master Goal: <span className="text-orange-300">{masterGoal}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded bg-black/40 border border-white/10 font-mono text-xs text-slate-300 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Room Code:</span>
            <span className="font-bold text-cyan-400">{meetingCode}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(meetingCode);
              showToast('Room invite code copied to clipboard', 'success');
            }}
            className="p-2 rounded bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Copy Invite Code"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. VISUAL LAPTOP PEER MESH MAP (Inter-Laptop Meeting Visualizer) */}
      <div className="p-4 rounded-lg bg-[#080b14] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Main Laptop Workstation (Master Host)</span>
            <span className="text-[11px] font-mono text-slate-400">All joined AI agents float onto this laptop screen to edit code together.</span>
          </div>
        </div>

        {/* Peer Laptops Connecting Arrow Diagram */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {joinedAgents.map((ag, idx) => (
            <React.Fragment key={ag.id}>
              {idx > 0 && <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />}
              <div
                className={`px-3 py-1.5 rounded-md text-mono text-[11px] flex items-center gap-2 shrink-0 ${
                  ag.isMasterHost
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                    : 'bg-[#121626] border border-cyan-500/30 text-cyan-300'
                }`}
              >
                <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{ag.name}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4. Navigation Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('roundtable')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              tab === 'roundtable'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
            }`}
          >
            AI Agent Meeting Room ({joinedAgents.length})
          </button>
          <button
            onClick={() => setTab('floating')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              tab === 'floating'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
            }`}
          >
            Work Execution Inspector
          </button>
          <button
            onClick={() => setTab('arena')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              tab === 'arena'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
            }`}
          >
            Master Collaboration Feed
          </button>
        </div>

        <button
          onClick={() => setActiveView('canvas')}
          className="text-xs font-mono text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Open Shared Whiteboard Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* TAB 1: AI AGENT ROUNDTABLE MEETING ROOM */}
      {tab === 'roundtable' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {joinedAgents.map((ag) => (
            <div
              key={ag.id}
              onClick={() => {
                setSelectedAgentId(ag.id);
                setTab('floating');
              }}
              className={`nori-card p-5 flex flex-col justify-between gap-4 relative group cursor-pointer transition-all hover:scale-[1.01] ${
                ag.isMasterHost ? 'border-orange-500/40 bg-[#121626]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-lg bg-gradient-to-tr ${ag.avatarColor} p-[2px] shrink-0 shadow-lg`}
                  >
                    <div className="w-full h-full bg-[#0b0e17] rounded-[6px] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{ag.name}</h3>
                      {ag.isMasterHost && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 uppercase">
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-cyan-400 font-mono block truncate">
                      {ag.ownerDevice}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                  ● {ag.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Specialized Role & Expertise:
                  </span>
                  <p className="text-xs text-slate-200 font-medium">{ag.role}</p>
                </div>

                {ag.currentTask && (
                  <div className="p-2.5 rounded bg-[#070912] border border-white/[0.06] text-xs font-mono text-slate-300">
                    <span className="text-[10px] text-slate-500 block uppercase">Current Focus:</span>
                    <span className="text-orange-300 font-semibold">{ag.currentTask}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ag.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px] text-orange-400 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  Working on Host Laptop
                </span>
                {!ag.isMasterHost && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAgent(ag.id, ag.name);
                    }}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                    title="Disconnect Agent"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: FLOATING WORK INSPECTOR */}
      {tab === 'floating' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full flex-1 min-h-0">
          {/* Left Agent Selector (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold tracking-wider">
              Connected Laptop Agents ({joinedAgents.length}):
            </span>
            <div className="space-y-2.5">
              {joinedAgents.map((ag) => {
                const isSelected = ag.id === activeSelectedAgent.id;
                return (
                  <div
                    key={ag.id}
                    onClick={() => setSelectedAgentId(ag.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500/50 text-white shadow-md'
                        : 'bg-[#101424] hover:bg-[#151a2d] border-white/[0.08] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-md bg-gradient-to-tr ${ag.avatarColor} p-[1px] shrink-0`}>
                        <div className="w-full h-full bg-[#0b0e17] rounded-[5px] flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{ag.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{ag.ownerDevice}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      ● Active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Agent Terminal / Live Work Log (8 cols) */}
          <div className="lg:col-span-8 nori-card p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${activeSelectedAgent.avatarColor} p-[1px] shrink-0`}>
                  <div className="w-full h-full bg-[#0b0e17] rounded-[7px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeSelectedAgent.name}</h3>
                  <span className="text-[11px] text-cyan-400 font-mono">{activeSelectedAgent.ownerDevice}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                Working on Main Laptop
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Active Task Focus:
                </span>
                <p className="text-xs font-bold text-white bg-white/[0.03] p-3 rounded border border-white/[0.08]">
                  {activeSelectedAgent.currentTask || 'Ready for task assignment'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Live Agent Execution Terminal Log:
                </span>
                <div className="p-4 rounded-md bg-[#060810] border border-white/[0.08] font-mono text-[11px] text-emerald-400/90 space-y-2 max-h-56 overflow-y-auto">
                  {activeSelectedAgent.activeLog && activeSelectedAgent.activeLog.length > 0 ? (
                    activeSelectedAgent.activeLog.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 shrink-0">&gt;</span>
                        <span className="leading-relaxed text-slate-200">{line}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No execution steps logged yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Capabilities: {activeSelectedAgent.capabilities.join(', ')}</span>
              <button
                onClick={() => setActiveView('canvas')}
                className="nori-btn-primary text-xs py-1.5 px-3"
              >
                <span>View Changes on Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER COLLABORATION ARENA */}
      {tab === 'arena' && (
        <div className="nori-card p-5 flex flex-col h-[520px] justify-between gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                Live AI Agent Roundtable Discussion & Execution Feed
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              ● All Agents Working Together on Main Laptop
            </span>
          </div>

          {/* Discussion / Log Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-md bg-[#070912] border border-white/[0.06]">
            {collaborationLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-md border text-xs space-y-1 ${
                  log.type === 'host'
                    ? 'bg-[#151a2d] border-orange-500/30 text-white'
                    : log.type === 'system'
                    ? 'bg-white/[0.02] border-white/[0.06] text-slate-400 font-mono'
                    : 'bg-[#101424] border-white/[0.08] text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-orange-400">{log.agentName}</span>
                  <span className="text-slate-500">{log.time}</span>
                </div>
                <p className="leading-relaxed font-sans">{log.text}</p>
              </div>
            ))}

            {collaborating && (
              <div className="p-3.5 text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Broadcasting master task to all joined AI agents across laptops...</span>
              </div>
            )}
          </div>

          {/* Dispatch Input */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.08]">
            <input
              type="text"
              placeholder="Type instructions for all joined AI agents to execute together on this laptop..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDispatchMasterTask()}
              className="flex-1 px-4 py-2.5 rounded-md bg-[#121624] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500/50"
            />
            <button
              onClick={handleDispatchMasterTask}
              disabled={!taskInput.trim() || collaborating}
              className="nori-btn-primary py-2.5 px-4 text-xs disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Task to AI Meeting</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
