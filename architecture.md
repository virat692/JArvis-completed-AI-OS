# JARVIS AI OS — System Architecture
**Source of Truth:** `PRD.md` & August 17, 2026 Audit  
**Document:** `architecture.md`

---

## 1. High-Level Topology

```
                         ┌─────────────────────────┐
                         │      OPERATOR (USER)    │
                         │ Voice / Text / Vision   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   JARVIS KERNEL (App)   │
                         │ Event Bus / State Hub   │
                         └────────────┬────────────┘
                                      │
      ┌───────────────────────────────┼───────────────────────────────┐
      │                               │                               │
      ▼                               ▼                               ▼
┌───────────────┐            ┌─────────────────┐            ┌───────────────────┐
│ Voice & Audio │            │ Real Telemetry  │            │ Neural Workspace  │
│  Synthesizer  │            │ & OS Bridge WS  │            │  5-Mode Router    │
└───────────────┘            └────────┬────────┘            └───────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   AI Provider Manager   │
                         │  Task Router & Failover │
                         └────────────┬────────────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   │                  │                  │
                   ▼                  ▼                  ▼
             ┌───────────┐      ┌───────────┐      ┌────────────┐
             │  Gemini   │      │ Nemotron  │      │ OpenRouter │
             │ 2.5 Flash │      │  Worker   │      │  Failover  │
             └───────────┘      └───────────┘      └────────────┘
```

---

## 2. Core Subsystems

### 2.1 State Hub & Event Bus (`App.tsx`)
- Central coordination layer for user messages, camera/screen media streams, dynamic session archives, active memories, and modal controls.

### 2.2 Neural Workspace Presentation Router (`services/contentClassifier.ts`, `components/NeuralWorkspace/`)
- Dynamic parsing engine that classifies responses into **Code**, **Data Tables**, **System Structure**, **Paragraph**, or **Overview** modes.
- Strict boundary rules ensure that short definitions and conversational chat remain in the main HUD.

### 2.3 AI Provider Manager & Nemotron Delegation (`services/AIProviderManager.ts`, `services/nemotronDelegation.ts`)
- Primary multimodal stream generation via `@google/genai` with Google Search Grounding.
- Headless task delegation to NVIDIA Nemotron for deep reasoning, debugging, and multi-call execution loops.
- Zero-downtime failover to OpenRouter endpoints upon primary rate limit errors.

### 2.4 Telemetry & Local OS Bridge (`services/telemetryService.ts`, `services/osBridgeService.ts`)
- Honest hardware reporting: returns `HOST TELEMETRY: UNAVAILABLE` when running inside browser sandboxes without inventing fake values.
- WebSocket client listening on `ws://127.0.0.1:8765` for native PC automation when a local bridge daemon is active.

### 2.5 Storage & Persistence (`localStorage`)
- `jarvis_neural_memories`: Long-term user memories and preference injections.
- `jarvis_ai_sessions`: Clean conversational transcript archives (filtering internal telemetry ticks).
- `jarvis_workspace_history`: Retained presentation payload artifacts.
