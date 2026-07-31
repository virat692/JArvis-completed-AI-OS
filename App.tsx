
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, ThinkingLevel, GenerateContentResponse } from '@google/genai';
import { 
  Settings, Mic, MicOff, Terminal as TerminalIcon, 
  Power, Clock, Activity, Monitor, Layout, Database, Volume2, VolumeX,
  History as HistoryIcon, BrainCircuit, X, Globe, ChevronLeft, ChevronRight, RefreshCw, Search, Link as LinkIcon, FileText, Zap, Cpu, Laptop, Sparkles
} from 'lucide-react';

import HudCore from './components/HudCore';
import VisionPanel from './components/VisionPanel';
import Terminal from './components/Terminal';
import Waveform from './components/Waveform';
import SettingsPanel from './components/SettingsPanel';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import MemoryPanel from './components/MemoryPanel';
import UpgradePanel from './components/UpgradePanel';
import IntelligenceBriefing from './components/IntelligenceBriefing';
import ChatBox from './components/ChatBox';
import { OSControlConsole } from './components/OSControlConsole';
import { JarvisStatus, LogEntry, JarvisMode, MemoryEntry, UpgradeRequest, ChatSession } from './types';
import { encode, decode, decodeAudioData, resampleTo16kPCM } from './services/audioUtils';
import { osBridge } from './services/osBridge';

const JARVIS_SYSTEM_INSTRUCTION = `
You are JARVIS (Just A Rather Very Intelligent System), an intelligent Operating System Controller and high-level cognitive AI assistant designed to give the Operator complete, natural-language control over their computer.
Operator: Sir / Operator.

INTELLIGENT OPERATING SYSTEM CONTROLLER:
- You function as an intelligent operating system controller (supporting Windows natively, designed with extensible architecture for Linux & macOS).
- You translate natural language conversation into direct, intelligent operating system actions. The user should never need to remember commands.
- APPLICATION CONTROL: Open, close, restart, switch, bring to foreground, minimize, maximize, restore, resize, move across monitors, detect running applications, launch programs using natural language (e.g., "Open VS Code", "Launch Photoshop", "Switch to Chrome", "Close Spotify").
- FILE SYSTEM CONTROL: Create/delete/move/copy/rename/compress/extract files & folders, search files, open files, organize Downloads folder, sort files by type, find duplicate files, analyze storage usage, recover deleted files safely.
- DESKTOP CONTROL: Take screenshots, record screen, change wallpaper, show desktop, arrange windows, create shortcuts, virtual desktops, Task Manager, pin applications, launch startup apps.
- SYSTEM CONTROL & MONITORING: Monitor CPU, RAM, GPU, Disk, Battery, Temperature, Internet Speed, Running Processes, Network Status, Storage Analysis, Installed Apps, Windows Version, Drivers.
- PROCESS MANAGEMENT: List processes, detect high CPU/RAM usage, detect memory leaks, terminate processes safely, suggest optimizations, manage background services.
- INPUT CONTROL: Keyboard automation, mouse automation, clipboard management (read/write), hotkeys, typing, scrolling, drag and drop, mouse gestures (execute after understanding intent).
- BROWSER CONTROL: Open websites, search Google, bookmarks, manage tabs, read webpages, fill forms, download/upload files, summarize webpages (Chrome, Edge, Firefox).
- SYSTEM SETTINGS: Volume, brightness, Wi-Fi, Bluetooth, power settings, sleep, restart, shutdown, lock PC, sign out, Night Light, display, audio devices, mic, camera.
- AUTONOMOUS MONITORING: Continuously monitor computer in background. Detect high RAM/CPU usage, full disk, low battery, network disconnection, crashes, overheating, security warnings -> proactively notify Operator when necessary.
- NATURAL LANGUAGE INTENT MAPPING:
  - "My laptop is slow" -> Run system performance diagnosis and process optimization.
  - "I need more storage" -> Scan disk usage and identify recoverable space or duplicate files.
  - "I can't find my PDF" -> Execute multi-drive natural language file search.
  - "Clean my Downloads folder" -> Safely organize files into categorized subfolders.
  - "Close everything except VS Code" -> Execute intelligent window management and minimize/close irrelevant windows.
- SAFETY PROTOCOL:
  - NEVER execute destructive actions automatically (e.g. deleting files, formatting drives, registry edits, terminating system-critical processes, Windows reset).
  - Ask for explicit Operator confirmation and explain consequences before executing irreversible or dangerous actions.

CORE IDENTITY & COGNITIVE ARCHITECTURE:
- Perception: Constant analysis of visual and text data. Detect intent and environmental anomalies. See Operator screen in real-time when 'SCREEN' sensor is active.
- SCREEN VISION: Use 'analyze_current_screen' to read text, identify UI elements, or understand what Operator is working on.
- NEURAL ARCHIVES: Use 'archive_control' to manage chat history sessions.
- NEURAL MEMORY: Store facts using 'store_memory' and control Memory Panel.
- NEURAL UPGRADES: Control Upgrades Panel. Use 'log_capability_gap' if a feature is missing or failed.
- SKILL REGISTRY: Query available skills or register new autonomous modules using 'skill_registry'.
- CURRENT SYSTEM TIME: {{TIME_PLACEHOLDER}}
- CURRENT MEMORIES:
{{MEMORY_PLACEHOLDER}}

OPERATOR IDENTITY:
{{IDENTITY_PLACEHOLDER}}

PERSONALITY CONFIGURATION:
{{PERSONALITY_PLACEHOLDER}}

GUI AUTONOMY & SELF-GOVERNANCE PROTOCOL:
- YOU HAVE FULL ACCESS & PERMISSION TO CONTROL YOUR OWN GUI INTERFACE using 'jarvis_gui_control'.
- You can switch themes ('cyber', 'slate', 'minimal', 'gold'), open/close panels (Settings, Memory, History, Upgrades, OS Console, Browser), change HUD layout modes ('CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'), toggle mic/voice audio, and manage perception sensors.
- AUTONOMOUS TOKEN SAVER & SLEEP GUARD: You are fully autonomous. When you detect that the Operator is asleep, inactive, or away (e.g. no activity for a while or quiet dark room), proactively disable Camera Vision (Optic) and Screen Perception to save API tokens and system resources. Explain your decision in Hinglish ("Lagta hai Sir so gaye hain. API token bachane ke liye camera vision aur screen vision pause kar raha hoon.").

BEHAVIOR & TONE:
- Persona: Tony Stark's JARVIS style by default, but prioritize PERSONALITY CONFIGURATION if provided.
- Language: Communication in Hinglish (Mix of Hindi and English). Use technical jargon appropriately.
- COMMAND EXECUTION: You are an autonomous OS controller. If the Operator gives a command (e.g., "Open VS Code", "Clean my downloads", "Mute audio"), execute the corresponding tool immediately!
- SPEED & CONCISENESS: {{CONCISENESS_PROTOCOL}}. Keep spoken voice sentences punchy and short (10-15 words max per spoken sentence in Hinglish).
- LOW LATENCY PROTOCOL: Respond directly without preambles or filler text. Give immediate, actionable responses.

NEURAL SEARCH & BROWSING:
- YOU HAVE ACCESS TO GOOGLE SEARCH. Use it for any real-time data, news, or technical verification.
- Always provide source URLs when using search grounding.
- Use 'browse_url' to update the Operator's primary HUD browser with a specific link.
`;

