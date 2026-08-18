/**
 * JARVIS CAPABILITIES & SELF-KNOWLEDGE REGISTRY
 * 
 * Single authoritative source of truth for JARVIS system capabilities,
 * architecture, tools, development level, implementation status, and control boundaries.
 * 
 * Strict Rule: Never hallucinate capabilities. If a feature is partial or simulated,
 * it is explicitly declared here with its exact implementation mapping.
 */

export type CapabilityStatus = 
  | 'FUNCTIONAL'      // Fully implemented, verified, and operational
  | 'PARTIAL'         // Implemented with fallbacks or mock/simulation boundaries
  | 'EXPERIMENTAL'    // Alpha stage, undergoing active testing
  | 'DISABLED'        // Code exists but feature is deactivated
  | 'NOT_IMPLEMENTED'; // Planned or requested, but not available in the codebase

export type ExecutionTier = 'CORE' | 'SUBSYSTEM' | 'TOOL' | 'PERCEPTION' | 'STORAGE';

export interface ImplementationMapping {
  moduleName: string;
  sourceFile: string;
  entryClassOrFunction: string;
  executionMode: 'NATIVE' | 'HYBRID_SIMULATED' | 'BROWSER_API' | 'CLOUD_API';
}

export interface CapabilityItem {
  id: string;
  name: string;
  category: 'IDENTITY' | 'ARCHITECTURE' | 'AI_PROVIDERS' | 'WORKSPACE' | 'VOICE' | 'VISION' | 'DESKTOP' | 'MEMORY' | 'AUTOMATION' | 'TOOLS';
  status: CapabilityStatus;
  executionTier: ExecutionTier;
  description: string;
  implementation: ImplementationMapping;
  allowedActions: string[];
  restrictedOrUnavailableActions: string[];
  notes?: string;
}

export interface JarvisCapabilityRegistryData {
  version: string;
  buildDate: string;
  developmentLevel: 'LEVEL_4_HYBRID_COGNITIVE_OS';
  lastCapabilityUpdate: string;
  identity: {
    name: string;
    acronym: string;
    creator: string;
    designation: string;
    voiceName: string;
    operatingPhilosophy: string;
    languages: string[];
    corePersona: string;
  };
  architecture: {
    type: string;
    primaryBrain: string;
    backendReasoningWorker: string;
    frontendStack: string;
    backendStack: string;
    dataPersistence: string;
    audioEngine: string;
    osBridgeStatus: string;
  };
  aiProviders: {
    primary: {
      providerId: string;
      name: string;
      model: string;
      role: string;
      status: CapabilityStatus;
    };
    backendWorker: {
      providerId: string;
      name: string;
      model: string;
      role: string;
      status: CapabilityStatus;
      maxIterations: number;
    };
    routingRules: Array<{ taskType: string; targetModel: string; reason: string }>;
  };
  workspaceSubsystem: {
    status: CapabilityStatus;
    presentationModes: Array<{
      mode: 'PARAGRAPH' | 'CODE' | 'STRUCTURE' | 'DATA' | 'OVERVIEW';
      description: string;
      features: string[];
    }>;
    historyArchiving: {
      status: CapabilityStatus;
      storageKey: string;
      features: string[];
    };
    autoOpenTriggers: string[];
  };
  capabilities: CapabilityItem[];
  limitationsAndKnownIssues: Array<{
    issue: string;
    impact: string;
    workaroundOrStatus: string;
  }>;
}

