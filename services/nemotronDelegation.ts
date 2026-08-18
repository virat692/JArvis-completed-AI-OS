import { 
  NemotronTaskRequest, 
  NemotronTaskResult, 
  AIProviderOptions 
} from '../interfaces/AIProvider';
import { aiProviderManager } from './AIProviderManager';
import { NemotronProvider } from '../providers/NemotronProvider';

/**
 * NemotronDelegationService
 * 
 * Manages on-demand backend reasoning and code analysis delegation from JARVIS to NVIDIA Nemotron.
 * 
 * Architectural Rules:
 * 1. JARVIS is the sole coordinator and user-facing intelligence.
 * 2. Nemotron acts exclusively as an on-demand backend worker.
 * 3. Context sent to Nemotron is trimmed and focused (no unnecessary full dumps).
 * 4. Iterations are strictly bounded by MAX_NEMOTRON_ITERATIONS = 3.
 */
export class NemotronDelegationService {
  private static instance: NemotronDelegationService;
  public readonly MAX_ITERATIONS = 3;

  private constructor() {}

  public static getInstance(): NemotronDelegationService {
    if (!NemotronDelegationService.instance) {
      NemotronDelegationService.instance = new NemotronDelegationService();
    }
    return NemotronDelegationService.instance;
  }

  /**
   * Constructs a focused task request for Nemotron
   */
  public buildTaskRequest(params: {
    taskId?: string;
    taskType?: NemotronTaskRequest['taskType'];
    prompt: string;
    relevantCode?: string;
    relevantFiles?: Array<{ path: string; content: string; language?: string }>;
    relevantContext?: string;
    constraints?: string[];
    requestedOutputFormat?: NemotronTaskRequest['requestedOutputFormat'];
  }): NemotronTaskRequest {
    const taskId = params.taskId || `nemotron-task-${Date.now()}`;
    const taskType = params.taskType || this.inferTaskType(params.prompt);

    return {
      taskId,
      taskType,
      userObjective: params.prompt,
      relevantCode: params.relevantCode,
      relevantFiles: params.relevantFiles,
      relevantContext: params.relevantContext,
      constraints: params.constraints || [
        'Provide rigorous, high-precision analysis',
        'Avoid conversational fluff',
        'Output complete, production-ready code where applicable'
      ],
      requestedOutputFormat: params.requestedOutputFormat || (
        taskType === 'code_analysis' || taskType === 'debugging' 
          ? 'code_solution' 
          : taskType === 'architecture_analysis' 
            ? 'architectural_plan' 
            : 'structured_report'
      ),
      iteration: 1,
      maxIterations: this.MAX_ITERATIONS
    };
  }

  /**
   * Delegates a single focused task to the Nemotron backend worker
   */
  public async executeDelegatedTask(
    task: NemotronTaskRequest,
    options?: AIProviderOptions
  ): Promise<NemotronTaskResult> {
    const provider = aiProviderManager.getProvider('nemotron') as NemotronProvider;

    if (!provider) {
      throw new Error('NVIDIA Nemotron provider is not registered in AIProviderManager');
    }

    return await provider.processTask(task, options);
  }

  /**
   * Executes a controlled multi-call task with JARVIS evaluation and bounded iterations (Max 3).
   * JARVIS remains in complete control of every iteration.
   */
  public async executeControlledMultiCallTask(
    initialTask: NemotronTaskRequest,
    options?: AIProviderOptions,
    onIterationUpdate?: (iteration: number, maxIterations: number, statusMessage: string) => void
  ): Promise<NemotronTaskResult> {
    let currentTask = { ...initialTask, iteration: 1, maxIterations: this.MAX_ITERATIONS };
    let latestResult: NemotronTaskResult | null = null;

    for (let iteration = 1; iteration <= this.MAX_ITERATIONS; iteration++) {
      if (options?.signal?.aborted) {
        throw new Error('Task delegation was cancelled by user/operator.');
      }

      currentTask.iteration = iteration;
      onIterationUpdate?.(
        iteration, 
        this.MAX_ITERATIONS, 
        iteration === 1 
          ? 'Dispatching directive to Nemotron backend worker...' 
          : `Evaluating & refining iteration #${iteration}...`
      );

      latestResult = await this.executeDelegatedTask(currentTask, options);

      if (!latestResult.success) {
        // Return immediately if unrecoverable provider error
        return latestResult;
      }

      // JARVIS evaluates the result
      const evaluation = this.evaluateTaskResult(currentTask, latestResult);

      if (evaluation.isComplete || iteration >= this.MAX_ITERATIONS) {
        latestResult.isComplete = true;
        latestResult.needsAdditionalAnalysis = false;
        break;
      }

      // Prepare focused follow-up request for the next iteration (only relevant refinement context)
      currentTask = {
        ...currentTask,
        iteration: iteration + 1,
        previousResult: `Previous Iteration Findings:\n${latestResult.summary}\n\nRefinement Directives:\n${evaluation.refinementDirectives.join('\n')}`,
        constraints: [
          ...(currentTask.constraints || []),
          'Correct identified issues from iteration #' + iteration
        ]
      };
    }

    if (!latestResult) {
      throw new Error('Nemotron delegation completed without returning a valid result.');
    }

    return latestResult;
  }

  /**
   * JARVIS Core Evaluation Engine:
   * Analyzes Nemotron's output to determine if task is complete or requires focused correction.
   */
  public evaluateTaskResult(
    task: NemotronTaskRequest,
    result: NemotronTaskResult
  ): { isComplete: boolean; refinementDirectives: string[] } {
    const directives: string[] = [];

    if (!result.rawText || result.rawText.trim().length === 0) {
      return {
        isComplete: false,
        refinementDirectives: ['Empty output received. Provide a complete analysis or solution.']
      };
    }

    // Heuristic 1: Code Solution validation (if task is coding or debugging)
    if (task.taskType === 'code_analysis' || task.taskType === 'debugging') {
      if (result.codeSolution?.code) {
        const code = result.codeSolution.code;
        // Check for unbalanced braces
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          directives.push(`Syntax Notice: Unmatched curly braces detected (${openBraces} open vs ${closeBraces} closed). Ensure all code blocks are properly closed.`);
        }

        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          directives.push(`Syntax Notice: Unmatched parentheses detected (${openParens} open vs ${closeParens} closed).`);
        }
      }
    }

    // Heuristic 2: Explicit request for verification in output
    const lower = result.rawText.toLowerCase();
    if (lower.includes('requires additional verification') || lower.includes('secondary analysis required')) {
      directives.push('Perform secondary verification on the critical points identified.');
    }

    return {
      isComplete: directives.length === 0,
      refinementDirectives: directives
    };
  }

  /**
   * Analyzes prompt intent to map to the appropriate Nemotron task type
   */
  private inferTaskType(prompt: string): NemotronTaskRequest['taskType'] {
    const lower = prompt.toLowerCase();
    if (lower.includes('debug') || lower.includes('fix error') || lower.includes('syntax error')) {
      return 'debugging';
    }
    if (lower.includes('architecture') || lower.includes('system design') || lower.includes('distributed')) {
      return 'architecture_analysis';
    }
    if (lower.includes('code') || lower.includes('function') || lower.includes('implement') || lower.includes('refactor')) {
      return 'code_analysis';
    }
    if (lower.includes('document') || lower.includes('research') || lower.includes('large context')) {
      return 'large_context';
    }
    return 'complex_reasoning';
  }
}

export const nemotronDelegation = NemotronDelegationService.getInstance();
