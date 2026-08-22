# JARVIS AI OS
## Comprehensive Product Requirements Document (PRD)

**Document:** `PRD.md`  
**Product:** JARVIS AI Operating System (AI OS)  
**Version:** 5.0.0-PRO  
**Classification:** Enterprise-Grade AI Operating Environment  
**Source of Truth:** JARVIS Integrated Architectural Audit & Implementation Matrix  
**Current Date:** August 21, 2026  
**Runtime Target:** Google AI Studio Cloud Run Container / React 19 + TypeScript Full-Stack  
**Operational Status:** 100% Core Functionality Implemented & Verified  

---

# 1. Executive Summary & Product Vision

JARVIS is an AI-powered personal operating environment designed to provide a unified, friction-free interface for multimodal conversational intelligence, low-latency neural voice synthesis, computer vision perception, autonomous web browsing, neural workspace presentations, temporal task automation, and native desktop system control.

Unlike conventional chatbot interfaces or disconnected AI wrappers, JARVIS behaves as a **singular, coherent AI operating layer**. All internal subsystems, multi-provider inference models (Gemini, NVIDIA Nemotron, OpenAI, Anthropic, DeepSeek, Local Ollama), browser automation engines, and background workers report through the unified JARVIS persona.

### Core Product Objectives:
1. **Unified Multimodal Interaction:** Seamlessly comprehend voice, text, live camera feeds, and desktop screen sharing simultaneously.
2. **Autonomous Web Intelligence & Browsing:** Observe, plan, execute, and verify complex multi-step web navigation, data extraction, and search routines autonomously with built-in safety guardrails.
3. **Immersive Real-Time Visual Environments:** Provide specialized contextual surfaces such as the Full-Screen 3D Meteorological Console, holographic HUDs, and Neural Workspace multi-mode presentations.
4. **Honest, Sandboxed Hardware Telemetry:** Accurately delineate between browser sandbox execution and local native OS execution without fabricating simulated metrics.
5. **Deterministic Long-Term Memory & State:** Maintain episodic conversational history, declarative user facts, temporal tasks/reminders, and vector embeddings across sessions.

---

# 2. Product Principles & Anti-Slop Invariants

JARVIS operates under strict system invariants:

### 2.1 Single Assistant Principle
JARVIS is the sole user-facing persona. Subordinate reasoning models (e.g., NVIDIA Nemotron Ultra, DeepSeek R1) operate strictly as headless reasoning engines. All responses are synthesized into JARVIS's signature professional, composed tone.

### 2.2 Reality Over Simulation (Hardware Truthfulness)
JARVIS must never fabricate CPU, GPU, RAM, battery, or disk metrics. In web sandbox mode, telemetry displays `"HOST TELEMETRY: SANDBOXED"`. When connected to the local Python bridge daemon (`main.py` / `jarvis_bridge.py`), authentic host metrics are streamed via WebSocket.

### 2.3 Context-Driven Workspace Activation
The Neural Workspace does not trigger for casual conversation, short greetings, simple factual lookups, or brief math calculations. It activates exclusively for high-density structural payloads (multi-row markdown tables, syntax-highlighted code files $\ge 6$ lines, ASCII system trees, or long-form essays $\ge 180$ words).

### 2.4 Human-in-the-Loop Safety Guardrails
Autonomous actions are categorized into `SAFE`, `MEDIUM`, `HIGH`, and `CRITICAL`. Any action involving financial checkout, payment processing, irreversible account deletion, or unauthorized system shutdown mandates operator confirmation.

### 2.5 Edge-to-Edge Spatial Design
All workspaces, modals, and telemetry overlays utilize borderless, full-screen canvas viewports with mathematically consistent padding, high contrast typography (`Orbitron` display + `Plus Jakarta Sans` body), and dark cybernetic lighting.

---

# 3. Target User & Use Cases

JARVIS is built for operators, engineers, researchers, and power users who require:
- **Autonomous Web Research:** Automated aggregation of documentation, market analysis, benchmarks, and multi-page technical reports.
- **Deep Technical Reasoning & Code Generation:** Multi-file code generation, live algorithmic proofing, and complex debugging via headless Nemotron delegation.
- **Hands-Free Ambient Assistance:** Continuous conversational voice loop, active vision perception, and scheduled reminders.
- **Atmospheric & Situational Awareness:** Real-time global meteorological telemetry with dynamic 3D sky visuals.
- **Native Computer Automation:** System monitoring, application launching, and local file operations via the native OS Bridge.

---

# 4. Detailed Functional Specifications

## 4.1 Autonomous Browser Agent (OTAV Engine)
JARVIS contains a built-in Autonomous Browser Agent operating on the **Observe $\rightarrow$ Think $\rightarrow$ Act $\rightarrow$ Verify (OTAV)** lifecycle:

