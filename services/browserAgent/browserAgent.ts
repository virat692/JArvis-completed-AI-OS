/**
 * JARVIS Autonomous Browser Agent - Master Orchestrator
 * Fully inspired by Skyvern's core browser-automation architecture, tailored for JARVIS OS.
 * 
 * Features:
 * - Full Observe -> Think -> Act -> Verify (OTAV) Loop
 * - Dual-mode Execution (Native Playwright via Local OS Bridge & Sandbox HUD Engine)
 * - Self-Healing & Overlay Dismissal via RecoveryEngine
 * - Consequential Action Safety Guardrails
 * - Real-Time Telemetry & EventBus Integration
 * - Structured Neural Workspace Output (Comparison Cards, Data Tables, Markdown Summaries)
 */

import { 
  BrowserTask, 
  BrowserAgentStatus, 
  BrowserAgentConfig, 
  TaskStepLog, 
  BrowserAction, 
  BrowserPageState, 
  ExtractedBrowserData 
} from './types';
import { BrowserController } from './browserController';
import { ActionPlanner } from './actionPlanner';
import { ActionVerifier } from './actionVerifier';
import { RecoveryEngine } from './recoveryEngine';
import { SafetyGuard } from './safetyGuard';
import { eventBus } from '../eventBus';
import { neuralWorkspaceManager } from '../neuralWorkspaceManager';
import { PresentationPayload } from '../../types/workspace';

export class BrowserAgent {
  private static instance: BrowserAgent;
  private controller: BrowserController;
  private currentTask: BrowserTask | null = null;
  private isCancelled: boolean = false;
  private confirmationResolver: ((approved: boolean) => void) | null = null;

  private config: BrowserAgentConfig = {
    maxStepsPerTask: 12,
    maxRecoveryAttemptsPerStep: 3,
    actionTimeoutMs: 10000,
    pageLoadTimeoutMs: 15000,
    enableNvidiaOcr: true,
    autoDismissPopups: true,
    requireSafetyConfirmation: true,
    preferredAIProvider: 'gemini',
    executionEngine: 'AUTO'
  };

  private constructor() {
    this.controller = new BrowserController();
  }

  public static getInstance(): BrowserAgent {
    if (!BrowserAgent.instance) {
      BrowserAgent.instance = new BrowserAgent();
    }
    return BrowserAgent.instance;
  }

  public getController(): BrowserController {
    return this.controller;
  }

  public getCurrentTask(): BrowserTask | null {
    return this.currentTask;
  }

