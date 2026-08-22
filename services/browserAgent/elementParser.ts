/**
 * JARVIS Browser Agent - Layered DOM & Interactive Element Parser
 * Inspired by Skyvern's hierarchical element mapping and semantic context compression.
 * 
 * Responsibilities:
 * 1. Extract interactive & semantic nodes (buttons, inputs, selects, links, headings, tables, cards).
 * 2. Generate robust, human-readable semantic selectors and short indexed IDs ([el-1], [el-2]).
 * 3. Detect overlays, popups, cookie consent dialogs, and blocking backdrops.
 * 4. Construct compact DOM summaries suitable for LLM reasoning with zero token waste.
 */

import { InteractiveElement, BrowserPageState } from './types';

export class ElementParser {
  /**
   * Parses a DOM Document or container element into an indexed InteractiveElement map.
   */
  public static parseInteractiveElements(rootDoc: Document | Element = document): InteractiveElement[] {
    const elements: InteractiveElement[] = [];
    let counter = 1;

    // Interactive element queries matching standard web applications
    const interactiveQuery = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'textarea',
      'select',
      '[role="button"]',
      '[role="link"]',
      '[role="searchbox"]',
      '[role="textbox"]',
      '[role="combobox"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="menuitem"]',
      '[role="tab"]',
      '[onclick]',
      '[tabindex]:not([tabindex="-1"])',
      'details summary'
    ].join(', ');

    const candidates = rootDoc.querySelectorAll(interactiveQuery);

    candidates.forEach((node) => {
      const el = node as HTMLElement;
      if (!this.isElementVisible(el)) return;

      const tag = el.tagName.toLowerCase();
      const type = el.getAttribute('type') || undefined;
      const role = el.getAttribute('role') || undefined;
      const text = this.getAccessibleName(el);
      const placeholder = el.getAttribute('placeholder') || undefined;
      const name = el.getAttribute('name') || undefined;
      const value = (el as HTMLInputElement).value || undefined;
      const href = el.getAttribute('href') || undefined;
      const selector = this.generateBestSelector(el);
      
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const isInViewport = (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );

      const isEnabled = !el.hasAttribute('disabled') && !el.getAttribute('aria-disabled');
      const isClickable = isEnabled && isVisible;

      // Filter out empty noise elements without text or purpose
      if (!text && !placeholder && !name && !value && !href && tag !== 'input') {
        return;
      }

      elements.push({
        id: `el-${counter++}`,
        tag,
        type,
        role,
        text: text.slice(0, 120),
        placeholder,
        name,
        value: type === 'password' ? '********' : value?.slice(0, 60),
        href: href ? href.slice(0, 150) : undefined,
        selector,
        boundingBox: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        isVisible,
        isEnabled,
        isClickable,
        isInViewport
      });
    });

