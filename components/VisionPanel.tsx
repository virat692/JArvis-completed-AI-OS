
import React, { useRef } from 'react';
import { Search, Maximize2, Crosshair, EyeOff, Zap, Upload, Monitor, Layout, Sparkles } from 'lucide-react';
import JarvisExpression from './JarvisExpression';
import { JarvisStatus } from '../types';

interface VisionPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  isScreenActive: boolean;
  isOpticActive?: boolean;
  status: JarvisStatus;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  onInstantOCR?: () => void;
  onUploadImage?: (file: File) => void;
  onToggleScreenPerception?: () => void;
}

const VisionPanel: React.FC<VisionPanelProps> = ({ 
  videoRef, 
  screenVideoRef, 
  isScreenActive, 
  isOpticActive = true, 
  status, 
  theme = 'cyber',
  onInstantOCR,
  onUploadImage,
  onToggleScreenPerception
}) => {
  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadImage) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <div className={`w-80 shrink-0 min-w-[320px] flex flex-col p-5 gap-4 relative overflow-hidden transition-all duration-500 rounded-2xl backdrop-blur-2xl border ${
      isSlate
        ? 'bg-zinc-900/90 border-slate-700/80 shadow-[0_0_25px_rgba(0,0,0,0.8)]'
        : isMinimal
          ? 'bg-[#0f172a]/95 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.2)] text-slate-100'
          : isGold
            ? 'bg-[#181310]/95 border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.2)] text-amber-100'
            : 'bg-[rgba(0,20,30,0.35)] border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,255,0.2)] text-cyan-100'
    }`}>
      <div className={`absolute top-0 right-0 w-1 h-full ${
        isSlate ? 'bg-zinc-700/40' : isMinimal ? 'bg-emerald-500/20' : isGold ? 'bg-amber-500/20' : 'bg-cyan-400/30'
      }`} />
      
      <div className="flex items-center justify-between">
        <h2 className={`text-[10px] font-orbitron tracking-[0.4em] flex items-center justify-between w-full ${
          isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-400'
        }`}>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-3.5 rounded-full ${isSlate ? 'bg-zinc-300' : 'bg-cyan-400 shadow-[0_0_8px_#00f2ff]'}`} />
             {isScreenActive ? 'SCREEN_PERCEPTION' : 'OPTIC_PERCEPTION'}
          </div>
          <div className="flex gap-2 opacity-40">
             <Search className="w-3.5 h-3.5" />
             <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </h2>
      </div>

      <div className="flex items-center justify-between -mt-2 text-[9px] font-mono tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          NVIDIA Nemotron OCR v2
        </span>
        <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">NIM ACTIVE</span>
      </div>

      {/* Primary Video Feed */}
      <div className={`relative aspect-[4/3] overflow-hidden shadow-2xl bg-black group transition-all duration-500 rounded-xl border ${
        isSlate ? 'border-slate-700/90' : 'border-cyan-400/40 shadow-[0_0_20px_rgba(0,242,255,0.2)]'
      }`}>
        {isScreenActive ? (
          <video ref={screenVideoRef} autoPlay muted playsInline className="w-full h-full object-contain brightness-90 group-hover:brightness-100 transition-all duration-1000" />
        ) : isOpticActive ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-1000" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[rgba(0,20,30,0.6)] backdrop-blur-md text-slate-500 gap-2 p-4 text-center">
            <EyeOff className={`w-8 h-8 animate-pulse ${isSlate ? 'text-zinc-400' : 'text-cyan-500/30'}`} />
            <span className={`text-[10px] font-orbitron tracking-widest uppercase ${isSlate ? 'text-zinc-300' : 'text-cyan-500/60'}`}>OPTIC SENSORS OFFLINE</span>
            <span className="text-[8px] font-mono text-slate-600">Camera Vision Paused</span>
          </div>
        )}

        {/* Laser Vision Scan Sweep Line Effect */}
        {(isOpticActive || isScreenActive) && (
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f2ff] animate-[scan_3s_ease-in-out_infinite] pointer-events-none z-10" />
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

      {/* Easy Screen OCR Action Controls */}
      <div className="flex flex-col gap-2 pt-1 border-t border-cyan-500/10">
        <div className="text-[9px] font-orbitron font-bold text-slate-400 tracking-wider flex items-center justify-between">
          <span>EASY SCREEN VISION MODES</span>
          <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Instant Zero-Popup OCR Scan */}
          <button
            onClick={onInstantOCR}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 hover:border-cyan-400 text-[9px] font-orbitron font-bold tracking-wider transition-all shadow-[0_0_10px_rgba(0,242,255,0.15)] active:scale-95"
            title="Instant Screen OCR (No browser popup required)"
          >
            <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400/40" />
            <span>⚡ INSTANT OCR</span>
          </button>

          {/* Upload Screenshot File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-purple-500/40 text-purple-300 hover:border-purple-400 text-[9px] font-orbitron font-bold tracking-wider transition-all active:scale-95"
            title="Upload Screenshot Image for JARVIS OCR"
          >
            <Upload className="w-3 h-3 text-purple-400" />
            <span>UPLOAD IMAGE</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Live Stream Share Toggle */}
        <button
          onClick={onToggleScreenPerception}
          className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-orbitron font-bold tracking-wider transition-all ${
            isScreenActive
              ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'bg-slate-900/70 border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50'
          }`}
        >
          {isScreenActive ? (
            <>
              <Monitor className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>SCREEN STREAM ACTIVE (CLICK TO STOP)</span>
            </>
          ) : (
            <>
              <Layout className="w-3 h-3 text-cyan-400" />
              <span>START FULL DESKTOP STREAM</span>
            </>
          )}
        </button>
      </div>

      {/* Jarvis Expression Layer */}
      <JarvisExpression status={status} />
    </div>
  );
};

export default VisionPanel;

