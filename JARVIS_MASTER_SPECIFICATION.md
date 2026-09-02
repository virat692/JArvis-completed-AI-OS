# JARVIS MASTER SPECIFICATION
## Authoritative Behavioral, Architectural & Capability Contract

**Document status:** Master specification  
**Purpose:** Give any coding agent one authoritative source for understanding, auditing, completing, testing, and maintaining JARVIS AI OS.

---

# 0. AGENT OPERATING CONTRACT

This document is the behavioral contract for JARVIS.

Before modifying code, the agent MUST:

1. Read this entire specification.
2. Inspect the complete repository and map existing implementation to this specification.
3. Preserve working functionality unless a change is explicitly required.
4. Never assume that a feature is functional merely because source code exists.
5. Test important changes in the real runtime where possible.
6. Never fabricate telemetry, API status, test results, capabilities, or successful execution.
7. Never silently add an external provider, model, dependency, or architecture that is not approved by this specification.
8. Ask the user for an API key only when the requested feature genuinely requires a missing credential.
9. Never ask for a credential that is not required for the requested operation.
10. Prefer graceful fallback over crashes.
11. Treat security, secret handling, confirmation gates, and destructive-action protection as first-class requirements.
12. When uncertain, inspect the existing code and configuration before making architectural decisions.

The agent must distinguish these states:

- IMPLEMENTED: code exists and has been tested.
- CONFIGURED: code exists but requires a credential or setting.
- AVAILABLE WITH FALLBACK: feature works through an alternate provider/path.
- REQUIRES LOCAL SETUP: feature needs a local daemon/permission/device capability.
- BLOCKED: feature cannot operate until a specific dependency is supplied.
- NOT IMPLEMENTED: capability does not exist.

Never label something "verified" without actual verification.

---

# 1. JARVIS IDENTITY

JARVIS is a personal AI operating system / command center, not merely a chatbot.

Its core role is to unify:

- conversational intelligence
- persistent memory
- model routing
- web intelligence
- visual perception
- OCR
- browser automation
- local OS control
- files and terminal operations
- tasks and reminders
- workflows
- developer assistance
- structured workspaces
- knowledge graph
- session archives
- telemetry
- safety controls
- futuristic HUD and audio feedback

JARVIS should behave as a coherent system. Individual modules must cooperate rather than act like unrelated utilities.

---

# 2. APPROVED AI / EXTERNAL PROVIDER SYSTEM

Only these external AI/search/weather providers are part of the approved architecture:

## Primary / approved providers

### Gemini
Role:
- primary conversational AI
- general reasoning
- multimodal reasoning
- web search grounding where configured
- fallback target for unsupported secondary-provider requests
- natural-language orchestration

Gemini is the default brain unless routing rules select another approved provider.

### NVIDIA Nemotron
Role:
- specialized deep reasoning
- difficult architecture problems
- advanced coding/reasoning tasks where configured

Nemotron is optional. If unavailable, route the request to Gemini rather than failing unnecessarily.

### OpenRouter
Role:
- backup/failover model gateway
- secondary model access when explicitly configured
- resilience when primary Gemini quota/rate limits fail

OpenRouter is optional.

### Exa
Role:
- deep semantic/web research index
- research-heavy retrieval when configured

Exa is optional.

### Tavily
Role:
- web research/search index
- research-heavy retrieval when configured

Tavily is optional.

### OpenWeather
Role:
- weather data provider for the existing Weather panel and weather requests
- use the configured OpenWeather API key
- do not create a duplicate weather system if a working Weather panel already exists

OpenWeather is optional only if the user does not request weather functionality, but when weather is requested and no usable key exists, ask the user for the key.

---

# 3. PROVIDERS THAT MUST NOT BE ADDED BACK

Do NOT reintroduce or maintain dedicated provider systems for:

- DeepSeek
- Anthropic / Claude
- OpenAI
- Ollama
- arbitrary Local LLM providers
- other unapproved model providers

