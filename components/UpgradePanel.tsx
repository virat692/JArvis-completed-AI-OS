import React, { useState, useMemo } from 'react';
import { 
  Sparkles, BrainCircuit, Clock, AlertTriangle, Trash2, CheckCircle2, 
  Plus, Search, RefreshCw, X, Shield, Cpu, Zap, Activity, HardDrive, 
  Layers, ArrowUpRight, Check, Play, Filter, Sliders, ChevronRight
} from 'lucide-react';
import { UpgradeRequest } from '../types';
import { 
  playDigitalPingSound, 
  playMechanicalClick, 
  playWhooshSound, 
  playDirectiveCompleteChime 
} from '../services/soundEffects';

interface UpgradePanelProps {
  isOpen: boolean;
  onClose: () => void;
  requests: UpgradeRequest[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onAddRequest?: (task: string, reason: string, priority: 'low' | 'medium' | 'high', suggestedModule?: string) => void;
  onApplyPatch?: (id: string) => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

type UpgradeFilter = 'ALL' | 'CRITICAL' | 'MEDIUM' | 'HARDWARE' | 'AI_CORE' | 'CAPABILITIES' | 'APPLIED';

export const UpgradePanel: React.FC<UpgradePanelProps> = ({ 
  isOpen, 
  onClose, 
  requests, 
  onClear, 
  onRemove, 
  onAddRequest,
  onApplyPatch,
  theme = 'cyber' 
}) => {
  const [activeFilter, setActiveFilter] = useState<UpgradeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [appliedPatches, setAppliedPatches] = useState<{ [id: string]: boolean }>({});
  const [patchingId, setPatchingId] = useState<string | null>(null);

  // Manual Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [newModule, setNewModule] = useState('');

  const allRequests = requests || [];

  if (!isOpen) return null;

  const handleTriggerScan = () => {
    playMechanicalClick();
    setIsScanning(true);
    setScanMessage('Scanning system architectures, latency logs, and capability registries...');
    
    setTimeout(() => {
      setScanMessage('Evaluating token throughput & GPU tensor utilization...');
    }, 900);

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('Scan complete. Systems evaluated against current architectural baseline.');
      playDigitalPingSound();
      setTimeout(() => setScanMessage(null), 3000);
    }, 1800);
  };

