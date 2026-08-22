import { AIModelRoute } from '../types';
import { eventBus } from '../services/eventBus';

const STORAGE_ROUTES_KEY = 'jarvis_neural_model_routes_v3';

const DEFAULT_ROUTES: AIModelRoute[] = [
  {
    id: 'gemini_3_6_flash',
    name: 'Gemini 3.6 Flash (Primary Native Core)',
    provider: 'gemini',
    contextLimit: '1.0M Tokens',
    latencyScore: 'ULTRA_FAST',
    costPer1kTokens: '$0.000075',
    recommendedFor: ['Real-time Chat', 'Voice Synthesis', 'Fast Tool Calls', 'Multimodal Vision'],
    active: true
  },
  {
    id: 'gemini_2_5_pro',
    name: 'Gemini 2.5 Pro (Deep Architecture & Reasoning)',
    provider: 'gemini',
    contextLimit: '2.0M Tokens',
    latencyScore: 'HIGH_REASONING',
    costPer1kTokens: '$0.00125',
    recommendedFor: ['Complex Architecture', 'System Refactoring', 'Deep Factual Synthesis'],
    active: true
  },
  {
    id: 'nvidia_nemotron_4_340b',
    name: 'NVIDIA Nemotron 4 340B (Dedicated Reasoning Backend)',
    provider: 'nemotron',
    contextLimit: '128K Tokens',
    latencyScore: 'HIGH_REASONING',
    costPer1kTokens: '$0.00040',
    recommendedFor: ['Multi-Step Logic', 'Code Architecture', 'Logic Auditing', 'Deep Math Proofs'],
    active: true
  },
  {
    id: 'openrouter_gemini_flash_lite',
    name: 'Gemini 2.0 Flash Lite (OpenRouter Failover)',
    provider: 'openrouter',
    contextLimit: '1.0M Tokens',
    latencyScore: 'ULTRA_FAST',
    costPer1kTokens: '$0.000075',
    recommendedFor: ['Automated Failover', 'Zero-Downtime Backup', 'Quota Recovery'],
    active: true
  },
  {
    id: 'openrouter_llama_3_3',
    name: 'Llama 3.3 70B Instruct (OpenRouter)',
    provider: 'openrouter',
    contextLimit: '128K Tokens',
    latencyScore: 'ULTRA_FAST',
    costPer1kTokens: '$0.00012',
    recommendedFor: ['General Q&A', 'Light Task Dispatch', 'Fast Formatting'],
    active: false
  },
  {
    id: 'openrouter_qwen_2_5',
    name: 'Qwen 2.5 72B Instruct (OpenRouter)',
    provider: 'openrouter',
    contextLimit: '128K Tokens',
    latencyScore: 'BALANCED',
    costPer1kTokens: '$0.00035',
    recommendedFor: ['Code Generation Backup', 'Algorithm Translation'],
    active: false
  }
];

export class NeuralRouter {
  private routes: AIModelRoute[] = [];
  private listeners: Array<() => void> = [];
  private cachedRoutes: AIModelRoute[] = [];

  constructor() {
    this.loadFromStorage();
    this.updateCache();
  }

  private updateCache() {
    this.cachedRoutes = this.routes;
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_ROUTES_KEY);
      if (saved) {
        this.routes = JSON.parse(saved);
      } else {
        this.routes = DEFAULT_ROUTES;
      }
    } catch {
      this.routes = DEFAULT_ROUTES;
    }
    this.updateCache();
  }

  private saveToStorage() {
    this.updateCache();
    try {
      localStorage.setItem(STORAGE_ROUTES_KEY, JSON.stringify(this.routes));
    } catch (e) {
      console.warn('NeuralRouter save error:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getRoutes(): AIModelRoute[] {
    return this.cachedRoutes;
  }

  public toggleRoute(id: string) {
    const route = this.routes.find(r => r.id === id);
    if (!route) return;
    route.active = !route.active;
    this.saveToStorage();

    eventBus.emit('router.route_toggled', { id, name: route.name, active: route.active });
  }

  public selectOptimalModel(taskType: 'FAST' | 'REASONING' | 'CODE' | 'CREATIVE'): AIModelRoute {
    const activeRoutes = this.routes.filter(r => r.active);
    if (activeRoutes.length === 0) return DEFAULT_ROUTES[0];

    if (taskType === 'CODE' || taskType === 'REASONING') {
      const nemotronRoute = activeRoutes.find(r => r.provider === 'nemotron');
      if (nemotronRoute) return nemotronRoute;
      return activeRoutes.find(r => r.latencyScore === 'HIGH_REASONING') || activeRoutes[0];
    }
    if (taskType === 'FAST') {
      const fastRoute = activeRoutes.find(r => r.provider === 'gemini' && r.latencyScore === 'ULTRA_FAST');
      if (fastRoute) return fastRoute;
      return activeRoutes.find(r => r.latencyScore === 'ULTRA_FAST') || activeRoutes[0];
    }

    return activeRoutes[0];
  }

  public resetToDefault() {
    this.routes = DEFAULT_ROUTES;
    this.saveToStorage();
  }
}

export const neuralRouter = new NeuralRouter();
