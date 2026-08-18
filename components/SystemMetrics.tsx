import React, { useState, useEffect } from 'react';
import { Cpu, Zap, HardDrive, Globe, Battery, AlertCircle, CheckCircle2, Laptop } from 'lucide-react';
import { telemetryService, DeviceTelemetryState } from '../services/telemetryService';

interface MetricRowProps {
  label: string;
  displayValue: string;
  numericValue: number | null;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  status: 'available' | 'unavailable' | 'unsupported' | 'permission_required';
  helperText?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ 
  label, 
  displayValue, 
  numericValue, 
  icon: Icon, 
  colorClass,
  status,
  helperText
}) => {
  const isAvailable = status === 'available' && numericValue !== null;

  return (
    <div className="space-y-1.5 mb-4">
      <div className="flex justify-between items-center text-[9px] font-orbitron tracking-[0.15em] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${isAvailable ? colorClass : 'text-slate-500'}`} />
          <span className="uppercase text-slate-300 font-semibold">{label}</span>
        </div>
        <span className={`font-mono font-bold ${isAvailable ? colorClass : 'text-slate-500'}`}>
          {displayValue}
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative">
        {isAvailable ? (
          <div 
            className={`h-full ${colorClass.replace('text-', 'bg-')} transition-all duration-700 ease-out shadow-[0_0_8px_currentColor]`} 
            style={{ width: `${Math.min(100, Math.max(0, numericValue))}%` }} 
          />
        ) : (
          <div className="h-full w-full bg-slate-800/30 flex items-center justify-center">
            <span className="text-[7px] font-mono text-slate-600 tracking-wider">NO HARDWARE FEED</span>
          </div>
        )}
      </div>

      {helperText && (
        <div className="text-[8px] font-mono text-slate-500 flex justify-between">
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

export const SystemMetrics: React.FC = () => {
  const [telemetry, setTelemetry] = useState<DeviceTelemetryState>(telemetryService.getTelemetry());

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((updated) => {
      setTelemetry(updated);
    });
    return () => unsubscribe();
  }, []);

  const isLocal = telemetry.environment === 'LOCAL_DEVICE';

  return (
    <div className="w-72 glass p-5 flex flex-col gap-2 relative overflow-hidden group border border-cyan-500/20 bg-[#020b18]/80 backdrop-blur-xl rounded-xl shadow-2xl">
      <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />

      {/* Header & Source Transparency Indicator */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 mb-2">
        <h2 className="text-[10px] font-orbitron tracking-[0.25em] text-cyan-300 font-extrabold flex items-center gap-2">
          <Laptop className="w-3.5 h-3.5 text-cyan-400" />
          SYSTEM TELEMETRY
        </h2>

        {/* Source Badge */}
        <span 
          className={`px-2 py-0.5 rounded-full text-[7.5px] font-orbitron font-extrabold tracking-wider border flex items-center gap-1 ${
            isLocal 
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' 
              : 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300'
          }`}
          title={telemetry.sourceDescription}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
          {telemetry.statusLabel}
        </span>
      </div>

      {/* Notice when in Browser Mode */}
      {!isLocal && (
        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[8.5px] font-sans text-cyan-200/80 flex items-start gap-2 mb-2 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block font-orbitron text-[8px] uppercase">Browser Sandbox Environment</span>
            Host CPU, RAM, and Disk metrics require native OS daemon (<span className="font-mono text-cyan-300">localhost:8000</span>).
          </div>
        </div>
      )}

      {/* Real Hardware / Sandbox Telemetry Rows */}
      <MetricRow 
        label="HOST_CPU" 
        displayValue={telemetry.cpu.usagePercent.display} 
        numericValue={telemetry.cpu.usagePercent.value} 
        icon={Cpu} 
        colorClass="text-cyan-400" 
        status={telemetry.cpu.usagePercent.status}
        helperText={telemetry.cpu.cores.display !== 'N/A' ? telemetry.cpu.cores.display : undefined}
      />

      <MetricRow 
        label="RAM_LOAD" 
        displayValue={telemetry.memory.usedPercent.display} 
        numericValue={telemetry.memory.usedPercent.value} 
        icon={Zap} 
        colorClass="text-blue-400" 
        status={telemetry.memory.usedPercent.status}
        helperText={telemetry.memory.summary.display !== 'Telemetry Unavailable in Browser' ? telemetry.memory.summary.display : undefined}
      />

      <MetricRow 
        label="DISK_STORAGE" 
        displayValue={telemetry.disk.usedPercent.display} 
        numericValue={telemetry.disk.usedPercent.value} 
        icon={HardDrive} 
        colorClass="text-purple-400" 
        status={telemetry.disk.usedPercent.status}
        helperText={telemetry.disk.freeSpace.display !== 'Unavailable' ? telemetry.disk.freeSpace.display : undefined}
      />

      <MetricRow 
        label="GPU_ENGINE" 
        displayValue={telemetry.gpu.usagePercent.display} 
        numericValue={telemetry.gpu.usagePercent.value} 
        icon={Globe} 
        colorClass="text-indigo-400" 
        status={telemetry.gpu.usagePercent.status}
        helperText={telemetry.gpu.name.display !== 'Unavailable' ? telemetry.gpu.name.display : undefined}
      />

      <MetricRow 
        label="BATTERY_STATUS" 
        displayValue={telemetry.battery.percent.display} 
        numericValue={telemetry.battery.percent.value} 
        icon={Battery} 
        colorClass="text-emerald-400" 
        status={telemetry.battery.percent.status}
        helperText={telemetry.battery.isCharging.display !== 'N/A' ? telemetry.battery.isCharging.display : undefined}
      />

      {/* Verified Status Footer */}
      <div className="mt-auto pt-3 border-t border-cyan-500/15">
        <div className="text-[8.5px] font-mono leading-relaxed text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>WEB RUNTIME:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              ONLINE
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>NETWORK LINK:</span>
            <span className={telemetry.network.isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {telemetry.network.isOnline ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>DEVICE TELEMETRY:</span>
            <span className={isLocal ? 'text-emerald-300 font-bold' : 'text-slate-500 font-bold'}>
              {isLocal ? 'VERIFIED REAL' : 'UNAVAILABLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
