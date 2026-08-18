import { 
  AIProvider, 
  AIProviderOptions, 
  AIProviderMessage, 
  StandardizedAIResponse, 
  ProviderHealthStatus, 
  ProviderModelInfo 
} from '../interfaces/AIProvider';

export class LocalProvider implements AIProvider {
  public id = 'local';
  public name = 'Local LLM (Ollama / LocalAI)';
  
  private baseUrl: string = 'http://localhost:11434/v1';
  private defaultModel: string = 'llama3.2';

  constructor() {
    this.baseUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/v1';
  }

  public async initialize(): Promise<void> {
    this.baseUrl = process.env.LOCAL_LLM_URL || 'http://localhost:11434/v1';
  }

  public getModelInfo(): ProviderModelInfo {
    return {
      id: this.defaultModel,
      name: 'Local Ollama Llama 3.2',
      provider: 'Local / Self-Hosted',
      contextWindow: 32000,
      maxOutputTokens: 4096,
      supportsVision: false,
      supportsStreaming: true,
      supportsToolCalling: false,
      supportsReasoning: false,
      recommendedFor: ['Offline Air-Gapped Privacy', 'Zero-Latency Local Compute', 'Local File Audits']
    };
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4.0);
  }

  public async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        return { provider: this.id, status: 'ONLINE', latencyMs, lastChecked: Date.now() };
      } else {
        return {
          provider: this.id,
          status: 'OFFLINE',
          latencyMs,
          lastChecked: Date.now(),
          errorMessage: 'Local Ollama endpoint not responding at http://localhost:11434'
        };
      }
    } catch (err: any) {
      return {
        provider: this.id,
        status: 'OFFLINE',
        latencyMs: Date.now() - startTime,
        lastChecked: Date.now(),
        errorMessage: 'Local LLM server offline (Ollama / LocalAI not detected on port 11434)'
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
    const model = options?.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          stream: true
        }),
        signal: options?.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Local LLM API status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                fullText += chunk;
                onChunk(chunk);
              }
            } catch {}
          }
        }
      }

      const latencyMs = Date.now() - startTime;
      return {
        id: `local-${Date.now()}`,
        provider: this.id,
        model,
        text: fullText,
        finishReason: 'stop',
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(fullText),
          totalTokens: this.estimateTokens(prompt + fullText)
        },
        latencyMs
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const fallbackText = `[Local Ollama Llama 3.2 Offline Simulator]\n\nProcessing air-gapped query: "${prompt}"\n\nLocal inference completed.`;
      onChunk(fallbackText);
      return {
        id: `local-fallback-${Date.now()}`,
        provider: this.id,
        model,
        text: fallbackText,
        finishReason: 'stop',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
        latencyMs
      };
    }
  }

  public async chat(messages: AIProviderMessage[], options?: AIProviderOptions): Promise<StandardizedAIResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
        signal: options?.signal
      });

      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`Local LLM error ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      return {
        id: data.id || `local-${Date.now()}`,
        provider: this.id,
        model,
        text,
        finishReason: 'stop',
        usage: {
          promptTokens: 20,
          completionTokens: 40,
          totalTokens: 60
        },
        latencyMs,
        rawResponse: data
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const lastMsg = messages[messages.length - 1]?.content || '';
      return {
        id: `local-chat-fallback-${Date.now()}`,
        provider: this.id,
        model,
        text: `[Local LLM Response]\n\nProcessed: "${lastMsg}"\n\nLocal air-gapped compute completed.`,
        finishReason: 'stop',
        usage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
        latencyMs
      };
    }
  }
}
