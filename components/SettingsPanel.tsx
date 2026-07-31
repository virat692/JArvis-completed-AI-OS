
import React from 'react';
import { X, Shield, Cpu, Zap, Radio, Volume2, MessageSquare, Gauge, Trash2, MonitorCheck, Palette } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  osControl: boolean;
  setOsControl: (val: boolean) => void;
  vocalConciseness: boolean;
  setVocalConciseness: (val: boolean) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  setTheme?: (val: 'cyber' | 'slate' | 'minimal' | 'gold') => void;
  onClearLogs?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  osControl, 
  setOsControl,
  vocalConciseness,
  setVocalConciseness,
  timezone,
  setTimezone,
  theme = 'cyber',
  setTheme,
  onClearLogs
}) => {
  if (!isOpen) return null;

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${
        isSlate 
          ? 'bg-zinc-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 text-slate-200' 
          : isMinimal
            ? 'bg-[#0f172a]/95 border border-emerald-500/30 rounded-3xl shadow-2xl text-slate-100'
            : isGold
              ? 'bg-[#181310] border border-amber-500/30 rounded-3xl shadow-2xl text-amber-100'
              : 'glass border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)]'
      }`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isSlate ? 'border-slate-800 bg-zinc-800/80' : isMinimal ? 'border-emerald-500/20 bg-emerald-500/5' : isGold ? 'border-amber-500/20 bg-amber-500/5' : 'border-cyan-500/20 bg-cyan-500/5'
        }`}>
          <div className="flex items-center gap-3">
            <Cpu className={`w-5 h-5 ${isSlate ? 'text-zinc-300' : isMinimal ? 'text-emerald-400' : isGold ? 'text-amber-400' : 'text-cyan-400'}`} />
            <h2 className={`text-sm font-orbitron font-bold tracking-[0.2em] uppercase ${
              isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-400'
            }`}>System_Config_Matrix</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
          {/* GUI Theme Architecture Selector */}
          <div className="space-y-3">
            <h3 className={`text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-2 ${
              isSlate ? 'text-zinc-400 font-bold' : isMinimal ? 'text-emerald-400 font-bold' : isGold ? 'text-amber-400 font-bold' : 'text-cyan-500/60'
            }`}>
              <Palette className="w-3.5 h-3.5" /> GUI_Theme_Architecture
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme && setTheme('cyber')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  theme === 'cyber'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.25)] ring-1 ring-cyan-400/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-cyan-300">Cyber Neon HUD</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 leading-normal">Sci-fi cyan glow, sharp HUD overlays & holographic grid scanlines.</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme && setTheme('slate')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  theme === 'slate'
                    ? 'bg-zinc-800 border-zinc-300 text-zinc-100 shadow-lg ring-1 ring-zinc-300/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-zinc-100">Smooth Slate Grey</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 shadow-sm" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 leading-normal">Charcoal matte palette, smooth rounded edges & clean solid feel.</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme && setTheme('minimal')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  theme === 'minimal'
                    ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-emerald-300">Minimal Glass</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 leading-normal">Sleek obsidian glass, soft emerald accents, zero clutter & clean pill controls.</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme && setTheme('gold')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                  theme === 'gold'
                    ? 'bg-amber-950/40 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-amber-300">Titanium Gold</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 leading-normal">Rich champagne gold highlights, warm dark obsidian background & luxury atmosphere.</span>
              </button>
            </div>
          </div>

          {/* Core OS Controls */}
          <div className="pt-6 border-t border-white/5 space-y-6">
            <h3 className={`text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-2 ${
              isSlate ? 'text-zinc-400 font-bold' : 'text-cyan-500/60'
            }`}>
              <Shield className="w-3 h-3" /> Core_Neural_Protocols
            </h3>
            
            <SettingToggle 
              label="OS_AUTONOMOUS_CONTROL" 
              description="Allow JARVIS to independently toggle sensors & modes."
              active={osControl}
              onClick={() => setOsControl(!osControl)}
              isSlate={isSlate}
            />

            <SettingToggle 
              label="VOCAL_TACTICAL_PROTOCOL" 
              description="Switch between concise tactical and detailed verbose replies."
              active={vocalConciseness}
              onClick={() => setVocalConciseness(!vocalConciseness)}
              isSlate={isSlate}
            />

            <div className="flex flex-col gap-2 group">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-orbitron tracking-wider transition-colors ${
                    isSlate ? 'text-zinc-200 group-hover:text-zinc-100' : 'text-slate-200 group-hover:text-cyan-400'
                  }`}>NEURAL_TIMEZONE_SYNC</span>
                  <span className="text-[10px] font-mono text-slate-500 leading-tight">Calibrate JARVIS to your local temporal coordinates.</span>
                </div>
              </div>
              <select 
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2 text-[10px] font-mono focus:outline-none transition-all ${
                  isSlate
                    ? 'bg-zinc-800 border-slate-700 text-zinc-200 focus:border-zinc-400'
                    : 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 focus:border-cyan-400'
                }`}
              >
                {Intl.supportedValuesOf('timeZone').map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interface & Feedback */}
          <div className="pt-6 border-t border-white/5 space-y-6">
            <h3 className={`text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-2 ${
              isSlate ? 'text-zinc-400 font-bold' : 'text-cyan-500/60'
            }`}>
              <MonitorCheck className="w-3 h-3" /> Interface_Dynamics
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-orbitron text-slate-200 tracking-wider">NEURAL_BRIDGE_STABILITY</span>
                <span className="text-[10px] font-mono text-slate-500">Enhanced stability for low-latency neural links.</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 border rounded text-[9px] font-mono ${
                isSlate
                  ? 'bg-zinc-800 border-slate-700 text-zinc-200'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                <Gauge className="w-3 h-3" /> OPTIMAL
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[9px] font-orbitron text-slate-400 uppercase tracking-widest">
                <span>Vocal_Response_Velocity</span>
                <span className={isSlate ? 'text-zinc-200 font-bold' : 'text-cyan-400'}>1.2x</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full relative">
                <div className={`absolute top-0 left-0 h-full w-[70%] rounded-full ${
                  isSlate ? 'bg-zinc-400' : 'bg-cyan-500/40 shadow-[0_0_10px_cyan]'
                }`} />
                <div className={`absolute top-1/2 left-[70%] -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isSlate ? 'bg-zinc-200' : 'bg-cyan-400 shadow-[0_0_15px_cyan]'
                }`} />
              </div>
            </div>
          </div>

          {/* Maintenance & Maintenance */}
          <div className="pt-6 border-t border-white/5 space-y-4">
             <h3 className={`text-[10px] font-orbitron uppercase tracking-widest flex items-center gap-2 ${
              isSlate ? 'text-zinc-400 font-bold' : 'text-cyan-500/60'
            }`}>
              <Zap className="w-3 h-3" /> Maintenance_Subsystems
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
               <button 
                onClick={() => { if(onClearLogs) onClearLogs(); }}
                className="flex items-center justify-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all group"
               >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[9px] font-orbitron text-red-500 uppercase tracking-widest group-hover:text-red-400">Clear_Neural_Cache</span>
               </button>
               
               <button className="flex items-center justify-center gap-2 p-3 bg-slate-800/40 border border-slate-700/40 rounded-xl transition-all opacity-50 cursor-not-allowed">
                  <Radio className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[9px] font-orbitron text-slate-400 uppercase tracking-widest">Rebuild_Matrix</span>
               </button>
            </div>
          </div>

          {/* System Vitals Display */}
          <div className="pt-6 border-t border-white/5">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono">
                  <span className="text-slate-500">VOICE_UNIT:</span> <span className={isSlate ? 'text-zinc-200 uppercase tracking-tighter font-bold' : 'text-cyan-400 uppercase tracking-tighter font-bold'}>CHARON_X1</span>
               </div>
               <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[9px] font-mono">
                  <span className="text-slate-500">LLM_CORE:</span> <span className={isSlate ? 'text-zinc-200 uppercase tracking-tighter font-bold' : 'text-cyan-400 uppercase tracking-tighter font-bold'}>FLASH_3_LITE</span>
               </div>
            </div>
          </div>
        </div>

        <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${
          isSlate ? 'bg-zinc-800/80 border-t border-slate-800' : 'bg-slate-900/50'
        }`}>
          <div className="flex items-center gap-2 text-[8px] font-mono text-slate-500 uppercase">
             <Zap className={`w-3 h-3 ${isSlate ? 'text-zinc-500' : 'text-cyan-500/40'}`} />
             Uplink_Encrypted_AES256
          </div>
          <button 
            onClick={onClose}
            className={`px-6 py-2 font-orbitron text-[10px] rounded-xl transition-all uppercase tracking-widest font-bold ${
              isSlate 
                ? 'bg-zinc-200 text-zinc-900 hover:bg-white shadow-md'
                : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]'
            }`}
          >
            Apply_Neural_Patches
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, active, onClick, isSlate }: any) => (
  <div className="flex items-center justify-between group">
    <div className="flex flex-col gap-1">
      <span className={`text-xs font-orbitron tracking-wider transition-colors ${
        isSlate ? 'text-zinc-200 group-hover:text-zinc-100' : 'text-slate-200 group-hover:text-cyan-400'
      }`}>{label}</span>
      <span className="text-[10px] font-mono text-slate-500 leading-tight pr-4">{description}</span>
    </div>
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 border shrink-0 ${
        active 
          ? isSlate ? 'bg-zinc-200 border-zinc-100' : 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        active 
          ? isSlate ? 'left-7 bg-zinc-900 shadow-sm' : 'left-7 bg-cyan-400 shadow-[0_0_15px_#00f2ff]' 
          : 'left-1 bg-slate-500'
      }`} />
    </button>
  </div>
);

export default SettingsPanel;
