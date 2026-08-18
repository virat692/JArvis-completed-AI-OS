import React from 'react';
import { OverviewData, WorkspaceSource } from '../../types/workspace';
import { Sparkles, CheckCircle2, Clock, ExternalLink, Zap, FileText, ArrowRight } from 'lucide-react';
import { neuralWorkspaceManager } from '../../services/neuralWorkspaceManager';

interface OverviewPresentationProps {
  overview: OverviewData;
  sourcePrompt?: string;
  metadata?: {
    provider?: string;
    model?: string;
    sources?: WorkspaceSource[];
    wordCount?: number;
    lineCount?: number;
    readingTimeMinutes?: number;
  };
}

export const OverviewPresentation: React.FC<OverviewPresentationProps> = ({
  overview,
  sourcePrompt,
  metadata
}) => {
  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn select-text">
      {/* Originating Query Banner */}
      {sourcePrompt && (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 backdrop-blur-md flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                ORIGINATING QUERY
              </span>
              <p className="text-sm font-medium text-slate-200 line-clamp-1 italic">
                "{sourcePrompt}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              {metadata?.model || 'GEMINI 2.5'}
            </span>
          </div>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.08)] relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase">
              EXECUTIVE SYNTHESIS & SUMMARY
            </h2>
          </div>
          <button
            onClick={() => neuralWorkspaceManager.setMode('PARAGRAPH')}
            className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 hover:text-cyan-100 hover:underline"
          >
            <span>Read Complete Text</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-normal">
          {overview.summary}
        </p>
      </div>

      {/* Real Statistics Grid */}
      {overview.stats && overview.stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {overview.stats.map((st, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#061224]/70 border border-cyan-500/20 backdrop-blur-md flex flex-col justify-between shadow-sm"
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {st.label}
              </span>
              <div className="text-xl sm:text-2xl font-orbitron font-black text-cyan-200 mt-2 tracking-tight">
                {st.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real Key Points / Findings List */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/20 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            SYNTHESIZED KEY POINTS ({overview.keyPoints.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overview.keyPoints.map((pt, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-400/40 transition-all duration-200 flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                  {pt.title}
                </h4>
                {pt.tag && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-bold shrink-0">
                    {pt.tag}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {pt.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Real Citations and Grounded Sources */}
      {metadata?.sources && metadata.sources.length > 0 && (
        <div className="p-5 rounded-2xl bg-black/40 border border-slate-800">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block mb-3">
            VERIFIED GROUNDING CITATIONS ({metadata.sources.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {metadata.sources.map((src, i) => (
              <a
                key={i}
                href={src.uri}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-400 text-xs font-mono text-cyan-300 hover:underline transition-all"
              >
                <span>{src.title}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
