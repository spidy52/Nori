import React, { useState } from 'react';
import { useNori } from '../../context/NoriContext';
import { PageHeader } from '../common/PageHeader';
import {
  Folder,
  Plus,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Code2,
  Trash2,
  ExternalLink
} from 'lucide-react';

import { useToast } from '../common/ToastModalProvider';

interface ProjectItem {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
  starred?: boolean;
}

export const ProjectsView: React.FC = () => {
  const { setActiveView, workSummary } = useNori();
  const { showPrompt, showToast } = useToast();
  const [tab, setTab] = useState<'all' | 'recent' | 'starred'>('all');

  // Real projects from active work summary or user workspace
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    if (workSummary?.project_name) {
      return [
        {
          id: 'p_active',
          name: workSummary.project_name,
          path: 'Active Workspace Directory',
          lastOpened: 'Just now',
          starred: true
        }
      ];
    }
    return [];
  });

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
    );
  };

  const handleCreateNew = () => {
    showPrompt({
      title: 'Create New Project',
      message: 'Enter a name for your new workspace project:',
      placeholder: 'e.g. Vision-Engine',
      confirmLabel: 'Create Project',
      onConfirm: (name) => {
        if (!name.trim()) return;
        setProjects((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            name: name.trim(),
            path: `C:/Projects/${name.trim()}`,
            lastOpened: 'Just now',
            starred: false
          }
        ]);
        showToast(`Project "${name.trim()}" created`, 'success');
      }
    });
  };

  const filtered = projects.filter((p) => {
    if (tab === 'starred') return p.starred;
    return true;
  });

  return (
    <div className="nori-page">
      {/* Header */}
      <PageHeader
        title="My Projects"
        subtitle="Manage and switch between your indexed workspace projects."
        actions={
          <button
            onClick={handleCreateNew}
            className="nori-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-3">
        {(['all', 'recent', 'starred'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-9 px-4 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
              tab === t
                ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/10 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-white bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Responsive Grid System: repeat(auto-fill, minmax(320px, 1fr)) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        {/* Create Project Dashed Card */}
        <div
          onClick={handleCreateNew}
          className="p-8 rounded-md border-2 border-dashed border-white/[0.1] hover:border-orange-500/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer min-h-[160px] group"
        >
          <div className="w-12 h-12 rounded-md bg-white/[0.04] group-hover:bg-orange-500/20 text-slate-400 group-hover:text-orange-400 border border-white/[0.08] flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">
              Create a new project
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Start from a template or blank workspace.</p>
          </div>
        </div>

        {/* Existing Projects */}
        {filtered.map((proj) => (
          <div
            key={proj.id}
            onClick={() => setActiveView('home')}
            className="nori-card nori-card-hover flex flex-col justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-md bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-300 truncate">
                    {proj.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{proj.path}</p>
                </div>
              </div>

              <button
                onClick={(e) => toggleStar(proj.id, e)}
                className={`p-2 rounded-md border transition-colors cursor-pointer shrink-0 ${
                  proj.starred
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-white'
                }`}
                title="Star project"
              >
                <Star className={`w-4 h-4 ${proj.starred ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Last opened: {proj.lastOpened}</span>
              <span className="text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
