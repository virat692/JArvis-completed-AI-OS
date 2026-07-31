
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { User, Cpu, AlertTriangle, CheckCircle2, Info, XCircle, Terminal as TerminalIcon } from 'lucide-react';

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
    <div className={`flex-1 font-mono text-[12px] overflow-hidden flex flex-col transition-all duration-300 ${
      isSlate
        ? 'bg-zinc-950/90 text-slate-200 border-t border-x border-slate-800 rounded-t-2xl shadow-xl'
        : isMinimal
          ? 'bg-[#090d16]/90 text-slate-100 border-t border-x border-emerald-500/20 rounded-t-3xl shadow-xl backdrop-blur-xl'
          : isGold
            ? 'bg-[#120e0a]/90 text-amber-100 border-t border-x border-amber-500/20 rounded-t-3xl shadow-xl backdrop-blur-xl'
            : 'bg-black/95 border-glow backdrop-blur-2xl'
    }`}>
      {/* Terminal Header */}
      <div className={`flex items-center justify-between px-4 py-2 sticky top-0 z-10 transition-all ${
        isSlate
          ? 'bg-zinc-900/95 border-b border-slate-800 text-slate-300'
          : isMinimal
            ? 'bg-emerald-950/30 border-b border-emerald-500/20 text-emerald-300'
            : isGold
              ? 'bg-amber-950/30 border-b border-amber-500/20 text-amber-300'
              : 'bg-slate-900/90 border-b border-cyan-500/30 text-cyan-400'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isSlate ? 'bg-zinc-300 shadow-sm' : isMinimal ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : isGold ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f2ff]'
          }`} />
          <span className={`font-orbitron font-bold tracking-[0.25em] text-[10px] uppercase flex items-center gap-2 ${
            isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-400'
          }`}>
            <TerminalIcon className="w-3.5 h-3.5" />
            Neural_Link_Logs
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-[9px] font-mono">
            Entries: {logs.length}
          </span>
          <span className="text-emerald-400 text-[8px] tracking-tight font-orbitron uppercase hidden sm:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Stream: Active
          </span>
        </div>
      </div>
      
      {/* Terminal Content / Conversation Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scroll scroll-smooth">
        {logs.map((log) => {
          const formattedTime = new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });

          if (log.source === 'OPERATOR') {
            return (
              <div key={log.id} className="flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-300 max-w-[96%] sm:max-w-[90%] my-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-orbitron uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <User className="w-2.5 h-2.5 text-blue-400" />
                    OPERATOR [SIR]
                  </span>
                  <span className="text-slate-500 text-[9px] font-mono opacity-60">
                    [{formattedTime}]
                  </span>
                </div>
                
                <div className={`p-3 rounded-r-xl rounded-b-xl border-l-4 border-blue-500/80 leading-relaxed font-sans sm:font-mono text-[13.5px] whitespace-pre-wrap break-words shadow-md transition-all ${
                  isSlate
                    ? 'bg-zinc-800/80 border-y border-r border-slate-700/60 text-slate-100'
                    : isMinimal
                      ? 'bg-emerald-950/20 border-y border-r border-emerald-500/20 text-slate-100'
                      : isGold
                        ? 'bg-amber-950/20 border-y border-r border-amber-500/20 text-amber-100'
                        : 'bg-blue-950/25 border-y border-r border-blue-500/20 text-slate-100'
                }`}>
                  {log.message}
                </div>
              </div>
            );
          }

          if (log.source === 'JARVIS') {
            return (
              <div key={log.id} className="flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-300 max-w-[98%] sm:max-w-[94%] my-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-orbitron uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_8px_rgba(0,242,255,0.2)]">
                    <Cpu className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                    JARVIS [AI CORE]
                  </span>
                  <span className="text-slate-500 text-[9px] font-mono opacity-60">
                    [{formattedTime}]
                  </span>
                </div>
                
                <div className={`p-3.5 rounded-r-xl rounded-b-xl border-l-4 border-cyan-400/90 leading-relaxed font-sans sm:font-mono text-[13.5px] whitespace-pre-wrap break-words shadow-lg transition-all ${
                  isSlate
                    ? 'bg-zinc-900/95 border-y border-r border-slate-700 text-zinc-100'
                    : isMinimal
                      ? 'bg-[#0c1421]/90 border-y border-r border-emerald-500/30 text-slate-100'
                      : isGold
                        ? 'bg-[#1a140f]/90 border-y border-r border-amber-500/30 text-amber-50'
                        : 'bg-cyan-950/30 border-y border-r border-cyan-500/30 text-cyan-50 shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                }`}>
                  {log.message}
                </div>
              </div>
            );
          }

          // SYSTEM / TELEMETRY LOGS
          const statusIcon = log.type === 'error' ? <XCircle className="w-3 h-3 text-red-400 shrink-0" /> :
                             log.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" /> :
                             log.type === 'success' ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> :
                             <Info className="w-3 h-3 text-slate-400 shrink-0" />;

          return (
            <div key={log.id} className="flex items-center gap-2 px-2 py-1 my-0.5 rounded bg-slate-900/40 border border-white/5 text-[11px] font-mono text-slate-400 animate-in fade-in duration-200">
              <span className="text-slate-600 text-[9px] shrink-0 font-mono opacity-60">
                [{formattedTime}]
              </span>
              {statusIcon}
              <span className={`truncate ${
                log.type === 'error' ? 'text-red-400 font-semibold' :
                log.type === 'warning' ? 'text-amber-300' :
                log.type === 'success' ? 'text-emerald-300' : 'text-slate-400'
              }`}>
                {log.message}
              </span>
            </div>
          );
        })}

        {/* Active Stream Indicator */}
        <div className="flex items-center gap-2 pt-1 opacity-70">
          <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-500">Neural Buffer Synchronized</span>
        </div>
      </div>
    </div>
  );
};

export default Terminal;

