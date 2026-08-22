/**
 * JARVIS Browser Agent - Action Planner & Reasoning Engine
 * Inspired by Skyvern's goal-oriented reasoning and action synthesis.
 * 
 * Uses JARVIS's existing AIProviderManager (Gemini / Nemotron / OpenRouter)
 * and NVIDIA Nemotron OCR v2 when visual text extraction is necessary.
 */

import { BrowserAction, BrowserActionType, BrowserPageState, BrowserTask, TaskStepLog, ExtractedBrowserData } from './types';
import { SafetyGuard } from './safetyGuard';
import { aiProviderManager } from '../AIProviderManager';
import { nvidiaOcrService } from '../nvidiaOcrService';
import { neuralSearchEngine } from '../neuralSearchEngine';

export class ActionPlanner {
  /**
   * Plans the next browser action based on current task goal, page state, and execution history.
   */
  public static async planNextAction(
    task: BrowserTask,
    pageState: BrowserPageState,
    history: TaskStepLog[]
  ): Promise<BrowserAction> {
    const stepNumber = history.length + 1;

    // 1. If visual OCR is needed (e.g. dynamic canvas or un-selectable text), optionally invoke NVIDIA OCR
    let visualOcrContext = '';
    if (pageState.screenshotBase64 && nvidiaOcrService.hasValidKey()) {
      try {
        const ocr = await nvidiaOcrService.extractTextFromImage(pageState.screenshotBase64, {
          sourceType: 'screen',
          mergeLevel: 'paragraph'
        });
        if (ocr.text) {
          visualOcrContext = `\n[NVIDIA NEMOTRON OCR v2 EXTRACTED SCREEN TEXT]:\n${ocr.text.slice(0, 1500)}`;
        }
      } catch (e) {
        console.warn('[ActionPlanner] Optional NVIDIA OCR perception error:', e);
      }
    }

    // 2. Build structured prompt for JARVIS's AI Provider Manager
    const historySummary = history.map((step, idx) => {
      return `Step ${idx + 1}:
  Action: ${step.action.type.toUpperCase()} -> ${step.action.targetDescription || step.action.parameters.url || step.action.parameters.text || 'N/A'}
  Result: ${step.result?.message || 'Done'}
  Verification: ${step.verification?.reason || 'Verified'}`;
    }).join('\n\n');

    const prompt = `You are JARVIS's Autonomous Browser Agent.
Your objective is to achieve the user's high-level goal through structured browser interaction.

USER GOAL:
"${task.goal}"

CURRENT PAGE STATE:
${pageState.domSummary}
${visualOcrContext}

PREVIOUS EXECUTION HISTORY:
${historySummary || '(No steps executed yet. This is Step 1.)'}

AVAILABLE ACTION TYPES:
- navigate: { "url": "https://..." }
- click: { "targetElementId": "el-X", "targetSelector": "...", "targetDescription": "..." }
- type: { "targetElementId": "el-X", "targetSelector": "...", "text": "...", "clearBeforeTyping": true, "submitAfterTyping": true }
- press_key: { "key": "Enter" | "Escape" | "Tab" }
- scroll: { "direction": "down" | "up", "amount": 500 }
- select: { "targetElementId": "el-X", "value": "..." }
- hover: { "targetElementId": "el-X" }
- wait: { "durationMs": 1500 }
- dismiss_overlay: {}
- extract: { "topic": "...", "extractionSchema": { "field": "description" } }
- finish: { "summary": "..." }

DECISION RULES:
1. If this is Step 1 and the page is blank, navigate to the relevant website or search portal (e.g. Amazon, Google, GitHub, etc.).
2. Prefer DOM element IDs ([el-1], [el-2]) and selectors from the CURRENT PAGE STATE above.
3. If search input is identified, type the query and submit.
4. If results or target items are loaded, extract the data or click into the relevant product/page.
5. If the goal is satisfied, return action "finish" with the comprehensive findings.
6. Output MUST be strictly valid JSON matching the exact schema below.

JSON OUTPUT FORMAT:
{
  "thought": "Concise reasoning about the current page and what needs to happen next.",
  "action": {
    "type": "navigate" | "click" | "type" | "press_key" | "scroll" | "wait" | "extract" | "dismiss_overlay" | "finish",
    "targetElementId": "el-X or null",
    "targetSelector": "CSS selector or null",
    "targetDescription": "Human readable label or null",
    "parameters": {
      "url": "optional url",
      "text": "optional text to type",
      "key": "Enter",
      "direction": "down",
      "amount": 500,
      "clearBeforeTyping": true,
      "submitAfterTyping": true,
      "durationMs": 1000
    },
    "expectedOutcome": "What page state change is expected after this action"
  }
}`;

    // 3. Execute reasoning via JARVIS AIProviderManager with fallback
    try {
      // Determine if task needs complex reasoning (routed to Nemotron if configured) or Gemini
      const category = task.goal.length > 80 || history.length > 3 ? 'complexReasoning' : 'generalChat';
      const provider = aiProviderManager.getProviderForTask(category);

      const aiResponse = await provider.generate(prompt, {
        temperature: 0.2,
        systemPrompt: "You are JARVIS's precision Browser Agent planner. Always output strictly valid JSON with no markdown wrapping or preamble."
      });

      const responseText = aiResponse.text.trim();
      const parsed = this.parseActionJSON(responseText, stepNumber);

      // 4. Safety Guard Evaluation
      const targetElement = pageState.interactiveElements.find(
        el => el.id === parsed.targetElementId || el.selector === parsed.targetSelector
      );
      const safety = SafetyGuard.evaluateActionRisk(parsed, targetElement);
      parsed.riskLevel = safety.riskLevel;
      parsed.requiresConfirmation = safety.requiresConfirmation;
      if (safety.requiresConfirmation) {
        parsed.confirmationPrompt = SafetyGuard.generateConfirmationPrompt(parsed, safety.reason || 'Consequential operation.');
      }

      return parsed;
    } catch (err: any) {
      console.warn('[ActionPlanner] LLM Planning error, using deterministic fallback planner:', err);
      return this.deterministicFallbackPlan(task, pageState, stepNumber);
    }
  }

