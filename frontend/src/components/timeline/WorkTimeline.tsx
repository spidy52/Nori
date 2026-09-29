import React, { useState, useEffect, useMemo } from 'react';
import { fetchTimeline } from '../../services/api';
import { TimelineEvent } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { useNori } from '../../context/NoriContext';
import {
  Clock,
  FileCode,
  Box,
  AlertTriangle,
  PlayCircle,
  CheckCircle2,
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Maximize2
} from 'lucide-react';

export const WorkTimeline: React.FC = () => {
  const { workSummary, deviceStatus, openAskWithQuery, setActiveView } = useNori();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const loadEvents = () => {
    setLoading(true);
    fetchTimeline()
      .then((data) => {
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id || 'evt_0');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_INITIALIZED':
        return <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'DOCUMENT_OPENED':
      case 'FILE_MODIFIED':
        return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
      case 'OBJECT_DETECTED':
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case 'PROCESS_SPAWNED':
      case 'PROCESS_STARTED':
        return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ISSUE_IDENTIFIED':
      case 'ANOMALY_DETECTED':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'DECISION_RECORDED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-orange-400" />;
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesCategory =
        filterCategory === 'ALL' ||
        (filterCategory === 'FILES' && (ev.event_type.includes('FILE') || ev.event_type.includes('DOCUMENT'))) ||
        (filterCategory === 'HARDWARE' && (ev.event_type.includes('OBJECT') || ev.source === 'camera')) ||
        (filterCategory === 'PROCESSES' && (ev.event_type.includes('PROCESS') || ev.source === 'process_monitor')) ||
        (filterCategory === 'ISSUES' && (ev.event_type.includes('ANOMALY') || ev.event_type.includes('DECISION') || ev.event_type.includes('ISSUE')));

      const matchesSearch =
        !searchQuery.trim() ||
        ev.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.event_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.source?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [events, filterCategory, searchQuery]);

  const activeEvent = events.find((e) => e.id === selectedEventId) || filteredEvents[0];

  return (
    <div className="nori-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Work Activity Timeline"
        subtitle="Chronological sequence of files modified, hardware detected, and tasks indexed."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAskWithQuery('Summarize all events in current work timeline')}
              className="nori-btn-secondary text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Summary</span>
            </button>
            <button
              onClick={loadEvents}
              disabled={loading}
              className="nori-btn-secondary text-xs p-2"
              title="Refresh Timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* 2. Top KPI Summary Grid (4 Cards Spanning Full Width) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Card 1: Total Events */}
        <div className="nori-card p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Audit Events
            </span>
            <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{events.length}</div>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
              Chronologically Indexed
            </span>
          </div>
        </div>

        {/* Card 2: Active Session */}
        <div className="nori-card p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Active Context
            </span>
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white truncate">
              {workSummary?.project_name || 'Nori Local Workspace'}
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
              {workSummary?.active_application || 'Active Session'}
            </span>
          </div>
        </div>

        {/* Card 3: Neural & Offload Status */}
        <div className="nori-card p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              AI Acceleration
            </span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white truncate font-mono">
              {deviceStatus?.npu?.runtime_name || 'On-Device Neural Engine'}
            </div>
            <span className="text-[11px] text-cyan-400 font-mono mt-0.5 block">
              {deviceStatus?.cpu_percent ? `${deviceStatus.cpu_percent}% Host CPU Load` : 'Sub-50ms Local Inference'}
            </span>
          </div>
        </div>

        {/* Card 4: Issues / Decisions */}
        <div className="nori-card p-4 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Causal Events
            </span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white truncate">
              {events.filter(e => e.event_type?.includes('DECISION') || e.event_type?.includes('RESOLV')).length || events.length} Resolved
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block truncate">
              {events.find(e => e.event_type?.includes('DECISION'))?.summary || 'System Operating Smoothly'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Professional Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full flex-1 min-h-0 pb-8">
        {/* Left Column: Timeline Stream (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 rounded-md bg-[#0d111a] border border-white/[0.08]">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-xs flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter events by keyword, source, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'FILES', label: 'Code & Files' },
                { id: 'HARDWARE', label: 'Hardware' },
                { id: 'PROCESSES', label: 'Processes' },
                { id: 'ISSUES', label: 'Decisions' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilterCategory(c.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                    filterCategory === c.id
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed Container - Distinct Box-to-Box Gap */}
          <div className="nori-card p-5 flex-1 overflow-y-auto flex flex-col gap-4">
            {filteredEvents.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-2">
                <Clock className="w-8 h-8 text-slate-600 mb-1" />
                <h3 className="text-xs font-bold text-slate-300">No Matching Work Events</h3>
                <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                  Try adjusting your filter or search query.
                </p>
              </div>
            ) : (
              filteredEvents.map((ev, idx) => {
                const isSelected = (ev.id || `evt_${idx}`) === selectedEventId;
                return (
                  <div
                    key={ev.id || idx}
                    onClick={() => setSelectedEventId(ev.id || `evt_${idx}`)}
                    className={`p-4 sm:p-4.5 rounded-md border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 ${
                      isSelected
                        ? 'bg-orange-500/[0.08] border-orange-500/50 shadow-md shadow-orange-500/10'
                        : 'bg-[#101422] hover:bg-[#151a2c] border-white/[0.08] hover:border-white/[0.16]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Square-curved Icon Box */}
                      <div className="p-2.5 rounded-md bg-[#181d2e] border border-white/10 shrink-0 mt-0.5">
                        {getEventIcon(ev.event_type)}
                      </div>

                      <div className="min-w-0 space-y-2">
                        <span className="text-sm font-semibold text-white block text-wrap-safe leading-snug">
                          {ev.summary}
                        </span>

                        <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-white/[0.06] text-slate-200 border border-white/[0.08] font-bold">
                            {ev.event_type}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            src: <span className="text-slate-300 font-semibold">{ev.source}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 sm:pl-4 sm:border-l sm:border-white/[0.06]">
                      <span className="text-xs font-mono text-slate-300 font-semibold">
                        {ev.timestamp?.split(' ')[1] || ev.timestamp}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {ev.timestamp?.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Context Inspector & Quick Actions (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Selected Event Detail Inspector */}
          <div className="nori-card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                Event Inspector
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded-sm">
                ID: {activeEvent?.id || 'evt_0'}
              </span>
            </div>

            {activeEvent ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    Event Summary
                  </label>
                  <p className="text-xs text-white font-medium bg-white/[0.02] p-2 rounded-md border border-white/[0.06]">
                    {activeEvent.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono block">Category</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                      {activeEvent.event_type}
                    </span>
                  </div>

                  <div className="p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 font-mono block">Sensor Source</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                      {activeEvent.source}
                    </span>
                  </div>
                </div>

                {activeEvent.payload && (
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                      Payload Attributes
                    </label>
                    <pre className="text-[10px] font-mono text-cyan-300/90 bg-[#07090e] p-2.5 rounded-md border border-white/[0.06] overflow-x-auto max-h-36">
                      {typeof activeEvent.payload === 'string'
                        ? activeEvent.payload
                        : JSON.stringify(activeEvent.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Select an event to inspect its payload metadata.
              </p>
            )}
          </div>

          {/* Active Working Session Snapshot */}
          <div className="nori-card p-4 flex flex-col gap-3">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider border-b border-white/[0.06] pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Active Workspace Context
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400">Active File</span>
                <span className="font-mono text-white text-[11px] font-semibold truncate max-w-[180px]">
                  {workSummary?.active_file || 'Nori Workspace Active'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400">Desk Hardware</span>
                <span className="font-mono text-amber-400 text-[11px]">
                  {workSummary?.physical_context?.[0] || 'Camera Perception Active'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400">Offload Engine</span>
                <span className="font-mono text-cyan-400 text-[11px]">
                  {deviceStatus?.npu?.runtime_name || 'Local Neural Offload'}
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setActiveView('canvas')}
              className="nori-btn-primary w-full justify-center text-xs mt-1"
            >
              <span>Resume Workspace Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
