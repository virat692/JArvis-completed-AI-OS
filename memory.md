# JARVIS AI OS — Current Implementation State & Memory
**Source of Truth:** `PRD.md` & System Audit  
**Document:** `memory.md`

---

## 1. Active State Snapshot

| Component | Status | Persistence Key / Mechanism |
| :--- | :--- | :--- |
| **Conversational Core** | Active | `App.tsx` state + `jarvis_ai_sessions` |
| **Neural Workspace** | Active | `services/contentClassifier.ts` + `jarvis_workspace_history` |
| **Long-Term Memory** | Active | `localStorage` (`jarvis_neural_memories`) with system prompt injection |
| **Nemotron Reasoning**| Active | `services/nemotronDelegation.ts` via OpenRouter |
| **Search Grounding** | Active | Gemini Google Search Tool (`generateContentStream`) |
| **Hardware Telemetry**| Honest (Sandbox) | `services/telemetryService.ts` (Browser sandbox reporting) |
| **OS Bridge Client** | Listening | `ws://127.0.0.1:8765` (`services/osBridgeService.ts`) |

---

## 2. Recent Critical Decisions
- **Zero Fake Data Mandate:** All mock hardware numbers removed across the UI; replaced with authentic environment detection.
- **Strict Response Routing:** Chat retains short/casual definitions; Workspace handles multi-row tables, code scripts, architectural flows, and long narratives.
- **Clean Full-Screen Modals:** Workspace and History panel upgraded to borderless, edge-to-edge full-screen views.
- **Top Bar Streamlining:** Removed telemetry pill and focus workspace button from the Voice Mode top bar.
