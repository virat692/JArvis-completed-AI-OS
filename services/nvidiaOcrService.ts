/**
 * JARVIS NVIDIA NEMOTRON OCR v2 & Intelligent Visual Perception Engine
 * 
 * Primary OCR & Text Extraction Engine for JARVIS.
 * Architecture:
 * SCREEN / IMAGE ➜ CAPTURE + PREPROCESSING ➜ NVIDIA NEMOTRON OCR v2 ➜ TEXT + LAYOUT NORMALIZATION ➜ GEMINI REASONING
 * 
 * Extracts high-precision structured text from:
 * 1. Live computer screen captures & virtual desktops
 * 2. Developer screens: IDE code, terminal output, stack traces, compiler logs
 * 3. Browser screenshots & DOM visual elements
 * 4. Camera frames & optical sensor snapshots
 * 5. Uploaded images, forms, documents, invoices & receipts
 * 
 * Strict Fidelity: Preserves indentation, punctuation, brackets, quotes, symbols, numbers, file paths.
 */

import { credentialManager } from './credentialManager';
import { eventBus } from './eventBus';

export type OcrMergeLevel = 'paragraph' | 'line' | 'word';

export interface OcrBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  polygon?: Array<[number, number]>;
}

export interface OcrTextBlock {
  text: string;
  confidence: number;
  boundingBox?: OcrBoundingBox;
  level?: OcrMergeLevel;
  uncertain?: boolean;
}

export interface OcrResult {
  text: string;
  blocks: OcrTextBlock[];
  sourceType: 'screen' | 'browser' | 'camera' | 'upload' | 'dom_fallback' | 'synthetic';
  provider: 'nvidia_nemotron_ocr_v2' | 'dom_hybrid';
  confidence: number;
  latencyMs: number;
  timestamp: number;
  metadata?: {
    model: string;
    imageWidth?: number;
    imageHeight?: number;
    mergeLevel?: OcrMergeLevel;
    detectedLanguage?: string;
    charCount?: number;
    wordCount?: number;
    rawCount?: number;
    cacheHit?: boolean;
  };
}

export interface OcrExtractionOptions {
  sourceType?: 'screen' | 'browser' | 'camera' | 'upload' | 'dom_fallback';
  mergeLevel?: OcrMergeLevel;
  confidenceThreshold?: number;
  maxDimension?: number;
  skipDomCheck?: boolean;
  model?: string;
}

class NvidiaOcrService {
  private static instance: NvidiaOcrService;
  
  // Official NVIDIA Nemotron OCR v2 endpoints
  public readonly primaryModel = 'nvidia/nemotron-ocr-v2';
  private primaryEndpoint = 'https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2';
  private fallbackEndpoints = [
    'https://ai.api.nvidia.com/v1/ocr',
    'https://ai.api.nvidia.com/v1/cv/nvidia/nemo-retriever-ocr'
  ];

  // In-memory cache for recent image hashes to prevent redundant OCR requests
  private recentOcrCache: Map<string, { result: OcrResult; timestamp: number }> = new Map();
  private maxCacheEntries = 30;
  private cacheTtlMs = 60000; // 60s cache TTL

  private constructor() {}

  public static getInstance(): NvidiaOcrService {
    if (!NvidiaOcrService.instance) {
      NvidiaOcrService.instance = new NvidiaOcrService();
    }
    return NvidiaOcrService.instance;
  }

  /**
   * Retrieves the NVIDIA OCR API Key from CredentialManager
   */
  public getApiKey(): string {
    const key = credentialManager.getKey('nvidia_ocr') || credentialManager.getKey('nemotron');
    return key ? key.trim() : '';
  }

  public hasValidKey(): boolean {
    return this.getApiKey().length > 0;
  }

