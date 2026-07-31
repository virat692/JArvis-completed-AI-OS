
import React, { useState, useEffect } from 'react';
import { Cpu, Zap, HardDrive, Globe, Battery } from 'lucide-react';

const MetricBar = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="space-y-2 mb-6">
    <div className="flex justify-between items-center text-[9px] font-orbitron tracking-[0.2em] text-slate-400">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
        <span className="uppercase">{label}</span>
      </div>
      <span className={`${colorClass} font-bold`}>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
      <div 
        className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} 
        style={{ width: `${value}%` }} 
      />
    </div>
  </div>
);

export const SystemMetrics = () => {
  const [metrics, setMetrics] = useState({
    cpu: 12, ram: 44, disk: 68, net: 4, bat: 100
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(5, prev.cpu + (Math.random() * 10 - 5))),
        net: Math.min(100, Math.max(0, prev.net + (Math.random() * 4 - 2))),
        ram: Math.min(100, Math.max(40, prev.ram + (Math.random() * 2 - 1))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-72 glass p-6 flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/20" />
      <h2 className="text-[10px] font-orbitron tracking-[0.4em] text-cyan-400 mb-8 flex items-center gap-2">
        <div className="w-1 h-3 bg-cyan-400" />
        SYSTEM_MATRIX
      </h2>
      <MetricBar label="CPU_CORE" value={Math.round(metrics.cpu)} icon={Cpu} colorClass="text-cyan-400" />
      <MetricBar label="MEMORY_LOAD" value={Math.round(metrics.ram)} icon={Zap} colorClass="text-blue-400" />
      <MetricBar label="DISK_ARCHIVE" value={metrics.disk} icon={HardDrive} colorClass="text-purple-400" />
      <MetricBar label="NEURAL_NET" value={Math.round(metrics.net)} icon={Globe} colorClass="text-emerald-400" />
      <MetricBar label="ENERGY_CELL" value={metrics.bat} icon={Battery} colorClass="text-cyan-300" />
      
      <div className="mt-auto pt-4 border-t border-white/5 opacity-30">
        <div className="text-[8px] font-mono leading-tight text-slate-500">
          UPLINK: ACTIVE<br/>
          STABILITY: OPTIMAL<br/>
          TEMP: 42°C
        </div>
      </div>
    </div>
  );
};
