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
  History
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
      <header className="w-full bg-[#020b18]/95 border-b border-cyan-500/25 px-4 sm:px-6 py-3 backdrop-blur-2xl flex flex-col gap-3 shrink-0 z-30 relative shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {/* Top Cyan Glowing Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none shadow-[0_0_10px_#00f2ff]" />

        {/* Main Top Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Left: Return Action + Title Hierarchy */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Back to JARVIS Action Button */}
            <button
              onClick={() => { playWhooshSound(); onClose(); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/50 hover:bg-cyan-500/25 hover:border-cyan-300 text-cyan-200 text-[10px] font-orbitron font-extrabold transition-all duration-200 group shadow-[0_0_12px_rgba(0,242,255,0.2)] active:scale-95 shrink-0"
              title="Return to JARVIS Assistant HUD (ESC)"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform text-cyan-300" />
              <span className="hidden sm:inline">BACK TO JARVIS</span>
              <span className="text-[8px] font-mono text-cyan-400/70 bg-black/40 px-1 py-0.2 rounded border border-cyan-400/20">ESC</span>
            </button>

            <div className="h-5 w-px bg-cyan-500/20 hidden sm:block" />

            {/* Title Hierarchy */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-orbitron font-black tracking-widest text-cyan-400 uppercase">
                  JARVIS // NEURAL WORKSPACE
                </span>
                <span className="text-[8px] font-mono text-slate-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30 font-bold uppercase truncate max-w-[130px]">
                  {payload.category}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-orbitron font-extrabold text-white truncate tracking-wide">
                {payload.headerTitle}
              </h1>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* History / Archive Button */}
            <button
              onClick={() => { playWhooshSound(); setIsHistoryOpen(true); }}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20 text-cyan-200 text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(0,242,255,0.15)] active:scale-95"
              title="Open Workspace Archive & History"
            >
              <History className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">HISTORY</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 text-[10px] font-mono flex items-center gap-1 transition-all shadow-sm active:scale-95"
              title="Copy current presentation content to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onToggleFullscreen}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 transition-all shadow-sm active:scale-95"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation"}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
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

