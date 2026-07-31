
import React from 'react';
import { BookOpen, Zap, Shield, FileText } from 'lucide-react';

interface IntelligenceBriefingProps {
  content: string;
}

const IntelligenceBriefing: React.FC<IntelligenceBriefingProps> = ({ content }) => {
  if (!content) return null;

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-top-4 duration-700 glass">
      <div className="flex items-center justify-between px-6 py-4 bg-cyan-500/10 border-b border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="text-[11px] font-orbitron font-bold tracking-[0.4em] text-cyan-400 uppercase">Strategic_Intelligence_Report</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Classified_Access_Granted</span>
           </div>
           <FileText className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-12 custom-scroll bg-black/60 backdrop-blur-md selection:bg-cyan-500/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-10 border-l-4 border-cyan-400 pl-6">
            <h1 className="text-[24px] font-orbitron font-bold tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              Tactical Analysis Update
            </h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-200 text-[18px] leading-[1.8] font-sans font-light whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>
          
          <div className="mt-16 pt-10 border-t border-white/5 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <div className="text-[9px] font-mono text-cyan-500/40 uppercase tracking-widest">
                  Neural_Hash: 0xFD921...7A2
                </div>
                <div className="text-[9px] font-mono text-slate-600 uppercase">
                  Processed via JARVIS Mark-III Cluster
                </div>
             </div>
             <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500/20 w-full animate-[pulse_2s_infinite]" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceBriefing;
