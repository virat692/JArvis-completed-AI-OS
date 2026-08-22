import React, { useState } from 'react';
import { PresentationPayload, PresentationMode } from '../../types/workspace';
import { 
  Sparkles, 
  AlignLeft, 
  Network, 
  Code2, 
  Table, 
  ArrowLeft, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2,
  FileText,
  Activity,
  Layers,
  History,
  X
} from 'lucide-react';
import { playTickSound, playWhooshSound } from '../../services/soundEffects';
import { WorkspaceHistoryDrawer } from './WorkspaceHistoryDrawer';

interface WorkspaceHeaderProps {
  payload: PresentationPayload;
  currentMode: PresentationMode;
  onSelectMode: (mode: PresentationMode) => void;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const MODES: Array<{ mode: PresentationMode; label: string; icon: React.ElementType }> = [
  { mode: 'OVERVIEW', label: 'OVERVIEW', icon: Sparkles },
  { mode: 'PARAGRAPH', label: 'PARAGRAPH', icon: AlignLeft },
  { mode: 'STRUCTURE', label: 'STRUCTURE', icon: Network },
  { mode: 'CODE', label: 'CODE', icon: Code2 },
  { mode: 'DATA', label: 'DATA', icon: Table }
];

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  payload,
  currentMode,
  onSelectMode,
  onClose,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [copied, setCopied] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCopy = () => {
    let contentToCopy = '';
    if (currentMode === 'CODE' && payload.code.files.length > 0) {
      contentToCopy = payload.code.files.map(f => `// ${f.filename}\n${f.code}`).join('\n\n');
    } else if (currentMode === 'DATA') {
      if (payload.data.jsonData) {
        contentToCopy = JSON.stringify(payload.data.jsonData, null, 2);
      } else if (payload.data.rawFormatted) {
        contentToCopy = payload.data.rawFormatted;
      } else if (payload.data.rows) {
        contentToCopy = JSON.stringify(payload.data.rows, null, 2);
      } else {
        contentToCopy = payload.rawContent;
      }
    } else if (currentMode === 'STRUCTURE') {
      contentToCopy = payload.structure.rawText || payload.rawContent;
    } else {
      contentToCopy = payload.paragraph.content || payload.rawContent || payload.overview.summary;
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header className="w-full bg-[#031024]/90 border-b border-cyan-500/30 px-6 py-3 backdrop-blur-2xl flex flex-col gap-3 shrink-0 z-30 relative shadow-[0_4px_30px_rgba(0,242,255,0.08)]">
        {/* Top Bar Header Content */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)] shrink-0">
              <Layers className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400 truncate">
                  NEURAL WORKSPACE CANVAS
                </h1>
                <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  DYNAMIC ENGINE ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5 truncate">
                <span className="text-white font-bold truncate max-w-[200px]">{payload.headerTitle}</span>
                <span>•</span>
                <span>Category: {payload.category}</span>
                <span>•</span>
                <span className="text-cyan-400">Synced Workspace</span>
              </p>
            </div>
          </div>

          {/* Right Header Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 font-black text-emerald-950" /> : <Copy className="w-4 h-4 font-black" />}
              <span>{copied ? 'COPIED' : 'COPY CONTENT'}</span>
            </button>

            <button
              type="button"
              onClick={() => { playWhooshSound(); setIsHistoryOpen(true); }}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer hidden sm:flex"
              title="Open Workspace Archive & History"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen HUD" : "Fullscreen Workspace HUD"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => { playWhooshSound(); onClose(); }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
              title="Return to Main HUD (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presentation Mode Selector Bar */}
        <div className="flex items-center justify-start gap-1.5 pt-1 border-t border-cyan-500/15 overflow-x-auto scrollbar-none">
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider hidden sm:inline mr-1">
            MODE:
          </span>

          {MODES.map(({ mode, label, icon: Icon }) => {
            const isActive = currentMode === mode;
            const isPrimary = payload.primaryMode === mode;

            return (
              <button
                key={mode}
                onClick={() => onSelectMode(mode)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-extrabold uppercase transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,255,0.3)] scale-[1.01]'
                    : 'bg-black/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-white/5'
                }`}
              >
                <Icon className={`w-3 h-3 shrink-0 ${isActive ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
                <span className="tracking-wider">{label}</span>
                {isPrimary && (
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping ml-0.5" title="JARVIS Recommended Mode" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* History Drawer Modal */}
      <WorkspaceHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activePayloadId={payload.id}
      />
    </>
  );
};