  /**
   * Synthesizes and structures the final extracted browser data into comprehensive tables and comparison cards.
   */
  public static async synthesizeExtractedData(
    task: BrowserTask,
    history: TaskStepLog[],
    lastPageState: BrowserPageState
  ): Promise<ExtractedBrowserData> {
    const historyText = history.map(s => s.result?.message || '').join('\n');
    
    // Also perform Neural Web Search for verified deep grounding if results are thin
    let neuralContext = '';
    try {
      const searchRes = await neuralSearchEngine.unifiedSearch(task.goal, 5);
      if (searchRes.success && searchRes.results.length > 0) {
        neuralContext = searchRes.results.map(r => `• ${r.title}: ${r.snippet} (URL: ${r.url})`).join('\n');
      }
    } catch {}

    const prompt = `Synthesize structured browser research results for:
GOAL: "${task.goal}"
PAGE URL: ${lastPageState.url}
PAGE TITLE: ${lastPageState.title}

OBSERVED DOM & HISTORY:
${lastPageState.domSummary.slice(0, 1200)}
${neuralContext ? `\nVERIFIED WEB INTELLIGENCE:\n${neuralContext}` : ''}

Output strictly valid JSON with this structure:
{
  "title": "Title of research or comparison",
  "url": "${lastPageState.url}",
  "topic": "${task.goal.slice(0, 50)}",
  "summary": "2-3 sentence executive summary of findings and conclusions",
  "items": [
    { "name": "Item 1", "price": "...", "rating": "...", "specs": "...", "verdict": "..." }
  ],
  "comparisonCards": [
    {
      "subject": "Product or Option Name",
      "badge": "BEST VALUE / TOP PICK / RUNNER UP",
      "pros": ["Pro 1", "Pro 2", "Pro 3"],
      "specs": { "Price": "...", "Capacity": "...", "Speed": "..." },
      "verdict": "Clear recommendation summary"
    }
  ],
  "tableColumns": [
    { "key": "name", "label": "Product / Option" },
    { "key": "price", "label": "Price" },
    { "key": "rating", "label": "Rating" },
    { "key": "verdict", "label": "Verdict" }
  ],
  "tableRows": [
    { "name": "...", "price": "...", "rating": "...", "verdict": "..." }
  ],
  "markdownContent": "Full formatted markdown report"
}`;

    try {
      const res = await aiProviderManager.generateWithFallback(prompt, undefined, {
        temperature: 0.2,
        systemPrompt: "You are a professional data synthesizer. Output strictly valid JSON."
      });

      const jsonStr = res.text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return parsed as ExtractedBrowserData;
    } catch (e) {
      console.warn('[ActionPlanner] Synthesis JSON parse fallback:', e);
      return {
        title: lastPageState.title || 'Browser Automation Extraction',
        url: lastPageState.url,
        topic: task.goal,
        summary: `Extracted results for: ${task.goal}`,
        items: [],
        tableColumns: [{ key: 'details', label: 'Extracted Details' }],
        tableRows: [{ details: historyText.slice(0, 300) }],
        markdownContent: `# Extraction Report: ${task.goal}\n\n${historyText}`
      };
    }
  }

