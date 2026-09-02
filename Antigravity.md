# Antigravity Agent Master Setup & System Operations Handbook
**Document:** `Antigravity.md`  
**Target System:** JARVIS AI Operating System (Version 5.0.0-PRO)  
**Classification:** Official Autonomous Setup, Deployment, & Operations Blueprint  
**Primary Architect / Orchestrator:** Google Antigravity Agent & DeepMind Gemini Core  
**Authoritative System Contract:** `JARVIS_MASTER_SPECIFICATION.md`  
**Current Date:** August 23, 2026  

---

## 1. Executive Mission & System Overview

JARVIS is an autonomous personal AI Operating System and unified command center crafted in TypeScript, React, and FastAPI. It strictly adheres to **`JARVIS_MASTER_SPECIFICATION.md`** as its single authoritative behavioral, architectural, and capability contract.

### Core Architecture Highlights:
- **Approved AI Ecosystem:** Exclusively powered by Google Gemini (Primary brain), NVIDIA Nemotron (Deep reasoning/architecture), OpenRouter (Failover/resilience), Exa (Deep research index), Tavily (Web search index), and OpenWeather (Meteorological provider).
- **Single Assistant Invariant:** JARVIS is the sole user-facing persona. All secondary models operate strictly as headless computation workers.
- **Autonomous Browser Agent (OTAV Engine) & Native PC Browser:** Dual-engine web automation combining DOM semantic parsing with direct Host Chrome/Edge launching via Native OS Bridge (`main.py` / `jarvis_bridge.py`).
- **Meteorological Atmosphere Console:** Edge-to-edge full-screen 3D HTML5 Canvas atmospheric visualizer powered by real-time OpenWeather / Open-Meteo data with dynamic aura lighting.
- **Neural Workspace (4 Modes):** Structured presentation layer supporting `CODE`, `STRUCTURE`, `DATA`, and `OVERVIEW`.
- **Honest Hardware Telemetry & Zero Fabrication:** Reports `HOST TELEMETRY: SANDBOXED` in browser sandbox mode, and streams real CPU, GPU, RAM, battery, and process metrics when the Python OS Bridge daemon is active.
- **NVIDIA OCR V2 & Screen Perception:** High-fidelity OCR text extraction pipeline paired with Gemini/Nemotron multimodal reasoning.
- **Authority, Biometrics & Safety:** 5-tier clearance hierarchy with destructive-action confirmation gates.

---

## 2. Complete Environment & Installation Guide

### 2.1 Web Frontend & Core Engine Setup

```bash
# 1. Install Node.js dependencies
npm install

# 2. Launch Development Server (binds to http://0.0.0.0:3000)
npm run dev

# 3. Build for Production / Container Deployment
npm run build

# 4. Type Check & Subsystem Linter
npm run lint
```

### 2.2 Native Desktop PC Control Bridge Setup (`main.py` / `jarvis_bridge.py`)

To enable **Full Real PC Control** (launching native apps like VS Code, Chrome, Terminal, inspecting real hardware metrics, managing processes, and local ChromaDB semantic memory):

```bash
# 1. Install Python 3.10+ native bridge dependencies
pip install fastapi uvicorn pydantic psutil chromadb httpx beautifulsoup4 websockets

# 2. Launch Native Python OS Bridge Server
python main.py
# (Starts Fast-API server on http://localhost:8000 and WebSocket on ws://127.0.0.1:8765)

# 3. Verify Local Bridge Health
curl http://localhost:8000/health
# Response: {"status":"online","memory_engine":"active","research_engine":"ready"}
```

*Note:* If running inside a cloud container without the local Python bridge, JARVIS automatically engages its safe browser sandbox mode (`HOST TELEMETRY: SANDBOXED`) without crashing.

---

## 3. Environment Variables Configuration (`.env`)

Create a `.env` file in the project root:

