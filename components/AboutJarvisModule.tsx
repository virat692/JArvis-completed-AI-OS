import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, Cpu, Activity, Database, Terminal, Zap,
  Globe, Radio, Eye, Mic, Volume2, HardDrive, Settings, CheckCircle2,
  Clock, Server, Lock, ChevronRight, Layers, Box, Code,
  Workflow, UserCheck, Award, Bot, Compass, RefreshCw,
  Search, ExternalLink, Hash, Info, BrainCircuit, Lightbulb, User,
  Check, ArrowRight, Monitor, Key, ShieldCheck, Play, Sliders, Laptop
} from 'lucide-react';
import { FullScreenWorkspaceOverlay } from './FullScreenWorkspaceOverlay';
import { runtimeEngine } from '../runtime/runtimeEngine';
import { aiProviderManager } from '../services/AIProviderManager';
import { capabilityRegistry, CapabilityItem } from '../services/capabilityRegistry';
import { telemetryService, DeviceTelemetryState } from '../services/telemetryService';
import { RuntimeMetrics } from '../types';

interface AboutJarvisModuleProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

type TabCategory = 'SYSTEM' | 'OPERATION' | 'INFORMATION';

interface NavItem {
  id: 'overview' | 'identity' | 'architecture' | 'capabilities' | 'specs' | 'security' | 'performance' | 'changelog' | 'roadmap' | 'credits';
  label: string;
  category: TabCategory;
  icon: React.ElementType;
}