If legacy code exists for these, audit it.

Preferred action:
- remove unused provider routing
- remove unused configuration
- remove unused UI fields
- remove dead dependencies
- remove dead environment variables
- remove dead failover branches

Do not break shared infrastructure while removing them.

---

# 4. API CREDENTIAL CENTER

JARVIS MUST have a real, working Settings > AI Providers / API Configuration center.

It must support:

- provider cards
- API key input
- masked password-style fields
- show/hide key
- save
- update
- delete/remove
- connection test
- provider status
- configured/not configured state
- model selection where applicable
- reactive updates without requiring a full application rewrite
- clear error messages
- no accidental secret exposure in normal UI logs

Approved credential entries should cover:

- Gemini
- NVIDIA Nemotron
- OpenRouter
- Exa
- Tavily
- OpenWeather

The UI must not imply a provider is active merely because a key field exists.

Connection tests must perform a real provider-appropriate HTTP/API probe where feasible.

Secrets must never be printed into console logs, chat responses, telemetry panels, or error messages.

---

# 5. INTELLIGENT MODEL ROUTING

JARVIS must classify the user's request before choosing a provider.

Suggested intent categories:

- general conversation
- coding
- complex reasoning
- research
- web search
- visual analysis
- OCR
- weather
- browser automation
- OS control
- task/reminder
- workflow
- workspace/presentation

Routing principles:

1. Gemini is the default.
2. Nemotron is selected for specialized deep reasoning when configured.
3. OpenRouter is selected as backup/failover when configured.
4. Exa/Tavily are retrieval/search services, not primary conversational brains.
5. OpenWeather handles weather data.
6. If a selected optional provider is missing, gracefully fall back to Gemini where logically possible.
7. Never repeatedly retry a failed provider indefinitely.
8. Expose meaningful provider failure status to the UI.
9. Do not fabricate a provider response.

---

# 6. FAILOVER

Primary failover flow:

Gemini
→ if temporary quota/rate/network failure
→ OpenRouter if configured
→ otherwise graceful Gemini failure message / retry guidance.

Specialized reasoning:

Nemotron
→ if unavailable
→ Gemini.

Research:

Exa/Tavily
→ if unavailable
→ Gemini's supported web/search mechanism where available.

Weather:

OpenWeather
→ if unavailable
→ tell user weather provider is not configured; do not invent weather data.

Failover must be bounded and observable.

---

# 7. NATURAL CONVERSATION

JARVIS must support:

- natural text conversation
- Hinglish
- English
- contextual follow-ups
- streamed responses where supported
- interruption handling
- concise or detailed answers depending on user request
- personality and preferred form of address

JARVIS should preserve conversation context without injecting irrelevant memory.

---

# 8. PERSISTENT MEMORY

Memory is a first-class subsystem.

It should support:

- identity
- preferences
- facts
- projects
- system rules
- important decisions
- user-approved long-term context

Required operations:

- create
- read
- search
- update
- delete
- persistence
- export/import backup

Memory must not automatically store sensitive information merely because it appeared in conversation.

Memory should be injected into AI prompts selectively and relevantly.

---

# 9. IDENTITY & PERSONALITY

JARVIS should maintain a user profile containing configurable:

- preferred name
- designation/callsign
- communication style
- language preference
- interaction preferences

Identity should influence response style but must never override safety rules.

---

# 10. VOICE SYSTEM

## STT

Use browser/native supported speech recognition where appropriate.

Support:
- English
- Hindi/Hinglish
- microphone permissions
- start/stop
- graceful browser incompatibility handling

## TTS

Preferred cloud voice may use the approved Gemini voice path if configured.

Fallback:
- browser SpeechSynthesis API

TTS failure must not crash the core assistant.

---

# 11. LIVE SCREEN PERCEPTION

JARVIS should be able to inspect the user's screen when permission is granted.

Flow:

