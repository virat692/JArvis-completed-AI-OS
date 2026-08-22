import { 
  AIProvider, 
  AIProviderOptions, 
  AIProviderMessage, 
  StandardizedAIResponse, 
  ProviderHealthStatus, 
  ProviderModelInfo 
} from '../interfaces/AIProvider';
import { credentialManager } from '../services/credentialManager';
import { sendOpenRouterRequest, DEFAULT_OPENROUTER_MODEL } from '../services/openRouterService';

export class OpenRouterProvider implements AIProvider {
  public id = 'openrouter';
  public name = 'OpenRouter Backup & Failover';
  
  private apiKey: string = '';
  private defaultModel: string = DEFAULT_OPENROUTER_MODEL;

  constructor() {
    this.refreshKey();
  }

  private refreshKey() {
    this.apiKey = credentialManager.getKey('openrouter') || 
      (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) || 
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_OPENROUTER_API_KEY) || 
      '';
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public setModel(model: string): void {
    this.defaultModel = model;
  }

  public async initialize(): Promise<void> {
    this.refreshKey();
  }

  public getModelInfo(): ProviderModelInfo {
    return {
      id: this.defaultModel,
      name: 'OpenRouter Intelligent Failover',
      provider: 'OpenRouter',
      contextWindow: 128000,
      maxOutputTokens: 8192,
      supportsVision: true,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      recommendedFor: ['Automated Failover', 'Quota Recovery', 'Multi-Model Inference']
    };
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.8);
  }

  public async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now();
    this.refreshKey();
    
    try {
      if (!this.apiKey) {
        return {
          provider: this.id,
          status: 'UNCONFIGURED',
          latencyMs: 0,
          lastChecked: Date.now(),
          errorMessage: 'OPENROUTER_API_KEY is not configured.'
        };
      }

      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${this.apiKey.trim()}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev.run.app',
          'X-Title': 'JARVIS Provider Health Check'
        }
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return { provider: this.id, status: 'ONLINE', latencyMs, lastChecked: Date.now() };
      } else if (res.status === 401 || res.status === 403) {
        return {
          provider: this.id,
          status: 'OFFLINE',
          latencyMs,
          lastChecked: Date.now(),
          errorMessage: 'Invalid OpenRouter API Key.'
        };
      } else {
        return {
          provider: this.id,
          status: 'DEGRADED',
          latencyMs,
          lastChecked: Date.now(),
          errorMessage: `OpenRouter endpoint HTTP ${res.status}`
        };
      }
    } catch (err: any) {
      return {
        provider: this.id,
        status: 'OFFLINE',
        latencyMs: Date.now() - startTime,
        lastChecked: Date.now(),
        errorMessage: err?.message || 'Network unreachable'
      };
    }
  }

  public async generate(prompt: string, options?: AIProviderOptions): Promise<StandardizedAIResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  public async stream(
    prompt: string, 
    onChunk: (chunk: string) => void, 
    options?: AIProviderOptions
  ): Promise<StandardizedAIResponse> {
    const startTime = Date.now();
    this.refreshKey();

    if (!this.apiKey) {
      throw new Error("Sir, OpenRouter API key is required for failover inference. Please configure it in Settings → AI Providers → OpenRouter.");
    }

    const model = options?.model || this.defaultModel;
    const systemPrompt = options?.systemPrompt || "You are JARVIS AI OS, an advanced autonomous operating intelligence. Be precise, articulate, and helpful.";

    const text = await sendOpenRouterRequest({
      apiKey: this.apiKey,
      model,
      systemPrompt,
      userMessage: prompt,
      onChunk
    });

    const latencyMs = Date.now() - startTime;
    const estTokens = this.estimateTokens(prompt + text);

    return {
      id: `openrouter-${Date.now()}`,
      provider: 'OpenRouter',
      model,
      text,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(prompt),
        completionTokens: this.estimateTokens(text),
        totalTokens: estTokens
      },
      latencyMs
    };
  }

  public async chat(messages: AIProviderMessage[], options?: AIProviderOptions): Promise<StandardizedAIResponse> {
    const startTime = Date.now();
    this.refreshKey();

    if (!this.apiKey) {
      throw new Error("Sir, OpenRouter API key is required for failover inference. Please configure it in Settings → AI Providers → OpenRouter.");
    }

    const model = options?.model || this.defaultModel;
    const lastMsg = messages[messages.length - 1]?.content || '';
    const systemMsg = messages.find(m => m.role === 'system')?.content || "You are JARVIS AI OS. Respond accurately and concisely.";

    const text = await sendOpenRouterRequest({
      apiKey: this.apiKey,
      model,
      systemPrompt: systemMsg,
      userMessage: lastMsg
    });

    const latencyMs = Date.now() - startTime;
    const estTokens = this.estimateTokens(lastMsg + text);

    return {
      id: `openrouter-chat-${Date.now()}`,
      provider: 'OpenRouter',
      model,
      text,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(lastMsg),
        completionTokens: this.estimateTokens(text),
        totalTokens: estTokens
      },
      latencyMs
    };
  }
}
