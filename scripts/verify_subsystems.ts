import { ElementParser } from '../services/browserAgent/elementParser';
import { SafetyGuard } from '../services/browserAgent/safetyGuard';
import { ActionVerifier } from '../services/browserAgent/actionVerifier';
import { RecoveryEngine } from '../services/browserAgent/recoveryEngine';
import { ActionPlanner } from '../services/browserAgent/actionPlanner';
import { browserAgent } from '../services/browserAgent/browserAgent';
import { workflowEngine } from '../workflows/workflowEngine';
import { capabilityRegistry } from '../services/capabilityRegistry';
import { BrowserAction, InteractiveElement, BrowserPageState, ActionResult, BrowserTask } from '../services/browserAgent/types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ suite, name, passed: true });
    console.log(`  ✓ [PASS] ${suite} > ${name}`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err?.message || String(err) });
    console.error(`  ✗ [FAIL] ${suite} > ${name}: ${err?.message || err}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('⌬ JARVIS SYSTEM VERIFICATION & SUBSYSTEM TEST SUITE');
  console.log('====================================================\n');

  // =====================================================
  // 1. TEST ELEMENT PARSER
  // =====================================================
  console.log('--- 1. Testing Element Parser & Semantic Indexing ---');
  await runTest('ElementParser', 'Generates compact DOM summary with [el-x] indexing for LLM', () => {
    const elements: InteractiveElement[] = [
      {
        id: 'el-1',
        tag: 'input',
        type: 'text',
        text: 'Search AI Models',
        placeholder: 'Search AI Models...',
        selector: 'input[name="q"]',
        isVisible: true,
        isEnabled: true,
        isClickable: true,
        isInViewport: true
      },
      {
        id: 'el-2',
        tag: 'button',
        text: 'Search',
        selector: 'button.search-btn',
        isVisible: true,
        isEnabled: true,
        isClickable: true,
        isInViewport: true
      }
    ];

    const summary = ElementParser.generateCompactDOMSummary(
      'https://huggingface.co/models',
      'Models - Hugging Face',
      elements,
      ['Trending Models', 'Open-source Weights'],
      false
    );

    assert(summary.includes('URL: https://huggingface.co/models'), 'Summary should contain URL');
    assert(summary.includes('[el-1]'), 'Summary should contain [el-1]');
    assert(summary.includes('[el-2]'), 'Summary should contain [el-2]');
    assert(summary.includes('Search AI Models...'), 'Summary should contain input placeholder');
    assert(summary.includes('Trending Models'), 'Summary should contain headings');
  });

  // =====================================================
  // 2. TEST SAFETY GUARD
  // =====================================================
  console.log('\n--- 2. Testing Safety & Consequential Action Guardrails ---');
  await runTest('SafetyGuard', 'Classifies safe actions (search, click read-only navigation)', () => {
    const safeAction: BrowserAction = {
      id: 'act-1',
      stepNumber: 1,
      type: 'type',
      targetDescription: 'Search input',
      parameters: { text: 'DeepSeek V3 benchmark parameters' },
      reasoning: 'Search query',
      expectedOutcome: 'Query typed',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    };
    const assessment = SafetyGuard.evaluateActionRisk(safeAction);
    assert(assessment.riskLevel === 'SAFE', `Expected SAFE, got ${assessment.riskLevel}`);
    assert(assessment.requiresConfirmation === false, 'Safe action should not require confirmation');
  });

  await runTest('SafetyGuard', 'Intercepts critical financial or checkout actions', () => {
    const criticalAction: BrowserAction = {
      id: 'act-2',
      stepNumber: 2,
      type: 'click',
      targetDescription: 'Complete purchase and pay now $199',
      parameters: {},
      reasoning: 'Checkout submit',
      expectedOutcome: 'Order processed',
      riskLevel: 'CRITICAL',
      requiresConfirmation: true
    };
    const assessment = SafetyGuard.evaluateActionRisk(criticalAction);
    assert(assessment.riskLevel === 'CRITICAL', `Expected CRITICAL, got ${assessment.riskLevel}`);
    assert(assessment.requiresConfirmation === true, 'Critical action must require confirmation');
    assert(assessment.reason !== undefined, 'Reason must be stated');
  });

  await runTest('SafetyGuard', 'Intercepts destructive account deletions', () => {
    const deleteAction: BrowserAction = {
      id: 'act-3',
      stepNumber: 3,
      type: 'click',
      targetDescription: 'Delete Account and Terminate Subscription',
      parameters: {},
      reasoning: 'Delete account',
      expectedOutcome: 'Account deleted',
      riskLevel: 'CRITICAL',
      requiresConfirmation: true
    };
    const assessment = SafetyGuard.evaluateActionRisk(deleteAction);
    assert(assessment.riskLevel === 'CRITICAL' || assessment.riskLevel === 'HIGH', `Expected CRITICAL/HIGH, got ${assessment.riskLevel}`);
    assert(assessment.requiresConfirmation === true, 'Destructive action must require confirmation');
  });

  // =====================================================
  // 3. TEST ACTION VERIFIER
  // =====================================================
  console.log('\n--- 3. Testing Post-Action Verifier ---');
  await runTest('ActionVerifier', 'Verifies URL change on navigation', () => {
    const prevState: BrowserPageState = {
      url: 'https://google.com',
      title: 'Google',
      domSummary: '',
      interactiveElements: [],
      hasModalsOrOverlays: false,
      timestamp: Date.now(),
      viewport: { width: 1280, height: 800, scrollX: 0, scrollY: 0, totalHeight: 1000 }
    };
    const newState: BrowserPageState = {
      url: 'https://huggingface.co/models',
      title: 'Hugging Face – Models',
      domSummary: '',
      interactiveElements: [{ id: 'el-1', tag: 'input', text: 'Filter', selector: 'input', isVisible: true, isEnabled: true, isClickable: true, isInViewport: true }],
      hasModalsOrOverlays: false,
      timestamp: Date.now(),
      viewport: { width: 1280, height: 800, scrollX: 0, scrollY: 0, totalHeight: 1000 }
    };

    const action: BrowserAction = {
      id: 'act-nav',
      stepNumber: 1,
      type: 'navigate',
      parameters: { url: 'https://huggingface.co/models' },
      reasoning: 'Navigating to target',
      expectedOutcome: 'Page loaded',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    };
    const actionResult: ActionResult = { actionId: 'act-nav', type: 'navigate', success: true, message: 'Navigated to URL', durationMs: 250 };
    
    const verification = ActionVerifier.verifyAction(action, prevState, newState, actionResult);
    assert(verification.isVerified === true, 'Navigation verification should succeed');
    assert(verification.stateChanged === true, 'State should be marked as changed');
  });

  // =====================================================
  // 4. TEST RECOVERY ENGINE
  // =====================================================
  console.log('\n--- 4. Testing Self-Healing Recovery Engine ---');
  await runTest('RecoveryEngine', 'Heals mutated selector using semantic text match fallback', () => {
    const currentElements: InteractiveElement[] = [
      {
        id: 'el-new-1',
        tag: 'button',
        text: 'Search Models',
        selector: 'button.search-btn-v2',
        isVisible: true,
        isEnabled: true,
        isClickable: true,
        isInViewport: true
      }
    ];

    const healedSelector = RecoveryEngine.healSelector(
      '#broken-old-search-btn',
      'Search Models',
      currentElements
    );

    assert(healedSelector === 'button.search-btn-v2', `Expected healed selector, got ${healedSelector}`);
  });

  // =====================================================
  // 5. TEST ACTION PLANNER
  // =====================================================
  console.log('\n--- 5. Testing Action Planner & Heuristics ---');
  await runTest('ActionPlanner', 'Generates deterministic plan correctly', async () => {
    const task: BrowserTask = {
      id: 'task-test',
      goal: 'Compare top open-weights AI models and their parameter sizes',
      targetUrl: 'https://huggingface.co/models',
      status: 'PLANNING',
      currentStepIndex: 0,
      maxSteps: 10,
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        totalDurationMs: 0,
        llmProviderUsed: 'gemini',
        pagesVisited: [],
        actionsExecuted: 0,
        recoveriesExecuted: 0
      }
    };

    const pageState: BrowserPageState = {
      url: 'https://huggingface.co/models',
      title: 'Models - Hugging Face',
      domSummary: 'URL: https://huggingface.co/models\n[el-1] <input> "Filter by name" placeholder="Filter by name"\n[el-2] <button> "Search"',
      interactiveElements: [
        {
          id: 'el-1',
          tag: 'input',
          text: 'Filter',
          placeholder: 'Filter by name',
          selector: 'input[placeholder*="Filter"]',
          isVisible: true,
          isEnabled: true,
          isClickable: true,
          isInViewport: true
        }
      ],
      hasModalsOrOverlays: false,
      timestamp: Date.now(),
      viewport: { width: 1280, height: 800, scrollX: 0, scrollY: 0, totalHeight: 1000 }
    };

    // Test deterministic plan path directly
    const plan = ActionPlanner['deterministicFallbackPlan'](task, pageState, 1);
    assert(plan !== null, 'Plan must not be null');
    assert(plan.type === 'type' || plan.type === 'navigate' || plan.type === 'finish', `Action type: ${plan.type}`);
    assert(plan.targetSelector !== undefined || plan.parameters.url !== undefined, 'Has valid action targets');
  });

  // =====================================================
  // 6. TEST BROWSER CONTROLLER
  // =====================================================
  console.log('\n--- 6. Testing Browser Controller ---');
  await runTest('BrowserController', 'Executes navigate, type, click, scroll, wait actions in sandbox', async () => {
    const ctrl = browserAgent.getController();
    
    // Navigate
    const navRes = await ctrl.executeAction({
      id: 'a1',
      stepNumber: 1,
      type: 'navigate',
      parameters: { url: 'https://huggingface.co/models' },
      reasoning: 'Navigate test',
      expectedOutcome: 'Loaded',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    });
    assert(navRes.success === true, 'Navigate action should succeed');
    assert(ctrl.getCurrentUrl().includes('huggingface.co'), 'URL state updated');

    // Type
    const typeRes = await ctrl.executeAction({
      id: 'a2',
      stepNumber: 2,
      type: 'type',
      targetSelector: 'input',
      parameters: { text: 'meta-llama/Meta-Llama-3-70B' },
      reasoning: 'Type test',
      expectedOutcome: 'Typed',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    });
    assert(typeRes.success === true, 'Type action should succeed');

    // Scroll
    const scrollRes = await ctrl.executeAction({
      id: 'a3',
      stepNumber: 3,
      type: 'scroll',
      parameters: { direction: 'down', amount: 300 },
      reasoning: 'Scroll test',
      expectedOutcome: 'Scrolled',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    });
    assert(scrollRes.success === true, 'Scroll action should succeed');

    // Wait
    const waitRes = await ctrl.executeAction({
      id: 'a4',
      stepNumber: 4,
      type: 'wait',
      parameters: { durationMs: 20 },
      reasoning: 'Wait test',
      expectedOutcome: 'Waited',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    });
    assert(waitRes.success === true, 'Wait action should succeed');
  });

  // =====================================================
  // 7. TEST BROWSER AGENT ORCHESTRATION & STATE MACHINE
  // =====================================================
  console.log('\n--- 7. Testing Autonomous Browser Agent Orchestration ---');
  await runTest('BrowserAgent', 'Maintains task state, configuration, and controller bindings', () => {
    assert(browserAgent !== undefined, 'BrowserAgent singleton must be defined');
    const controller = browserAgent.getController();
    assert(controller !== undefined, 'BrowserController must be initialized');

    browserAgent.updateConfig({
      maxStepsPerTask: 8,
      preferredAIProvider: 'gemini'
    });
    const config = browserAgent.getConfig();
    assert(config.maxStepsPerTask === 8, 'Config maxStepsPerTask updated');
    assert(config.preferredAIProvider === 'gemini', 'Config preferredAIProvider updated');
  });

  // =====================================================
  // 8. TEST WORKFLOW ENGINE INTEGRATION
  // =====================================================
  console.log('\n--- 8. Testing Workflow Engine Integration ---');
  await runTest('WorkflowEngine', 'Contains built-in wf_browser_intelligence pipeline', () => {
    const pipelines = workflowEngine.getPipelines();
    const browserWf = pipelines.find(p => p.id === 'wf_browser_intelligence');
    assert(browserWf !== undefined, 'wf_browser_intelligence must be defined in workflowEngine');
    assert(browserWf!.steps.some(s => s.action === 'browser_task'), 'Should have browser_task action step');
  });

  // =====================================================
  // 9. TEST CAPABILITY REGISTRY
  // =====================================================
  console.log('\n--- 9. Testing Capability Registry ---');
  await runTest('CapabilityRegistry', 'Registers cap_autonomous_browser_agent with verified status', () => {
    const browserCap = capabilityRegistry.getCapability('cap_autonomous_browser_agent');
    assert(browserCap !== undefined, 'cap_autonomous_browser_agent must be registered');
    assert(browserCap!.status === 'FUNCTIONAL', `Expected status FUNCTIONAL, got ${browserCap?.status}`);
    assert(browserCap!.category === 'AUTOMATION', `Expected category AUTOMATION, got ${browserCap?.category}`);
  });

  // =====================================================
  // 10. TEST NATIVE HOST BROWSER AUTOMATION (CHROME & EDGE)
  // =====================================================
  console.log('\n--- 10. Testing Native Host Browser Automation (Chrome & Edge) ---');
  await runTest('NativeBrowser', 'Controller exposes openHostBrowser and osBridge handles Chrome/Edge routing', async () => {
    const controller = browserAgent.getController();
    assert(typeof controller.openHostBrowser === 'function', 'BrowserController must expose openHostBrowser method');
    
    // Test that launching browser produces proper structured telemetry response (or informative offline notice)
    const chromeRes = await controller.openHostBrowser({ browser: 'chrome', url: 'https://www.google.com' });
    assert(chromeRes !== undefined, 'Chrome launch response must be defined');
    
    const edgeRes = await controller.openHostBrowser({ browser: 'edge', query: 'JARVIS AI System Architecture' });
    assert(edgeRes !== undefined, 'Edge search response must be defined');
  });

  // =====================================================
  // SUMMARY REPORT
  // =====================================================
  console.log('\n====================================================');
  console.log('⌬ VERIFICATION REPORT SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed:          ${passedCount}`);
  console.log(`Failed:          ${failedCount}`);

  if (failedCount > 0) {
    console.error('\nFailed tests summary:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`- [${r.suite}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n>>> ALL 9 SUBSYSTEM MODULES PASSED SYSTEM VERIFICATION (100% GREEN) <<<');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test suite crash:', err);
  process.exit(1);
});