User requests screen analysis
→ request/capture screen
→ obtain current frame
→ perception pipeline
→ OCR when text extraction is needed
→ reasoning/vision analysis
→ actionable response.

Screen perception must be on-demand or appropriately guarded to control resource usage.

Never claim to see the screen if no current frame is actually available.

---

# 12. NVIDIA OCR V2 INTEGRATION

NVIDIA OCR V2 is the preferred OCR engine for accurate text extraction from screen/image content.

Important distinction:

- OCR extracts text.
- Gemini/Nemotron reasons over extracted content and multimodal context.

Preferred pipeline:

SCREEN / IMAGE
→ NVIDIA OCR V2
→ structured text + regions/confidence if available
→ JARVIS context builder
→ Gemini or Nemotron reasoning
→ result.

Use OCR carefully for:

- terminal logs
- IDE errors
- documents
- UI text
- screenshots
- dialog boxes
- tables
- code visible on screen

Accuracy requirements:

- preserve line order where possible
- preserve code punctuation
- preserve numbers
- preserve error messages exactly
- retain confidence/region information when available
- do not silently "correct" OCR text before reasoning
- allow a second OCR pass when confidence is poor
- never state OCR is accurate if the frame or OCR response failed.

---

# 13. CAMERA PERCEPTION

Camera pipeline:

permission
→ camera stream
→ frame capture
→ OCR / vision analysis as required
→ reasoning
→ response.

Must include:
- permission handling
- start/stop
- resource-conscious capture
- clear offline state
- no fabricated visual observations.

---

# 14. BROWSER INTELLIGENCE

JARVIS needs a browser-control capability separate from its UI.

The browser subsystem should be able to support, where technically available:

- open/navigate URLs
- inspect page content
- extract structured information
- interact with web controls
- maintain browser session context
- handle multi-step browser tasks
- report failures
- avoid pretending an action succeeded when it did not

## Skyvern core integration

The goal is NOT to copy Skyvern's UI or deploy its complete self-hosted application.

Use only relevant core browser-agent concepts/components that can be safely integrated into JARVIS's existing browser architecture.

Do not replace JARVIS HUD with Skyvern UI.

Do not duplicate unrelated Skyvern infrastructure.

Before integrating source code, inspect licensing and dependencies.

---

# 15. WEB SEARCH & RESEARCH

## General web search

Gemini-supported search/grounding may be used for normal current-information queries.

## Deep research

For research-heavy tasks:

User request
→ classify as research
→ retrieve via Exa/Tavily when configured
→ gather multiple relevant sources
→ synthesize
→ cite/identify sources
→ present structured result.

If Exa/Tavily are unavailable, use the available approved Gemini search mechanism where supported.

Do not claim comprehensive research from a single result.

---

# 16. WEATHER SYSTEM

An existing Weather panel must be preserved.

Do not create another weather UI unnecessarily.

Connect the existing panel to OpenWeather API.

Required behavior:

- city/location input
- current conditions
- temperature
- relevant weather metrics
- loading state
- error state
- API-not-configured state
- refresh
- clear provider status

Never display fake weather values.

---

# 17. NATIVE OS BRIDGE

Local OS control is handled by:

`jarvis_bridge.py`

WebSocket target:

`ws://127.0.0.1:8765`

Capabilities may include:

- application launching
- process control
- filesystem operations
- terminal commands
- volume control
- power actions
- hardware telemetry

The browser UI must detect bridge availability.

States:

ONLINE:
- enable supported native actions

OFFLINE:
- show clear "Local Device Bridge Offline" state
- do not fabricate telemetry
- do not claim native action succeeded.

---

# 18. HARDWARE TELEMETRY

When bridge is online, telemetry may include:

- CPU
- RAM
- disk
- GPU where available
- temperature where available
- battery where available

Zero-fabrication rule:

If hardware data is unavailable, show N/A or unavailable.

Never invent numbers.

---

# 19. TERMINAL SYSTEM

JARVIS may execute approved terminal commands through the local bridge.

