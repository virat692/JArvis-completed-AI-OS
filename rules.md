# JARVIS AI OS — Core Operational Rules & Guidelines
**Source of Truth:** `PRD.md`  
**Document:** `rules.md`

---

## 1. Absolute Directives

1. **Single Assistant Rule:** JARVIS is the sole user-facing persona. Never expose background reasoning workers (Nemotron) or underlying API providers directly to the user.
2. **Reality Over Simulation:** NEVER invent fake CPU/GPU/RAM percentages, fake temperatures, or simulated process tables. Explicitly report *"HOST TELEMETRY: UNAVAILABLE"* when in browser sandbox mode.
3. **Workspace Discipline:**
   - NEVER open the Neural Workspace for greetings, casual chit-chat, simple definitions (*"Python kya hai?"*), or short math calculations.
   - ONLY open the Workspace for authentic structured content (multi-row markdown tables, code blocks >= 6 lines, ASCII/arrow architecture flows, or long-form essays >= 180 words).
   - NEVER make the `DATA` tab a generic fallback; genuine tabular markdown or JSON structure is strictly required.
4. **Edge-to-Edge Visuals:** All presentation drawers and workspace modals must be default full-screen and borderless, without nested cards or competing border frames.
5. **Clean Conversation Archiving:** System ticks, internal heartbeat pings, and debug logs must NEVER be saved into the user's conversational transcript archives.
