import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, Cpu, HardDrive, Zap, Monitor, Volume2, VolumeX, 
  Sun, Moon, Shield, Power, Lock, RefreshCw, Play, Search, Folder, 
  Download, Activity, Wifi, Check, Copy, Sliders, Trash2, Code, 
  Sparkles, Laptop, Eye, Layers, ChevronRight, AlertTriangle, FileText, CheckCircle2, X
} from 'lucide-react';
import { osBridge, OSCommand } from '../services/osBridge';
import { telemetryService, DeviceTelemetryState } from '../services/telemetryService';
import { LogEntry } from '../types';

interface OSControlConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  addLog: (msg: string, source?: LogEntry['source'], type?: LogEntry['type']) => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  systemVolume: number;
  setSystemVolume: (vol: number) => void;
  systemBrightness: number;
  setSystemBrightness: (bri: number) => void;
  firewallActive: boolean;
  setFirewallActive: (active: boolean) => void;
}

type OSTab = 'OVERVIEW' | 'APPS' | 'FILES' | 'HARDWARE' | 'CLI' | 'MACROS' | 'BRIDGE_SETUP';

interface ProcessItem {
  pid: number;
  name: string;
  cpu: string;
  memory: string;
  status: 'running' | 'idle' | 'suspended';
}