export const AboutJarvisModule: React.FC<AboutJarvisModuleProps> = ({
  isOpen,
  onClose,
  theme = 'cyber'
}) => {
  const [activeTab, setActiveTab] = useState<NavItem['id']>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real system states from local services
  const [metrics, setMetrics] = useState<RuntimeMetrics>(() => runtimeEngine.getMetrics());
  const [activeProvider, setActiveProvider] = useState(() => aiProviderManager.getActiveProvider());
  const [telemetry, setTelemetry] = useState<DeviceTelemetryState>(telemetryService.getTelemetry());

  // Periodically refresh real metrics while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setMetrics(runtimeEngine.getMetrics());
      setActiveProvider(aiProviderManager.getActiveProvider());
    }, 1000);
    const unsubscribe = telemetryService.subscribe((updated) => {
      setTelemetry(updated);
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOpen]);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  // Format real engine uptime in seconds into human-readable d h m s
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const navItems: NavItem[] = [
    // SYSTEM
    { id: 'overview', label: 'Overview', category: 'SYSTEM', icon: Sparkles },
    { id: 'identity', label: 'AI Identity', category: 'SYSTEM', icon: Bot },
    { id: 'architecture', label: 'Architecture', category: 'SYSTEM', icon: Cpu },
    { id: 'capabilities', label: 'Capabilities', category: 'SYSTEM', icon: Layers },
    // OPERATION
    { id: 'specs', label: 'System Specs', category: 'OPERATION', icon: Server },
    { id: 'security', label: 'Security', category: 'OPERATION', icon: Shield },
    { id: 'performance', label: 'Performance', category: 'OPERATION', icon: Activity },
    // INFORMATION
    { id: 'changelog', label: 'Changelog', category: 'INFORMATION', icon: Clock },
    { id: 'roadmap', label: 'Roadmap', category: 'INFORMATION', icon: Compass },
    { id: 'credits', label: 'Credits', category: 'INFORMATION', icon: Award },
  ];

  // 1. AI Identity Real Data from Registry
  const registryData = capabilityRegistry.getRegistry();

  const identityData = [
    { key: 'System Name', value: `${registryData.identity.name} (${registryData.identity.acronym})`, icon: Bot },
    { key: 'Lead Creator', value: registryData.identity.creator, icon: UserCheck },
    { key: 'Version Build', value: `${registryData.version} (${registryData.developmentLevel})`, icon: Layers },
    { key: 'Primary Architecture', value: registryData.architecture.type, icon: Cpu },
    { key: 'Primary Brain', value: registryData.architecture.primaryBrain, icon: BrainCircuit },
    { key: 'Backend Reasoning Worker', value: registryData.architecture.backendReasoningWorker, icon: Zap },
    { key: 'Active AI Model', value: `${activeProvider.name} (${activeProvider.modelName})`, icon: BrainCircuit },
    { key: 'Voice & Speech Engine', value: registryData.identity.voiceName, icon: Mic },
    { key: 'Optic & Screen Vision', value: 'Webcam Spatial Frame Inspector + Desktop Screen Perception & OCR', icon: Eye },
    { key: 'Desktop Automation Bridge', value: registryData.architecture.osBridgeStatus, icon: Terminal },
    { key: 'Memory Subsystem', value: registryData.architecture.dataPersistence, icon: Database },
  ];

  // 2. Core Capabilities Matrix mapped from Registry
  const capabilitiesList = registryData.capabilities.map(cap => {
    let icon = Layers;
    if (cap.category === 'VOICE') icon = Mic;
    else if (cap.category === 'VISION') icon = Eye;
    else if (cap.category === 'DESKTOP') icon = Terminal;
    else if (cap.category === 'MEMORY') icon = Database;
    else if (cap.category === 'AUTOMATION') icon = Workflow;
    else if (cap.category === 'AI_PROVIDERS') icon = BrainCircuit;
    else if (cap.category === 'WORKSPACE') icon = Monitor;
    else if (cap.category === 'IDENTITY') icon = Bot;

    return {
      id: cap.id,
      title: cap.name,
      category: cap.category,
      icon,
      desc: cap.description,
      status: cap.status,
      tier: cap.executionTier,
      implementation: cap.implementation,
      allowedActions: cap.allowedActions
    };
  });

  // 3. Architecture Pipeline Nodes
  const architectureSteps = [
    {
      step: '1',
      title: 'User Interface',
      subtitle: 'Voice Mode, HUD Console, Terminal',
      desc: 'Receives user voice streams, text prompts, camera frames, and screen snapshots.',
      icon: Monitor,
      color: 'cyan'
    },
    {
      step: '2',
      title: 'JARVIS Kernel & Bus',
      subtitle: 'Event Router & State Store',
      desc: 'Coordinates all asynchronous events, system logging, and inter-module communications.',
      icon: Zap,
      color: 'blue'
    },
    {
      step: '3',
      title: 'Subsystem Layer',
      subtitle: 'Runtime, Memory, Workflows',
      desc: 'Manages scheduled tasks, loads relevant memory vectors, and executes active workflow jobs.',
      icon: Layers,
      color: 'purple'
    },
    {
      step: '4',
      title: 'AI Provider Manager',
      subtitle: 'Multi-LLM Dispatch & Fallback',
      desc: 'Evaluates task category and routes prompt to optimal model (Gemini, Nemotron, OpenAI, etc.).',
      icon: BrainCircuit,
      color: 'emerald'
    },
    {
      step: '5',
      title: 'System Tools & osBridge',
      subtitle: 'Desktop Execution & Action Output',
      desc: 'Executes verified tool calls on the host machine, updates memory, and synthesizes audio responses.',
      icon: Terminal,
      color: 'amber'
    }
  ];

  // 4. Subsystem Modules Details
  const subsystemModules = [
    {
      name: 'Runtime Engine',
      file: '/runtime/runtimeEngine.ts',
      role: 'Continuous 24/7 background scheduler, 1Hz heartbeat loop, worker task coordinator, and crash interceptor.',
      status: 'RUNNING'
    },
    {
      name: 'AI Provider Manager',
      file: '/services/AIProviderManager.ts',
      role: 'Unified model routing layer managing Gemini, Nemotron, OpenAI, DeepSeek, and local offline adapters with auto-failover.',
      status: 'ROUTING'
    },
    {
      name: 'Neural Memory Service',
      file: '/services/memoryService.ts',
      role: 'Vector embedding generation, semantic similarity ranking, and long-term key-value persistence in local storage.',
      status: 'PERSISTING'
    },
    {
      name: 'Workflow Engine',
      file: '/workflows/workflowEngine.ts',
      role: 'Multi-node visual automation graphs, trigger evaluation, conditional execution, and error handling.',
      status: 'READY'
    },
  ];

  // 5. System Specifications
  const systemSpecs = [
    { label: 'Frontend Stack', value: 'React 18 + Vite 5 + TypeScript', detail: 'Single-page responsive reactive interface' },
    { label: 'Styling & UI', value: 'Tailwind CSS + Lucide Icons + Motion', detail: 'GPU-accelerated technical design tokens' },
    { label: 'Backend Server', value: 'Node.js ESM + Express v4 API Proxy', detail: 'Secure server-side API key proxy layer' },
    { label: 'Desktop Bridge', value: 'Native osBridge (FastAPI Python 3.11 / Bash)', detail: 'Direct OS process and shell command interface' },
    { label: 'Active AI Provider', value: `${activeProvider.name} (${activeProvider.modelName})`, detail: 'Primary reasoning and multimodal pipeline' },
    { label: 'Speech Synthesis', value: 'Web Audio API 24kHz PCM + Web Speech API', detail: 'Natural low-latency vocal streaming' },
    { label: 'Storage Engine', value: 'LocalStorage Encrypted Vector Ledger', detail: '100% client-side privacy-first persistence' },
    { label: 'Security Model', value: 'Local Sandboxed Process Execution', detail: 'Host-level isolation and controlled osBridge boundaries' },
    { label: 'Hardware Acceleration', value: 'WebGL 60 FPS Canvas Graphics', detail: 'Fluid HUD visualization rendering' },
  ];

  // 6. Security Protocols
  const securityProtocols = [
    {
      title: 'Local Sandboxed Tool Execution',
      status: 'ENFORCED',
      desc: 'Commands run through isolated parameters with strict boundary checks preventing unconstrained host compromises.',
      color: 'cyan'
    },
    {
      title: 'Destructive Action Confirmation',
      status: 'STRICT',
      desc: 'Automated prompts require explicit operator approval before executing terminal commands or file deletions.',
      color: 'amber'
    },
    {
      title: 'Local-First Data Privacy',
      status: 'SECURE',
      desc: 'Memory records, chat histories, and configuration reside strictly on the local machine.',
      color: 'purple'
    },
    {
      title: 'Direct osBridge Boundary Verification',
      status: 'ACTIVE',
      desc: 'OS-level process and power commands are vetted before being routed to native execution wrappers.',
      color: 'emerald'
    }
  ];

  // 7. Real Performance Metrics
  const isLocal = telemetry.environment === 'LOCAL_DEVICE';
  const performanceCards = [
    { 
      label: 'Telemetry Mode', 
      value: isLocal ? 'Local Device' : 'Browser Sandbox', 
      subtext: isLocal ? 'Verified native telemetry feed' : 'Hardware metrics unavailable', 
      icon: Laptop 
    },
    { 
      label: 'Engine Uptime', 
      value: formatUptime(metrics.uptime || 0), 
      subtext: 'Active runtime session', 
      icon: Clock 
    },
    { 
      label: 'Heartbeat Ticks', 
      value: `${metrics.heartbeatCount || 0}`, 
      subtext: '1Hz background clock', 
      icon: Activity 
    },
    { 
      label: 'Host CPU Usage', 
      value: telemetry.cpu.usagePercent.display, 
      subtext: isLocal ? (telemetry.cpu.cores.display || 'Native host cores') : 'Requires local Python bridge', 
      icon: Cpu 
    },
    { 
      label: 'Host RAM Load', 
      value: telemetry.memory.usedPercent.display, 
      subtext: isLocal ? telemetry.memory.summary.display : (metrics.memoryUsageMb ? `JS Heap: ~${metrics.memoryUsageMb} MB` : 'Unavailable in browser'), 
      icon: Database 
    },
    { 
      label: 'Network Uplink', 
      value: telemetry.network.isOnline ? 'Online' : 'Offline', 
      subtext: telemetry.network.downlinkMbps.display !== 'N/A' ? telemetry.network.downlinkMbps.display : 'Web connection verified', 
      icon: Zap 
    },
    { 
      label: 'Crash Interceptions', 
      value: `${metrics.crashRecoveriesCount || 0}`, 
      subtext: 'Runtime self-healing events', 
      icon: Shield 
    },
  ];

  // 8. Real Release Changelog
  const changelogHistory = [
    {
      version: 'v4.3.0',
      date: 'August 2026',
      badge: 'CURRENT',
      highlight: 'Multi-LLM Provider Architecture & Biometric Face Lock Security',
      changes: [
        'Implemented standardized AIProvider interface supporting Gemini 2.5, Nemotron, OpenAI, DeepSeek, and Local models.',
        'Added 128-dimensional Biometric Face Lock with real-time video frame embedding extraction and anti-spoof liveness challenges.',
        'Integrated native osBridge for full desktop PC automation, application switching, and shell execution.',
        'Refined JARVIS About Dossier with real telemetry feeds, structured architecture flows, and high-contrast typography.'
      ]
    },
    {
      version: 'v4.2.0',
      date: 'July 2026',
      badge: 'STABLE',
      highlight: 'Swarm Agent Hub & Multi-Agent Orchestration',
      changes: [
        'Added Swarm Hub orchestrator supporting specialized sub-agents (Architect, Coder, Researcher, Security).',
        'Implemented multi-agent collaborative task execution and state synchronization.',
        'Enhanced camera optic vision and desktop screen perception OCR analysis.',
        'Expanded system telemetry diagnostics and live process resource monitoring.'
      ]
    },
    {
      version: 'v4.1.0',
      date: 'June 2026',
      badge: 'STABLE',
      highlight: '24/7 Runtime Engine & Dynamic Plugin Marketplace',
      changes: [
        'Built continuous 24/7 Runtime Engine with 1Hz heartbeat loop and self-healing crash interception.',
        'Integrated dynamic Plugin Marketplace for modular skill installations.',
        'Introduced visual Workflow Automation Engine with trigger-action pipelines.',
        'Implemented persistent vector memory store and semantic fact search.'
      ]
    },
    {
      version: 'v4.0.0',
      date: 'May 2026',
      badge: 'INITIAL',
      highlight: 'Unified OS Foundation & Low-Latency Voice Mode',
      changes: [
        'Initial unified JARVIS OS release combining voice mode, HUD console, and developer terminal.',
        'Bidirectional 24kHz WebAudio sound synthesis and live speech recognition.',
        '5-tier authority clearance guard and event bus architecture.'
      ]
    }
  ];

  // 9. Real Roadmap
  const roadmapItems = [
    {
      phase: 'Phase 10.1',
      title: 'Automated API Key Rate-Limit Rotation',
      status: 'IN PROGRESS',
      desc: 'Token bucket rate-limit monitors and multi-key auto-rotation inside AIProviderManager to prevent provider throttling.',
      eta: 'Q4 2026'
    },
    {
      phase: 'Phase 10.2',
      title: 'Standalone Binary Packaging',
      status: 'PLANNED',
      desc: 'Cross-platform desktop binary packaging for Windows 11, macOS, and Linux with native hardware bindings.',
      eta: 'Q4 2026'
    },
    {
      phase: 'Phase 11.0',
      title: 'Local Quantized LLM Execution',
      status: 'PLANNED',
      desc: 'Embedded on-device Ollama & Llama-3 8B quantized model integration for 100% offline conversational autonomy.',
      eta: 'Q1 2027'
    },
    {
      phase: 'Phase 12.0',
      title: 'ROS2 Robotics & Hardware Ingress',
      status: 'RESEARCH',
      desc: 'ROS2 middleware bridge for spatial robotic arm manipulation, inverse kinematics, and sensor telemetry.',
      eta: 'Q1 2027'
    },
    {
      phase: 'Phase 13.0',
      title: 'PX4 & MAVLink Drone Telemetry',
      status: 'RESEARCH',
      desc: 'Autonomous flight trajectory planning and real-time aerial sensor feed analysis over MAVLink protocol.',
      eta: 'Q2 2027'
    },
    {
      phase: 'Phase 14.0',
      title: 'Multi-Node Collaborative Swarm Sync',
      status: 'PLANNED',
      desc: 'P2P distributed swarm synchronization allowing multiple local JARVIS instances to share compute tasks securely.',
      eta: 'Q2 2027'
    }
  ];

  // 10. System Credits
  const creditsData = {
    creator: 'Operator Virat',
    title: 'Lead Systems Architect & Creator',
    aiEcosystem: [
      { name: 'Google DeepMind', detail: 'Gemini 2.5 Multimodal SDK (@google/genai)' },
      { name: 'NVIDIA AI', detail: 'Nemotron Reasoning Model Pipeline' },
      { name: 'OpenAI', detail: 'GPT-4o & Function Calling Architecture' },
      { name: 'DeepSeek AI', detail: 'DeepSeek-V3 Code & Logic Synthesis' }
    ],
    libraries: [
      'React 18', 'TypeScript', 'Vite 5', 'Tailwind CSS', 'Motion', 
      'Lucide React', 'Web Audio API', 'Web Speech API', 'HTML5 Canvas WebGL'
    ]
  };

  // Filter items based on user search query
  const filteredCapabilities = capabilitiesList.filter(c =>
    !searchQuery || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubsystems = subsystemModules.filter(s =>
    !searchQuery ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.file.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <FullScreenWorkspaceOverlay
      isOpen={isOpen}
      title="JARVIS SYSTEM DOSSIER"
      subtitle="Local-First Cognitive AI Operating System Profile & Architecture"
      icon={Bot}
      badgeText="● RUNTIME ONLINE // v4.3.0"
      badgeColor="cyan"
      onClose={onClose}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search system capabilities, architecture, specs, security..."
      theme={theme}
    >
      {/* Dossier Workspace Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-transparent relative">
        
        {/* Left Navigation Sidebar */}
        <div className={`w-full md:w-60 shrink-0 border-b md:border-b-0 md:border-r p-3.5 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto scrollbar-none backdrop-blur-md ${
          isSlate 
            ? 'bg-zinc-900/85 border-slate-800' 
            : isMinimal 
              ? 'bg-[#08101d]/85 border-emerald-500/20' 
              : isGold 
                ? 'bg-[#120d08]/85 border-amber-500/20' 
                : 'bg-black/50 border-cyan-500/20'
        }`}>
          
          {(['SYSTEM', 'OPERATION', 'INFORMATION'] as TabCategory[]).map(cat => {
            const items = navItems.filter(item => item.category === cat);
            return (
              <div key={cat} className="space-y-1 shrink-0">
                <div className="hidden md:block px-3 py-1 text-[9px] font-orbitron font-extrabold text-cyan-400/70 uppercase tracking-widest border-b border-cyan-500/10 mb-1">
                  {cat}
                </div>
                <div className="flex md:flex-col gap-1">
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10.5px] font-orbitron font-semibold uppercase transition-all duration-200 whitespace-nowrap cursor-pointer text-left shrink-0 ${
                          isActive
                            ? isSlate
                              ? 'bg-zinc-800 text-white border border-slate-600 shadow-sm'
                              : isMinimal
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                : isGold
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                  : 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-[0_0_16px_rgba(0,242,255,0.3)]'
                            : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5 border border-transparent'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 ml-auto text-cyan-400 hidden md:block" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">

          {/* ================= 1. OVERVIEW HERO SECTION ================= */}
          {(activeTab === 'overview' || searchQuery) && (
            <section className="relative rounded-2xl border border-cyan-500/30 p-6 sm:p-7 bg-gradient-to-br from-[#020b1e]/90 via-[#03112a]/80 to-[#010612]/95 backdrop-blur-xl shadow-[0_0_35px_rgba(0,242,255,0.08)] overflow-hidden">
              {/* Subtle Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-7 lg:gap-10">
                
                {/* Centered Compact JARVIS Core Visual */}
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                  {/* Outer Pulsing Ring */}
                  <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-[ping_4s_linear_infinite] pointer-events-none" />
                  {/* Outer Rotating Dashed Ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-400/50 animate-[spin_20s_linear_infinite]" />
                  {/* Inner Counter Rotating Ring */}
                  <div className="absolute inset-5 rounded-full border border-dashed border-blue-500/60 animate-[spin_14s_linear_infinite_reverse]" />
                  
                  {/* Center Core Orb */}
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-950 border-2 border-cyan-300 shadow-[0_0_30px_#00f2ff] flex flex-col items-center justify-center p-2 text-center">
                    <Bot className="w-8 h-8 text-white drop-shadow-[0_0_8px_#00f2ff]" />
                    <span className="text-[9px] font-orbitron font-extrabold text-cyan-200 tracking-wider mt-1">CORE ACTIVE</span>
                  </div>

                  {/* Operational Badge */}
                  <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#020d1a] border border-cyan-400/50 text-[8.5px] font-orbitron font-extrabold text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.3)] tracking-wider uppercase">
                    100% OPERATIONAL
                  </div>
                </div>

                {/* Hero Information */}
                <div className="flex-1 space-y-3.5 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-orbitron text-[10px] font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>JARVIS // SYSTEM DOSSIER</span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-orbitron font-black text-white tracking-wider">
                    J.A.R.V.I.S. Cognitive AI Operating System
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans max-w-3xl">
                    JARVIS is a local-first AI operating layer designed to combine conversational AI, voice control, vision, desktop automation, browser intelligence, memory, workflows, multi-agent systems, security, and multiple AI providers into one unified system.
                  </p>

                  {/* 4 Compact Status Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5">
                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md">
                      <div className="text-[8.5px] font-orbitron text-slate-400 uppercase font-bold">System Status</div>
                      <div className="text-xs font-orbitron font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5 justify-center lg:justify-start">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ONLINE
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md">
                      <div className="text-[8.5px] font-orbitron text-slate-400 uppercase font-bold">Version</div>
                      <div className="text-xs font-mono font-extrabold text-cyan-300 mt-1">
                        v4.3.0-PROD
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md">
                      <div className="text-[8.5px] font-orbitron text-slate-400 uppercase font-bold">AI Provider</div>
                      <div className="text-xs font-orbitron font-extrabold text-purple-300 mt-1 truncate" title={activeProvider.name}>
                        {activeProvider.name}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 backdrop-blur-md">
                      <div className="text-[8.5px] font-orbitron text-slate-400 uppercase font-bold">Security</div>
                      <div className="text-xs font-orbitron font-extrabold text-cyan-300 mt-1 flex items-center gap-1 justify-center lg:justify-start">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        ACTIVE
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ================= 2. AI IDENTITY ================= */}
          {(activeTab === 'identity' || (activeTab === 'overview' && !searchQuery) || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  AI Identity & Core Profile
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {identityData.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 flex items-start gap-3 backdrop-blur-md"
                    >
                      <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="text-[9.5px] font-orbitron font-bold text-slate-400 uppercase tracking-wider">
                          {item.key}
                        </div>
                        <div className="text-xs font-sans font-medium text-slate-100 break-words leading-relaxed">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= 3. ARCHITECTURE ================= */}
          {(activeTab === 'architecture' || searchQuery) && (
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  System Architecture & Pipeline Flow
                </h2>
              </div>

              {/* Sequential Flow Pipeline Diagram */}
              <div className="p-5 rounded-2xl bg-[#020e24]/75 border border-purple-500/20 backdrop-blur-md space-y-4">
                <div className="text-xs font-orbitron font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-purple-400" />
                  Unified Execution Flow
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {architectureSteps.map((node, i) => {
                    const NodeIcon = node.icon;
                    return (
                      <div 
                        key={node.step}
                        className="relative p-3.5 rounded-xl bg-black/40 border border-cyan-500/20 flex flex-col justify-between space-y-2"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300 flex items-center justify-center">
                              {node.step}
                            </span>
                            <NodeIcon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="text-xs font-orbitron font-bold text-white">
                            {node.title}
                          </div>
                          <div className="text-[9px] font-mono text-cyan-300">
                            {node.subtitle}
                          </div>
                          <p className="text-[10.5px] font-sans text-slate-300 leading-snug">
                            {node.desc}
                          </p>
                        </div>
                        {i < architectureSteps.length - 1 && (
                          <div className="hidden md:flex justify-end pt-1">
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-500/40" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subsystem Breakdown Cards */}
              <div className="space-y-3">
                <div className="text-xs font-orbitron font-bold text-slate-300 uppercase tracking-wider">
                  Core Subsystems & Responsible Modules
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSubsystems.map((sub, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 space-y-2 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider">
                          {sub.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-[8px] font-mono text-emerald-300 font-bold">
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-400 truncate">
                        {sub.file}
                      </div>
                      <p className="text-[11px] font-sans text-slate-300 leading-normal">
                        {sub.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================= 4. CAPABILITIES ================= */}
          {(activeTab === 'capabilities' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Core System Capabilities
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCapabilities.map((cap, idx) => {
                  const Icon = cap.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-[#020e24]/75 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-200 flex flex-col justify-between space-y-2.5 backdrop-blur-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                              {cap.title}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-[8px] font-mono text-emerald-300 font-bold">
                            {cap.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                          {cap.desc}
                        </p>
                        {cap.implementation && (
                          <div className="p-2 bg-black/40 border border-white/5 rounded-lg text-[9px] font-mono text-slate-400 truncate">
                            <span className="text-cyan-400">Src:</span> {cap.implementation.sourceFile}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase">
                        <span>Domain: {cap.category} ({cap.tier})</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= 5. SYSTEM SPECIFICATIONS ================= */}
          {(activeTab === 'specs' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Server className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Technical System Specifications
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemSpecs.map((s, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-[#020e24]/75 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200 space-y-1 backdrop-blur-md"
                  >
                    <div className="text-[9.5px] font-orbitron font-bold text-slate-400 uppercase tracking-wider">
                      {s.label}
                    </div>
                    <div className="text-xs font-mono font-bold text-blue-200">
                      {s.value}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {s.detail}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= 6. SECURITY ================= */}
          {(activeTab === 'security' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Security Architecture & Access Controls
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {securityProtocols.map((sec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-[#020e24]/75 border border-rose-500/20 hover:border-rose-400/40 transition-all duration-200 space-y-2 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-orbitron font-bold text-rose-300 uppercase tracking-wider">
                        {sec.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-400/30 text-[8px] font-mono text-rose-200 font-bold">
                        {sec.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                      {sec.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= 7. PERFORMANCE ================= */}
          {(activeTab === 'performance' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Live Runtime Performance & Telemetry
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {performanceCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 space-y-1 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] font-orbitron font-bold uppercase">{card.label}</span>
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="text-lg font-mono font-extrabold text-cyan-200">
                        {card.value}
                      </div>
                      <div className="text-[9.5px] font-sans text-slate-400">
                        {card.subtext}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================= 8. CHANGELOG ================= */}
          {(activeTab === 'changelog' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Release History & Version Changelog
                </h2>
              </div>

              <div className="space-y-3.5">
                {changelogHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-[#020e24]/75 border border-amber-500/20 backdrop-blur-md space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/15 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-orbitron font-bold text-amber-300 uppercase tracking-wider">
                          {item.version}
                        </span>
                        <span className="text-xs font-mono text-slate-400">({item.date})</span>
                        <span className="text-xs text-slate-300 hidden sm:inline">— {item.highlight}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-[8.5px] font-orbitron font-bold text-amber-200">
                        {item.badge}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                      {item.changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5 text-xs">➢</span>
                          <span className="leading-normal">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= 9. ROADMAP ================= */}
          {(activeTab === 'roadmap' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  Future Evolution & Development Roadmap
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roadmapItems.map((r, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-[#020e24]/75 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-200 space-y-2 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono text-indigo-300 font-bold">{r.phase}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-400/30 text-[8px] font-mono text-indigo-200 font-bold">
                        {r.status}
                      </span>
                    </div>
                    <div className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                      {r.title}
                    </div>
                    <p className="text-[11px] font-sans text-slate-300 leading-normal">
                      {r.desc}
                    </p>
                    <div className="text-[9px] font-mono text-slate-400 text-right pt-1.5 border-t border-indigo-500/10">
                      Target ETA: {r.eta}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= 10. CREDITS ================= */}
          {(activeTab === 'credits' || searchQuery) && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-2">
                <Award className="w-4 h-4 text-amber-300" />
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white uppercase tracking-wider">
                  System Credits & Architecture Attribution
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 backdrop-blur-md space-y-1.5">
                  <div className="text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-wider">Creator & Architect</div>
                  <div className="text-sm font-mono font-bold text-white">{creditsData.creator}</div>
                  <p className="text-xs text-slate-300">{creditsData.title} of the JARVIS AI Operating System.</p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 backdrop-blur-md space-y-1.5">
                  <div className="text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-wider">AI Model Providers</div>
                  <div className="space-y-1 pt-1">
                    {creditsData.aiEcosystem.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200">{p.name}</span>
                        <span className="text-slate-400 text-[10px]">{p.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-4 sm:p-5 rounded-xl bg-[#020e24]/75 border border-cyan-500/20 backdrop-blur-md space-y-2">
                  <div className="text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-wider">Core Frameworks & Libraries</div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {creditsData.libraries.map((lib, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-slate-800/80 border border-cyan-500/20 text-[10.5px] font-mono text-cyan-200">
                        {lib}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </FullScreenWorkspaceOverlay>
  );
};
