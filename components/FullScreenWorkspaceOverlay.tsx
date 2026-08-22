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

      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)] z-20">
        {/* Module Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)] shrink-0">
            <Icon className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400 uppercase">
                {title}
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {badgeText}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{subtitle || 'Hardware Controller'}</span>
              <span>•</span>
              <span>Host Bridge Synced</span>
              <span>•</span>
              <span className="text-cyan-400">Matrix Online</span>
            </p>
          </div>
        </div>

        {/* Center Search Input (If enabled) */}
        {onSearchChange !== undefined && (
          <div className="flex-1 max-w-md hidden md:flex items-center relative mx-4">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 rounded-full text-xs font-mono transition-all outline-none border bg-[#020816] border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,255,0.25)]"
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
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={handleTriggerRefresh}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
              title="Refresh Module Workspace"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer hidden md:flex"
            title={isMaximized ? "Collapse View" : "Maximize Workspace HUD"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Close Workspace (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Workspace Body */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4 relative z-10 flex flex-col">
        {children}
      </div>
    </div>
  </div>
);
};
