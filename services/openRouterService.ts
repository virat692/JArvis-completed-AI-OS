export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.0-flash-lite-001';

export const AVAILABLE_OPENROUTER_MODELS = [
  { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite (Fastest)' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (OpenRouter)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 Chat' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct' }
];

export async function sendOpenRouterRequest(params: {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userMessage: string;
  inlineFiles?: { data: string; mimeType: string }[];
  onChunk?: (chunkText: string) => void;
}): Promise<string> {
  const { apiKey, model = DEFAULT_OPENROUTER_MODEL, systemPrompt, userMessage, inlineFiles, onChunk } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error("OpenRouter API Key is missing. Please set your OpenRouter key in System Config.");
  }

  // Construct content array or text
  let userContent: any = userMessage;

  if (inlineFiles && inlineFiles.length > 0) {
    userContent = [{ type: 'text', text: userMessage || 'Analyze attached file payload.' }];
    for (const file of inlineFiles) {
      if (file.mimeType.startsWith('image/')) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimeType};base64,${file.data}`
          }
        });
      } else {
        userContent.push({
          type: 'text',
          text: `[Attached file payload (${file.mimeType})]`
        });
      }
    }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  const payload = {
    model,
    messages,
    temperature: 0.7,
    stream: true
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev.run.app',
      'X-Title': 'JARVIS AI OS Dual Failover',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const errDesc = errorJson?.error?.message || response.statusText || `HTTP ${response.status}`;
    throw new Error(`OpenRouter API error (${response.status}): ${errDesc}`);
  }

  if (!response.body) {
    const fullJson = await response.json();
    return fullJson.choices?.[0]?.message?.content || "Operation completed via OpenRouter.";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullResponse = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') break;

      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const textChunk = json.choices?.[0]?.delta?.content || '';
          if (textChunk) {
            fullResponse += textChunk;
            if (onChunk) onChunk(fullResponse);
          }
        } catch (e) {
          // ignore stream parse chunk glitches
        }
      }
    }
  }

  return fullResponse || "Operation completed via OpenRouter Neural Link.";
}

export async function testOpenRouterKey(apiKey: string, model: string = DEFAULT_OPENROUTER_MODEL): Promise<boolean> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}