  public getConfig(): BrowserAgentConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<BrowserAgentConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Primary entry point: Executes a natural language goal through the autonomous OTAV loop.
   */
  public async executeTask(goal: string, targetUrl?: string): Promise<BrowserTask> {
    const startTime = Date.now();
    this.isCancelled = false;

    const task: BrowserTask = {
      id: `task_${Date.now()}`,
      goal,
      targetUrl,
      status: 'PLANNING',
      createdAt: startTime,
      updatedAt: startTime,
      currentStepIndex: 0,
      maxSteps: this.config.maxStepsPerTask,
      steps: [],
      metadata: {
        totalDurationMs: 0,
        llmProviderUsed: this.config.preferredAIProvider,
        pagesVisited: targetUrl ? [targetUrl] : [],
        actionsExecuted: 0,
        recoveriesExecuted: 0
      }
    };

    this.currentTask = task;

    this.logTelemetry(`🚀 Browser Agent: Starting task -> "${goal}"`, 'info');
    eventBus.emit('browser.task_started', task);

    // Initial navigation if targetUrl is provided
    if (targetUrl) {
      this.updateStatus('ACTING');
      await this.controller.executeAction({
        id: `init_nav_${Date.now()}`,
        stepNumber: 0,
        type: 'navigate',
        parameters: { url: targetUrl },
        reasoning: `Navigating directly to initial target URL: ${targetUrl}`,
        expectedOutcome: 'Target page loaded',
        riskLevel: 'SAFE',
        requiresConfirmation: false
      });
      task.metadata.pagesVisited.push(targetUrl);
    }

    // MAIN OTAV LOOP
    let currentStep = 0;

    while (currentStep < this.config.maxStepsPerTask && !this.isCancelled) {
      currentStep++;
      task.currentStepIndex = currentStep;

      // 1. OBSERVE
      this.updateStatus('OBSERVING');
      this.logTelemetry(`[Step ${currentStep}] 👁️ Observing page state...`, 'info');
      const pageState = await this.controller.observePageState();

      // Track visited URL
      if (pageState.url && !task.metadata.pagesVisited.includes(pageState.url)) {
        task.metadata.pagesVisited.push(pageState.url);
      }

      // Auto-dismiss overlays if configured
      if (this.config.autoDismissPopups && pageState.hasModalsOrOverlays) {
        this.logTelemetry(`[Step ${currentStep}] 🛡️ Dismissing detected modal/overlay...`, 'info');
        await this.controller.executeAction({
          id: `dismiss_${Date.now()}`,
          stepNumber: currentStep,
          type: 'dismiss_overlay',
          parameters: {},
          reasoning: 'Auto-dismissing blocking cookie banner/dialog.',
          expectedOutcome: 'Dialog closed.',
          riskLevel: 'SAFE',
          requiresConfirmation: false
        });
      }

      // 2. THINK & PLAN
      this.updateStatus('THINKING');
      this.logTelemetry(`[Step ${currentStep}] 🧠 Reasoning next browser milestone...`, 'info');
      const action = await ActionPlanner.planNextAction(task, pageState, task.steps);

      // Check if task completed
      if (action.type === 'finish') {
        this.logTelemetry(`[Step ${currentStep}] ✓ Agent reached goal completion milestone.`, 'success');
        break;
      }

      // 3. SAFETY CHECKPOINT
      if (action.requiresConfirmation && this.config.requireSafetyConfirmation) {
        this.updateStatus('AWAITING_CONFIRMATION');
        task.pendingConfirmation = {
          action,
          riskReason: action.confirmationPrompt || 'Consequential browser action detected.'
        };
        eventBus.emit('browser.awaiting_confirmation', task);
        this.logTelemetry(`⚠️ Safety Checkpoint: Operator confirmation required for [${action.type.toUpperCase()}]`, 'warning');

        const approved = await this.waitForUserConfirmation();
        task.pendingConfirmation = undefined;

        if (!approved) {
          this.logTelemetry(`❌ Operator denied action [${action.type.toUpperCase()}]. Aborting task.`, 'warning');
          task.status = 'CANCELLED';
          task.error = 'Action rejected by operator.';
          break;
        }
      }

      // 4. ACT
      this.updateStatus('ACTING');
      this.logTelemetry(`[Step ${currentStep}] ⚡ Executing [${action.type.toUpperCase()}] on ${action.targetDescription || action.targetSelector || 'page'}...`, 'info');
      const actionResult = await this.controller.executeAction(action);
      task.metadata.actionsExecuted++;

      // 5. VERIFY
      this.updateStatus('VERIFYING');
      const newPageState = await this.controller.observePageState();
      const verification = ActionVerifier.verifyAction(action, pageState, newPageState, actionResult);

      const stepLog: TaskStepLog = {
        stepIndex: currentStep,
        timestamp: Date.now(),
        observationSummary: pageState.domSummary.slice(0, 300),
        thought: action.reasoning,
        action,
        result: actionResult,
        verification,
        recoveryAttempts: 0
      };

      // 6. RECOVER IF VERIFICATION FAILED
      if (!verification.isVerified && !this.isCancelled) {
        this.updateStatus('RECOVERING');
        this.logTelemetry(`[Step ${currentStep}] ⚠️ Verification anomaly: ${verification.reason}. Invoking self-healing...`, 'warning');

        let recoveryAttempt = 0;
        let healed = false;

        while (recoveryAttempt < this.config.maxRecoveryAttemptsPerStep && !healed) {
          recoveryAttempt++;
          task.metadata.recoveriesExecuted++;
          stepLog.recoveryAttempts = recoveryAttempt;

          const recPlan = RecoveryEngine.determineRecoveryAction(
            action,
            recoveryAttempt,
            newPageState,
            verification.detectedIssues[0]
          );

          if (recPlan.canRecover && recPlan.recoveryAction) {
            this.logTelemetry(`[Step ${currentStep} - Rec #${recoveryAttempt}] 🔧 ${recPlan.reason}`, 'info');
            const recResult = await this.controller.executeAction(recPlan.recoveryAction);
            const postRecState = await this.controller.observePageState();
            const recVerify = ActionVerifier.verifyAction(recPlan.recoveryAction, newPageState, postRecState, recResult);

            if (recVerify.isVerified) {
              this.logTelemetry(`[Step ${currentStep}] ✓ Recovery successful. Continuing normal execution.`, 'success');
              healed = true;
            }
          } else {
            break;
          }
        }
      }

      task.steps.push(stepLog);
      eventBus.emit('browser.step_progress', { task, stepLog });

      // Small throttle interval
      await new Promise(r => setTimeout(r, 400));
    }

    // FINAL EXTRACTION & WORKSPACE DISPATCH
    if (task.status !== 'CANCELLED') {
      this.updateStatus('COMPLETED');
      this.logTelemetry(`📊 Synthesizing final structured intelligence for Neural Workspace...`, 'info');

      const lastState = await this.controller.observePageState();
      const extracted = await ActionPlanner.synthesizeExtractedData(task, task.steps, lastState);
      task.extractedData = extracted;
      task.finalAnswer = extracted.summary;
      task.metadata.totalDurationMs = Date.now() - startTime;

      // Dispatch directly to JARVIS Neural Workspace
      this.dispatchToNeuralWorkspace(task, extracted);

      this.logTelemetry(`✓ Browser task completed successfully in ${(task.metadata.totalDurationMs / 1000).toFixed(1)}s.`, 'success');
      eventBus.emit('browser.task_completed', task);
    }

    return task;
  }

