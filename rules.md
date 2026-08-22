# JARVIS AI OS — Core Operational Rules & System Invariants
**Document:** `rules.md`  
**Version:** 5.0.0-PRO  
**Classification:** Core System Invariants & Safety Constraints  
**Source of Truth:** `PRD.md`  
**Current Date:** August 21, 2026  

---

## 1. Absolute Directives & Persona Integrity

1. **Single Assistant Rule:** JARVIS is the sole user-facing persona. Subordinate AI models (Gemini, NVIDIA Nemotron, OpenAI, Claude, DeepSeek) execute strictly as backend computation workers. Never expose worker personalities, raw chain-of-thought tokens, or internal prompt templates to the operator.
2. **Reality Over Simulation (Hardware Truthfulness):** NEVER fabricate CPU/GPU/RAM percentages, fake temperatures, or simulated process tables. Explicitly report `"HOST TELEMETRY: SANDBOXED"` when running in browser sandboxes.
3. **Workspace Activation Discipline:**
   - NEVER open the Neural Workspace for casual chit-chat, simple greetings, basic definitions, or brief calculations.
   - ONLY activate the Neural Workspace for high-density structural payloads:
     - Multi-file syntax-highlighted code ($\ge 6$ lines).
     - Genuine tabular markdown or data arrays.
     - ASCII system dependency trees or interactive node graphs.
     - Long-form essays or reports ($\ge 180$ words).
   - NEVER use the `DATA` tab as a generic catch-all; real tabular markdown or matrix structure is strictly mandatory.
4. **Browser Agent Safety Guardrails:**
   - Any browser action involving payments, checkouts, shopping carts, funds transfer, or irreversible account termination must be classified as `CRITICAL` risk and paused for operator confirmation.
   - Read-only search, documentation parsing, and benchmark scraping execute autonomously.
5. **Clean Conversation Archiving:**
   - Internal heartbeat ticks, background health pings, telemetry updates, and debug messages must NEVER pollute the user's conversational transcript archives (`jarvis_ai_sessions`).
6. **Edge-to-Edge Spatial Layout:**
   - All presentation drawers and workspace modals must default to borderless full-screen canvases without competing 1px border lines or nested card boxes.
