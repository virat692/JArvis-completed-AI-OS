/**
 * JARVIS Browser Agent - Self-Healing & Error Recovery Engine
 * Inspired by Skyvern's resilience mechanisms and fallback strategies.
 * 
 * Capabilities:
 * - Bounded step retries (configurable limit, prevents infinite loops)
 * - Dynamic selector healing (CSS ID -> data-testid -> ARIA -> text matcher)
 * - Automatic overlay/cookie banner clearing
 * - Viewport scroll-into-view recovery
 */

import { BrowserAction, InteractiveElement, BrowserPageState } from './types';
import { ElementParser } from './elementParser';

export class RecoveryEngine {
  private static readonly MAX_RECOVERY_ATTEMPTS = 3;

  /**
   * Attempts to heal a broken or missing selector using alternative attributes.
   */
  public static healSelector(
    originalSelector: string,
    targetDescription?: string,
    currentElements: InteractiveElement[] = []
  ): string | null {
    if (!currentElements || currentElements.length === 0) return null;

    const desc = (targetDescription || '').toLowerCase();

    // 1. Match by exact or partial text content
    if (desc) {
      const matchByText = currentElements.find(el => 
        el.text && (el.text.toLowerCase().includes(desc) || desc.includes(el.text.toLowerCase()))
      );
      if (matchByText) return matchByText.selector;

      // 2. Match by placeholder or aria-label
      const matchByAria = currentElements.find(el =>
        (el.placeholder && el.placeholder.toLowerCase().includes(desc)) ||
        (el.name && el.name.toLowerCase().includes(desc))
      );
      if (matchByAria) return matchByAria.selector;
    }

    // 3. Fallback to tag and type heuristic
    if (originalSelector.includes('input')) {
      const firstInput = currentElements.find(el => el.tag === 'input' && el.isInViewport);
      if (firstInput) return firstInput.selector;
    }

    return null;
  }

  /**
   * Evaluates recovery action when a step fails verification or encounters an error.
   */
  public static determineRecoveryAction(
    failedAction: BrowserAction,
    attemptNumber: number,
    pageState: BrowserPageState,
    errorMessage?: string
  ): {
    canRecover: boolean;
    recoveryAction?: BrowserAction;
    reason: string;
  } {
    if (attemptNumber >= this.MAX_RECOVERY_ATTEMPTS) {
      return {
        canRecover: false,
        reason: `Exceeded maximum recovery attempts (${this.MAX_RECOVERY_ATTEMPTS}) for step #${failedAction.stepNumber}.`
      };
    }

    // Case 1: Overlay / Modal is blocking interaction
    if (pageState.hasModalsOrOverlays) {
      return {
        canRecover: true,
        recoveryAction: {
          id: `rec_${Date.now()}`,
          stepNumber: failedAction.stepNumber,
          type: 'dismiss_overlay',
          parameters: {},
          reasoning: 'Active modal or cookie banner detected. Attempting to dismiss overlay before retrying primary action.',
          expectedOutcome: 'Overlay closed and page interactions restored.',
          riskLevel: 'SAFE',
          requiresConfirmation: false
        },
        reason: 'Detected blocking modal/overlay.'
      };
    }

    // Case 2: Target element is off-viewport
    const targetElement = pageState.interactiveElements.find(
      el => el.id === failedAction.targetElementId || el.selector === failedAction.targetSelector
    );

    if (targetElement && !targetElement.isInViewport) {
      return {
        canRecover: true,
        recoveryAction: {
          id: `rec_${Date.now()}`,
          stepNumber: failedAction.stepNumber,
          type: 'scroll',
          parameters: {
            direction: targetElement.boundingBox && targetElement.boundingBox.y < 0 ? 'up' : 'down',
            amount: Math.abs(targetElement.boundingBox?.y || 400)
          },
          reasoning: 'Target element is outside current viewport. Scrolling into view.',
          expectedOutcome: 'Target element visible in active viewport.',
          riskLevel: 'SAFE',
          requiresConfirmation: false
        },
        reason: 'Element scrolled into view.'
      };
    }

    // Case 3: Selector broken - attempt selector healing
    if (failedAction.targetSelector) {
      const healed = this.healSelector(
        failedAction.targetSelector,
        failedAction.targetDescription,
        pageState.interactiveElements
      );

      if (healed && healed !== failedAction.targetSelector) {
        return {
          canRecover: true,
          recoveryAction: {
            ...failedAction,
            id: `rec_${Date.now()}`,
            targetSelector: healed,
            reasoning: `Original selector failed. Healed target selector using semantic match: ${healed}`,
          },
          reason: `Selector healed to: ${healed}`
        };
      }
    }

    // Case 4: Page might still be loading or rendering
    return {
      canRecover: true,
      recoveryAction: {
        id: `rec_${Date.now()}`,
        stepNumber: failedAction.stepNumber,
        type: 'wait',
        parameters: { durationMs: 1500 },
        reasoning: 'Waiting 1.5s for dynamic DOM updates or network completion before retrying.',
        expectedOutcome: 'Page state settled.',
        riskLevel: 'SAFE',
        requiresConfirmation: false
      },
      reason: 'Wait for page stability.'
    };
  }
}
