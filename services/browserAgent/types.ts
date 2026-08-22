/**
 * JARVIS Autonomous Browser Agent - Core Type Definitions
 * Inspired by Skyvern's open-source browser-agent architecture, engineered natively for JARVIS.
 * 
 * Features:
 * - Layered DOM & Visual Perception Models
 * - Structured Browser Action Specifications
 * - Observe -> Think -> Act -> Verify (OTAV) Lifecycle State Machine
 * - Bounded Recovery & Selector Healing
 * - Consequential Action Safety Guardrails
 */

export type BrowserAgentStatus = 
  | 'IDLE'
  | 'PLANNING'
  | 'OBSERVING'
  | 'THINKING'
  | 'ACTING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BrowserActionType = 
  | 'navigate'
  | 'click'
  | 'type'
  | 'press_key'
  | 'scroll'
  | 'select'
  | 'hover'
  | 'wait'
  | 'extract'
  | 'screenshot'
  | 'go_back'
  | 'go_forward'
  | 'refresh'
  | 'dismiss_overlay'
  | 'finish';

export type ActionRiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InteractiveElement {
  id: string; // e.g. "el-1", "el-2"
  tag: string; // "button", "input", "a", "select", etc.
  type?: string; // "text", "submit", "checkbox", "radio", etc.
  role?: string; // "button", "link", "searchbox", "textbox", etc.
  text: string; // Visible inner text / accessible label
  placeholder?: string;
  name?: string;
  value?: string;
  href?: string;
  selector: string; // Primary CSS selector
  xpath?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  isEnabled: boolean;
  isClickable: boolean;
  isInViewport: boolean;
}

export interface BrowserPageState {
  url: string;
  title: string;
  domSummary: string; // Compact structured representation of the page
  interactiveElements: InteractiveElement[];
  hasModalsOrOverlays: boolean;
  overlayText?: string;
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    totalHeight: number;
  };
  screenshotBase64?: string;
  extractedOcrText?: string;
  timestamp: number;
}

export interface BrowserAction {
  id: string;
  stepNumber: number;
  type: BrowserActionType;
  targetElementId?: string; // e.g. "el-3"
  targetSelector?: string;
  targetDescription?: string;
  parameters: {
    url?: string;
    text?: string;
    key?: string; // 'Enter', 'Escape', 'Tab', etc.
    direction?: 'up' | 'down' | 'top' | 'bottom';
    amount?: number; // Pixels to scroll
    value?: string; // For select dropdowns
    durationMs?: number;
    extractionSchema?: Record<string, string>;
    clearBeforeTyping?: boolean;
    submitAfterTyping?: boolean;
  };
  reasoning: string;
  expectedOutcome: string;
  riskLevel: ActionRiskLevel;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  timeoutMs?: number;
}

export interface ActionResult {
  actionId: string;
  type: BrowserActionType;
  success: boolean;
  message: string;
  durationMs: number;
  extractedData?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  previousPageState?: {
    url: string;
    title: string;
  };
  newPageState?: {
    url: string;
    title: string;
  };
}

export interface VerificationResult {
  isVerified: boolean;
  stateChanged: boolean;
  reason: string;
  confidence: number; // 0.0 - 1.0
  detectedIssues: string[];
}

export interface TaskStepLog {
  stepIndex: number;
  timestamp: number;
  observationSummary: string;
  thought: string;
  action: BrowserAction;
  result?: ActionResult;
  verification?: VerificationResult;
  recoveryAttempts?: number;
}

export interface ExtractedBrowserData {
  title: string;
  url: string;
  topic: string;
  summary: string;
  items: Array<Record<string, any>>;
  rawJson?: any;
  markdownContent?: string;
  comparisonCards?: Array<{
    subject: string;
    badge: string;
    pros: string[];
    specs: Record<string, string>;
    verdict?: string;
  }>;
  tableColumns?: Array<{ key: string; label: string }>;
  tableRows?: Array<Record<string, any>>;
}

export interface BrowserTask {
  id: string;
  goal: string;
  targetUrl?: string;
  status: BrowserAgentStatus;
  createdAt: number;
  updatedAt: number;
  currentStepIndex: number;
  maxSteps: number;
  steps: TaskStepLog[];
  extractedData?: ExtractedBrowserData;
  finalAnswer?: string;
  error?: string;
  pendingConfirmation?: {
    action: BrowserAction;
    riskReason: string;
  };
  metadata: {
    totalDurationMs: number;
    llmProviderUsed: string;
    ocrProviderUsed?: string;
    pagesVisited: string[];
    actionsExecuted: number;
    recoveriesExecuted: number;
  };
}

export interface BrowserAgentConfig {
  maxStepsPerTask: number;
  maxRecoveryAttemptsPerStep: number;
  actionTimeoutMs: number;
  pageLoadTimeoutMs: number;
  enableNvidiaOcr: boolean;
  autoDismissPopups: boolean;
  requireSafetyConfirmation: boolean;
  preferredAIProvider: 'gemini' | 'nemotron' | 'openrouter';
  executionEngine: 'AUTO' | 'PLAYWRIGHT_BRIDGE' | 'SANDBOX_HUD';
}
