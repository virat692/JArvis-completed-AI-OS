export interface ProviderModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsReasoning: boolean;
  recommendedFor: string[];
}

export interface AIProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  images?: string[];
}

export interface AIProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  stream?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
  tools?: any[];
  signal?: AbortSignal;
}

export interface StandardizedUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface StandardizedAIResponse {
  id: string;
  provider: string;
  model: string;
  text: string;
  reasoningText?: string;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
  usage: StandardizedUsage;
  latencyMs: number;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
  }>;
  rawResponse?: any;
}

export interface ProviderHealthStatus {
  provider: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNCONFIGURED';
  latencyMs: number;
  lastChecked: number;
  errorMessage?: string;
}

export interface NemotronTaskRequest {
  taskId: string;
  taskType: 'architecture_analysis' | 'code_analysis' | 'complex_reasoning' | 'debugging' | 'large_context' | 'verification';
  userObjective: string;
  relevantContext?: string;
  relevantFiles?: Array<{ path: string; content: string; language?: string }>;
  relevantCode?: string;
  relevantDocuments?: string[];
  previousResult?: string;
  iteration?: number;
  maxIterations?: number;
  requestedOutputFormat?: 'structured_report' | 'code_solution' | 'diagnostic_fix' | 'architectural_plan' | 'summary';
  constraints?: string[];
}

export interface NemotronTaskResult {
  taskId: string;
  success: boolean;
  taskType: string;
  rawText: string;
  summary: string;
  findings?: string[];
  recommendations?: string[];
  codeSolution?: {
    filename?: string;
    code: string;
    language: string;
    explanation?: string;
  };
  iteration: number;
  isComplete: boolean;
  needsAdditionalAnalysis?: boolean;
  followUpReason?: string;
  usage?: StandardizedUsage;
  latencyMs: number;
  error?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  
  initialize(): Promise<void>;
  generate(prompt: string, options?: AIProviderOptions): Promise<StandardizedAIResponse>;
  stream(prompt: string, onChunk: (chunk: string) => void, options?: AIProviderOptions): Promise<StandardizedAIResponse>;
  chat(messages: AIProviderMessage[], options?: AIProviderOptions): Promise<StandardizedAIResponse>;
  vision?(prompt: string, images: string[], options?: AIProviderOptions): Promise<StandardizedAIResponse>;
  embeddings?(text: string): Promise<number[]>;
  healthCheck(): Promise<ProviderHealthStatus>;
  getModelInfo(): ProviderModelInfo;
  toolCalling?(messages: AIProviderMessage[], tools: any[], options?: AIProviderOptions): Promise<StandardizedAIResponse>;
  cancelRequest?(requestId: string): void;
  estimateTokens(text: string): number;
}
