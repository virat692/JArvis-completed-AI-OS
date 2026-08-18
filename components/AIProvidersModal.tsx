import { useState, useSyncExternalStore, useEffect } from 'react';
import { 
  Cpu, 
  Activity, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Radio, 
  Sparkles, 
  Layers, 
  ShieldAlert, 
  Bot, 
  Flame, 
  Compass, 
  Clock, 
  Terminal 
} from 'lucide-react';
import { aiProviderManager, TaskCategory } from '../services/AIProviderManager';
import { playWhooshSound, playDigitalPingSound } from '../services/soundEffects';

interface AIProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIProvidersModal = ({ isOpen, onClose }: AIProvidersModalProps) => {
  const activeProviderId = useSyncExternalStore(
    (cb) => aiProviderManager.subscribe(cb),
    () => aiProviderManager.getActiveProviderId()
  );

  const [healthStatuses, setHealthStatuses] = useState(aiProviderManager.getAllHealthStatuses());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Write a high-performance concurrent task queue in TypeScript.');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskCategory>('coding');

  const allProviders = aiProviderManager.getAllProviders();

  useEffect(() => {
    if (isOpen) {
      handleRefreshHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    playWhooshSound();
    const statuses = await aiProviderManager.runHealthCheckAll();
    setHealthStatuses(statuses);
    setIsRefreshing(false);
  };

  const handleSelectProvider = (id: string) => {
    playDigitalPingSound();
    aiProviderManager.setActiveProvider(id);
  };

  const handleTestInference = async () => {
    if (!testPrompt.trim()) return;
    setIsTesting(true);
    setTestOutput('Initializing provider stream...\n');
    playWhooshSound();

    try {
      let accumulated = '';
      const response = await aiProviderManager.streamWithTask(
        selectedTask,
        testPrompt,
        (chunk) => {
          accumulated += chunk;
          setTestOutput(accumulated);
        }
      );

      setTestOutput(prev => prev + `\n\n[Inference Metrics]\nProvider: ${response.provider} | Model: ${response.model} | Latency: ${response.latencyMs}ms | Tokens: ${response.usage.totalTokens}`);
    } catch (err: any) {
      setTestOutput(`[Error]: ${err?.message || 'Failed to complete test stream'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-cyan-500/40 w-full max-w-6xl h-[92vh] rounded-3xl flex flex-col overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.2)] relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-cyan-400 to-purple-600 animate-pulse" />

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-orbitron font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                MULTI-LLM PROVIDER ARCHITECTURE & NEMOTRON ULTRA ENGINE <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30">SYSTEM CONSOLE V8</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Unified provider manager with NVIDIA Nemotron Ultra, Gemini, OpenAI, Claude, DeepSeek & Local LLM.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshHealth}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Pinging...' : 'Ping Providers'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto custom-scroll space-y-6">
          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProviders.map((provider) => {
              const info = provider.getModelInfo();
              const health = healthStatuses.find(h => h.provider === provider.id);
              const metrics = aiProviderManager.getMetrics(provider.id);
              const isActive = activeProviderId === provider.id;

              return (
                <div
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 ${
                    isActive
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                      : 'bg-black/60 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-cyan-500 text-black font-orbitron font-extrabold text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 shadow-md">
                      <Radio className="w-3 h-3 animate-ping" /> ACTIVE PROVIDER
                    </div>
                  )}

                  {/* Top Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                        {provider.id === 'nemotron' && <Flame className="w-4 h-4 text-amber-400" />}
                        {provider.id === 'gemini' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                        {provider.id === 'openai' && <Bot className="w-4 h-4 text-emerald-400" />}
                        {provider.id === 'claude' && <Compass className="w-4 h-4 text-purple-400" />}
                        {provider.id === 'deepseek' && <Zap className="w-4 h-4 text-blue-400" />}
                        {provider.id === 'local' && <Layers className="w-4 h-4 text-rose-400" />}
                        {provider.name}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Default Model: <strong className="text-slate-200">{info.id}</strong>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {info.recommendedFor.map((rec, i) => (
                        <span key={i} className="text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Health & Performance Telemetry */}
                  <div className="pt-3 border-t border-white/10 space-y-2 font-mono text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">HEALTH STATUS</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        health?.status === 'ONLINE' ? 'text-emerald-400' :
                        health?.status === 'DEGRADED' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {health?.status === 'ONLINE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {health?.status || 'CHECKING'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">LATENCY</span>
                      <span className="text-cyan-300 font-bold">{health?.latencyMs ?? 0} ms</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">TOKENS CONSUMED</span>
                      <span className="text-amber-300 font-bold">{metrics?.tokensUsed.toLocaleString() ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">REQUESTS COMPLETED</span>
                      <span className="text-purple-300 font-bold">{metrics?.requestsCompleted ?? 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Sandbox & Task Routing Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Task Routing Configuration Table */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
              <span className="text-xs font-orbitron font-extrabold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" /> INTELLIGENT MODEL ROUTING LOGIC
              </span>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Complex Reasoning & Math</span>
                    <span className="text-[10px] text-slate-400">Task: complexReasoning</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[10px]">
                    NVIDIA NEMOTRON ULTRA
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Software Engineering & Debugging</span>
                    <span className="text-[10px] text-slate-400">Task: coding / debugging</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-[10px]">
                    NVIDIA NEMOTRON ULTRA
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">General Conversation & Multimodal Vision</span>
                    <span className="text-[10px] text-slate-400">Task: generalChat / vision</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-[10px]">
                    GOOGLE GEMINI 2.5
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Deep Architectural Research</span>
                    <span className="text-[10px] text-slate-400">Task: research</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold text-[10px]">
                    CLAUDE 3.5 SONNET
                  </span>
                </div>
              </div>
            </div>

            {/* Inference Testing Console */}
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3 flex flex-col justify-between">
              <span className="text-xs font-orbitron font-extrabold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" /> LIVE PROVIDER INFERENCE SANDBOX
              </span>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value as TaskCategory)}
                    className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="coding">Task: Coding (Nemotron)</option>
                    <option value="complexReasoning">Task: Complex Reasoning (Nemotron)</option>
                    <option value="generalChat">Task: General Chat (Gemini)</option>
                    <option value="research">Task: Research (Claude)</option>
                    <option value="localOffline">Task: Local Offline (Llama 3.2)</option>
                  </select>

                  <button
                    onClick={handleTestInference}
                    disabled={isTesting}
                    className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-amber-500 text-white font-orbitron font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> {isTesting ? 'Streaming...' : 'Run Test Stream'}
                  </button>
                </div>

                <textarea
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full h-20 bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-400/60 resize-none"
                  placeholder="Enter test prompt..."
                />

                <div className="h-28 bg-slate-950 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-cyan-300 overflow-y-auto whitespace-pre-wrap">
                  {testOutput || '// Streamed response output will appear here...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
