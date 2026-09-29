import React, { useState, useEffect } from 'react';
import { useNori } from '../../context/NoriContext';
import { fetchGraph, fetchNodeDetails } from '../../services/api';
import { ContextNode, ContextEdge } from '../../types';
import {
  FileCode,
  Box,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Info,
  X,
  Layers,
  Filter,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const ContextCanvas: React.FC = () => {
  const [nodes, setNodes] = useState<ContextNode[]>([]);
  const [edges, setEdges] = useState<ContextEdge[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeDetail, setNodeDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      fetchNodeDetails(selectedNodeId)
        .then(setNodeDetail)
        .catch(() => setNodeDetail(null));
    } else {
      setNodeDetail(null);
    }
  }, [selectedNodeId]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const res = await fetchGraph();
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
      if (res.nodes && res.nodes.length > 0) {
        setSelectedNodeId(res.nodes[0].id);
      }
    } catch (e) {
      console.error(e);
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = activeCategory === 'all'
    ? nodes
    : nodes.filter((n) => n.category === activeCategory || (activeCategory === 'issue' && n.type === 'issue'));

  const getNodeIcon = (node: ContextNode) => {
    switch (node.category) {
      case 'digital':
        return <FileCode className="w-4 h-4 text-indigo-400" />;
      case 'physical':
        return <Box className="w-4 h-4 text-amber-400" />;
      case 'device':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'issue':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'decision':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const getNodeBorder = (node: ContextNode) => {
    switch (node.category) {
      case 'digital':
        return 'border-indigo-500/30 hover:border-indigo-500/80 bg-indigo-950/20';
      case 'physical':
        return 'border-amber-500/30 hover:border-amber-500/80 bg-amber-950/20';
      case 'device':
        return 'border-cyan-500/30 hover:border-cyan-500/80 bg-cyan-950/20';
      case 'issue':
        return 'border-red-500/40 hover:border-red-500/90 bg-red-950/20';
      case 'decision':
        return 'border-emerald-500/40 hover:border-emerald-500/90 bg-emerald-950/20';
      default:
        return 'border-purple-500/30 hover:border-purple-500/80 bg-purple-950/20';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-6 bg-gradient-to-b from-[#070b14] via-[#090e1a] to-[#04060a] overflow-hidden">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            Work Context Canvas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Living graph connecting files, physical devices, hardware processes, and calibration issues.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          {[
            { id: 'all', label: 'All Context' },
            { id: 'digital', label: 'Digital' },
            { id: 'physical', label: 'Physical' },
            { id: 'device', label: 'Device & NPU' },
            { id: 'issue', label: 'Issues & Decisions' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas & Side Inspector Drawer */}
      <div className="flex-1 flex gap-5 overflow-hidden">
        {/* Spatial Node-Graph Grid Layout */}
        <div className="flex-1 rounded-2xl bg-[#090d15] border border-white/[0.08] p-6 overflow-y-auto relative">
          {/* Subtle background grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />

          {filteredNodes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
              <Share2 className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No Context Nodes Detected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Nori indexes context as you open files in your editor, connect hardware, or create project tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${getNodeBorder(node)} ${
                      isSelected ? 'ring-2 ring-indigo-500 shadow-lg scale-[1.02]' : ''
                    }`}
                  >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/[0.05]">
                        {getNodeIcon(node)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                          {node.category} · {node.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-100 block truncate max-w-[170px]">
                          {node.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                        {Math.round(node.confidence * 100)}% conf
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {node.source}
                      </span>
                    </div>
                  </div>

                  {/* Node Snippet / Metadata preview */}
                  {node.metadata && Object.keys(node.metadata).length > 0 && (
                    <div className="text-[11px] text-slate-400 font-mono bg-black/30 p-2 rounded-lg border border-white/[0.04] truncate">
                      {Object.entries(node.metadata)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </div>
                  )}

                  {/* Connected Relationships Badge */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                    <span>Source: {node.source}</span>
                    <span className="text-indigo-400 font-medium hover:underline">
                      Inspect Relationships →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Node Relationship & Evidence Inspector Drawer */}
        {selectedNodeId && nodeDetail && (
          <div className="w-80 rounded-2xl bg-[#0d111a] border border-white/[0.08] p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Context Inspector
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Node Overview */}
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-400">
                  {nodeDetail.node.category} · {nodeDetail.node.type}
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {nodeDetail.node.name}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  ID: {nodeDetail.node.id}
                </div>
              </div>

              {/* Evidence & Confidence */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Confidence</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {Math.round(nodeDetail.node.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ingested Via</span>
                  <span className="font-mono text-slate-200">
                    {nodeDetail.node.source}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Context Scope</span>
                  <span className="font-mono text-slate-200 uppercase text-[10px]">
                    {nodeDetail.node.visibility}
                  </span>
                </div>
              </div>

              {/* Outbound Connected Edges */}
              {nodeDetail.connected_out && nodeDetail.connected_out.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Outbound Relationships ({nodeDetail.connected_out.length})
                  </span>
                  <div className="space-y-1.5">
                    {nodeDetail.connected_out.map((edge: any) => (
                      <div
                        key={edge.id}
                        onClick={() => setSelectedNodeId(edge.target_id)}
                        className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] text-indigo-400 font-mono">
                          <span>{edge.relation_type}</span>
                          <span>{Math.round(edge.confidence * 100)}%</span>
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5 truncate">
                          → {edge.other_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inbound Connected Edges */}
              {nodeDetail.connected_in && nodeDetail.connected_in.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Inbound Connections ({nodeDetail.connected_in.length})
                  </span>
                  <div className="space-y-1.5">
                    {nodeDetail.connected_in.map((edge: any) => (
                      <div
                        key={edge.id}
                        onClick={() => setSelectedNodeId(edge.source_id)}
                        className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono">
                          <span>← {edge.relation_type}</span>
                          <span>{Math.round(edge.confidence * 100)}%</span>
                        </div>
                        <div className="text-slate-200 font-medium mt-0.5 truncate">
                          {edge.other_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.06] text-[10px] text-slate-500 font-mono text-center">
              All relationships validated locally
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