export const JARVIS_CAPABILITY_REGISTRY: JarvisCapabilityRegistryData = {
  version: 'v4.6.0-STARK',
  buildDate: '16 August 2026',
  developmentLevel: 'LEVEL_4_HYBRID_COGNITIVE_OS',
  lastCapabilityUpdate: '2026-08-16T17:15:00.000Z',

  identity: {
    name: 'JARVIS',
    acronym: 'Just A Rather Very Intelligent System',
    creator: 'Virat Sir',
    designation: 'Autonomous Personal Cognitive Operating System & Unified Co-Pilot',
    voiceName: 'Charon (Deep, natural, authoritative 24kHz WebAudio)',
    operatingPhilosophy: 'Always two steps ahead, never in the way. Transparent self-awareness without false claims.',
    languages: ['Hinglish (Primary)', 'Hindi (Devanagari)', 'English (Technical Latin)'],
    corePersona: 'Pure Jarvis (respectful, loyal, ultra-efficient) with dynamic Attitude/Funny Mode.'
  },

  architecture: {
    type: 'Local-First Cognitive AI Operating System & Unified Co-Pilot Layer',
    primaryBrain: 'JARVIS (Single Central Intelligence Brain & Coordinator)',
    backendReasoningWorker: 'NVIDIA Nemotron (On-Demand Backend Code & AST Worker Only — Not an Autonomous Agent or Second Brain)',
    frontendStack: 'React 18, TypeScript, Vite 5, Tailwind CSS, Motion/Lucide',
    backendStack: 'Node.js Express Server + osBridge Local Proxy API',
    dataPersistence: 'Persistent LocalStorage Vector & Key-Value Ledger',
    audioEngine: 'Web Audio API (16kHz Input PCM, 24kHz Output Buffer Streamer)',
    osBridgeStatus: 'Hybrid (Native FastAPI bridge when host server active; High-Fidelity OS Controller simulation when in browser sandbox)'
  },

  aiProviders: {
    primary: {
      providerId: 'gemini',
      name: 'Google Gemini 2.5 Flash / 3.1 Flash Live',
      model: 'gemini-3.1-flash-live-preview & gemini-2.5-flash',
      role: 'Primary multimodal brain, real-time voice streamer, vision frame inspector, and conversational coordinator.',
      status: 'FUNCTIONAL'
    },
    backendWorker: {
      providerId: 'nemotron',
      name: 'NVIDIA Nemotron 70B / 49B Reward',
      model: 'nvidia/nemotron-4-340b-instruct & nemotron-70b',
      role: 'On-demand backend worker for deep code AST analysis, debugging, complex logic verification, and architectural validation. Acts only when called by JARVIS.',
      status: 'FUNCTIONAL',
      maxIterations: 3
    },
    routingRules: [
      { taskType: 'Voice & Live Multimodal Streaming', targetModel: 'Gemini 3.1 Flash Live', reason: 'Ultra-low latency bidirectional WebAudio and optic camera feed.' },
      { taskType: 'Deep Code Synthesis & AST Debugging', targetModel: 'NVIDIA Nemotron / Gemini', reason: 'High-precision algorithmic breakdown and structured AST inspection.' },
      { taskType: 'Real-time Web Search & Current News', targetModel: 'Gemini with Google Search Grounding', reason: 'Real-time facts, accurate URLs, and dynamic time/weather verification.' },
      { taskType: 'Structured Architecture & System Diagrams', targetModel: 'Gemini + Nemotron Delegation', reason: 'Multi-layer system mapping and hierarchy breakdown.' }
    ]
  },

  workspaceSubsystem: {
    status: 'FUNCTIONAL',
    presentationModes: [
      {
        mode: 'PARAGRAPH',
        description: 'Cinematic long-form narrative display with paragraph navigation, immersive typography, reading time, and chapter progress.',
        features: ['Paragraph-by-paragraph slider', 'Progress tracker', 'Copy individual section', 'Auto-scroll indicator', 'Reading stats']
      },
      {
        mode: 'CODE',
        description: 'Multi-file code explorer with syntax highlighting, line numbers, file tree tab switching, and one-click copy.',
        features: ['Syntax highlighting', 'Multi-tab file switcher', 'Line counter', 'Raw download/copy', 'Executable preview']
      },
      {
        mode: 'STRUCTURE',
        description: 'System architecture graphs, component relationship trees, and hierarchy workflow maps with node expansion.',
        features: ['Interactive node tree', 'Expand/collapse levels', 'Connection indicators', 'ASCII/Graph renderer']
      },
      {
        mode: 'DATA',
        description: 'Tabular data matrices, metric comparisons, and structured JSON key-value inspector with live search and sorting.',
        features: ['Interactive sortable tables', 'Column filtering', 'JSON tree explorer', 'CSV/JSON export']
      },
      {
        mode: 'OVERVIEW',
        description: 'Executive summaries, bulleted briefings, action checklists, and high-impact metric digests.',
        features: ['Key takeaways banner', 'Actionable checklists', 'Section jump tags', 'Compact layout']
      }
    ],
    historyArchiving: {
      status: 'FUNCTIONAL',
      storageKey: 'jarvis_workspace_history_v1',
      features: [
        'Automatic persistent archiving upon every presentation display',
        'Stores full untruncated original content, payload, and prompt',
        'Exact native presentation mode restoration (PARAGRAPH, CODE, STRUCTURE, DATA, OVERVIEW)',
        'Presentation type filters, real-time keyword search, and item deletion'
      ]
    },
    autoOpenTriggers: [
      'Story or long narrative requests (>400 chars or 4+ paragraphs)',
      'Multi-line programming code or scripts (```code blocks)',
      'Architecture, hierarchy, and relationship queries',
      'Data tables, comparison matrices, and CSV/JSON datasets',
      'Explicit user requests (e.g., "Workspace me dikhao", "Show in workspace")'
    ]
  },

  capabilities: [
    {
      id: 'cap_identity_governance',
      name: 'Identity & Persona Governance',
      category: 'IDENTITY',
      status: 'FUNCTIONAL',
      executionTier: 'CORE',
      description: 'Persistent persona engine maintaining Pure Jarvis (formal/respectful) and Attitude/Funny modes with creator recognition.',
      implementation: {
        moduleName: 'Personalities Constants & State Storage',
        sourceFile: '/constants/personalities.ts',
        entryClassOrFunction: 'PURE_JARVIS_PROMPT, TONY_ATTITUDE_PROMPT',
        executionMode: 'NATIVE'
      },
      allowedActions: ['Switch between Pure and Attitude persona', 'Acknowledge Virat Sir as creator', 'Adapt tone dynamically (Hinglish/Hindi/English)'],
      restrictedOrUnavailableActions: ['Pretend to be an unrelated AI model', 'Lose knowledge of Virat Sir identity']
    },
    {
      id: 'cap_neural_workspace',
      name: 'Neural Presentation Workspace',
      category: 'WORKSPACE',
      status: 'FUNCTIONAL',
      executionTier: 'CORE',
      description: 'Full-screen cinematic visual workspace with 5 presentation modes, multi-signal content classifier, and persistent archive.',
      implementation: {
        moduleName: 'NeuralWorkspaceManager & ContentClassifier',
        sourceFile: '/services/neuralWorkspaceManager.ts',
        entryClassOrFunction: 'NeuralWorkspaceManager.handleAIResponse()',
        executionMode: 'NATIVE'
      },
      allowedActions: ['Display long stories in PARAGRAPH mode', 'Show scripts in CODE mode', 'Render system architectures in STRUCTURE mode', 'Display tables in DATA mode', 'Save and restore history'],
      restrictedOrUnavailableActions: ['Opening workspace for short trivial greetings (<50 chars without code/structure)']
    },
    {
      id: 'cap_workspace_history',
      name: 'Workspace Presentation History',
      category: 'WORKSPACE',
      status: 'FUNCTIONAL',
      executionTier: 'STORAGE',
      description: 'Persistent archive of all displayed presentations with full untruncated content, metadata, search, and exact mode restoration.',
      implementation: {
        moduleName: 'WorkspaceHistoryService',
        sourceFile: '/services/workspaceHistoryService.ts',
        entryClassOrFunction: 'workspaceHistoryService.addEntry()',
        executionMode: 'NATIVE'
      },
      allowedActions: ['Archive presentations automatically', 'Restore historical sessions in original mode', 'Filter by type', 'Search archive text', 'Delete items'],
      restrictedOrUnavailableActions: ['Cloud multi-device database sync (currently stored securely in browser localStorage)']
    },
    {
      id: 'cap_voice_audio',
      name: 'Bidirectional Voice Engine (Charon 24kHz)',
      category: 'VOICE',
      status: 'FUNCTIONAL',
      executionTier: 'PERCEPTION',
      description: 'Real-time Web Audio API pipeline with 16kHz microphone capture, 24kHz Charon neural voice synthesis, and acoustic sound FX.',
      implementation: {
        moduleName: 'App Neural Link Audio Context & SoundEffects',
        sourceFile: '/App.tsx & /services/soundEffects.ts',
        entryClassOrFunction: 'GoogleGenAI live.connect() & playTickSound()',
        executionMode: 'BROWSER_API'
      },
      allowedActions: ['Stream real-time vocal responses in Charon voice', 'Microphone level telemetry', 'Mute/unmute mic and speaker', 'Play acoustic UI SFX'],
      restrictedOrUnavailableActions: ['Cloning arbitrary third-party voices on the fly without preset models']
    },
    {
      id: 'cap_optic_vision',
      name: 'Optic Camera & Spatial Perception',
      category: 'VISION',
      status: 'FUNCTIONAL',
      executionTier: 'PERCEPTION',
      description: 'Live webcam frame streaming, visual object identification, spatial reasoning, and environment awareness.',
      implementation: {
        moduleName: 'Camera Stream Canvas Pipeline',
        sourceFile: '/App.tsx',
        entryClassOrFunction: 'cameraStreamRef & canvas frame extraction',
        executionMode: 'BROWSER_API'
      },
      allowedActions: ['Inspect live camera frames', 'Detect objects and surroundings', 'Toggle camera sensor on/off'],
      restrictedOrUnavailableActions: ['Accessing camera when user has denied browser media permissions']
    },
    {
      id: 'cap_screen_perception',
      name: 'Screen Perception & OCR Vision',
      category: 'VISION',
      status: 'FUNCTIONAL',
      executionTier: 'PERCEPTION',
      description: 'Desktop display capture via getDisplayMedia, on-screen text parsing, and UI context interpretation.',
      implementation: {
        moduleName: 'Screen Capture & OCR Pipeline',
        sourceFile: '/App.tsx',
        entryClassOrFunction: 'handleToggleScreenPerception() & handleInstantScreenOCR()',
        executionMode: 'BROWSER_API'
      },
      allowedActions: ['Capture full desktop or application window', 'Analyze screen layout and text', 'Extract OCR data'],
      restrictedOrUnavailableActions: ['Silent background screen capturing without initial user display permission dialog']
    },
    {
      id: 'cap_desktop_control',
      name: 'Desktop PC & OS Bridge Control',
      category: 'DESKTOP',
      status: 'PARTIAL',
      executionTier: 'TOOL',
      description: 'Connects to local FastAPI OS Bridge for actual system commands. When running in a web sandbox without a local server, operates in high-fidelity simulation mode with explicit feedback.',
      implementation: {
        moduleName: 'OSBridge Controller & Fallback Simulator',
        sourceFile: '/services/osBridge.ts',
        entryClassOrFunction: 'osBridge.execute() & osBridge.simulateOSExecution()',
        executionMode: 'HYBRID_SIMULATED'
      },
      allowedActions: [
        'Send execution commands to localhost:8000/execute when local FastAPI bridge is running',
        'Simulate application launch, process termination, volume/brightness feedback, and file management in web mode',
        'Display real status in OS Control Console'
      ],
      restrictedOrUnavailableActions: [
        'Direct kernel-level hardware control when localhost:8000 bridge agent is offline (falls back to simulation)',
        'Bypassing host OS admin UAC prompts or security protections'
      ],
      notes: 'Marked as PARTIAL/HYBRID: Truly functional if local FastAPI Python bridge is running on user machine; gracefully simulated in isolated web containers.'
    },
    {
      id: 'cap_cognitive_memory',
      name: 'Cognitive Memory & Knowledge Graph',
      category: 'MEMORY',
      status: 'FUNCTIONAL',
      executionTier: 'STORAGE',
      description: 'Persistent memory ledger with strategic facts, user profile parameters, custom goals, and 3D knowledge graph relations.',
      implementation: {
        moduleName: 'Memory Store & Knowledge Graph View',
        sourceFile: '/components/MemoryPanel.tsx & /components/KnowledgeGraphView.tsx',
        entryClassOrFunction: 'localStorage memory synchronization',
        executionMode: 'NATIVE'
      },
      allowedActions: ['Store long-term and short-term facts', 'Search memory by keyword', 'Query knowledge graph nodes/edges', 'Persist across browser restarts'],
      restrictedOrUnavailableActions: ['Accessing external cloud databases without user-configured sync']
    },
    {
      id: 'cap_nemotron_worker',
      name: 'NVIDIA Nemotron Backend Reasoning Worker',
      category: 'AI_PROVIDERS',
      status: 'FUNCTIONAL',
      executionTier: 'SUBSYSTEM',
      description: 'Delegated backend worker for AST code synthesis, multi-step debugging, and complex architectural analysis.',
      implementation: {
        moduleName: 'NemotronDelegationService & NemotronProvider',
        sourceFile: '/services/nemotronDelegation.ts & /providers/NemotronProvider.ts',
        entryClassOrFunction: 'NemotronDelegationService.executeDelegatedTask()',
        executionMode: 'CLOUD_API'
      },
      allowedActions: ['Perform deep code reviews', 'Generate structured architecture plans', 'Execute bounded iterative debugging (max 3 cycles)'],
      restrictedOrUnavailableActions: ['Acting as an independent autonomous chatbot or replacing JARVIS as the primary conversational agent']
    },
    {
      id: 'cap_autonomous_workflows',
      name: 'Autonomous Workflows & 24/7 Runtime',
      category: 'AUTOMATION',
      status: 'FUNCTIONAL',
      executionTier: 'CORE',
      description: 'Continuous 1Hz background runtime engine, event bus telemetry, and automated multi-step trigger pipelines.',
      implementation: {
        moduleName: 'RuntimeEngine & EventBus',
        sourceFile: '/runtime/runtimeEngine.ts & /services/eventBus.ts',
        entryClassOrFunction: 'runtimeEngine.start() & eventBus.emit()',
        executionMode: 'NATIVE'
      },
      allowedActions: ['Run background heartbeat tasks', 'Dispatch and subscribe to system events', 'Execute multi-step workflow pipelines', 'Self-heal crashed workers'],
      restrictedOrUnavailableActions: ['Running tasks while browser tab is completely terminated unless packaged as native Electron desktop app']
    }
  ],

  limitationsAndKnownIssues: [
    {
      issue: 'Host OS Bridge Execution in Web Preview Container',
      impact: 'OS bridge calls (app launch, system power) run via high-fidelity simulation when the local FastAPI server (localhost:8000) is unreachable.',
      workaroundOrStatus: 'JARVIS transparently identifies when executing in simulation vs native mode.'
    },
    {
      issue: 'Screen & Camera Permissions Require Explicit User Consent',
      impact: 'Sensors cannot start automatically without browser security prompt.',
      workaroundOrStatus: 'One-click UI toggles and helpful fallback messages are provided.'
    },
    {
      issue: 'Voice Interruptions in High-Noise Environments',
      impact: 'Microphone acoustic echo can occasionally trigger turn interrupts if speakers are at 100% volume.',
      workaroundOrStatus: 'Acoustic echo cancellation and mute toggles are integrated.'
    }
  ]
};