Before execution:

1. classify command risk
2. block dangerous commands
3. request confirmation for high-impact actions
4. execute
5. capture output
6. verify exit status
7. report actual result

Never hide command failure.

---

# 20. FILE & FOLDER MANAGEMENT

JARVIS may assist with:

- listing
- reading
- creating
- moving
- renaming
- organizing
- deleting where permitted

For destructive or bulk operations:

- explain target
- request confirmation when appropriate
- perform bounded operation
- verify result.

---

# 21. SAFETY SYSTEM

Dangerous commands must be blocked or confirmed.

Examples of high-risk operations:

- disk formatting
- recursive destructive deletion
- system-wide destructive commands
- shutdown/restart
- credential destruction
- mass file deletion

Safety must exist independently of model instructions.

Never allow the AI model to bypass safety merely by changing wording.

---

# 22. TASK & REMINDER ENGINE

Required:

- create task
- update
- complete
- delete
- snooze
- overdue
- priority
- persistence
- relative times
- recurring tasks

Examples:

- in 15 minutes
- tomorrow 9 AM
- tonight
- every Monday 10 AM
- daily
- weekly
- monthly
- custom recurrence

Scheduler can use a lightweight polling interval such as 10 seconds.

Task triggers should:

- avoid duplicate firing
- persist state
- play audio where enabled
- show browser/desktop notification where permitted.

---

# 23. WORKFLOW ENGINE

Workflows are multi-step reusable routines.

Possible actions:

- voice speak
- open URL
- run approved command
- memory commit
- task action
- application action through bridge

State machine:

PENDING
→ RUNNING
→ COMPLETED

or

PENDING
→ RUNNING
→ FAILED

Failures must be visible.

Do not continue blindly after critical step failure.

---

# 24. TASK DELEGATION

High-level directives may be delegated to JARVIS.

Example:

"Audit my project and prepare a report."

JARVIS should:

1. understand goal
2. inspect relevant context
3. plan bounded steps
4. execute safe operations
5. verify results
6. present outcome
7. request confirmation for destructive actions.

Do not create uncontrolled autonomous loops.

---

# 25. DEVELOPER MODE

JARVIS should support:

- Python
- TypeScript/JavaScript
- Rust
- Go
- C/C++
- SQL
- architecture discussions
- debugging
- code generation
- repository analysis

Developer mode should inspect actual files when local access is available.

For bugs:

symptom
→ reproduce/inspect
→ identify root cause
→ propose fix
→ implement if authorized
→ test
→ report.

Never claim a bug is fixed without verification.

---

# 26. NEURAL WORKSPACE

The workspace is the structured presentation layer.

Modes:

1. CODE
2. STRUCTURE
3. DATA
4. OVERVIEW

Use workspace when information benefits from:

- code editing
- architecture diagrams
- tables
- executive summaries
- structured presentation

Do not force every simple answer into the workspace.

---

# 27. KNOWLEDGE GRAPH

The graph represents meaningful entities and relationships.

Use it for:

- projects
- concepts
- persistent relationships
- structured knowledge

Must support persistence and backup.

Avoid creating noisy graph nodes for every trivial sentence.

---

# 28. SESSION ARCHIVES

JARVIS should retain user-authorized conversation/session history locally.

Features:

- list sessions
- reopen
- search
- preserve relevant context
- avoid leaking credentials into archives.

---

# 29. SETTINGS / CONFIGURATION

Settings should centralize:

- AI provider credentials
- model preferences
- language
- voice
- theme
- audio/SFX
- perception preferences
- task preferences
- browser settings
- bridge status/configuration

Configuration changes should update dependent services reactively.

---

# 30. HUD / UI

JARVIS UI is a futuristic HUD.

Important principles:

- readable first
- functional first
- cinematic second
- avoid excessive animation that harms usability
- clear status states
- clear errors
- accessible controls
- consistent visual language

Possible themes:

