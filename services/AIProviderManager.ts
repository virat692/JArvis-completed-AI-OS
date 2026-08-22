import { 
  AIProvider, 
  AIProviderOptions, 
  AIProviderMessage, 
  StandardizedAIResponse, 
  ProviderHealthStatus 
} from '../interfaces/AIProvider';

import { GeminiProvider } from '../providers/GeminiProvider';
import { NemotronProvider } from '../providers/NemotronProvider';
import { OpenRouterProvider } from '../providers/OpenRouterProvider';
import providerConfig from '../config/providers.json';
import { eventBus } from './eventBus';

export type TaskCategory = 
  | 'generalChat' 
  | 'complexReasoning' 
  | 'coding' 
  | 'debugging' 
  | 'vision' 
  | 'research' 
  | 'translation';

export interface ProviderMetrics {
  requestsCompleted: number;
  tokensUsed: number;
  averageLatencyMs: number;
  lastLatencyMs: number;
  errorCount: number;
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProviderId: string = 'gemini';
  private healthStatuses: Map<string, ProviderHealthStatus> = new Map();
  private metrics: Map<string, ProviderMetrics> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.registerProviders();
    this.activeProviderId = providerConfig.defaultProvider || 'gemini';
    this.startHealthChecks();
  }

  private registerProviders() {
    const pGemini = new GeminiProvider();
    const pNemotron = new NemotronProvider();
    const pOpenRouter = new OpenRouterProvider();

    this.providers.set(pGemini.id, pGemini);
    this.providers.set(pNemotron.id, pNemotron);
    this.providers.set(pOpenRouter.id, pOpenRouter);

    this.providers.forEach((_, id) => {
      this.metrics.set(id, {
        requestsCompleted: 0,
        tokensUsed: 0,
        averageLatencyMs: 0,
        lastLatencyMs: 0,
        errorCount: 0
      });
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getActiveProviderId(): string {
    return this.activeProviderId;
  }

  public getActiveProvider(): AIProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('gemini')!;
  }

  public setActiveProvider(id: string): void {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      eventBus.emit('ai_provider.changed', { activeProviderId: id });
      this.notify();
    }
  }

  public getHealthStatus(id: string): ProviderHealthStatus | undefined {
    return this.healthStatuses.get(id);
  }

  public getAllHealthStatuses(): ProviderHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  public getMetrics(id: string): ProviderMetrics | undefined {
    return this.metrics.get(id);
  }

  public async runHealthCheckAll(): Promise<ProviderHealthStatus[]> {
    const results: ProviderHealthStatus[] = [];
    for (const [id, provider] of this.providers.entries()) {
      const status = await provider.healthCheck();
      this.healthStatuses.set(id, status);
      results.push(status);
    }
    this.notify();
    return results;
  }

  /**
   * Classifies user prompt into a task category.
   * Deep reasoning / complex architecture -> complexReasoning (delegated to Nemotron when configured)
   * Coding / General / Vision -> Gemini
   */
  public detectTaskCategory(prompt: string, hasFiles: boolean = false): TaskCategory {
    if (hasFiles) return 'vision';
    
    const lower = prompt.toLowerCase();
    
    // Explicit keywords for deep complex reasoning & architecture
    if (
      lower.includes('deep reasoning') ||
      lower.includes('system architecture') ||
      lower.includes('math proof') ||
      lower.includes('nemotron') ||
      lower.includes('multi-step plan') ||
      lower.includes('distributed consensus') ||
      lower.includes('formal verification')
    ) {
      return 'complexReasoning';
    }

    if (
      lower.includes('write code') ||
      lower.includes('function') ||
      lower.includes('typescript') ||
      lower.includes('javascript') ||
      lower.includes('python') ||
      lower.includes('refactor') ||
      lower.includes('debug') ||
      lower.includes('syntax') ||
      lower.includes('algorithm')
    ) {
      return 'coding';
    }

    if (
      lower.includes('research') ||
      lower.includes('comprehensive review') ||
      lower.includes('literature review')
    ) {
      return 'research';
    }

    if (lower.includes('translate') || lower.includes('translation')) {
      return 'translation';
    }

    return 'generalChat';
  }

  /**
   * Intelligently routes tasks to the appropriate provider:
   * - Deep reasoning -> Nemotron (if ONLINE/DEGRADED), else fallback to Gemini
   * - General / Coding / Vision -> Gemini
   */
  public getProviderForTask(task: TaskCategory): AIProvider {
    if (task === 'complexReasoning') {
      const nemotron = this.providers.get('nemotron');
      const health = this.healthStatuses.get('nemotron');
      if (nemotron && (health?.status === 'ONLINE' || health?.status === 'DEGRADED')) {
        return nemotron;
      }
    }
    return this.getActiveProvider();
  }

  private recordUsage(providerId: string, latencyMs: number, tokens: number, isError: boolean = false) {
    const m = this.metrics.get(providerId) || {
      requestsCompleted: 0,
      tokensUsed: 0,
      averageLatencyMs: 0,
      lastLatencyMs: 0,
      errorCount: 0
    };

    if (!isError) {
      m.requestsCompleted += 1;
      m.tokensUsed += tokens;
      m.lastLatencyMs = latencyMs;
      m.averageLatencyMs = Math.round((m.averageLatencyMs * (m.requestsCompleted - 1) + latencyMs) / m.requestsCompleted);
    } else {
      m.errorCount += 1;
    }

    this.metrics.set(providerId, m);
    this.notify();
  }

  /**
   * Generates response with automatic retries and fallback handling.
   * Primary (Gemini) -> OpenRouter Failover -> Nemotron
   */
  public async generateWithFallback(
    prompt: string, 
    preferredProviderId?: string, 
    options?: AIProviderOptions
  ): Promise<StandardizedAIResponse> {
    const primaryId = preferredProviderId || this.activeProviderId;
    const fallbackList = [primaryId, ...providerConfig.fallbackOrder.filter(id => id !== primaryId)];

    for (const pId of fallbackList) {
      const provider = this.providers.get(pId);
      if (!provider) continue;

      try {
        const response = await provider.generate(prompt, options);
        this.recordUsage(pId, response.latencyMs, response.usage.totalTokens);
        return response;
      } catch (err: any) {
        this.recordUsage(pId, 0, 0, true);
        console.warn(`[AIProviderManager] Provider ${pId} failed. Trying next fallback...`, err);
      }
    }

    // Ultimate fallback to Gemini core
    const fallbackProvider = this.providers.get('gemini') || this.getActiveProvider();
    const fallbackRes = await fallbackProvider.generate(prompt, options);
    this.recordUsage(fallbackProvider.id, fallbackRes.latencyMs, fallbackRes.usage.totalTokens);
    return fallbackRes;
  }

  /**
   * Stream response with task routing or active provider
   */
  public async streamWithTask(
    task: TaskCategory,
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: AIProviderOptions
  ): Promise<StandardizedAIResponse> {
    const provider = this.getProviderForTask(task);
    try {
      const response = await provider.stream(prompt, onChunk, options);
      this.recordUsage(provider.id, response.latencyMs, response.usage.totalTokens);
      return response;
    } catch (err) {
      // Automatic failover to OpenRouter or Gemini
      return this.generateWithFallback(prompt, 'gemini', options);
    }
  }

  private startHealthChecks() {
    this.runHealthCheckAll().catch(() => {});
    setInterval(() => {
      this.runHealthCheckAll().catch(() => {});
    }, 60000);
  }
}

export const aiProviderManager = new AIProviderManager();
