/**
 * JARVIS Neural Search & Web Intelligence Engine
 * Interfaces with Tavily Search API and Exa (Metaphor) Neural Index
 * using environment variables (TAVILY_API_KEY, EXA_API_KEY) with zero credential leakage.
 */

import { eventBus } from './eventBus';
import { credentialManager } from './credentialManager';

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
  author?: string;
  provider: 'tavily' | 'exa' | 'fallback';
}

export interface SearchResponsePayload {
  query: string;
  answer?: string;
  results: SearchResultItem[];
  providerUsed: 'tavily' | 'exa' | 'hybrid' | 'none';
  latencyMs: number;
  success: boolean;
  message?: string;
}

export class NeuralSearchEngine {
  /**
   * Safely retrieves credentials from credentialManager or environment variables without exposing them.
   */
  private getTavilyKey(): string | null {
    const mgrKey = credentialManager.getKey('tavily');
    if (mgrKey && mgrKey.trim()) return mgrKey.trim();

    const key = (typeof process !== 'undefined' && process.env?.TAVILY_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TAVILY_API_KEY) ||
      '';
    return key && key.trim() ? key.trim() : null;
  }

  private getExaKey(): string | null {
    const mgrKey = credentialManager.getKey('exa');
    if (mgrKey && mgrKey.trim()) return mgrKey.trim();

    const key = (typeof process !== 'undefined' && process.env?.EXA_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_EXA_API_KEY) ||
      '';
    return key && key.trim() ? key.trim() : null;
  }

  public hasTavilyCredential(): boolean {
    return !!this.getTavilyKey();
  }

  public hasExaCredential(): boolean {
    return !!this.getExaKey();
  }

  /**
   * Search via Tavily AI Index
   */
  public async searchTavily(
    query: string, 
    options?: { searchDepth?: 'basic' | 'advanced'; maxResults?: number; includeAnswer?: boolean }
  ): Promise<SearchResponsePayload> {
    const apiKey = this.getTavilyKey();
    const startTime = Date.now();

    if (!apiKey) {
      return {
        query,
        results: [],
        providerUsed: 'none',
        latencyMs: 0,
        success: false,
        message: 'Tavily credential not configured in environment (TAVILY_API_KEY).'
      };
    }

    try {
      eventBus.emit('logger.entry', {
        source: 'NEURAL_SEARCH',
        message: `⌬ Querying Tavily AI Web Index for: "${query.substring(0, 40)}${query.length > 40 ? '...' : ''}"`,
        type: 'info'
      });

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: options?.searchDepth || 'advanced',
          include_answer: options?.includeAnswer ?? true,
          include_raw_content: false,
          max_results: options?.maxResults || 5
        })
      });

      if (!response.ok) {
        throw new Error(`Tavily API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResultItem[] = (data.results || []).map((r: any) => ({
        title: r.title || 'Untitled Result',
        url: r.url || '',
        snippet: r.content || r.snippet || '',
        score: r.score,
        provider: 'tavily'
      }));

      const latencyMs = Date.now() - startTime;

      eventBus.emit('logger.entry', {
        source: 'NEURAL_SEARCH',
        message: `✓ Tavily search completed (${results.length} sources found in ${latencyMs}ms)`,
        type: 'success'
      });

      return {
        query,
        answer: data.answer,
        results,
        providerUsed: 'tavily',
        latencyMs,
        success: true
      };
    } catch (err: any) {
      const sanitizedErr = String(err?.message || err).replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]');
      return {
        query,
        results: [],
        providerUsed: 'none',
        latencyMs: Date.now() - startTime,
        success: false,
        message: `Tavily search failure: ${sanitizedErr}`
      };
    }
  }

  /**
   * Search via Exa Neural Semantic Index
   */
  public async searchExa(
    query: string, 
    options?: { numResults?: number; useAutoprompt?: boolean }
  ): Promise<SearchResponsePayload> {
    const apiKey = this.getExaKey();
    const startTime = Date.now();

    if (!apiKey) {
      return {
        query,
        results: [],
        providerUsed: 'none',
        latencyMs: 0,
        success: false,
        message: 'Exa credential not configured in environment (EXA_API_KEY).'
      };
    }

    try {
      eventBus.emit('logger.entry', {
        source: 'NEURAL_SEARCH',
        message: `⌬ Querying Exa Semantic Index for: "${query.substring(0, 40)}${query.length > 40 ? '...' : ''}"`,
        type: 'info'
      });

      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          query,
          useAutoprompt: options?.useAutoprompt ?? true,
          numResults: options?.numResults || 5,
          contents: {
            text: {
              maxCharacters: 1200
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Exa API responded with status ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResultItem[] = (data.results || []).map((r: any) => ({
        title: r.title || 'Untitled Document',
        url: r.url || '',
        snippet: r.text || r.snippet || '',
        score: r.score,
        publishedDate: r.publishedDate,
        author: r.author,
        provider: 'exa'
      }));

      const latencyMs = Date.now() - startTime;

      eventBus.emit('logger.entry', {
        source: 'NEURAL_SEARCH',
        message: `✓ Exa Semantic search completed (${results.length} documents found in ${latencyMs}ms)`,
        type: 'success'
      });

      return {
        query,
        results,
        providerUsed: 'exa',
        latencyMs,
        success: true
      };
    } catch (err: any) {
      const sanitizedErr = String(err?.message || err).replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]');
      return {
        query,
        results: [],
        providerUsed: 'none',
        latencyMs: Date.now() - startTime,
        success: false,
        message: `Exa search failure: ${sanitizedErr}`
      };
    }
  }

  /**
   * Unified Research & Deep Search (Priority: Tavily -> Exa -> Failover)
   */
  public async unifiedSearch(query: string, maxResults: number = 5): Promise<SearchResponsePayload> {
    // 1. Try Tavily First if configured
    if (this.hasTavilyCredential()) {
      const tavilyRes = await this.searchTavily(query, { maxResults });
      if (tavilyRes.success && tavilyRes.results.length > 0) {
        return tavilyRes;
      }
    }

    // 2. Try Exa as secondary or primary if Tavily is unavailable
    if (this.hasExaCredential()) {
      const exaRes = await this.searchExa(query, { numResults: maxResults });
      if (exaRes.success && exaRes.results.length > 0) {
        return exaRes;
      }
    }

    return {
      query,
      results: [],
      providerUsed: 'none',
      latencyMs: 0,
      success: false,
      message: 'No external search providers available or all search queries returned empty.'
    };
  }
}

export const neuralSearchEngine = new NeuralSearchEngine();
