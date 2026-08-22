import React from 'react';
import { 
  X, Keyboard, Mic, Eye, Monitor, HardDrive, Terminal, 
  Settings, Zap, Sparkles, Volume2, Globe, Command
} from 'lucide-react';
import { JarvisTheme } from '../types';
import { playClick, playWhooshSound } from '../services/soundEffects';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: JarvisTheme;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  theme = 'cyber'
}) => {
  if (!isOpen) return null;

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const shortcutGroups = [
    {
      title: "Tactical & Voice Hotkeys",
      icon: Mic,
      items: [
        { key: "Space", desc: "Toggle Neural Voice Link (Live Mode)", tag: "VOICE" },
        { key: "M", desc: "Mute / Unmute Microphone Sensors", tag: "SENSORS" },
        { key: "V", desc: "Toggle Optic Camera Perception", tag: "VISION" },
        { key: "S", desc: "Toggle Screen Stream Perception", tag: "SCREEN" },
      ]
    },
    {
      title: "Workspace & Navigation Hotkeys",
      icon: Command,
      items: [
        { key: "Ctrl + K / /", desc: "Open Chat History & Search Matrix", tag: "NAV" },
        { key: "Ctrl + W", desc: "Toggle Dynamic Presentation Workspace", tag: "FOCUS" },
        { key: "Alt + W", desc: "Toggle Full Atmospheric Weather Console", tag: "WEATHER" },
        { key: "Ctrl + M", desc: "Open Episodic Memory & Knowledge Graph", tag: "MEMORY" },
        { key: "Ctrl + `", desc: "Open Host OS Controller Terminal", tag: "SYSTEM" },
        { key: "Ctrl + ,", desc: "Open System Configuration Matrix", tag: "SETTINGS" },
        { key: "Shift + ?", desc: "Show this Keyboard Hotkeys Matrix", tag: "HELP" },
        { key: "Esc", desc: "Emergency Halt / Close Open Panels", tag: "GLOBAL" },
      ]
    },
    {
      title: "Hands-Free Wake-Word Triggers",
      icon: Sparkles,
      items: [
        { key: '"Hey Jarvis"', desc: "Instant hands-free neural activation", tag: "VOICE" },
        { key: '"Ok Jarvis"', desc: "Wake up listening & execute voice query", tag: "VOICE" },
        { key: '"Namaste Jarvis"', desc: "Awaken JARVIS with Hindi prompt context", tag: "HINDI" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ${
          isSlate 
            ? 'bg-zinc-900 border-zinc-700 text-zinc-100' 
            : isMinimal 
              ? 'bg-[#0b0f17] border-emerald-500/30 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
              : isGold
                ? 'bg-[#14100c] border-amber-500/30 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                : 'bg-[#030914]/95 border-cyan-400/40 text-cyan-100 shadow-[0_0_50px_rgba(0,242,255,0.3)]'
        }`}
      >
        {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
        <header className="px-6 py-3.5 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
              <Keyboard className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                  HOTKEYS & DIRECTIVES MATRIX
                </h1>
                <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  KEYBOARD ACCELERATOR ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>Hardware Controller</span>
                <span>•</span>
                <span>Global Listener Synced</span>
                <span>•</span>
                <span className="text-cyan-400">14 Directives Bound</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => { playWhooshSound(); onClose(); }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
              title="Close Hotkeys Matrix (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scroll">
          {shortcutGroups.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-3">
                <h3 className="text-xs font-orbitron font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <GroupIcon className="w-4 h-4 text-cyan-300" />
                  {group.title}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map((item, iIdx) => (
                    <div 
                      key={iIdx}
                      className="p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/40 flex items-center justify-between gap-3 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-slate-200">{item.desc}</span>
                        <span className="text-[9px] font-mono text-cyan-400/70 font-semibold">{item.tag}</span>
                      </div>
                      <kbd className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.2)] shrink-0 whitespace-nowrap">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GLOBAL HOTKEY LISTENER: ONLINE</span>
          </div>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-xs font-orbitron font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
