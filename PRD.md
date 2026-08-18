# JARVIS AI OS
## Product Requirements Document (PRD)

**Document:** `PRD.md`  
**Product:** JARVIS AI OS  
**Document Status:** Active Product Specification  
**Source of Truth:** JARVIS Complete Factual System Audit Report  
**Audit Date:** August 17, 2026  
**Current Environment:** Google AI Studio Cloud Run Container / React + TypeScript SPA  
**Current Product Classification:** Advanced Functional Web AI Assistant  
**Estimated Current Completion:** 68%

---

# 1. Product Overview

JARVIS is an AI-powered personal operating environment designed to provide a unified interface for conversational AI, voice interaction, vision, web research, memory, intelligent presentation, and eventually direct local computer control.

JARVIS is intended to behave as a single intelligent assistant rather than a collection of independent AI personalities.

The user interacts with JARVIS primarily through:

- Voice
- Text
- Vision
- Screen context
- Workspace presentations
- System controls

JARVIS uses multiple AI providers internally when appropriate, but the user should experience this as communication with **one assistant: JARVIS**.

NVIDIA Nemotron is a backend reasoning worker. It is not a separate user-facing assistant.

---

# 2. Product Vision

The long-term vision is to make JARVIS a capable personal AI operating environment that can:

1. Understand natural language and voice commands.
2. Understand visual information.
3. Research current information from the internet.
4. Remember relevant user information and previous interactions.
5. Present large amounts of information intelligently.
6. Generate and explain code.
7. Analyze complex technical problems.
8. Delegate demanding reasoning tasks to specialized backend models.
9. Control the user's local computer when a trusted local bridge is available.
10. Operate through a consistent, futuristic interface.
11. Preserve user conversations, memories, and workspace information.
12. Remain transparent about what it can and cannot access.

The ultimate goal is not to create a complicated dashboard.

The goal is to create an assistant that feels like a **personal AI operating layer**.

---

# 3. Product Principles

JARVIS must follow these core principles.

## 3.1 Single Assistant Principle

JARVIS is the only user-facing intelligence.

Other AI models such as Gemini, Nemotron, OpenRouter providers, or future providers operate internally.

The user should never need to manage multiple AI personalities during normal operation.

---

## 3.2 Reality Over Simulation

JARVIS must never fabricate access to hardware, operating-system information, applications, files, or telemetry.

If JARVIS cannot access something, it must explicitly report that limitation.

Example:

> "Your local device telemetry is unavailable because JARVIS is currently running inside a browser sandbox and the local bridge is not connected."

JARVIS must never display fake CPU, GPU, RAM, disk, battery, temperature, or similar system values.

---

## 3.3 Context-Appropriate Presentation

Not every response requires a workspace.

Short conversational responses should remain inside the main chat/voice interface.

Large or structured responses should use the Neural Workspace.

---

## 3.4 Model Abstraction

JARVIS must not depend on a single AI provider.

The architecture should allow AI providers to be replaced or added without redesigning the JARVIS Kernel.

---

## 3.5 User-Centered Intelligence

JARVIS should optimize for the user's task rather than exposing internal implementation details.

The user should ask for something naturally.

JARVIS determines:

- Which model to use
- Whether web research is required
- Whether tools are required
- Whether workspace presentation is required
- Whether the task requires Nemotron reasoning
- Whether local device access is available

---

# 4. Target User

The primary target user is an individual operator who wants a powerful personal AI assistant capable of handling:

- General questions
- Technical questions
- Programming
- Research
- Writing
- Voice interaction
- Vision-based analysis
- Internet research
- Personal memory
- Computer automation
- Data presentation
- Architecture visualization

The interface should remain understandable to a non-expert user while providing advanced capabilities underneath.

---

# 5. Current Product Status

Based on the August 17, 2026 audit:

| Area | Current Status |
|---|---:|
| Overall Product | 68% |
| Frontend UI / Presentation | 95% |
| AI Intelligence / Conversation | 90% |
| Neural Workspace | 88% |
| Local OS / Native Hardware | 20% |

These percentages are audit estimates and should not be interpreted as automated test coverage.

---

# 6. Current Technology Stack

According to the audit, JARVIS currently uses:

## Frontend

- React 19
- TypeScript
- Vite 6
- Tailwind CSS
- Lucide React Icons
- Motion / Framer Motion
- HTML5 Canvas
- WebGL

## AI

- `@google/genai`
- Gemini 2.5 Flash
- OpenRouter API
- NVIDIA Nemotron

## Audio

- Web Audio API
- Web Speech API
- `SpeechSynthesis`
- `webkitSpeechRecognition`

## Storage

- Browser `localStorage`

## Local Communication

- WebSocket
- Expected local bridge:
  - `ws://127.0.0.1:8765`

---

# 7. High-Level Architecture

The current conceptual architecture is:

