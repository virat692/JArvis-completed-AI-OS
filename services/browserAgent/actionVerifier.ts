/**
 * JARVIS Browser Agent - Post-Action Verifier
 * 
 * Verifies whether executed browser actions produced the expected state transitions
 * and flags anomalies or incomplete executions for intelligent recovery.
 */

import { BrowserAction, BrowserPageState, VerificationResult, ActionResult } from './types';

export class ActionVerifier {
  /**
   * Verifies the outcome of an action by comparing previous vs new page state.
   */
  public static verifyAction(
    action: BrowserAction,
    prevState: BrowserPageState,
    newState: BrowserPageState,
    actionResult: ActionResult
  ): VerificationResult {
    const issues: string[] = [];
    let isVerified = true;
    let confidence = 1.0;
    let reason = 'Action verified successfully.';

    if (!actionResult.success) {
      return {
        isVerified: false,
        stateChanged: false,
        reason: actionResult.message || 'Action failed during execution.',
        confidence: 0.0,
        detectedIssues: [actionResult.error?.message || 'Execution error']
      };
    }

    const stateChanged = (
      prevState.url !== newState.url ||
      prevState.title !== newState.title ||
      prevState.interactiveElements.length !== newState.interactiveElements.length ||
      prevState.viewport.scrollY !== newState.viewport.scrollY
    );

    switch (action.type) {
      case 'navigate': {
        const targetUrl = (action.parameters.url || '').toLowerCase();
        const currentUrl = newState.url.toLowerCase();
        
        if (targetUrl && !currentUrl.includes(targetUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''))) {
          // Check if it redirected or failed
          if (newState.url === prevState.url) {
            isVerified = false;
            confidence = 0.3;
            reason = `Navigation did not change URL from "${prevState.url}".`;
            issues.push('URL unchanged after navigation');
          } else {
            confidence = 0.85;
            reason = `Navigated to redirected URL: ${newState.url}`;
          }
        } else {
          reason = `Successfully reached target URL: ${newState.url}`;
        }
        break;
      }

      case 'click': {
        // If clicking a link or submit button, expect URL change or DOM modification
        if (action.targetDescription?.toLowerCase().includes('search') || action.targetDescription?.toLowerCase().includes('submit')) {
          if (!stateChanged) {
            issues.push('No state transition detected after clicking submit/search button.');
            confidence = 0.5;
            reason = 'Page content did not update after click. Possible loading delay or missed target.';
          }
        }
        break;
      }

      case 'type': {
        const typedText = action.parameters.text;
        // Verify input presence or submission
        if (action.parameters.submitAfterTyping && !stateChanged) {
          confidence = 0.7;
          reason = 'Text typed, but Enter submission may not have triggered navigation.';
        }
        break;
      }

      case 'scroll': {
        const prevScroll = prevState.viewport.scrollY;
        const newScroll = newState.viewport.scrollY;
        if (action.parameters.direction === 'down' && newScroll <= prevScroll && prevState.viewport.totalHeight > prevState.viewport.height) {
          issues.push('Scroll command did not alter viewport Y position.');
          confidence = 0.6;
          reason = 'Page reached bottom or scroll event was ignored by target container.';
        }
        break;
      }

      case 'dismiss_overlay': {
        if (newState.hasModalsOrOverlays) {
          issues.push('Overlay/dialog is still present after dismiss attempt.');
          confidence = 0.4;
          reason = 'Overlay could not be dismissed automatically.';
        } else {
          reason = 'Overlay successfully dismissed.';
        }
        break;
      }

      case 'extract':
      case 'screenshot':
      case 'wait':
      case 'finish':
        // Pure passive or terminal actions
        isVerified = true;
        confidence = 1.0;
        break;
    }

    return {
      isVerified: issues.length === 0,
      stateChanged,
      reason,
      confidence,
      detectedIssues: issues
    };
  }
}
