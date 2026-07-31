
import React from 'react';
import { Eye, Search, Maximize2, Crosshair, EyeOff } from 'lucide-react';
import JarvisExpression from './JarvisExpression';
import { JarvisStatus } from '../types';

interface VisionPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  isScreenActive: boolean;
  isOpticActive?: boolean;
  status: JarvisStatus;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const VisionPanel: React.FC<VisionPanelProps> = ({ videoRef, screenVideoRef, isScreenActive, isOpticActive = true, status, theme = 'cyber' }) => {
  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  return (
    <div className={`w-80 shrink-0 min-w-[320px] flex flex-col p-6 gap-6 relative overflow-hidden transition-all duration-300 ${
      isSlate
        ? 'bg-zinc-900/90 border-l border-slate-700/80 rounded-2xl shadow-xl'
        : isMinimal
          ? 'bg-[#0f172a]/95 border-l border-emerald-500/20 rounded-2xl shadow-xl text-slate-100'
          : isGold
            ? 'bg-[#181310]/95 border-l border-amber-500/20 rounded-2xl shadow-xl text-amber-100'
            : 'glass border-l border-white/5 bg-black/20'
    }`}>
      <div className={`absolute top-0 right-0 w-1 h-full ${
        isSlate ? 'bg-zinc-700/40' : isMinimal ? 'bg-emerald-500/20' : isGold ? 'bg-amber-500/20' : 'bg-cyan-500/10'
      }`} />
      
      <h2 className={`text-[10px] font-orbitron tracking-[0.4em] mb-2 flex items-center justify-between ${
        isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-400'
      }`}>
        <div className="flex items-center gap-2">
           <div className={`w-1 h-3 ${isSlate ? 'bg-zinc-300' : 'bg-cyan-400'}`} />
           {isScreenActive ? 'SCREEN_PERCEPTION' : 'OPTIC_PERCEPTION'}
        </div>
        <div className="flex gap-2 opacity-30">
           <Search className="w-3 h-3" />
           <Maximize2 className="w-3 h-3" />
        </div>
      </h2>

      {/* Primary Video Feed */}
      <div className={`relative aspect-[4/3] overflow-hidden shadow-2xl bg-black group transition-all duration-300 ${
        isSlate ? 'rounded-2xl border border-slate-700/90' : 'rounded border border-cyan-500/30'
      }`}>
        {isScreenActive ? (
          <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain brightness-90 group-hover:brightness-100 transition-all duration-1000" />
        ) : isOpticActive ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-1000" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-slate-500 gap-2 p-4 text-center">
            <EyeOff className={`w-8 h-8 animate-pulse ${isSlate ? 'text-zinc-400' : 'text-cyan-500/30'}`} />
            <span className={`text-[10px] font-orbitron tracking-widest uppercase ${isSlate ? 'text-zinc-300' : 'text-cyan-500/60'}`}>OPTIC SENSORS OFFLINE</span>
            <span className="text-[8px] font-mono text-slate-600">Camera Vision Paused</span>
          </div>
        )}
        
        {/* Tactical Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
           <div className="flex justify-between">
             <div className={`w-4 h-4 border-t-2 border-l-2 ${isSlate ? 'border-zinc-400/50' : 'border-cyan-500/40'}`} />
             <div className={`w-4 h-4 border-t-2 border-r-2 ${isSlate ? 'border-zinc-400/50' : 'border-cyan-500/40'}`} />
           </div>
           <div className="flex justify-center">
              <Crosshair className={`w-6 h-6 animate-pulse ${isSlate ? 'text-zinc-400/30' : 'text-cyan-500/20'}`} />
           </div>
           <div className="flex justify-between">
             <div className={`w-4 h-4 border-b-2 border-l-2 ${isSlate ? 'border-zinc-400/50' : 'border-cyan-500/40'}`} />
             <div className={`w-4 h-4 border-b-2 border-r-2 ${isSlate ? 'border-zinc-400/50' : 'border-cyan-500/40'}`} />
           </div>
        </div>
        
        <div className="absolute top-2 right-2 flex items-center gap-2">
           <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-lg border ${
             isSlate 
               ? 'text-zinc-200 bg-zinc-800/90 border-slate-600'
               : isOpticActive || isScreenActive ? 'text-cyan-400 bg-cyan-950/50 border-cyan-400/20' : 'text-slate-500 bg-slate-900 border-slate-700'
           }`}>
             {isScreenActive ? 'SCREEN_RAW' : isOpticActive ? 'LIVE_RAW' : 'STANDBY'}
           </span>
        </div>
      </div>

      {/* Jarvis Expression Layer */}
      <JarvisExpression status={status} />
    </div>
  );
};

export default VisionPanel;
