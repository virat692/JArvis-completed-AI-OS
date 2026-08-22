/**
 * JARVIS Browser Agent - Safety & Consequential Action Guardrails
 * 
 * Classifies actions into risk levels and enforces human-in-the-loop
 * confirmation for sensitive operations (purchases, deletions, credential submissions).
 */

import { BrowserAction, ActionRiskLevel, InteractiveElement } from './types';

export class SafetyGuard {
  // Sensitive trigger terms for consequential actions
  private static readonly SENSITIVE_KEYWORDS = [
    'buy now', 'place order', 'checkout', 'pay now', 'complete purchase', 'purchase',
    'delete account', 'terminate', 'delete repository', 'drop table', 'erase data',
    'transfer funds', 'send money', 'wire transfer', 'authorize payment',
    'change password', 'reset 2fa', 'revoke key', 'disable security'
  ];

  private static readonly MODERATE_KEYWORDS = [
    'submit', 'confirm', 'save changes', 'update profile', 'publish', 'post comment', 'send message'
  ];

  /**
   * Evaluates the risk level of a proposed browser action.
   */
  public static evaluateActionRisk(action: BrowserAction, targetElement?: InteractiveElement): {
    riskLevel: ActionRiskLevel;
    requiresConfirmation: boolean;
    reason?: string;
  } {
    const actionType = action.type;
    const targetText = (targetElement?.text || action.targetDescription || '').toLowerCase();
    const actionText = (action.parameters.text || '').toLowerCase();
    const targetUrl = (action.parameters.url || '').toLowerCase();

    // 1. Critical Actions: Purchases, Financial Transactions, Irreversible Deletions
    if (actionType === 'click' || actionType === 'type' || actionType === 'press_key') {
      for (const kw of this.SENSITIVE_KEYWORDS) {
        if (targetText.includes(kw) || actionText.includes(kw)) {
          return {
            riskLevel: 'CRITICAL',
            requiresConfirmation: true,
            reason: `Action involves potentially consequential operation: "${kw.toUpperCase()}". Operator approval required.`
          };
        }
      }
    }

    // 2. Sensitive URLs (Payment gateways, account security settings)
    if (actionType === 'navigate') {
      if (
        targetUrl.includes('checkout') ||
        targetUrl.includes('payment') ||
        targetUrl.includes('billing') ||
        targetUrl.includes('security/settings')
      ) {
        return {
          riskLevel: 'MEDIUM',
          requiresConfirmation: false, // Normal navigation to payment page is okay, clicking buy is critical
          reason: 'Navigating to sensitive portal.'
        };
      }
    }

    // 3. Password input detection
    if (targetElement?.type === 'password' && actionType === 'type') {
      return {
        riskLevel: 'HIGH',
        requiresConfirmation: true,
        reason: 'Typing sensitive credentials into a password field requires operator verification.'
      };
    }

    // 4. Moderate Actions: Form Submissions / Profile Updates
    if (actionType === 'click') {
      for (const kw of this.MODERATE_KEYWORDS) {
        if (targetText.includes(kw)) {
          return {
            riskLevel: 'LOW',
            requiresConfirmation: false,
            reason: `Standard form action: "${kw}".`
          };
        }
      }
    }

    // 5. Safe Actions: Navigation, Scrolling, Reading, Extracting, Waiting
    return {
      riskLevel: 'SAFE',
      requiresConfirmation: false
    };
  }

  /**
   * Generates a clear operator confirmation message when an action requires approval.
   */
  public static generateConfirmationPrompt(action: BrowserAction, reason: string): string {
    return `⚠️ [JARVIS SAFETY CHECKPOINT]\nAutonomous Browser Agent is requesting confirmation before executing action:\n\n• Action: ${action.type.toUpperCase()}\n• Target: ${action.targetDescription || action.targetSelector || 'N/A'}\n• Risk Reason: ${reason}\n\nDo you authorize JARVIS to proceed with this operation?`;
  }
}
