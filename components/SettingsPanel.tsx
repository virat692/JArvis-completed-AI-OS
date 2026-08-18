import React, { useState, useRef } from 'react';
import { 
  X, Cpu, Zap, Volume2, Trash2, Palette, Eye, EyeOff, CheckCircle2, 
  AlertTriangle, RefreshCw, Type, Activity, Sliders, HardDrive, RotateCcw, 
  Save, Check, Camera, ChevronRight, Sparkles, Download, Upload, VolumeX, Volume1, Keyboard
} from 'lucide-react';
import { AVAILABLE_OPENROUTER_MODELS, testOpenRouterKey } from '../services/openRouterService';
import { FontStyle, JarvisTheme } from '../types';
import { THEMES } from '../services/themeManager';
import { 
  playDigitalPingSound, 
  playWhooshSound, 
  getSoundVolume, 
  setSoundVolume, 
  getSoundEnabled, 
  setSoundEnabled,
  playMechanicalClick
} from '../services/soundEffects';

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
}

const CATEGORIES: CategoryDef[] = [
  { id: 'general', label: 'General & OS', icon: Sliders, description: 'Core system controls, timezone calibration & behavior parameters.' },
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette, description: 'Futuristic theme architectures, typography engines & visual styles.' },
  { id: 'ai_providers', label: 'AI Providers & Neural Routing', icon: Cpu, description: 'Gemini, NVIDIA Nemotron, OpenRouter failover & API keys.' },
  { id: 'voice', label: 'Voice & Speech', icon: Volume2, description: 'Tactical conciseness, vocal response velocity & voice synthesis.' },
  { id: 'vision', label: 'Vision & Perception', icon: Camera, description: 'Camera perception, screen OCR parsing & visual context analysis.' },
  { id: 'memory', label: 'Memory & Knowledge', icon: HardDrive, description: 'Knowledge graph, long-term memory cache & log management.' },
  { id: 'automation', label: 'Automation & Workflows', icon: Zap, description: 'Custom action chains, task scheduling & automated workflows.' },
  { id: 'runtime', label: 'Runtime Engine', icon: Activity, description: 'Continuous execution runtime, background workers & auto-recovery.' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, description: 'Global HUD hotkeys for ultra-fast navigation and hands-free control.' },
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
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Draft local state for discard functionality
  const [draftOsControl, setDraftOsControl] = useState(osControl);
  const [draftConciseness, setDraftConciseness] = useState(vocalConciseness);
  const [draftTimezone, setDraftTimezone] = useState(timezone);
  const [draftFontStyle, setDraftFontStyle] = useState<FontStyle>(fontStyle);
  const [draftTheme, setDraftTheme] = useState<JarvisTheme>(theme);
  const [soundVol, setSoundVol] = useState<number>(getSoundVolume() * 100);
  const [isAudioFxEnabled, setIsAudioFxEnabled] = useState<boolean>(getSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const backupData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        version: "2.5.0",
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
      
      playDigitalPingSound();
      setSaveToast('FULL SYSTEM BACKUP EXPORTED (.JSON)');
      setTimeout(() => setSaveToast(null), 3000);
    } catch (e: any) {
      setSaveToast('EXPORT FAILED: ' + e.message);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.storage) {
          throw new Error("Invalid backup structure");
        }

        Object.entries(data.storage).forEach(([k, v]) => {
          localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        });

        playDigitalPingSound();
        setSaveToast('BACKUP RESTORED SUCCESSFULLY! RELOADING...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        alert('Failed to import backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  const handleTestConnection = async () => {
    if (!openRouterKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    const ok = await testOpenRouterKey(openRouterKey, openRouterModel);
    setIsTesting(false);
    setTestResult(ok ? 'success' : 'failed');
    if (ok) playDigitalPingSound();
  };

  const handleApplyChanges = () => {
    setOsControl(draftOsControl);
    setVocalConciseness(draftConciseness);
    setTimezone(draftTimezone);
    if (setFontStyle) setFontStyle(draftFontStyle);
    if (setTheme) setTheme(draftTheme);

    playDigitalPingSound();
    setSaveToast('SYSTEM CONFIGURATION SAVED & APPLIED');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDiscardChanges = () => {
    setDraftOsControl(osControl);
    setDraftConciseness(vocalConciseness);
    setDraftTimezone(timezone);
    setDraftFontStyle(fontStyle);
    setDraftTheme(theme);
    playWhooshSound();
    setSaveToast('DISCARDED PENDING CHANGES');
    setTimeout(() => setSaveToast(null), 2000);
  };

  const handleRestoreDefaults = () => {
    if (!window.confirm('Restore default JARVIS Configuration settings?')) return;
    setDraftOsControl(true);
    setDraftConciseness(true);
    setDraftTimezone('UTC');
    setDraftFontStyle('space');
    setDraftTheme('cyber');

    setOsControl(true);
    setVocalConciseness(true);
    setTimezone('UTC');
    if (setFontStyle) setFontStyle('space');
    if (setTheme) setTheme('cyber');

    playDigitalPingSound();
    setSaveToast('RESTORED DEFAULT CONFIGURATION');
    setTimeout(() => setSaveToast(null), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-0 animate-in fade-in duration-200 select-none font-mono"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full h-full max-w-none max-h-none flex flex-col overflow-hidden rounded-none border-0 shadow-none backdrop-blur-3xl animate-in fade-in ${
          isSlate 
            ? 'bg-zinc-950 text-slate-100' 
            : isMinimal
              ? 'bg-[#0b1120] text-slate-100'
              : isGold
                ? 'bg-[#15100a] text-amber-100'
                : 'bg-[#020a1c] text-slate-100'
        }`}
      >
        {/* Top Scanner Beam */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none z-30 shadow-[0_0_12px_#00f2ff]" />

        {/* 1. FIXED TOP HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 z-20 backdrop-blur-md ${
          isSlate ? 'border-slate-800/60 bg-zinc-900/90' : isMinimal ? 'border-emerald-500/20 bg-emerald-950/30' : isGold ? 'border-amber-500/20 bg-amber-950/30' : 'border-cyan-500/20 bg-black/85'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
              isSlate ? 'bg-zinc-800 border-slate-700 text-zinc-200' : isMinimal ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400' : isGold ? 'bg-amber-950 border-amber-500/40 text-amber-400' : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
            }`}>
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm sm:text-base font-orbitron font-extrabold tracking-[0.2em] uppercase ${
                  isSlate ? 'text-zinc-100' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-300 drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]'
                }`}>
                  JARVIS OS CONFIGURATION MATRIX
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full border text-[9px] font-bold bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                  SYSTEM CORE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                System Parameters, Themes, Neural Providers & Operating Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveToast && (
              <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold animate-pulse flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{saveToast}</span>
              </div>
            )}

            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:text-white transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
              title="Close Configuration Panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: FIXED SIDEBAR + SCROLLABLE RIGHT CONTENT */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* 2. FIXED SIDEBAR NAVIGATION */}
          <div className={`w-64 sm:w-72 border-r overflow-y-auto custom-scroll shrink-0 p-3 space-y-1.5 ${
            isSlate ? 'border-slate-800 bg-zinc-900/50' : 'border-white/10 bg-black/60'
          }`}>
            <div className="px-2 py-1 text-[9px] font-orbitron font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>SYSTEM CATEGORIES</span>
            </div>

            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); playWhooshSound(); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-orbitron font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* 3. DYNAMIC RIGHT CONTENT AREA */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            
            {/* Category Sub-Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                {React.createElement(currentCategory.icon, { className: 'w-5 h-5 text-cyan-400' })}
                <div>
                  <h3 className="text-sm font-orbitron font-extrabold text-cyan-300 uppercase tracking-wider">
                    {currentCategory.label}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {currentCategory.description}
                  </p>
                </div>
              </div>
            </div>

            {/* SCROLLABLE SETTINGS CARDS CONTAINER */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
              
              {/* CATEGORY 1: GENERAL & OS */}
              {activeCategory === 'general' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="OS Autonomous Control"
                    badge={draftOsControl ? 'ENABLED' : 'DISABLED'}
                    badgeType={draftOsControl ? 'success' : 'danger'}
                    description="Allow JARVIS to manage sensor states, trigger subroutines, and regulate desktop system actions."
                  >
                    <ToggleSwitch 
                      active={draftOsControl} 
                      onClick={() => setDraftOsControl(!draftOsControl)} 
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
                      onChange={(e) => setDraftTimezone(e.target.value)}
                      className="w-full max-w-xs border rounded-xl px-3 py-2 text-xs font-mono bg-black/60 border-cyan-500/30 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
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
                      onClick={() => { if (onClearLogs) onClearLogs(); setSaveToast('CACHE CLEARED'); }}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-orbitron font-bold text-red-300 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>CLEAR CACHE & LOGS</span>
                    </button>
                  </SettingCard>
                </div>
              )}

              {/* CATEGORY 2: APPEARANCE & THEMES */}
              {activeCategory === 'appearance' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Theme Architecture Selection with Rich Preview Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-4 h-4 text-cyan-400" /> GUI Theme Architecture & Live Visual Previews
                      </h4>
                      <span className="text-[10px] text-slate-400">Click to preview & select theme</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(Object.keys(THEMES) as JarvisTheme[]).map((tKey) => {
                        const tConfig = THEMES[tKey];
                        const isSelected = draftTheme === tKey;
                        return (
                          <div
                            key={tKey}
                            onClick={() => setDraftTheme(tKey)}
                            className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                              isSelected
                                ? `${tConfig.styles.cardBg} ${tConfig.styles.activeBorder} ${tConfig.styles.textPrimary} ${tConfig.styles.glowShadow} ring-2 ring-cyan-400/50`
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between z-10">
                              <div className="flex items-center gap-2">
                                <Palette className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-orbitron font-extrabold uppercase tracking-wider">
                                  {tConfig.name}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
                                isSelected ? `${tConfig.styles.badgeBg} ${tConfig.styles.badgeBorder} ${tConfig.styles.badgeText}` : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}>
                                {tConfig.badge}
                              </span>
                            </div>

                            <p className="text-[10px] font-mono text-slate-300/80 leading-relaxed z-10">
                              {tConfig.description}
                            </p>

                            {/* Live Theme Component Preview Box */}
                            <div className="p-3 rounded-xl border border-white/10 bg-black/60 space-y-2 z-10">
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className="text-slate-400">UI ELEMENT PREVIEW</span>
                                <span className="text-cyan-400 font-bold">ACTIVE OS MATRIX</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-orbitron font-bold border ${tConfig.styles.badgeBg} ${tConfig.styles.badgeBorder} ${tConfig.styles.badgeText}`}>
                                  PRIMARY BUTTON
                                </div>
                                <div className="px-2 py-1 rounded-lg text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300">
                                  TEXT LABEL
                                </div>
                                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse ml-auto" />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-white/5 z-10">
                              <span className="text-[9px] font-mono text-slate-400">Inspiration: {tConfig.inspiration}</span>
                              {isSelected && (
                                <span className="text-[10px] font-orbitron font-bold text-cyan-300 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> SELECTED
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Typography Engine Card */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Type className="w-4 h-4 text-cyan-400" /> Global Font Typography Engine
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                            onClick={() => setDraftFontStyle(f.id)}
                            className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase ${f.sampleClass}`}>{f.name}</span>
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

              {/* CATEGORY 3: AI PROVIDERS */}
              {activeCategory === 'ai_providers' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="AI Provider Architecture & Neural Routing"
                    badge={activeProvider === 'openrouter' ? 'OPENROUTER ACTIVE' : 'GEMINI PRIMARY'}
                    badgeType={activeProvider === 'openrouter' ? 'warning' : 'success'}
                    description="JARVIS uses Google Gemini as primary LLM and supports NVIDIA Nemotron and OpenRouter for deep reasoning tasks."
                  >
                    {onOpenAIProviders && (
                      <button
                        onClick={() => { onOpenAIProviders(); onClose(); }}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded-xl text-xs font-orbitron font-bold text-purple-300 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>OPEN AI PROVIDERS PANEL</span>
                      </button>
                    )}
                  </SettingCard>

                  {/* OpenRouter Key Setup Card */}
                  <div className="p-5 bg-black/60 border border-white/10 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-xs font-orbitron font-bold text-cyan-300 uppercase">OpenRouter API Key & Test Connection</h4>
                        <p className="text-[10px] text-slate-400">Configure key for optional backup models (DeepSeek, Claude, Llama 3, Nemotron).</p>
                      </div>
                      {openRouterKey ? (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> KEY CONFIGURED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> KEY OPTIONAL
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="relative flex items-center">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={openRouterKey}
                          onChange={(e) => setOpenRouterKey && setOpenRouterKey(e.target.value)}
                          placeholder="sk-or-v1-..."
                          className="w-full pr-28 pl-3 py-2 text-xs font-mono rounded-xl border bg-black/80 border-cyan-500/30 text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                        <div className="absolute right-2 flex items-center gap-1">
                          <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={handleTestConnection}
                            disabled={isTesting || !openRouterKey.trim()}
                            className="px-3 py-1 text-[10px] font-orbitron font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                          >
                            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'TEST'}
                          </button>
                        </div>
                      </div>

                      {testResult === 'success' && (
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> OpenRouter Connection Verified Successfully!
                        </p>
                      )}
                      {testResult === 'failed' && (
                        <p className="text-xs text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Connection failed. Please check your OpenRouter API Key.
                        </p>
                      )}

                      <div className="space-y-1 pt-2">
                        <label className="text-[10px] font-orbitron font-bold text-slate-300">Failover Model Selection</label>
                        <select
                          value={openRouterModel}
                          onChange={(e) => setOpenRouterModel && setOpenRouterModel(e.target.value)}
                          className="w-full border rounded-xl px-3 py-2 text-xs font-mono bg-black/80 border-purple-500/30 text-purple-300 focus:outline-none focus:border-purple-400"
                        >
                          {AVAILABLE_OPENROUTER_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 4: VOICE & SPEECH */}
              {activeCategory === 'voice' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="Vocal Tactical Protocol"
                    badge={draftConciseness ? 'TACTICAL CONCISE' : 'VERBOSE DETAILED'}
                    badgeType="info"
                    description="Switch between brief tactical executive answers and full detailed explanatory voice responses."
                  >
                    <ToggleSwitch 
                      active={draftConciseness} 
                      onClick={() => setDraftConciseness(!draftConciseness)} 
                    />
                  </SettingCard>

                  <SettingCard
                    title="HUD Audio SFX & Sonar Volume"
                    badge={`${soundVol}%`}
                    badgeType={soundVol > 0 ? "success" : "warning"}
                    description="Master acoustic feedback volume for digital pings, tactile clicks, sonar telemetry, and transitions."
                  >
                    <div className="flex items-center gap-3 w-full sm:w-64">
                      <button
                        onClick={() => {
                          const next = !isAudioFxEnabled;
                          setIsAudioFxEnabled(next);
                          setSoundEnabled(next);
                          if (next) playMechanicalClick();
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isAudioFxEnabled ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-red-500/10 border-red-500/30 text-red-400'
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
                    </div>
                  </SettingCard>

                  <SettingCard
                    title="Vocal Synthesizer Voice Model"
                    badge="CHARON_X1"
                    badgeType="success"
                    description="High-fidelity neural voice model with real-time pitch modulation and low latency."
                  >
                    <span className="text-xs text-cyan-300 font-bold bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30">
                      CHARON_X1 NEURAL CORE
                    </span>
                  </SettingCard>
                </div>
              )}

              {/* CATEGORY 5: VISION & PERCEPTION */}
              {activeCategory === 'vision' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="Camera Perception & Screen OCR Stream"
                    badge="OPERATIONAL"
                    badgeType="success"
                    description="Real-time optical frame perception, screen OCR text parsing, and visual image understanding."
                  >
                    <span className="text-xs text-cyan-300 font-bold bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-orbitron">
                      SUBSYSTEM: READY
                    </span>
                  </SettingCard>
                </div>
              )}

              {/* CATEGORY 6: MEMORY & KNOWLEDGE */}
              {activeCategory === 'memory' && (
                <div className="space-y-5 animate-in fade-in duration-200">
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
                    <div className="flex items-center gap-3 flex-wrap">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportBackup} 
                        accept=".json" 
                        className="hidden" 
                      />
                      <button
                        onClick={handleExportBackup}
                        className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(0,242,255,0.15)]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>EXPORT ALL (.JSON)</span>
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-xl text-xs font-orbitron font-bold text-purple-300 flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>IMPORT / RESTORE</span>
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
                      onClick={() => { if (onClearLogs) onClearLogs(); setSaveToast('MEMORY CACHE PURGED'); }}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-orbitron font-bold text-red-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>PURGE MEMORY CACHE</span>
                    </button>
                  </SettingCard>
                </div>
              )}

              {/* CATEGORY 7: AUTOMATION & WORKFLOWS */}
              {activeCategory === 'automation' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="Task & Reminder Engine"
                    badge="ACTIVE"
                    badgeType="success"
                    description="Autonomous temporal scheduler, recurring directives, and EventBus-integrated reminder dispatch."
                  >
                    {onOpenTaskPanel && (
                      <button
                        onClick={() => { onOpenTaskPanel(); onClose(); }}
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span>OPEN TASK & REMINDER PANEL</span>
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
                        onClick={() => { onOpenWorkflowPanel(); onClose(); }}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 rounded-xl text-xs font-orbitron font-bold text-purple-300 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span>OPEN WORKFLOW PANEL</span>
                      </button>
                    )}
                  </SettingCard>
                </div>
              )}

              {/* CATEGORY 8: RUNTIME ENGINE */}
              {activeCategory === 'runtime' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <SettingCard
                    title="JARVIS Core Execution Runtime"
                    badge="OPTIMAL"
                    badgeType="success"
                    description="Configure worker threads, memory management, event loop, and continuous lifecycle execution."
                  >
                    {onOpenRuntimePanel && (
                      <button
                        onClick={() => { onOpenRuntimePanel(); onClose(); }}
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-xl text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-2 transition-all cursor-pointer"
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
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Keyboard className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-orbitron font-bold text-cyan-200">GLOBAL HUD HOTKEYS</h4>
                        <p className="text-[10px] text-slate-400">Tactile rapid execution shortcuts active throughout all panels</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "Ctrl + K / Ctrl + /", desc: "Open Chat History / Global Search", tag: "NAV" },
                      { key: "Ctrl + W", desc: "Toggle Neural Workspace (Focus)", tag: "FOCUS" },
                      { key: "Ctrl + M", desc: "Toggle Memory & Knowledge Panel", tag: "MEMORY" },
                      { key: "Ctrl + O", desc: "Toggle Camera / Optic Stream", tag: "PERCEPTION" },
                      { key: "Ctrl + S", desc: "Toggle Screen Vision OCR", tag: "VISION" },
                      { key: "Ctrl + ,", desc: "Toggle Settings & Configuration Matrix", tag: "SYSTEM" },
                      { key: "Ctrl + ` / ~", desc: "Toggle Host OS Control Console", tag: "CLI" },
                      { key: "Esc", desc: "Close Any Active Drawer / Modal", tag: "GLOBAL" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/20 flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-200">{item.desc}</span>
                          <span className="text-[9px] font-mono text-cyan-400/70">{item.tag}</span>
                        </div>
                        <kbd className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_8px_rgba(0,242,255,0.15)] whitespace-nowrap">
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

        {/* 4. STICKY BOTTOM ACTION BAR */}
        <div className={`px-6 py-3.5 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-md ${
          isSlate ? 'bg-zinc-900/90 border-slate-800' : 'bg-black/85 border-white/10'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>JARVIS OS • CONFIGURATION MATRIX</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRestoreDefaults}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-orbitron font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTORE DEFAULTS</span>
            </button>

            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-orbitron font-bold text-red-400 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>DISCARD CHANGES</span>
            </button>

            <button
              onClick={handleApplyChanges}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400 text-cyan-200 rounded-xl text-xs font-orbitron font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-cyan-300" />
              <span>SAVE & APPLY CONFIGURATION</span>
            </button>
          </div>
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
    <div className="p-5 bg-black/60 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-cyan-500/30">
      <div className="space-y-1 max-w-xl">
        <div className="flex items-center gap-2.5">
          <h4 className="text-xs font-orbitron font-bold text-slate-100 uppercase tracking-wide">
            {title}
          </h4>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
              badgeType === 'success'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                : badgeType === 'danger'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : badgeType === 'warning'
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
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
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all duration-300 border shrink-0 cursor-pointer ${
        active 
          ? 'bg-cyan-500/30 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.3)]' 
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      <div className={`absolute top-1 w-3.5 h-3.5 rounded-full transition-all duration-300 ${
        active 
          ? 'left-7 bg-cyan-400 shadow-[0_0_15px_#00f2ff]' 
          : 'left-1 bg-slate-500'
      }`} />
    </button>
  );
};

export default SettingsPanel;