```text
  ┌────────────────────────────────────────────────────────┐
  │              Autonomous Browser Agent (OTAV)           │
  └────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌──────────────┐       ┌──────────────┐       ┌────────────────┐
│ 1. OBSERVE   │  ───► │ 2. THINK     │  ───► │ 3. ACT         │
│ Semantic DOM │       │ Multi-Step   │       │ Sandbox Engine │
│ Indexing     │       │ Reasoning    │       │ & Playwright   │
└──────────────┘       └──────────────┘       └───────┬────────┘
     ▲                                                │
     │                                                ▼
     │                 ┌──────────────┐       ┌────────────────┐
     └──────────────── │ 5. RECOVER   │ ◄───  │ 4. VERIFY      │
      (Auto-Heal)      │ Text-Match   │ (Diff)│ State & URL    │
                       │ Fallback     │       │ Assertion      │
                       └──────────────┘       └────────────────┘
```

1. **Semantic Element Parser (`elementParser.ts`):** Compresses raw DOM nodes into lightweight indexed tokens (`[el-1]`, `[el-2]`) with ARIA roles, bounding viewports, and interactive states for token-efficient LLM ingestion.
2. **Action Planner (`actionPlanner.ts`):** Formulates step-by-step navigation, typing, clicking, scrolling, and data extraction plans using Gemini/Nemotron with deterministic heuristic fallback paths.
3. **Safety Guard (`safetyGuard.ts`):** Evaluates risk levels for all proposed actions. Intercepts payments, checkout buttons, destructive deletions, and high-consequence submissions.
4. **Post-Action Verifier (`actionVerifier.ts`):** Computes DOM and URL state diffs after every execution to verify intended state transitions.
5. **Self-Healing Recovery Engine (`recoveryEngine.ts`):** Automatically recovers from broken or mutated CSS selectors using semantic text matching, nearby hierarchy traversal, and alternate attributes.
6. **Browser Controller (`browserController.ts`):** Executes sandboxed web actions with real-time HUD telemetry, screenshot capture, and Playwright bridge binding.

---

## 4.2 Full-Screen Meteorological Atmosphere Console
JARVIS includes a dedicated, immersive Meteorological Console (`WeatherModal.tsx`):
- **Live Meteorological API:** Real-time temperature, wind speed, relative humidity, UV index, cloud cover, visibility, pressure, and air quality index fetched from Open-Meteo API with auto-geocoding.
- **3D Atmospheric Canvas Renderer:** High-performance HTML5 Canvas simulation rendering particle rain, snow crystals, thunderstorm lightning flashes, cloud drifts, and clear-sky solar flares.
- **Atmospheric Aura Lighting:** Dynamic radial ambient glow synchronized with current meteorological conditions (Solar Cyan, Rainy Indigo, Thunder Amber, Blizzard Azure, Emerald Mist).
- **Comprehensive Forecast Matrices:** Hourly temperature curves with 24-hour visual trendlines and 7-day extended forecasts.
- **Severe Weather Alert Sentinel:** Real-time safety banners detecting severe storms, high wind shear, extreme heat, and winter storm warnings.
- **Zero-Clutter Full-Screen Mode:** Edge-to-edge immersive view with quick-access metric chips, high-contrast readability, and instant location search.

---

## 4.3 Multimodal AI Provider Architecture
JARVIS orchestrates a flexible multi-model inference pipeline (`AIProviderManager.ts`):

| Provider | Primary Models | Specialized Responsibility |
| :--- | :--- | :--- |
| **Google GenAI** | `gemini-2.5-flash`, `gemini-2.5-pro` | Primary Multimodal Stream, Live Vision, Google Search Grounding |
| **NVIDIA Nemotron** | `nvidia/nemotron-4-340b-instruct` | Headless Backend Reasoning, Algorithmic Proofs, Deep Debugging |
| **OpenAI** | `gpt-4o`, `o1-preview` | Structured Tool Calling, JSON Schemas, Analytical Reasoning |
| **Anthropic** | `claude-3-5-sonnet` | Long-form Technical Architecture, Complex Synthesis |
| **DeepSeek** | `deepseek-r1` | Cost-Optimized Chain-of-Thought Reasoning |
| **Local Ollama** | `llama3.2`, `mistral` | Air-Gapped Zero-Latency Offline Computing |

- **Automated Health Pings & Failover:** Monitors provider availability every 60 seconds; automatically switches to secondary endpoints upon rate limits (HTTP 429) or transient network timeouts.
- **Token Usage & Latency Telemetry:** Tracks per-provider prompt tokens, completion tokens, and end-to-end latency metrics.

---

## 4.4 Neural Workspace Presentation Surface
The Neural Workspace automatically categorizes dense responses into 5 specialized presentation dimensions:
1. **Code Mode:** Multi-file syntax-highlighted IDE with line numbering, file tabs, copy to clipboard, and instant download.
2. **Data Mode:** Structured markdown tables, comparative evaluation matrices, and JSON viewers with search and CSV export.
3. **Structure Mode:** Interactive system architecture node graphs, ASCII dependency trees, and entity relationship diagrams.
4. **Paragraph Mode:** High-legibility editorial layout with estimated reading time, section progress trackers, and focus mode.
5. **Overview Mode:** Executive intelligence briefing with key takeaway callouts and verified web search citations.

