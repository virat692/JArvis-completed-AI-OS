
import React from 'react';

interface WaveformProps {
  isActive: boolean;
  color: string;
}

const Waveform: React.FC<WaveformProps> = ({ isActive, color }) => {
  return (
    <div className={`flex items-end gap-0.5 h-4 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-20'}`}>
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-current transition-all duration-150"
          style={{
            color: color,
            height: isActive ? `${20 + Math.random() * 80}%` : '15%',
            animationName: isActive ? 'pulse-bar' : 'none',
            animationDuration: isActive ? `${0.4 + Math.random() * 0.4}s` : '0s',
            animationIterationCount: isActive ? 'infinite' : '0',
            animationTimingFunction: isActive ? 'ease-in-out' : 'linear',
            animationDelay: `${i * 0.03}s`
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-bar {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Waveform;
