import React, { useState, useEffect, useRef } from 'react';
import { useNori } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import { fetchGraph, fetchNodeDetails } from '../../services/api';
import { WorkContextGraphResponse, ContextNode } from '../../types';
import {
  Brain,
  Plus,
  Search,
  Layout,
  Trash2,
  Copy,
  Check,
  X,
  Network,
  Share2,
  Activity,
  Layers,
  Cpu,
  FileCode,
  Box,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useToast } from '../common/ToastModalProvider';

interface MemoryNoteItem {
  id: string;
  title: string;
  source: string;
  date: string;
  category: 'Notes' | 'Decisions' | 'Tasks' | 'Insights';
  detail: string;
  tags: string[];
}

export const MemoryView: React.FC = () => {
  const { setActiveView } = useNori();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'graph' | 'notes'>('graph');
  const [tab, setTab] = useState<'All' | 'Notes' | 'Decisions' | 'Tasks' | 'Insights'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Notes' | 'Decisions' | 'Tasks' | 'Insights'>('Notes');
  const [newDetail, setNewDetail] = useState('');
  const [newTags, setNewTags] = useState('architecture, nori');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real Graph State
  const [graphData, setGraphData] = useState<WorkContextGraphResponse | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<ContextNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<any | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(true);

  // Persistent user memory notes (stored in localStorage)
  const [notes, setNotes] = useState<MemoryNoteItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nori_memory_notes');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'note_1',
        title: 'Local Context Hypergraph Engine',
        source: 'Indexed System Context',
        date: 'Active',
        category: 'Decisions',
        detail: 'Local SQLite context graph database separating private workspace activity from collaborative peer nodes with zero external transmission.',
        tags: ['ContextGraph', 'ZeroCloud', 'SQLite']
      }
    ];
  });

  const saveNotes = (updated: MemoryNoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem('nori_memory_notes', JSON.stringify(updated));
    } catch (e) {}
  };

  const loadGraphData = () => {
    setLoadingGraph(true);
    fetchGraph()
      .then((data) => {
        setGraphData(data);
        if (data.nodes.length > 0 && !selectedGraphNode) {
          setSelectedGraphNode(data.nodes[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load graph data', err);
      })
      .finally(() => setLoadingGraph(false));
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  useEffect(() => {
    if (selectedGraphNode?.id) {
      fetchNodeDetails(selectedGraphNode.id)
        .then((d) => setNodeDetails(d))
        .catch(() => setNodeDetails(null));
    }
  }, [selectedGraphNode]);

  const handleAddNote = () => {
    if (!newTitle.trim()) return;
    const newItem: MemoryNoteItem = {
      id: `note_${Date.now()}`,
      title: newTitle.trim(),
      source: 'User Workspace Note',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: newCategory,
      detail: newDetail.trim(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean)
    };
    const updated = [newItem, ...notes];
    saveNotes(updated);
    setNewTitle('');
    setNewDetail('');
    setShowAddModal(false);
    showToast('Memory Note saved to persistent storage', 'success');
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
    showToast('Note removed', 'info');
  };

  const handleCopyNote = (item: MemoryNoteItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`# ${item.title}\n\nCategory: ${item.category}\n\n${item.detail}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = notes.filter((item) => {
    const matchesTab = tab === 'All' || item.category === tab;
    const matchesQuery =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  const getNodeColor = (cat: string) => {
    switch (cat) {
      case 'digital':
        return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300';
      case 'physical':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-300';
      case 'device':
        return 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300';
      case 'issue':
        return 'border-rose-500/50 bg-rose-500/10 text-rose-300';
      default:
        return 'border-orange-500/50 bg-orange-500/10 text-orange-300';
    }
  };

  return (
    <div className="nori-page">
      {/* Header */}
      <PageHeader
        title="Nori Context Memory & Hypergraph"
        subtitle="Explore your live workspace context graph, persistent engineering decisions, and indexed nodes."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode((prev) => (prev === 'graph' ? 'notes' : 'graph'))}
              className="nori-btn-secondary text-xs"
            >
              <Network className="w-3.5 h-3.5 text-orange-400" />
              <span>Switch to {viewMode === 'graph' ? 'Memory Notes' : 'Context Graph'}</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="nori-btn-primary text-xs">
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>
        }
      />

      {/* Sub-header Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'graph'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
            }`}
          >
            Context Graph
          </button>
          <button
            onClick={() => setViewMode('notes')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'notes'
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.04]'
            }`}
          >
            Memory Notes ({notes.length})
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-[#141724] border border-white/[0.08] text-xs w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search graph nodes or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
          />
        </div>
      </div>

      {/* VIEW 1: CONTEXT HYPERGRAPH */}
      {viewMode === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full flex-1 min-h-0">
          {/* Main Graph Canvas (8 cols) */}
          <div className="lg:col-span-8 nori-card p-5 flex flex-col justify-between gap-4 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Context Hypergraph ({graphData?.nodes?.length || 0} Nodes · {graphData?.edges?.length || 0} Edges)
                </span>
              </div>
              <button
                onClick={loadGraphData}
                disabled={loadingGraph}
                className="p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Reload Graph"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingGraph ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Visual Interactive Graph Nodes */}
            <div className="flex-1 min-h-[350px] p-6 rounded-md bg-[#080a12] border border-white/[0.06] flex flex-wrap items-center justify-center gap-4 overflow-y-auto no-scrollbar">
              {loadingGraph ? (
                <div className="flex items-center gap-2 text-xs font-mono text-orange-400 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Indexing local SQLite context graph...</span>
                </div>
              ) : graphData?.nodes && graphData.nodes.length > 0 ? (
                graphData.nodes
                  .filter(
                    (n) =>
                      !searchQuery.trim() ||
                      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      n.category.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((node) => {
                    const isSelected = node.id === selectedGraphNode?.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedGraphNode(node)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 min-w-[200px] max-w-[260px] shadow-lg ${getNodeColor(
                          node.category
                        )} ${
                          isSelected
                            ? 'ring-2 ring-orange-500 scale-105 shadow-orange-500/20 z-10'
                            : 'hover:scale-102 hover:border-white/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-bold uppercase">
                          <span>{node.category}</span>
                          <span className="opacity-70">{node.type}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{node.name}</h4>
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-80 pt-1 border-t border-white/10">
                          <span>Source: {node.source}</span>
                          <span>{Math.round(node.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-xs text-slate-400 space-y-1">
                  <Brain className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-300">No context nodes found in current project.</p>
                  <p className="text-[11px] text-slate-500">Nodes are automatically indexed as you code and inspect hardware.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Inspector Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="nori-card p-5 flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider border-b border-white/[0.06] pb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                Node Inspector
              </span>

              {selectedGraphNode ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Node Name</span>
                    <h3 className="font-bold text-white text-sm">{selectedGraphNode.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block">Category</span>
                      <span className="font-bold text-orange-400 uppercase">{selectedGraphNode.category}</span>
                    </div>
                    <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 block">Node Type</span>
                      <span className="font-bold text-cyan-400 uppercase">{selectedGraphNode.type}</span>
                    </div>
                  </div>

                  {selectedGraphNode.metadata && Object.keys(selectedGraphNode.metadata).length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Metadata Attributes</span>
                      <pre className="text-[10px] font-mono text-cyan-300 bg-[#07090e] p-2.5 rounded border border-white/[0.06] overflow-x-auto max-h-36">
                        {JSON.stringify(selectedGraphNode.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {nodeDetails?.connected_out && nodeDetails.connected_out.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Outbound Relations</span>
                      <div className="space-y-1">
                        {nodeDetails.connected_out.map((rel: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-[11px]">
                            <span className="font-mono text-amber-400">{rel.relation_type}</span>
                            <span className="text-white truncate font-medium">{rel.other_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Select any node on the canvas to inspect details.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MEMORY NOTES */}
      {viewMode === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full p-12 rounded-md bg-[#121522] border border-white/[0.08] text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <Brain className="w-8 h-8 text-slate-500 mb-1" />
              <p className="font-bold text-slate-300">No notes found.</p>
              <span className="text-[11px] text-slate-500">Click "New Note" to record engineering decisions.</span>
            </div>
          ) : (
            filteredNotes.map((item) => (
              <div key={item.id} className="nori-card nori-card-hover flex flex-col justify-between gap-4 relative group">
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-md border font-bold uppercase ${
                        item.category === 'Decisions'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : item.category === 'Tasks'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : item.category === 'Insights'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{item.date}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>

                  {item.detail && <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.detail}</p>}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.04]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Source: {item.source}</span>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleCopyNote(item, e)} className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white" title="Copy Markdown">
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={(e) => handleDeleteNote(item.id, e)} className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400" title="Delete Note">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE MEMORY NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-[#121522] border border-white/[0.12] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-base text-white">Add Persistent Memory Note</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Local DirectML Inference Benchmark"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Notes', 'Decisions', 'Tasks', 'Insights'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      className={`p-2 rounded border text-xs font-semibold ${
                        newCategory === cat ? 'border-orange-500 bg-orange-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Details & Content</label>
                <textarea
                  rows={4}
                  placeholder="Write the architectural record, decision rationale, or checklist..."
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  className="w-full p-3 rounded bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none focus:border-orange-500/50 resize-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. npu, snapdragon, architecture"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-white/[0.04] text-slate-300 text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleAddNote} disabled={!newTitle.trim()} className="nori-btn-primary text-xs">
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