    return elements;
  }

  /**
   * Generates a compact text summary of the page structure and interactive targets for the LLM.
   */
  public static generateCompactDOMSummary(
    url: string,
    title: string,
    elements: InteractiveElement[],
    headings: string[] = [],
    hasOverlay: boolean = false,
    overlayText?: string
  ): string {
    const lines: string[] = [];

    lines.push(`URL: ${url}`);
    lines.push(`TITLE: ${title || 'Untitled Page'}`);

    if (hasOverlay) {
      lines.push(`[ALERT: MODAL / OVERLAY DETECTED] Text: "${overlayText?.slice(0, 150) || 'Cookie / Dialog Banner'}"`);
    }

    if (headings.length > 0) {
      lines.push(`HEADINGS: ${headings.slice(0, 8).map(h => `"${h}"`).join(' | ')}`);
    }

    lines.push('\nINTERACTIVE ELEMENTS:');
    if (elements.length === 0) {
      lines.push('  (No interactive elements detected on current viewport)');
    } else {
      elements.slice(0, 45).forEach(el => {
        const parts: string[] = [`[${el.id}] <${el.tag}`];
        if (el.type) parts.push(`type="${el.type}"`);
        if (el.role) parts.push(`role="${el.role}"`);
        if (el.name) parts.push(`name="${el.name}"`);
        if (el.placeholder) parts.push(`placeholder="${el.placeholder}"`);
        if (el.href) parts.push(`href="${el.href}"`);
        parts.push(`>`);

        if (el.text) {
          parts.push(` "${el.text}"`);
        } else if (el.value) {
          parts.push(` value="${el.value}"`);
        }

        if (!el.isInViewport) {
          parts.push(` [OFF-VIEWPORT - Needs Scroll]`);
        }

        lines.push(`  ${parts.join('')}`);
      });

      if (elements.length > 45) {
        lines.push(`  ... (${elements.length - 45} additional elements omitted for brevity)`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Detects active popups, cookie consent dialogs, overlay backdrops, or blocking banners.
   */
  public static detectOverlays(rootDoc: Document | Element = document): { hasOverlay: boolean; text?: string; dismissButtonSelector?: string } {
    const overlaySelectors = [
      '[id*="cookie" i]',
      '[class*="cookie" i]',
      '[id*="consent" i]',
      '[class*="consent" i]',
      '[id*="modal" i]',
      '[class*="modal" i]',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '.overlay',
      '.backdrop'
    ];

    for (const sel of overlaySelectors) {
      const candidates = rootDoc.querySelectorAll(sel);
      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i] as HTMLElement;
        if (this.isElementVisible(el)) {
          const text = (el.innerText || '').trim();
          if (text.length > 5 && text.length < 500) {
            // Find possible dismiss button
            const buttons = el.querySelectorAll('button, a[role="button"], [class*="btn" i]');
            let dismissSelector: string | undefined;

            for (let b = 0; b < buttons.length; b++) {
              const btn = buttons[b] as HTMLElement;
              const btnText = (btn.innerText || btn.getAttribute('aria-label') || '').toLowerCase();
              if (
                btnText.includes('accept') ||
                btnText.includes('agree') ||
                btnText.includes('got it') ||
                btnText.includes('close') ||
                btnText.includes('dismiss') ||
                btnText.includes('allow')
              ) {
                dismissSelector = this.generateBestSelector(btn);
                break;
              }
            }

            return {
              hasOverlay: true,
              text: text.slice(0, 160),
              dismissButtonSelector: dismissSelector
            };
          }
        }
      }
    }

    return { hasOverlay: false };
  }

  /**
   * Generates the best, most resilient CSS selector for an element.
   */
  public static generateBestSelector(el: HTMLElement): string {
    // 1. Data Test ID
    const testId = el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-cy');
    if (testId) return `[data-testid="${testId}"]`;

    // 2. ID (if not randomly generated)
    if (el.id && !el.id.match(/\d{6,}/) && !el.id.startsWith('react-') && !el.id.startsWith('radix-')) {
      return `#${CSS.escape(el.id)}`;
    }

    // 3. Name attribute
    const name = el.getAttribute('name');
    if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;

    // 4. ARIA label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;

    // 5. Placeholder
    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return `${el.tagName.toLowerCase()}[placeholder="${placeholder}"]`;

    // 6. Distinctive text for buttons/links
    const text = (el.innerText || '').trim();
    if (text && text.length < 30 && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
      // In Playwright / modern engines: button:has-text("...")
      return `${el.tagName.toLowerCase()}:has-text("${text.replace(/"/g, '\\"')}")`;
    }

    // 7. Role + Type combination
    const role = el.getAttribute('role');
    const type = el.getAttribute('type');
    if (role && type) return `[role="${role}"][type="${type}"]`;
    if (role) return `[role="${role}"]`;

    // 8. Class fallback (first clean class)
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('[') && c.length < 24);
      if (classes.length > 0) {
        return `${el.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    return el.tagName.toLowerCase();
  }

  /**
   * Retrieves accessible name for an element following W3C standards.
   */
  private static getAccessibleName(el: HTMLElement): string {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel.trim();

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl && labelEl.innerText) return labelEl.innerText.trim();
    }

    const title = el.getAttribute('title');
    if (title) return title.trim();

    const alt = el.getAttribute('alt');
    if (alt) return alt.trim();

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const ph = el.getAttribute('placeholder');
      if (ph) return ph.trim();
      const val = (el as HTMLInputElement).value;
      if (val) return val.trim();
    }

    return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Checks if an element is rendered and visible on screen.
   */
  private static isElementVisible(el: HTMLElement): boolean {
    if (!el || !el.isConnected) return false;
    
    // Check computed styles
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
    }

    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return true;
  }
}
