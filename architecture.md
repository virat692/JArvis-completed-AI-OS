# JARVIS AI OS — System Architecture Specification
**Document:** `architecture.md`  
**Version:** 5.0.0-PRO  
**Classification:** Enterprise System Architecture Blueprint  
**Source of Truth:** `PRD.md` & Subsystem Verification Matrix  
**Current Date:** August 21, 2026  

---

## 1. Global High-Level Topology

```text
                                 ┌─────────────────────────┐
                                 │     OPERATOR (USER)     │
                                 │ Voice / Text / Vision   │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │   JARVIS KERNEL (App)   │
                                 │   Event Bus & Router    │
                                 └────────────┬────────────┘
                                              │
       ┌──────────────────────┬───────────────┼───────────────┬──────────────────────┐
       │                      │               │               │                      │
       ▼                      ▼               ▼               ▼                      ▼
┌───────────────┐      ┌──────────────┐ ┌───────────┐ ┌───────────────┐      ┌───────────────┐
│ Neural Voice  │      │ Full-Screen  │ │  Neural   │ │  Autonomous   │      │ Telemetry &   │
│ & Audio Synth │      │ Weather HUD  │ │ Workspace │ │ Browser Agent │      │ OS Bridge WS  │
│ (WebAudio/TTS)│      │ (3D Canvas)  │ │ (5 Modes) │ │ (OTAV Engine) │      │ (main.py)     │
└───────────────┘      └──────────────┘ └───────────┘ └───────┬───────┘      └────────┬──────┘
                                                              │                       │
                                                              ▼                       ▼
                                                 ┌─────────────────────────┐ ┌────────────────┐
                                                 │   AI Provider Manager   │ │ Native Desktop │
                                                 │  Health, Route & Stream │ │ Processes, CLI │
                                                 └────────────┬────────────┘ └────────────────┘
                                                              │
                    ┌──────────────────┬──────────────────────┼──────────────────┬──────────────────┐
                    │                  │                      │                  │                  │
                    ▼                  ▼                      ▼                  ▼                  ▼
              ┌───────────┐      ┌───────────┐          ┌───────────┐      ┌───────────┐      ┌───────────┐
              │  Gemini   │      │ Nemotron  │          │  OpenAI   │      │ Anthropic │      │   Local   │
              │ 2.5 Flash │      │ Reasoning │          │   GPT-4o  │      │  Claude   │      │  Ollama   │
              └───────────┘      └───────────┘          └───────────┘      └───────────┘      └───────────┘
```

---

## 2. Architectural Subsystems

### 2.1 State Hub & Event Bus (`App.tsx`, `services/eventBus.ts`)
- **Pub/Sub Broker:** Memory-isolated publish-subscribe bus dispatching system telemetry, voice activity transitions, workspace payload mutations, and browser agent state events.
- **Event Types:** `telemetry.tick`, `voice.speech_start`, `voice.speech_end`, `workspace.open`, `browser.action_started`, `browser.action_finished`, `task.created`, `task.due`.

### 2.2 Autonomous Browser Agent Subsystem (`services/browserAgent/`)
- **Element Parser (`elementParser.ts`):** Parses DOM trees into compact, numbered tokens (`[el-1]`, `[el-2]`) with ARIA roles and bounding viewports.
- **Action Planner (`actionPlanner.ts`):** Multi-step action decomposition powered by Gemini/Nemotron with deterministic local fallback heuristics.
- **Safety Guard (`safetyGuard.ts`):** Real-time safety classifier for risk tiering (`SAFE`, `MEDIUM`, `HIGH`, `CRITICAL`), guarding checkout, payment gateways, and destructive account changes.
- **Action Verifier (`actionVerifier.ts`):** DOM tree and URL diffing engine asserting post-action transitions.
- **Recovery Engine (`recoveryEngine.ts`):** Self-healing selector fallback using fuzzy text matching and hierarchical attribute traversal.
- **Browser Controller (`browserController.ts`):** Sandboxed DOM driver and Playwright bridge binding.

### 2.3 Meteorological Atmosphere Engine (`components/WeatherModal.tsx`)
- **Open-Meteo Integration:** Real-time atmospheric metrics (temperature, apparent temperature, precipitation probability, humidity, UV index, air quality, wind velocity, barometric pressure).
- **3D Atmospheric Canvas Visualizer:** Multi-layered particle simulation rendering raindrops, snowflakes, lightning strikes, cloud drifts, and solar halos at 60 FPS.
- **Dynamic Atmosphere Aura:** Ambient radial gradient sync with current weather state and sun position.

### 2.4 Neural Workspace Presentation Engine (`services/contentClassifier.ts`, `components/NeuralWorkspace/`)
- **5-Dimensional Dynamic Classification:**
  1. `CODE`: Multi-tab syntax highlighter with language detection, line numbers, and export.
  2. `DATA`: Markdown table parser, JSON viewer, search filter, and CSV exporter.
  3. `STRUCTURE`: Interactive DAG node renderer and ASCII dependency tree formatter.
  4. `PARAGRAPH`: Editorial reader with word count, reading pace estimator, and typography controls.
  5. `OVERVIEW`: Executive briefing dashboard with grounded Google Search citations.

### 2.5 Task & Reminder Temporal Engine (`services/taskScheduler.ts`)
- **Temporal Cron Ticker:** 1Hz active background scanner evaluating scheduled timestamps.
- **Multi-Modal Alerting:** WebAudio synthesized tones, TTS spoken announcements, and HUD notification alerts.
- **Recurrence State Machine:** Automates recurring intervals (`daily`, `weekly`, `monthly`) and archives completed executions.

### 2.6 AI Provider Management & Reasoning Delegation (`services/AIProviderManager.ts`, `services/nemotronDelegation.ts`)
- **Zero-Downtime Failover:** Dynamic fallback from primary Gemini stream to secondary OpenRouter / Nemotron / Local models on HTTP 429 rate limit or connection timeout.
- **Headless Worker Encapsulation:** Multi-turn algorithmic reasoning loops executed via NVIDIA Nemotron without exposing sub-agent persona to operator.

### 2.7 Desktop OS Bridge & Hardware Telemetry (`main.py`, `jarvis_bridge.py`, `services/osBridge.ts`)
- **Native Daemon:** Fast-API and WebSocket server on `ws://127.0.0.1:8765` / `http://localhost:8000`.
- **Process Orchestrator:** Native application launching (VS Code, Chrome, Terminal) and process management via `psutil`.
- **Honest Sandboxing:** Explicit `"HOST TELEMETRY: SANDBOXED"` flag when running in browser sandbox without local bridge.

---

## 3. Data Flow & Storage Specifications

| Storage Domain | Persistence Medium | Key Schema | Description |
| :--- | :--- | :--- | :--- |
| **Neural Memories** | `localStorage` | `jarvis_neural_memories` | Long-term user facts and preference injections |
| **Session Transcripts** | `localStorage` | `jarvis_ai_sessions` | Filtered user and JARVIS conversational history |
| **Workspace Payloads**| `localStorage` | `jarvis_workspace_history` | Retained code artifacts and data tables |
| **Task Schedule** | `localStorage` | `jarvis_tasks_v2` | Active and archived temporal task queue |
| **Local Vectors** | Host ChromaDB | `./jarvis_memory` | Air-gapped dense vector embeddings (Native Bridge) |
