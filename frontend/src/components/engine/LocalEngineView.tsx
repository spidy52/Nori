import React, { useState, useEffect } from 'react';
import { useNori } from '../../context/NoriContext';
import { fetchModels, runBenchmark } from '../../services/api';
import { PageHeader } from '../common/PageHeader';
import {
  Zap,
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  Server,
  RefreshCw,
  HardDrive
} from 'lucide-react';

export const LocalEngineView: React.FC = () => {
  const { deviceStatus, openAskWithQuery } = useNori();
  const [modelInfo, setModelInfo] = useState<any | null>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [benchmarking, setBenchmarking] = useState(false);

  useEffect(() => {
    fetchModels().then(setModelInfo).catch(console.error);
  }, []);

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const results = await runBenchmark();
      setBenchmarks(results);
    } catch (e) {
      console.error('Benchmark failed', e);
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="nori-page">
      {/* 1. Header */}
      <PageHeader
        title="Heterogeneous AI Acceleration Engine"
        subtitle="Perception, embeddings, and reasoning execute locally using detected DirectML hardware shaders."
        actions={
          <button
            onClick={handleRunBenchmark}
            disabled={benchmarking}
            className="nori-btn-primary"
          >
            <Activity className={`w-4 h-4 ${benchmarking ? 'animate-spin' : ''}`} />
            <span>{benchmarking ? 'Running Benchmarks...' : 'Run Live Benchmark'}</span>
          </button>
        }
      />

      {/* 2. Main Page Content */}
      <div className="nori-page-content">
        {/* Hardware Status Banner */}
        <div className="nori-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap className="w-5 h-5 fill-cyan-400" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  Local AI Runtime Engine
                </span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {deviceStatus?.npu?.runtime_name || 'DirectML Neural Shader Pipeline'}
                </span>
              </div>
            </div>

            <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
              deviceStatus?.npu?.is_available
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}>
              {deviceStatus?.npu?.is_available ? '● AI Accelerator Active' : '● DirectML Hardware Ready'}
            </span>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/[0.06]">
            {deviceStatus?.npu?.status_reason || 'Using local DirectX 12 DirectML compute execution providers with genuine system hardware telemetry.'}
          </div>
        </div>

        {/* Benchmark Results (if run) */}
        {benchmarks.length > 0 && (
          <div className="nori-card space-y-3 bg-emerald-950/20 border-emerald-500/30">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Measured Live On-Device Inference Benchmarks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {benchmarks.map((bm, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
                  <div className="text-xs font-bold text-slate-200">{bm.model_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Device: {bm.device}</div>
                  <div className="text-base font-mono font-extrabold text-emerald-300">
                    {bm.latency_ms > 0 ? `${bm.latency_ms} ms` : 'Offline'}
                  </div>
                  <div className="text-[10px] text-slate-500">{bm.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Roles & Routing Matrix */}
        <div className="nori-card flex flex-col gap-4 flex-1">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Multi-Model AI Fabric & Task Placement
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Specialized models are assigned to specific hardware shaders to balance latency, battery, and capability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full flex-1">
            {modelInfo?.roles?.map((role: any) => (
              <div
                key={role.role_id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between gap-3 hover:border-orange-500/30 transition-all"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      {role.role_id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                      {role.target_device}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100">
                    {role.name}
                  </h4>

                  <p className="text-xs text-slate-400 leading-relaxed text-wrap-safe">
                    {role.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-white/[0.04]">
                  <span>Quant: {role.quantization}</span>
                  <span className="text-cyan-400 font-bold">~{role.typical_latency_ms} ms</span>
                </div>
              </div>
            )) || (
              <div className="col-span-full p-8 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-xs text-slate-400">
                Loading AI Model placement registry...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