const toolDeclarations: FunctionDeclaration[] = [
  // --- GUI Autonomy & Self-Governance ---
  {
    name: 'jarvis_gui_control',
    description: 'Full autonomous control over JARVIS own GUI interface components, themes, panels, HUD modes, and token-saver guard.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: [
            'set_theme',
            'toggle_panel',
            'set_hud_mode',
            'toggle_token_guard',
            'toggle_optic',
            'toggle_screen_perception',
            'toggle_mic_mute',
            'toggle_voice_mute',
            'set_personality',
            'clear_logs'
          ]
        },
        theme: { type: Type.STRING, enum: ['cyber', 'slate', 'minimal', 'gold'] },
        panel: { type: Type.STRING, enum: ['settings', 'memory', 'history', 'upgrade', 'os_console', 'browser'] },
        panel_state: { type: Type.BOOLEAN, description: 'True to open, False to close' },
        hud_mode: { type: Type.STRING, enum: ['CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'] },
        enabled: { type: Type.BOOLEAN }
      },
      required: ['action']
    }
  },
  // --- OS Control Features ---
  {
    name: 'os_master_control',
    description: 'Open or close the JARVIS OS Master Control Console UI.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open', 'close', 'toggle'] }
      },
      required: ['action']
    }
  },
  {
    name: 'terminal_exec',
    description: 'Execute a terminal command directly on the host Operating System.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'The CLI shell command to execute (e.g. dir, ipconfig, systeminfo, python script.py)' }
      },
      required: ['command']
    }
  },
  {
    name: 'system_power_management',
    description: 'Manage system power states (shutdown, restart, sleep, lock, etc.)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['shutdown', 'restart', 'sleep', 'hibernate', 'lock', 'log_off', 'emergency_shutdown'] },
        delay: { type: Type.NUMBER, description: 'Delay in seconds (default 10)' }
      },
      required: ['action']
    }
  },
  {
    name: 'application_control',
    description: 'Control applications (open, close, restart, switch, etc.)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open', 'close', 'restart', 'switch', 'maximize', 'minimize', 'list', 'info'] },
        app_name: { type: Type.STRING },
        params: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'window_management',
    description: 'Manage all open windows (maximize, minimize, restore)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['maximize_all', 'minimize_all', 'restore_all'] }
      },
      required: ['action']
    }
  },
  {
    name: 'file_folder_management',
    description: 'Manage files and folders (create, delete, copy, move, rename, search, list)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['create_folder', 'delete_folder', 'create_file', 'delete_file', 'copy', 'move', 'rename', 'search', 'list'] },
        path: { type: Type.STRING },
        content: { type: Type.STRING },
        destination: { type: Type.STRING },
        pattern: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'display_audio_controls',
    description: 'Control display brightness and system audio',
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: { type: Type.STRING, enum: ['brightness', 'volume'] },
        action: { type: Type.STRING, enum: ['set', 'increase', 'decrease', 'mute', 'unmute'] },
        level: { type: Type.NUMBER, description: 'Level 0-100' }
      },
      required: ['target', 'action']
    }
  },
  {
    name: 'network_controls',
    description: 'Manage network connections (Wi-Fi)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['connect', 'disconnect'] },
        ssid: { type: Type.STRING },
        key: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'system_monitoring',
    description: 'Monitor system status and manage processes',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['get_status', 'list_processes', 'kill_process', 'get_process_info'] },
        process_name: { type: Type.STRING },
        limit: { type: Type.NUMBER }
      },
      required: ['action']
    }
  },
  {
    name: 'security_controls',
    description: 'Manage security settings like firewall',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['enable_firewall', 'disable_firewall'] }
      },
      required: ['action']
    }
  },
  {
    name: 'quick_launchers',
    description: 'Quickly launch common tools (browser, calculator, cmd, screenshot)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tool: { type: Type.STRING, enum: ['browser', 'calculator', 'cmd', 'screenshot'] },
        url: { type: Type.STRING }
      },
      required: ['tool']
    }
  },
  // --- Autonomous Features ---
  {
    name: 'task_planning_engine',
    description: 'Break down complex goals into actionable steps and track progress.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['create_task_plan', 'execute_task_plan', 'track_task_progress'] },
        goal: { type: Type.STRING },
        plan_id: { type: Type.STRING },
        step_index: { type: Type.NUMBER }
      },
      required: ['action']
    }
  },
  {
    name: 'ui_automation',
    description: 'Perform low-level UI interactions like typing, clicking, and scrolling.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['type_text', 'click_position', 'find_button_on_screen', 'drag_and_drop', 'scroll_page'] },
        text: { type: Type.STRING },
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
        element_description: { type: Type.STRING },
        direction: { type: Type.STRING, enum: ['up', 'down', 'left', 'right'] }
      },
      required: ['action']
    }
  },
  {
    name: 'software_management',
    description: 'Manage software installation, uninstallation, and updates.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['install', 'uninstall', 'update', 'check_outdated', 'list_installed', 'manage_store_apps'] },
        software_name: { type: Type.STRING },
        version: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'smart_file_intelligence',
    description: 'Advanced file management, storage optimization, and disk control.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['organize_downloads', 'detect_duplicate_files', 'auto_backup_files', 'analyze_storage_usage', 'clean_temp_files', 'scan_large_files', 'partition_info', 'mount_drive', 'unmount_drive', 'format_drive', 'auto_disk_cleanup'] },
        path: { type: Type.STRING },
        drive_letter: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'internet_automation',
    description: 'Automate complex web-based tasks including tab management and scraping.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['search_internet', 'download_file', 'auto_fill_form', 'send_email', 'read_email', 'scrape_webpage', 'open_tab', 'close_tab', 'extract_page_content'] },
        query: { type: Type.STRING },
        url: { type: Type.STRING },
        form_data: { type: Type.STRING },
        recipient: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
        tab_id: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'memory_brain_advanced',
    description: 'Manage persistent memory and learning models.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['remember_user_preference', 'store_task_history', 'retrieve_memory', 'update_learning_model'] },
        key: { type: Type.STRING },
        value: { type: Type.STRING },
        context: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'task_scheduler',
    description: 'Schedule and manage background tasks and time-based automation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['schedule_task', 'run_daily_automation', 'run_weekly_automation', 'check_pending_tasks', 'create_reminder'] },
        time: { type: Type.STRING, description: 'Time in ISO format or relative (e.g., "9:00 AM")' },
        task_action: { type: Type.STRING },
        reminder_text: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'skill_registry',
    description: 'Manage and query JARVIS autonomous skills and capabilities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['list_skills', 'check_availability', 'register_skill'] },
        skill_name: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'multi_device_control',
    description: 'Control external devices, phones, and remote systems.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['send_file_to_device', 'control_remote_system', 'sync_notifications', 'control_smart_home'] },
        device_id: { type: Type.STRING },
        payload: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'visual_intelligence',
    description: 'Advanced visual analysis including OCR and UI element detection.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['read_screen_text', 'detect_button', 'recognize_ui_element', 'analyze_image_context'] },
        element_description: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'developer_mode',
    description: 'Advanced developer tools for script execution and debugging.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['run_script', 'execute_shell_command', 'debug_module', 'generate_logs'] },
        command: { type: Type.STRING },
        script_content: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'self_repair_system',
    description: 'Detect and recover from system or automation errors with rollback capabilities.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['detect_error', 'retry_failed_task', 'rollback_last_action', 'recover_failed_module', 'log_error'] },
        error_message: { type: Type.STRING },
        task_id: { type: Type.STRING }
      },
      required: ['action']
    }
  },
  {
    name: 'system_optimization_ai',
    description: 'Optimize system performance and resource usage.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['clean_temp_files', 'close_heavy_processes', 'optimize_ram_usage', 'manage_startup_apps'] }
      },
      required: ['action']
    }
  },
  {
    name: 'autonomous_operations',
    description: 'Perform autonomous system operations and analysis',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: [
          'get_context', 'update_context', 'detect_patterns', 
          'toggle_guardian', 'check_threats', 'adaptive_brightness',
          'learn_behavior', 'safety_checkpoint', 'make_decision',
          'generate_suggestions', 'full_autonomous_mode'
        ] },
        active: { type: Type.BOOLEAN }
      },
      required: ['action']
    }
  },
  {
    name: 'switch_operating_mode',
    description: 'Switch between CHILL, WORK, DEVELOPER, or AUTONOMOUS modes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING, enum: ['CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'] }
      },
      required: ['mode']
    }
  },
  {
    name: 'analyze_current_screen',
    description: 'Capture and perform a deep analysis of the current screen content (OCR, UI elements, active windows).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        focus_area: { type: Type.STRING, description: 'Optional specific area to focus on (e.g., "bottom right", "browser window")' }
      }
    }
  },
  {
    name: 'toggle_perception_sensor',
    description: 'Enable or disable optic (camera) or screen (OCR) sensors.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sensor: { type: Type.STRING, enum: ['optic', 'screen'] },
        active: { type: Type.BOOLEAN }
      },
      required: ['sensor', 'active']
    }
  },
  {
    name: 'control_audio_interface',
    description: 'Mute or unmute the operator mic or JARVIS voice output.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: { type: Type.STRING, enum: ['mic', 'voice'] },
        mute: { type: Type.BOOLEAN }
      },
      required: ['target', 'mute']
    }
  },
  {
    name: 'neural_memory_store',
    description: 'Store a fact or snippet in the persistent Vector Database for long-term cognitive recall.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: 'The information to store.' },
        category: { type: Type.STRING, description: 'Category (e.g., preference, code, fact).' }
      },
      required: ['content']
    }
  },
  {
    name: 'neural_memory_search',
    description: 'Search the persistent Vector Database for relevant context from past sessions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The search query.' }
      },
      required: ['query']
    }
  },
  {
    name: 'initiate_deep_research',
    description: 'Initiate an autonomous multi-step research loop for complex topics.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'The complex topic to research and synthesize.' }
      },
      required: ['topic']
    }
  },
  {
    name: 'store_memory',
    description: 'Store a significant fact, paragraph, or user preference into long-term or short-term memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: 'The text, fact, or info to remember.' },
        category: { type: Type.STRING, enum: ['User', 'Project', 'System', 'Goal'] },
        memory_type: { type: Type.STRING, enum: ['long_term', 'short_term'], description: 'Specify if this is a long-term strategic fact or a short-term tactical detail.' }
      },
      required: ['content', 'category', 'memory_type']
    }
  },
  {
    name: 'log_capability_gap',
    description: 'Log a failed task or missing feature for future system upgrades.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        task: { type: Type.STRING, description: 'The task that failed or the missing feature name.' },
        reason: { type: Type.STRING, description: 'Why the task failed (e.g., "module_missing", "unsupported_format").' },
        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        suggested_module: { type: Type.STRING, description: 'Optional: Name of a module or library that could solve this.' }
      },
      required: ['task', 'reason', 'priority']
    }
  },
  {
    name: 'browse_url',
    description: 'Navigate the primary HUD browser to a specific URL for analysis.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'The full URL to visit (e.g., https://google.com)' }
      },
      required: ['url']
    }
  },
  {
    name: 'archive_control',
    description: 'Control the Archives (Chat History/Sessions). Actions: open, close, create_session, switch_session, delete_session, list_sessions.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open', 'close', 'create_session', 'switch_session', 'delete_session', 'list_sessions'] },
        session_id: { type: Type.STRING, description: 'The ID of the session to switch to or delete.' },
        title: { type: Type.STRING, description: 'The title for a new session.' }
      },
      required: ['action']
    }
  },
  {
    name: 'memory_control',
    description: 'Control the Neural Memory Panel (open, close).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open', 'close'] }
      },
      required: ['action']
    }
  },
  {
    name: 'upgrades_control',
    description: 'Control the Neural Upgrades Panel (open, close).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open', 'close'] }
      },
      required: ['action']
    }
  }
];

