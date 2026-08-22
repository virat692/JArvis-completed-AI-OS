# JARVIS AI OS — Current State & Memory Management
**Document:** `memory.md`  
**Version:** 5.0.0-PRO  
**Classification:** Memory Architecture & State Tracking  
**Source of Truth:** `PRD.md`  
**Current Date:** August 21, 2026  

---

## 1. Active Subsystem State Snapshot

| Subsystem Component | Operational Status | Persistence Key / Protocol | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **Conversational Core** | Active (100%) | `App.tsx` State + `jarvis_ai_sessions` | Multimodal streaming, voice loop, tool execution |
| **Autonomous Browser Agent**| Active (100%) | `browserAgent.ts` + Memory Session | OTAV execution, DOM indexing, safety guardrails |
| **Meteorological Console** | Active (100%) | Open-Meteo API + 3D Canvas Cache | Real-time weather, forecast trendlines, 3D particles |
| **Neural Workspace** | Active (100%) | `services/contentClassifier.ts` | 5-mode presentation (Code, Data, Structure, Text, Overview) |
| **Long-Term Memory** | Active (100%) | `jarvis_neural_memories` | User preference extraction & system prompt injection |
| **Task & Reminder Engine** | Active (100%) | `jarvis_tasks_v2` | 1Hz temporal cron scan, multi-modal notification dispatch |
| **Nemotron Reasoning** | Active (100%) | OpenRouter API Gateway | Headless deep algorithmic proofs and debugging |
| **Search Grounding** | Active (100%) | Gemini `googleSearch` Tool | Real-time web fact retrieval and verified citations |
| **Hardware Telemetry** | Honest (100%) | `services/telemetryService.ts` | Honest sandbox reporting (`HOST TELEMETRY: SANDBOXED`) |
| **Native OS Bridge** | Listening (100%) | `ws://127.0.0.1:8765` (`main.py`) | Local PC automation, process control, ChromaDB vectors |
| **Swarm Agent Platform** | Active (100%) | `agents/swarmManager.ts` | 4 micro-agent collaborative planning & auditing |
| **Plugin Extension Suite**| Active (100%) | `plugins/pluginManager.ts` | Dynamic extension modules & capabilities |

---

## 2. Memory Architecture & Injection Lifecycle

1. **Short-Term Context Buffer:** Maintained within the active chat stream; pruned automatically to prevent token overflow.
2. **Episodic Session Store (`jarvis_ai_sessions`):** Records completed conversational rounds with timestamps, pinned status, and custom tags.
3. **Declarative Neural Memory (`jarvis_neural_memories`):**
   - Ingests user identity, coding preferences, hardware setups, and persistent instructions.
   - Formats active memories into a dedicated `<neural_memory_context>` system block injected into every Gemini/Nemotron inference turn.
4. **Local Vector Embeddings (Host Bridge):** Stored in local ChromaDB collections (`./jarvis_memory`) for semantic retrieval across gigabyte-scale document libraries.
