import React, { useState, useRef } from 'react';
import { 
  X, Cpu, Zap, Volume2, Trash2, Palette, Eye, EyeOff, CheckCircle2, 
  AlertTriangle, RefreshCw, Type, Activity, Sliders, HardDrive, RotateCcw, 
  Save, Check, Camera, ChevronRight, Sparkles, Download, Upload, VolumeX, Volume1, Keyboard,
  Key, Radio, ShieldCheck, Waves, Compass, Bot, Navigation, Gauge, CornerDownRight, CheckCheck
} from 'lucide-react';
import { AVAILABLE_OPENROUTER_MODELS, testOpenRouterKey } from '../services/openRouterService';
import { FontStyle, JarvisTheme } from '../types';
import { THEMES } from '../services/themeManager';
import { ProviderConfigCenter } from './ProviderConfigCenter';
import { credentialManager } from '../services/credentialManager';
import { 
  playDigitalPingSound, 
  playWhooshSound, 
  getSoundVolume, 
  setSoundVolume, 
  getSoundEnabled, 
  setSoundEnabled,
  playMechanicalClick,
  previewVoiceSample,
  playArcReactorSound,
  playWakeChimeSound,
  playDirectiveCompleteChime
} from '../services/soundEffects';
import { wakeWordService } from '../services/wakeWordService';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  osControl: boolean;
  setOsControl: (val: boolean) => void;
  vocalConciseness: boolean;
  setVocalConciseness: (val: boolean) => void;
  timezone: string;
  setTimezone: (val: string) => void;
  theme?: JarvisTheme;
  setTheme?: (val: JarvisTheme) => void;
  fontStyle?: FontStyle;
  setFontStyle?: (val: FontStyle) => void;
  voicePersona?: string;
  setVoicePersona?: (val: string) => void;
  wakeWordEnabled?: boolean;
  setWakeWordEnabled?: (val: boolean) => void;
  onClearLogs?: () => void;
  openRouterKey?: string;
  setOpenRouterKey?: (val: string) => void;
  openRouterModel?: string;
  setOpenRouterModel?: (val: string) => void;
  activeProvider?: 'gemini' | 'openrouter';
  onOpenRuntimePanel?: () => void;
  onOpenWorkflowPanel?: () => void;
  onOpenAIProviders?: () => void;
  onOpenTaskPanel?: () => void;
  onOpenShortcutsModal?: () => void;
}

// Settings Category ID Types
export type CategoryId = 
  | 'general'
  | 'appearance'
  | 'ai_providers'
  | 'voice'
  | 'vision'
  | 'memory'
  | 'automation'
  | 'runtime'
  | 'shortcuts';

interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  badgeColor: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'general', label: 'General & OS', icon: Sliders, description: 'Core system controls, timezone calibration & behavior parameters.', badge: 'CORE', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' },
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette, description: 'Futuristic theme architectures, typography engines & visual styles.', badge: 'UI/UX', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
  { id: 'ai_providers', label: 'AI Providers & Routing', icon: Cpu, description: 'Gemini, NVIDIA Nemotron, OpenRouter failover & API keys.', badge: 'NEURAL', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/40' },
  { id: 'voice', label: 'Voice & Speech', icon: Volume2, description: 'Wake word detection, acoustic SFX & voice synthesis personas.', badge: 'AUDIO', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  { id: 'vision', label: 'Vision & Perception', icon: Camera, description: 'Camera perception, screen OCR parsing & visual context analysis.', badge: 'OPTIC', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  { id: 'memory', label: 'Memory & Knowledge', icon: HardDrive, description: 'Knowledge graph, long-term memory cache & log management.', badge: 'DATA', badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-400/40' },
  { id: 'automation', label: 'Automation & Workflows', icon: Zap, description: 'Custom action chains, task scheduling & automated workflows.', badge: 'FLOW', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' },
  { id: 'runtime', label: 'Runtime Engine', icon: Activity, description: 'Continuous execution runtime, background workers & auto-recovery.', badge: 'ENGINE', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-400/40' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, description: 'Global HUD hotkeys for ultra-fast navigation and hands-free control.', badge: 'HOTKEYS', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  osControl,
  setOsControl,
  vocalConciseness,
  setVocalConciseness,
  timezone,
  setTimezone,
  theme = 'cyber',
  setTheme,
  fontStyle = 'space',
  setFontStyle,
  voicePersona = 'Charon',
  setVoicePersona,
  wakeWordEnabled = true,
  setWakeWordEnabled,
  onClearLogs,
  openRouterKey = '',
  setOpenRouterKey,
  openRouterModel = 'google/gemini-2.0-flash-lite-001',
  setOpenRouterModel,
  activeProvider = 'gemini',
  onOpenRuntimePanel,
  onOpenWorkflowPanel,
  onOpenAIProviders,
  onOpenTaskPanel,
  onOpenShortcutsModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Draft local state for discard functionality
  const [draftOsControl, setDraftOsControl] = useState(osControl);
  const [draftConciseness, setDraftConciseness] = useState(vocalConciseness);
  const [draftTimezone, setDraftTimezone] = useState(timezone);
  const [draftFontStyle, setDraftFontStyle] = useState<FontStyle>(fontStyle);
  const [draftTheme, setDraftTheme] = useState<JarvisTheme>(theme);
  const [draftVoicePersona, setDraftVoicePersona] = useState<string>(voicePersona);
  const [draftWakeWord, setDraftWakeWord] = useState<boolean>(wakeWordEnabled);
  const [soundVol, setSoundVol] = useState<number>(getSoundVolume() * 100);
  const [isAudioFxEnabled, setIsAudioFxEnabled] = useState<boolean>(getSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        version: "3.2.0",
        storage: {}
      };
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('jarvis_') || key.startsWith('neural_') || key.startsWith('jarvis-'))) {
          try {
            backupData.storage[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            backupData.storage[key] = localStorage.getItem(key);
          }
        }
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jarvis_os_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      playDirectiveCompleteChime();
      setSaveToast('BACKUP EXPORTED SUCCESSFULLY');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.storage || typeof data.storage !== 'object') {
          throw new Error('Invalid backup schema');
        }

        let count = 0;
        Object.entries(data.storage).forEach(([k, v]) => {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          count++;
        });

        playArcReactorSound();
        setSaveToast(`RESTORED ${count} SYSTEM KEYS (RELOADING...)`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        alert(`Backup import error: ${err?.message || 'Invalid JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  const handleApplyChanges = () => {
    setOsControl(draftOsControl);
    setVocalConciseness(draftConciseness);
    setTimezone(draftTimezone);
    if (setFontStyle) setFontStyle(draftFontStyle);
    if (setTheme) setTheme(draftTheme);
    if (setVoicePersona) setVoicePersona(draftVoicePersona);
    if (setWakeWordEnabled) setWakeWordEnabled(draftWakeWord);
    wakeWordService.setEnabled(draftWakeWord);

    playDirectiveCompleteChime();
    setSaveToast('SETTINGS COMMITTED & ACTIVE');
    setTimeout(() => {
      setSaveToast(null);
      onClose();
    }, 1200);
  };

  const handleDiscardChanges = () => {
    setDraftOsControl(osControl);
    setDraftConciseness(vocalConciseness);
    setDraftTimezone(timezone);
    setDraftFontStyle(fontStyle);
    setDraftTheme(theme);
    setDraftVoicePersona(voicePersona);
    setDraftWakeWord(wakeWordEnabled);
    playWhooshSound();
    onClose();
  };

  const handleRestoreDefaults = () => {
    setDraftOsControl(true);
    setDraftConciseness(true);
    setDraftTimezone('UTC');
    setDraftFontStyle('space');
    setDraftTheme('cyber');
    setDraftVoicePersona('Charon');
    setDraftWakeWord(true);

    setOsControl(true);
    setVocalConciseness(true);
    setTimezone('UTC');
    if (setFontStyle) setFontStyle('space');
    if (setTheme) setTheme('cyber');
    if (setVoicePersona) setVoicePersona('Charon');
    if (setWakeWordEnabled) setWakeWordEnabled(true);
    wakeWordService.setEnabled(true);

    playDigitalPingSound();
    setSaveToast('RESTORED DEFAULT CONFIGURATION');
    setTimeout(() => setSaveToast(null), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col justify-between p-3 sm:p-4 md:p-5 bg-[#010814]/98 backdrop-blur-3xl animate-in fade-in duration-300 overflow-hidden font-sans select-none text-white max-h-screen no-scrollbar scrollbar-none"
      onClick={onClose}
    >
      {/* Soft Radial Ambient Aura Glows (Matching WeatherPanel) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/12 blur-3xl pointer-events-none -z-10" />

      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header 
        onClick={(e) => e.stopPropagation()}
        className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)] rounded-2xl mb-2.5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <Cpu className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                JARVIS OS CONFIGURATION
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SYSTEM MATRIX ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Section: {currentCategory.label}</span>
              <span>•</span>
              <span>Hardware Synced</span>
              <span>•</span>
              <span className="text-cyan-400">Low-Latency Mode</span>
            </p>
          </div>
        </div>

        {/* Action / Toast Notification & Close Button */}
        <div className="flex items-center gap-2.5">
          {saveToast && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold animate-in fade-in shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">{saveToast}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Restore Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 font-black" />
            <span>RESTORE DEFAULTS</span>
          </button>

          {/* Close Settings Workspace Modal */}
          <button
            type="button"
            onClick={() => { playWhooshSound(); onClose(); }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Close Settings (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN BODY: 2-COLUMN BALANCED ZERO-OVERFLOW FULL-SCREEN LAYOUT */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 my-1 items-stretch min-h-0 overflow-hidden"
      >
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: CATEGORIES NAVIGATION & SYSTEM CORE HUB    */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-[#030d1a]/95 border border-cyan-500/35 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,242,255,0.15)] relative overflow-hidden group">
          
          {/* Subtle ambient core glow in background */}
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          {/* Category Header */}
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="font-orbitron font-extrabold text-[11px] tracking-widest text-cyan-300 uppercase">
                CALIBRATION // CATEGORIES
              </span>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-cyan-500/10 border-cyan-400/30 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              9 MODULES
            </span>
          </div>

          {/* Categories Button List (With Glowing Active Indicators) */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setActiveCategory(cat.id);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-orbitron font-bold transition-all text-left cursor-pointer group/cat ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/15 text-white border border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-cyan-950/30 border border-white/5 hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`p-1.5 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.4)]' 
                        : 'bg-black/40 border-white/10 text-slate-400 group-hover/cat:text-cyan-300'
                    }`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span className="truncate text-[11px] tracking-wide">{cat.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase border ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                    {isActive ? (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#00f2ff]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover/cat:text-cyan-400 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Holographic Arc Reactor Telemetry Orb (Bottom of Left Column) */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-950/60 border border-cyan-500/30 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-orbitron font-extrabold text-cyan-200">OS PROTOCOL</span>
                <span className="text-[8px] font-mono text-slate-400">LEVEL 5 ACCESS</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playArcReactorSound();
                setSaveToast('REACTOR PULSE DISPATCHED');
                setTimeout(() => setSaveToast(null), 2000);
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[9px] font-mono font-bold text-cyan-300 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.2)]"
            >
              ⚡ ARC PULSE
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DYNAMIC SETTINGS CARDS WORKSPACE           */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden shadow-lg min-h-0">
          
          {/* Soft Radial Ambient Aura Glow */}
          <div className="absolute w-60 h-60 rounded-full bg-cyan-500/15 blur-3xl -z-10 animate-pulse pointer-events-none" />

          {/* Active Category Header Banner */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.3)]">
                {React.createElement(currentCategory.icon, { className: 'w-4 h-4 text-cyan-400' })}
              </div>
              <div>
                <h3 className="text-sm font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  {currentCategory.label}
                </h3>
                <p className="text-[10px] text-cyan-200/70 font-mono">
                  {currentCategory.description}
                </p>
              </div>
            </div>

            <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${currentCategory.badgeColor}`}>
              {currentCategory.badge} ACTIVE
            </span>
          </div>

          {/* SCROLLABLE SETTINGS CARDS CONTAINER */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar scrollbar-none">
            
            {/* CATEGORY 1: GENERAL & OS */}
            {activeCategory === 'general' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <SettingCard
                  title="OS Autonomous Control"
                  badge={draftOsControl ? 'ENABLED' : 'DISABLED'}
                  badgeType={draftOsControl ? 'success' : 'danger'}
                  description="Allow JARVIS to manage sensor states, trigger subroutines, and regulate desktop system actions."
                >
                  <ToggleSwitch 
                    active={draftOsControl} 
                    onClick={() => {
                      playMechanicalClick();
                      setDraftOsControl(!draftOsControl);
                    }} 
                  />
                </SettingCard>

                <SettingCard
                  title="Neural Timezone Sync"
                  badge={draftTimezone}
                  badgeType="info"
                  description="Calibrate JARVIS scheduling, cron jobs, and temporal awareness to your local timezone."
                >
                  <select 
                    value={draftTimezone}
                    onChange={(e) => {
                      playMechanicalClick();
                      setDraftTimezone(e.target.value);
                    }}
                    className="w-full sm:w-64 border rounded-xl px-3 py-2 text-xs font-mono bg-slate-950/90 border-cyan-500/40 text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.15)] cursor-pointer"
                  >
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <option key={tz} value={tz} className="bg-slate-950 text-white">{tz}</option>
                    ))}
                  </select>
                </SettingCard>

                <SettingCard
                  title="Neural Cache & Memory Clean"
                  badge="MAINTENANCE"
                  badgeType="warning"
                  description="Purge non-essential session logs, local cached states, and temporary audio matrix buffers."
                >
                  <button 
                    type="button"
                    onClick={() => { 
                      playWhooshSound();
                      if (onClearLogs) onClearLogs(); 
                      setSaveToast('CACHE & LOGS PURGED'); 
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-orbitron font-bold text-red-300 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>PURGE CACHE</span>
                  </button>
                </SettingCard>
              </div>
            )}

            {/* CATEGORY 2: APPEARANCE & THEMES */}
            {activeCategory === 'appearance' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Theme Architecture Selection with Rich Preview Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Palette className="w-4 h-4 text-cyan-400" /> GUI Theme Architecture & Visual Previews
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Select theme preset</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(THEMES) as JarvisTheme[]).map((tKey) => {
                      const tConfig = THEMES[tKey];
                      const isSelected = draftTheme === tKey;
                      return (
                        <div
                          key={tKey}
                          onClick={() => {
                            playMechanicalClick();
                            setDraftTheme(tKey);
                          }}
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'bg-gradient-to-b from-cyan-950/50 to-[#020d1c]/90 border-cyan-400 shadow-[0_0_25px_rgba(0,242,255,0.3)] ring-1 ring-cyan-400'
                              : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between z-10">
                            <div className="flex items-center gap-2">
                              <Palette className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-xs font-orbitron font-extrabold uppercase tracking-wider text-white">
                                {tConfig.name}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
                              isSelected ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              {tConfig.badge}
                            </span>
                          </div>

                          <p className="text-[10px] font-mono text-slate-300/80 leading-relaxed z-10">
                            {tConfig.description}
                          </p>

                          {/* Live Theme Preview Box */}
                          <div className="p-2 rounded-xl border border-white/10 bg-black/60 flex items-center justify-between gap-2 z-10">
                            <div className="flex items-center gap-2">
                              <div className={`px-2.5 py-0.5 rounded-lg text-[9px] font-orbitron font-bold border ${tConfig.styles.badgeBg} ${tConfig.styles.badgeBorder} ${tConfig.styles.badgeText}`}>
                                PRIMARY
                              </div>
                              <span className="text-[9px] font-mono text-slate-300">PREVIEW</span>
                            </div>
                            {isSelected && (
                              <span className="text-[9px] font-orbitron font-bold text-cyan-300 flex items-center gap-1">
                                <Check className="w-3 h-3 text-cyan-400" /> ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Engine Card */}
                <div className="space-y-2.5 pt-3 border-t border-white/10">
                  <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-4 h-4 text-cyan-400" /> Global Font Typography Engine
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'space' as FontStyle, name: 'Space Grotesk', tag: 'CYBER DEFAULT', desc: 'Geometric HUD spacing.', sampleClass: 'font-space' },
                      { id: 'orbitron' as FontStyle, name: 'Orbitron Tech', tag: 'FUTURISTIC HUD', desc: 'Capital sci-fi fonts.', sampleClass: 'font-orbitron' },
                      { id: 'rajdhani' as FontStyle, name: 'Rajdhani Cyber', tag: 'TACTICAL MATRIX', desc: 'Mechanical cyberpunk.', sampleClass: 'font-rajdhani' },
                      { id: 'mono' as FontStyle, name: 'JetBrains Code', tag: 'DEVELOPER MONO', desc: 'Monospace code style.', sampleClass: 'font-mono' },
                      { id: 'modern' as FontStyle, name: 'Plus Jakarta', tag: 'EXECUTIVE CLEAN', desc: 'Crisp interface font.', sampleClass: 'font-modern' },
                      { id: 'exo' as FontStyle, name: 'Exo 2 Sci-Fi', tag: 'HOLOGRAPHIC WAVE', desc: 'Rounded sci-fi style.', sampleClass: 'font-exo' },
                    ].map((f) => {
                      const isSel = draftFontStyle === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            playMechanicalClick();
                            setDraftFontStyle(f.id);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                            isSel
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                              : 'bg-slate-950/60 border-white/10 text-slate-400 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase text-white ${f.sampleClass}`}>{f.name}</span>
                            <div className={`w-2 h-2 rounded-full ${isSel ? 'bg-cyan-400 shadow-[0_0_8px_#00f2ff]' : 'bg-slate-700'}`} />
                          </div>
                          <span className="text-[9px] text-slate-400">{f.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 3: AI PROVIDERS & ROUTING */}
            {activeCategory === 'ai_providers' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <ProviderConfigCenter onOpenRuntimePanel={onOpenRuntimePanel} />
              </div>
            )}

            {/* CATEGORY 4: VOICE & SPEECH */}
            {activeCategory === 'voice' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <SettingCard
                  title="Hands-Free Wake Word ('Hey JARVIS')"
                  badge={draftWakeWord ? 'ACTIVE LISTENING' : 'DISABLED'}
                  badgeType={draftWakeWord ? 'success' : 'warning'}
                  description="Enable continuous background wake word detection. Say 'Hey Jarvis' or 'Jarvis' anywhere to awaken the system."
                >
                  <ToggleSwitch 
                    active={draftWakeWord} 
                    onClick={() => {
                      playMechanicalClick();
                      setDraftWakeWord(!draftWakeWord);
                    }} 
                  />
                </SettingCard>

                <SettingCard
                  title="Tactical Vocal Conciseness"
                  badge={draftConciseness ? 'CHARON DIRECT' : 'EXPANDED'}
                  badgeType={draftConciseness ? 'info' : 'warning'}
                  description="Enforce short, military-spec vocal responses during Live duplex mode."
                >
                  <ToggleSwitch 
                    active={draftConciseness} 
                    onClick={() => {
                      playMechanicalClick();
                      setDraftConciseness(!draftConciseness);
                    }} 
                  />
                </SettingCard>

                <SettingCard
                  title="Arc Reactor & UI Audio SFX Synthesizer"
                  badge={isAudioFxEnabled ? `${Math.round(soundVol)}% VOL` : 'MUTED'}
                  badgeType={isAudioFxEnabled ? 'success' : 'danger'}
                  description="Web Audio API holographic mechanical click sound pulses and Arc Reactor power effects."
                >
                  <div className="flex items-center gap-2.5 w-full sm:w-64">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isAudioFxEnabled;
                        setIsAudioFxEnabled(next);
                        setSoundEnabled(next);
                        if (next) playMechanicalClick();
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isAudioFxEnabled ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                      title={isAudioFxEnabled ? "Mute Acoustic SFX" : "Unmute Acoustic SFX"}
                    >
                      {isAudioFxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={isAudioFxEnabled ? soundVol : 0}
                      disabled={!isAudioFxEnabled}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSoundVol(val);
                        setSoundVolume(val / 100);
                      }}
                      onMouseUp={() => playDigitalPingSound()}
                      className="w-full accent-cyan-400 h-1.5 bg-cyan-950 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => playWakeChimeSound()}
                      className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 shrink-0 cursor-pointer"
                      title="Test Wake Chime"
                    >
                      CHIME
                    </button>
                  </div>
                </SettingCard>

                {/* Voice Persona Selector */}
                <div className="space-y-2.5 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Vocal Synthesizer Persona Models
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Live Gemini Neural Voices</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { id: 'Charon', name: 'Charon (Default JARVIS)', tag: 'TACTICAL BRITISH', desc: 'Authoritative, calm, confident JARVIS persona.', accent: 'Deep / Executive' },
                      { id: 'Fenrir', name: 'Fenrir', tag: 'HEAVY MIL-SPEC', desc: 'Deep baritone tactical system voice.', accent: 'Deep Command' },
                      { id: 'Puck', name: 'Puck', tag: 'DYNAMIC ENERGY', desc: 'Energetic, natural conversational voice.', accent: 'Natural Modern' },
                      { id: 'Aoede', name: 'Aoede', tag: 'SOPHISTICATED', desc: 'Smooth, melodic, and polished vocal core.', accent: 'Sophisticated' },
                      { id: 'Kore', name: 'Kore', tag: 'NEUTRAL CRISP', desc: 'Clear, studio-grade neutral AI assistant.', accent: 'Crisp Neutral' },
                    ].map((v) => {
                      const isSel = draftVoicePersona === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            playMechanicalClick();
                            setDraftVoicePersona(v.id);
                          }}
                          className={`p-3 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                            isSel
                              ? 'bg-gradient-to-b from-cyan-950/40 to-slate-950/70 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.25)]'
                              : 'bg-black/50 border-white/10 text-slate-400 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-orbitron font-bold uppercase text-white">{v.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border ${
                              isSel ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}>
                              {v.tag}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                            {v.desc}
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <span className="text-[9px] font-mono text-cyan-400/80">{v.accent}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                previewVoiceSample(v.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400 text-cyan-300 text-[9px] font-orbitron font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Volume2 className="w-3 h-3" /> SAMPLE
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 5: VISION & PERCEPTION */}
            {activeCategory === 'vision' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* NVIDIA OCR Native Integration Card */}
                <div className="p-4 bg-gradient-to-r from-emerald-950/30 via-slate-950/60 to-cyan-950/30 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-orbitron font-bold text-emerald-200 uppercase tracking-wider">
                        NVIDIA NeMo Retriever OCR Perception Engine
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                      GPU ACCELERATED
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                    Native optical text recognition powered by NVIDIA NeMo Retriever OCR microservice. Extracts structured text, bounding boxes, and tabular information from live screen snapshots, browser windows, camera frames, and uploaded documents.
                  </p>
                </div>

                <SettingCard
                  title="Layered Perception Strategy"
                  badge="ACTIVE: HYBRID"
                  badgeType="success"
                  description="Prioritizes instant DOM text when reliable text exists; routes visual captures, dialogs, terminal snapshots, and images to NVIDIA OCR."
                >
                  <span className="text-xs text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-orbitron">
                    OPTIMIZED PIPELINE
                  </span>
                </SettingCard>

                <SettingCard
                  title="NVIDIA OCR API Link Status"
                  badge={credentialManager.getEntry('nvidia_ocr')?.status === 'CONNECTED' ? 'ONLINE' : credentialManager.getEntry('nvidia_ocr')?.key ? 'CONFIGURED' : 'READY FOR KEY'}
                  badgeType={credentialManager.getEntry('nvidia_ocr')?.status === 'CONNECTED' ? 'success' : 'info'}
                  description="Manage the NVIDIA API Key for GPU-accelerated optical character recognition and multi-layer vision."
                >
                  <button
                    type="button"
                    onClick={() => {
                      playMechanicalClick();
                      setActiveCategory('ai_providers');
                    }}
                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-xl text-xs font-orbitron font-bold text-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:scale-105"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>CONFIGURE PROVIDER</span>
                  </button>
                </SettingCard>

                <SettingCard
                  title="Optic Camera & Spatial Vision Pipeline"
                  badge="OPERATIONAL"
                  badgeType="success"
                  description="Real-time optical frame perception, canvas capture analysis, and multi-modal scene understanding."
                >
                  <span className="text-xs text-cyan-300 font-bold bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-orbitron">
                    SENSORS READY
                  </span>
                </SettingCard>
              </div>
            )}

            {/* CATEGORY 6: MEMORY & KNOWLEDGE */}
            {activeCategory === 'memory' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <SettingCard
                  title="Knowledge Graph & Semantic Memory"
                  badge="SYNCHRONIZED"
                  badgeType="success"
                  description="Indexed entity relationships, long-term conversation summaries, and contextual recall."
                >
                  <span className="text-xs text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    INDEXED & ACTIVE
                  </span>
                </SettingCard>

                <SettingCard
                  title="Full System Backup & Restore (.json)"
                  badge="OFFLINE DATA"
                  badgeType="info"
                  description="Export all neural memories, custom personality profiles, chat logs, and workspace history to a JSON file or restore from a previous backup."
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImportBackup} 
                      accept=".json" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_12px_rgba(0,242,255,0.15)] hover:scale-105 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT (.JSON)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-xl text-xs font-orbitron font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)] hover:scale-105 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>IMPORT BACKUP</span>
                    </button>
                  </div>
                </SettingCard>

                <SettingCard
                  title="Purge Memory Cache"
                  badge="MAINTENANCE"
                  badgeType="warning"
                  description="Clear session cache or reset local knowledge graph index."
                >
                  <button
                    type="button"
                    onClick={() => { 
                      playWhooshSound();
                      if (onClearLogs) onClearLogs(); 
                      setSaveToast('MEMORY CACHE PURGED'); 
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-orbitron font-bold text-red-300 flex items-center gap-2 cursor-pointer transition-all shadow-sm hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>PURGE MEMORY</span>
                  </button>
                </SettingCard>
              </div>
            )}

            {/* CATEGORY 7: AUTOMATION & WORKFLOWS */}
            {activeCategory === 'automation' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <SettingCard
                  title="Task & Reminder Engine"
                  badge="ACTIVE"
                  badgeType="success"
                  description="Autonomous temporal scheduler, recurring directives, and EventBus-integrated reminder dispatch."
                >
                  {onOpenTaskPanel && (
                    <button
                      type="button"
                      onClick={() => { onOpenTaskPanel(); onClose(); }}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)] hover:scale-105 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>OPEN TASK PANEL</span>
                    </button>
                  )}
                </SettingCard>

                <SettingCard
                  title="Autonomous Workflow Engine"
                  badge="READY"
                  badgeType="success"
                  description="Build custom sequence chains, schedule tasks, and automate desktop workflows."
                >
                  {onOpenWorkflowPanel && (
                    <button
                      type="button"
                      onClick={() => { onOpenWorkflowPanel(); onClose(); }}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded-xl text-xs font-orbitron font-bold text-purple-300 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:scale-105 active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>OPEN WORKFLOWS</span>
                    </button>
                  )}
                </SettingCard>
              </div>
            )}

            {/* CATEGORY 8: RUNTIME ENGINE */}
            {activeCategory === 'runtime' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <SettingCard
                  title="JARVIS Core Execution Runtime"
                  badge="OPTIMAL"
                  badgeType="success"
                  description="Configure worker threads, memory management, event loop, and continuous lifecycle execution."
                >
                  {onOpenRuntimePanel && (
                    <button
                      type="button"
                      onClick={() => { onOpenRuntimePanel(); onClose(); }}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)] hover:scale-105 active:scale-95"
                    >
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>OPEN RUNTIME PANEL</span>
                    </button>
                  )}
                </SettingCard>
              </div>
            )}

            {/* CATEGORY 9: KEYBOARD SHORTCUTS */}
            {activeCategory === 'shortcuts' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/35 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Keyboard className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-orbitron font-bold text-cyan-200">GLOBAL HUD HOTKEYS</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Tactile rapid execution shortcuts active throughout all panels</p>
                    </div>
                  </div>
                  {onOpenShortcutsModal && (
                    <button
                      type="button"
                      onClick={() => { onOpenShortcutsModal(); onClose(); }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-xs font-orbitron font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.2)] hover:scale-105 active:scale-95"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>OPEN FULL HUD</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: "Space", desc: "Toggle Voice / Live Duplex", tag: "VOICE" },
                    { key: "M", desc: "Mute / Unmute Microphone", tag: "AUDIO" },
                    { key: "V", desc: "Toggle Camera / Optic Stream", tag: "PERCEPTION" },
                    { key: "S", desc: "Toggle Screen Vision OCR", tag: "VISION" },
                    { key: "Ctrl + K", desc: "Open Chat History / Search", tag: "NAV" },
                    { key: "Ctrl + W", desc: "Toggle Neural Workspace", tag: "FOCUS" },
                    { key: "Ctrl + ,", desc: "Open Configuration Matrix", tag: "SYSTEM" },
                    { key: "Esc", desc: "Close Active Modal / Drawer", tag: "GLOBAL" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/25 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-white">{item.desc}</span>
                        <span className="text-[9px] font-mono text-cyan-400/80">{item.tag}</span>
                      </div>
                      <kbd className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.15)] whitespace-nowrap">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR (Matching WeatherPanel Style) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full flex flex-wrap items-center justify-between gap-2.5 py-2.5 px-4 sm:px-6 rounded-2xl bg-[#030e1d]/90 border border-cyan-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,255,0.12)] mt-2 relative z-50 shrink-0"
      >
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline text-cyan-300 font-bold">JARVIS CORE:</span>
          <span>CALIBRATED // READY TO COMMIT</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleDiscardChanges}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-orbitron font-bold text-red-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>DISCARD</span>
          </button>

          <button
            type="button"
            onClick={handleApplyChanges}
            className="px-5 py-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 rounded-xl text-xs font-orbitron font-black flex items-center gap-2 shadow-[0_0_25px_rgba(0,242,255,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Save className="w-3.5 h-3.5 text-slate-950" />
            <span>SAVE & APPLY CONFIGURATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// HELPER UI COMPONENTS
interface SettingCardProps {
  title: string;
  badge?: string;
  badgeType?: 'success' | 'danger' | 'warning' | 'info';
  description: string;
  children: React.ReactNode;
}

const SettingCard: React.FC<SettingCardProps> = ({ title, badge, badgeType = 'info', description, children }) => {
  return (
    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#031526]/85 via-slate-950/85 to-[#020b18]/85 border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_20px_rgba(0,242,255,0.08)] hover:shadow-[0_0_25px_rgba(0,242,255,0.18)] backdrop-blur-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all duration-300 group">
      <div className="space-y-1 max-w-xl">
        <div className="flex items-center gap-2.5">
          <h4 className="text-xs font-orbitron font-bold text-white uppercase tracking-wide">
            {title}
          </h4>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
              badgeType === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : badgeType === 'danger'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                  : badgeType === 'warning'
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.3)]'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-300/80 leading-relaxed font-mono">
          {description}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {children}
      </div>
    </div>
  );
};

const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 border shrink-0 cursor-pointer ${
        active 
          ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.45)]' 
          : 'bg-slate-900 border-white/15'
      }`}
    >
      <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        active 
          ? 'left-7 bg-cyan-300 shadow-[0_0_12px_#00f2ff]' 
          : 'left-1 bg-slate-500'
      }`} />
    </button>
  );
};

export default SettingsPanel;
