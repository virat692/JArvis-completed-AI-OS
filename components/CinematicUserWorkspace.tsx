import React, { useState, useRef, useEffect } from 'react';
import { 
  JarvisStatus, 
  LogEntry, 
  MemoryEntry, 
  ChatSession, 
  JarvisMode 
} from '../types';
import HudCore from './HudCore';
import VisionPanel from './VisionPanel';
import WeatherPanel from './WeatherPanel';
import { NeuralCanvas } from './NeuralCanvas';
import Waveform from './Waveform';
import MemoryPanel from './MemoryPanel';
import ChatHistoryPanel from './ChatHistoryPanel';
import { osBridge } from '../services/osBridge';
import { telemetryService, DeviceTelemetryState } from '../services/telemetryService';
import { neuralWorkspaceManager } from '../services/neuralWorkspaceManager';
import { 
  playTickSound, 
  playWhooshSound, 
  playDigitalPingSound, 
  playListeningHumSound, 
  playSpeakingPulseSound 
} from '../services/soundEffects';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Laptop, 
  Layout,
  Database, 
  Settings, 
  Code2, 
  Sparkles, 
  Eye, 
  X, 
  Send, 
  BrainCircuit, 
  History as HistoryIcon,
  Zap,
  Activity,
  Cpu,
  Clock,
  Terminal as TerminalIcon,
  Compass,
  LayoutGrid,
  Brain,
  Bot,
  ListTodo
} from 'lucide-react';

interface CinematicUserWorkspaceProps {
  status: JarvisStatus;
  micLevel: number;
  theme: 'cyber' | 'slate' | 'minimal' | 'gold';
  logs: LogEntry[];
  onSendMessage: (message: string) => void;
  onInterrupt?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
  isOpticActive: boolean;
  isScreenActive: boolean;
  isOSConsoleOpen: boolean;
  isMemoryVisible: boolean;
  isHistoryVisible: boolean;
  isTaskPanelOpen?: boolean;
  setIsTaskPanelOpen?: (open: boolean) => void;
  handleToggleOptic: () => void;
  handleToggleScreenPerception: () => void;
  onInstantOCR?: () => void;
  onUploadImage?: (file: File) => void;
  setIsOSConsoleOpen: (open: boolean) => void;
  setIsMemoryVisible: (visible: boolean) => void;
  setIsHistoryVisible: (visible: boolean) => void;
  isLive: boolean;
  handleStartLive: () => void;
  isMicMuted: boolean;
  setIsMicMuted: (muted: boolean) => void;
  isJarvisMuted: boolean;
  setIsJarvisMuted: (muted: boolean) => void;
  isSettingsOpen?: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  uiMode?: 'user' | 'developer';
  setUiMode: (mode: 'user' | 'developer') => void;
  activeProvider: string;
  openRouterModel: string;
  memories: MemoryEntry[];
  personality: string;
  userIdentity: string;
  setMemories: React.Dispatch<React.SetStateAction<MemoryEntry[]>>;
  setPersonality: (p: string) => void;
  setUserIdentity: (u: string) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  handleNewChat: () => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  onTriggerBoot?: () => void;
  isWeatherFullOpen?: boolean;
  setIsWeatherFullOpen?: (open: boolean) => void;
}

