import React, { useState, useEffect } from 'react';
import { useNori } from '../../context/NoriContext';
import { askNori } from '../../services/api';
import { NoriReasoningResponse } from '../../types';
import {
  Search,
  X,
  Sparkles,
  CheckCircle2,
  FileCode,
  Box,
  Cpu,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export const AskNoriModal: React.FC = () => {
  const {
    isAskModalOpen,
    setIsAskModalOpen,
    commandQuery,
    setCommandQuery,
    setNoriState,
    setActiveView
  } = useNori();

  const [inputQuery, setInputQuery] = useState('');
  const [response, setResponse] = useState<NoriReasoningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAskModalOpen && commandQuery) {
      setInputQuery(commandQuery);
      handleExecuteQuery(commandQuery);
    }
  }, [isAskModalOpen, commandQuery]);

  if (!isAskModalOpen) return null;

  const handleExecuteQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const lower = queryText.toLowerCase();
    if (
      lower.startsWith('draw') ||
      lower.includes(' draw ') ||
      lower.includes('diagram') ||
      lower.includes('sketch') ||
      lower.includes('architecture graph') ||
      lower.includes('flowchart')
    ) {
      setIsAskModalOpen(false);
      setActiveView('canvas');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('nori-auto-draw', { detail: { prompt: queryText.trim() } })
        );
      }, 350);
      return;
    }

    setLoading(true);
    setError(null);
    setNoriState('thinking');

    try {
      const res = await askNori(queryText);
      setResponse(res);
      setNoriState('ready');
    } catch (err: any) {
      setError(err.message || 'Failed to process context query');
      setNoriState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeWorkspace = (resumable: any) => {
    setIsAskModalOpen(false);
    setActiveView('canvas');
  };

  const quickPrompts = [
    'What am I working on?',
    'Why is my laptop slow?',
    'What is this?',
    'Resume my work',
    'What changed today?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-3xl rounded-lg bg-[#0d111a] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Command Search Input Bar */}
        <div className="p-4 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery(inputQuery)}
            placeholder="Ask Nori anything about your work, code, desk, or device..."
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-500 font-sans"
            autoFocus
          />
          {inputQuery && (
            <button
              onClick={() => setInputQuery('')}
              className="p-1 rounded-md hover:bg-white/[0.06] text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleExecuteQuery(inputQuery)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            {loading ? 'Reasoning...' : 'Ask Nori'}
          </button>
          <button
            onClick={() => setIsAskModalOpen(false)}
            className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Response / Loading / Error Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <div className="text-xs text-slate-400 font-mono">
                Reasoning over active Windows work context using local AI engine...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-md bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {!loading && !response && !error && (
            <div className="py-12 text-center text-xs text-slate-500 space-y-1">
              <div>Type a question or select a suggested prompt above.</div>
              <div className="text-[11px] text-slate-600 font-mono">
                Responses are synthesized from your active project files, physical sensors, and device workload.
              </div>
            </div>
          )}

          {!loading && response && (
            <div className="space-y-5">
              {/* Response Headline & Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Nori Context Reasoning
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.05]">
                    {response.provider_used} · {response.execution_time_ms} ms
                  </span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">
                  {response.headline}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {response.summary}
                </p>
              </div>

              {/* Visual Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {response.breakdowns.map((card, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-1.5"
                  >
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {card.category}
                    </div>
                    <div className="text-xs font-semibold text-slate-100">
                      {card.title}
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {card.items.map((it, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Resumable Workspace Action (if available) */}
              {response.resumable_workspace && (
                <div className="p-4 rounded-md bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-300">
                      Resumable Session Ready: {response.resumable_workspace.project_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Files: {response.resumable_workspace.files_to_open.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResumeWorkspace(response.resumable_workspace)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Resume Workspace
                  </button>
                </div>
              )}

              {/* Evidence Chain */}
              <div className="p-4 rounded-md bg-black/40 border border-white/[0.04] space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Grounding Evidence Chain ({response.evidence_chain.length} Verified Sources)
                </div>
                <div className="space-y-1.5">
                  {response.evidence_chain.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-200">{ev.title}:</span>{' '}
                        <span className="text-slate-400">{ev.detail}</span>{' '}
                        <span className="text-[10px] text-slate-500 font-mono">[{ev.source}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