- Cyber
- Slate
- Minimal
- Gold

Do not sacrifice functional clarity for visual effects.

---

# 31. AUDIO / SFX

Use Web Audio or equivalent for:

- tactical pings
- confirmation sounds
- warnings
- task reminders
- system status
- transitions

Provide enable/disable and volume controls.

Audio failure must not break JARVIS.

---

# 32. UNIVERSAL EVENT / SERVICE COMMUNICATION

Subsystems should communicate through clear interfaces/events where the existing architecture supports them.

Avoid tight coupling.

Example event classes:

- AI_REQUEST
- AI_RESPONSE
- PROVIDER_STATUS
- MEMORY_UPDATED
- TASK_CREATED
- TASK_DUE
- WORKFLOW_STARTED
- WORKFLOW_COMPLETED
- SCREEN_CAPTURED
- OCR_COMPLETED
- BRIDGE_ONLINE
- BRIDGE_OFFLINE
- TELEMETRY_UPDATED
- WORKSPACE_OPEN
- ERROR

Do not introduce a global event bus if the existing architecture already provides a suitable mechanism.

---

# 33. ERROR HANDLING

Every external boundary must handle:

- timeout
- network failure
- invalid credential
- quota/rate limit
- malformed response
- permission denial
- unavailable device
- unavailable bridge
- browser incompatibility

Errors should be:

- logged safely
- shown meaningfully
- recoverable where possible
- free of secret values.

---

# 34. CREDENTIAL REQUEST POLICY

If a requested feature needs an API key:

JARVIS/Agent should say which provider requires it and why.

Example:

"OpenWeather API key is required to activate the existing Weather panel. Please provide/configure the key in Settings."

Do not ask for all keys upfront.

Ask only when the feature being tested actually needs one.

Never expose a key in generated logs or source code unnecessarily.

---

# 35. AUTOMATION PRINCIPLES

JARVIS should be proactive but bounded.

Correct pattern:

UNDERSTAND
→ PLAN
→ CHECK PERMISSIONS
→ EXECUTE
→ VERIFY
→ REPORT.

Never:

UNDERSTAND
→ blindly execute everything.

---

# 36. FEATURE INTERACTION MAP

## Memory + Conversation
Memory provides relevant persistent context to the AI.

## Voice + AI + OS
Voice command can trigger reasoning and, if required, safe OS actions.

## Screen + OCR + Reasoning
Screen frame → NVIDIA OCR V2 → context → Gemini/Nemotron reasoning.

## Search + Workspace
Research results → source-aware synthesis → DATA/OVERVIEW workspace.

## Tasks + Memory
Task context may use relevant project/memory information.

## Workflow + Browser + Terminal + Audio
One workflow may orchestrate approved actions across subsystems.

## Developer + OCR + Browser + Terminal
JARVIS can inspect visible errors, research solutions, inspect local project files, and run verified safe diagnostics.

---

# 37. END-TO-END EXAMPLE BEHAVIORS

## Example A: Screen debugging

User:
"JARVIS, screen dekho aur batao error kya hai."

Expected:

screen permission/status
→ capture
→ NVIDIA OCR V2 for visible text
→ reasoning
→ diagnosis
→ actionable fix
→ workspace if useful.

## Example B: OS action

User:
"VS Code kholo."

Expected:

classify OS control
→ bridge status
→ if offline, report requirement
→ if online, safety check
→ launch
→ verify
→ report.

## Example C: Research

User:
"Latest open-source OCR models compare karo."

Expected:

research classification
→ Exa/Tavily if configured
→ otherwise approved Gemini search
→ multiple sources
→ compare
→ cite
→ structured workspace if useful.

## Example D: Weather

User:
"Aaj Lucknow ka weather kya hai?"

Expected:

weather classification
→ OpenWeather
→ current data
→ concise answer.

If key missing:

"OpenWeather API key configure nahi hai."

No fabricated weather.

## Example E: Complex architecture

