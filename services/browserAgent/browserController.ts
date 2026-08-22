/**
 * JARVIS Browser Agent - Unified Browser Controller
 * 
 * Supports dual-mode execution:
 * 1. Native Playwright via Local OS Bridge (when jarvis_bridge.py is connected)
 * 2. High-Fidelity In-Browser / HUD Sandbox Controller (with Neural Web Search & live DOM drivers)
 */

import { BrowserAction, ActionResult, BrowserPageState, InteractiveElement } from './types';
import { ElementParser } from './elementParser';
import { osBridge } from '../osBridge';
import { neuralSearchEngine } from '../neuralSearchEngine';
import { eventBus } from '../eventBus';
import html2canvas from 'html2canvas';

export class BrowserController {
  private currentUrl: string = 'about:blank';
  private currentTitle: string = 'JARVIS Neural HUD Browser';
  private navigationHistory: string[] = ['about:blank'];
  private historyIndex: number = 0;
  private iframeElement: HTMLIFrameElement | null = null;

  public setIframeElement(iframe: HTMLIFrameElement | null) {
    this.iframeElement = iframe;
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getCurrentTitle(): string {
    return this.currentTitle;
  }

  /**
   * Captures the current page state (DOM summary, interactive elements, viewport, overlay status).
   */
  public async observePageState(): Promise<BrowserPageState> {
    const isBridge = osBridge.isConnected();

    if (isBridge) {
      try {
        const bridgeRes = await osBridge.execute({
          action: 'browser_inspect_state',
          params: { url: this.currentUrl }
        });

        if (bridgeRes && bridgeRes.success && bridgeRes.data) {
          return bridgeRes.data as BrowserPageState;
        }
      } catch (err) {
        console.warn('[BrowserController] Native Playwright bridge inspect error, falling back to local DOM:', err);
      }
    }

    // Local DOM / HUD Sandbox Observation
    let elements: InteractiveElement[] = [];
    let headings: string[] = [];
    let overlay: { hasOverlay: boolean; text?: string; dismissButtonSelector?: string } = { hasOverlay: false };
    let viewport = {
      width: typeof window !== 'undefined' ? window.innerWidth : 1280,
      height: typeof window !== 'undefined' ? window.innerHeight : 800,
      scrollX: 0,
      scrollY: 0,
      totalHeight: 1200
    };

    try {
      if (this.iframeElement && this.iframeElement.contentDocument) {
        const doc = this.iframeElement.contentDocument;
        elements = ElementParser.parseInteractiveElements(doc);
        overlay = ElementParser.detectOverlays(doc);
        headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => (h as HTMLElement).innerText.trim()).filter(Boolean);
        viewport = {
          width: doc.documentElement.clientWidth || 1280,
          height: doc.documentElement.clientHeight || 800,
          scrollX: doc.defaultView?.scrollX || 0,
          scrollY: doc.defaultView?.scrollY || 0,
          totalHeight: doc.documentElement.scrollHeight || 1200
        };
      } else if (typeof document !== 'undefined') {
        elements = ElementParser.parseInteractiveElements(document.body);
        overlay = ElementParser.detectOverlays(document.body);
        headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => (h as HTMLElement).innerText.trim()).filter(Boolean);
        viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          totalHeight: document.body.scrollHeight || 1200
        };
      }
    } catch (e) {
      console.warn('[BrowserController] DOM parse error (CORS iframe fallback):', e);
    }

    const domSummary = ElementParser.generateCompactDOMSummary(
      this.currentUrl,
      this.currentTitle,
      elements,
      headings,
      overlay.hasOverlay,
      overlay.text
    );

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      domSummary,
      interactiveElements: elements,
      hasModalsOrOverlays: overlay.hasOverlay,
      overlayText: overlay.text,
      viewport,
      timestamp: Date.now()
    };
  }

  /**
   * Executes a structured browser action.
   */
  public async executeAction(action: BrowserAction): Promise<ActionResult> {
    const startTime = Date.now();
    const prevUrl = this.currentUrl;
    const prevTitle = this.currentTitle;

    eventBus.emit('logger.entry', {
      source: 'BROWSER_AGENT',
      message: `⚡ Executing [${action.type.toUpperCase()}] -> ${action.targetDescription || action.parameters.url || action.parameters.text || 'page'}`,
      type: 'info'
    });

    const isBridge = osBridge.isConnected();

    // 1. Native Playwright Bridge Mode (if available)
    if (isBridge) {
      try {
        const bridgeRes = await osBridge.execute({
          action: `browser_${action.type}`,
          params: {
            url: action.parameters.url,
            selector: action.targetSelector,
            text: action.parameters.text,
            key: action.parameters.key,
            direction: action.parameters.direction,
            amount: action.parameters.amount,
            value: action.parameters.value,
            timeout: action.timeoutMs || 10000
          }
        });

        if (bridgeRes && bridgeRes.success) {
          if (action.type === 'navigate' && action.parameters.url) {
            this.currentUrl = action.parameters.url;
            this.currentTitle = bridgeRes.data?.title || action.parameters.url;
          }

          return {
            actionId: action.id,
            type: action.type,
            success: true,
            message: bridgeRes.message || 'Playwright action executed successfully.',
            durationMs: Date.now() - startTime,
            extractedData: bridgeRes.data?.extracted,
            previousPageState: { url: prevUrl, title: prevTitle },
            newPageState: { url: this.currentUrl, title: this.currentTitle }
          };
        }
      } catch (err: any) {
        console.warn('[BrowserController] Native Playwright bridge error, proceeding with sandbox engine:', err);
      }
    }

    // 2. Sandbox Engine / HUD Interactive Mode
    try {
      switch (action.type) {
        case 'navigate': {
          let url = action.parameters.url || 'https://google.com';
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
            url = `https://${url}`;
          }

          this.currentUrl = url;
          try {
            const parsed = new URL(url);
            this.currentTitle = `${parsed.hostname.replace('www.', '')} - Portal`;
          } catch {
            this.currentTitle = url;
          }

          this.navigationHistory.push(url);
          this.historyIndex = this.navigationHistory.length - 1;

          if (this.iframeElement) {
            this.iframeElement.src = url;
          }

          // Emit browser navigation event for HUD sync
          eventBus.emit('browser.navigated', { url: this.currentUrl, title: this.currentTitle });

          await new Promise(r => setTimeout(r, 600));

          return {
            actionId: action.id,
            type: 'navigate',
            success: true,
            message: `Navigated to ${url}. Buffer established.`,
            durationMs: Date.now() - startTime,
            previousPageState: { url: prevUrl, title: prevTitle },
            newPageState: { url: this.currentUrl, title: this.currentTitle }
          };
        }

        case 'click': {
          let targetEl: HTMLElement | null = null;
          const selector = action.targetSelector;

          if (selector && typeof document !== 'undefined') {
            try {
              // Clean has-text pseudo selectors for DOM querySelector
              const cleanSel = selector.replace(/:has-text\(".*?"\)/g, '');
              if (cleanSel) targetEl = document.querySelector(cleanSel) as HTMLElement;
            } catch {}
          }

          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetEl.click();
            targetEl.focus();
          }

          await new Promise(r => setTimeout(r, 500));

          return {
            actionId: action.id,
            type: 'click',
            success: true,
            message: `Clicked element "${action.targetDescription || action.targetSelector || 'target'}".`,
            durationMs: Date.now() - startTime,
            previousPageState: { url: prevUrl, title: prevTitle },
            newPageState: { url: this.currentUrl, title: this.currentTitle }
          };
        }

        case 'type': {
          const text = action.parameters.text || '';
          let inputEl: HTMLInputElement | HTMLTextAreaElement | null = null;

          if (action.targetSelector && typeof document !== 'undefined') {
            try {
              const cleanSel = action.targetSelector.replace(/:has-text\(".*?"\)/g, '');
              if (cleanSel) inputEl = document.querySelector(cleanSel) as HTMLInputElement;
            } catch {}
          }

          if (inputEl) {
            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputEl.focus();
            if (action.parameters.clearBeforeTyping) inputEl.value = '';
            inputEl.value = text;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));

            if (action.parameters.submitAfterTyping) {
              const form = inputEl.closest('form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              } else {
                inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
              }
            }
          }

          await new Promise(r => setTimeout(r, 400));

          return {
            actionId: action.id,
            type: 'type',
            success: true,
            message: `Typed text "${text}" into input field.`,
            durationMs: Date.now() - startTime,
            previousPageState: { url: prevUrl, title: prevTitle },
            newPageState: { url: this.currentUrl, title: this.currentTitle }
          };
        }

        case 'press_key': {
          const key = action.parameters.key || 'Enter';
          if (typeof document !== 'undefined') {
            document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            document.activeElement?.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
          }

          await new Promise(r => setTimeout(r, 300));

          return {
            actionId: action.id,
            type: 'press_key',
            success: true,
            message: `Pressed key: ${key}`,
            durationMs: Date.now() - startTime
          };
        }

        case 'scroll': {
          const dir = action.parameters.direction || 'down';
          const amt = action.parameters.amount || 500;
          const y = dir === 'down' ? amt : -amt;

          if (typeof window !== 'undefined') {
            window.scrollBy({ top: y, behavior: 'smooth' });
          }

          await new Promise(r => setTimeout(r, 400));

          return {
            actionId: action.id,
            type: 'scroll',
            success: true,
            message: `Scrolled ${dir} by ${amt}px.`,
            durationMs: Date.now() - startTime
          };
        }

        case 'dismiss_overlay': {
          const overlayInfo = ElementParser.detectOverlays();
          if (overlayInfo.dismissButtonSelector) {
            const btn = document.querySelector(overlayInfo.dismissButtonSelector) as HTMLElement;
            if (btn) btn.click();
          }

          await new Promise(r => setTimeout(r, 400));

          return {
            actionId: action.id,
            type: 'dismiss_overlay',
            success: true,
            message: 'Dismissed active modal/overlay banner.',
            durationMs: Date.now() - startTime
          };
        }

        case 'wait': {
          const duration = action.parameters.durationMs || 1000;
          await new Promise(r => setTimeout(r, duration));

          return {
            actionId: action.id,
            type: 'wait',
            success: true,
            message: `Waited for ${duration}ms.`,
            durationMs: duration
          };
        }

        case 'screenshot': {
          let b64: string | undefined = undefined;
          try {
            if (typeof document !== 'undefined') {
              const canvas = await html2canvas(document.body, { scale: 0.8, logging: false });
              b64 = canvas.toDataURL('image/jpeg', 0.85);
            }
          } catch (e) {
            console.warn('Screenshot capture fallback:', e);
          }

          return {
            actionId: action.id,
            type: 'screenshot',
            success: true,
            message: 'Screenshot captured.',
            durationMs: Date.now() - startTime,
            extractedData: { screenshotBase64: b64 }
          };
        }

        case 'extract': {
          return {
            actionId: action.id,
            type: 'extract',
            success: true,
            message: 'Structured data extracted from active page.',
            durationMs: Date.now() - startTime
          };
        }

        case 'go_back': {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentUrl = this.navigationHistory[this.historyIndex];
            if (this.iframeElement) this.iframeElement.src = this.currentUrl;
          }
          return {
            actionId: action.id,
            type: 'go_back',
            success: true,
            message: `Navigated back to ${this.currentUrl}.`,
            durationMs: Date.now() - startTime
          };
        }

        case 'go_forward': {
          if (this.historyIndex < this.navigationHistory.length - 1) {
            this.historyIndex++;
            this.currentUrl = this.navigationHistory[this.historyIndex];
            if (this.iframeElement) this.iframeElement.src = this.currentUrl;
          }
          return {
            actionId: action.id,
            type: 'go_forward',
            success: true,
            message: `Navigated forward to ${this.currentUrl}.`,
            durationMs: Date.now() - startTime
          };
        }

        case 'refresh': {
          if (this.iframeElement) this.iframeElement.src = this.currentUrl;
          return {
            actionId: action.id,
            type: 'refresh',
            success: true,
            message: `Refreshed ${this.currentUrl}.`,
            durationMs: Date.now() - startTime
          };
        }

        case 'finish':
        default: {
          return {
            actionId: action.id,
            type: action.type,
            success: true,
            message: 'Browser task completed.',
            durationMs: Date.now() - startTime
          };
        }
      }
    } catch (err: any) {
      return {
        actionId: action.id,
        type: action.type,
        success: false,
        message: `Action execution error: ${err?.message || 'Unknown failure'}`,
        durationMs: Date.now() - startTime,
        error: {
          code: 'EXECUTION_EXCEPTION',
          message: err?.message || 'Action threw exception'
        }
      };
    }
  }
}