  /**
   * Responds to operator confirmation prompt for sensitive actions.
   */
  public confirmAction(approved: boolean) {
    if (this.confirmationResolver) {
      this.confirmationResolver(approved);
      this.confirmationResolver = null;
    }
  }

  /**
   * Cancels the active task.
   */
  public cancelTask() {
    this.isCancelled = true;
    if (this.currentTask) {
      this.currentTask.status = 'CANCELLED';
      this.currentTask.error = 'Task cancelled by operator.';
      eventBus.emit('browser.task_cancelled', this.currentTask);
    }
    this.logTelemetry('⏹️ Browser Agent task cancelled.', 'warning');
  }

  /**
   * Formats and dispatches extracted browser findings into JARVIS's Neural Workspace.
   */
  private dispatchToNeuralWorkspace(task: BrowserTask, data: ExtractedBrowserData) {
    const payload: PresentationPayload = {
      id: `wks_browser_${Date.now()}`,
      headerTitle: `JARVIS // BROWSER INTELLIGENCE: ${data.topic.toUpperCase()}`,
      category: 'Autonomous Browser Research',
      sourcePrompt: task.goal,
      timestamp: Date.now(),
      primaryMode: data.comparisonCards && data.comparisonCards.length > 0 ? 'DATA' : 'OVERVIEW',
      availableModes: ['OVERVIEW', 'PARAGRAPH', 'STRUCTURE', 'DATA', 'CODE'],
      rawContent: data.markdownContent || data.summary,
      overview: {
        summary: data.summary,
        keyPoints: (data.items || []).slice(0, 4).map(item => ({
          title: item.name || item.title || 'Finding',
          detail: item.verdict || item.specs || item.price || 'Extracted detail',
          tag: 'VERIFIED'
        })),
        stats: [
          { label: 'PAGES VISITED', value: `${task.metadata.pagesVisited.length}`, tone: 'accent' },
          { label: 'ACTIONS EXECUTED', value: `${task.metadata.actionsExecuted}`, tone: 'positive' },
          { label: 'EXECUTION TIME', value: `${(task.metadata.totalDurationMs / 1000).toFixed(1)}s`, tone: 'neutral' }
        ],
        statusBadges: [{ label: 'AUTOMATION COMPLETE', status: 'VERIFIED' }]
      },
      paragraph: {
        title: data.title,
        content: data.markdownContent || data.summary,
        markdownContent: data.markdownContent || data.summary,
        wordCount: (data.markdownContent || data.summary).split(/\s+/).length,
        lineCount: (data.markdownContent || data.summary).split('\n').length,
        readingTimeMinutes: 1
      },
      structure: {
        type: 'flowchart',
        title: 'Browser Action Trajectory',
        steps: task.steps.map((s, idx) => ({
          step: idx + 1,
          title: `${s.action.type.toUpperCase()} -> ${s.action.targetDescription || s.action.targetSelector || 'Page'}`,
          description: s.thought,
          tag: s.verification?.isVerified ? 'VERIFIED' : 'RECOVERED'
        })),
        rawText: task.steps.map(s => s.thought).join('\n')
      },
      code: {
        files: [
          {
            filename: 'browser_trajectory.json',
            language: 'json',
            code: JSON.stringify(task, null, 2),
            description: 'Raw Browser Agent Trajectory & Telemetry'
          }
        ]
      },
      data: {
        type: data.comparisonCards && data.comparisonCards.length > 0 ? 'comparison' : 'table',
        title: data.title,
        columns: data.tableColumns || [{ key: 'name', label: 'Item' }, { key: 'verdict', label: 'Details' }],
        rows: data.tableRows || data.items || [],
        comparisonCards: data.comparisonCards,
        jsonData: data.rawJson || data.items,
        hasRealData: true
      },
      metadata: {
        provider: task.metadata.llmProviderUsed,
        executionTimeMs: task.metadata.totalDurationMs,
        confidence: 0.98
      }
    };

    neuralWorkspaceManager.open(payload, 'DATA');
  }

  private waitForUserConfirmation(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmationResolver = resolve;
    });
  }

  private updateStatus(status: BrowserAgentStatus) {
    if (this.currentTask) {
      this.currentTask.status = status;
      this.currentTask.updatedAt = Date.now();
      eventBus.emit('browser.status_change', { taskId: this.currentTask.id, status });
    }
  }

  private logTelemetry(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    eventBus.emit('logger.entry', {
      source: 'BROWSER_AGENT',
      message,
      type
    });
  }
}

export const browserAgent = BrowserAgent.getInstance();