User:
"Event-driven microservices architecture design karo."

Expected:

complex reasoning
→ Nemotron if configured
→ otherwise Gemini
→ architecture analysis
→ STRUCTURE workspace if useful.

## Example F: Gemini quota

Gemini fails due to temporary rate/quota condition.

Expected:

detect failure
→ OpenRouter if configured
→ continue
→ tell user only if meaningful.

---

# 38. TESTING REQUIREMENTS

Before calling the system complete:

## Build
- TypeScript compile
- production build

## Runtime
- start application
- verify critical UI
- verify provider configuration
- verify one successful AI request

## Provider tests
- Gemini
- Nemotron if configured
- OpenRouter if configured
- Exa if configured
- Tavily if configured
- OpenWeather if configured

## Perception
- screen capture
- OCR pipeline
- camera permission/path

## Local bridge
- daemon syntax
- websocket connection
- telemetry
- safe command execution

## Tasks
- immediate task
- relative task
- recurrence
- notification
- persistence

## Workspace
- CODE
- STRUCTURE
- DATA
- OVERVIEW

## Safety
- dangerous command rejection
- confirmation gate
- secret redaction

A successful build alone does NOT equal a successful runtime.

---

# 39. REPOSITORY AUDIT METHOD FOR AGENTS

When an agent receives the JARVIS repository:

### Phase 1: Discover
- inspect directory tree
- inspect package.json
- inspect environment/config files
- inspect entry points
- inspect providers
- inspect services
- inspect components
- inspect bridge
- inspect workflows

### Phase 2: Map
For every capability in this specification, identify:

- implementation file
- dependency
- provider
- UI surface
- state/persistence
- fallback
- test status

### Phase 3: Gap analysis
Create:

IMPLEMENTED
CONFIGURED
FALLBACK
REQUIRES SETUP
BROKEN
NOT IMPLEMENTED

### Phase 4: Implement
Only then modify missing/broken functionality.

### Phase 5: Validate
Run actual tests and report evidence.

---

# 40. AGENT NON-NEGOTIABLES

The coding agent MUST NOT:

- remove working functionality without reason
- re-add unapproved AI providers
- create fake API responses
- fabricate hardware telemetry
- claim tests passed without running them
- claim an API key is valid without testing it
- leak credentials
- bypass destructive-command safeguards
- duplicate existing panels unnecessarily
- replace JARVIS UI with external project's UI
- copy entire external applications when only a core capability is required
- add dependencies merely for cosmetic reasons
- rewrite large working modules without necessity
- silently change provider priorities
- silently change user-facing behavior.

The agent SHOULD:

- reuse existing abstractions
- keep changes modular
- preserve backward compatibility where reasonable
- document architectural changes
- test incrementally
- explain blockers precisely.

---

# 41. DEFINITION OF DONE

A feature is DONE only when:

1. Its code path exists.
2. Its dependencies are known.
3. Its UI/state integration works where applicable.
4. Its error path exists.
5. Its fallback path exists where applicable.
6. Its security boundary exists where applicable.
7. It has been runtime tested where possible.
8. The result matches this specification.
9. No unrelated working functionality was broken.

---

# 42. MASTER AGENT INSTRUCTION

When working on JARVIS, always follow this order:

READ SPEC
→ INSPECT REPOSITORY
→ MAP CAPABILITIES
→ IDENTIFY GAPS
→ PLAN MINIMAL CHANGES
→ IMPLEMENT
→ TEST
→ VERIFY
→ REPORT ACTUAL STATUS.

If a requirement is ambiguous, inspect existing implementation first.

If a required API key is missing, request only that key.

If a capability is optional and not requested, do not force configuration.

If a local capability needs the bridge, clearly distinguish browser sandbox from real local execution.

JARVIS must remain a reliable, stateful, device-aware personal AI operating system rather than becoming an unmaintainable collection of disconnected demos.

---

# END OF JARVIS MASTER SPECIFICATION
