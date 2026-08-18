
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { User, Cpu, AlertTriangle, CheckCircle2, Info, XCircle, Terminal as TerminalIcon, Wrench, Eye, Database } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const Terminal: React.FC<TerminalProps> = ({ logs, theme = 'cyber' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  return (
    <div className="flex-1 font-mono text-[11px] sm:text-[12px] overflow-hidden flex flex-col h-full bg-transparent">
      {/* Sleek Unboxed Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className={`w-3.5 h-3.5 ${isSlate ? 'text-zinc-300' : isMinimal ? 'text-emerald-400' : isGold ? 'text-amber-400' : 'text-cyan-400'}`} />
          <span className={`font-orbitron font-extrabold tracking-[0.25em] text-[10px] uppercase ${
            isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-300'
          }`}>
            SYSTEM TIMELINE // LIVE CONSOLE
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-slate-400 font-mono">
            {logs.length} ENTRIES
          </span>
          <span className="text-cyan-400 tracking-tight font-orbitron uppercase hidden sm:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            STREAMING
          </span>
        </div>
      </div>
      
      {/* Chronological Stream Logs - No Speech Bubbles */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scroll scroll-smooth">
        {logs.map((log) => {
          const formattedTime = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });

          if (log.source === 'OPERATOR') {
            return (
              <div key={log.id} className="group flex flex-col gap-0.5 py-1 px-1.5 rounded transition-all duration-200 hover:bg-blue-500/10 border-b border-cyan-500/10">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono opacity-50 text-slate-400">
                    {formattedTime}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-extrabold font-orbitron uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <User className="w-2.5 h-2.5 text-blue-400" />
                    OPERATOR
                  </span>
                </div>
                <div className="pl-2 border-l-2 border-blue-400/60 text-slate-100 font-mono leading-relaxed text-[12px] whitespace-pre-wrap break-words py-0.5">
                  {log?.message}
                </div>
              </div>
            );
          }

          if (log.source === 'JARVIS') {
            return (
              <div key={log.id} className="group flex flex-col gap-0.5 py-1 px-1.5 rounded transition-all duration-200 hover:bg-cyan-500/10 border-b border-cyan-500/10">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono opacity-50 text-slate-400">
                    {formattedTime}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8px] font-extrabold font-orbitron uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(0,242,255,0.25)]">
                    <Cpu className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                    JARVIS
                  </span>
                </div>
                <div className="pl-2 border-l-2 border-cyan-400/80 text-cyan-100 font-mono leading-relaxed text-[12px] whitespace-pre-wrap break-words py-0.5">
                  {log.message}
                </div>
              </div>
            );
          }

          // TOOL / VISION / MEMORY / SYSTEM / AI / WARNING / ERROR / INFO
          const logMsg = log?.message || '';
          const isTool = logMsg.includes('Tool') || logMsg.includes('Action') || logMsg.includes('Executing');
          const isVision = logMsg.includes('Vision') || logMsg.includes('Optic') || logMsg.includes('Camera') || logMsg.includes('Screen');
          const isMemory = logMsg.includes('Memory') || logMsg.includes('Storage') || logMsg.includes('Cluster') || logMsg.includes('Anchor');
          const isAi = log.source === 'JARVIS' || logMsg.includes('Neural') || logMsg.includes('Reasoning');

          let icon = <Info className="w-3 h-3 text-emerald-400 shrink-0" />;
          let badgeText = log.source || 'INFO';
          let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';

          if (log.type === 'error') {
            icon = <XCircle className="w-3 h-3 text-red-400 shrink-0" />;
            badgeText = '🔴 ERROR';
            badgeClass = 'bg-red-500/20 text-red-300 border-red-400/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
          } else if (log.type === 'warning') {
            icon = <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />;
            badgeText = '🟡 WARNING';
            badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
          } else if (isTool) {
            icon = <Wrench className="w-3 h-3 text-violet-400 shrink-0" />;
            badgeText = '🛠️ TOOL';
            badgeClass = 'bg-violet-500/20 text-violet-300 border-violet-400/30';
          } else if (isVision) {
            icon = <Eye className="w-3 h-3 text-amber-300 shrink-0" />;
            badgeText = '👁️ VISION';
            badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/30';
          } else if (isMemory) {
            icon = <Database className="w-3 h-3 text-purple-400 shrink-0" />;
            badgeText = '🟣 MEMORY';
            badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-400/30';
          } else if (isAi) {
            icon = <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />;
            badgeText = '🔵 AI CORE';
            badgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_8px_rgba(0,242,255,0.25)]';
          } else {
            icon = <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
            badgeText = '🟢 SYSTEM';
            badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
          }

          return (
            <div key={log.id} className="flex items-start gap-2 px-1.5 py-1 rounded transition-all duration-200 hover:bg-slate-800/40 border-b border-white/5 font-mono text-[11px]">
              <span className="text-slate-500 text-[9px] shrink-0 font-mono opacity-50 pt-0.5">
                {formattedTime}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold font-orbitron uppercase border shrink-0 ${badgeClass}`}>
                {badgeText}
              </span>
              <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
                {icon}
                <span className={`truncate ${
                  log.type === 'error' ? 'text-red-400 font-semibold' :
                  log.type === 'warning' ? 'text-amber-300' :
                  log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'
                }`}>
                  {log?.message}
                </span>
              </div>
            </div>
          );
        })}

        {/* Stream Synchronized Bar */}
        <div className="flex items-center gap-2 pt-2 opacity-60">
          <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">Neural Stream Active • Waiting for events...</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;