---

## 4.5 Task & Reminder Engine (Temporal Scheduler)
Autonomous background task scheduling and operational reminder subsystem:
- **Data Attributes:** `id`, `title`, `description`, `due_time`, `priority` (`low` | `medium` | `high` | `urgent`), `status` (`pending` | `in_progress` | `completed` | `cancelled`), `recurrence` (`none` | `daily` | `weekly` | `monthly`), `tags`, `reminder_fired`.
- **Temporal Monitoring Loop:** Background cron ticker continuously evaluating pending tasks against current system clock.
- **Multimodal Dispatch:** Acoustic audio chime, vocal announcement via TTS, and persistent HUD notification toast upon task trigger.
- **Autonomous Tool Bindings:** Natural language function tools (`task_manager`, `task_scheduler`) enabling hands-free task creation, queries, and updates.

---

## 4.6 Long-Term Neural Memory Cluster
- **Persistent Memory Store (`jarvis_neural_memories`):** Automatic extraction and storage of operator preferences, project contexts, key relationships, and behavioral rules.
- **Dynamic System Prompt Injection:** Formats relevant active memories into the LLM system prompt context on every conversational turn.
- **Manual & Autonomous Memory Management:** Operator can view, search, pin, edit, or purge memories directly via the Memory Drawer.

---

## 4.7 Native Desktop OS Bridge (`main.py` / `jarvis_bridge.py`)
- **FastAPI / WebSocket Gateway:** Runs locally on `http://localhost:8000` / `ws://127.0.0.1:8765`.
- **System Controller:** Direct process launching (VS Code, Chrome, Terminal, Finder), process inspection, and window management via `psutil` and native OS APIs.
- **Air-Gapped Vector Memory:** Local persistent `ChromaDB` embeddings stored on host machine.
- **Hardware Telemetry Streaming:** Real-time CPU, GPU, RAM, disk, and battery telemetry streamed directly to the JARVIS HUD.

---

## 4.8 Authority Engine & Security Clearance
- **Clearance Hierarchy:** 5-tier access control:
  - `LEVEL 0 (OBSERVER)`: Read-only interface access.
  - `LEVEL 1 (OPERATOR)`: Standard chat, web search, weather, and workspace viewing.
  - `LEVEL 2 (ENGINEER)`: Code generation, workflow pipelines, and plugin management.
  - `LEVEL 3 (COMMANDER)`: Browser automation, task execution, and memory modifications.
  - `LEVEL 4 (ROOT / STARK CLEARANCE)`: OS bridge execution, shell commands, and security configuration.
- **Biometric Security Engine:** 128-dimensional facial vector embeddings and anti-spoof liveness verification.

---

# 5. Non-Functional Specifications

| Dimension | Target Specification |
| :--- | :--- |
| **Response Latency** | First-token stream latency $< 600\text{ms}$ on primary Gemini provider. |
| **Audio Latency** | TTS playback initialization $< 350\text{ms}$ with Web Audio buffer reuse. |
| **UI Performance** | 60 FPS continuous rendering on Canvas particle grids and 3D weather visualizers. |
| **Type Safety** | 100% strict TypeScript compilation (`tsc --noEmit` clean, 0 errors). |
| **Persistence** | Resilient client-side fallback storage with JSON schema versioning and migration guards. |
| **Aesthetic Standard** | Full adherence to Anti-Slop visual directives; mathematical padding scales and high-contrast accessibility. |

---

# 6. Implementation Verification Matrix

| Subsystem Module | Core Implementation File | Verification Test Suite | Status |
| :--- | :--- | :--- | :--- |
| **Autonomous Browser Agent** | `/services/browserAgent/browserAgent.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Element Parser** | `/services/browserAgent/elementParser.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Safety Guardrails** | `/services/browserAgent/safetyGuard.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Action Verifier** | `/services/browserAgent/actionVerifier.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Self-Healing Recovery Engine** | `/services/browserAgent/recoveryEngine.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Action Planner** | `/services/browserAgent/actionPlanner.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Browser Controller** | `/services/browserAgent/browserController.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Weather Atmosphere Console** | `/components/WeatherModal.tsx` | UI Regression / API live check | **PASS (100%)** |
| **Workflow Engine** | `/workflows/workflowEngine.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **Capability Registry** | `/services/capabilityRegistry.ts` | `scripts/verify_subsystems.ts` | **PASS (100%)** |
| **AI Provider Manager** | `/services/AIProviderManager.ts` | Multi-Provider Failover Suite | **PASS (100%)** |
| **Task & Reminder Engine** | `/services/taskScheduler.ts` | Temporal Scheduler Ticker | **PASS (100%)** |
| **Authority Engine** | `/services/authorityEngine.ts` | Clearance Gate Tests | **PASS (100%)** |