```text
                         ┌─────────────────────┐
                         │       USER          │
                         │ Voice / Text /      │
                         │ Vision / Screen     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    JARVIS CORE      │
                         │      App.tsx        │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌────────────┐       ┌──────────────┐       ┌──────────────┐
      │ Event Bus  │       │ Tool System  │       │   Workspace  │
      │ & State    │       │ / OS Bridge  │       │ Presentation │
      └────────────┘       └──────┬───────┘       └──────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ AI Provider Manager │
                         └──────────┬──────────┘
                                    │
                         ┌──────────┼──────────┐
                         │          │          │
                         ▼          ▼          ▼
                      Gemini    Nemotron    OpenRouter
```

---

# 8. Functional Specifications

## 8.1 Conversational AI & Live Grounding
- **Multimodal Perception:** Real-time stream generation handling text, camera video frames, and display screens via Google GenAI SDK.
- **Search Grounding:** Google Search Grounding dynamically enabled for queries requiring real-time web facts, current events, and live citations.
- **Failover Mechanism:** Automated zero-downtime failover to OpenRouter endpoints upon primary rate limit (429) detection.

## 8.2 Backend Reasoning Worker (NVIDIA Nemotron)
- **Role:** Headless, internal reasoning worker for deep code debugging, complex architectural proofs, and multi-step logic.
- **Encapsulation:** Never exposes raw worker personality to the operator; JARVIS evaluates and formats all worker outputs.
- **Execution Loop:** Maximum 3 iterations with automated context pruning to preserve token limits.

## 8.3 Neural Workspace Presentation
- **Dynamic Classification:** Automatically parses outputs into 5 specialized presentation views:
  1. **Code:** Multi-file syntax highlighted editor with copy/export for scripts.
  2. **Data:** Tabular markdown grids and comparative matrix cards (strictly guarded against non-table content).
  3. **Structure:** Interactive system architecture node graphs and ASCII project trees.
  4. **Paragraph:** Clean, high-readability typography with estimated reading time for stories and long-form essays.
  5. **Overview:** Executive intelligence briefing with grounded web citations.
- **Activation Boundary:** Small definitions, casual queries, greetings, and brief math strictly remain in the voice/chat screen without triggering workspace popups.

## 8.4 Telemetry & Local OS Bridge
- **Honest Hardware Reporting:** Displays explicit "Host Telemetry Unavailable" when operating in browser sandbox mode.
- **Local Bridge Protocol:** WebSocket connection (`ws://127.0.0.1:8765`) to communicate with optional local host daemons for native shell execution and process inspection.

## 8.5 Memory & Session Management
- **Neural Memory Cluster:** Persistent storage of user facts, preferences, and profile data with real-time system prompt injection.
- **Session Archives:** Edge-to-edge, borderless full-screen history panel with search, pin, export, and transcript management.

## 8.6 Task & Reminder Engine (Autonomous Temporal & Action Engine)
- **Unified Task & Schedule Architecture:** Dedicated task and reminder subsystem operating alongside Neural Memory and Runtime Engine without conflating episodic memory with operational action items.
- **Data Model:**
  - `id`: Unique string identifier.
  - `title`: Primary task headline or reminder description.
  - `description`: Optional detailed context or execution steps.
  - `due_time`: Optional timestamp or ISO date string for scheduled execution/reminders.
  - `priority`: Priority classification (`low`, `medium`, `high`, `urgent`).
  - `status`: Lifecycle state (`pending`, `in_progress`, `completed`, `cancelled`).
  - `recurrence`: Recurring frequency rule (`none`, `daily`, `weekly`, `monthly`, `custom`).
  - `tags`: Classification tags for grouping and contextual search.
  - `created_at` / `updated_at` / `completed_at`: High-precision operational timestamps.
  - `reminder_fired`: Boolean flag tracking reminder notification delivery.
- **Autonomous Monitoring & Triggering:**
  - Periodic temporal scan loop (evaluating active tasks against system time).
  - EventBus integration (`task.created`, `task.updated`, `task.due`, `task.completed`, `task.deleted`) enabling real-time telemetry across the JARVIS interface.
  - Multi-modal reminder dispatch: Vocal announcement, digital acoustic alert, live HUD notification toast, and persistent system logging.
- **Recurrence Logic:** Completed recurring tasks automatically advance to their next occurrence cycle while archiving completion metrics.
- **Tool Integration & Natural Language Control:** JARVIS function calling tools (`task_manager`, `task_scheduler`) enabling hands-free creation, querying, updating, and completion of tasks via voice or text.
- **Visual Interface:** Holographic, cyberpunk HUD Task & Reminder management drawer with filter tabs (All, Pending, Today, Upcoming, Completed), fast creation, inline priority toggling, and search.
- **Persistence:** Resilient client-side persistence in `localStorage` with fail-safe schema migration and backup.

---

# 9. Non-Functional Requirements
- **Performance:** Low-latency token streaming and Web Audio UI sound synthesis.
- **Visual Design:** Holographic dark cyber aesthetic utilizing responsive Canvas particles, high-contrast typography, and zero competing border clutter.
- **Security:** Sandbox isolation with client-side key storage and explicit permission controls for camera, microphone, and display sharing.
