import { 
  AIProvider, 
  AIProviderOptions, 
  AIProviderMessage, 
  StandardizedAIResponse, 
  ProviderHealthStatus, 
  ProviderModelInfo,
  NemotronTaskRequest,
  NemotronTaskResult
} from '../interfaces/AIProvider';

export class NemotronProvider implements AIProvider {
  public id = 'nemotron';
  public name = 'NVIDIA Nemotron Ultra';
  
  private apiKey: string = '';
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private defaultModel: string = 'nvidia/nemotron-4-340b-instruct';

  constructor() {
    this.apiKey = process.env.NEMOTRON_API_KEY || process.env.OPENROUTER_API_KEY || '';
  }

  public async initialize(): Promise<void> {
    this.apiKey = process.env.NEMOTRON_API_KEY || process.env.OPENROUTER_API_KEY || '';
  }

  public getModelInfo(): ProviderModelInfo {
    return {
      id: this.defaultModel,
      name: 'NVIDIA Nemotron 4 340B Ultra',
      provider: 'NVIDIA',
      contextWindow: 128000,
      maxOutputTokens: 8192,
      supportsVision: false,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsReasoning: true,
      recommendedFor: ['Complex Reasoning', 'Code Generation', 'Architectural Debugging', 'Deep Math']
    };
  }

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.8);
  }

  public async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now();
    try {
      if (!this.apiKey) {
        return {
          provider: this.id,
          status: 'UNCONFIGURED',
          latencyMs: 0,
          lastChecked: Date.now(),
          errorMessage: 'NEMOTRON_API_KEY / OPENROUTER_API_KEY is not configured.'
        };
      }

      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });

      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        return { provider: this.id, status: 'ONLINE', latencyMs, lastChecked: Date.now() };
      } else {
        return {
          provider: this.id,
          status: 'DEGRADED',
          latencyMs,
          lastChecked: Date.now(),
          errorMessage: `NVIDIA Nemotron endpoint HTTP ${res.status}`
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
    const model = options?.model || this.defaultModel;

    const messages = [
      ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      { role: 'user', content: prompt }
    ];

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://jarvis.ai.studio',
          'X-Title': 'JARVIS Apex OS Nemotron Engine'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          stream: true
        }),
        signal: options?.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Nemotron stream failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let reasoningText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                fullText += delta.content;
                onChunk(delta.content);
              }
              if (delta?.reasoning_content) {
                reasoningText += delta.reasoning_content;
              }
            } catch {
              // Parse error on incomplete SSE frame ignored
            }
          }
        }
      }

      const latencyMs = Date.now() - startTime;
      return {
        id: `nemotron-${Date.now()}`,
        provider: this.id,
        model,
        text: fullText,
        reasoningText,
        finishReason: 'stop',
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(fullText),
          totalTokens: this.estimateTokens(prompt + fullText)
        },
        latencyMs
      };
    } catch (err: any) {
      // Clean error propagation without mock simulation
      const latencyMs = Date.now() - startTime;
      throw new Error(`Nemotron streaming error (${latencyMs}ms): ${err?.message || 'Network failure'}`);
    }
  }

  public async chat(messages: AIProviderMessage[], options?: AIProviderOptions): Promise<StandardizedAIResponse> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error('NemotronProvider: NEMOTRON_API_KEY / OPENROUTER_API_KEY is not configured');
    }

    const reqMessages = [
      ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://jarvis.ai.studio',
        'X-Title': 'JARVIS Apex OS Nemotron Engine'
      },
      body: JSON.stringify({
        model,
        messages: reqMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: false
      }),
      signal: options?.signal
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Nemotron chat failed: HTTP ${response.status} - ${errText || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const reasoningText = data.choices?.[0]?.message?.reasoning_content;

    return {
      id: data.id || `nemotron-${Date.now()}`,
      provider: this.id,
      model,
      text,
      reasoningText,
      finishReason: data.choices?.[0]?.finish_reason || 'stop',
      usage: {
        promptTokens: data.usage?.prompt_tokens || this.estimateTokens(JSON.stringify(messages)),
        completionTokens: data.usage?.completion_tokens || this.estimateTokens(text),
        totalTokens: data.usage?.total_tokens || this.estimateTokens(JSON.stringify(messages) + text)
      },
      latencyMs,
      rawResponse: data
    };
  }

  public async processTask(
    task: NemotronTaskRequest, 
    options?: AIProviderOptions
  ): Promise<NemotronTaskResult> {
    const startTime = Date.now();

    // Construct a focused system and user prompt for the delegated worker
    const systemPrompt = `You are the NVIDIA Nemotron-4 340B backend reasoning and analysis worker for JARVIS AI OS.
Your objective is to provide deep, rigorous, and logically sound analysis or solutions based exclusively on the task parameters provided.
Do NOT pretend to be an autonomous personality or speak as an independent agent.
Provide direct findings, high-precision code, or architectural diagnostic outputs.`;

    let userPrompt = `TASK TYPE: ${task.taskType}\nOBJECTIVE: ${task.userObjective}\n`;
    
    if (task.relevantContext) {
      userPrompt += `\nRELEVANT CONTEXT:\n${task.relevantContext}\n`;
    }

    if (task.relevantCode) {
      userPrompt += `\nRELEVANT CODE:\n\`\`\`\n${task.relevantCode}\n\`\`\`\n`;
    }

    if (task.relevantFiles && task.relevantFiles.length > 0) {
      userPrompt += `\nRELEVANT FILES:\n`;
      task.relevantFiles.forEach(f => {
        userPrompt += `File: ${f.path}\n\`\`\`${f.language || ''}\n${f.content}\n\`\`\`\n`;
      });
    }

    if (task.previousResult) {
      userPrompt += `\nPREVIOUS ITERATION RESULT / ERRORS TO CORRECT:\n${task.previousResult}\n`;
    }

    if (task.constraints && task.constraints.length > 0) {
      userPrompt += `\nCONSTRAINTS:\n- ${task.constraints.join('\n- ')}\n`;
    }

    if (task.requestedOutputFormat) {
      userPrompt += `\nREQUESTED OUTPUT FORMAT: ${task.requestedOutputFormat}\n`;
    }

    try {
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], options);

      const rawText = response.text || '';
      const summary = rawText.split('\n\n')[0] || rawText.slice(0, 200);

      // Extract code solution if code fences exist
      let codeSolution: NemotronTaskResult['codeSolution'] = undefined;
      const codeMatch = rawText.match(/```(\w+)?\n([\s\S]*?)```/);
      if (codeMatch) {
        codeSolution = {
          language: codeMatch[1] || 'typescript',
          code: codeMatch[2].trim()
        };
      }

      // Check if output indicates further analysis is needed
      const needsMore = rawText.toLowerCase().includes('verification needed') || 
                        rawText.toLowerCase().includes('requires secondary review');

      return {
        taskId: task.taskId,
        success: true,
        taskType: task.taskType,
        rawText,
        summary,
        codeSolution,
        iteration: task.iteration || 1,
        isComplete: !needsMore,
        needsAdditionalAnalysis: needsMore,
        usage: response.usage,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        taskId: task.taskId,
        success: false,
        taskType: task.taskType,
        rawText: `Nemotron Task Delegation Failure: ${err?.message || 'Unknown processing error'}`,
        summary: 'Task processing failed',
        iteration: task.iteration || 1,
        isComplete: true,
        error: err?.message || 'Delegation worker error',
        latencyMs: Date.now() - startTime
      };
    }
  }
}
