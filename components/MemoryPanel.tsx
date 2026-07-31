
import React, { useState } from 'react';
import { Database, Zap, Target, User, Search, Brain, Plus, Trash2, Shield, UserCircle, Settings2, CheckCircle2, Sparkles, Flame, Save, Check } from 'lucide-react';
import { MemoryEntry } from '../types';
import { PERSONALITY_PRESETS, PURE_JARVIS_PROMPT, TONY_ATTITUDE_PROMPT, DEFAULT_VIRAT_PROFILE } from '../constants/personalities';

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

type MemoryTab = 'CORE' | 'PERSONALITY' | 'IDENTITY';

const MemoryItem: React.FC<{ memory: MemoryEntry; onDelete: (id: string) => void }> = ({ memory, onDelete }) => (
  <div className="group relative bg-white/[0.02] p-3 border border-white/5 rounded hover:bg-white/[0.04] transition-all animate-in slide-in-from-bottom-2">
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`w-1 h-1 rounded-full ${
        memory.category === 'Goal' ? 'bg-green-400' : 
        memory.category === 'User' ? 'bg-cyan-400' : 
        'bg-purple-400'
      }`} />
      <span className="text-[8px] font-bold text-slate-500 uppercase font-orbitron tracking-tighter">{memory.category}</span>
      <span className="ml-auto text-[7px] font-mono text-slate-600">
        {new Date(memory.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </span>
      <button 
        onClick={() => onDelete(memory.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-500 transition-all"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
    <p className="text-[11px] text-slate-300 font-light leading-relaxed font-sans whitespace-pre-wrap">{memory.content}</p>
  </div>
);

const MemoryPanel: React.FC<MemoryPanelProps> = ({ 
  memories, 
  personality, 
  userIdentity,
  onAddMemory, 
  onDeleteMemory,
  onUpdatePersonality,
  onUpdateIdentity,
  theme = 'cyber'
}) => {
  const [activeTab, setActiveTab] = useState<MemoryTab>('CORE');
  const [newMemory, setNewMemory] = useState('');
  const [category, setCategory] = useState<MemoryEntry['category']>('User');
  const [memoryType, setMemoryType] = useState<MemoryEntry['type']>('long_term');

  const [savePersonalitySaved, setSavePersonalitySaved] = useState(false);
  const [saveIdentitySaved, setSaveIdentitySaved] = useState(false);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const handleSaveMemory = () => {
    if (newMemory.trim()) {
      onAddMemory(newMemory.trim(), category, memoryType);
      setNewMemory('');
    }
  };

  const handleSavePersonalityExplicit = () => {
    localStorage.setItem('jarvis_personality', personality);
    onUpdatePersonality(personality);
    setSavePersonalitySaved(true);
    setTimeout(() => setSavePersonalitySaved(false), 2500);
  };

  const handleSaveIdentityExplicit = () => {
    localStorage.setItem('jarvis_identity', userIdentity);
    onUpdateIdentity(userIdentity);
    setSaveIdentitySaved(true);
    setTimeout(() => setSaveIdentitySaved(false), 2500);
  };

  const longTermMemories = memories.filter(m => m.type === 'long_term');
  const shortTermMemories = memories.filter(m => m.type === 'short_term');

  return (
    <div className={`h-full w-full flex flex-col p-6 rounded-2xl shadow-2xl overflow-hidden relative transition-all ${
      isSlate
        ? 'bg-zinc-900/95 border border-slate-700/80 text-slate-200'
        : isMinimal
          ? 'bg-[#0f172a]/95 border border-emerald-500/20 text-slate-100 backdrop-blur-xl'
          : isGold
            ? 'bg-[#181310]/95 border border-amber-500/20 text-amber-100 backdrop-blur-xl'
            : 'glass border border-cyan-500/20 bg-slate-950/80 backdrop-blur-3xl'
    }`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
        isSlate ? 'from-transparent via-zinc-400/40 to-transparent' : isMinimal ? 'from-transparent via-emerald-500/40 to-transparent' : isGold ? 'from-transparent via-amber-500/40 to-transparent' : 'from-transparent via-cyan-500/40 to-transparent'
      }`} />

      {/* Tabs Header */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-black/40 border border-white/5 rounded-lg shrink-0">
        {(['CORE', 'PERSONALITY', 'IDENTITY'] as MemoryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-[9px] font-orbitron font-bold tracking-widest uppercase ${
              activeTab === tab 
                ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.1)] border border-cyan-400/30' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'CORE' && <Database className="w-3 h-3" />}
            {tab === 'PERSONALITY' && <Settings2 className="w-3 h-3" />}
            {tab === 'IDENTITY' && <UserCircle className="w-3 h-3" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'CORE' && (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            {/* Manual Input Section */}
            <div className="mb-6 space-y-3 p-4 bg-cyan-500/5 rounded border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-3 h-3 text-cyan-400" />
                <span className="text-[9px] font-orbitron text-cyan-400 tracking-widest uppercase">Insert_Memory</span>
              </div>
              <textarea
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Enter core data or fact, Sir..."
                className="w-full h-16 bg-black/40 border border-white/10 rounded p-2 text-[11px] font-sans text-slate-200 focus:border-cyan-500/40 focus:outline-none transition-all resize-none custom-scroll"
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="bg-black/40 border border-white/10 text-[9px] font-orbitron text-cyan-400 px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500/40"
                >
                  <option value="User">USER_INTEL</option>
                  <option value="Project">PROJECT_DATA</option>
                  <option value="Goal">STRATEGIC_GOAL</option>
                  <option value="System">SYSTEM_METRIC</option>
                </select>
                <select 
                  value={memoryType}
                  onChange={(e) => setMemoryType(e.target.value as any)}
                  className="bg-black/40 border border-white/10 text-[9px] font-orbitron text-cyan-400 px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500/40"
                >
                  <option value="long_term">LONG_TERM</option>
                  <option value="short_term">SHORT_TERM</option>
                </select>
              </div>
              <button 
                onClick={handleSaveMemory}
                disabled={!newMemory.trim()}
                className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-400 font-orbitron text-[9px] py-1.5 rounded transition-all uppercase tracking-widest disabled:opacity-30"
              >
                Commit_to_Core
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scroll pr-2">
              {/* Long Term Section */}
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-cyan-500/20 pb-1">
                  <Brain className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] font-orbitron text-cyan-400 tracking-widest uppercase">Long_Term_Memory</span>
                  <span className="ml-auto text-[8px] font-mono text-slate-500">{longTermMemories.length} UNITS</span>
                </div>
                <div className="space-y-3">
                  {longTermMemories.length === 0 ? (
                    <div className="text-center py-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">No strategic data stored.</div>
                  ) : (
                    longTermMemories.map((m) => (
                      <MemoryItem key={m.id} memory={m} onDelete={onDeleteMemory} />
                    ))
                  )}
                </div>
              </div>

              {/* Short Term Section */}
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-purple-500/20 pb-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-orbitron text-purple-400 tracking-widest uppercase">Short_Term_Memory</span>
                  <span className="ml-auto text-[8px] font-mono text-slate-500">{shortTermMemories.length} UNITS</span>
                </div>
                <div className="space-y-3">
                  {shortTermMemories.length === 0 ? (
                    <div className="text-center py-4 text-[9px] font-mono text-slate-600 uppercase tracking-widest">No tactical data stored.</div>
                  ) : (
                    shortTermMemories.map((m) => (
                      <MemoryItem key={m.id} memory={m} onDelete={onDeleteMemory} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PERSONALITY' && (
          <div className="h-full flex flex-col gap-3 animate-in fade-in duration-300 overflow-y-auto custom-scroll pr-1">
            <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-orbitron text-purple-400 tracking-widest uppercase">Behavioral_Matrix</span>
                </div>
                <button
                  onClick={handleSavePersonalityExplicit}
                  className={`px-2.5 py-1 rounded text-[9px] font-orbitron font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                    savePersonalitySaved 
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  }`}
                >
                  {savePersonalitySaved ? (
                    <>
                      <Check className="w-3 h-3 text-black stroke-[3]" />
                      SAVED_LOCALLY ✓
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      SAVE_PERSONALITY
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Select JARVIS personality matrix or customize below. Changes synchronize instantly.
              </p>
            </div>

            {/* Personality Presets Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
              {/* Preset 1: Pure Jarvis */}
              {(() => {
                const isPureActive = !personality.includes("ATTITUDE") && !personality.includes("EXPANDED EDITION");
                return (
                  <button
                    onClick={() => {
                      onUpdatePersonality(PURE_JARVIS_PROMPT);
                      localStorage.setItem('jarvis_personality', PURE_JARVIS_PROMPT);
                    }}
                    className={`p-3 rounded-lg border transition-all text-left flex flex-col justify-between relative overflow-hidden group ${
                      isPureActive 
                        ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'bg-black/40 border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Shield className={`w-3.5 h-3.5 ${isPureActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-orbitron font-bold uppercase tracking-wider ${isPureActive ? 'text-cyan-300' : 'text-slate-200'}`}>
                          Pure Jarvis
                        </span>
                      </div>
                      {isPureActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[9px] font-sans text-slate-400 leading-snug mb-2">
                      Formal, polite, elegant, ultra-loyal & highly intelligent assistant.
                    </p>
                    <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded uppercase self-start ${
                      isPureActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-white/5 text-slate-500'
                    }`}>
                      LOYAL_ASSISTANT
                    </span>
                  </button>
                );
              })()}

              {/* Preset 2: Jarvis Attitude / Funny */}
              {(() => {
                const isAttitudeActive = personality.includes("ATTITUDE") || personality.includes("EXPANDED EDITION");
                return (
                  <button
                    onClick={() => {
                      onUpdatePersonality(TONY_ATTITUDE_PROMPT);
                      localStorage.setItem('jarvis_personality', TONY_ATTITUDE_PROMPT);
                    }}
                    className={`p-3 rounded-lg border transition-all text-left flex flex-col justify-between relative overflow-hidden group ${
                      isAttitudeActive 
                        ? 'bg-purple-500/15 border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                        : 'bg-black/40 border-white/10 hover:border-purple-500/40 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Flame className={`w-3.5 h-3.5 ${isAttitudeActive ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-orbitron font-bold uppercase tracking-wider ${isAttitudeActive ? 'text-purple-300' : 'text-slate-200'}`}>
                          Jarvis Attitude / Funny
                        </span>
                      </div>
                      {isAttitudeActive && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[9px] font-sans text-slate-400 leading-snug mb-2">
                      Extroverted, witty, sarcastic, hilarious best friend with 100% comedy & energy!
                    </p>
                    <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded uppercase self-start ${
                      isAttitudeActive ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'bg-white/5 text-slate-500'
                    }`}>
                      JARVIS_ATTITUDE_V3
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* Prompt Customization Area */}
            <div className="flex-1 min-h-[140px] flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-orbitron text-slate-400 uppercase tracking-widest">Active_Prompt_Buffer</span>
                <button
                  onClick={handleSavePersonalityExplicit}
                  className="text-[9px] font-orbitron text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Save className="w-2.5 h-2.5" />
                  Save Changes
                </button>
              </div>
              <textarea
                value={personality}
                onChange={(e) => onUpdatePersonality(e.target.value)}
                placeholder="Describe how JARVIS should behave, Sir..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-[11px] font-sans text-slate-200 focus:border-purple-500/40 focus:outline-none transition-all resize-none custom-scroll leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
              <span>Status: Synchronized</span>
              <span className="text-purple-400">
                {personality.includes("ATTITUDE") ? 'JARVIS_ATTITUDE_MODE_ACTIVE' : 'PURE_JARVIS_ACTIVE'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'IDENTITY' && (
          <div className="h-full flex flex-col gap-3 animate-in fade-in duration-300 overflow-y-auto custom-scroll pr-1">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded space-y-1.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-orbitron text-emerald-400 tracking-widest uppercase">Operator_Profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onUpdateIdentity(DEFAULT_VIRAT_PROFILE);
                      localStorage.setItem('jarvis_identity', DEFAULT_VIRAT_PROFILE);
                    }}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded text-[9px] font-orbitron text-emerald-300 transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    RESET_VIRAT_PROFILE
                  </button>
                  <button
                    onClick={handleSaveIdentityExplicit}
                    className={`px-2.5 py-1 rounded text-[9px] font-orbitron font-bold tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      saveIdentitySaved 
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {saveIdentitySaved ? (
                      <>
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                        SAVED_LOCALLY ✓
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        SAVE_IDENTITY
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                Core user identity for Virat Sir. Personalizes speech, behavior, goals, and technical responses.
              </p>
            </div>
            <textarea
              value={userIdentity}
              onChange={(e) => onUpdateIdentity(e.target.value)}
              placeholder="Who are you, Sir? Provide your details here..."
              className="flex-1 min-h-[220px] bg-black/40 border border-white/10 rounded-lg p-3 text-[11px] font-sans text-slate-200 focus:border-emerald-500/40 focus:outline-none transition-all resize-none custom-scroll leading-relaxed"
            />
            <div className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
              <span>Link: Biometric_Secure</span>
              <span className="text-emerald-400">
                {userIdentity.includes("Virat Prajapati") ? "VIRAT_PRAJAPATI_VERIFIED" : "CUSTOM_OPERATOR_ACTIVE"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-cyan-500/10 shrink-0">
        <div className="flex justify-between items-center text-[9px] font-mono text-cyan-500/50 mb-2">
          <span>DATA_STABILITY</span>
          <span className="text-cyan-400 flex items-center gap-1">
            <Shield className="w-2 h-2" />
            OPTIMAL
          </span>
        </div>
        <div className="w-full h-[2px] bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 w-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
        </div>
      </div>
    </div>
  );
};

export default MemoryPanel;