```env
# Primary Multimodal & Search Grounding LLM
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter Gateway (for NVIDIA Nemotron, DeepSeek R1, GPT-4o, Claude)
# Approved External Provider Keys (Configure via Settings > Credential Center)
GEMINI_API_KEY=your_gemini_api_key_here
NEMOTRON_API_KEY=your_nemotron_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
EXA_API_KEY=your_exa_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
NVIDIA_OCR_API_KEY=your_nvidia_ocr_api_key_here
```

---

## 4. Subsystem Topology & Directory Blueprint

```text
JARVIS AI OS (v5.0.0-PRO)
├── App.tsx                          # Core State Hub, Event Bus & Tool Execution Engine
├── server.ts                        # Express API & Vite Production Middleware Server
├── main.py                          # FastAPI Desktop OS Bridge Daemon (Local PC Control)
│
├── services/                        # Subsystem Services & Business Logic
│   ├── AIProviderManager.ts         # Multi-LLM provider manager, health check & failover
│   ├── nemotronDelegation.ts        # NVIDIA Nemotron headless reasoning execution loop
│   ├── authorityEngine.ts           # 5-tier security clearance hierarchy & token verification
│   ├── contentClassifier.ts         # Heuristic classifier for 5-mode Neural Workspace
│   ├── telemetryService.ts          # Authentic hardware telemetry & sandbox detector
│   ├── taskScheduler.ts             # 1Hz background cron ticker & multi-modal reminder alerts
│   ├── osBridge.ts                  # Client connector for ws://127.0.0.1:8765 & localhost:8000
│   ├── identitySecurityService.ts   # Biometric face embedding & anti-spoof liveness
│   ├── eventBus.ts                  # Memory-safe Pub/Sub broker for cross-module events
│   └── browserAgent/                # Autonomous Browser Agent (OTAV Engine)
│       ├── browserAgent.ts          # Master agent coordinator & OTAV lifecycle loop
│       ├── elementParser.ts         # DOM semantic element tokenizer ([el-1], [el-2])
│       ├── actionPlanner.ts         # Step decomposition & AI action planning
│       ├── safetyGuard.ts           # Risk classifier (SAFE, MEDIUM, HIGH, CRITICAL)
│       ├── actionVerifier.ts        # Post-action DOM delta & URL verification
│       ├── recoveryEngine.ts        # Self-healing selector fallback & fuzzy matcher
│       ├── browserController.ts     # Sandboxed browser driver & Playwright bridge
│       └── types.ts                 # Type-safe browser action & state schemas
│
├── components/                      # Holographic UI & Modal Surfaces
│   ├── CinematicUserWorkspace.tsx   # Primary HUD, audio-visual feedback & status header
│   ├── WeatherModal.tsx             # 3D Atmospheric Canvas & Open-Meteo weather console
│   ├── BrowserAgentHUD.tsx          # Real-time OTAV execution step inspector & safety prompts
│   ├── NeuralWorkspace/             # 5-mode presentation engine (Code, Data, DAG, Text, Brief)
│   ├── SystemTelemetryPanel.tsx     # Authentic hardware metrics & subsystem diagnostic gauges
│   ├── TaskPanel.tsx                # Temporal task queue, reminder editor & natural tools
│   ├── SwarmHubPanel.tsx            # Multi-agent coordination matrix (Architect, Coder, Auditor)
│   ├── WorkflowPanel.tsx            # Multi-step automation pipeline builder & execution history
│   └── OSControlConsole.tsx         # Desktop terminal emulator & process manager
│
├── runtime/                         # Runtime Engine & Subsystem Self-Healing
│   ├── runtimeEngine.ts             # 1Hz system heartbeat loop, crash interceptor & auto-repair
│   └── jobScheduler.ts              # Background asynchronous job dispatcher
│
├── agents/                          # Swarm Agent Platform
│   └── swarmManager.ts              # Micro-agent collaborative planning & auditing pipeline
│
├── plugins/                         # Dynamic Plugin Extension Architecture
│   └── pluginManager.ts             # Plugin registry, permissions inspector & runtime toggles
│
└── docs/                            # Deep Technical Documentation
    ├── BROWSER_AGENT_GUIDE.md       # Developer guide for the Autonomous Browser Agent
    └── METEOROLOGICAL_CONSOLE.md    # Developer guide for the Weather Atmosphere Engine
```