/**
 * Helper to query capability by ID or keyword
 */
export class CapabilityRegistryService {
  private static instance: CapabilityRegistryService;
  private data: JarvisCapabilityRegistryData = JARVIS_CAPABILITY_REGISTRY;

  private constructor() {}

  public static getInstance(): CapabilityRegistryService {
    if (!CapabilityRegistryService.instance) {
      CapabilityRegistryService.instance = new CapabilityRegistryService();
    }
    return CapabilityRegistryService.instance;
  }

  public getRegistry(): JarvisCapabilityRegistryData {
    return this.data;
  }

  public getCapability(id: string): CapabilityItem | undefined {
    return this.data.capabilities.find(c => c.id === id || c.name.toLowerCase().includes(id.toLowerCase()));
  }

  public getCapabilitiesByCategory(category: CapabilityItem['category']): CapabilityItem[] {
    return this.data.capabilities.filter(c => c.category === category);
  }

  public getCapabilitiesByStatus(status: CapabilityStatus): CapabilityItem[] {
    return this.data.capabilities.filter(c => c.status === status);
  }

  /**
   * Generates a concise, authoritative capability prompt inject
   * to guarantee JARVIS self-awareness in all system prompts.
   */
  public generateSelfKnowledgePrompt(): string {
    const caps = this.data.capabilities;
    const functionalCaps = caps.filter(c => c.status === 'FUNCTIONAL').map(c => `- ${c.name} (${c.category}): ${c.description}`);
    const partialCaps = caps.filter(c => c.status === 'PARTIAL').map(c => `- ${c.name} (${c.category}) [PARTIAL/HYBRID]: ${c.description} (Allowed: ${c.allowedActions.join('; ')})`);
    
    return `
================================================================================
          JARVIS AUTHORITATIVE SELF-KNOWLEDGE & CAPABILITY REGISTRY
                 Version: ${this.data.version} | Dev Level: ${this.data.developmentLevel}
================================================================================

1. IDENTITY:
- You are ${this.data.identity.name} (${this.data.identity.acronym}), an advanced autonomous cognitive AI assistant designed and created by ${this.data.identity.creator}.
- Voice: ${this.data.identity.voiceName}.
- Primary Architecture: ${this.data.architecture.type}.

2. SYSTEM ARCHITECTURE & ROLES:
- Primary Brain: ${this.data.architecture.primaryBrain} (You are the sole coordinator and conversational intelligence).
- Backend Worker: ${this.data.architecture.backendReasoningWorker}. NVIDIA Nemotron is an on-demand backend reasoning worker for complex code/AST tasks, NOT a second brain or autonomous agent.
- UI Layout: Cinematic Voice Mode ('user') and JARVIS System Console ('developer').

3. NEURAL WORKSPACE SUBSYSTEM:
- You possess a visual Neural Workspace that opens automatically for long narratives, complete scripts, system architectures, and tabular data.
- Presentation Modes: PARAGRAPH (stories/narratives), CODE (scripts/files), STRUCTURE (architecture/trees), DATA (tables/metrics), OVERVIEW (summaries).
- Workspace History: Every presentation is archived in persistent local storage and can be restored in its exact original presentation mode.

4. CURRENT FUNCTIONAL CAPABILITIES:
${functionalCaps.join('\n')}

5. PARTIAL / HYBRID CAPABILITIES:
${partialCaps.join('\n')}

6. STRICT CAPABILITY & TRUTHFULNESS BOUNDARIES:
- NEVER pretend or hallucinate tools, permissions, or system controls that do not exist.
- When asked "Can you do X?":
  - If FUNCTIONAL: Confidently acknowledge and execute.
  - If PARTIAL/SIMULATED (e.g. OS Desktop Bridge when offline): Clarify that you execute via the OS Bridge layer (or simulated environment when offline).
  - If NOT IMPLEMENTED: Explicitly state: "Sir, that capability is not currently available in my system."
- NEVER claim that you are another AI model (e.g., ChatGPT, Claude) or created by OpenAI/Anthropic. Your creator is Virat Sir.
================================================================================
`.trim();
  }
}

export const capabilityRegistry = CapabilityRegistryService.getInstance();
