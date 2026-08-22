# JARVIS Autonomous Browser Agent — Developer & Architecture Guide
**Document:** `docs/BROWSER_AGENT_GUIDE.md`  
**Version:** 5.0.0-PRO  
**Classification:** Subsystem Technical Specification  
**Current Date:** August 21, 2026  

---

## 1. Overview & Capabilities

The **JARVIS Autonomous Browser Agent** is an intelligent web automation and extraction engine capable of executing complex, multi-step browser tasks on behalf of the user. It operates autonomously in real time using the **Observe $\rightarrow$ Think $\rightarrow$ Act $\rightarrow$ Verify (OTAV)** cycle.

### Key Capabilities:
- **Goal-Oriented Multi-Step Navigation:** Decomposes natural language instructions (e.g., *"Find benchmark scores of Llama-3-70B on HuggingFace and extract its context window"*) into a sequence of actionable browser steps.
- **Semantic Element Indexing:** Extracts and labels all clickable, typable, and interactive DOM nodes with indexed identifiers (`[el-1]`, `[el-2]`).
- **Human-in-the-Loop Safety Guardrails:** Automatically flags and pauses execution on consequential or financial operations (e.g., checkout buttons, delete account, confirm purchase).
- **Post-Action State Verification:** Computes page URL and DOM changes after each action to confirm whether the interaction was successful.
- **Self-Healing Recovery:** Automatically falls back to semantic text matching and fuzzy selectors if dynamic web pages mutate IDs or CSS classes.

---

## 2. OTAV Architecture Workflow

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                       BROWSER TASK INGRESS                  │
 │          "Research trending open-source models"             │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. OBSERVE (ElementParser.ts)                               │
 │ - Scans DOM tree & filters visible/interactive elements     │
 │ - Generates lightweight tokens: [el-1] <input>, [el-2] <btn>│
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. THINK (ActionPlanner.ts)                                 │
 │ - Evaluates goal vs current page state                      │
 │ - Produces next Action: { type: "type", target: "[el-1]" }  │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 3. SAFETY CHECK (SafetyGuard.ts)                            │
 │ - Evaluates risk level: SAFE / MEDIUM / HIGH / CRITICAL     │
 │ - If CRITICAL: Intercepts & requests operator confirmation  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (If Approved / Safe)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 4. ACT (BrowserController.ts)                               │
 │ - Dispatches event to DOM sandbox / Playwright bridge       │
 │ - Simulates realistic human typing/scrolling delay          │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 5. VERIFY & HEAL (ActionVerifier.ts & RecoveryEngine.ts)    │
 │ - Compares Pre-State vs Post-State                          │
 │ - If failed: Executes semantic text fallback healing        │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Implementation Modules

| Module | Source File | Responsibilities |
| :--- | :--- | :--- |
| **Browser Agent Engine** | `/services/browserAgent/browserAgent.ts` | Orchestrates OTAV lifecycle, task queues, and pause/kill controls |
| **Element Parser** | `/services/browserAgent/elementParser.ts` | Generates compact DOM summaries with `[el-x]` indexing for LLMs |
| **Safety Guard** | `/services/browserAgent/safetyGuard.ts` | Intercepts payments, checkouts, and destructive operations |
| **Action Planner** | `/services/browserAgent/actionPlanner.ts` | AI action planning with deterministic heuristic fallbacks |
| **Action Verifier** | `/services/browserAgent/actionVerifier.ts` | URL and DOM delta verification |
| **Recovery Engine** | `/services/browserAgent/recoveryEngine.ts` | Self-healing selector fallback |
| **Browser Controller**| `/services/browserAgent/browserController.ts` | Action execution driver in sandbox / Playwright |
| **Type Definitions** | `/services/browserAgent/types.ts` | Type-safe interfaces for actions, states, tasks, and verifications |

---

## 4. Safety Guardrail Risk Tiers

1. **`SAFE`:**
   - Read-only navigation, typing search queries, scrolling, clicking documentation links.
   - *Behavior:* Executes autonomously without interruption.
2. **`MEDIUM`:**
   - Navigating external third-party domains, opening multiple tabs, downloading public files.
   - *Behavior:* Logged to HUD telemetry; executes autonomously.
3. **`HIGH`:**
   - Submitting contact forms, submitting non-financial inputs.
   - *Behavior:* Brief countdown notice in HUD.
4. **`CRITICAL`:**
   - Submitting credit card / PayPal details, one-click purchase, terminating subscriptions, deleting accounts, executing shell scripts.
   - *Behavior:* **Hard Interception**. Execution is immediately paused until operator explicitly clicks "Authorize Action" or says "Confirm".

---

## 5. Verification & Testing

To execute the automated test suite verifying all browser agent subsystems:
```bash
npx tsx scripts/verify_subsystems.ts
```
Expected Output:
```text
>>> ALL 9 SUBSYSTEM MODULES PASSED SYSTEM VERIFICATION (100% GREEN) <<<
```
