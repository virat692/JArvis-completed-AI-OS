import React, { useState } from 'react';
import { 
  X, RefreshCw, Search, Minimize2, Maximize2, Sparkles, Shield, Cpu, Activity
} from 'lucide-react';

interface FullScreenWorkspaceOverlayProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badgeText?: string;
  badgeColor?: 'cyan' | 'emerald' | 'amber' | 'purple' | 'blue';
  onClose: () => void;
  onRefresh?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  children: React.ReactNode;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

export const FullScreenWorkspaceOverlay: React.FC<FullScreenWorkspaceOverlayProps> = ({
  isOpen,
  title,
  subtitle,
  icon: Icon,
  badgeText = '● 100% OPERATIONAL',
  badgeColor = 'cyan',
  onClose,
  onRefresh,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search workspace module...',
  children,
  theme = 'cyber'
}) => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const badgeColorClasses = {
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  };

  return (
    <div className="fixed inset-0 z-50 p-0 bg-black/95 backdrop-blur-3xl flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div 
        className={`w-full h-full max-w-none max-h-none rounded-none flex flex-col overflow-hidden transition-all duration-300 relative ${
          isSlate
            ? 'bg-zinc-950 text-slate-100'
            : isMinimal
              ? 'bg-[#0b1120] text-slate-100'
              : isGold
                ? 'bg-[#15100a] text-amber-100'
                : 'bg-[#020712] text-slate-100'
        }`}
      >
      {/* Top Cyan Glowing Scanner Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-30 shadow-[0_0_12px_#00f2ff]" />

      {/* Standardized Panel Header Bar */}
      <div className={`px-6 py-3.5 border-b flex items-center justify-between gap-4 shrink-0 z-20 backdrop-blur-md ${
        isSlate 
          ? 'bg-zinc-900/90 border-slate-800/80' 
          : isMinimal 
            ? 'bg-emerald-950/30 border-emerald-500/20' 
            : isGold 
              ? 'bg-amber-950/30 border-amber-500/20' 
              : 'bg-[#030914]/90 border-cyan-500/20'
      }`}>
        {/* Module Title & Icon */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${
            isSlate 
              ? 'bg-zinc-800 border-slate-700 text-zinc-200' 
              : isMinimal 
                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' 
                : isGold 
                  ? 'bg-amber-950 border-amber-500/40 text-amber-400' 
                  : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
          }`}>
            <Icon className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className={`text-xs sm:text-sm font-orbitron font-extrabold tracking-[0.2em] uppercase ${
                isSlate ? 'text-zinc-100' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]'
              }`}>
                {title}
              </h2>
              <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider hidden md:inline-flex items-center gap-1 ${badgeColorClasses[badgeColor]}`}>
                <Activity className="w-2.5 h-2.5 animate-pulse" />
                {badgeText}
              </span>
            </div>
            {subtitle && (
              <span className="text-[9.5px] font-mono text-slate-400 tracking-wide">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Center Search Input (If enabled) */}
        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-md hidden sm:flex items-center relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full pl-9 pr-3 py-1.5 rounded-full text-xs font-mono transition-all outline-none border ${
                isSlate
                  ? 'bg-zinc-800/80 border-slate-700 text-slate-200 focus:border-zinc-400'
                  : 'bg-slate-900/80 border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,255,0.25)]'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Right Header Controls: Refresh, Collapse, Close */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={handleTriggerRefresh}
              className={`p-2 rounded-xl border transition-all duration-200 text-slate-300 hover:text-cyan-300 ${
                isSlate
                  ? 'bg-zinc-800/80 border-slate-700 hover:bg-zinc-700'
                  : 'bg-black/40 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10'
              }`}
              title="Refresh Module Workspace"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className={`p-2 rounded-xl border transition-all duration-200 text-slate-300 hover:text-cyan-300 hidden md:flex ${
              isSlate
                ? 'bg-zinc-800/80 border-slate-700 hover:bg-zinc-700'
                : 'bg-black/40 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10'
            }`}
            title={isMaximized ? "Collapse View" : "Maximize Workspace"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:text-white transition-all duration-200 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
            title="Close Full Screen Workspace"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Full-Screen Workspace Body */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4 relative z-10 flex flex-col">
        {children}
      </div>
    </div>
  </div>
);
};
