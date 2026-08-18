import React, { useEffect, useState } from 'react';
import { X, Activity, Cpu, HardDrive, ShieldAlert, RefreshCw, Zap, Bell, Play } from 'lucide-react';
import { runtimeEngine } from '../runtime/runtimeEngine';
import { RuntimeMetrics, RuntimeJob, RuntimeNotification } from '../types';
import { eventBus } from '../services/eventBus';

interface RuntimePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuntimePanel: React.FC<RuntimePanelProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<RuntimeMetrics>(runtimeEngine.getMetrics());
  const [jobs, setJobs] = useState<RuntimeJob[]>(runtimeEngine.getJobs());
  const [notifications, setNotifications] = useState<RuntimeNotification[]>(runtimeEngine.getNotifications());
  const [workers, setWorkers] = useState(runtimeEngine.getWorkers());
  const [activeTab, setActiveTab] = useState<'metrics' | 'jobs' | 'workers' | 'notifications'>('metrics');

  useEffect(() => {
    if (!isOpen) return;

    const unsubHeartbeat = eventBus.on('runtime.heartbeat', () => {
      setMetrics(runtimeEngine.getMetrics());
      setJobs(runtimeEngine.getJobs());
      setWorkers(runtimeEngine.getWorkers());
      setNotifications(runtimeEngine.getNotifications());
    });

    return () => {
      unsubHeartbeat();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateCrash = () => {
    runtimeEngine.handleCrash('GUI_Simulated_Subsystem', 'Test exception triggered by operator for auto-recovery validation.');
  };

  const handleTestWorker = () => {
    runtimeEngine.dispatchWorker('Memory Indexer Worker', 'BACKGROUND_REINDEX', async () => {
      await new Promise((r) => setTimeout(r, 3000));
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#030914] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.25)] flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-orbitron font-extrabold uppercase tracking-widest text-cyan-300 flex items-center gap-2">
                JARVIS Runtime Engine
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ONLINE
                </span>
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Continuous lifecycle, event bus, task scheduler & crash auto-recovery manager.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          {[
            { id: 'metrics', label: 'Health & System', icon: Activity },
            { id: 'jobs', label: `Jobs (${jobs.length})`, icon: RefreshCw },
            { id: 'workers', label: `Workers (${workers.length})`, icon: Cpu },
            { id: 'notifications', label: `Alerts (${notifications.length})`, icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-[10px] font-orbitron font-bold uppercase tracking-wider rounded-t-lg transition-all border-t border-x cursor-pointer ${
                  isActive
                    ? 'bg-[#030914] text-cyan-300 border-cyan-500/50 shadow-[0_-2px_10px_rgba(0,242,255,0.15)]'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panel Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 font-mono text-xs text-slate-300">
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-400" /> Uptime
                  </span>
                  <span className="text-base font-bold font-orbitron text-cyan-300">
                    {metrics.uptimeSeconds}s
                  </span>
                  <span className="text-[9px] text-slate-500">Ticks: #{metrics.heartbeatCount}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-purple-400" /> CPU Load
                  </span>
                  <span className="text-base font-bold font-orbitron text-purple-300">
                    {metrics.cpuPercent}%
                  </span>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${metrics.cpuPercent}%` }} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-emerald-400" /> RAM Footprint
                  </span>
                  <span className="text-base font-bold font-orbitron text-emerald-300">
                    {metrics.memoryUsageMb} MB
                  </span>
                  <span className="text-[9px] text-slate-500">Allocated RAM</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Event Bus
                  </span>
                  <span className="text-base font-bold font-orbitron text-amber-300">
                    {metrics.totalEventsProcessed}
                  </span>
                  <span className="text-[9px] text-slate-500">Events Dispatched</span>
                </div>
              </div>

              {/* Recovery Status */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-orbitron font-bold text-[11px] text-slate-200 uppercase tracking-wider">
                      Fault Tolerance & Crash Recovery
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Auto-intercepted events: <span className="text-rose-400 font-bold">{metrics.recoveredCount}</span> | Last recovery:{' '}
                      {metrics.lastCrashTimestamp ? new Date(metrics.lastCrashTimestamp).toLocaleTimeString() : 'None'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSimulateCrash}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 text-[10px] font-orbitron font-bold uppercase cursor-pointer transition-all"
                >
                  Simulate Issue
                </button>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-orbitron font-bold text-slate-300 uppercase">
                  Scheduled Task Jobs (Cron Engine)
                </span>
              </div>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className={`w-4 h-4 ${job.status === 'RUNNING' ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-slate-200">{job.name}</div>
                        <div className="text-[9px] text-slate-400">Interval: {job.intervalMs}ms | Executions: #{job.runCount}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        job.status === 'RUNNING' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-orbitron font-bold text-slate-300 uppercase">
                  Active Async Background Workers
                </span>
                <button
                  onClick={handleTestWorker}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[9.5px] font-orbitron font-bold uppercase cursor-pointer hover:bg-cyan-500/30 transition-all flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Spawn Worker
                </button>
              </div>
              {workers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No active workers running. Click 'Spawn Worker' to test background queue.
                </div>
              ) : (
                <div className="space-y-2">
                  {workers.map((w) => (
                    <div key={w.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200">{w.name}</div>
                        <div className="text-[9px] text-slate-400">Type: {w.type}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        {w.status} ({w.progress}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <span className="text-[11px] font-orbitron font-bold text-slate-300 uppercase">
                Runtime Notifications Queue
              </span>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                    <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${
                      n.level === 'error' ? 'text-rose-400' : n.level === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{n.title}</span>
                        <span className="text-[9px] text-slate-500">{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyan-500/20 bg-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>JARVIS Core • Continuous Execution</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold uppercase hover:bg-cyan-500/30 transition-all cursor-pointer"
          >
            Close Engine View
          </button>
        </div>

      </div>
    </div>
  );
};