  /**
   * Deterministic fallback when LLM API is temporarily unreachable.
   */
  private static deterministicFallbackPlan(
    task: BrowserTask,
    pageState: BrowserPageState,
    stepNumber: number
  ): BrowserAction {
    const goalLower = task.goal.toLowerCase();

    // Step 1: Blank page navigation
    if (stepNumber === 1 || pageState.url === 'about:blank') {
      let targetUrl = 'https://www.google.com';
      if (goalLower.includes('amazon')) targetUrl = 'https://www.amazon.in';
      else if (goalLower.includes('github')) targetUrl = 'https://github.com';
      else if (goalLower.includes('reddit')) targetUrl = 'https://www.reddit.com';

      return {
        id: `act_${Date.now()}`,
        stepNumber,
        type: 'navigate',
        parameters: { url: targetUrl },
        reasoning: `Initial step: Navigating to ${targetUrl} to begin task.`,
        expectedOutcome: `Loaded ${targetUrl}`,
        riskLevel: 'SAFE',
        requiresConfirmation: false
      };
    }

    // Look for search inputs
    const searchInput = pageState.interactiveElements.find(
      el => el.tag === 'input' && (el.type === 'text' || el.type === 'search' || el.name?.includes('q') || el.name?.includes('search') || el.placeholder?.toLowerCase().includes('search'))
    );

    if (searchInput && stepNumber <= 2) {
      return {
        id: `act_${Date.now()}`,
        stepNumber,
        type: 'type',
        targetElementId: searchInput.id,
        targetSelector: searchInput.selector,
        targetDescription: searchInput.placeholder || searchInput.name || 'Search Input',
        parameters: {
          text: task.goal.replace(/^(open|search for|find|look up)\s+/i, '').trim(),
          clearBeforeTyping: true,
          submitAfterTyping: true
        },
        reasoning: 'Entering user search query into search box and submitting.',
        expectedOutcome: 'Search results page rendered.',
        riskLevel: 'SAFE',
        requiresConfirmation: false
      };
    }

    // Default to extraction and finish
    return {
      id: `act_${Date.now()}`,
      stepNumber,
      type: 'finish',
      parameters: {},
      reasoning: 'Task completed. Extracting information from page state.',
      expectedOutcome: 'Final synthesized data returned to Neural Workspace.',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    };
  }

  /**
   * Safely parses JSON LLM output.
   */
  private static parseActionJSON(jsonText: string, stepNumber: number): BrowserAction {
    const cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    const act = parsed.action || parsed;

    return {
      id: `act_${Date.now()}_${stepNumber}`,
      stepNumber,
      type: (act.type || 'wait') as BrowserActionType,
      targetElementId: act.targetElementId || undefined,
      targetSelector: act.targetSelector || undefined,
      targetDescription: act.targetDescription || undefined,
      parameters: act.parameters || {},
      reasoning: parsed.thought || act.reasoning || 'Executing next planned browser milestone.',
      expectedOutcome: act.expectedOutcome || 'Page state updated.',
      riskLevel: 'SAFE',
      requiresConfirmation: false
    };
  }
}
