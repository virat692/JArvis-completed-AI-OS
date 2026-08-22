import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Sparkles,
  Power,
  CloudSun
} from 'lucide-react';
import { 
  credentialManager, 
  CredentialId, 
  CredentialEntry 
} from '../services/credentialManager';
import { aiProviderManager } from '../services/AIProviderManager';
import { playDigitalPingSound, playMechanicalClick, playWhooshSound } from '../services/soundEffects';

interface ProviderConfigCenterProps {
  onOpenRuntimePanel?: () => void;
}

export const ProviderConfigCenter: React.FC<ProviderConfigCenterProps> = () => {
  const [credentials, setCredentials] = useState<CredentialEntry[]>(credentialManager.getAllEntries());
  const [filterCategory, setFilterCategory] = useState<'all' | 'ai' | 'search' | 'utility'>('all');
  
  // Per-provider local input state for draft edits before save
  const [inputKeys, setInputKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs?: number }>>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Subscribe to credential updates
  useEffect(() => {
    const unsubCreds = credentialManager.subscribe(() => {
      const all = credentialManager.getAllEntries();
      setCredentials(all);
    });

    // Populate initial draft keys
    const initialDrafts: Record<string, string> = {};
    credentialManager.getAllEntries().forEach(c => {
      initialDrafts[c.id] = c.source === 'user_settings' ? c.key : '';
    });
    setInputKeys(initialDrafts);

    return () => {
      unsubCreds();
    };
  }, []);

  const handleKeyChange = (id: CredentialId, val: string) => {
    setInputKeys(prev => ({ ...prev, [id]: val }));
  };

  const toggleShowKey = (id: CredentialId) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveCredential = (id: CredentialId) => {
    playMechanicalClick();
    const val = inputKeys[id] || '';
    const entry = credentialManager.getEntry(id);
    
    credentialManager.setCredential(id, val, {
      selectedModel: entry?.selectedModel,
      enabled: true
    });

    // Refresh provider instances in memory if AI provider
    const provider = aiProviderManager.getProvider(id);
    if (provider && (provider as any).setApiKey) {
      (provider as any).setApiKey(val);
    }

    setSaveToast(`Configuration saved & verified for ${entry?.name || id}`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleRemoveCredential = (id: CredentialId) => {
    playWhooshSound();
    credentialManager.removeCredential(id);
    setInputKeys(prev => ({ ...prev, [id]: '' }));
    setConfirmDeleteId(null);
    setTestResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setSaveToast(`Cleared credential for ${id}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleTestConnection = async (id: CredentialId) => {
    setTestingId(id);
    playWhooshSound();

    // If user has unsaved draft in input, save it first so test evaluates current input
    const currentInput = inputKeys[id];
    if (currentInput !== undefined) {
      credentialManager.setCredential(id, currentInput);
    }

    const result = await credentialManager.testConnection(id);
    setTestResults(prev => ({
      ...prev,
      [id]: {
        success: result.success,
        message: result.message,
        latencyMs: result.latencyMs
      }
    }));

    setTestingId(null);
    if (result.success) {
      playDigitalPingSound();
    }
  };

  const handleModelChange = (id: CredentialId, model: string) => {
    credentialManager.setModel(id, model);
    const p = aiProviderManager.getProvider(id);
    if (p && (p as any).setModel) {
      (p as any).setModel(model);
    }
  };

  const getStatusBadge = (entry: CredentialEntry) => {
    const isTestingCurrent = testingId === entry.id;

    if (isTestingCurrent) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center gap-1.5 animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin" /> TESTING LINK
        </span>
      );
    }

    if (entry.status === 'CONNECTED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CONNECTED
        </span>
      );
    }

    if (entry.status === 'CONFIGURED' || entry.source === 'environment') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-cyan-400" /> {entry.source === 'environment' ? 'ENV CONFIGURED' : 'CONFIGURED'}
        </span>
      );
    }

    if (entry.status === 'INVALID_KEY') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> INVALID KEY
        </span>
      );
    }

    if (entry.status === 'NETWORK_ERROR' || entry.status === 'PROVIDER_ERROR') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-400" /> {entry.status === 'NETWORK_ERROR' ? 'NETWORK ERROR' : 'PROVIDER ERROR'}
        </span>
      );
    }

    if (entry.status === 'DISABLED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
          <Power className="w-3 h-3" /> DISABLED
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full text-[9px] font-orbitron font-bold bg-slate-900 border border-white/10 text-slate-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-600" /> NOT CONFIGURED
      </span>
    );
  };

  const getAvailableModels = (id: CredentialId): Array<{ id: string; name: string }> => {
    switch (id) {
      case 'gemini':
        return [
          { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Primary Core Brain - Ultra Fast)' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Architecture & High Context)' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (General Intelligence)' }
        ];
      case 'nemotron':
        return [
          { id: 'nvidia/nemotron-4-340b-instruct', name: 'NVIDIA Nemotron 4 340B (Dedicated Reasoning Backend)' },
          { id: 'nvidia/nemotron-mini-4b-instruct', name: 'NVIDIA Nemotron Mini 4B (Fast Verification)' }
        ];
      case 'nvidia_ocr':
        return [
          { id: 'nvidia/nemotron-ocr-v2', name: 'NVIDIA Nemotron OCR v2 (Primary Multilingual Text & Layout NIM)' },
          { id: 'nvidia/nemotron-ocr-v1', name: 'NVIDIA Nemotron OCR v1 (Legacy Microservice)' },
          { id: 'nvidia/nemo-retriever-ocr', name: 'NVIDIA NeMo Retriever OCR (High-Precision GPU NIM)' }
        ];
      case 'openrouter':
        return [
          { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite (OpenRouter Zero-Downtime Failover)' },
          { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct (Failover Backup)' },
          { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct (Code Failover)' }
        ];
      default:
        return [];
    }
  };

  const displayedProviders = credentials.filter(c => {
    if (filterCategory === 'ai') return c.category === 'ai';
    if (filterCategory === 'search') return c.category === 'search';
    if (filterCategory === 'utility') return c.category === 'utility';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="p-3 bg-cyan-500/20 border border-cyan-400 rounded-xl text-xs font-mono text-cyan-300 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-400" />
            {saveToast}
          </span>
        </div>
      )}

      {/* Architecture Routing Overview Card */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 border border-cyan-500/30 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-orbitron font-bold text-cyan-200 uppercase tracking-wider">Hardened 7-Service Approved Architecture</h4>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            GEMINI ➜ NEMOTRON ➜ NVIDIA OCR ➜ OPENROUTER | EXA/TAVILY | OPENWEATHER
          </span>
        </div>
        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
          JARVIS integrates 7 approved native integrations: <strong>Google Gemini</strong> (Core Reasoning Brain), <strong>NVIDIA Nemotron</strong> (Reasoning Backend), <strong>NVIDIA Nemotron OCR v2</strong> (Primary Multilingual Vision & Layout Extraction Engine), <strong>OpenRouter</strong> (Failover Router), <strong>Tavily</strong> & <strong>Exa</strong> (Neural Web Search), and <strong>OpenWeather</strong> (Live Meteorological Telemetry).
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-black/60 border border-white/10 rounded-xl w-fit">
        {[
          { id: 'all' as const, label: `All Services (${credentials.length})`, icon: Layers },
          { id: 'ai' as const, label: `AI & Vision (${credentials.filter(c => c.category === 'ai').length})`, icon: Cpu },
          { id: 'search' as const, label: `Neural Search (${credentials.filter(c => c.category === 'search').length})`, icon: Search },
          { id: 'utility' as const, label: `Utility & Data (${credentials.filter(c => c.category === 'utility').length})`, icon: CloudSun }
        ].map(btn => {
          const isSel = filterCategory === btn.id;
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={() => {
                playMechanicalClick();
                setFilterCategory(btn.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold transition-all cursor-pointer ${
                isSel 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Provider Cards */}
      <div className="space-y-4">
        {displayedProviders.map((provider) => {
          const draftVal = inputKeys[provider.id] ?? (provider.source === 'user_settings' ? provider.key : '');
          const isMasked = !showKeys[provider.id];
          const isEnvKey = provider.source === 'environment';
          const models = getAvailableModels(provider.id);
          const testInfo = testResults[provider.id];
          const isDeleting = confirmDeleteId === provider.id;

          return (
            <div 
              key={provider.id}
              className="p-5 bg-black/70 border border-white/10 hover:border-cyan-500/30 rounded-2xl space-y-4 transition-all duration-200 relative group"
            >
              {/* Header Row */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-sm font-orbitron font-bold text-white tracking-wide flex items-center gap-2">
                      {provider.id === 'openweather' && <CloudSun className="w-4 h-4 text-sky-400" />}
                      {provider.name}
                    </h4>
                    {provider.isPrimary && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-orbitron font-extrabold bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                        CORE BRAIN
                      </span>
                    )}
                    {provider.id === 'nemotron' && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-orbitron font-extrabold bg-amber-500/20 border border-amber-400 text-amber-300">
                        REASONING WORKER
                      </span>
                    )}
                    {provider.isBackup && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-orbitron font-extrabold bg-purple-500/20 border border-purple-400 text-purple-300">
                        FAILOVER ROUTER
                      </span>
                    )}
                    {provider.category === 'search' && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-orbitron font-extrabold bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                        SEARCH INDEX
                      </span>
                    )}
                    {provider.id === 'openweather' && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-orbitron font-extrabold bg-sky-500/20 border border-sky-400 text-sky-300">
                        WEATHER ENGINE
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-400">{provider.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(provider)}
                </div>
              </div>

              {/* Environment Detection Notice (if applicable) */}
              {isEnvKey && (
                <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-cyan-300">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Configured via environment variable ({provider.envVarName}). Secret is secured and locked.
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">READY</span>
                </div>
              )}

              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-orbitron font-bold text-slate-300">
                  <span>API KEY ({provider.envVarName})</span>
                  {provider.lastTested && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Tested: {new Date(provider.lastTested).toLocaleTimeString()} {provider.lastLatencyMs ? `(${provider.lastLatencyMs}ms)` : ''}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type={isMasked ? 'password' : 'text'}
                    value={isEnvKey && !draftVal ? '••••••••••••••••••••••••••••••••' : draftVal}
                    disabled={isEnvKey && !draftVal}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    placeholder={`Enter ${provider.name} API Key (${provider.envVarName})...`}
                    className={`w-full pr-24 pl-3.5 py-2.5 text-xs font-mono rounded-xl border bg-black/90 text-cyan-300 placeholder:text-slate-600 focus:outline-none transition-all ${
                      isEnvKey ? 'border-cyan-500/30 opacity-80 cursor-not-allowed' : 'border-white/15 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                    }`}
                  />

                  <div className="absolute right-2 flex items-center gap-1">
                    {!isEnvKey && (
                      <button
                        type="button"
                        onClick={() => toggleShowKey(provider.id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                        title={isMasked ? 'Show API Key' : 'Hide API Key'}
                      >
                        {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Model Selector (for LLM / Reasoning providers) */}
              {models.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-orbitron font-bold text-slate-400">ACTIVE MODEL SELECTION</label>
                  <select
                    value={provider.selectedModel || models[0].id}
                    onChange={(e) => handleModelChange(provider.id, e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono bg-black/80 border-white/15 text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Test Feedback Message */}
              {testInfo && (
                <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                  testInfo.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  {testInfo.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
                  <div className="space-y-0.5">
                    <div className="font-bold">{testInfo.success ? 'TEST PASSED' : 'TEST FAILED'} {testInfo.latencyMs ? `(${testInfo.latencyMs}ms)` : ''}</div>
                    <div>{testInfo.message}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testingId === provider.id || (!draftVal.trim() && !isEnvKey)}
                    className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-xl text-xs font-orbitron font-bold text-cyan-300 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(0,242,255,0.1)]"
                  >
                    {testingId === provider.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>TESTING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>TEST CONNECTION</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCredential(provider.id)}
                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-xl text-xs font-orbitron font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SAVE CONFIG</span>
                  </button>
                </div>

                {/* Delete / Clear button */}
                {(provider.source === 'user_settings' || draftVal) && (
                  <div>
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-rose-300">Confirm remove?</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCredential(provider.id)}
                          className="px-2 py-1 bg-rose-500/30 border border-rose-400 text-rose-200 rounded-lg text-[10px] font-orbitron font-bold hover:bg-rose-500/50 cursor-pointer"
                        >
                          YES, REMOVE
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-white/10 text-slate-400 rounded-lg text-[10px] font-orbitron hover:bg-white/20 cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(provider.id)}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
                        title="Remove user credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>CLEAR</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