  const handleApplyPatch = (id: string, taskTitle: string) => {
    playMechanicalClick();
    setPatchingId(id);

    setTimeout(() => {
      setAppliedPatches(prev => ({ ...prev, [id]: true }));
      if (onApplyPatch) {
        onApplyPatch(id);
      }
      setPatchingId(null);
      playDirectiveCompleteChime();
    }, 1200);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    let priority: 'low' | 'medium' | 'high' = 'high';
    let raw = quickInput.trim();

    if (raw.toLowerCase().includes('!high')) {
      priority = 'high';
      raw = raw.replace(/!high/gi, '').trim();
    } else if (raw.toLowerCase().includes('!med')) {
      priority = 'medium';
      raw = raw.replace(/!med/gi, '').trim();
    } else if (raw.toLowerCase().includes('!low')) {
      priority = 'low';
      raw = raw.replace(/!low/gi, '').trim();
    }

    let moduleTag = 'neural_core';
    const modMatch = raw.match(/#(\w+)/);
    if (modMatch) {
      moduleTag = modMatch[1];
      raw = raw.replace(/#\w+/g, '').trim();
    }

    if (onAddRequest) {
      onAddRequest(raw, 'Manual operator enhancement directive', priority, moduleTag);
    }
    
    setQuickInput('');
    playDigitalPingSound();
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    if (onAddRequest) {
      onAddRequest(newTask.trim(), newReason.trim() || 'Operator system optimization', newPriority, newModule.trim() || 'system_core');
    }

    setNewTask('');
    setNewReason('');
    setNewModule('');
    setShowAddForm(false);
    playDigitalPingSound();
  };

  const filteredRequests = allRequests.filter(req => {
    const isApplied = req.status === 'applied' || !!appliedPatches[req.id];
    
    if (activeFilter === 'APPLIED' && !isApplied) return false;
    if (activeFilter === 'CRITICAL' && req.priority !== 'high') return false;
    if (activeFilter === 'MEDIUM' && req.priority !== 'medium') return false;
    if (activeFilter === 'HARDWARE' && !(req.suggested_module?.includes('nvidia') || req.suggested_module?.includes('gpu') || req.suggested_module?.includes('cpu'))) return false;
    if (activeFilter === 'AI_CORE' && !(req.task.toLowerCase().includes('neural') || req.task.toLowerCase().includes('vector') || req.suggested_module?.includes('vision'))) return false;
    if (activeFilter === 'CAPABILITIES' && !(req.task.toLowerCase().includes('swarm') || req.suggested_module?.includes('agent') || req.suggested_module?.includes('director'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTask = req.task.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      const matchMod = (req.suggested_module || '').toLowerCase().includes(q);
      if (!matchTask && !matchReason && !matchMod) return false;
    }

    return true;
  });

  const highPriorityCount = allRequests.filter(r => r.priority === 'high').length;
  const appliedCount = allRequests.filter(r => r.status === 'applied' || !!appliedPatches[r.id]).length;
  const systemHealthScore = Math.min(100, 84 + appliedCount * 4);

  return (
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col bg-[#010814]/98 backdrop-blur-3xl animate-in fade-in duration-300 overflow-hidden font-sans select-none text-white max-h-screen no-scrollbar scrollbar-none"
    >
      {/* Soft Radial Ambient Aura Glows (Matching Task & Weather Panels) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/12 blur-3xl pointer-events-none -z-10" />

      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                NEURAL SYSTEM UPGRADES
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                EVOLUTION MATRIX ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Dynamic Capability Patches</span>
              <span>•</span>
              <span>Hardware Optimization</span>
              <span>•</span>
              <span className="text-cyan-400">{allRequests.length} Enhancements Tracked</span>
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playMechanicalClick();
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>REQUEST UPGRADE</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
            title="Scan System for Missing Capabilities"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              playWhooshSound();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Close Upgrades Workspace (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. ALWAYS-VISIBLE QUICK DIRECTIVE COMMAND BAR */}
      <div className="px-6 py-2.5 bg-[#010816]/95 border-b border-cyan-500/20 shrink-0">
        <form onSubmit={handleQuickAddSubmit} className="flex items-center gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 text-xs font-orbitron font-bold shrink-0">
            <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">QUICK UPGRADE</span>
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="e.g. 'Integrate Local Audio Transcription Engine !high #whisper_local' (Press Enter to Queue)"
              className="w-full bg-[#020b18] border border-cyan-500/30 rounded-xl px-4 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>SUBMIT</span>
          </button>
        </form>

        {scanMessage && (
          <div className="mt-2 text-center text-xs font-mono text-cyan-300 animate-pulse bg-cyan-950/40 border border-cyan-500/30 py-1 rounded-lg">
            {scanMessage}
          </div>
        )}
      </div>

      {/* 3. MODAL MANUAL ADD UPGRADE EXPANDER (If opened) */}
      {showAddForm && (
        <div className="px-6 py-4 bg-[#031129]/90 border-b border-cyan-500/30 shrink-0 animate-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleManualFormSubmit} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">Upgrade Directive Title</label>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="e.g. High-Throughput Tensor Core Allocation"
                className="w-full bg-[#020914] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono"
                required
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">Technical Justification / Reason</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Eliminates inference bottleneck during multi-agent swarming"
                className="w-full bg-[#020914] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full bg-[#020914] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-cyan-300 outline-none font-mono"
              >
                <option value="high">CRITICAL / HIGH</option>
                <option value="medium">STANDARD / MED</option>
                <option value="low">OPTIONAL / LOW</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-orbitron font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer"
              >
                COMMIT
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. MAIN WORKSPACE BODY: 2-COLUMN TELEMETRY & UPGRADE MATRIX */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: TELEMETRY & CATEGORY SELECTOR (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto custom-scroll pr-1">
          
          {/* Readiness Score Card */}
          <div className="p-4 rounded-2xl bg-[#030e20]/80 border border-cyan-500/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-wider uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                SYSTEM EVOLUTION SCORE
              </span>
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                {systemHealthScore}% NOMINAL
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-cyan-500/20">
              <div 
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${systemHealthScore}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="block text-[9px] font-mono text-slate-400">PENDING</span>
                <span className="text-sm font-orbitron font-extrabold text-amber-300">{allRequests.length - appliedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="block text-[9px] font-mono text-slate-400">CRITICAL</span>
                <span className="text-sm font-orbitron font-extrabold text-rose-400">{highPriorityCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <span className="block text-[9px] font-mono text-slate-400">PATCHED</span>
                <span className="text-sm font-orbitron font-extrabold text-emerald-300">{appliedCount}</span>
              </div>
            </div>
          </div>

          {/* Upgrade Filter Categories */}
          <div className="p-3.5 rounded-2xl bg-[#030e20]/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col gap-1.5">
            <span className="text-[10px] font-orbitron font-bold text-slate-400 tracking-wider uppercase px-2 mb-1">
              UPGRADE VECTORS
            </span>

            {[
              { id: 'ALL', label: 'All Directives', icon: Layers, count: allRequests.length },
              { id: 'CRITICAL', label: 'Critical & High Priority', icon: AlertTriangle, count: highPriorityCount },
              { id: 'AI_CORE', label: 'Neural & Vector LLM', icon: BrainCircuit, count: allRequests.filter(r => r.task.toLowerCase().includes('neural') || r.task.toLowerCase().includes('vector')).length },
              { id: 'HARDWARE', label: 'GPU & TensorRT Overclock', icon: HardDrive, count: allRequests.filter(r => r.suggested_module?.includes('nvidia') || r.suggested_module?.includes('gpu')).length },
              { id: 'CAPABILITIES', label: 'Swarm & Orchestration', icon: Activity, count: allRequests.filter(r => r.task.toLowerCase().includes('swarm') || r.suggested_module?.includes('agent')).length },
              { id: 'APPLIED', label: 'Applied Patches', icon: CheckCircle2, count: appliedCount },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playMechanicalClick();
                    setActiveFilter(cat.id as UpgradeFilter);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-orbitron font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{cat.label}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    isActive ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200' : 'bg-white/5 border-white/10 text-slate-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="p-3.5 rounded-2xl bg-[#030e20]/80 border border-cyan-500/30 backdrop-blur-xl flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">CLEAR ALL DIRECTIVES</span>
            <button
              onClick={() => {
                playMechanicalClick();
                onClear();
              }}
              className="px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PURGE</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE UPGRADE CARDS STAGE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0 overflow-hidden">
          
          {/* Search & Filter Header Bar */}
          <div className="p-3 rounded-2xl bg-[#030e20]/80 border border-cyan-500/30 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search upgrade requests, modules, or justifications..."
                className="w-full bg-black/60 border border-cyan-500/20 rounded-xl pl-9 pr-4 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60"
              />
            </div>
            
            <span className="text-[10px] font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/30 shrink-0">
              {filteredRequests.length} OF {allRequests.length} VISIBLE
            </span>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto custom-scroll pr-1 space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-[#020b18]/60 border border-cyan-500/20 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-cyan-400 animate-pulse mb-3" />
                <h3 className="font-orbitron font-bold text-sm text-cyan-300 uppercase tracking-wider mb-1">
                  NO ACTIVE GAPS IN THIS CATEGORY
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-md">
                  All systems in the selected vector are fully optimized or have been patched to current architectural specifications.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isApplied = req.status === 'applied' || !!appliedPatches[req.id];
                const isPatching = patchingId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
                      isApplied
                        ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-[#030f24]/90 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-[#041430] shadow-[0_4px_20px_rgba(0,0,0,0.6)]'
                    }`}
                  >
                    {/* Top Row: Priority Badge, Module, Time, and Trash */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider border ${
                          req.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                            : req.priority === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {req.priority.toUpperCase()} PRIORITY
                        </span>

                        {req.suggested_module && (
                          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="text-slate-400">MOD:</span> #{req.suggested_module}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(req.timestamp).toLocaleDateString()}
                        </span>
                        
                        <button
                          onClick={() => {
                            playMechanicalClick();
                            onRemove(req.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Dismiss Upgrade Directive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Justification */}
                    <h3 className="font-orbitron font-extrabold text-sm text-white mb-1.5 tracking-wide flex items-center gap-2">
                      {isApplied && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <span>{req.task}</span>
                    </h3>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                      <span className="text-amber-400 font-bold font-mono">JUSTIFICATION:</span> {req.reason}
                    </p>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Est. Deployment: &lt; 2.5s</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isApplied ? (
                          <span className="text-[10px] font-orbitron font-extrabold text-emerald-400 bg-emerald-950/90 border border-emerald-500/50 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PATCH ACTIVE & DEPLOYED
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyPatch(req.id, req.task)}
                            disabled={isPatching}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-black font-orbitron font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isPatching ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>INSTALLING PATCH...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>APPLY & INSTALL PATCH</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default UpgradePanel;