---

## 5. Verification & Health Check Playbook

Antigravity executes three sequential validation gates to verify 100% operational readiness:

### Step 1: Automated Subsystem Verification Script
```bash
npx tsx scripts/verify_subsystems.ts
```
*Verification Matrix Checked:*
- `[PASS]` Authority Engine (Clearance levels 0 to 4 + Token Gates)
- `[PASS]` Runtime Engine & Self-Healing Telemetry (1Hz Heartbeat loop)
- `[PASS]` Autonomous Workflow Engine (Step state machine & triggers)
- `[PASS]` Dynamic Plugin Extension Suite (Module registry & storage cache)
- `[PASS]` Swarm Agent Platform (Sequential collaborative thought synthesis)
- `[PASS]` Multi-LLM Provider Architecture & Failover (6 Model Adapters)
- `[PASS]` NVIDIA Nemotron Reasoning Delegation (Headless execution loop)
- `[PASS]` Task & Reminder Temporal Engine (1Hz cron scanner & acoustic alerts)
- `[PASS]` Autonomous Browser Agent Subsystem (Element parsing, OTAV, safety)
- `[PASS]` Native Host Browser Automation (Google Chrome & Microsoft Edge host execution)

### Step 2: TypeScript Strict Compilation Check
```bash
npm run lint
# Executes: tsc --noEmit (Must return 0 errors)
```

### Step 3: Production Bundle Verification
```bash
npm run build
# Must output clean static bundles in dist/ and dist/server.cjs
```

---

## 6. Operational Invariants & Agent Guidelines

When modifying or expanding JARVIS, Antigravity **MUST** adhere to the following non-negotiable system invariants:

1. **Zero Fake Telemetry:** Never simulate hardware metrics in UI components. In browser sandbox mode, always display `"HOST TELEMETRY: SANDBOXED"`.
2. **Strict Workspace Thresholds:** Never trigger the Neural Workspace for casual greetings, conversational chat, or brief definitions. Only launch the Workspace for genuine multi-row tables, long scripts ($\ge 6$ lines), ASCII architecture diagrams, or deep essays ($\ge 180$ words).
3. **Single Persona Integrity:** Always maintain JARVIS as the sole assistant identity. Never leak internal reasoning workers (Nemotron, OpenAI, Claude) to the operator.
4. **Edge-to-Edge Spatial Aesthetics:** Keep modal surfaces, drawers, and the Weather/Workspace canvases borderless, full-screen, and visually unified.
5. **Safe Browser Automation:** Any browser step involving financial transactions, credit card data, checkout, or account deletion must trigger a `CRITICAL` risk interception for operator authorization.
6. **Documentation Synchronization:** Whenever new features or phases are deployed, update `PRD.md`, `architecture.md`, `phases.md`, `memory.md`, `PROJECT_STATUS.json`, and `Antigravity.md` simultaneously.

---

## 7. Quick Reference Command Cheat Sheet

| Intent | Action / Command | Expected Outcome |
| :--- | :--- | :--- |
| **Start Web App** | `npm run dev` | Dev server up at `http://localhost:3000` |
| **Start Desktop Bridge** | `python main.py` | Native PC automation active at `http://localhost:8000` |
| **Run Subsystem Tests** | `npx tsx scripts/verify_subsystems.ts` | 9 Subsystem modules verified (100% green) |
| **Lint & Typecheck** | `npm run lint` | 0 TypeScript errors |
| **Full Production Build** | `npm run build` | Builds `dist/` and `dist/server.cjs` |
| **Open Weather Console** | Click Weather icon or say *"JARVIS, weather"* | Full-screen 3D Canvas visualizer opens |
| **Launch Browser Agent** | Click Browser icon or ask research query | Real-time OTAV navigation HUD opens |
| **Switch System Console** | Click `SYSTEM CONSOLE` button in top header | Switches to developer telemetry & terminal |