  /**
   * Converts any image source (File, Blob, HTMLCanvasElement, HTMLVideoElement, Base64) to optimized JPEG base64 Data URI
   * Preserves resolution and sharpness for code, small text, and tables.
   */
  public async prepareImageBase64(
    input: File | Blob | HTMLCanvasElement | HTMLVideoElement | ImageData | string,
    maxDimension: number = 2560
  ): Promise<{ dataUrl: string; base64Raw: string; width: number; height: number }> {
    if (typeof input === 'string' && input.startsWith('data:image/')) {
      const match = input.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
      const base64Raw = match ? match[1] : input.split(',')[1] || input;
      return { dataUrl: input, base64Raw, width: 0, height: 0 };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to create 2D canvas context for OCR image preprocessing.');

    // Enable high quality image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let naturalWidth = 0;
    let naturalHeight = 0;

    if (input instanceof HTMLCanvasElement) {
      naturalWidth = input.width;
      naturalHeight = input.height;
      let targetW = naturalWidth;
      let targetH = naturalHeight;

      if (Math.max(targetW, targetH) > maxDimension) {
        const scale = maxDimension / Math.max(targetW, targetH);
        targetW = Math.round(targetW * scale);
        targetH = Math.round(targetH * scale);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.drawImage(input, 0, 0, targetW, targetH);
    } else if (input instanceof HTMLVideoElement) {
      naturalWidth = input.videoWidth || 1280;
      naturalHeight = input.videoHeight || 720;
      let targetW = naturalWidth;
      let targetH = naturalHeight;

      if (Math.max(targetW, targetH) > maxDimension) {
        const scale = maxDimension / Math.max(targetW, targetH);
        targetW = Math.round(targetW * scale);
        targetH = Math.round(targetH * scale);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.drawImage(input, 0, 0, targetW, targetH);
    } else if (input instanceof File || input instanceof Blob) {
      const bitmap = await createImageBitmap(input);
      naturalWidth = bitmap.width;
      naturalHeight = bitmap.height;
      let targetW = naturalWidth;
      let targetH = naturalHeight;

      if (Math.max(targetW, targetH) > maxDimension) {
        const scale = maxDimension / Math.max(targetW, targetH);
        targetW = Math.round(targetW * scale);
        targetH = Math.round(targetH * scale);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();
    } else if (input instanceof ImageData) {
      naturalWidth = input.width;
      naturalHeight = input.height;
      canvas.width = naturalWidth;
      canvas.height = naturalHeight;
      ctx.putImageData(input, 0, 0);
    }

    // High quality JPEG encoding (0.95) to preserve fine text/code glyphs
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const base64Raw = dataUrl.split(',')[1] || '';

    return {
      dataUrl,
      base64Raw,
      width: canvas.width,
      height: canvas.height
    };
  }

  /**
   * Main OCR Extraction method using NVIDIA Nemotron OCR v2
   */
  public async extractTextFromImage(
    input: File | Blob | HTMLCanvasElement | HTMLVideoElement | ImageData | string,
    options?: OcrExtractionOptions
  ): Promise<OcrResult> {
    const startTime = Date.now();
    const mergeLevel = options?.mergeLevel || 'paragraph';
    const minConfidence = options?.confidenceThreshold ?? 0.2;
    const sourceType = options?.sourceType || 'upload';
    const modelToUse = options?.model || this.primaryModel;

    eventBus.emit('ocr.started', { sourceType, timestamp: startTime, engine: 'NVIDIA_NEMOTRON_OCR_V2' });

    try {
      const { dataUrl, base64Raw, width, height } = await this.prepareImageBase64(input, options?.maxDimension || 2560);

      // Check cache for identical image payload to avoid redundant API load
      const cacheKey = `${base64Raw.substring(0, 128)}_${base64Raw.length}_${mergeLevel}_${modelToUse}`;
      const cached = this.recentOcrCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.cacheTtlMs)) {
        return {
          ...cached.result,
          latencyMs: Date.now() - startTime,
          metadata: {
            ...cached.result.metadata,
            model: modelToUse,
            cacheHit: true
          }
        };
      }

      const apiKey = this.getApiKey();

      // If NVIDIA API key is missing, throw informative error for explicit reporting
      if (!apiKey) {
        throw new Error('NVIDIA Nemotron OCR v2 API Key is not configured in CredentialManager. Please configure NVIDIA_OCR_API_KEY in System Settings.');
      }

      // Prepare official NVIDIA Nemotron OCR v2 payload
      const requestPayload = {
        model: modelToUse,
        input: [dataUrl],
        merge_levels: [mergeLevel]
      };

      let response: Response | null = null;
      let lastError: any = null;

      // Attempt primary Nemotron OCR v2 endpoint first
      try {
        response = await fetch(this.primaryEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });
      } catch (err: any) {
        lastError = err;
      }

      // If primary endpoint returned 404/failure, try fallback endpoints
      if (!response || !response.ok) {
        for (const fbEndpoint of this.fallbackEndpoints) {
          try {
            const fbRes = await fetch(fbEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              },
              body: JSON.stringify(requestPayload)
            });
            if (fbRes.ok) {
              response = fbRes;
              break;
            }
          } catch (fbErr: any) {
            lastError = fbErr;
          }
        }
      }

      if (!response || !response.ok) {
        const errorStatus = response?.status || 500;
        const errorBody = response ? await response.text().catch(() => '') : '';
        throw new Error(`NVIDIA Nemotron OCR v2 API error (HTTP ${errorStatus}): ${errorBody || lastError?.message || response?.statusText || 'Endpoint unreachable'}`);
      }

      const responseJson = await response.json();
      const normalized = this.normalizeNvidiaResponse(responseJson, {
        width,
        height,
        mergeLevel,
        minConfidence,
        sourceType,
        startTime,
        model: modelToUse
      });

      // Store in memory cache
      if (this.recentOcrCache.size >= this.maxCacheEntries) {
        const oldestKey = this.recentOcrCache.keys().next().value;
        if (oldestKey) this.recentOcrCache.delete(oldestKey);
      }
      this.recentOcrCache.set(cacheKey, { result: normalized, timestamp: Date.now() });

      eventBus.emit('ocr.completed', {
        sourceType,
        wordCount: normalized.metadata?.wordCount || 0,
        latencyMs: normalized.latencyMs,
        confidence: normalized.confidence,
        engine: 'NVIDIA_NEMOTRON_OCR_V2'
      });

      return normalized;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      eventBus.emit('ocr.error', {
        sourceType,
        error: err?.message || 'Unknown OCR failure',
        latencyMs,
        engine: 'NVIDIA_NEMOTRON_OCR_V2'
      });
      throw err;
    }
  }

  /**
   * Normalizes NVIDIA Nemotron OCR v2 JSON output into standard JARVIS structure
   * Preserves exact character structure, indentation, punctuation, brackets, quotes.
   */
  private normalizeNvidiaResponse(
    rawJson: any,
    ctx: {
      width: number;
      height: number;
      mergeLevel: OcrMergeLevel;
      minConfidence: number;
      sourceType: OcrResult['sourceType'];
      startTime: number;
      model: string;
    }
  ): OcrResult {
    const blocks: OcrTextBlock[] = [];
    const textPieces: string[] = [];

    // Parse NVIDIA Nemotron OCR outputs
    let detections: any[] = [];
    if (Array.isArray(rawJson)) {
      detections = rawJson[0]?.text_detections || rawJson[0]?.detections || rawJson;
    } else if (rawJson?.data && Array.isArray(rawJson.data)) {
      detections = rawJson.data[0]?.text_detections || rawJson.data[0]?.detections || rawJson.data;
    } else if (rawJson?.text_detections && Array.isArray(rawJson.text_detections)) {
      detections = rawJson.text_detections;
    } else if (rawJson?.predictions && Array.isArray(rawJson.predictions)) {
      detections = rawJson.predictions;
    }

    if (Array.isArray(detections)) {
      for (const item of detections) {
        // High fidelity preservation - do not alter code symbols, line numbers, brackets
        const rawText = item.text ?? item.content ?? item.transcription ?? '';
        const textStr = typeof rawText === 'string' ? rawText : String(rawText);
        const conf = typeof item.confidence === 'number' ? item.confidence : (typeof item.score === 'number' ? item.score : 0.95);

        if (textStr.length > 0 && conf >= ctx.minConfidence) {
          textPieces.push(textStr);

          let boundingBox: OcrBoundingBox | undefined = undefined;
          const rawBox = item.bounding_box || item.bbox || item.polygon;

          if (rawBox) {
            if (Array.isArray(rawBox)) {
              if (rawBox.length === 4 && typeof rawBox[0] === 'number') {
                const [a, b, c, d] = rawBox;
                if (c > a && d > b) {
                  boundingBox = { x: a, y: b, width: c - a, height: d - b };
                } else {
                  boundingBox = { x: a, y: b, width: c, height: d };
                }
              } else if (Array.isArray(rawBox[0])) {
                const xs = rawBox.map(pt => pt[0]);
                const ys = rawBox.map(pt => pt[1]);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                boundingBox = {
                  x: minX,
                  y: minY,
                  width: maxX - minX,
                  height: maxY - minY,
                  polygon: rawBox
                };
              }
            } else if (typeof rawBox === 'object') {
              boundingBox = {
                x: rawBox.x || rawBox.left || 0,
                y: rawBox.y || rawBox.top || 0,
                width: rawBox.width || rawBox.w || 0,
                height: rawBox.height || rawBox.h || 0
              };
            }
          }

          blocks.push({
            text: textStr,
            confidence: conf,
            boundingBox,
            level: ctx.mergeLevel,
            uncertain: conf < 0.65
          });
        }
      }
    }

    const fullText = textPieces.join('\n');
    const words = fullText.split(/\s+/).filter(Boolean);
    const avgConfidence = blocks.length > 0 
      ? blocks.reduce((acc, b) => acc + b.confidence, 0) / blocks.length 
      : 0;

    return {
      text: fullText,
      blocks,
      sourceType: ctx.sourceType,
      provider: 'nvidia_nemotron_ocr_v2',
      confidence: Math.round(avgConfidence * 100) / 100,
      latencyMs: Date.now() - ctx.startTime,
      timestamp: Date.now(),
      metadata: {
        model: ctx.model,
        imageWidth: ctx.width,
        imageHeight: ctx.height,
        mergeLevel: ctx.mergeLevel,
        charCount: fullText.length,
        wordCount: words.length,
        rawCount: detections.length,
        cacheHit: false
      }
    };
  }

  /**
   * Layered Intelligent Perception Strategy:
   * 1. Checks if native DOM structured text is available without hard visual OCR requirement.
   * 2. When visual OCR is required or an image/screenshot is supplied, invokes NVIDIA Nemotron OCR v2.
   */
  public async perceiveIntelligently(options: {
    sourceType: 'screen' | 'browser' | 'camera' | 'upload';
    imageInput?: File | Blob | HTMLCanvasElement | HTMLVideoElement | string;
    domElement?: HTMLElement;
    forceVisualOcr?: boolean;
    mergeLevel?: OcrMergeLevel;
  }): Promise<OcrResult> {
    const startTime = Date.now();

    // 1. If visual OCR is requested or image input provided: Route to NVIDIA Nemotron OCR v2
    if (options.imageInput) {
      try {
        const ocrResult = await this.extractTextFromImage(options.imageInput, {
          sourceType: options.sourceType,
          mergeLevel: options.mergeLevel || 'paragraph'
        });
        return ocrResult;
      } catch (err: any) {
        console.warn('[NvidiaOcrService] NVIDIA Nemotron OCR v2 encountered an issue:', err.message);
        throw err;
      }
    }

    // 2. DOM text inspection if no visual input was supplied
    if (options.domElement) {
      const nodes = options.domElement.querySelectorAll('h1, h2, h3, h4, h5, p, span, button, input, textarea, code, pre, a, li, td, th');
      const uniqueTexts = new Set<string>();
      const domBlocks: OcrTextBlock[] = [];
      nodes.forEach(node => {
        const val = (node as HTMLElement).innerText || (node as HTMLInputElement).value;
        if (val && val.trim().length > 1 && !uniqueTexts.has(val.trim())) {
          uniqueTexts.add(val.trim());
          const rect = node.getBoundingClientRect();
          domBlocks.push({
            text: val.trim(),
            confidence: 1.0,
            boundingBox: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height
            },
            level: 'line'
          });
        }
      });
      const domText = Array.from(uniqueTexts).join('\n');
      const words = domText.split(/\s+/).filter(Boolean);
      return {
        text: domText,
        blocks: domBlocks,
        sourceType: 'dom_fallback',
        provider: 'dom_hybrid',
        confidence: 1.0,
        latencyMs: Date.now() - startTime,
        timestamp: Date.now(),
        metadata: {
          model: 'DOM Structure',
          wordCount: words.length,
          charCount: domText.length
        }
      };
    }

    throw new Error('No visual input or DOM structure provided for perception analysis.');
  }
}

export const nvidiaOcrService = NvidiaOcrService.getInstance();
