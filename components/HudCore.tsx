
import React from 'react';
import { JarvisStatus } from '../types';

interface HudCoreProps {
  status: JarvisStatus;
  micLevel?: number;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const HudCore: React.FC<HudCoreProps> = ({ status, micLevel = 0, theme = 'cyber' }) => {
  const getTheme = () => {
    if (theme === 'minimal') {
      switch (status) {
        case JarvisStatus.LISTENING: return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)', speed: '10s' };
        case JarvisStatus.THINKING: return { color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.6)', speed: '4s' };
        case JarvisStatus.SPEAKING: return { color: '#059669', glow: 'rgba(5, 150, 105, 0.8)', speed: '8s' };
        case JarvisStatus.DIAGNOSTIC: return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', speed: '2s' };
        default: return { color: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', speed: '20s' };
      }
    }
    if (theme === 'gold') {
      switch (status) {
        case JarvisStatus.LISTENING: return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', speed: '10s' };
        case JarvisStatus.THINKING: return { color: '#d97706', glow: 'rgba(217, 119, 6, 0.6)', speed: '4s' };
        case JarvisStatus.SPEAKING: return { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.8)', speed: '8s' };
        case JarvisStatus.DIAGNOSTIC: return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', speed: '2s' };
        default: return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', speed: '20s' };
      }
    }
    if (theme === 'slate') {
      switch (status) {
        case JarvisStatus.LISTENING: return { color: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.6)', speed: '10s' };
        case JarvisStatus.THINKING: return { color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.6)', speed: '4s' };
        case JarvisStatus.SPEAKING: return { color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.8)', speed: '8s' };
        case JarvisStatus.DIAGNOSTIC: return { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', speed: '2s' };
        default: return { color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.25)', speed: '20s' };
      }
    }
    switch (status) {
      case JarvisStatus.LISTENING: return { color: '#00f2ff', glow: 'rgba(0, 242, 255, 0.6)', speed: '10s' };
      case JarvisStatus.THINKING: return { color: '#7000ff', glow: 'rgba(112, 0, 255, 0.6)', speed: '4s' };
      case JarvisStatus.SPEAKING: return { color: '#0041ff', glow: 'rgba(0, 65, 255, 0.8)', speed: '8s' };
      case JarvisStatus.DIAGNOSTIC: return { color: '#ffaa00', glow: 'rgba(255, 170, 0, 0.6)', speed: '2s' };
      default: return { color: '#00f2ff', glow: 'rgba(0, 242, 255, 0.2)', speed: '20s' };
    }
  };

  const { color, glow, speed } = getTheme();

  return (
    <div className="relative flex items-center justify-center w-[600px] h-[600px] perspective-[1500px]">
      <div className="absolute inset-0 flex items-center justify-center transform-gpu rotate-x-[15deg]">
        
        {/* Orbit Layer 1 - Outer Ring */}
        <svg className="absolute w-[90%] h-[90%] opacity-10" viewBox="0 0 100 100" style={{ 
          animationName: 'spin',
          animationDuration: speed,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite'
        }}>
          <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="0.2" strokeDasharray="1 3" />
        </svg>

        {/* Orbit Layer 2 - Tactical Notches */}
        <svg className="absolute w-[75%] h-[75%] opacity-20" viewBox="0 0 100 100" style={{ 
          animationName: 'spin',
          animationDuration: '15s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDirection: 'reverse'
        }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="1" strokeDasharray="0.5 15" />
          <path d="M 50 2 L 50 10 M 50 90 L 50 98 M 2 50 L 10 50 M 90 50 L 98 50" stroke={color} strokeWidth="0.5" />
        </svg>

        {/* Central Core Module */}
        <div className="relative w-96 h-96 flex items-center justify-center">
          <svg className="absolute w-full h-full inset-0 z-0" viewBox="0 0 100 100">
            {/* Pulsing Core Border */}
            <circle 
              cx="50" cy="50" r="30" 
              fill="none" 
              stroke={color} 
              strokeWidth="0.8" 
              className={status !== JarvisStatus.IDLE ? 'animate-pulse' : ''}
              style={{ filter: `drop-shadow(0 0 15px ${glow})` }}
            />
            
            {/* Hexagonal Geometry */}
            <path 
              d="M50 25 L72 38 L72 62 L50 75 L28 62 L28 38 Z" 
              fill={`${color}05`} 
              stroke={color} 
              strokeWidth="1" 
              className="animate-[spin_30s_linear_infinite] opacity-30"
            />
          </svg>

          {/* CENTRAL GIF ANIMATION LAYER */}
          <div className="relative w-64 h-64 rounded-full overflow-hidden flex items-center justify-center z-10">
            {/* High-tech reactor/core GIF */}
            <img 
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Z1OHB1Z3p6ZWlyYmx4ZWp6Z3Z1OHB1Z3p6ZWlyYmx4ZWp6Z3Z1JnB0X3JlZGlyZWN0PTEmZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKMGpxV9YvJ6h6o/giphy.gif"
              alt="JARVIS CORE"
              className={`w-full h-full object-cover mix-blend-screen transition-all duration-1000 ${
                status !== JarvisStatus.IDLE ? 'scale-110 brightness-125' : 'scale-90 brightness-75 opacity-40'
              }`}
              style={{ 
                filter: `drop-shadow(0 0 20px ${color}) hue-rotate(${status === JarvisStatus.THINKING ? '260deg' : '0deg'})` 
              }}
            />
          </div>

          {/* Central Processor Prism (Overlay) */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`w-32 h-32 rounded-sm rotate-45 border-2 border-cyan-400/20 bg-gradient-to-br from-cyan-900/20 to-transparent backdrop-blur-sm flex items-center justify-center transition-all duration-700 ${
              status !== JarvisStatus.IDLE ? 'scale-110 opacity-60' : 'scale-90 opacity-20'
            }`} style={{ boxShadow: `inset 0 0 20px ${glow}, 0 0 40px ${glow}` }}>
               <div className="w-16 h-16 bg-cyan-400/10 border border-cyan-400/30 rounded-full animate-ping" />
               
               {/* Mic Level Visualizer */}
               {status === JarvisStatus.LISTENING && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div 
                     className="w-full h-full border-2 border-cyan-400 opacity-40 rounded-sm"
                     style={{ 
                       transform: `scale(${1 + (micLevel / 100)})`,
                       transition: 'transform 0.1s ease-out'
                     }}
                   />
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Tactical Telemetry */}
        <div className="absolute inset-0 pointer-events-none font-orbitron text-[8px] text-cyan-400/40">
           <div className="absolute top-[20%] left-[15%]">OS_MARK_III_REV_9</div>
           <div className="absolute bottom-[20%] right-[15%] text-glow">CORE_SYNC: ACTIVE</div>
           <div className="absolute top-[50%] left-[5%] -rotate-90 origin-left">NEURAL_SYNC_0.9928</div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default HudCore;