export const CinematicUserWorkspace: React.FC<CinematicUserWorkspaceProps> = ({
  status,
  micLevel,
  theme,
  logs,
  onSendMessage,
  onInterrupt,
  videoRef,
  screenVideoRef,
  isOpticActive,
  isScreenActive,
  isOSConsoleOpen,
  isMemoryVisible,
  isHistoryVisible,
  isTaskPanelOpen = false,
  setIsTaskPanelOpen,
  handleToggleOptic,
  handleToggleScreenPerception,
  onInstantOCR,
  onUploadImage,
  setIsOSConsoleOpen,
  setIsMemoryVisible,
  isWeatherFullOpen,
  setIsWeatherFullOpen,
  setIsHistoryVisible,
  isLive,
  handleStartLive,
  isMicMuted,
  setIsMicMuted,
  isJarvisMuted,
  setIsJarvisMuted,
  isSettingsOpen = false,
  setIsSettingsOpen,
  uiMode = 'user',
  setUiMode,
  activeProvider,
  openRouterModel,
  memories,
  personality,
  userIdentity,
  setMemories,
  setPersonality,
  setUserIdentity,
  sessions,
  activeSessionId,
  setActiveSessionId,
  setLogs,
  handleNewChat,
  setSessions,
  onTriggerBoot
}) => {
  const [inputText, setInputText] = useState('');
  const [time, setTime] = useState(new Date());
  const [deviceTelemetry, setDeviceTelemetry] = useState<DeviceTelemetryState>(telemetryService.getTelemetry());
  const [hasBooted, setHasBooted] = useState(false);
  const [bootPower, setBootPower] = useState(1);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to real hardware / sandbox telemetry
  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((updated) => {
      setDeviceTelemetry(updated);
    });
    return () => unsubscribe();
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRebootDiagnostics = () => {
    playTickSound();
    if (onTriggerBoot) {
      onTriggerBoot();
      return;
    }
    if (!setLogs) return;
    setBootPower(0.1);
    const bootSteps = [
      { text: '⚡ Initializing Neural Core Engine...', delay: 200, power: 0.35 },
      { text: '💾 Synchronizing Memory Cluster...', delay: 600, power: 0.60 },
      { text: '🎤 Voice DSP & Optic Perception Ready...', delay: 1000, power: 0.80 },
      { text: '◈ Diagnostics Nominal. Welcome Back, Virat.', delay: 1400, power: 1.0 }
    ];

    bootSteps.forEach(step => {
      setTimeout(() => {
        setBootPower(step.power);
        setLogs(prev => [
          ...prev,
          {
            id: `reboot-${Date.now()}-${Math.random()}`,
            text: step.text,
            sender: step.text.startsWith('◈') ? 'JARVIS' : 'SYSTEM',
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'info'
          }
        ]);
      }, step.delay);
    });
  };

  // Cinematic Boot Sequence with Dynamic Power-Up Glow
  useEffect(() => {
    if (hasBooted || !setLogs) return;
    setHasBooted(true);
    setBootPower(0.15);

    const bootSteps = [
      { text: '⚡ Initializing Neural Core Engine...', delay: 400, power: 0.35 },
      { text: '💾 Synchronizing Memory Cluster...', delay: 900, power: 0.58 },
      { text: '🎤 Voice Engine & Optic Perception Online...', delay: 1400, power: 0.78 },
      { text: '🖥 OS Control Master Bridge Connected...', delay: 1900, power: 0.90 },
      { text: '◈ Welcome Back, Virat. All Systems Operational.', delay: 2400, power: 1.0 }
    ];

    bootSteps.forEach(step => {
      setTimeout(() => {
        setBootPower(step.power);
        setLogs(prev => [
          ...prev,
          {
            id: `boot-${Date.now()}-${Math.random()}`,
            text: step.text,
            sender: step.text.startsWith('◈') ? 'JARVIS' : 'SYSTEM',
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'info'
          }
        ]);
      }, step.delay);
    });
  }, [hasBooted, setLogs]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    if (setLogs) {
      const qLower = query.toLowerCase();
      if (qLower.includes('search') || qLower.includes('google') || qLower.includes('who') || qLower.includes('what') || qLower.includes('find')) {
        setLogs(prev => [
          ...prev,
          {
            id: `web-${Date.now()}`,
            text: '🌐 Initiating Web Search... • Querying Knowledge Base • Result Cached ✓',
            sender: 'SYSTEM',
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'info'
          }
        ]);
      } else if (qLower.includes('memory') || qLower.includes('remember') || qLower.includes('history') || qLower.includes('recall')) {
        setLogs(prev => [
          ...prev,
          {
            id: `mem-${Date.now()}`,
            text: '💾 Retrieving Memory... • Neural Archive Synced • Memory Found ✓',
            sender: 'SYSTEM',
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'info'
          }
        ]);
      } else if (qLower.includes('open') || qLower.includes('launch') || qLower.includes('app') || qLower.includes('code') || qLower.includes('chrome') || qLower.includes('run')) {
        setLogs(prev => [
          ...prev,
          {
            id: `os-${Date.now()}`,
            text: '⚡ Executing OS Command... • Master Bridge Link Engaged • Process Ready ✓',
            sender: 'SYSTEM',
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'info'
          }
        ]);
      }
    }

    onSendMessage(query);
    setInputText('');
  };

  return (
    <div className="relative w-screen h-screen flex flex-col justify-between overflow-hidden bg-black text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Living Background Neural Canvas & Spatial Field */}
      <NeuralCanvas status={status} theme={theme} />

      {/* Ambient Radial Lighting Overlays - Subtle dark blue central gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,25,55,0.4)_0%,rgba(1,8,22,0.8)_50%,rgba(0,0,0,0.98)_100%)] pointer-events-none" />

      {/* 2. Top Minimalist Holographic Header Bar (Completely Transparent) */}
      <header className="h-11 flex items-center justify-between px-6 z-50 shrink-0 bg-transparent border-b border-transparent shadow-none transition-all duration-500">
        <div className="flex items-center gap-5">
          <div 
            onClick={handleRebootDiagnostics}
            className="flex items-center gap-2.5 group cursor-pointer hover:opacity-95 transition-all"
            title="Click to Trigger Cinematic Diagnostic Boot Sequence"
          >
            {/* Miniature JARVIS Holographic Spherical Core Orb */}
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              {/* Outer spinning dashed ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/70 animate-[spin_10s_linear_infinite]" />
              {/* Inner counter-rotating dual arc */}
              <div className="absolute inset-[2px] rounded-full border-2 border-transparent border-t-cyan-300 border-b-cyan-400/90 animate-[spin_5s_linear_infinite_reverse]" />
              {/* Ambient core glow halo */}
              <div className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400/50 blur-sm animate-pulse" />
              {/* Core 3D Holographic Spherical Orb */}
              <div className="w-3.5 h-3.5 rounded-full bg-[radial-gradient(circle_at_30%_30%,#e0f2fe_0%,#00f2ff_40%,#0284c7_85%,#031937_100%)] shadow-[0_0_12px_#00f2ff,0_0_20px_rgba(0,242,255,0.8)]" />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-black text-xs sm:text-sm tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">
                  JARVIS<span className="text-cyan-400">_</span>AI
                </span>
                <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1 py-0.2 rounded tracking-widest shadow-[0_0_6px_rgba(0,242,255,0.2)]">
                  v11.2
                </span>
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[8px] font-mono tracking-[0.16em] text-cyan-300/90 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f2ff]" />
                <span>PRIMARY COGNITIVE CORE</span>
                <span className="text-cyan-500/60 font-normal">•</span>
                <span className="text-emerald-400 font-extrabold tracking-widest">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-cyan-500/20" />

          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5 font-orbitron font-extrabold text-sm sm:text-base tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider uppercase mr-0.5">TIME:</span>
              <span>{(() => {
                let h = time.getHours() % 12 || 12;
                const m = time.getMinutes().toString().padStart(2, '0');
                const s = time.getSeconds().toString().padStart(2, '0');
                return `${h.toString().padStart(2, '0')}:${m}:${s}`;
              })()}</span>
            </div>
          </div>
        </div>

        {/* Top Center Holographic AI System Console Trigger */}
        <div className="z-50 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playDigitalPingSound();
              setUiMode('developer');
              if (setLogs) {
                setLogs(prev => [
                  { id: `dev-${Date.now()}`, text: '🛠 Operational Mode: JARVIS SYSTEM CONSOLE ACTIVE', sender: 'SYSTEM', timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: 'info' },
                  ...prev
                ]);
              }
            }}
            className="group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#030d1a]/90 via-[#07152b]/95 to-[#0b1b36]/90 border border-cyan-500/35 hover:border-amber-400/80 shadow-[0_0_20px_rgba(0,242,255,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.35),0_0_12px_rgba(0,242,255,0.25)] backdrop-blur-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            title="Switch to JARVIS System Console & Diagnostic Telemetry"
          >
            {/* Holographic Glowing Code Icon Box */}
            <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:text-amber-300 group-hover:border-amber-400/80 group-hover:bg-amber-500/25 transition-all shadow-[0_0_8px_rgba(245,158,11,0.25)] shrink-0">
              <Code2 className="w-3 h-3 stroke-[2.5]" />
            </div>

            {/* Typography Label */}
            <span className="font-orbitron font-extrabold text-[10px] sm:text-[11px] tracking-[0.16em] text-slate-200 group-hover:text-amber-200 transition-colors uppercase whitespace-nowrap drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]">
              SYSTEM CONSOLE
            </span>

            {/* High-Tech Pulse Indicator */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-cyan-500/30 group-hover:border-amber-500/50 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 group-hover:bg-amber-400"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 group-hover:bg-amber-400 shadow-[0_0_6px_#00f2ff]"></span>
              </span>
              <span className="font-mono font-bold text-[8px] text-cyan-300/80 group-hover:text-amber-300 tracking-wider uppercase">
                ACTIVE
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 3. Main Center Workspace Stage (Strictly Centered & Locked) */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4 z-20 overflow-hidden min-h-0">
        
        {/* Living Holographic AI Reactor Core (Fixed Stage Container) */}
        <div className="relative w-full max-w-5xl flex-1 flex flex-col items-center justify-center my-auto min-h-0">
          <div className="flex flex-col items-center justify-center">
            <HudCore status={status} micLevel={micLevel} theme={theme} isUserMode={true} bootPower={bootPower} onInterrupt={onInterrupt} />
          </div>
        </div>

        {/* 5. Contextual Vision Panel & Atmospheric Weather Module (Top Right - Weather directly below Optic Perception) */}
        <div className="absolute top-4 right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Optic Perception Panel */}
          {(isOpticActive || isScreenActive) ? (
            <VisionPanel
              videoRef={videoRef}
              screenVideoRef={screenVideoRef}
              isScreenActive={isScreenActive}
              isOpticActive={isOpticActive}
              status={status}
              theme={theme}
              onInstantOCR={onInstantOCR}
              onUploadImage={onUploadImage}
              onToggleScreenPerception={handleToggleScreenPerception}
            />
          ) : (
            <button
              onClick={handleToggleOptic}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 border border-cyan-500/30 text-cyan-400 text-[10px] font-orbitron font-bold backdrop-blur-xl hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>OPTIC VISION: STANDBY</span>
            </button>
          )}

          {/* Floating Atmospheric Weather Badge (Directly below Optic Perception) */}
          <WeatherPanel 
            theme={theme} 
            isOpenFullModal={isWeatherFullOpen}
            onToggleFullModal={setIsWeatherFullOpen}
            onAskJarvisWeather={onSendMessage}
            status={status}
            isLive={isLive}
            micLevel={micLevel}
            onSendMessage={onSendMessage}
            handleStartLive={handleStartLive}
          />
        </div>

        {/* 6. SEAMLESS FLOATING CHATTER & LIVE LOG FEED (Left Side - Shifted 30-40px inward, 100% Transparent) */}
        <div className="hidden lg:flex flex-col absolute left-12 xl:left-16 top-20 bottom-28 w-80 xl:w-[420px] pointer-events-auto z-30 overflow-hidden select-text bg-transparent">
          {/* Stream Header tag - borderless, shadowless & completely transparent */}
          <div className="text-xs font-orbitron font-extrabold tracking-[0.2em] text-cyan-400 uppercase mb-5 pb-1 flex items-center gap-2 bg-transparent shrink-0">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>LIVE NEURAL CONVERSATION</span>
          </div>

          <div
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none bg-transparent"
          >
            {(() => {
              // Strictly filter logs: only show valid conversational messages (OPERATOR/JARVIS) or real activity events, never empty or spammy system noise
              const conversationLogs = logs.filter((log) => {
                if (!log || typeof log.message !== 'string') return false;
                const trimmed = log.message.trim();
                if (!trimmed) return false;

                // User & AI dialogues are always rendered
                if (log.source === 'OPERATOR' || log.source === 'JARVIS') {
                  return true;
                }

                // Filter out low-level internal sensor, uplink, and background telemetry logs
                const isInternalSystemNoise = 
                  trimmed.startsWith('⌬ Neural Link:') ||
                  trimmed.startsWith('⌬ Mic Sense:') ||
                  trimmed.startsWith('⌬ Memory Cluster:') ||
                  trimmed.startsWith('⌬ Neural Clock:') ||
                  trimmed.startsWith('⌬ Mode manually switched') ||
                  trimmed.startsWith('⌬ GUI Autonomy:') ||
                  trimmed.includes('Initiating secure uplink') ||
                  trimmed.includes('Accessing hardware sensors') ||
                  trimmed.includes('Speech signal detected') ||
                  trimmed.includes('Sensors online') ||
                  trimmed.includes('Real device observation') ||
                  trimmed.toLowerCase().includes('keepalive');

                if (isInternalSystemNoise) {
                  return false;
                }

                // Show only explicit meaningful system alerts/activities with real content
                return log.type === 'error' || log.type === 'warning' || trimmed.startsWith('⚡') || trimmed.startsWith('✓') || trimmed.startsWith('📋');
              });

              if (conversationLogs.length === 0) {
                return (
                  <div className="text-xs font-mono text-cyan-400/60 font-semibold italic">
                    Neural link active. Speak or command JARVIS to begin...
                  </div>
                );
              }

              return conversationLogs.slice(-18).map((log, idx, arr) => {
                const isOperator = log.source === 'OPERATOR';
                const isJarvis = log.source === 'JARVIS';
                
                // Dynamic Opacity calculation (most recent = opacity-100, older ones fade out smoothly)
                const revIndex = arr.length - 1 - idx;
                let opacityClass = 'opacity-100';
                if (revIndex === 0) opacityClass = 'opacity-100 font-extrabold';
                else if (revIndex <= 2) opacityClass = 'opacity-90 font-bold';
                else if (revIndex <= 5) opacityClass = 'opacity-75 font-semibold';
                else if (revIndex <= 8) opacityClass = 'opacity-55 font-medium';
                else if (revIndex <= 12) opacityClass = 'opacity-35 font-normal text-xs';
                else opacityClass = 'opacity-20 font-normal text-xs';

                return (
                  <div
                    key={log.id}
                    className={`flex flex-col gap-1 transition-all duration-300 animate-in fade-in slide-in-from-left-4 ${
                      revIndex === 0
                        ? 'border-l-2 border-cyan-400 pl-3 py-1 bg-transparent opacity-100 font-extrabold'
                        : `bg-transparent ${opacityClass}`
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider">
                      <span
                        className={`font-black uppercase ${
                          isOperator
                            ? 'text-cyan-300'
                            : isJarvis
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isOperator ? '◆ OPERATOR' : isJarvis ? '◈ JARVIS' : '⌬ ACTIVITY'}
                      </span>
                      <span className="text-slate-400 font-bold text-[10px]">
                        {typeof log.timestamp === 'number'
                          ? new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : log.timestamp}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-snug font-sans bg-transparent ${
                        revIndex === 0
                          ? 'text-cyan-50 font-black text-[14.5px] drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]'
                          : isOperator
                          ? 'text-cyan-100 font-extrabold'
                          : isJarvis
                          ? 'text-white font-extrabold'
                          : 'text-amber-200 font-bold text-xs font-mono'
                      }`}
                    >
                      {log.message}
                    </p>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* OS Automation Control HUD */}
        {isOSConsoleOpen && (
          <div className="absolute top-6 left-8 w-[92vw] max-w-[680px] sm:w-[580px] lg:w-[680px] z-40 animate-in slide-in-from-left duration-500">
            <div className="p-5 bg-black/90 border border-cyan-500/40 rounded-3xl backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,255,0.25)] relative max-h-[78vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-orbitron font-extrabold text-cyan-300 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400 animate-pulse" /> PC OS AUTOMATION HUD
                </span>
                <button
                  onClick={() => setIsOSConsoleOpen(false)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-mono text-slate-400 mb-3 leading-relaxed">
                Direct PC automation link engaged. Command native applications and query desktop hardware seamlessly.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    osBridge.execute({ action: 'open_app', params: { name: 'Code.exe' } });
                  }}
                  className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 hover:border-cyan-400 transition-all text-left font-bold"
                >
                  🚀 Open VS Code
                </button>
                <button
                  onClick={() => {
                    osBridge.execute({ action: 'open_app', params: { name: 'chrome.exe' } });
                  }}
                  className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-mono hover:bg-blue-500/20 hover:border-blue-400 transition-all text-left font-bold"
                >
                  🌐 Launch Chrome
                </button>
                <button
                  onClick={() => {
                    osBridge.execute({ action: 'system_stats' });
                  }}
                  className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-mono hover:bg-purple-500/20 hover:border-purple-400 transition-all text-left font-bold"
                >
                  📊 Analyze Hardware
                </button>
                <button
                  onClick={() => {
                    osBridge.execute({ action: 'screenshot' });
                  }}
                  className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono hover:bg-amber-500/20 hover:border-amber-400 transition-all text-left font-bold"
                >
                  📸 Capture Screen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memory Cluster Floating Card */}
        {isMemoryVisible && (
          <div className="absolute top-4 bottom-28 left-4 sm:left-8 w-[92vw] max-w-[680px] sm:w-[580px] lg:w-[680px] max-h-[calc(100vh-140px)] z-50 animate-in fade-in slide-in-from-left duration-300 flex flex-col">
            <div className="h-full bg-[#030914]/95 border border-cyan-500/50 rounded-3xl backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,255,0.3)] p-4 relative overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2 px-2 shrink-0">
                <span className="text-xs font-orbitron font-extrabold text-cyan-300 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-cyan-400" /> NEURAL MEMORY CLUSTER
                </span>
                <button
                  onClick={() => setIsMemoryVisible(false)}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MemoryPanel
                  memories={memories}
                  personality={personality}
                  userIdentity={userIdentity}
                  onAddMemory={(c, cat, type) =>
                    setMemories((p) => [
                      {
                        id: Math.random().toString(),
                        content: c,
                        category: cat,
                        timestamp: Date.now(),
                        type: type || 'long_term',
                      },
                      ...p,
                    ])
                  }
                  onDeleteMemory={(id) => setMemories((p) => p.filter((m) => m.id !== id))}
                  onUpdatePersonality={setPersonality}
                  onUpdateIdentity={setUserIdentity}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}

        {/* Archives History Floating Card */}
        {isHistoryVisible && (
          <div className="absolute top-4 bottom-28 right-4 sm:right-8 w-[92vw] max-w-[680px] sm:w-[580px] lg:w-[680px] max-h-[calc(100vh-140px)] z-50 animate-in fade-in slide-in-from-right duration-300 flex flex-col">
            <div className="h-full bg-[#030914]/95 border border-cyan-500/50 rounded-3xl backdrop-blur-2xl shadow-[0_0_40px_rgba(0,242,255,0.3)] p-3 relative overflow-hidden flex flex-col min-h-0">
              <ChatHistoryPanel
                isVisible={true}
                activeSessionId={activeSessionId}
                sessions={sessions}
                activeLogs={logs}
                theme={theme}
                onClose={() => setIsHistoryVisible(false)}
                onSelectSession={(id) => {
                  setActiveSessionId(id);
                  const session = sessions.find((s) => s.session_id === id);
                  if (session && session.logs) setLogs(session.logs);
                }}
                onNewChat={() => {
                  const newId = `s_${Math.random().toString(36).substr(2, 9)}`;
                  const newSession: ChatSession = {
                    session_id: newId,
                    title: `Neural Session #${sessions.length + 1}`,
                    timestamp_created: Date.now(),
                    timestamp_last_message: Date.now(),
                    last_message_preview: 'Session initialized.',
                    mode: 'CHILL',
                    model: 'gemini-3.6-flash',
                    messageCount: 0,
                    memorySaved: false,
                    logs: [],
                  };
                  setSessions((prev) => [newSession, ...prev]);
                  setActiveSessionId(newId);
                  handleNewChat();
                }}
                onTogglePin={(id) => {
                  setSessions((prev) =>
                    prev.map((s) => (s.session_id === id ? { ...s, isPinned: !s.isPinned } : s))
                  );
                }}
                onToggleFavorite={(id) => {
                  setSessions((prev) =>
                    prev.map((s) => (s.session_id === id ? { ...s, isFavorite: !s.isFavorite } : s))
                  );
                }}
                onDeleteSession={(id) => {
                  if (sessions.length <= 1) return;
                  setSessions((prev) => prev.filter((s) => s.session_id !== id));
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* 6. Integrated Floating Holographic Bottom Console (Chat Box + Voice Core Dock - Hidden when Weather Modal is Open) */}
      {!isWeatherFullOpen && (
        <footer className="flex flex-col items-center gap-2 z-50 shrink-0 pb-3 px-6 bg-transparent pointer-events-none">
        
        {/* Floating Holographic Capsule Input Bar (Positioned directly above Voice Core dock) */}
        <div className="w-full max-w-lg pointer-events-auto">
          <form
            onSubmit={handleSend}
            className="w-full relative flex items-center gap-2.5 py-1 px-4 rounded-full bg-transparent border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,242,255,0.12)] focus-within:border-cyan-400 focus-within:bg-cyan-500/20 focus-within:shadow-[0_0_30px_rgba(0,242,255,0.25)] transition-all duration-300"
          >
            <div className="flex items-center gap-2 pr-2 border-r border-cyan-500/20">
              <Waveform
                isActive={status === JarvisStatus.SPEAKING || status === JarvisStatus.LISTENING}
                color="#00f2ff"
              />
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                status === JarvisStatus.LISTENING
                  ? 'Listening to your voice...'
                  : 'Awaiting Neural Command...'
              }
              className="flex-1 bg-transparent text-slate-100 placeholder:text-cyan-300/40 text-xs sm:text-sm focus:outline-none font-sans tracking-wide py-1"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center -mr-2 shrink-0 ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black shadow-[0_0_20px_rgba(0,242,255,0.9)] border border-cyan-200/90 ring-2 ring-cyan-400/30 cursor-pointer hover:scale-110 hover:-translate-y-0.5 active:scale-95'
                  : 'bg-transparent text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-md'
              }`}
              title="Send Command"
            >
              <Send className="w-3.5 h-3.5 font-black" />
            </button>
          </form>
        </div>

        {/* Floating Translucent Dock Bar (100% Transparent Glass Pill) */}
        <div className="relative pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2 rounded-full bg-transparent border-none backdrop-blur-md shadow-[0_0_20px_rgba(0,242,255,0.08)] transition-all duration-300 group">

          {/* Main Neural Voice Action Button */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              Voice Core Pipeline
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={handleStartLive}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full font-orbitron font-extrabold text-[10px] sm:text-[11px] uppercase transition-all duration-300 cursor-pointer overflow-hidden border shadow-md active:scale-95 ${
                isLive
                  ? 'bg-cyan-950/80 text-cyan-200 border-cyan-400/80 shadow-[0_0_10px_rgba(0,242,255,0.35)] font-black ring-1 ring-cyan-400/40'
                  : 'bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-indigo-950/80 text-cyan-300 border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(0,242,255,0.25)]'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 shrink-0 ${isLive ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'}`} />
              <span className="flex items-center gap-1">
                <span>VOICE CORE</span>
                <span className={`text-[8px] font-mono font-black ${isLive ? 'text-cyan-300' : 'text-cyan-400/80'}`}>
                  [{isLive ? 'ACTIVE' : 'READY'}]
                </span>
              </span>
            </button>
          </div>

          <div className="h-4 w-px bg-cyan-500/25" />

          {/* Mic Sense Mute Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              {isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => setIsMicMuted(!isMicMuted)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                isMicMuted
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/30'
                  : 'bg-slate-900/90 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)]'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4 stroke-[2.2]" /> : <Mic className="w-4 h-4 stroke-[2]" />}
            </button>
          </div>

          {/* JARVIS Voice Mute Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              {isJarvisMuted ? 'Unmute JARVIS Audio' : 'Mute JARVIS Audio'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => setIsJarvisMuted(!isJarvisMuted)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                isJarvisMuted
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)] ring-1 ring-rose-400/30'
                  : 'bg-slate-900/90 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)]'
              }`}
            >
              {isJarvisMuted ? <VolumeX className="w-4 h-4 stroke-[2.2]" /> : <Volume2 className="w-4 h-4 stroke-[2]" />}
            </button>
          </div>

          {/* Camera Optic Perception Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              {isOpticActive ? 'Optic Sensors Active' : 'Optic Sensors Standby'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={handleToggleOptic}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                isOpticActive
                  ? 'bg-blue-950/80 border-blue-400/80 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/30'
                  : 'bg-slate-900/90 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)]'
              }`}
            >
              <Monitor className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Screen Perception / Screen Vision Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              {isScreenActive ? 'Screen Perception Active' : 'Screen Perception Standby'}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => {
                playTickSound();
                handleToggleScreenPerception();
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                isScreenActive
                  ? 'bg-purple-950/80 border-purple-400/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.4)] ring-1 ring-purple-400/40'
                  : 'bg-slate-900/90 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)]'
              }`}
            >
              <Layout className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Long-Term Memory Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              Neural Memory Drawer
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => {
                playTickSound();
                setIsMemoryVisible(!isMemoryVisible);
                if (!isMemoryVisible) playDigitalPingSound();
                else playWhooshSound();
                setIsHistoryVisible(false);
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shadow-sm ${
                isMemoryVisible
                  ? 'bg-gradient-to-b from-purple-600/60 to-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.6)] ring-1 ring-purple-400/40'
                  : 'bg-gradient-to-b from-slate-900/90 via-[#0a182e]/90 to-[#030a16]/90 border-cyan-500/35 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(0,242,255,0.35)]'
              }`}
            >
              <Database className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Task & Reminder Engine Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              Tasks & Reminders
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => {
                playTickSound();
                if (setIsTaskPanelOpen) {
                  setIsTaskPanelOpen(!isTaskPanelOpen);
                }
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shadow-sm ${
                isTaskPanelOpen
                  ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-black border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.8)] ring-2 ring-emerald-400/40'
                  : 'bg-gradient-to-b from-slate-900/90 via-[#0a182e]/90 to-[#030a16]/90 border-cyan-500/35 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(0,242,255,0.35)]'
              }`}
            >
              <ListTodo className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Settings Panel Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              System Settings
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => {
                playTickSound();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shadow-sm ${
                isSettingsOpen
                  ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,242,255,0.8)] ring-2 ring-cyan-400/40'
                  : 'bg-gradient-to-b from-slate-900/90 via-[#0a182e]/90 to-[#030a16]/90 border-cyan-500/35 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(0,242,255,0.35)]'
              }`}
            >
              <Settings className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Session Archives History Toggle */}
          <div className="relative group/btn">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:-translate-y-1 transition-all duration-200 px-2.5 py-1 rounded-md bg-[#020d1a] border border-cyan-400/50 text-cyan-200 font-orbitron text-[9px] font-extrabold tracking-widest uppercase shadow-[0_4px_20px_rgba(0,0,0,0.9),0_0_15px_rgba(0,242,255,0.3)] backdrop-blur-md whitespace-nowrap z-50">
              Session Archives
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#020d1a]" />
            </div>

            <button
              onClick={() => {
                playTickSound();
                setIsHistoryVisible(!isHistoryVisible);
                if (isHistoryVisible) playWhooshSound();
                setIsMemoryVisible(false);
              }}
              className={`relative w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shadow-sm ${
                isHistoryVisible
                  ? 'bg-gradient-to-b from-amber-600/60 to-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.6)] ring-1 ring-amber-400/40'
                  : 'bg-gradient-to-b from-slate-900/90 via-[#0a182e]/90 to-[#030a16]/90 border-cyan-500/35 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_18px_rgba(0,242,255,0.35)]'
              }`}
            >
              <HistoryIcon className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

        </div>
      </footer>
      )}

    </div>
  );
};