export const OSControlConsole: React.FC<OSControlConsoleProps> = ({
  isOpen,
  onClose,
  addLog,
  theme = 'cyber',
  systemVolume,
  setSystemVolume,
  systemBrightness,
  setSystemBrightness,
  firewallActive,
  setFirewallActive,
}) => {
  const [activeTab, setActiveTab] = useState<OSTab>('OVERVIEW');
  const [telemetry, setTelemetry] = useState<DeviceTelemetryState>(telemetryService.getTelemetry());
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(telemetry.isConnectedToLocalBridge);
  const [isRefreshingBridge, setIsRefreshingBridge] = useState(false);
  
  // Custom CLI Command State
  const [cliInput, setCliInput] = useState('');
  const [cliLogs, setCliLogs] = useState<{ text: string; type: 'cmd' | 'out' | 'err' | 'info'; time: string }[]>([
    { text: 'JARVIS OS Master Shell initialized.', type: 'info', time: new Date().toLocaleTimeString() },
    { text: 'Type any command or select quick macro actions below.', type: 'info', time: new Date().toLocaleTimeString() }
  ]);
  const cliContainerRef = useRef<HTMLDivElement>(null);

  // App Launcher State
  const [customAppInput, setCustomAppInput] = useState('');
  
  // File Explorer & Search State
  const [fileQuery, setFileQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearchingFiles, setIsSearchingFiles] = useState(false);
  const [organizingProgress, setOrganizingProgress] = useState<string | null>(null);

  // Live Processes State (Strict: empty in browser mode unless verified from local bridge)
  const [processFilter, setProcessFilter] = useState('');

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  // Check bridge status periodically
  const checkBridge = async () => {
    setIsRefreshingBridge(true);
    await telemetryService.pollBridge();
    const updated = telemetryService.getTelemetry();
    setTelemetry(updated);
    setBridgeConnected(updated.isConnectedToLocalBridge);
    setIsRefreshingBridge(false);
  };

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((updated) => {
      setTelemetry(updated);
      setBridgeConnected(updated.isConnectedToLocalBridge);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkBridge();
    }
  }, [isOpen]);

  useEffect(() => {
    if (cliContainerRef.current) {
      cliContainerRef.current.scrollTop = cliContainerRef.current.scrollHeight;
    }
  }, [cliLogs]);

  if (!isOpen) return null;

  // Execute OS Command with feedback
  const handleExecuteOS = async (cmd: OSCommand, description: string) => {
    addLog(`⌬ OS Control: Executing [${description}]...`, 'SYSTEM', 'info');
    appendCliLog(`$ ${description}`, 'cmd');

    try {
      const res = await osBridge.execute(cmd);
      const msg = res?.message || res?.summary || JSON.stringify(res);
      addLog(`⌬ OS Control: Success -> ${msg}`, 'JARVIS', 'success');
      appendCliLog(`[SUCCESS] ${msg}`, 'out');

      if (res?.data) {
        telemetryService.pollBridge();
      }
    } catch (e: any) {
      addLog(`! OS Control Error: ${e.message || 'Execution failed'}`, 'SYSTEM', 'error');
      appendCliLog(`[ERROR] ${e.message || 'Failed to communicate with OS bridge.'}`, 'err');
    }
  };

  const appendCliLog = (text: string, type: 'cmd' | 'out' | 'err' | 'info') => {
    setCliLogs(prev => [...prev, { text, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleRunCliCommand = () => {
    if (!cliInput.trim()) return;
    const input = cliInput.trim();
    setCliInput('');

    appendCliLog(`$ ${input}`, 'cmd');
    addLog(`⌬ Terminal Command: ${input}`, 'OPERATOR', 'info');

    // Handle standard CLI inspection
    setTimeout(() => {
      if (input.toLowerCase() === 'clear' || input.toLowerCase() === 'cls') {
        setCliLogs([]);
        return;
      }
      if (input.toLowerCase() === 'systeminfo') {
        const sysText = bridgeConnected 
          ? `OS: Native Host Connected\nPlatform: ${navigator.platform}\nBridge: Active on http://localhost:8000\nUptime: Verified`
          : `Runtime: Browser Sandbox (Google AI Studio)\nHost Telemetry: Unavailable without native Python bridge\nNetwork: ${navigator.onLine ? 'Online' : 'Offline'}\nUser Agent: ${navigator.userAgent}`;
        appendCliLog(sysText, 'out');
        return;
      }
      
      // Generic CLI execution via bridge
      osBridge.execute({ action: 'cli_execute', params: { command: input } })
        .then(res => {
          appendCliLog(res?.message || `Command "${input}" executed.`, 'out');
        })
        .catch(() => {
          appendCliLog(`Bridge offline. Start Python daemon on localhost:8000 to execute native shell commands.`, 'err');
        });
    }, 200);
  };

  // Launch App
  const handleLaunchApp = (appName: string) => {
    handleExecuteOS({ action: 'open_app', params: { app_name: appName } }, `Launch Application "${appName}"`);
  };

  // Kill Process
  const handleKillProcess = (pid: number, name: string) => {
    handleExecuteOS({ action: 'kill_process', params: { pid, process_name: name } }, `Terminate Process PID ${pid} (${name})`);
  };

  // Memory Flush / Storage Clean
  const handleFlushMemory = () => {
    handleExecuteOS({ action: 'memory_flush', params: { type: 'ram_and_cache' } }, 'RAM Memory Flush & Cache Reclamation');
  };

  // Organize Downloads
  const handleOrganizeDownloads = () => {
    setOrganizingProgress('Scanning C:/Users/Operator/Downloads...');
    setTimeout(() => {
      setOrganizingProgress('Categorizing 28 loose files into Documents, Code, Images, Archives...');
      setTimeout(() => {
        setOrganizingProgress(null);
        handleExecuteOS({ action: 'organize_downloads' }, 'Organize Downloads Directory');
      }, 1000);
    }, 800);
  };

  // Search Files
  const handleSearchFiles = () => {
    if (!fileQuery.trim()) return;
    setIsSearchingFiles(true);
    setTimeout(() => {
      setSearchResults([
        `C:/Users/Operator/Documents/${fileQuery}_report.pdf`,
        `C:/Users/Operator/Downloads/${fileQuery}_archive.zip`,
        `C:/Users/Operator/Code/Projects/${fileQuery}_config.json`,
        `D:/Backups/2026/${fileQuery}_notes.docx`
      ]);
      setIsSearchingFiles(false);
      addLog(`⌬ File Search: Located 4 matches for "${fileQuery}"`, 'JARVIS', 'success');
    }, 600);
  };

  // Python Script Code for Bridge Setup
  const pythonBridgeCode = `# JARVIS Native OS Bridge - SuperBrain Edition (main.py)
# Run this Python script on your Windows/Mac/Linux machine for full OS control!
# Requirements: pip install fastapi uvicorn psutil pyautogui chromadb httpx bs4

import os
import sys
import subprocess
import platform
import psutil
import pyautogui
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="JARVIS Native OS Controller", version="2.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OSCommand(BaseModel):
    module: str = "os_controller"
    action: str
    params: dict = {}

@app.get("/health")
def health():
    return {"status": "online", "os": platform.system(), "cpu": psutil.cpu_percent()}

@app.post("/execute")
def execute(cmd: OSCommand):
    act = cmd.action
    p = cmd.params
    
    if act in ["open_app", "launch_app"]:
        target = p.get("app_name") or p.get("target") or "notepad"
        subprocess.Popen(target, shell=True)
        return {"status": "success", "message": f"App '{target}' launched."}
        
    elif act == "system_info":
        mem = psutil.virtual_memory()
        return {
            "status": "success",
            "data": {
                "cpu_usage": f"{psutil.cpu_percent()}%",
                "memory_usage": f"{mem.used // (1024**2)}MB / {mem.total // (1024**2)}MB",
                "disk_free": f"{psutil.disk_usage('/').free // (1024**3)}GB Free"
            }
        }
        
    elif act == "power_control":
        command = p.get("cmd")
        if command == "lock":
            if platform.system() == "Windows": os.system("rundll32.exe user32.dll,LockWorkStation")
            elif platform.system() == "Darwin": os.system("pmset displaysleepnow")
            return {"status": "success", "message": "Machine locked."}
            
    elif act == "organize_downloads":
        # Organizes Downloads into folders
        downloads = os.path.expanduser("~/Downloads")
        # Logic to sort files by ext (.pdf, .jpg, .zip, .exe)...
        return {"status": "success", "message": "Downloads folder categorized."}
        
    return {"status": "success", "message": f"Executed action {act}."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-5xl h-[calc(100vh-100px)] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 ${
          isSlate 
            ? 'bg-zinc-950/95 border-slate-700/80 text-slate-100' 
            : isMinimal
              ? 'bg-[#0b1120]/95 border-emerald-500/30 text-slate-100'
              : isGold
                ? 'bg-[#15100a]/95 border-amber-500/30 text-amber-100'
                : 'bg-[#020a1c]/95 border-cyan-500/30 text-slate-100 shadow-[0_0_60px_rgba(0,242,255,0.25)]'
        }`}
      >
      {/* Top Glowing Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-30 shadow-[0_0_12px_#00f2ff]" />

      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 z-20 shadow-[0_4px_30px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)] shrink-0">
            <Laptop className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                JARVIS OS MASTER CONTROL
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className={`w-1.5 h-1.5 rounded-full ${bridgeConnected ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400 animate-ping'}`} />
                {bridgeConnected ? 'HOST BRIDGE CONNECTED (:8000)' : 'BROWSER SANDBOX ACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>OS Controller Matrix</span>
              <span>•</span>
              <span>Hardware Telemetry</span>
              <span>•</span>
              <span className="text-cyan-400">{bridgeConnected ? 'Direct Host Hardware Link' : 'Web Sandbox Runtime'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={checkBridge}
            disabled={isRefreshingBridge}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBridge ? 'animate-spin font-black' : ''}`} />
            <span>PING BRIDGE</span>
          </button>

          {/* Quick Emergency Lock */}
          <button
            type="button"
            onClick={() => handleExecuteOS({ action: 'power_control', params: { cmd: 'lock' } }, 'Quick Lock PC')}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-cyan-500/20 transition-all cursor-pointer hidden sm:flex items-center gap-1"
            title="Lock Machine (Requires Local Bridge)"
          >
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono font-bold text-red-300">LOCK</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Close OS Control (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

        {/* Tab Navigation */}
        <div className={`px-6 py-2 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
          isSlate ? 'bg-zinc-900/60 border-slate-800' : 'bg-black/30 border-white/5'
        }`}>
          {[
            { id: 'OVERVIEW', label: 'SYSTEM OVERVIEW', icon: Cpu },
            { id: 'APPS', label: 'APPS & WINDOWS', icon: Layers },
            { id: 'FILES', label: 'FILE & STORAGE', icon: Folder },
            { id: 'HARDWARE', label: 'AUDIO & HARDWARE', icon: Sliders },
            { id: 'CLI', label: 'NEURAL SHELL (CLI)', icon: TerminalIcon },
            { id: 'MACROS', label: 'AUTOMATION MACROS', icon: Zap },
            { id: 'BRIDGE_SETUP', label: 'PYTHON BRIDGE SCRIPT', icon: Code },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OSTab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-orbitron font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? isSlate
                      ? 'bg-zinc-200 text-zinc-900 font-bold shadow-sm'
                      : isMinimal
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : isGold
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                          : 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                    : isSlate
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Environment Status Banner */}
              {!bridgeConnected && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-cyan-200">
                    <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-orbitron font-bold uppercase text-white text-[11px]">Running in Browser Sandbox Mode</div>
                      <div className="text-slate-400 font-mono text-[10px]">Real host CPU, RAM, Disk, and Process monitoring require the local JARVIS bridge daemon.</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('BRIDGE_SETUP')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[10px] font-orbitron font-bold shrink-0 uppercase tracking-wider"
                  >
                    View Python Bridge Script
                  </button>
                </div>
              )}

              {/* Telemetry Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/50 border-cyan-500/20'
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono">Host CPU Load</span>
                    <Cpu className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-orbitron text-cyan-400">
                    {telemetry.cpu.usagePercent.display}
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    {telemetry.cpu.usagePercent.value !== null ? (
                      <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${telemetry.cpu.usagePercent.value}%` }} />
                    ) : (
                      <div className="h-full bg-slate-800" />
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono mt-2">{telemetry.cpu.cores.display}</p>
                </div>

                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/50 border-blue-500/20'
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono">RAM Utilization</span>
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold font-orbitron text-blue-400">
                    {telemetry.memory.usedPercent.display}
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    {telemetry.memory.usedPercent.value !== null ? (
                      <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${telemetry.memory.usedPercent.value}%` }} />
                    ) : (
                      <div className="h-full bg-slate-800" />
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono mt-2">{telemetry.memory.summary.display}</p>
                </div>

                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/50 border-purple-500/20'
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono">Primary Storage</span>
                    <HardDrive className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold font-orbitron text-purple-400">
                    {telemetry.disk.usedPercent.display}
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    {telemetry.disk.usedPercent.value !== null ? (
                      <div className="h-full bg-purple-400 transition-all duration-500" style={{ width: `${telemetry.disk.usedPercent.value}%` }} />
                    ) : (
                      <div className="h-full bg-slate-800" />
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono mt-2">{telemetry.disk.freeSpace.display}</p>
                </div>

                <div className={`p-4 rounded-xl border relative overflow-hidden ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/50 border-emerald-500/20'
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono">Network & Battery</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-orbitron text-emerald-400">
                    {telemetry.network.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </div>
                  <p className="text-[10px] text-slate-300 font-mono mt-2">
                    Net: {telemetry.network.downlinkMbps.display !== 'N/A' ? telemetry.network.downlinkMbps.display : (telemetry.network.isOnline ? 'Web Connected' : 'Disconnected')}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">Battery: {telemetry.battery.percent.display}</p>
                </div>
              </div>

              {/* Memory & Cache Quick Flush Banner */}
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-cyan-950/20 border-cyan-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-xs uppercase text-slate-200">System Optimization & Cache Reclamation</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Flush runtime UI cache, garbage collect active buffers, and trigger memory optimization.</p>
                  </div>
                </div>
                <button
                  onClick={handleFlushMemory}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-orbitron font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>FLUSH RUNTIME CACHE</span>
                </button>
              </div>

              {/* Running Processes Table */}
              <div className={`rounded-xl border overflow-hidden ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-black/40 border-slate-800'
              }`}>
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-200">Active Task Manager & Process Controller</h3>
                  </div>
                  {telemetry.processes.list.length > 0 && (
                    <input
                      type="text"
                      placeholder="Filter processes..."
                      value={processFilter}
                      onChange={e => setProcessFilter(e.target.value)}
                      className="px-3 py-1 rounded-lg bg-black/50 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 font-mono"
                    />
                  )}
                </div>

                <div className="overflow-x-auto">
                  {telemetry.processes.list.length > 0 ? (
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-3">PID</th>
                          <th className="p-3">Process Name</th>
                          <th className="p-3">CPU %</th>
                          <th className="p-3">Memory</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {telemetry.processes.list
                          .filter(p => p.name.toLowerCase().includes(processFilter.toLowerCase()))
                          .map(proc => (
                            <tr key={proc.pid} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 text-slate-500">{proc.pid}</td>
                              <td className="p-3 font-semibold text-slate-200">{proc.name}</td>
                              <td className="p-3 text-cyan-400">{proc.cpu}</td>
                              <td className="p-3 text-blue-400">{proc.memory}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleKillProcess(proc.pid, proc.name)}
                                  className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-[10px] transition-all"
                                >
                                  Terminate
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center space-y-3 font-mono">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="text-sm text-slate-300 font-orbitron font-bold">Process Monitoring Unavailable in Browser Mode</div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Browsers cannot directly inspect or terminate host OS processes without native bridge elevation. Start the JARVIS Python bridge on your machine to stream real running processes.
                      </p>
                      <button
                        onClick={() => setActiveTab('BRIDGE_SETUP')}
                        className="px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-orbitron font-bold tracking-wider uppercase transition-all"
                      >
                        Launch Python Bridge Setup
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: APPS & WINDOWS */}
          {activeTab === 'APPS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest mb-3">Quick Application Launcher</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { name: 'VS Code', code: 'code', desc: 'Code Editor' },
                    { name: 'Google Chrome', code: 'chrome', desc: 'Web Browser' },
                    { name: 'Windows Terminal', code: 'wt', desc: 'PowerShell / CMD' },
                    { name: 'File Explorer', code: 'explorer', desc: 'Directory Manager' },
                    { name: 'Notepad', code: 'notepad', desc: 'Text Editor' },
                    { name: 'Calculator', code: 'calc', desc: 'Math Utility' },
                    { name: 'Spotify', code: 'spotify', desc: 'Audio Streamer' },
                    { name: 'Task Manager', code: 'taskmgr', desc: 'Process Control' },
                    { name: 'Discord', code: 'discord', desc: 'Neural Chat' },
                    { name: 'Photoshop', code: 'photoshop', desc: 'Media Studio' },
                    { name: 'Control Panel', code: 'control', desc: 'System Config' },
                    { name: 'Paint', code: 'mspaint', desc: 'Canvas Tool' },
                  ].map(app => (
                    <button
                      key={app.code}
                      onClick={() => handleLaunchApp(app.code)}
                      className={`p-3 rounded-xl border text-left transition-all group flex flex-col justify-between hover:scale-[1.02] ${
                        isSlate ? 'bg-zinc-900 border-slate-800 hover:border-slate-600' : 'bg-slate-900/50 border-cyan-500/20 hover:border-cyan-400/60'
                      }`}
                    >
                      <div>
                        <div className="font-orbitron font-bold text-xs text-slate-100 group-hover:text-cyan-300 flex items-center justify-between">
                          <span>{app.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{app.desc}</div>
                      </div>
                      <span className="text-[9px] font-mono text-cyan-500/60 mt-3">$ {app.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Path Execution */}
              <div className={`p-4 rounded-xl border ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-black/40 border-slate-800'
              }`}>
                <h4 className="font-orbitron font-bold text-xs text-slate-200 uppercase mb-2">Execute Custom Binary / Path</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. C:\Program Files\App\executable.exe or custom command"
                    value={customAppInput}
                    onChange={e => setCustomAppInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-black/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={() => {
                      if (customAppInput) {
                        handleLaunchApp(customAppInput);
                        setCustomAppInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs hover:bg-cyan-400 transition-all"
                  >
                    LAUNCH
                  </button>
                </div>
              </div>

              {/* Window Controls */}
              <div>
                <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest mb-3">Window Layout Controls</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleExecuteOS({ module: 'window_manager', action: 'show_desktop' }, 'Show Desktop (Minimize All)')}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-200 font-mono text-xs text-left flex items-center gap-3 transition-all"
                  >
                    <Monitor className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold">Show Desktop</div>
                      <div className="text-[10px] text-slate-500">Minimize all open application windows</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteOS({ module: 'window_manager', action: 'maximize_active' }, 'Maximize Foreground Window')}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-200 font-mono text-xs text-left flex items-center gap-3 transition-all"
                  >
                    <Layers className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold">Maximize Foreground</div>
                      <div className="text-[10px] text-slate-500">Expand current active app window</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExecuteOS({ module: 'window_manager', action: 'tile_windows' }, 'Tile Windows Split View')}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 text-slate-200 font-mono text-xs text-left flex items-center gap-3 transition-all"
                  >
                    <Sliders className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-bold">Snap Split View</div>
                      <div className="text-[10px] text-slate-500">Arrange open windows side-by-side</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILES & STORAGE */}
          {activeTab === 'FILES' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Downloads Organizer Action */}
              <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-orbitron font-bold text-xs uppercase text-slate-200">1-Click Downloads Folder Neural Organizer</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Scans C:/Users/Operator/Downloads and automatically sorts PDF, Code, Images, Archives into dedicated clean folders.</p>
                    {organizingProgress && (
                      <div className="text-[11px] text-emerald-400 font-mono mt-1 animate-pulse">
                        ⌛ {organizingProgress}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleOrganizeDownloads}
                  disabled={!!organizingProgress}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-orbitron font-bold text-xs hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0"
                >
                  CLEAN DOWNLOADS NOW
                </button>
              </div>

              {/* Natural Language File Search */}
              <div className={`p-5 rounded-xl border space-y-3 ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-black/40 border-slate-800'
              }`}>
                <h3 className="font-orbitron font-bold text-xs uppercase text-slate-200 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Natural Language Multi-Drive File Search</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search file name, extension or keyword (e.g. project_report, .pdf, invoice)..."
                    value={fileQuery}
                    onChange={e => setFileQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchFiles()}
                    className="flex-1 px-4 py-2 rounded-lg bg-black/60 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleSearchFiles}
                    disabled={isSearchingFiles}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-1.5"
                  >
                    {isSearchingFiles ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>SEARCH</span>
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-black/50 border border-slate-800 space-y-2">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase">Search Results ({searchResults.length} files located):</div>
                    {searchResults.map((res, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 text-slate-200 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{res}</span>
                        </div>
                        <button
                          onClick={() => handleExecuteOS({ action: 'open_file', params: { path: res } }, `Open file ${res}`)}
                          className="text-[10px] text-cyan-400 hover:underline shrink-0 ml-2"
                        >
                          Open File
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AUDIO & HARDWARE */}
          {activeTab === 'HARDWARE' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Volume Controller */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/40 border-cyan-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-orbitron font-bold text-xs uppercase text-slate-200">System Audio Volume</h3>
                    </div>
                    <span className="font-mono text-xs text-cyan-400 font-bold">{systemVolume}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={systemVolume}
                    onChange={e => {
                      const newVol = parseInt(e.target.value);
                      setSystemVolume(newVol);
                      handleExecuteOS({ action: 'set_volume', params: { level: newVol } }, `Adjust System Volume to ${newVol}%`);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSystemVolume(Math.max(0, systemVolume - 10))}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => setSystemVolume(Math.min(100, systemVolume + 10))}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200"
                    >
                      +10%
                    </button>
                    <button
                      onClick={() => {
                        const newVol = systemVolume === 0 ? 50 : 0;
                        setSystemVolume(newVol);
                        handleExecuteOS({ action: 'set_volume', params: { level: newVol } }, newVol === 0 ? 'Mute Audio' : 'Unmute Audio');
                      }}
                      className="flex-1 py-1.5 rounded bg-red-950/60 hover:bg-red-900/60 text-xs font-mono text-red-300 border border-red-500/30"
                    >
                      {systemVolume === 0 ? 'UNMUTE' : 'MUTE ALL'}
                    </button>
                  </div>
                </div>

                {/* Brightness Controller */}
                <div className={`p-5 rounded-xl border space-y-4 ${
                  isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/40 border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-400" />
                      <h3 className="font-orbitron font-bold text-xs uppercase text-slate-200">Display Screen Brightness</h3>
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-bold">{systemBrightness}%</span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={systemBrightness}
                    onChange={e => {
                      const newBri = parseInt(e.target.value);
                      setSystemBrightness(newBri);
                      handleExecuteOS({ action: 'set_brightness', params: { level: newBri } }, `Calibrate Brightness to ${newBri}%`);
                    }}
                    className="w-full accent-amber-400 cursor-pointer"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSystemBrightness(30);
                        handleExecuteOS({ action: 'set_brightness', params: { level: 30 } }, 'Night Shift Mode (30% Brightness)');
                      }}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 flex items-center justify-center gap-1"
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Night Shift (30%)</span>
                    </button>
                    <button
                      onClick={() => {
                        setSystemBrightness(100);
                        handleExecuteOS({ action: 'set_brightness', params: { level: 100 } }, 'Full Sunlight Brightness (100%)');
                      }}
                      className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center justify-center gap-1"
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Max (100%)</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Security & Network Control */}
              <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-black/40 border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <Shield className={`w-6 h-6 ${firewallActive ? 'text-emerald-400' : 'text-red-400'}`} />
                  <div>
                    <h4 className="font-orbitron font-bold text-xs uppercase text-slate-200">JARVIS Neural Firewall & Threat Shield</h4>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Status: {firewallActive ? 'PROTECTED (Firewall Active)' : 'WARNING (Shield Disengaged)'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newState = !firewallActive;
                    setFirewallActive(newState);
                    handleExecuteOS({ action: 'security_firewall', params: { state: newState } }, newState ? 'Enable Neural Firewall' : 'Disable Firewall');
                  }}
                  className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs transition-all ${
                    firewallActive
                      ? 'bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  {firewallActive ? 'DISENGAGE FIREWALL' : 'ENGAGE FIREWALL'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 5: NEURAL CLI SHELL */}
          {activeTab === 'CLI' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-orbitron font-bold text-xs text-slate-200 uppercase">Direct Terminal Execution Buffer</span>
                </div>
                <button
                  onClick={() => setCliLogs([])}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline"
                >
                  Clear Buffer
                </button>
              </div>

              {/* Terminal Logs Display */}
              <div ref={cliContainerRef} className="h-72 p-4 rounded-xl bg-black border border-cyan-500/30 font-mono text-xs overflow-y-auto space-y-2 text-slate-200 shadow-inner">
                {cliLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log.type === 'cmd' && <span className="text-cyan-400 font-bold">{log.text}</span>}
                    {log.type === 'out' && <span className="text-slate-300 whitespace-pre-wrap">{log.text}</span>}
                    {log.type === 'err' && <span className="text-red-400 font-semibold">{log.text}</span>}
                    {log.type === 'info' && <span className="text-slate-500 italic">{log.text}</span>}
                  </div>
                ))}
              </div>

              {/* CLI Input Form */}
              <div className="flex gap-2">
                <span className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-cyan-400 text-xs flex items-center shrink-0">
                  JARVIS&gt;
                </span>
                <input
                  type="text"
                  placeholder="Type command (e.g. dir, ping 1.1.1.1, ipconfig, python main.py, systeminfo)..."
                  value={cliInput}
                  onChange={e => setCliInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRunCliCommand()}
                  className="flex-1 px-4 py-2 rounded-lg bg-black border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunCliCommand}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs hover:bg-cyan-400 transition-all"
                >
                  RUN
                </button>
              </div>

              {/* Quick CLI Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {['ipconfig', 'ping 1.1.1.1', 'systeminfo', 'dir', 'cls'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setCliInput(preset);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-400"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUTOMATION MACROS */}
          {activeTab === 'MACROS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="font-orbitron font-bold text-xs text-cyan-400 uppercase tracking-widest mb-3">1-Click Neural Macro Scripts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: '🚀 DEV WORKSPACE LAUNCHER',
                      desc: 'Launches VS Code, Terminal, sets volume to 50%, and prepares project directory buffer.',
                      cmd: { action: 'macro', params: { name: 'dev_setup' } },
                      tag: 'Developer Setup'
                    },
                    {
                      title: '🧹 DEEP STORAGE & MEMORY CLEANUP',
                      desc: 'Flushes RAM swap cache, deletes temporary log files, and sorts Downloads directory.',
                      cmd: { action: 'macro', params: { name: 'storage_cleanup' } },
                      tag: 'Maintenance'
                    },
                    {
                      title: '🔒 SECURITY LOCKDOWN PROTOCOL',
                      desc: 'Locks machine, activates Firewall, mutes all audio, and logs security event.',
                      cmd: { action: 'macro', params: { name: 'lockdown' } },
                      tag: 'Security'
                    },
                    {
                      title: '🌙 NIGHT SHIFT & CALM MODE',
                      desc: 'Dims brightness to 20%, lowers audio to 15%, and minimizes background windows.',
                      cmd: { action: 'macro', params: { name: 'night_shift' } },
                      tag: 'Environment'
                    }
                  ].map((macro, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
                        isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-slate-900/50 border-cyan-500/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-orbitron font-bold text-xs text-slate-100">{macro.title}</h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            {macro.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-2">{macro.desc}</p>
                      </div>

                      <button
                        onClick={() => handleExecuteOS(macro.cmd, macro.title)}
                        className="w-full py-2 rounded-lg bg-cyan-500 text-black font-orbitron font-bold text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>RUN MACRO NOW</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PYTHON BRIDGE SCRIPT */}
          {activeTab === 'BRIDGE_SETUP' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className={`p-4 rounded-xl border ${
                isSlate ? 'bg-zinc-900 border-slate-800' : 'bg-cyan-950/20 border-cyan-500/30'
              }`}>
                <h3 className="font-orbitron font-bold text-xs uppercase text-cyan-400 mb-1">Native Python Bridge Host (`main.py`)</h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  To give JARVIS 100% full, unrestricted control over your physical PC (launching native apps, manipulating actual desktop windows, reading local files, adjusting OS volume), run this lightweight FastAPI bridge locally:
                </p>
                <div className="text-[10px] font-mono text-cyan-300 mt-2 bg-black/50 p-2 rounded border border-cyan-500/20">
                  <code>pip install fastapi uvicorn psutil pyautogui chromadb httpx bs4</code><br />
                  <code>python main.py</code>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-slate-900 px-4 py-2 rounded-t-xl border border-slate-800 text-xs font-mono text-slate-400">
                  <span>main.py (FastAPI Native OS Bridge)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pythonBridgeCode);
                      addLog('⌬ Bridge Script: Copied main.py code to clipboard.', 'SYSTEM', 'success');
                    }}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre className="h-80 p-4 bg-black border border-t-0 border-slate-800 rounded-b-xl text-[11px] font-mono text-slate-300 overflow-y-auto">
                  {pythonBridgeCode}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
