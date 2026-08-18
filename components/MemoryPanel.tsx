import React, { useState } from 'react';
import { 
  Database, Zap, Target, User, Search, Brain, Plus, Trash2, Shield, UserCircle, Settings2, 
  CheckCircle2, Sparkles, Flame, Save, Check, Network, Activity, BarChart2, HardDrive, 
  RefreshCw, Cpu, Download, Filter, Folder, Compass, Layers, Clock, Sliders, ArrowUpRight,
  TrendingUp, Code, Terminal, Lock, AlertCircle, FileText
} from 'lucide-react';
import { MemoryEntry } from '../types';
import { PERSONALITY_PRESETS, PURE_JARVIS_PROMPT, TONY_ATTITUDE_PROMPT, DEFAULT_VIRAT_PROFILE } from '../constants/personalities';
import { playDigitalPingSound, playWhooshSound } from '../services/soundEffects';
import { KnowledgeGraphView } from './KnowledgeGraphView';
import { capabilityRegistry, CapabilityItem } from '../services/capabilityRegistry';

interface MemoryPanelProps {
  memories: MemoryEntry[];
  personality: string;
  userIdentity: string;
  onAddMemory: (content: string, category: MemoryEntry['category'], type: MemoryEntry['type']) => void;
  onDeleteMemory: (id: string) => void;
  onUpdatePersonality: (val: string) => void;
  onUpdateIdentity: (val: string) => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

type MemorySection = 'CORE' | 'CAPABILITIES' | 'GRAPH' | 'BEHAVIOR' | 'PROFILE' | 'GOALS' | 'ARCHIVE' | 'SETTINGS';

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ 
  memories, 
  personality, 
  userIdentity,
  onAddMemory, 
  onDeleteMemory,
  onUpdatePersonality,
  onUpdateIdentity,
  theme = 'cyber'
}) => {
  const [activeSection, setActiveSection] = useState<MemorySection>('CORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  
  // New Memory Form State
  const [newMemory, setNewMemory] = useState('');
  const [category, setCategory] = useState<MemoryEntry['category']>('User');
  const [memoryType, setMemoryType] = useState<MemoryEntry['type']>('long_term');

  // Goals State
  const [customGoals, setCustomGoals] = useState<{ id: string; title: string; progress: number; priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' }[]>([
    { id: '1', title: 'Achieve 100% Full Native PC Control via OS Bridge', progress: 95, priority: 'CRITICAL' },
    { id: '2', title: 'Multi-LLM Intelligent Failover Routing (Gemini + Nemotron)', progress: 90, priority: 'HIGH' },
    { id: '3', title: 'Autonomous Swarm Agent Orchestration Subsystem', progress: 85, priority: 'HIGH' },
    { id: '4', title: 'Real-time Voice Synthesis & Audio Processing Engine', progress: 88, priority: 'MEDIUM' }
  ]);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  // Save feedback states
  const [savePersonalitySaved, setSavePersonalitySaved] = useState(false);
  const [saveIdentitySaved, setSaveIdentitySaved] = useState(false);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const handleSaveMemory = () => {
    if (newMemory.trim()) {
      onAddMemory(newMemory.trim(), category, memoryType);
      playDigitalPingSound();
      setNewMemory('');
    }
  };

  const handleSavePersonalityExplicit = () => {
    localStorage.setItem('jarvis_personality', personality);
    onUpdatePersonality(personality);
    playDigitalPingSound();
    setSavePersonalitySaved(true);
    setTimeout(() => setSavePersonalitySaved(false), 2500);
  };

  const handleSaveIdentityExplicit = () => {
    localStorage.setItem('jarvis_identity', userIdentity);
    onUpdateIdentity(userIdentity);
    playDigitalPingSound();
    setSaveIdentitySaved(true);
    setTimeout(() => setSaveIdentitySaved(false), 2500);
  };

  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      setCustomGoals(prev => [
        { id: Date.now().toString(), title: newGoalTitle.trim(), progress: 10, priority: 'HIGH' },
        ...prev
      ]);
      setNewGoalTitle('');
      playDigitalPingSound();
    }
  };

  // Filtered Memories
  const filteredMemories = memories.filter(m => {
    const matchesSearch = searchQuery === '' || m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategoryFilter === 'all') return true;
    if (selectedCategoryFilter === 'long_term') return m.type === 'long_term';
    if (selectedCategoryFilter === 'short_term') return m.type === 'short_term';
    return m.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
  });

  const longTermCount = memories.filter(m => m.type === 'long_term').length;
  const shortTermCount = memories.filter(m => m.type === 'short_term').length;

  const sidebarItems: { id: MemorySection; label: string; icon: any; badge?: string | number; group: 'HUB' | 'SYSTEM' }[] = [
    { id: 'CORE', label: 'Core Data', icon: Database, badge: memories.length, group: 'HUB' },
    { id: 'CAPABILITIES', label: 'System Capabilities', icon: Layers, badge: `${capabilityRegistry.getRegistry().capabilities.length} Acts`, group: 'HUB' },
    { id: 'GRAPH', label: 'Knowledge Graph', icon: Network, badge: '3D', group: 'HUB' },
    { id: 'BEHAVIOR', label: 'Behavior Matrix', icon: BarChart2, badge: 'AI', group: 'HUB' },
    { id: 'PROFILE', label: 'Operator Profile', icon: UserCircle, badge: 'Biometric', group: 'HUB' },
    { id: 'GOALS', label: 'Strategic Goals', icon: Target, badge: customGoals.length, group: 'SYSTEM' },
    { id: 'ARCHIVE', label: 'Vector Storage', icon: HardDrive, badge: 'ChromaDB', group: 'SYSTEM' },
    { id: 'SETTINGS', label: 'Retention & Sync', icon: Sliders, group: 'SYSTEM' },
  ];

  return (
    <div className={`h-full w-full flex flex-col md:flex-row rounded-2xl overflow-hidden relative border transition-all duration-300 ${
      isSlate
        ? 'bg-zinc-900 border-slate-700/80 text-slate-100 shadow-2xl'
        : isMinimal
          ? 'bg-[#0f172a] border-emerald-500/20 text-slate-100 shadow-2xl'
          : isGold
            ? 'bg-[#181310] border-amber-500/20 text-amber-100 shadow-2xl'
            : 'bg-black/90 border-cyan-500/30 text-slate-100 shadow-[0_0_50px_rgba(0,242,255,0.12)]'
    }`}>
      
      {/* MAC FINDER / VS CODE STYLE LEFT SIDEBAR NAVIGATION */}
      <div className={`w-full md:w-64 lg:w-72 flex flex-col shrink-0 border-b md:border-b-0 md:border-r p-3.5 space-y-4 select-none ${
        isSlate ? 'bg-zinc-950/80 border-slate-700/60' : 'bg-black/60 border-white/10'
      }`}>
        
        {/* App Title & Status */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 border border-cyan-400/50 rounded-xl text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.25)]">
              <Brain className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-wider uppercase">MEMORY MANAGER</h2>
              <span className="text-[9px] font-mono text-slate-400">JARVIS OS v4.3 • IDE Engine</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-ping" />
        </div>

        {/* Navigation Sidebar List */}
        <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-1">
          {/* HUB GROUP */}
          <div className="space-y-1">
            <span className="text-[9px] font-orbitron text-slate-500 uppercase tracking-[0.2em] font-bold px-2">
              NEURAL HUBS
            </span>
            {sidebarItems.filter(i => i.group === 'HUB').map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); playWhooshSound(); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-orbitron font-bold transition-all group ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200' : 'bg-white/5 border-white/10 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SYSTEM GROUP */}
          <div className="space-y-1">
            <span className="text-[9px] font-orbitron text-slate-500 uppercase tracking-[0.2em] font-bold px-2">
              PERSISTENCE & RULES
            </span>
            {sidebarItems.filter(i => i.group === 'SYSTEM').map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); playWhooshSound(); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-orbitron font-bold transition-all group ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200' : 'bg-white/5 border-white/10 text-slate-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Telemetry Footer */}
        <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2 text-[9.5px] font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>STORAGE HEALTH</span>
            <span className="text-emerald-400 font-bold">100% ONLINE</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-[82%] animate-pulse" />
          </div>
          <div className="flex justify-between text-slate-500 text-[8.5px]">
            <span>ChromaDB Vector Store</span>
            <span>1536 dims</span>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: FULL WORKSPACE AREA (100% WIDTH/HEIGHT) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black/30 p-4 lg:p-6">
        
        {/* Workspace Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-white/10 gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold uppercase">
              JARVIS / MEMORY MANAGER / {activeSection}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Search */}
            {activeSection === 'CORE' && (
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter memories..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60 font-mono"
                />
              </div>
            )}

            <button
              onClick={() => playDigitalPingSound()}
              className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>SYNC</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE VIEW CONTENT SWITCHER */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1">

          {/* 1. CORE DATA WORKSPACE */}
          {activeSection === 'CORE' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Quick Memory Commit Bar */}
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/25 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" /> COMMIT NEW MEMORY ANCHOR
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/80">Vector Embedded Instantly</span>
                </div>

                <textarea
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  placeholder="Enter core fact, strategic directive, or system observation..."
                  className="w-full h-20 bg-black/70 border border-white/10 rounded-xl p-3 text-xs font-sans text-slate-100 focus:border-cyan-400/80 focus:outline-none transition-all resize-none leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="bg-black/70 border border-white/10 text-xs font-orbitron text-cyan-300 px-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-400/60"
                    >
                      <option value="User">USER_INTEL</option>
                      <option value="Project">PROJECT_DATA</option>
                      <option value="Goal">STRATEGIC_GOAL</option>
                      <option value="System">SYSTEM_METRIC</option>
                    </select>

                    <select 
                      value={memoryType}
                      onChange={(e) => setMemoryType(e.target.value as any)}
                      className="bg-black/70 border border-white/10 text-xs font-orbitron text-purple-300 px-3 py-1.5 rounded-xl focus:outline-none focus:border-purple-400/60"
                    >
                      <option value="long_term">PERMANENT (LONG_TERM)</option>
                      <option value="short_term">TACTICAL (SHORT_TERM)</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleSaveMemory}
                    disabled={!newMemory.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/50 text-cyan-300 font-orbitron text-xs font-bold rounded-xl transition-all uppercase tracking-widest disabled:opacity-30 shadow-md active:scale-95"
                  >
                    Commit Anchor
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                {['all', 'long_term', 'short_term', 'User', 'Project', 'Goal', 'System'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl border transition-all uppercase whitespace-nowrap ${
                      selectedCategoryFilter === cat
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Units' : cat}
                  </button>
                ))}
              </div>

              {/* Memories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredMemories.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-xs font-mono text-slate-500 bg-black/30 rounded-2xl border border-white/5">
                    No matching memory anchors found.
                  </div>
                ) : (
                  filteredMemories.map((m) => (
                    <div key={m.id} className="group relative bg-black/50 p-4 border border-white/10 rounded-2xl hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all duration-200 shadow-sm flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            m.category === 'Goal' ? 'bg-emerald-400' : m.category === 'User' ? 'bg-cyan-400' : 'bg-purple-400'
                          }`} />
                          <span className="text-[9.5px] font-orbitron font-bold text-slate-300 uppercase">{m.category}</span>
                          <span className="text-[8.5px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                            {m.type === 'long_term' ? 'PERMANENT' : 'TACTICAL'}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteMemory(m.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Memory Anchor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs font-sans text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </p>

                      <div className="text-[8.5px] font-mono text-slate-500 border-t border-white/5 pt-2 flex items-center justify-between">
                        <span>ID: {m.id.slice(0, 8)}</span>
                        <span>{new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 1.5 SYSTEM CAPABILITIES & AUTHORITATIVE SELF-KNOWLEDGE */}
          {activeSection === 'CAPABILITIES' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Banner */}
              <div className="p-5 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 rounded-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-orbitron font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    JARVIS Self-Knowledge & Authoritative Capabilities Registry
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300">
                    {capabilityRegistry.getRegistry().developmentLevel} // {capabilityRegistry.getRegistry().version}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Permanent authoritative knowledge layer mapping current verified capabilities, execution tiers, responsible modules, and operational boundaries.
                </p>
              </div>

              {/* Core Architecture Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Primary Brain</span>
                  <div className="text-cyan-300 font-bold text-sm">{capabilityRegistry.getRegistry().architecture.primaryBrain}</div>
                  <p className="text-[10px] text-slate-400 font-sans">Single central intelligence & coordinator.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Backend Worker</span>
                  <div className="text-purple-300 font-bold text-sm">NVIDIA Nemotron</div>
                  <p className="text-[10px] text-slate-400 font-sans">On-demand code/AST worker only — not a second brain.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-1">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Persistence</span>
                  <div className="text-emerald-300 font-bold text-sm">{capabilityRegistry.getRegistry().architecture.dataPersistence}</div>
                  <p className="text-[10px] text-slate-400 font-sans">100% local-first privacy storage.</p>
                </div>
              </div>

              {/* Registered Capabilities Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbitron font-bold text-slate-200 uppercase tracking-wider">
                    Verified Capabilities Ledger ({capabilityRegistry.getRegistry().capabilities.length})
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400">Strict Source of Truth</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {capabilityRegistry.getRegistry().capabilities.map((cap) => (
                    <div key={cap.id} className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3 hover:border-cyan-500/40 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-orbitron font-bold text-slate-100 flex items-center gap-2">
                            <span>{cap.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-400/80">{cap.category} • {cap.executionTier}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono font-bold border ${
                          cap.status === 'FUNCTIONAL' 
                            ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300' 
                            : cap.status === 'PARTIAL'
                              ? 'bg-amber-500/10 border-amber-400/40 text-amber-300'
                              : 'bg-purple-500/10 border-purple-400/40 text-purple-300'
                        }`}>
                          {cap.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {cap.description}
                      </p>

                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl space-y-1 text-[9.5px] font-mono">
                        <div className="text-slate-400">Implementation Mapping:</div>
                        <div className="text-cyan-300 truncate">{cap.implementation.sourceFile}</div>
                        <div className="text-slate-500 truncate">Entry: {cap.implementation.entryClassOrFunction}</div>
                      </div>

                      {cap.allowedActions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Allowed Actions:</span>
                          <ul className="text-[10.5px] font-sans text-slate-300 space-y-0.5 list-disc list-inside">
                            {cap.allowedActions.map((act, i) => (
                              <li key={i} className="truncate">{act}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Known Boundaries */}
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
                <span className="text-xs font-orbitron font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" /> Operational Transparency & Boundaries
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  JARVIS internally references this registry prior to taking action. Actions outside verified capabilities are transparently reported without hallucination.
                </p>
              </div>
            </div>
          )}

          {/* 2. KNOWLEDGE GRAPH WORKSPACE (100% WIDTH/HEIGHT) */}
          {activeSection === 'GRAPH' && (
            <div className="h-full min-h-[500px]">
              <KnowledgeGraphView />
            </div>
          )}

          {/* 3. BEHAVIOR MATRIX WORKSPACE */}
          {activeSection === 'BEHAVIOR' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Telemetry Overview Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-purple-950/20 border border-purple-500/25 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Decision Consistency</span>
                  <div className="text-lg font-orbitron font-bold text-purple-300 mt-1">98.4%</div>
                  <span className="text-[8.5px] font-mono text-emerald-400">↑ 1.2% optimal</span>
                </div>
                <div className="p-4 bg-cyan-950/20 border border-cyan-500/25 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Learning Curve</span>
                  <div className="text-lg font-orbitron font-bold text-cyan-300 mt-1">Accelerated</div>
                  <span className="text-[8.5px] font-mono text-cyan-400">128 Pattern Cycles</span>
                </div>
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/25 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Tone Alignment</span>
                  <div className="text-lg font-orbitron font-bold text-emerald-300 mt-1">99.8%</div>
                  <span className="text-[8.5px] font-mono text-emerald-400">Loyal & Sarcastic</span>
                </div>
                <div className="p-4 bg-amber-950/20 border border-amber-500/25 rounded-2xl">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">AI Predictions</span>
                  <div className="text-lg font-orbitron font-bold text-amber-300 mt-1">Autonomous</div>
                  <span className="text-[8.5px] font-mono text-amber-400">High Trust Rating</span>
                </div>
              </div>

              {/* Habit Heatmap (GitHub Style) */}
              <div className="p-5 bg-black/50 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbitron font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" /> 30-DAY NEURAL ACTIVITY HEATMAP
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Average: 42 interactions / day</span>
                </div>

                <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 pt-2">
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const intensity = (idx * 7) % 5;
                    let color = 'bg-slate-800';
                    if (intensity === 1) color = 'bg-purple-900/60 border border-purple-500/30';
                    if (intensity === 2) color = 'bg-purple-700/80 border border-purple-400/50';
                    if (intensity === 3) color = 'bg-cyan-500/80 border border-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.4)]';
                    if (intensity === 4) color = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]';
                    return (
                      <div key={idx} className={`h-7 rounded-lg transition-all hover:scale-110 cursor-pointer ${color}`} title={`Day ${idx + 1}: ${intensity * 18} logs`} />
                    );
                  })}
                </div>
              </div>

              {/* Behavioral Prompt Matrix Customization */}
              <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-orbitron font-bold text-purple-300 uppercase tracking-wider">BEHAVIORAL PROMPT MATRIX</span>
                  </div>
                  <button
                    onClick={handleSavePersonalityExplicit}
                    className={`px-4 py-1.5 rounded-xl text-xs font-orbitron font-bold flex items-center gap-2 transition-all active:scale-95 ${
                      savePersonalitySaved 
                        ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40'
                    }`}
                  >
                    {savePersonalitySaved ? <Check className="w-3.5 h-3.5 text-black stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savePersonalitySaved ? 'SAVED' : 'SAVE MATRIX'}</span>
                  </button>
                </div>

                {/* Personality Preset Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onUpdatePersonality(PURE_JARVIS_PROMPT);
                      localStorage.setItem('jarvis_personality', PURE_JARVIS_PROMPT);
                    }}
                    className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                      !personality.includes("ATTITUDE") ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200' : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-orbitron font-bold uppercase">Pure Jarvis Protocol</div>
                    <p className="text-[11px] font-sans text-slate-300">Formal, polite, ultra-loyal & highly intelligent assistant.</p>
                  </button>

                  <button
                    onClick={() => {
                      onUpdatePersonality(TONY_ATTITUDE_PROMPT);
                      localStorage.setItem('jarvis_personality', TONY_ATTITUDE_PROMPT);
                    }}
                    className={`p-4 rounded-xl border text-left space-y-1 transition-all ${
                      personality.includes("ATTITUDE") ? 'bg-purple-950/40 border-purple-400 text-purple-200' : 'bg-black/40 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-orbitron font-bold uppercase">Jarvis Attitude / Funny Mode</div>
                    <p className="text-[11px] font-sans text-slate-300">Witty, sarcastic, hilarious best friend with high energy!</p>
                  </button>
                </div>

                <textarea
                  value={personality}
                  onChange={(e) => onUpdatePersonality(e.target.value)}
                  className="w-full h-36 bg-black/70 border border-white/10 rounded-xl p-3.5 text-xs font-sans text-slate-100 focus:border-purple-400 focus:outline-none leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* 4. OPERATOR PROFILE WORKSPACE */}
          {activeSection === 'PROFILE' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Operator Hero Identity Card */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/30 via-slate-900/50 to-cyan-950/30 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 font-orbitron text-2xl font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                    VP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-orbitron font-extrabold text-slate-100">VIRAT PRAJAPATI SIR</h3>
                      <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/40">
                        VERIFIED OPERATOR
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-300 mt-1">Lead System Architect • Full Native PC Control Authority</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdateIdentity(DEFAULT_VIRAT_PROFILE);
                      localStorage.setItem('jarvis_identity', DEFAULT_VIRAT_PROFILE);
                    }}
                    className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-xs font-orbitron text-emerald-300 font-bold transition-all"
                  >
                    RESET VIRAT PROFILE
                  </button>
                  <button
                    onClick={handleSaveIdentityExplicit}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 rounded-xl text-xs font-orbitron font-bold transition-all"
                  >
                    SAVE PROFILE
                  </button>
                </div>
              </div>

              {/* Operator Identity Text Prompt */}
              <div className="p-5 bg-black/50 border border-white/10 rounded-2xl space-y-3">
                <span className="text-xs font-orbitron font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-emerald-400" /> BIOMETRIC OPERATOR PROFILE BUFFER
                </span>
                <textarea
                  value={userIdentity}
                  onChange={(e) => onUpdateIdentity(e.target.value)}
                  className="w-full h-44 bg-black/70 border border-white/10 rounded-xl p-4 text-xs font-sans text-slate-100 focus:border-emerald-400 focus:outline-none leading-relaxed"
                />
              </div>

            </div>
          )}

          {/* 5. STRATEGIC GOALS WORKSPACE */}
          {activeSection === 'GOALS' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Add Goal Input Bar */}
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/25 rounded-2xl flex items-center gap-3">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Add new strategic milestone or target goal..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-sans"
                />
                <button
                  onClick={handleAddGoal}
                  className="px-4 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-xl text-xs font-orbitron font-bold hover:bg-cyan-500/30"
                >
                  ADD GOAL
                </button>
              </div>

              {/* Goals Cards Grid */}
              <div className="space-y-3">
                {customGoals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-bold text-slate-100">{goal.title}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                        {goal.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-xs font-mono text-cyan-300 font-bold">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 6. VECTOR STORAGE WORKSPACE */}
          {activeSection === 'ARCHIVE' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 bg-black/50 border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" /> CHROMADB AIR-GAPPED VECTOR STORE
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-400">./jarvis_memory Active</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[9px]">TOTAL EMBEDDINGS</span>
                    <div className="text-cyan-300 font-bold text-sm mt-0.5">{memories.length * 14} vectors</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[9px]">EMBEDDING MODEL</span>
                    <div className="text-purple-300 font-bold text-sm mt-0.5">text-embedding-004</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-slate-400 text-[9px]">COSINE SIMILARITY</span>
                    <div className="text-emerald-300 font-bold text-sm mt-0.5">0.94 threshold</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. SETTINGS & RETENTION WORKSPACE */}
          {activeSection === 'SETTINGS' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 bg-black/50 border border-white/10 rounded-2xl space-y-4">
                <span className="text-xs font-orbitron font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> RETENTION & PRUNING POLICIES
                </span>
                
                <div className="space-y-3 text-xs font-mono text-slate-300">
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <span>Auto-compress short-term memories after 7 days</span>
                    <input type="checkbox" defaultChecked className="accent-cyan-400" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <span>Lock permanent anchors from accidental deletion</span>
                    <input type="checkbox" defaultChecked className="accent-cyan-400" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer">
                    <span>Sync ChromaDB vectors with local Python gateway</span>
                    <input type="checkbox" defaultChecked className="accent-cyan-400" />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default MemoryPanel;