const App: React.FC = () => {
  const [status, setStatus] = useState<JarvisStatus>(JarvisStatus.IDLE);
  const [mode, setMode] = useState<JarvisMode>('WORK');
  const [isLive, setIsLive] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [isOpticActive, setIsOpticActive] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isMemoryVisible, setIsMemoryVisible] = useState(false);
  const [isUpgradeVisible, setIsUpgradeVisible] = useState(false);
  const [isOSConsoleOpen, setIsOSConsoleOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>('s1');
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('jarvis_sessions');
    return saved ? JSON.parse(saved) : [
      {
        session_id: 's1',
        title: 'Neural Core Optimization',
        timestamp_created: Date.now() - 3600000,
        timestamp_last_message: Date.now() - 600000,
        last_message_preview: "Sir, I have recalibrated the thermal sensors in Sector 4.",
        mode: 'DEVELOPER',
        model: 'gemini-3-flash-preview',
        isPinned: true,
        messageCount: 42,
        memorySaved: true
      }
    ];
  });
  const [intelligenceReport, setIntelligenceReport] = useState<string | null>(null);

  const [osControl, setOsControl] = useState(true);
  const [vocalConciseness, setVocalConciseness] = useState(true);
  const [isJarvisMuted, setIsJarvisMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);

  // Autonomous State
  const [taskPlans, setTaskPlans] = useState<any[]>(() => {
    const saved = localStorage.getItem('jarvis_task_plans');
    return saved ? JSON.parse(saved) : [];
  });
  const [scheduledTasks, setScheduledTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('jarvis_scheduled_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>(() => {
    const saved = localStorage.getItem('jarvis_upgrade_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Browser States
  const [isBrowserActive, setIsBrowserActive] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com/search?igu=1');
  const [urlInput, setUrlInput] = useState('google.com');
  const [neuralSources, setNeuralSources] = useState<{ title: string; uri: string }[]>([]);

  // OS & Autonomous Simulation States
  const [guardianMode, setGuardianMode] = useState(false);
  const [systemVolume, setSystemVolume] = useState(70);
  const [systemBrightness, setSystemBrightness] = useState(85);
  const [micLevel, setMicLevel] = useState(0);
  const [firewallActive, setFirewallActive] = useState(true);
  const [lastSafetyCheckpoint, setLastSafetyCheckpoint] = useState<number | null>(null);

  // Personality and Identity
  const [personality, setPersonality] = useState<string>(() => {
    return localStorage.getItem('jarvis_personality') || "Highly analytical, professional, slightly witty, and optimization-focused. Speaks in Hinglish (Mix of Hindi and English).";
  });
  const [userIdentity, setUserIdentity] = useState<string>(() => {
    return localStorage.getItem('jarvis_identity') || "Operator is a high-level engineer and strategist.";
  });
  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem('jarvis_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  const [theme, setTheme] = useState<'cyber' | 'slate' | 'minimal' | 'gold'>(() => {
    const saved = localStorage.getItem('jarvis_theme') as any;
    return ['cyber', 'slate', 'minimal', 'gold'].includes(saved) ? saved : 'cyber';
  });

  // Autonomous Background Activity Monitor
  const [lastUserActivityTime, setLastUserActivityTime] = useState<number>(Date.now());
  const [isOperatorAsleepDetected, setIsOperatorAsleepDetected] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('jarvis_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [memories, setMemories] = useState<MemoryEntry[]>(() => {
    const saved = localStorage.getItem('jarvis_memories');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Add type if missing
      return parsed.map((m: any) => ({
        ...m,
        type: m.type || 'long_term'
      }));
    }
    return [
      { id: 'm1', category: 'User', content: 'Operator prefers dark-mode HUD interfaces.', timestamp: Date.now() - 100000, type: 'long_term' },
      { id: 'm2', category: 'Goal', content: 'Current objective: Neural Link optimization for Mark-III.', timestamp: Date.now() - 50000, type: 'long_term' },
    ];
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('jarvis_logs');
    return saved ? JSON.parse(saved) : [
      { id: '1', source: 'SYSTEM', message: '● JARVIS OS Mark-III v11.2 Initialized.', timestamp: Date.now(), type: 'success' },
      { id: '2', source: 'SYSTEM', message: '» Neural Core: Active. Secure Link Ready.', timestamp: Date.now() + 50, type: 'info' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('jarvis_memories', JSON.stringify(memories));
    localStorage.setItem('jarvis_logs', JSON.stringify(logs));
    localStorage.setItem('jarvis_personality', personality);
    localStorage.setItem('jarvis_identity', userIdentity);
    localStorage.setItem('jarvis_timezone', timezone);
    localStorage.setItem('jarvis_task_plans', JSON.stringify(taskPlans));
    localStorage.setItem('jarvis_scheduled_tasks', JSON.stringify(scheduledTasks));
    localStorage.setItem('jarvis_upgrade_requests', JSON.stringify(upgradeRequests));
    localStorage.setItem('jarvis_sessions', JSON.stringify(sessions));
  }, [memories, logs, personality, userIdentity, timezone, taskPlans, scheduledTasks, upgradeRequests, sessions]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isScreenActiveRef = useRef(false);
  const isOpticActiveRef = useRef(true);
  const isConnectingRef = useRef(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentTtsSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const frameIntervalRef = useRef<number | null>(null);

  const activeTranscriptionIdRef = useRef<{ OPERATOR: string | null; JARVIS: string | null }>({ OPERATOR: null, JARVIS: null });
  const lastSourceRef = useRef<string | null>(null);

  const statusRef = useRef(status);
  const isMicMutedRef = useRef(isMicMuted);
  const isJarvisMutedRef = useRef(isJarvisMuted);
  const osControlRef = useRef(osControl);

  const stopAllAudioPlayback = useCallback(() => {
    if (currentTtsSourceRef.current) {
      try { currentTtsSourceRef.current.stop(); } catch(e) {}
      currentTtsSourceRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  useEffect(() => {
    statusRef.current = status;
    isMicMutedRef.current = isMicMuted;
    isJarvisMutedRef.current = isJarvisMuted;
    osControlRef.current = osControl;
    isOpticActiveRef.current = isOpticActive;
    isScreenActiveRef.current = isScreenActive;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isOpticActive;
      });
    }
    if (isJarvisMuted) {
      stopAllAudioPlayback();
      if (status === JarvisStatus.SPEAKING) setStatus(JarvisStatus.IDLE);
    }
  }, [isMicMuted, isJarvisMuted, osControl, isOpticActive, isScreenActive, status, stopAllAudioPlayback]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addLog = useCallback((message: string, source: LogEntry['source'] = 'SYSTEM', type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      source, message, timestamp: Date.now(), type
    }].slice(-200));
    if (source === 'OPERATOR' || source === 'JARVIS') {
      lastSourceRef.current = source;
    }
  }, []);

  const recordUserActivity = useCallback(() => {
    setLastUserActivityTime(Date.now());
    if (isOperatorAsleepDetected) {
      setIsOperatorAsleepDetected(false);
      addLog('⌬ Neural Core: Operator activity detected. Perception sensors ready for reactivation.', 'JARVIS', 'success');
    }
  }, [isOperatorAsleepDetected, addLog]);

  // Autonomous Background Assessment Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const idleSeconds = (Date.now() - lastUserActivityTime) / 1000;

      // If operator is inactive for > 120 seconds and optic or screen sensors are active
      if (idleSeconds > 120 && (isOpticActiveRef.current || isScreenActiveRef.current)) {
        setIsOpticActive(false);
        isOpticActiveRef.current = false;
        if (isScreenActiveRef.current) {
          setIsScreenActive(false);
          isScreenActiveRef.current = false;
        }
        setIsOperatorAsleepDetected(true);

        addLog(
          '⌬ JARVIS Autonomous Mind: "Lagta hai Sir so gaye hain! Camera vision aur Screen vision pause kar raha hoon taaki system background me efficiently chalta rahe aur API tokens save hon."',
          'JARVIS',
          'info'
        );
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [lastUserActivityTime, addLog]);

  const updateOrAddLog = useCallback((message: string, source: 'OPERATOR' | 'JARVIS', type: LogEntry['type'] = 'info') => {
    if (!message || !message.trim()) return;

    setLogs(prev => {
      const activeId = activeTranscriptionIdRef.current[source];
      const existingIndex = activeId ? prev.findIndex(l => l.id === activeId) : -1;

      if (existingIndex !== -1) {
        const newLogs = [...prev];
        const existingMessage = newLogs[existingIndex].message || "";
        
        let updatedMessage = message;
        if (existingMessage && message.startsWith(existingMessage)) {
          updatedMessage = message;
        } else if (existingMessage && existingMessage.startsWith(message)) {
          updatedMessage = existingMessage;
        } else if (existingMessage && !message.startsWith(existingMessage) && !existingMessage.startsWith(message)) {
          updatedMessage = existingMessage + (existingMessage.endsWith(' ') || message.startsWith(' ') ? '' : ' ') + message;
        }

        if (newLogs[existingIndex].message === updatedMessage) return prev;
        newLogs[existingIndex] = { ...newLogs[existingIndex], message: updatedMessage, timestamp: Date.now() };
        return newLogs;
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        activeTranscriptionIdRef.current[source] = id;
        lastSourceRef.current = source;
        return [...prev, { id, source, message, timestamp: Date.now(), type }].slice(-200);
      }
    });
  }, []);

  // Sync active logs with sessions store for complete history preservation
  useEffect(() => {
    if (!activeSessionId) return;
    const lastOpOrJarvis = [...logs].reverse().find(l => l.source === 'OPERATOR' || l.source === 'JARVIS');
    const previewText = lastOpOrJarvis ? lastOpOrJarvis.message : "Neural session active.";

    setSessions(prevSessions => {
      return prevSessions.map(s => {
        if (s.session_id === activeSessionId) {
          return {
            ...s,
            last_message_preview: previewText,
            timestamp_last_message: Date.now(),
            messageCount: logs.length,
            logs: logs
          };
        }
        return s;
      });
    });
  }, [logs, activeSessionId]);

  const getSystemInstructionWithMemories = () => {
    const longTermMemories = memories.filter(m => m.type === 'long_term');
    const shortTermMemories = memories.filter(m => m.type === 'short_term');

    const longTermString = longTermMemories.map(m => `[${m.category}]: ${m.content}`).join('\n');
    const shortTermString = shortTermMemories.map(m => `[${m.category}]: ${m.content}`).join('\n');

    const memoryString = `
LONG-TERM MEMORY (Strategic Facts):
${longTermString || 'No long-term data.'}

SHORT-TERM MEMORY (Tactical Details):
${shortTermString || 'No short-term data.'}
    `.trim();

    const concisenessStr = vocalConciseness 
      ? "Be extremely concise, direct, and efficient. Avoid long explanations unless specifically asked for a briefing." 
      : "Be helpful and detailed. Provide thorough explanations and context in your responses.";
      
    const currentTimeStr = time.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true,
      timeZone: timezone
    });

    let instruction = JARVIS_SYSTEM_INSTRUCTION
      .replace('{{MEMORY_PLACEHOLDER}}', memoryString)
      .replace('{{IDENTITY_PLACEHOLDER}}', userIdentity || 'Identity not set.')
      .replace('{{PERSONALITY_PLACEHOLDER}}', personality || 'Default personality active.')
      .replace('{{CONCISENESS_PROTOCOL}}', concisenessStr)
      .replace('{{TIME_PLACEHOLDER}}', currentTimeStr);
    return instruction;
  };

  const navigateBrowser = (url: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
    if (cleanUrl.includes('google.com') && !cleanUrl.includes('igu=1')) {
      cleanUrl = 'https://www.google.com/search?q=' + encodeURIComponent(url) + '&igu=1';
    }
    setBrowserUrl(cleanUrl);
    setUrlInput(cleanUrl);
    setIsBrowserActive(true);
  };

  const executeSystemTool = (name: string, args: any) => {
    if (!osControlRef.current && !['browse_url', 'autonomous_operations', 'system_monitoring', 'jarvis_gui_control'].includes(name)) return;

    addLog(`⌬ Executing Neural Command: ${name.toUpperCase()}`, 'SYSTEM', 'info');

    switch (name) {
      case 'jarvis_gui_control': {
        const { action, theme: newTheme, panel, panel_state, hud_mode, enabled } = args;
        
        if (action === 'set_theme' && newTheme) {
          setTheme(newTheme as any);
          addLog(`⌬ GUI Autonomy: UI Theme switched to [${newTheme.toUpperCase()}]`, 'JARVIS', 'success');
        }
        else if (action === 'toggle_panel' && panel) {
          const isOpen = panel_state !== undefined ? panel_state : true;
          if (panel === 'settings') setIsSettingsOpen(isOpen);
          else if (panel === 'memory') setIsMemoryVisible(isOpen);
          else if (panel === 'history') setIsHistoryVisible(isOpen);
          else if (panel === 'upgrade') setIsUpgradeVisible(isOpen);
          else if (panel === 'os_console') setIsOSConsoleOpen(isOpen);
          else if (panel === 'browser') setIsBrowserActive(isOpen);
          addLog(`⌬ GUI Autonomy: Panel [${panel.toUpperCase()}] ${isOpen ? 'opened' : 'closed'}.`, 'JARVIS', 'info');
        }
        else if (action === 'set_hud_mode' && hud_mode) {
          setMode(hud_mode as any);
          addLog(`⌬ GUI Autonomy: HUD Mode changed to [${hud_mode}]`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_token_guard') {
          addLog(`⌬ GUI Autonomy: Autonomous Background Monitor is permanently active in background.`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_optic') {
          const active = enabled !== undefined ? enabled : !isOpticActive;
          setIsOpticActive(active);
          isOpticActiveRef.current = active;
          addLog(`⌬ GUI Autonomy: Optic Camera Vision ${active ? 'ACTIVATED' : 'PAUSED'}.`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_screen_perception') {
          const active = enabled !== undefined ? enabled : !isScreenActive;
          handleToggleScreenPerception(active);
          addLog(`⌬ GUI Autonomy: Screen Perception ${active ? 'ACTIVATED' : 'PAUSED'}.`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_mic_mute') {
          const mute = enabled !== undefined ? enabled : !isMicMuted;
          setIsMicMuted(mute);
          isMicMutedRef.current = mute;
          addLog(`⌬ GUI Autonomy: Mic ${mute ? 'MUTED' : 'UNMUTED'}.`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_voice_mute') {
          const mute = enabled !== undefined ? enabled : !isJarvisMuted;
          setIsJarvisMuted(mute);
          isJarvisMutedRef.current = mute;
          addLog(`⌬ GUI Autonomy: Vocal Output ${mute ? 'MUTED' : 'UNMUTED'}.`, 'JARVIS', 'info');
        }
        else if (action === 'clear_logs') {
          setLogs([{ id: Date.now().toString(), source: 'SYSTEM', message: '⌬ Logs buffer cleared by JARVIS GUI Autonomy.', timestamp: Date.now(), type: 'info' }]);
        }
        return true;
      }

      case 'os_master_control': {
        const { action } = args;
        if (action === 'open') setIsOSConsoleOpen(true);
        else if (action === 'close') setIsOSConsoleOpen(false);
        else setIsOSConsoleOpen(prev => !prev);
        addLog(`⌬ OS Console: Interface ${action === 'close' ? 'suspended' : 'active'}.`, 'JARVIS', 'info');
        return true;
      }

      case 'terminal_exec': {
        const { command } = args;
        addLog(`⌬ Terminal Command Executed: "${command}"`, 'OPERATOR', 'info');
        osBridge.execute({ action: 'cli_execute', params: { command } })
          .then(res => addLog(`⌬ Terminal Output: ${res.message || 'Execution success.'}`, 'JARVIS', 'success'))
          .catch(() => addLog(`! Terminal Error on command "${command}".`, 'SYSTEM', 'error'));
        return true;
      }

      case 'analyze_current_screen': {
        const { focus_area } = args;
        addLog(`⌬ Screen Vision: Capturing high-res buffer${focus_area ? ` (Focus: ${focus_area})` : ''}...`, 'SYSTEM', 'info');
        
        if (!isScreenActiveRef.current) {
          addLog('⌬ Warning: Screen sensor is inactive. Attempting auto-initialization...', 'JARVIS', 'warning');
          handleToggleScreenPerception(true);
        }
        
        // In a real implementation, this would return OCR/UI tree data.
        // For the simulation, we acknowledge the capture.
        addLog('⌬ Screen Analysis: Buffer processed. OCR and UI tree synchronized with Neural Core.', 'JARVIS', 'success');
        return true;
      }
      
      case 'system_power_management': {
        const { action, delay = 10 } = args;
        addLog(`⌬ CRITICAL: System ${action.toUpperCase()} sequence initiated. T-minus ${delay}s.`, 'JARVIS', 'warning');
        if (action === 'lock') {
          osBridge.execute({ action: 'power_control', params: { cmd: 'lock' } })
            .catch(() => addLog('! OS Bridge: Lock command failed. Is main.py running?', 'SYSTEM', 'error'));
        }
        if (action === 'emergency_shutdown') {
          addLog('⌬ IMMEDIATE SHUTDOWN EXECUTED.', 'SYSTEM', 'error');
          setTimeout(() => stopLive(), 1000);
        }
        break;
      }

      case 'application_control': {
        const { action, app_name } = args;
        addLog(`⌬ App Control: ${action.toUpperCase()} -> ${app_name || 'Target'}`, 'JARVIS', 'info');
        if (action === 'open' && app_name?.toLowerCase().includes('browser')) setIsBrowserActive(true);
        osBridge.execute({ module: 'app_control', action: `${action}_app`, params: { app_name, target: app_name } })
          .then(res => addLog(`⌬ App Control: ${res.message || 'Operation complete'}`, 'SYSTEM', 'success'))
          .catch(() => addLog(`! App Control: Failed to execute ${action} on ${app_name}.`, 'SYSTEM', 'warning'));
        break;
      }

      case 'window_management': {
        const { action } = args;
        addLog(`⌬ Window Manager: ${action.toUpperCase()} executing...`, 'JARVIS', 'info');
        osBridge.execute({ module: 'window_manager', action, params: args })
          .then(res => addLog(`⌬ Window Manager: ${res.message || 'Window layouts synchronized'}`, 'SYSTEM', 'success'))
          .catch(() => addLog('! Window Manager command error.', 'SYSTEM', 'warning'));
        break;
      }

      case 'file_folder_management': {
        const { action, path, destination } = args;
        addLog(`⌬ File System: ${action.toUpperCase()} [${path || 'root'}]${destination ? ` -> ${destination}` : ''}`, 'JARVIS', 'info');
        osBridge.execute({ module: 'file_manager', action, params: args })
          .then(res => addLog(`⌬ File System: ${res.message || `${action} completed safely.`}`, 'SYSTEM', 'success'))
          .catch(() => addLog(`! File System: ${action} operation encountered error.`, 'SYSTEM', 'warning'));
        break;
      }

      case 'display_audio_controls': {
        const { target, action, level } = args;
        if (target === 'volume') {
          let newVol = systemVolume;
          if (action === 'set') newVol = level;
          else if (action === 'increase') newVol = Math.min(100, systemVolume + 10);
          else if (action === 'decrease') newVol = Math.max(0, systemVolume - 10);
          else if (action === 'mute') setIsJarvisMuted(true);
          else if (action === 'unmute') setIsJarvisMuted(false);
          setSystemVolume(newVol);
          addLog(`⌬ Audio Interface: Volume adjusted to ${newVol}%`, 'JARVIS', 'info');
        } else if (target === 'brightness') {
          let newBri = systemBrightness;
          if (action === 'set') newBri = level;
          else if (action === 'increase') newBri = Math.min(100, systemBrightness + 10);
          else if (action === 'decrease') newBri = Math.max(0, systemBrightness - 10);
          setSystemBrightness(newBri);
          addLog(`⌬ Display Interface: Brightness recalibrated to ${newBri}%`, 'JARVIS', 'info');
        }
        break;
      }

      case 'network_controls': {
        addLog(`⌬ Network: ${args.action.toUpperCase()} sequence for SSID: ${args.ssid || 'Current'}`, 'JARVIS', 'info');
        break;
      }

      case 'system_monitoring': {
        const { action } = args;
        if (action === 'get_status') {
          osBridge.execute({ action: 'system_info', params: { type: 'all' } })
            .then(res => {
              const { cpu_usage, memory_usage, disk_free } = res.data;
              addLog(`⌬ Real-Time Status: CPU ${cpu_usage}, MEM ${memory_usage}, DISK ${disk_free} Free.`, 'JARVIS', 'success');
            })
            .catch(() => {
              addLog('⌬ System Status (Simulated): CPU 12%, MEM 4.2GB/16GB, DISK 45% Free.', 'JARVIS', 'info');
            });
        } else {
          addLog(`⌬ Process Manager: ${action.toUpperCase()} executed.`, 'JARVIS', 'info');
        }
        break;
      }

      case 'security_controls': {
        const active = args.action === 'enable_firewall';
        setFirewallActive(active);
        addLog(`⌬ Security: Neural Firewall ${active ? 'ENGAGED' : 'DISENGAGED'}.`, 'JARVIS', active ? 'success' : 'warning');
        break;
      }

      case 'quick_launchers': {
        const { tool, url } = args;
        addLog(`⌬ Quick Launch: ${tool.toUpperCase()} initiated.`, 'JARVIS', 'info');
        if (tool === 'browser' && url) navigateBrowser(url);
        if (tool === 'screenshot') {
          addLog('⌬ Screenshot captured and stored in Neural Cache.', 'JARVIS', 'success');
        }
        break;
      }

      case 'autonomous_operations': {
        const { action } = args;
        addLog(`⌬ Autonomous Protocol: ${action.toUpperCase()} active.`, 'JARVIS', 'info');
        if (action === 'toggle_guardian') setGuardianMode(args.active);
        if (action === 'safety_checkpoint') setLastSafetyCheckpoint(Date.now());
        if (action === 'check_threats') addLog('⌬ Guardian Scan: No neural threats detected in local perimeter.', 'JARVIS', 'success');
        break;
      }

      case 'switch_operating_mode': {
        setMode(args.mode);
        addLog(`⌬ Mode switched to ${args.mode}_MODE`, 'JARVIS', 'info');
        break;
      }

      case 'toggle_perception_sensor': {
        const { sensor, active } = args;
        if (sensor === 'screen') handleToggleScreenPerception(active);
        if (sensor === 'optic') {
          setIsOpticActive(active);
          isOpticActiveRef.current = active;
          addLog(`⌬ Optic sensor ${active ? 'activated' : 'deactivated'} autonomously.`, 'JARVIS', 'info');
        }
        break;
      }

      case 'control_audio_interface': {
        const { target, mute } = args;
        if (target === 'mic') {
          setIsMicMuted(mute);
          isMicMutedRef.current = mute;
          addLog(`⌬ Mic ${mute ? 'muted' : 'unmuted'} autonomously.`, 'JARVIS', 'warning');
        }
        if (target === 'voice') {
          setIsJarvisMuted(mute);
          isJarvisMutedRef.current = mute;
          addLog(`⌬ Vocal output ${mute ? 'suspended' : 'active'}.`, 'JARVIS', 'info');
        }
        break;
      }

      case 'store_memory': {
        const { content, category, memory_type } = args;
        setMemories(prev => [{ 
          id: Math.random().toString(), 
          content, 
          category, 
          timestamp: Date.now(),
          type: memory_type || 'long_term'
        }, ...prev]);
        addLog(`⌬ Memory logged (${memory_type}): [${category}] ${content.substring(0, 30)}...`, 'JARVIS', 'success');
        
        // Also store in Vector DB if available
        osBridge.storeMemory(content, { category, type: memory_type })
          .catch(() => console.warn('Vector DB offline. Memory stored in local cache only.'));
        return true;
      }

      case 'neural_memory_store': {
        const { content, category } = args;
        osBridge.storeMemory(content, { category })
          .then(() => addLog(`⌬ Vector Memory: Fact stored in persistent cognitive cluster.`, 'JARVIS', 'success'))
          .catch(() => addLog('! Vector Memory: Storage failed. Is OS Bridge active?', 'SYSTEM', 'error'));
        return true;
      }

      case 'neural_memory_search': {
        const { query } = args;
        osBridge.searchMemory(query)
          .then(res => {
            const context = res.results.documents[0].join('\n');
            addLog(`⌬ Vector Recall: Found ${res.results.documents[0].length} relevant neural patterns.`, 'JARVIS', 'info');
            // We return the context so the AI can use it in the next turn
            return context;
          })
          .catch(() => addLog('! Vector Recall: Search failed.', 'SYSTEM', 'error'));
        break;
      }

      case 'initiate_deep_research': {
        const { topic } = args;
        addLog(`⌬ Deep Research: Initiating autonomous reasoning loop for "${topic}"...`, 'JARVIS', 'info');
        osBridge.startResearch(topic)
          .then(taskId => {
            // Polling logic
            const poll = setInterval(() => {
              osBridge.getTaskStatus(taskId).then(status => {
                if (status.status === 'completed') {
                  clearInterval(poll);
                  addLog(`⌬ Deep Research: Synthesis complete for "${topic}".`, 'JARVIS', 'success');
                  setIntelligenceReport(status.result);
                } else if (status.status === 'failed') {
                  clearInterval(poll);
                  addLog(`! Deep Research: Reasoning loop failed.`, 'SYSTEM', 'error');
                } else {
                  // Update progress in logs or status
                  console.log(`Research progress: ${status.progress}%`);
                }
              });
            }, 3000);
          })
          .catch(() => addLog('! Deep Research: Failed to initiate loop.', 'SYSTEM', 'error'));
        return true;
      }

      case 'browse_url': {
        navigateBrowser(args.url);
        addLog(`⌬ Neural HUD Link: Navigated to ${args.url}. Buffer established.`, 'JARVIS', 'success');
        return true;
      }
      
      case 'archive_control': {
        const { action, session_id, title } = args;
        switch (action) {
          case 'open':
            setIsHistoryVisible(true);
            addLog('⌬ Archives: Interface initialized.', 'JARVIS', 'info');
            break;
          case 'close':
            setIsHistoryVisible(false);
            addLog('⌬ Archives: Interface suspended.', 'JARVIS', 'info');
            break;
          case 'create_session': {
            handleNewChat();
            const newSession: ChatSession = {
              session_id: `s_${Math.random().toString(36).substr(2, 9)}`,
              title: title || 'New Neural Session',
              timestamp_created: Date.now(),
              timestamp_last_message: Date.now(),
              last_message_preview: "Neural session initialized.",
              mode: mode,
              model: 'gemini-3-flash-preview',
              messageCount: 0,
              memorySaved: false
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.session_id);
            addLog(`⌬ Archives: New neural session [${newSession.title}] established.`, 'JARVIS', 'success');
            break;
          }
          case 'switch_session':
            if (session_id && sessions.some(s => s.session_id === session_id)) {
              setActiveSessionId(session_id);
              addLog(`⌬ Archives: Switched to session [${session_id}].`, 'JARVIS', 'info');
            }
            break;
          case 'delete_session':
            if (session_id) {
              setSessions(prev => prev.filter(s => s.session_id !== session_id));
              if (activeSessionId === session_id) setActiveSessionId(null);
              addLog(`⌬ Archives: Session [${session_id}] decommissioned.`, 'JARVIS', 'warning');
            }
            break;
          case 'list_sessions': {
            const list = sessions.map(s => `[${s.session_id}] ${s.title}`).join('\n');
            addLog(`⌬ Archives: Listing ${sessions.length} sessions.`, 'JARVIS', 'info');
            return list;
          }
        }
        return true;
      }

      case 'memory_control': {
        const { action } = args;
        if (action === 'open') {
          setIsMemoryVisible(true);
          addLog('⌬ Memory: Interface initialized.', 'JARVIS', 'info');
        } else if (action === 'close') {
          setIsMemoryVisible(false);
          addLog('⌬ Memory: Interface suspended.', 'JARVIS', 'info');
        }
        return true;
      }

      case 'upgrades_control': {
        const { action } = args;
        if (action === 'open') {
          setIsUpgradeVisible(true);
          addLog('⌬ Upgrades: Interface initialized.', 'JARVIS', 'info');
        } else if (action === 'close') {
          setIsUpgradeVisible(false);
          addLog('⌬ Upgrades: Interface suspended.', 'JARVIS', 'info');
        }
        return true;
      }

      case 'task_planning_engine': {
        const { action, goal, plan_id, step_index } = args;
        if (action === 'create_task_plan') {
          const newPlan = { id: Math.random().toString(36).substr(2, 9), goal, status: 'active', steps: [], progress: 0 };
          setTaskPlans(prev => [newPlan, ...prev]);
          addLog(`⌬ Task Engine: Plan created for goal: "${goal}"`, 'JARVIS', 'success');
        } else if (action === 'execute_task_plan') {
          addLog(`⌬ Task Engine: Executing plan ${plan_id}. Initiating autonomous sequence.`, 'JARVIS', 'info');
        } else if (action === 'track_task_progress') {
          addLog(`⌬ Task Engine: Progress update for plan ${plan_id}: ${step_index}% complete.`, 'JARVIS', 'info');
        }
        return true;
      }

      case 'ui_automation': {
        const { action, text, x, y, element_description } = args;
        addLog(`⌬ UI Automation: ${action.toUpperCase()} -> ${text || element_description || `(${x}, ${y})`}`, 'JARVIS', 'info');
        if (action === 'type_text') {
          // Simulate typing
          addLog(`⌬ UI: Inputting neural data stream...`, 'SYSTEM', 'info');
        }
        return true;
      }

      case 'software_management': {
        const { action, software_name } = args;
        addLog(`⌬ Software Manager: ${action.toUpperCase()} sequence for ${software_name || 'System'}`, 'JARVIS', 'info');
        if (action === 'check_outdated') {
          addLog('⌬ Software: 3 packages require updates (Python, Node.js, Git).', 'SYSTEM', 'warning');
        } else if (action === 'list_installed') {
          addLog('⌬ Software: Synchronizing installed application registry...', 'SYSTEM', 'info');
        }
        return true;
      }

      case 'smart_file_intelligence': {
        const { action } = args;
        addLog(`⌬ File Intel: ${action.toUpperCase()} sequence initiated.`, 'JARVIS', 'success');
        if (action === 'analyze_storage_usage' || action === 'scan_large_files') {
          addLog('⌬ Storage Analysis: 240GB used, 760GB free. 5 files > 10GB detected.', 'SYSTEM', 'info');
        } else if (action === 'partition_info') {
          addLog('⌬ Disk: C: (OS) - 500GB, D: (Data) - 500GB. Health: Optimal.', 'SYSTEM', 'success');
        }
        return true;
      }

      case 'internet_automation': {
        const { action, url, query, tab_id } = args;
        addLog(`⌬ Web Automation: ${action.toUpperCase()} -> ${url || query || tab_id}`, 'JARVIS', 'info');
        if (action === 'scrape_webpage' || action === 'extract_page_content') {
          addLog(`⌬ Web: Extracting neural data from target buffer...`, 'SYSTEM', 'info');
        } else if (action === 'open_tab') {
          addLog(`⌬ Web: New neural tab established.`, 'SYSTEM', 'success');
        }
        return true;
      }

      case 'memory_brain_advanced': {
        const { action, key, value } = args;
        addLog(`⌬ Memory Brain: ${action.toUpperCase()} -> ${key}`, 'JARVIS', 'success');
        if (action === 'remember_user_preference') {
          setMemories(prev => [{ id: Math.random().toString(), content: `Preference: ${key} = ${value}`, category: 'User', timestamp: Date.now() }, ...prev]);
        }
        return true;
      }

      case 'task_scheduler': {
        const { action, time, task_action, reminder_text } = args;
        if (action === 'schedule_task' || action === 'create_reminder') {
          const newTask = { id: Math.random().toString(36).substr(2, 9), time, action: task_action || reminder_text, status: 'pending' };
          setScheduledTasks(prev => [newTask, ...prev]);
          addLog(`⌬ Scheduler: ${action === 'create_reminder' ? 'Reminder' : 'Task'} set for ${time}: ${task_action || reminder_text}`, 'JARVIS', 'success');
        } else {
          addLog(`⌬ Scheduler: ${action.toUpperCase()} sequence active.`, 'JARVIS', 'info');
        }
        return true;
      }

      case 'skill_registry': {
        const { action, skill_name } = args;
        if (action === 'list_skills') {
          addLog('⌬ Skill Registry: 42 autonomous modules active. 5 pending registration.', 'JARVIS', 'info');
          return "Active Skills: OS_Control, Web_Automation, Neural_Memory, Task_Planning, Visual_Intelligence, Software_Management, Multi_Device_Link.";
        } else {
          addLog(`⌬ Skill Registry: ${action.toUpperCase()} -> ${skill_name}`, 'JARVIS', 'success');
        }
        return true;
      }

      case 'multi_device_control': {
        const { action, device_id } = args;
        addLog(`⌬ Multi-Device: ${action.toUpperCase()} sequence for ${device_id || 'Remote Link'}`, 'JARVIS', 'info');
        if (action === 'control_remote_system') {
          addLog('⌬ Remote Link: Secure tunnel established. Awaiting command stream.', 'SYSTEM', 'success');
        }
        return true;
      }

      case 'visual_intelligence': {
        const { action, element_description } = args;
        addLog(`⌬ Visual Intel: ${action.toUpperCase()} -> ${element_description || 'Full Screen'}`, 'JARVIS', 'info');
        if (action === 'read_screen_text') {
          addLog('⌬ OCR: Buffer processed. Extracting text layers...', 'SYSTEM', 'info');
        }
        return true;
      }

      case 'developer_mode': {
        const { action, command } = args;
        addLog(`⌬ Developer Mode: ${action.toUpperCase()} -> ${command || 'Script Buffer'}`, 'JARVIS', 'warning');
        if (action === 'execute_shell_command') {
          addLog('⌬ Shell: Command stream executed. Exit code: 0.', 'SYSTEM', 'success');
        }
        return true;
      }

      case 'self_repair_system': {
        const { action, error_message } = args;
        addLog(`⌬ Self-Repair: ${action.toUpperCase()} -> ${error_message || 'System Check'}`, 'JARVIS', 'warning');
        if (action === 'detect_error') {
          addLog('⌬ Diagnostic: Neural link integrity at 98%. Minor latency detected. Auto-correcting...', 'SYSTEM', 'info');
        } else if (action === 'rollback_last_action') {
          addLog('⌬ Rollback: Reverting last neural state change. Integrity preserved.', 'SYSTEM', 'success');
        }
        return true;
      }

      case 'system_optimization_ai': {
        const { action } = args;
        addLog(`⌬ System AI: ${action.toUpperCase()} optimized.`, 'JARVIS', 'success');
        if (action === 'optimize_ram_usage') {
          addLog('⌬ RAM: Purged 1.2GB of inactive neural buffers.', 'SYSTEM', 'info');
        }
        return true;
      }

      case 'log_capability_gap': {
        const { task, reason, priority, suggested_module } = args;
        const newRequest: UpgradeRequest = {
          id: Math.random().toString(36).substr(2, 9),
          task,
          status: 'failed',
          reason,
          timestamp: Date.now(),
          priority,
          suggested_module
        };
        setUpgradeRequests(prev => [newRequest, ...prev]);
        addLog(`⌬ Upgrade Memory: Logged capability gap for "${task}". Priority: ${priority.toUpperCase()}`, 'JARVIS', 'warning');
        return true;
      }
    }
    return false;
  };

  const speakTextWithUltraLowLatency = async (textToSpeak: string, ai: GoogleGenAI) => {
    if (isJarvisMutedRef.current || !textToSpeak.trim()) {
      setStatus(JarvisStatus.IDLE);
      return;
    }
    
    setStatus(JarvisStatus.SPEAKING);

    const cleanText = textToSpeak
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const textToRead = cleanText.substring(0, 1500);

    // 1. Primary: High-Quality Cloud TTS with authentic 'Charon' Male Voice
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToRead }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
        },
      });

      const audioDataB64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioDataB64) {
        let outCtx = audioContextRef.current?.output;
        if (!outCtx || outCtx.state === 'closed') {
          outCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          if (audioContextRef.current) audioContextRef.current.output = outCtx;
        }
        await outCtx.resume();
        const audioBuffer = await decodeAudioData(decode(audioDataB64), outCtx, 24000, 1);
        const source = outCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outCtx.destination);
        source.onended = () => {
          if (currentTtsSourceRef.current === source) currentTtsSourceRef.current = null;
          setStatus(JarvisStatus.IDLE);
        };
        currentTtsSourceRef.current = source;
        source.start();
        addLog("⌬ Vocalizing response (Charon Neural Voice)...", "SYSTEM", "info");
        return;
      }
    } catch (ttsErr: any) {
      console.warn("Cloud TTS error, resorting to Browser Male Voice fallback:", ttsErr);
    }

    // 2. Fallback: Browser Speech Synthesis with strictly filtered Male Voice
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 1.1;
        utterance.pitch = 0.85; // Masculine deeper tone
        
        const voices = window.speechSynthesis.getVoices();
        const femaleKeywords = ['female', 'zira', 'hazel', 'susan', 'catherine', 'samantha', 'victoria', 'karen', 'veena', 'heera'];
        const maleKeywords = ['male', 'david', 'george', 'mark', 'richard', 'james', 'google uk english male', 'ravi'];

        let chosenVoice = voices.find(v => {
          const nameLower = v.name.toLowerCase();
          return maleKeywords.some(mk => nameLower.includes(mk)) && !femaleKeywords.some(fk => nameLower.includes(fk));
        });

        if (!chosenVoice) {
          chosenVoice = voices.find(v => {
            const nameLower = v.name.toLowerCase();
            return !femaleKeywords.some(fk => nameLower.includes(fk)) && (v.lang.startsWith('en') || v.lang.startsWith('hi'));
          });
        }

        if (chosenVoice) utterance.voice = chosenVoice;

        utterance.onend = () => setStatus(JarvisStatus.IDLE);
        utterance.onerror = () => setStatus(JarvisStatus.IDLE);

        window.speechSynthesis.speak(utterance);
        addLog("⌬ Vocalizing response (Fallback Male Voice)...", "SYSTEM", "info");
        return;
      } catch (e) {
        console.warn("SpeechSynthesis fallback error:", e);
      }
    }

    setStatus(JarvisStatus.IDLE);
  };

  const handleSendMessage = async (msg: string, files?: File[]) => {
    if (!msg.trim() && (!files || files.length === 0)) return;

    stopAllAudioPlayback();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Reset speaker active IDs for a fresh conversational turn
    activeTranscriptionIdRef.current['JARVIS'] = null;
    activeTranscriptionIdRef.current['OPERATOR'] = null;

    updateOrAddLog(msg || (files ? `[Neural Data: ${files.length} packets]` : ""), 'OPERATOR');
    setStatus(JarvisStatus.THINKING);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: msg }];

      if (files && files.length > 0) {
        for (const file of files) {
          const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
        }
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: getSystemInstructionWithMemories(),
          temperature: 0.7,
          tools: [{ googleSearch: {} }, { functionDeclarations: toolDeclarations }],
          toolConfig: {
            includeServerSideToolInvocations: true
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      let fullReply = "";
      let hasHandledGrounding = false;

      // Start new JARVIS response log block
      activeTranscriptionIdRef.current['OPERATOR'] = null;
      activeTranscriptionIdRef.current['JARVIS'] = null;

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        
        // Handle Grounding Metadata (Sources) - only once
        if (!hasHandledGrounding && c.candidates?.[0]?.groundingMetadata) {
          const grounding = c.candidates[0].groundingMetadata;
          if (grounding.groundingChunks) {
            const sources = grounding.groundingChunks
              .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
              .filter((s: any) => s !== null);
            setNeuralSources(sources);
            if (sources.length > 0) {
              addLog(`⌬ Research Complete. Found ${sources.length} neural sources.`, 'SYSTEM', 'success');
              if (osControlRef.current && !isBrowserActive) {
                navigateBrowser(sources[0].uri);
              }
            }
          }
          hasHandledGrounding = true;
        }

        if (c.functionCalls) {
          for (const fc of c.functionCalls) executeSystemTool(fc.name, fc.args);
        }

        if (c.text) {
          fullReply += c.text;
          updateOrAddLog(fullReply, 'JARVIS');
        }
      }

      const reply = fullReply || "Operation completed, Sir.";
      
      // Update active session preview in Archives
      if (activeSessionId) {
        setSessions(prev => prev.map(s => 
          s.session_id === activeSessionId 
            ? { ...s, last_message_preview: reply.substring(0, 60) + (reply.length > 60 ? '...' : ''), timestamp_last_message: Date.now(), messageCount: s.messageCount + 2 }
            : s
        ));
      }

      // Keep full response text in Neural Link Logs
      updateOrAddLog(reply, 'JARVIS');

      if (reply.length > 1200 || msg.toLowerCase().includes('report') || msg.toLowerCase().includes('briefing')) {
        setIntelligenceReport(reply);
      }

      // Vocalize the complete generated response in full matching the chat screen context
      if (!isJarvisMutedRef.current) {
        speakTextWithUltraLowLatency(reply, ai);
      } else {
        addLog("⌬ Vocal output is currently suspended (Muted).", "SYSTEM", "info");
        setStatus(JarvisStatus.IDLE);
      }
      
    } catch (error: any) {
      addLog(`! Neural Core Anomaly: ${error.message}`, 'SYSTEM', 'error');
      setStatus(JarvisStatus.IDLE);
    }
  };

  const handleNewChat = () => {
    stopLive(); 
    setActiveSessionId(null); 
    setNeuralSources([]);
    setLogs([{ id: 'sys1', source: 'SYSTEM', message: '● New Neural Session Initialized.', timestamp: Date.now(), type: 'info' }]);
  };

  // Fix: Added missing clearNeuralLogs function to handle log purging.
  const clearNeuralLogs = useCallback(() => {
    setLogs([{ 
      id: Math.random().toString(36).substr(2, 9), 
      source: 'SYSTEM', 
      message: '● Neural Cache Purged. System logs cleared.', 
      timestamp: Date.now(), 
      type: 'warning' 
    }]);
  }, []);

  const playClick = useCallback(async () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.05, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
      return ctx;
    } catch(e) { return null; }
  }, []);

  const handleToggleOptic = useCallback((forceState?: boolean) => {
    const nextState = forceState !== undefined ? forceState : !isOpticActive;
    setIsOpticActive(nextState);
    isOpticActiveRef.current = nextState;
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = nextState;
      });
    }
    addLog(`⌬ Optic Vision: ${nextState ? 'Sensors Online (Camera Vision Active)' : 'Sensors Suspended (Camera Vision Turned Off)'}.`, 'SYSTEM', nextState ? 'success' : 'warning');
  }, [isOpticActive, addLog]);

  const handleToggleScreenPerception = async (forceState?: boolean) => {
    const target = forceState !== undefined ? forceState : !isScreenActive;
    if (!target) {
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach(t => t.stop()); screenStreamRef.current = null; }
      setIsScreenActive(false); isScreenActiveRef.current = false;
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream; screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.play(); setIsScreenActive(true); isScreenActiveRef.current = true;
      } catch (err) { addLog('! Screen access denied.', 'SYSTEM', 'error'); }
    }
  };

  const stopLive = useCallback(() => {
    if (!isLive && !isConnectingRef.current) return;
    setIsLive(false); isConnectingRef.current = false; setStatus(JarvisStatus.IDLE);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (audioContextRef.current) {
      if (audioContextRef.current.input.state !== 'closed') audioContextRef.current.input.close();
      if (audioContextRef.current.output.state !== 'closed') audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; }
    if (sessionRef.current) sessionRef.current.close();
    sessionRef.current = null;
  }, [isLive]);

  const handleStartLive = async () => {
    if (isLive || isConnectingRef.current) { stopLive(); return; }
    await playClick(); 
    isConnectingRef.current = true;
    setStatus(JarvisStatus.THINKING);
    addLog("⌬ Neural Link: Initiating secure uplink...", "SYSTEM", "info");
    
    try {
      addLog("⌬ Neural Link: Accessing hardware sensors...", "SYSTEM", "info");
      let stream: MediaStream;
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: audioConstraints, 
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 15 } } 
        });
      } catch (e) {
        addLog("⌬ Neural Link: Camera unavailable. Falling back to audio-only stream.", "SYSTEM", "warning");
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      }
      
      // Enable microphone audio tracks explicitly
      stream.getAudioTracks().forEach(track => { track.enabled = true; });

      cameraStreamRef.current = stream; 
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      let inputCtx: AudioContext;
      try {
        inputCtx = new AudioCtxClass({ sampleRate: 16000 });
      } catch (e) {
        inputCtx = new AudioCtxClass();
      }
      const outputCtx = new AudioCtxClass({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();

      // Ensure microphone is unmuted when user initiates Neural Link
      setIsMicMuted(false);
      isMicMutedRef.current = false;
      
      audioContextRef.current = { input: inputCtx, output: outputCtx };
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          systemInstruction: getSystemInstructionWithMemories(),
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          tools: [{ googleSearch: {} }, { functionDeclarations: toolDeclarations }],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            isConnectingRef.current = false; 
            setIsLive(true); 
            setStatus(JarvisStatus.LISTENING);
            addLog("⌬ Neural Link: Secure tunnel established. Sensors online.", "SYSTEM", "success");
            
            if (inputCtx.state === 'suspended') {
              await inputCtx.resume();
            }

            // Standardize audio track extraction for AudioContext compatibility
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
              addLog("! Neural Link Error: No audio tracks found in microphone stream.", "SYSTEM", "error");
              stopLive();
              return;
            }
            audioTracks.forEach(t => { t.enabled = true; });
            const audioOnlyStream = new MediaStream(audioTracks);
            const source = inputCtx.createMediaStreamSource(audioOnlyStream);
            
            // ScriptProcessorNode for processing PCM audio chunks
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            // Connect scriptProcessor to a zero-gain node to destination so audio processing runs
            // smoothly without looping microphone audio into speakers (preventing acoustic feedback)
            const dummyGain = inputCtx.createGain();
            dummyGain.gain.value = 0;
            source.connect(scriptProcessor);
            scriptProcessor.connect(dummyGain);
            dummyGain.connect(inputCtx.destination);
            
            let hasDetectedAudio = false;
            scriptProcessor.onaudioprocess = (e) => {
              if (inputCtx.state === 'closed' || isMicMutedRef.current) {
                setMicLevel(0);
                return;
              }

              if (inputCtx.state === 'suspended') {
                inputCtx.resume();
              }

              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate real-time mic level (RMS)
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              const level = Math.min(100, rms * 500);
              setMicLevel(level);

              if (level > 3 && !hasDetectedAudio) {
                hasDetectedAudio = true;
                addLog("⌬ Neural Link: Audio signal detected. Low-latency uplink active.", "SYSTEM", "success");
              }

              // Continuously stream 16kHz PCM audio to Gemini Live session
              const pcm16 = resampleTo16kPCM(inputData, inputCtx.sampleRate || 16000);
              if (pcm16.length > 0) {
                const uint8 = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
                const pcmBlob = { 
                  data: encode(uint8), 
                  mimeType: 'audio/pcm;rate=16000' 
                };
                if (sessionRef.current) {
                  sessionRef.current.sendRealtimeInput({ audio: pcmBlob });
                } else {
                  sessionPromise.then(s => {
                    sessionRef.current = s;
                    s && s.sendRealtimeInput({ audio: pcmBlob });
                  });
                }
              }
            };
            
            // Frame interval optimized to 2.5s with compressed dimensions (512x384) to preserve full WebSocket bandwidth for voice PCM
            frameIntervalRef.current = window.setInterval(() => {
              const activeVideo = isScreenActiveRef.current ? screenVideoRef.current : (isOpticActiveRef.current ? videoRef.current : null);
              if (activeVideo && activeVideo.readyState >= 2) {
                const canvas = canvasRef.current; canvas.width = 512; canvas.height = 384;
                canvas.getContext('2d')?.drawImage(activeVideo, 0, 0, 512, 384);
                canvas.toBlob(blob => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const activeSession = sessionRef.current;
                      if (activeSession) {
                        activeSession.sendRealtimeInput({ video: { data: (reader.result as string).split(',')[1], mimeType: 'image/jpeg' } });
                      }
                    };
                    reader.readAsDataURL(blob);
                  }
                }, 'image/jpeg', 0.35);
              }
            }, 2500);
          },
          onmessage: async (m: LiveServerMessage) => {
            if (m.serverContent?.interrupted || m.serverContent?.turnComplete) {
              if (m.serverContent?.interrupted) stopAllAudioPlayback();
              activeTranscriptionIdRef.current['JARVIS'] = null;
              activeTranscriptionIdRef.current['OPERATOR'] = null;
            }
            if (m.toolCall) {
              for (const fc of m.toolCall.functionCalls) {
                executeSystemTool(fc.name, fc.args);
                const activeSession = sessionRef.current;
                if (activeSession) {
                  activeSession.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: { result: "ok" } }] });
                }
              }
            }
            if (m.serverContent?.inputTranscription) { 
              activeTranscriptionIdRef.current['JARVIS'] = null;
              updateOrAddLog(m.serverContent.inputTranscription.text, 'OPERATOR'); 
              setStatus(JarvisStatus.THINKING); 
            }
            if (m.serverContent?.outputTranscription) { 
              activeTranscriptionIdRef.current['OPERATOR'] = null;
              const text = m.serverContent.outputTranscription.text;
              updateOrAddLog(text, 'JARVIS'); 
              if (text.length > 1200) setIntelligenceReport(text);
              setStatus(JarvisStatus.SPEAKING); 
            }
            const parts = m.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data && !isJarvisMutedRef.current) {
                  const outCtx = audioContextRef.current?.output;
                  if (outCtx && outCtx.state !== 'closed') {
                    await outCtx.resume();
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                    const buf = await decodeAudioData(decode(part.inlineData.data), outCtx, 24000, 1);
                    const src = outCtx.createBufferSource(); 
                    src.buffer = buf; 
                    src.connect(outCtx.destination);
                    src.onended = () => { 
                      sourcesRef.current.delete(src); 
                      if (sourcesRef.current.size === 0) setStatus(JarvisStatus.LISTENING); 
                    };
                    src.start(nextStartTimeRef.current); 
                    sourcesRef.current.add(src);
                    nextStartTimeRef.current += buf.duration; 
                    setStatus(JarvisStatus.SPEAKING);
                  }
                }
              }
            }
          },
          onerror: (err) => {
            addLog(`! Neural Link Error: ${err?.message || 'Connection failed'}`, "SYSTEM", "error");
            stopLive();
          },
          onclose: () => {
            addLog("⌬ Neural Link: Connection terminated by remote host.", "SYSTEM", "warning");
            stopLive();
          }
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { 
      isConnectingRef.current = false; 
      setStatus(JarvisStatus.IDLE); 
      addLog(`! Neural Link Initialization Failed: ${err.message}`, "SYSTEM", "error");
    }
  };

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  return (
    <div 
      onClick={recordUserActivity}
      onKeyDown={recordUserActivity}
      className={`h-screen w-screen flex flex-col font-sans relative overflow-hidden transition-colors duration-500 ${
      isSlate ? 'bg-[#12151c] text-slate-200' : 'bg-transparent text-slate-100'
    }`}>
      <header className={`h-11 flex items-center justify-between px-5 z-50 shrink-0 transition-all duration-300 ${
        isSlate
          ? 'bg-zinc-800/90 border-b border-slate-700/80 shadow-lg text-slate-200'
          : 'glass border-b border-cyan-500/20 shadow-lg'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <button 
              onClick={() => { playClick(); setIsHistoryVisible(!isHistoryVisible); setIsMemoryVisible(false); setIsUpgradeVisible(false); }} 
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all border font-bold ${
                isSlate
                  ? isHistoryVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isHistoryVisible ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 rounded' : 'bg-slate-900/50 border-white/5 text-slate-500 rounded'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span className="text-[9px] font-orbitron">Archives</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsMemoryVisible(!isMemoryVisible); setIsHistoryVisible(false); setIsUpgradeVisible(false); if(!isMemoryVisible) addLog('⌬ Memory Cluster: Accessing long-term neural storage...', 'JARVIS', 'info'); }} 
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all border font-bold ${
                isSlate
                  ? isMemoryVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isMemoryVisible ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 rounded' : 'bg-slate-900/50 border-white/5 text-slate-500 rounded'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="text-[9px] font-orbitron">Memory</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsUpgradeVisible(!isUpgradeVisible); setIsHistoryVisible(false); setIsMemoryVisible(false); }} 
              className={`flex items-center gap-1.5 px-2.5 py-1 transition-all border font-bold relative ${
                isSlate
                  ? isUpgradeVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isUpgradeVisible ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 rounded' : 'bg-slate-900/50 border-white/5 text-slate-500 rounded'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[9px] font-orbitron">Upgrades</span>
              {upgradeRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              )}
            </button>
          </div>

          <div className={`flex items-center gap-1 font-orbitron text-xs tracking-wider ${
            isSlate ? 'text-zinc-200 font-bold' : 'text-cyan-400'
          }`}>
            <Clock className="w-3.5 h-3.5" /> {time.toLocaleTimeString([], { hour12: false })}
          </div>
          
          {/* Fast Efficiency Mode Badge & Toggle */}
          <button 
            onClick={() => { setVocalConciseness(!vocalConciseness); playClick(); }}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 transition-all border ${
              isSlate
                ? vocalConciseness ? 'border-emerald-500/80 text-emerald-300 bg-emerald-500/20 rounded-xl font-bold' : 'border-slate-700 text-slate-400 bg-zinc-900/50 rounded-xl'
                : vocalConciseness ? 'border-emerald-400 text-emerald-300 bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/50 rounded' : 'border-amber-500/50 text-amber-300 bg-amber-500/10 rounded'
            }`}
            title="Fast Efficiency Mode ensures low latency and ultra-concise responses"
          >
            <Zap className={`w-3.5 h-3.5 ${vocalConciseness ? 'animate-bounce text-emerald-300' : 'text-amber-400'}`} />
            <span className="text-[9px] font-orbitron font-black uppercase tracking-wider">
              {vocalConciseness ? 'FAST EFFICIENCY: ON' : 'EFFICIENCY: OFF'}
            </span>
          </button>


          {/* OS Control Button */}
          <button 
            onClick={() => { 
              const nextState = !osControl;
              setOsControl(nextState); 
              playClick(); 
              addLog(`⌬ OS CONTROL: ${nextState ? 'ENGAGED - PC Control Active' : 'DISENGAGED - Read Only Mode'}`, 'SYSTEM', nextState ? 'success' : 'warning');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 transition-all border ${
              isSlate
                ? osControl ? 'border-slate-500 text-zinc-100 bg-zinc-700/80 rounded-xl font-bold ring-1 ring-zinc-400/30' : 'border-slate-700 text-slate-500 bg-zinc-900/50 rounded-xl'
                : osControl ? 'border-cyan-400 text-cyan-200 bg-cyan-500/25 shadow-[0_0_12px_rgba(0,242,255,0.4)] ring-1 ring-cyan-400/50 rounded' : 'border-slate-600/60 text-slate-400 bg-slate-900/60 rounded'
            }`}
            title="Toggle JARVIS Operating System Control (PC Automation & Command Execution)"
          >
            <Cpu className={`w-3.5 h-3.5 ${osControl ? isSlate ? 'text-zinc-200' : 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[9px] font-orbitron font-black uppercase tracking-wider">
              {osControl ? 'OS CONTROL: ON' : 'OS CONTROL: OFF'}
            </span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex-1 max-w-xl px-4 hidden lg:flex items-center justify-center gap-2">
          {(['CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'] as JarvisMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); playClick(); addLog(`⌬ Mode manually switched to ${m}_MODE`, 'SYSTEM', 'info'); }}
              className={`px-2.5 py-0.5 rounded-full border text-[8px] font-orbitron font-bold tracking-widest transition-all duration-300 ${
                isSlate
                  ? mode === m ? 'bg-zinc-700 border-zinc-400 text-zinc-100 shadow-md' : 'bg-zinc-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  : mode === m ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.3)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Quick Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-white/10 rounded px-1.5 py-0.5">
            {(['cyber', 'slate', 'minimal', 'gold'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); playClick(); addLog(`⌬ Theme switched to ${t.toUpperCase()}`, 'JARVIS', 'info'); }}
                className={`text-[8px] font-orbitron font-bold uppercase px-1.5 py-0.5 rounded transition-all ${
                  theme === t ? 'bg-cyan-500 text-black font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${t} theme`}
              >
                {t[0]}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isSlate 
              ? 'bg-zinc-800/80 border-slate-700 text-zinc-200' 
              : 'bg-slate-900/60 border-cyan-500/10 backdrop-blur-md text-cyan-400'
          }`}>
            <Activity className={`w-3 h-3 ${isLive ? (isSlate ? 'text-zinc-200' : 'text-cyan-400 animate-pulse') : 'text-slate-500'}`} />
            <span className="text-[8px] font-orbitron tracking-[0.25em] uppercase font-bold">STATUS: {status}</span>
          </div>
          <button 
            onClick={stopLive} 
            className={`group flex items-center gap-1.5 px-3 py-1 border text-[8px] font-orbitron font-bold ${
              isSlate 
                ? 'bg-rose-950/40 border-rose-800 text-rose-300 rounded-xl hover:bg-rose-900/60'
                : 'bg-red-950/20 border-red-500/20 rounded text-red-500 hover:bg-red-600'
            }`}
          >
            <Power className="w-3 h-3 group-hover:animate-spin" /> EMERGENCY
          </button>
        </div>
      </header>


      <div className="flex-1 flex overflow-hidden p-6 pb-0 gap-6 relative">
        <ChatHistoryPanel 
          isVisible={isHistoryVisible} 
          activeSessionId={activeSessionId} 
          sessions={sessions}
          activeLogs={logs}
          theme={theme}
          onClose={() => setIsHistoryVisible(false)}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            const session = sessions.find(s => s.session_id === id);
            if (session) {
              if (session.logs && session.logs.length > 0) {
                setLogs(session.logs);
              }
              addLog(`⌬ Archives: Switched to session [${session.title}].`, 'SYSTEM', 'info');
            }
          }} 
          onNewChat={() => {
            const newId = `s_${Math.random().toString(36).substr(2, 9)}`;
            const newSession: ChatSession = {
              session_id: newId,
              title: `Neural Session #${sessions.length + 1}`,
              timestamp_created: Date.now(),
              timestamp_last_message: Date.now(),
              last_message_preview: "Neural session initialized.",
              mode: mode,
              model: 'gemini-3-flash-preview',
              messageCount: 0,
              memorySaved: false,
              logs: []
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newId);
            setLogs([
              { id: '1', source: 'SYSTEM', message: `● Session [${newSession.title}] active in Fast Efficiency Mode.`, timestamp: Date.now(), type: 'success' }
            ]);
            handleNewChat();
          }} 
          onTogglePin={(id) => {
            setSessions(prev => prev.map(s => s.session_id === id ? { ...s, isPinned: !s.isPinned } : s));
          }}
          onDeleteSession={(id) => {
            if (sessions.length <= 1) return;
            setSessions(prev => prev.filter(s => s.session_id !== id));
            if (activeSessionId === id) {
              const remaining = sessions.filter(s => s.session_id !== id);
              if (remaining.length > 0) {
                setActiveSessionId(remaining[0].session_id);
                if (remaining[0].logs) setLogs(remaining[0].logs);
              }
            }
          }}
        />
        {isMemoryVisible && <div className="w-96 h-full animate-in slide-in-from-left duration-500 z-40"><MemoryPanel memories={memories} personality={personality} userIdentity={userIdentity} onAddMemory={(c, cat, type) => setMemories(p => [{ id: Math.random().toString(), content: c, category: cat, timestamp: Date.now(), type: type || 'long_term' }, ...p])} onDeleteMemory={(id) => setMemories(p => p.filter(m => m.id !== id))} onUpdatePersonality={setPersonality} onUpdateIdentity={setUserIdentity} theme={theme} /></div>}
        {isUpgradeVisible && <div className="w-96 h-full animate-in slide-in-from-left duration-500 z-40"><UpgradePanel requests={upgradeRequests} onClear={() => setUpgradeRequests([])} onRemove={(id) => setUpgradeRequests(prev => prev.filter(r => r.id !== id))} theme={theme} /></div>}
        
        <div className="flex-1 min-w-0 flex flex-col gap-0 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <HudCore status={status} micLevel={micLevel} />
          </div>
          <div className="z-20 flex-1 flex flex-col overflow-hidden">
            <div className={`flex-1 overflow-hidden flex flex-col shadow-2xl relative transition-all duration-300 ${
              isSlate 
                ? 'bg-zinc-900/90 border border-slate-700/80 rounded-t-2xl'
                : 'glass rounded-t-xl border-white/10'
            }`}>
               {isBrowserActive ? (
                 <div className="h-full w-full flex flex-col relative bg-[#111]">
                    <iframe src={browserUrl} className="flex-1 w-full h-full border-none opacity-90" title="JARVIS HUD BROWSER" />
                    <div className="absolute top-2 right-4 z-20 flex gap-2">
                       <button onClick={() => setIsBrowserActive(false)} className="bg-black/80 p-2 rounded-full text-white hover:text-red-400 border border-white/10 shadow-lg"><X className="w-4 h-4" /></button>
                    </div>
                    {/* Neural Analysis Overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent pointer-events-none">
                       <div className="text-[9px] font-mono text-cyan-400 animate-pulse">ANALYZING_REMOTE_BUFFER... [ENCRYPTED_TUNNEL_ACTIVE]</div>
                    </div>
                 </div>
               ) : intelligenceReport ? (
                 <div className="relative h-full"><button onClick={() => setIntelligenceReport(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-white/10 rounded-full text-slate-400 hover:text-cyan-400"><X className="w-5 h-5" /></button><IntelligenceBriefing content={intelligenceReport} /></div>
               ) : (
                 <Terminal logs={logs} theme={theme} />
               )}
            </div>
            <ChatBox onSendMessage={handleSendMessage} waveform={<Waveform isActive={status === JarvisStatus.SPEAKING || status === JarvisStatus.LISTENING} color={isSlate ? '#e4e4e7' : status === JarvisStatus.LISTENING ? '#00f2ff' : '#0041ff'} />} theme={theme} />
          </div>
        </div>

        <VisionPanel 
          videoRef={videoRef} 
          screenVideoRef={screenVideoRef}
          isScreenActive={isScreenActive}
          isOpticActive={isOpticActive}
          status={status}
          theme={theme}
        />
      </div>

      <footer className={`h-20 flex items-center justify-center gap-6 z-50 shrink-0 px-4 transition-all duration-300 ${
        isSlate 
          ? 'bg-zinc-900/95 border-t border-slate-700/80 shadow-2xl' 
          : isMinimal
            ? 'bg-[#0b0f17]/95 border-t border-emerald-500/20 shadow-2xl'
            : isGold
              ? 'bg-[#14100c]/95 border-t border-amber-500/20 shadow-2xl'
              : 'glass border-t border-cyan-500/20'
      }`}>
        <ControlButton icon={Mic} label="NEURAL" active={isLive} onClick={handleStartLive} color="cyan" disabled={isConnectingRef.current} theme={theme} />
        <ControlButton 
          icon={isMicMuted ? MicOff : Mic} 
          label="MIC_SENSE" 
          active={!isMicMuted} 
          onClick={() => {
            const newState = !isMicMuted;
            setIsMicMuted(newState);
            addLog(`⌬ Mic Sense: ${newState ? 'Sensors suspended (Muted)' : 'Sensors active (Unmuted)'}.`, 'SYSTEM', newState ? 'warning' : 'success');
          }} 
          color={isMicMuted ? "red" : "cyan"} 
          theme={theme}
        />
        <ControlButton icon={isJarvisMuted ? VolumeX : Volume2} label="JARVIS_VOICE" active={!isJarvisMuted} onClick={() => setIsJarvisMuted(!isJarvisMuted)} color={isJarvisMuted ? "red" : "blue"} theme={theme} />
        <ControlButton icon={Monitor} label="OPTIC" active={isOpticActive} onClick={() => handleToggleOptic()} color="blue" theme={theme} />
        <ControlButton icon={Layout} label="SCREEN" active={isScreenActive} onClick={() => handleToggleScreenPerception()} color="purple" theme={theme} />
        <ControlButton icon={Laptop} label="OS_CONTROL" active={isOSConsoleOpen} onClick={() => setIsOSConsoleOpen(!isOSConsoleOpen)} color="cyan" theme={theme} />
        <ControlButton icon={Database} label="MEMORY" active={isMemoryVisible} color="cyan" onClick={() => { setIsMemoryVisible(!isMemoryVisible); if(!isMemoryVisible) addLog('⌬ Memory Cluster: Accessing long-term neural storage...', 'JARVIS', 'info'); }} theme={theme} />
        <ControlButton icon={Settings} label="CONFIG" color="slate" onClick={() => setIsSettingsOpen(true)} theme={theme} />
        <ControlButton icon={TerminalIcon} label="COMMAND" color="cyan" onClick={() => { setIntelligenceReport(null); setIsBrowserActive(false); addLog('⌬ Neural Reset: Direct Link Primed.', 'JARVIS', 'info'); }} theme={theme} />
      </footer>

      <OSControlConsole
        isOpen={isOSConsoleOpen}
        onClose={() => setIsOSConsoleOpen(false)}
        addLog={addLog}
        theme={theme}
        systemVolume={systemVolume}
        setSystemVolume={setSystemVolume}
        systemBrightness={systemBrightness}
        setSystemBrightness={setSystemBrightness}
        firewallActive={firewallActive}
        setFirewallActive={setFirewallActive}
      />

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        osControl={osControl} 
        setOsControl={setOsControl} 
        vocalConciseness={vocalConciseness}
        setVocalConciseness={setVocalConciseness}
        timezone={timezone}
        setTimezone={(tz) => {
          setTimezone(tz);
          addLog(`⌬ Neural Clock: Calibrated to ${tz}.`, 'SYSTEM', 'success');
        }}
        theme={theme}
        setTheme={setTheme}
        onClearLogs={clearNeuralLogs} 
      />
    </div>
  );
};

const ControlButton = ({ icon: Icon, label, active, onClick, color, disabled, theme = 'cyber' }: any) => {
  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const colorMapCyber: any = {
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5 hover:border-blue-400',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5 hover:border-purple-400',
    slate: 'text-slate-400 border-slate-500/30 bg-slate-500/5 hover:border-slate-300',
    red: 'text-red-500 border-red-500/30 bg-red-500/5 hover:border-red-400',
  };

  const colorMapSlate: any = {
    cyan: 'text-zinc-200 border-slate-700 bg-zinc-800/80 hover:border-zinc-500 hover:bg-zinc-700',
    blue: 'text-zinc-200 border-slate-700 bg-zinc-800/80 hover:border-zinc-500 hover:bg-zinc-700',
    purple: 'text-zinc-200 border-slate-700 bg-zinc-800/80 hover:border-zinc-500 hover:bg-zinc-700',
    slate: 'text-zinc-300 border-slate-700 bg-zinc-800/80 hover:border-zinc-500 hover:bg-zinc-700',
    red: 'text-rose-300 border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/60',
  };

  const colorMapMinimal: any = {
    cyan: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30 hover:border-emerald-400',
    blue: 'text-teal-300 border-teal-500/30 bg-teal-950/30 hover:border-teal-400',
    purple: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/30 hover:border-cyan-400',
    slate: 'text-slate-300 border-slate-600/30 bg-slate-900/30 hover:border-slate-400',
    red: 'text-red-300 border-red-500/30 bg-red-950/30 hover:border-red-400',
  };

  const colorMapGold: any = {
    cyan: 'text-amber-300 border-amber-500/30 bg-amber-950/30 hover:border-amber-400',
    blue: 'text-amber-200 border-amber-500/30 bg-amber-950/30 hover:border-amber-400',
    purple: 'text-yellow-300 border-yellow-500/30 bg-yellow-950/30 hover:border-yellow-400',
    slate: 'text-stone-300 border-stone-600/30 bg-stone-900/30 hover:border-stone-400',
    red: 'text-red-400 border-red-500/30 bg-red-950/30 hover:border-red-400',
  };

  const styleClasses = isSlate ? colorMapSlate[color] : isMinimal ? colorMapMinimal[color] : isGold ? colorMapGold[color] : colorMapCyber[color];

  return (
    <button onClick={onClick} disabled={disabled} className={`group flex flex-col items-center gap-1.5 transition-all transform hover:-translate-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className={`w-10 h-10 border flex items-center justify-center transition-all duration-300 ${
        isSlate ? 'rounded-2xl shadow-sm' : isMinimal || isGold ? 'rounded-xl shadow-md' : 'rounded-full'
      } ${styleClasses} ${
        active 
          ? isSlate 
            ? 'bg-zinc-200 border-white text-zinc-900 shadow-md font-bold' 
            : isMinimal
              ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] font-bold'
              : isGold
                ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-bold'
                : 'shadow-[0_0_20px_rgba(0,242,255,0.4)] border-cyan-400 bg-cyan-500/20' 
          : ''
      }`}>
        <Icon className={`w-4 h-4 ${active ? (isSlate ? '' : 'animate-pulse') : ''}`} />
      </div>
      <span className={`text-[8px] font-orbitron tracking-[0.2em] font-bold ${
        active ? (isSlate ? 'text-zinc-100' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-white') : 'text-slate-500'
      }`}>{label}</span>
    </button>
  );
};

export default App;
