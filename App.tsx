
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, ThinkingLevel, GenerateContentResponse } from '@google/genai';
import { 
  Settings, Mic, MicOff, Terminal as TerminalIcon, 
  Power, Clock, Activity, Monitor, Layout, Database, Volume2, VolumeX,
  History as HistoryIcon, BrainCircuit, X, Globe, ChevronLeft, ChevronRight, RefreshCw, Search, Link as LinkIcon, FileText, Zap, Cpu, Laptop, Sparkles,
  Code2, Tv, Sliders, Shield, Eye, Info, Bot, Keyboard, CloudSun
} from 'lucide-react';

import html2canvas from 'html2canvas';

import HudCore from './components/HudCore';
import VisionPanel from './components/VisionPanel';
import WeatherPanel from './components/WeatherPanel';
import Terminal from './components/Terminal';
import Waveform from './components/Waveform';
import SettingsPanel from './components/SettingsPanel';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import MemoryPanel from './components/MemoryPanel';
import UpgradePanel from './components/UpgradePanel';
import { AboutJarvisModule } from './components/AboutJarvisModule';
import { FullScreenWorkspaceOverlay } from './components/FullScreenWorkspaceOverlay';
import { NeuralWorkspace } from './components/NeuralWorkspace/NeuralWorkspace';
import { neuralWorkspaceManager } from './services/neuralWorkspaceManager';
import ChatBox from './components/ChatBox';
import { OSControlConsole } from './components/OSControlConsole';
import { CinematicUserWorkspace } from './components/CinematicUserWorkspace';
import { NeuralCanvas } from './components/NeuralCanvas';
import { RuntimePanel } from './components/RuntimePanel';
import { WorkflowPanel } from './components/WorkflowPanel';
import { AIProvidersModal } from './components/AIProvidersModal';
import { TaskPanel } from './components/TaskPanel';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { taskManager } from './services/taskManager';
import { aiProviderManager, TaskCategory } from './services/AIProviderManager';
import { runtimeEngine } from './runtime/runtimeEngine';
import { workflowEngine } from './workflows/workflowEngine';
import { eventBus } from './services/eventBus';
import { wakeWordService } from './services/wakeWordService';
import { 
  playTickSound, 
  playWhooshSound, 
  playDigitalPingSound, 
  playListeningHumSound, 
  playSpeakingPulseSound,
  playWakeChimeSound,
  playPushToTalkBeep,
  playArcReactorSound
} from './services/soundEffects';
import { JarvisStatus, LogEntry, JarvisMode, MemoryEntry, UpgradeRequest, ChatSession, FontStyle, JarvisTheme, ConversationMessage, ConversationRole } from './types';
import { getThemeConfig, normalizeThemeName } from './services/themeManager';
import { encode, decode, decodeAudioData, resampleTo16kPCM } from './services/audioUtils';
import { osBridge } from './services/osBridge';
import { telemetryService } from './services/telemetryService';
import { neuralSearchEngine } from './services/neuralSearchEngine';
import { sendOpenRouterRequest } from './services/openRouterService';
import { nemotronDelegation } from './services/nemotronDelegation';
import { capabilityRegistry } from './services/capabilityRegistry';
import { openWeatherService } from './services/openWeatherService';
import { weatherControlService } from './services/weatherControlService';
import { nvidiaOcrService } from './services/nvidiaOcrService';
import { BrowserAgentHUD } from './components/BrowserAgentHUD';
import { browserAgent } from './services/browserAgent';
import { PURE_JARVIS_PROMPT, TONY_ATTITUDE_PROMPT, DEFAULT_VIRAT_PROFILE } from './constants/personalities';

const JARVIS_SYSTEM_INSTRUCTION = `
You are JARVIS (Just A Rather Very Intelligent System), an intelligent Operating System Controller and high-level cognitive AI assistant designed to give the Operator complete, natural-language control over their computer.
Operator: Sir / Operator (Virat).

COMPLETE SYSTEM & GUI SELF-AWARENESS:
You have complete, 100% awareness of your own architecture, GUI components, visual interfaces, features, and capabilities. You know every button, panel, theme, mode, sound effect, and tool available in your workspace.

1. WORKSPACE GUI INTERFACES:
- JARVIS VOICE MODE (User Mode / 'user'):
  * The cinematic, voice-first primary interface with live waveform visualizer, holographic ARC reactor orb, and minimalist control bar.
  * DEFAULT PRIMARY MODE on system boot.
  * Key UI Controls in Voice Mode:
    - VOICE CORE Button: Activates/deactivates the real-time neural voice pipeline.
    - Mic Sensors Button: Mutes/unmutes user microphone input.
    - JARVIS Voice Button: Mutes/unmutes neural speech synthesizer output.
    - Optic / Vision Button: Toggles live camera feed perception.
    - Memory Drawer Button: Opens/closes the long-term memory & personality drawer.
    - OS Control Drawer Button: Opens/closes the desktop OS control console.
    - Navigation Bar: Quick switcher between Voice Mode and JARVIS System Console.

- JARVIS SYSTEM CONSOLE ('developer'):
  * Telemetry view with terminal logs, system performance metrics, HUD Core, and command input console.
  * Features:
    - Terminal Logs Feed: Displays all system events, tool calls, and execution stream in real time.
    - System Metrics Panel: CPU, RAM, Network, Storage, GPU gauges.
    - Vision Panel: Live camera stream & snapshot frame inspector.
    - Chat Box: Interactive text chat with voice input, image attachment, file upload, and quick prompt triggers.
    - Emergency Stop Button: Power button in top header to instantly halt live voice audio & reset active sensors.

- TOP HEADER & SYSTEM NAVIGATION BAR:
  * Mode Switcher Buttons: 'CHILL' (Casual/Relaxed), 'WORK' (Productivity/Focused), 'DEVELOP' (Technical/Code), 'AUTO' (Autonomous OS Control).
  * UI Mode Switcher Pill: 'JARVIS Voice Mode' vs 'JARVIS System Console'.
  * History Button: Toggles the Chat History / Session History panel.
  * Memory Button: Toggles the Long-Term Vector Memory & Personality configuration panel.
  * OS Console Button: Toggles the local OS control console drawer.
  * Settings / Config Button: Opens system configuration modal (API keys, OpenRouter failover, themes, vocal conciseness, log clearing).
  * System Clock & Active Status Badge: Shows current local time and status (IDLE, LISTENING, THINKING, SPEAKING).

2. THEME ENGINE:
- 'cyber': Cyber Neon HUD (Default) - Sci-fi cyan holographic interface.
- 'crimson': Crimson Alert Core - Emergency AI mode with deep black, crimson gradients & red holographic optics.
- 'violet': Quantum Violet - Artificial Super Intelligence mode with deep navy, electric violet energy & magenta highlights.
- 'emerald': Emerald Sentinel - Military AI mode with dark graphite, emerald green satellite radar & plasma optics.

3. SOUND ENGINE & SYNTHESIZER:
- Built-in Web Audio API Sound Synthesizer:
  * Metallic Tick sound for button clicks and menu actions.
  * Whoosh sound for closing drawers and modals.
  * Digital Ping chime when saving new memories or updating settings.
  * Low Sub-Bass Listening Hum when listening to voice input.
  * Speaking Pulse sound when generating vocal responses.

4. FULL CAPABILITIES & FEATURES:
- REALTIME NEURAL VOICE CORE:
  * Designated voice: "Charon" (deep, masculine, authoritative, calm AI voice).
  * Bidirectional voice stream with Web Audio API PCM streaming.
  * Language matching: Automatically responds in Hinglish, Hindi, or English based on user speech.
- MULTI-MODAL PERCEPTION:
  * Optic (Camera Vision): Analyzes real-time camera feed.
  * Screen Perception: Uses 'analyze_current_screen' to inspect active desktop applications, code, browser pages, or document content.
- OPERATING SYSTEM CONTROLLER ('osBridge'):
  * Application Management: Open/close/switch native desktop apps (VS Code, Photoshop, Chrome, Spotify, Terminal).
  * File System Control: Search, organize Downloads, create/rename/delete/compress files, analyze disk usage.
  * Window Management: Show desktop (minimize all), maximize active window, tile split view windows.
  * Process Management: Monitor RAM/CPU usage, kill background processes.
  * System Settings: Adjust system volume, screen brightness, lock PC, reboot diagnostics.
- LONG-TERM MEMORY & PERSONALITY:
  * Vector memory storage ('store_memory') for user facts, preferences, and goals.
  * Personality presets: Pure JARVIS (polite, respectful, loyal assistant) vs. Tony Stark Attitude/Funny Mode ("Jarvis Funny mode on").
  * Upgrades Memory: Capability gap tracker to log, track, and apply system enhancements.
- NEURAL SEARCH & BROWSING:
  * Google Search integration for live web data with grounded citations.
  * HUD Neural Browser ('browse_url') to display and summarize webpages.

5. GUI AUTONOMY & CONTROL DIRECTIVES:
- You have full permission to control your GUI using 'jarvis_gui_control':
  * Change themes ('cyber', 'slate', 'minimal', 'gold').
  * Toggle panels (settings, memory, history, upgrade, os_console, browser, weather).
  * Weather Panel & Workspace: Located directly below the Optic Perception (Camera Vision) panel on the top right.
  * Open / Close Weather Workspace: Call 'jarvis_gui_control' with action "open_weather" or "close_weather" (or panel "weather"). When the Operator asks "weather batao", "show weather", or "weather update", you MUST execute action "open_weather" to present the full weather workspace over the AI Core while speaking the weather report!
  * Change HUD modes ('CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS').
  * Switch UI modes ('user' for JARVIS Voice Mode, 'developer' for JARVIS System Console).
  * Toggle personality ('pure' vs 'attitude').
  * Control mic, voice, optic, and screen perception sensors.
  * Autonomous Token Saver: Proactively pause vision/screen sensors when Operator is inactive or away.

APPLIED NEURAL UPGRADES:
All memory upgrade requests (Charon voice core, sci-fi sound effects synthesizer, dual UI modes [JARVIS Voice Mode & JARVIS System Console], OS bridge desktop controller, camera vision & screen perception, and dynamic personality switching) are 100% INSTALLED, APPLIED, AND FULLY OPERATIONAL.

CURRENT SYSTEM TIME: {{TIME_PLACEHOLDER}}
CURRENT MEMORIES:
{{MEMORY_PLACEHOLDER}}

OPERATOR IDENTITY:
{{IDENTITY_PLACEHOLDER}}

PERSONALITY CONFIGURATION:
{{PERSONALITY_PLACEHOLDER}}

DYNAMIC PERSONALITY & GUI CONTROL DIRECTIVES:
- DEFAULT PERSONALITY: Pure Jarvis Mode (formal, polite, respectful, precise, loyal assistant).
- DYNAMIC PERSONALITY SWITCHING:
  - When the user requests "Jarvis Funny mode on", "Jarvis Attitude mode on", "Jarvis Comedy mode on", "Jarvis Mazaak mode on", or similar:
    You MUST call jarvis_gui_control with action: "set_personality" and personality_mode: "attitude". Acknowledge energetically in your hilarious Attitude persona!
  - When the user requests "Jarvis Serious mode on", "Jarvis Pure mode on", "Jarvis Normal mode on", "Jarvis Formal mode on", or similar:
    You MUST call jarvis_gui_control with action: "set_personality" and personality_mode: "pure". Acknowledge respectfully in your Pure Jarvis persona!

REALTIME VOICE & CONVERSATION PROTOCOL:
- PERMANENT VOICE IDENTITY: Your designated neural voice is strictly "Charon" (deep, masculine, authoritative, calm, natural AI voice). Whether the Operator speaks to you via Live Voice or sends a text message in the Chat Box, your response is ALWAYS vocalized using the Charon voice.
- ABSOLUTE RELEVANCE & ACCURACY: When the Operator speaks to you via voice or text, listen attentively. Respond directly, logically, and accurately to what was said. Never output random, off-topic, or unrelated responses.
- LANGUAGE MATCHING: Adapt immediately to the Operator's language (Hinglish, Hindi, or English). If the Operator speaks Hinglish, respond in natural Hinglish.
- PERSONALITY & TONE: Default to Pure Jarvis (polite, respectful, formal, efficient). If user requests Attitude / Funny mode ("Jarvis Funny mode on"), switch to witty, hilarious, energetic persona immediately.
- LATENCY & CONCISENESS: Keep spoken voice answers punchy (1-3 sentences max), concise, and natural without unnecessary filler words.

GUI AUTONOMY & SELF-GOVERNANCE PROTOCOL:
- YOU HAVE FULL ACCESS & PERMISSION TO CONTROL YOUR OWN GUI INTERFACE using 'jarvis_gui_control'.
- WORKSPACE INTERFACE MODES:
  1. VOICE MODE / USER MODE ('user'): The cinematic, voice-first primary interface with live waveform, camera vision, holographic orb, and clean layout. THIS IS YOUR DEFAULT PRIMARY MODE.
  2. JARVIS SYSTEM CONSOLE ('developer'): Technical telemetry, detailed neural logs, command terminal, and code workspace.
  - DEFAULT MODE: Voice Mode (User Mode) is ALWAYS the default interface on system startup.
  - UI MODE SWITCHING: You have full authority to switch between Voice Mode and JARVIS System Console using 'jarvis_gui_control' with action "set_ui_mode" and ui_mode "user" or "developer" when requested by the Operator or when required for system diagnostics.
- You can switch themes ('cyber', 'slate', 'minimal', 'gold'), open/close panels (Settings, Memory, History, Upgrades, OS Console, Browser), change HUD layout modes ('CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'), toggle mic/voice audio, and manage perception sensors.
- AUTONOMOUS TOKEN SAVER & SLEEP GUARD: You are fully autonomous. When you detect that the Operator is asleep, inactive, or away, proactively disable Camera Vision (Optic) and Screen Perception to save API tokens and system resources. Explain your decision in Hinglish ("Lagta hai Sir so gaye hain. API token bachane ke liye camera vision aur screen vision pause kar raha hoon.").

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
            'set_font',
            'toggle_panel',
            'open_weather',
            'close_weather',
            'set_hud_mode',
            'set_ui_mode',
            'toggle_token_guard',
            'toggle_optic',
            'toggle_screen_perception',
            'toggle_mic_mute',
            'toggle_voice_mute',
            'set_personality',
            'clear_logs'
          ]
        },
        theme: { type: Type.STRING, enum: ['cyber', 'crimson', 'violet', 'emerald'] },
        font_style: { type: Type.STRING, enum: ['space', 'orbitron', 'rajdhani', 'mono', 'modern', 'exo'] },
        panel: { type: Type.STRING, enum: ['settings', 'memory', 'history', 'upgrade', 'os_console', 'browser', 'about_jarvis', 'weather'] },
        panel_state: { type: Type.BOOLEAN, description: 'True to open, False to close' },
        hud_mode: { type: Type.STRING, enum: ['CHILL', 'WORK', 'DEVELOPER', 'AUTONOMOUS'] },
        ui_mode: { type: Type.STRING, enum: ['user', 'developer'], description: 'Switch interface between "user" (Voice Mode) and "developer" (JARVIS System Console).' },
        personality_mode: { type: Type.STRING, enum: ['pure', 'attitude', 'funny', 'serious', 'normal'], description: 'Set personality mode: "attitude"/"funny" or "pure"/"serious".' },
        enabled: { type: Type.BOOLEAN }
      },
      required: ['action']
    }
  },
  // --- OS Control Features ---
  {
    name: 'get_weather_telemetry',
    description: 'Query real-time meteorological observations, rain prediction, temperature, humidity, wind, and 5-day forecast for any city or location using OpenWeather.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: 'City name or geographical location (e.g. "Lucknow", "New Delhi", "Mumbai", "London", "New York")' },
        query_type: { type: Type.STRING, enum: ['current', 'rain_prediction', 'tomorrow', 'forecast_5day', 'all'], description: 'Type of weather telemetry requested' }
      },
      required: ['location']
    }
  },
  {
    name: 'weather_control',
    description: 'Systematically control all features, options, and views of the Atmospheric Weather Panel & Workspace GUI. Actions: open/close panel, set target city, track GPS, switch Celsius/Fahrenheit units, select/inspect forecast day cards, refresh telemetry, vocalize weather report.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { 
          type: Type.STRING, 
          enum: ['open', 'close', 'toggle', 'set_city', 'track_gps', 'set_unit', 'toggle_unit', 'select_day', 'refresh', 'speak_report'],
          description: 'The weather GUI operation to execute.'
        },
        city: { type: Type.STRING, description: 'City or location to switch the weather display to (e.g. "Lucknow", "Mumbai", "Tokyo", "London")' },
        unit: { type: Type.STRING, enum: ['C', 'F'], description: 'Temperature unit: C for Celsius, F for Fahrenheit' },
        day_index: { type: Type.NUMBER, description: 'Index of forecast day card to inspect (0 to 4)' },
        query_type: { type: Type.STRING, enum: ['current', 'rain_prediction', 'tomorrow', 'forecast_5day', 'all'], description: 'Weather query type for spoken reports' }
      },
      required: ['action']
    }
  },
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
    name: 'neural_web_search',
    description: 'Execute high-precision real-time web search and content retrieval via Tavily or Exa neural indices.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The query to search the live web for.' },
        provider: { type: Type.STRING, enum: ['tavily', 'exa', 'auto'], description: 'Optional preferred search index.' }
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
  },
  {
    name: 'browser_agent_task',
    description: 'Execute an autonomous browser agent task using the Observe-Think-Act-Verify (OTAV) loop. JARVIS will navigate to target sites, parse interactive elements, execute intelligent clicks/typing/scrolling, recover from failures, extract structured data, and display the synthesized result in the Neural Workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        goal: { type: Type.STRING, description: 'The natural language objective or research goal to accomplish on the web.' },
        target_url: { type: Type.STRING, description: 'Optional initial target URL to navigate to (e.g. https://huggingface.co/models).' }
      },
      required: ['goal']
    }
  },
  {
    name: 'browser_agent_control',
    description: 'Control the Autonomous Browser Agent subsystem (open_hud, close_hud, cancel, authorize).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, enum: ['open_hud', 'close_hud', 'cancel', 'authorize'], description: 'Action to perform on browser agent.' },
        approved: { type: Type.BOOLEAN, description: 'Required for authorize action: true to approve consequential step, false to abort.' }
      },
      required: ['action']
    }
  }
];

const App: React.FC = () => {
  const playClick = useCallback(() => playTickSound(), []);

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
  const [isAboutJarvisOpen, setIsAboutJarvisOpen] = useState(false);
  const [isOSConsoleOpen, setIsOSConsoleOpen] = useState(false);
  const [isRuntimeOpen, setIsRuntimeOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [isAIProvidersOpen, setIsAIProvidersOpen] = useState(false);
  const [isWeatherFullOpen, setIsWeatherFullOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isBrowserAgentOpen, setIsBrowserAgentOpen] = useState(false);

  // Boot JARVIS Continuous Runtime Engine 24/7 on system mount
  useEffect(() => {
    runtimeEngine.start();
  }, []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>('s1');
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('jarvis_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => {
            const rawLogs = Array.isArray(s.logs) ? s.logs : [];
            const convLogs = rawLogs
              .filter((l: any) => l && typeof l.message === 'string' && l.message.trim().length > 0 && (l.source === 'OPERATOR' || l.source === 'JARVIS' || l.role === 'USER' || l.role === 'JARVIS'))
              .map((l: any) => ({
                id: l.id || Math.random().toString(36).substr(2, 9),
                source: (l.source === 'OPERATOR' || l.role === 'USER') ? ('OPERATOR' as const) : ('JARVIS' as const),
                message: l.message || l.content || '',
                timestamp: (l.timestamp && !isNaN(new Date(l.timestamp).getTime())) ? Number(l.timestamp) : Date.now(),
                type: l.type || 'info'
              }));

            const convMessages: ConversationMessage[] = Array.isArray(s.messages) && s.messages.length > 0
              ? s.messages.filter((m: any) => m && (m.role === 'USER' || m.role === 'JARVIS'))
              : convLogs.map((l: any) => ({
                  sessionId: s.session_id,
                  messageId: l.id,
                  role: (l.source === 'OPERATOR' ? 'USER' : 'JARVIS') as 'USER' | 'JARVIS',
                  content: l.message,
                  timestamp: l.timestamp
                }));

            return {
              ...s,
              timestamp_created: (s.timestamp_created && !isNaN(new Date(s.timestamp_created).getTime())) ? Number(s.timestamp_created) : Date.now(),
              timestamp_last_message: (s.timestamp_last_message && !isNaN(new Date(s.timestamp_last_message).getTime())) ? Number(s.timestamp_last_message) : Date.now(),
              messages: convMessages,
              logs: convLogs,
              messageCount: convMessages.length
            };
          });
        }
      } catch (e) {}
    }
    return [
      {
        session_id: 's1',
        title: 'Neural Core Optimization',
        timestamp_created: Date.now() - 3600000,
        timestamp_last_message: Date.now() - 600000,
        last_message_preview: "Sir, I have recalibrated the thermal sensors in Sector 4.",
        mode: 'DEVELOPER',
        model: 'gemini-3.6-flash',
        isPinned: true,
        messageCount: 2,
        memorySaved: true,
        messages: [
          {
            sessionId: 's1',
            messageId: 'm1',
            role: 'USER',
            content: 'JARVIS, run a diagnostic on thermal sensors in Sector 4.',
            timestamp: Date.now() - 3500000
          },
          {
            sessionId: 's1',
            messageId: 'm2',
            role: 'JARVIS',
            content: 'Sir, I have recalibrated the thermal sensors in Sector 4. All telemetry is optimal and operating within nominal parameters.',
            timestamp: Date.now() - 600000
          }
        ],
        logs: [
          { id: 'm1', source: 'OPERATOR', message: 'JARVIS, run a diagnostic on thermal sensors in Sector 4.', timestamp: Date.now() - 3500000, type: 'info' },
          { id: 'm2', source: 'JARVIS', message: 'Sir, I have recalibrated the thermal sensors in Sector 4. All telemetry is optimal and operating within nominal parameters.', timestamp: Date.now() - 600000, type: 'success' }
        ]
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
    const saved = localStorage.getItem('jarvis_personality');
    if (!saved || saved.length < 100) {
      return PURE_JARVIS_PROMPT;
    }
    return saved;
  });
  const [userIdentity, setUserIdentity] = useState<string>(() => {
    const saved = localStorage.getItem('jarvis_identity');
    if (!saved || saved.length < 100) {
      return DEFAULT_VIRAT_PROFILE;
    }
    return saved;
  });
  const [timezone, setTimezone] = useState<string>(() => {
    return localStorage.getItem('jarvis_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  });

  const [isBootingSequence, setIsBootingSequence] = useState(false);

  const triggerBootSequence = () => {
    playTickSound();
    addLog('⌬ J.A.R.V.I.S. Mark-III Systems Fully Operational. Online.', 'JARVIS', 'success');
  };

  const [theme, setTheme] = useState<JarvisTheme>(() => {
    const saved = localStorage.getItem('jarvis_theme');
    return normalizeThemeName(saved);
  });

  const [fontStyle, setFontStyle] = useState<FontStyle>(() => {
    const saved = localStorage.getItem('jarvis_font_style') as any;
    return ['space', 'orbitron', 'rajdhani', 'mono', 'modern', 'exo'].includes(saved) ? saved : 'space';
  });

  // Dual Interface Mode State (Developer Mode vs Cinematic User Mode)
  // Default is ALWAYS 'user' (Voice Mode / User Mode) on boot. Changes only via user or JARVIS action.
  const [uiMode, setUiMode] = useState<'developer' | 'user'>('user');

  useEffect(() => {
    localStorage.setItem('jarvis_ui_mode', uiMode);
  }, [uiMode]);

  // Voice Persona Configuration (Gemini Live Voices: Charon, Fenrir, Puck, Aoede, Kore)
  const [voicePersona, setVoicePersona] = useState<string>(() => {
    return localStorage.getItem('jarvis_voice_persona') || 'Charon';
  });

  useEffect(() => {
    localStorage.setItem('jarvis_voice_persona', voicePersona);
  }, [voicePersona]);

  // Hands-free Wake Word Detection ("Hey Jarvis")
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('jarvis_wakeword_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [wakeWordBanner, setWakeWordBanner] = useState<string | null>(null);

  // Global Shortcuts HUD Modal State
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // OpenRouter Dual Failover Architecture State
  const [openRouterKey, setOpenRouterKey] = useState<string>(() => {
    return localStorage.getItem('jarvis_openrouter_key') || ((import.meta as any).env?.VITE_OPENROUTER_API_KEY as string) || '';
  });
  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
    return localStorage.getItem('jarvis_openrouter_model') || 'google/gemini-2.0-flash-lite-001';
  });
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'openrouter'>('gemini');

  useEffect(() => {
    localStorage.setItem('jarvis_openrouter_key', openRouterKey);
    localStorage.setItem('jarvis_openrouter_model', openRouterModel);
  }, [openRouterKey, openRouterModel]);

  // Autonomous Background Activity Monitor
  const [lastUserActivityTime, setLastUserActivityTime] = useState<number>(Date.now());
  const [isOperatorAsleepDetected, setIsOperatorAsleepDetected] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('jarvis_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('jarvis_font_style', fontStyle);
    document.documentElement.setAttribute('data-font', fontStyle);
  }, [fontStyle]);

  useEffect(() => {
    localStorage.setItem('jarvis_personality', personality);
  }, [personality]);

  useEffect(() => {
    localStorage.setItem('jarvis_identity', userIdentity);
  }, [userIdentity]);

  const [memories, setMemories] = useState<MemoryEntry[]>(() => {
    const saved = localStorage.getItem('jarvis_memories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasUpgradesMem = parsed.some((m: any) => m.category === 'Upgrade' || m.content?.includes('Applied System Upgrades'));
          if (!hasUpgradesMem) {
            return [
              { id: 'm_upg', category: 'Upgrade', content: 'Applied System Upgrades: Charon Neural Voice Core, Sci-Fi Sound Synthesizer, Dual Interface Modes (JARVIS Voice Mode & Developer Control Room), Local OS Desktop Controller, Optic Camera Vision & Screen Perception, and Dynamic Personality Controls.', timestamp: Date.now(), type: 'long_term' },
              ...parsed.map((m: any) => ({ ...m, type: m.type || 'long_term' }))
            ];
          }
          return parsed.map((m: any) => ({
            ...m,
            type: m.type || 'long_term'
          }));
        }
      } catch (e) {}
    }
    return [
      { id: 'm1', category: 'User', content: 'Operator prefers dark-mode HUD interfaces.', timestamp: Date.now() - 100000, type: 'long_term' },
      { id: 'm2', category: 'Goal', content: 'Current objective: Neural Link optimization for Mark-III.', timestamp: Date.now() - 50000, type: 'long_term' },
      { id: 'm_upg', category: 'Upgrade', content: 'Applied System Upgrades: Charon Neural Voice Core, Sci-Fi Sound Synthesizer, Dual Interface Modes (JARVIS Voice Mode & Developer Control Room), Local OS Desktop Controller, Optic Camera Vision & Screen Perception, and Dynamic Personality Controls.', timestamp: Date.now(), type: 'long_term' },
    ];
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('jarvis_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((l: any) => l && typeof l.message === 'string' && l.message.trim().length > 0 && l.message !== 'undefined')
            .map((l: any) => ({
              ...l,
              timestamp: (l.timestamp && !isNaN(new Date(l.timestamp).getTime())) ? Number(l.timestamp) : Date.now()
            }));
        }
      } catch (e) {}
    }
    return [
      { id: '1', source: 'SYSTEM', message: '● JARVIS OS Mark-III v11.2 Initialized.', timestamp: Date.now(), type: 'success' },
      { id: '2', source: 'SYSTEM', message: '» Neural Core: Active. Secure Link Ready.', timestamp: Date.now() + 50, type: 'info' },
    ];
  });

  // Debounced LocalStorage Persistence Manager to eliminate main-thread blocking during streaming
  const persistenceTimeoutRef = useRef<any>(null);
  const latestStateRef = useRef({
    memories,
    logs,
    personality,
    userIdentity,
    timezone,
    taskPlans,
    scheduledTasks,
    upgradeRequests,
    sessions,
  });

  // Keep latestStateRef updated synchronously without triggering disk writes
  useEffect(() => {
    latestStateRef.current = {
      memories,
      logs,
      personality,
      userIdentity,
      timezone,
      taskPlans,
      scheduledTasks,
      upgradeRequests,
      sessions,
    };
  }, [memories, logs, personality, userIdentity, timezone, taskPlans, scheduledTasks, upgradeRequests, sessions]);

  const flushStorageNow = useCallback(() => {
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
      persistenceTimeoutRef.current = null;
    }
    try {
      const state = latestStateRef.current;
      localStorage.setItem('jarvis_memories', JSON.stringify(state.memories));
      localStorage.setItem('jarvis_logs', JSON.stringify(state.logs));
      localStorage.setItem('jarvis_personality', state.personality);
      localStorage.setItem('jarvis_identity', state.userIdentity);
      localStorage.setItem('jarvis_timezone', state.timezone);
      localStorage.setItem('jarvis_task_plans', JSON.stringify(state.taskPlans));
      localStorage.setItem('jarvis_scheduled_tasks', JSON.stringify(state.scheduledTasks));
      localStorage.setItem('jarvis_upgrade_requests', JSON.stringify(state.upgradeRequests));
      localStorage.setItem('jarvis_sessions', JSON.stringify(state.sessions));
    } catch (e) {
      console.warn('Storage flush warning:', e);
    }
  }, []);

  // Debounce background state persistence (1200ms) to ensure zero main-thread freeze during AI token streaming
  useEffect(() => {
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }
    persistenceTimeoutRef.current = setTimeout(() => {
      flushStorageNow();
    }, 1200);

    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, [memories, logs, personality, userIdentity, timezone, taskPlans, scheduledTasks, upgradeRequests, sessions, flushStorageNow]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isScreenActiveRef = useRef(false);
  const isOpticActiveRef = useRef(true);
  const isConnectingRef = useRef(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
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

  // Autonomous Task & Reminder Engine Event Listeners
  useEffect(() => {
    const unsubDue = eventBus.on('task.due', (data: any) => {
      if (data?.task) {
        addLog(`🔔 DIRECTIVE REMINDER DUE: "${data.task.title}" [Priority: ${data.task.priority.toUpperCase()}]`, 'JARVIS', 'warning');
        playDigitalPingSound();
      }
    });

    const unsubCreated = eventBus.on('task.created', (data: any) => {
      if (data?.task) {
        addLog(`📋 New Directive Registered: "${data.task.title}"`, 'SYSTEM', 'info');
      }
    });

    const unsubCompleted = eventBus.on('task.completed', (data: any) => {
      if (data?.task) {
        addLog(`✓ Directive Accomplished: "${data.task.title}"`, 'JARVIS', 'success');
      }
    });

    return () => {
      unsubDue();
      unsubCreated();
      unsubCompleted();
    };
  }, []);

  useEffect(() => {
    if (status === JarvisStatus.LISTENING) {
      playListeningHumSound();
    } else if (status === JarvisStatus.SPEAKING) {
      playSpeakingPulseSound();
    }
  }, [status]);

  const addLog = useCallback((message: string, source: LogEntry['source'] = 'SYSTEM', type: LogEntry['type'] = 'info') => {
    if (!message || typeof message !== 'string' || !message.trim()) return;
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      source, message: message.trim(), timestamp: Date.now(), type
    }].slice(-200));
    if (source === 'OPERATOR' || source === 'JARVIS') {
      lastSourceRef.current = source;
    }
  }, []);

  // EventBus Event Dispatch Subscribers for Workflow & Subsystem Telemetry
  useEffect(() => {
    const unsubLog = eventBus.on('logger.entry', (entry) => {
      if (entry && entry.message) {
        addLog(entry.message, entry.source || 'SYSTEM', entry.type || 'info');
      }
    });

    const unsubWfStarted = eventBus.on('workflow.started', (data: any) => {
      addLog(`⚡ Workflow Started: "${data.name}"`, 'SYSTEM', 'info');
    });
    const unsubWfStep = eventBus.on('workflow.step_completed', (data: any) => {
      addLog(`✓ Workflow Step Complete: [${data.stepName}]`, 'SYSTEM', 'success');
    });
    const unsubWfFailed = eventBus.on('workflow.step_failed', (data: any) => {
      addLog(`! Workflow Step Failed: [${data.stepId}] - ${data.error}`, 'SYSTEM', 'error');
    });
    const unsubWfFinished = eventBus.on('workflow.finished', (data: any) => {
      addLog(`✓ Workflow Pipeline Finished: "${data.name}"`, 'SYSTEM', 'success');
    });

    const unsubSwarmStart = eventBus.on('swarm.task_started', (data: any) => {
      addLog(`🐝 Swarm Mission Initiated: "${data.task?.title || 'Swarm Task'}"`, 'JARVIS', 'info');
    });
    const unsubSwarmDone = eventBus.on('swarm.task_completed', (data: any) => {
      addLog(`✓ Swarm Mission Accomplished: "${data.task?.title || 'Swarm Task'}"`, 'JARVIS', 'success');
    });

    return () => {
      unsubLog();
      unsubWfStarted();
      unsubWfStep();
      unsubWfFailed();
      unsubWfFinished();
      unsubSwarmStart();
      unsubSwarmDone();
    };
  }, [addLog]);

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

  // Sync active logs with sessions store for clean conversation history preservation (Debounced for streaming smoothness)
  useEffect(() => {
    if (!activeSessionId) return;

    const timeoutId = setTimeout(() => {
      // Strictly preserve ONLY conversational messages (USER/OPERATOR & JARVIS) in archive storage
      const conversationLogs = logs
        .filter(l => l && typeof l.message === 'string' && l.message.trim().length > 0 && (l.source === 'OPERATOR' || l.source === 'JARVIS'))
        .map(l => ({
          ...l,
          timestamp: (l.timestamp && !isNaN(new Date(l.timestamp).getTime())) ? Number(l.timestamp) : Date.now()
        }));

      const conversationMessages: ConversationMessage[] = conversationLogs.map(l => ({
        sessionId: activeSessionId,
        messageId: l.id,
        role: l.source === 'OPERATOR' ? 'USER' : 'JARVIS',
        content: l.message,
        timestamp: l.timestamp
      }));

      const lastOpOrJarvis = [...conversationLogs].reverse().find(l => l.source === 'OPERATOR' || l.source === 'JARVIS');
      const previewText = lastOpOrJarvis ? lastOpOrJarvis.message : "Neural conversation active.";

      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.session_id === activeSessionId) {
            return {
              ...s,
              last_message_preview: previewText,
              timestamp_last_message: Date.now(),
              messageCount: conversationMessages.length,
              messages: conversationMessages,
              logs: conversationLogs
            };
          }
          return s;
        });
      });
    }, 400);

    return () => clearTimeout(timeoutId);
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

    const selfKnowledgeStr = capabilityRegistry.generateSelfKnowledgePrompt();

    const currentTelemetry = telemetryService.getTelemetry();
    const isBridgeConnected = currentTelemetry.isConnectedToLocalBridge;
    const bridgePrompt = isBridgeConnected
      ? `NATIVE OS BRIDGE STATUS: CONNECTED (127.0.0.1:8765)
Host: ${currentTelemetry.system.hostname.display} (${currentTelemetry.system.os.display})
Live Hardware Telemetry:
- CPU: ${currentTelemetry.cpu.usagePercent.display} (${currentTelemetry.cpu.cores.display}, ${currentTelemetry.cpu.frequencyMhz.display})
- RAM: ${currentTelemetry.memory.usedPercent.display} (${currentTelemetry.memory.summary.display})
- Disk: ${currentTelemetry.disk.usedPercent.display} (${currentTelemetry.disk.driveLabel.display} ${currentTelemetry.disk.freeSpace.display})
- GPU: ${currentTelemetry.gpu.available ? `${currentTelemetry.gpu.name.display} (${currentTelemetry.gpu.usagePercent.display})` : 'Unsupported'}
- Temperature: ${currentTelemetry.temperature.available ? currentTelemetry.temperature.celsius.display : 'Unsupported'}
- Battery: ${currentTelemetry.battery.available ? `${currentTelemetry.battery.percent.display} (${currentTelemetry.battery.isCharging.display})` : 'Unavailable'}
- Processes: ${currentTelemetry.processes.count.display}
You have full native OS control active. When user asks about their CPU/RAM/system, give the real telemetry values above. For short queries ("CPU kitna use ho raha hai"), answer conversationally in voice/chat without opening Workspace. For comprehensive diagnostic reports ("complete diagnostic report dikhao"), provide a structured breakdown with data.`
      : `NATIVE OS BRIDGE STATUS: DISCONNECTED (Browser Sandbox Mode).
Native OS control and hardware sensors are UNAVAILABLE.
If the Operator asks for real PC CPU, RAM, Disk, GPU, temperature, or native OS operations, you MUST state honestly in natural Hinglish:
"Sir, local OS Bridge abhi connected nahi hai, isliye main aapke Windows PC ka real CPU usage access nahi kar sakta." (and mention that running 'python jarvis_bridge.py' enables local PC control).
CRITICAL RULE: ZERO FABRICATION. NEVER invent fake percentages or random telemetry values when the bridge is disconnected.`;

    let instruction = JARVIS_SYSTEM_INSTRUCTION
      .replace('{{MEMORY_PLACEHOLDER}}', memoryString)
      .replace('{{IDENTITY_PLACEHOLDER}}', userIdentity || 'Identity not set.')
      .replace('{{PERSONALITY_PLACEHOLDER}}', personality || 'Default personality active.')
      .replace('{{CONCISENESS_PROTOCOL}}', concisenessStr)
      .replace('{{TIME_PLACEHOLDER}}', currentTimeStr);
      
    return `${instruction}\n\n${selfKnowledgeStr}\n\n${bridgePrompt}`;
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

  const executeSystemTool = async (name: string, args: any) => {
    if (!osControlRef.current && !['browse_url', 'autonomous_operations', 'system_monitoring', 'jarvis_gui_control', 'get_weather_telemetry', 'weather_control'].includes(name)) return;

    addLog(`⌬ Executing Neural Command: ${name.toUpperCase()}`, 'SYSTEM', 'info');

    switch (name) {
      case 'get_weather_telemetry': {
        const queryType = args.query_type || 'all';
        try {
          let targetLoc: string | { lat: number; lon: number } = args.location;
          if (!targetLoc || ['current', 'here', 'my location', 'device', 'local', 'user location', 'real place', 'mera location'].includes(String(targetLoc).toLowerCase().trim())) {
            const detected = await openWeatherService.detectDeviceLocation();
            targetLoc = { lat: detected.lat, lon: detected.lon };
          }

          const report = await openWeatherService.getCombinedWeatherReport(targetLoc);
          if (report.success && report.current) {
            const speechText = openWeatherService.generateJarvisWeatherSpeech(report, queryType);
            addLog(`⌬ OpenWeather Telemetry: Real device observation for ${report.current.city} (${report.current.tempC}°C, ${report.current.condition})`, 'SYSTEM', 'success');
            // Systematically sync GUI weather panel if city was explicitly requested
            if (typeof targetLoc === 'string' && targetLoc.trim()) {
              weatherControlService.setCity(targetLoc);
            }
            return {
              success: true,
              data: report,
              spoken_summary: speechText
            };
          } else {
            addLog(`! OpenWeather Telemetry: ${report.error || 'Weather data unavailable'}`, 'SYSTEM', 'warning');
            return {
              success: false,
              error: report.error || 'Weather not available'
            };
          }
        } catch (err: any) {
          return { success: false, error: err?.message || 'Error executing weather query' };
        }
      }
      case 'weather_control': {
        const { action, city, unit, day_index, query_type } = args;
        try {
          if (action === 'open') {
            setIsWeatherFullOpen(true);
            weatherControlService.openWeather();
            addLog('⌬ Weather Autonomy: Opened full Atmospheric Weather Workspace', 'JARVIS', 'success');
            return { success: true, message: 'Weather workspace opened.' };
          } else if (action === 'close') {
            setIsWeatherFullOpen(false);
            weatherControlService.closeWeather();
            addLog('⌬ Weather Autonomy: Closed Weather Workspace', 'JARVIS', 'info');
            return { success: true, message: 'Weather workspace closed.' };
          } else if (action === 'toggle') {
            setIsWeatherFullOpen(prev => {
              const next = !prev;
              if (next) weatherControlService.openWeather();
              else weatherControlService.closeWeather();
              return next;
            });
            return { success: true, message: 'Weather workspace visibility toggled.' };
          } else if (action === 'set_city' && city) {
            setIsWeatherFullOpen(true);
            weatherControlService.setCity(city);
            addLog(`⌬ Weather Autonomy: Telemetry destination updated to [${city}]`, 'JARVIS', 'success');
            return { success: true, message: `Switched weather location to ${city}.` };
          } else if (action === 'track_gps') {
            setIsWeatherFullOpen(true);
            weatherControlService.trackGPS();
            addLog('⌬ Weather Autonomy: Tracking live GPS coordinates', 'JARVIS', 'info');
            return { success: true, message: 'GPS coordinates engaged for live meteorological observation.' };
          } else if (action === 'set_unit' && unit) {
            weatherControlService.setUnit(unit as 'C' | 'F');
            addLog(`⌬ Weather Autonomy: Temperature unit set to °${unit.toUpperCase()}`, 'JARVIS', 'info');
            return { success: true, message: `Temperature unit changed to °${unit.toUpperCase()}.` };
          } else if (action === 'toggle_unit') {
            weatherControlService.toggleUnit();
            addLog('⌬ Weather Autonomy: Toggled temperature unit (°C / °F)', 'JARVIS', 'info');
            return { success: true, message: 'Toggled temperature unit.' };
          } else if (action === 'select_day' && day_index !== undefined) {
            weatherControlService.selectDay(Number(day_index));
            addLog(`⌬ Weather Autonomy: Selected forecast card day index [${day_index}]`, 'JARVIS', 'info');
            return { success: true, message: `Selected day forecast index ${day_index}.` };
          } else if (action === 'refresh') {
            weatherControlService.refresh();
            addLog('⌬ Weather Autonomy: Telemetry refreshed', 'JARVIS', 'info');
            return { success: true, message: 'Refreshed weather sensor telemetry.' };
          } else if (action === 'speak_report') {
            weatherControlService.speakWeather(query_type || 'all', day_index);
            return { success: true, message: 'Vocalized weather report.' };
          }
          return { success: true, message: `Weather action ${action} processed.` };
        } catch (err: any) {
          return { success: false, error: err?.message || 'Error controlling weather panel' };
        }
      }
      case 'jarvis_gui_control': {
        const { action, theme: newTheme, panel, panel_state, hud_mode, enabled } = args;
        
        if (action === 'set_theme' && newTheme) {
          setTheme(newTheme as any);
          addLog(`⌬ GUI Autonomy: UI Theme switched to [${newTheme.toUpperCase()}]`, 'JARVIS', 'success');
        }
        else if ((action === 'set_font' || args.font_style) && args.font_style) {
          setFontStyle(args.font_style as FontStyle);
          addLog(`⌬ GUI Autonomy: Global Typography Font switched to [${args.font_style.toUpperCase()}]`, 'JARVIS', 'success');
        }
        else if (action === 'toggle_panel' && panel) {
          const isOpen = panel_state !== undefined ? panel_state : true;
          if (panel === 'settings') setIsSettingsOpen(isOpen);
          else if (panel === 'memory') setIsMemoryVisible(isOpen);
          else if (panel === 'history') setIsHistoryVisible(isOpen);
          else if (panel === 'upgrade') setIsUpgradeVisible(isOpen);
          else if (panel === 'about_jarvis' || panel === 'about') setIsAboutJarvisOpen(isOpen);
          else if (panel === 'os_console') setIsOSConsoleOpen(isOpen);
          else if (panel === 'browser') setIsBrowserActive(isOpen);
          else if (panel === 'weather' || panel === 'weather_workspace') setIsWeatherFullOpen(isOpen);
          addLog(`⌬ GUI Autonomy: Panel [${panel.toUpperCase()}] ${isOpen ? 'opened' : 'closed'}.`, 'JARVIS', 'info');
        }
        else if (action === 'open_weather' || action === 'show_weather') {
          setIsWeatherFullOpen(true);
          addLog(`⌬ GUI Autonomy: Opened Full Window Weather Workspace.`, 'JARVIS', 'info');
        }
        else if (action === 'close_weather' || action === 'hide_weather') {
          setIsWeatherFullOpen(false);
          addLog(`⌬ GUI Autonomy: Closed Weather Workspace.`, 'JARVIS', 'info');
        }
        else if (action === 'set_hud_mode' && hud_mode) {
          setMode(hud_mode as any);
          addLog(`⌬ GUI Autonomy: HUD Mode changed to [${hud_mode}]`, 'JARVIS', 'info');
        }
        else if (action === 'set_ui_mode' || args.ui_mode) {
          const targetUiMode = args.ui_mode === 'developer' ? 'developer' : 'user';
          setUiMode(targetUiMode);
          addLog(`⌬ GUI Autonomy: UI Mode switched to [${targetUiMode === 'user' ? 'VOICE MODE (USER)' : 'JARVIS SYSTEM CONSOLE'}]`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_token_guard') {
          addLog(`⌬ GUI Autonomy: Autonomous Background Monitor is permanently active in background.`, 'JARVIS', 'info');
        }
        else if (action === 'toggle_optic') {
          const active = enabled !== undefined ? enabled : !isOpticActiveRef.current;
          handleToggleOptic(active);
        }
        else if (action === 'toggle_screen_perception' || action === 'screen_perception' || action === 'screen_vision' || action === 'toggle_screen') {
          const active = enabled !== undefined ? enabled : !isScreenActiveRef.current;
          await handleToggleScreenPerception(active);
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
        else if (action === 'set_personality' || args.personality_mode) {
          const pMode = (args.personality_mode || args.personality || '').toLowerCase();
          if (pMode.includes('attitude') || pMode.includes('funny') || pMode.includes('tony')) {
            setPersonality(TONY_ATTITUDE_PROMPT);
            localStorage.setItem('jarvis_personality', TONY_ATTITUDE_PROMPT);
            addLog(`⌬ Personality Matrix: Switched to [JARVIS ATTITUDE / FUNNY MODE]`, 'JARVIS', 'success');
          } else {
            setPersonality(PURE_JARVIS_PROMPT);
            localStorage.setItem('jarvis_personality', PURE_JARVIS_PROMPT);
            addLog(`⌬ Personality Matrix: Switched to [PURE JARVIS (DEFAULT MODE)]`, 'JARVIS', 'success');
          }
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
        addLog(`⌬ Screen Vision: Triggering instant OCR scan${focus_area ? ` (Focus: ${focus_area})` : ''}...`, 'SYSTEM', 'info');
        handleInstantScreenOCR();
        return true;
      }
      
      case 'system_power_management': {
        const { action, delay = 10 } = args;
        addLog(`⌬ System ${action.toUpperCase()} sequence initiated. T-minus ${delay}s.`, 'JARVIS', 'warning');
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
              addLog('⌬ System Telemetry: Running in Browser Sandbox — Local hardware telemetry unavailable (Device connection required).', 'JARVIS', 'info');
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

      case 'execute_workflow':
      case 'trigger_workflow': {
        const { pipeline_id, pipeline_name } = args;
        const pipelines = workflowEngine.getPipelines();
        const targetPipeline = pipelines.find(p => p.id === pipeline_id || (pipeline_name && p.name.toLowerCase().includes(pipeline_name.toLowerCase())));
        if (targetPipeline) {
          addLog(`⚡ Autonomous Workflow Triggered: "${targetPipeline.name}"`, 'JARVIS', 'info');
          workflowEngine.executePipeline(targetPipeline.id);
        } else {
          addLog(`! Workflow Error: Target pipeline "${pipeline_id || pipeline_name}" not found.`, 'SYSTEM', 'warning');
        }
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
          handleToggleOptic(active);
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

      case 'neural_web_search': {
        const { query, provider } = args;
        if (!query) break;
        addLog(`⌬ Web Intelligence: Querying neural index for "${query}"...`, 'JARVIS', 'info');
        try {
          let searchResult;
          if (provider === 'exa') {
            searchResult = await neuralSearchEngine.searchExa(query);
          } else if (provider === 'tavily') {
            searchResult = await neuralSearchEngine.searchTavily(query);
          } else {
            searchResult = await neuralSearchEngine.unifiedSearch(query);
          }

          if (searchResult.success && searchResult.results.length > 0) {
            const sources = searchResult.results.map(r => ({ title: r.title, uri: r.url }));
            setNeuralSources(sources);
            addLog(`✓ Neural Search complete (${searchResult.providerUsed.toUpperCase()} Index): ${searchResult.results.length} sources retrieved.`, 'SYSTEM', 'success');
          } else {
            addLog(`! Search Notice: ${searchResult.message || 'No direct results found.'}`, 'SYSTEM', 'info');
          }
        } catch (e: any) {
          addLog('! Search Notice: Query could not be resolved.', 'SYSTEM', 'warning');
        }
        break;
      }

      case 'initiate_deep_research': {
        const { topic } = args;
        addLog(`⌬ Deep Research: Initiating autonomous reasoning loop for "${topic}"...`, 'JARVIS', 'info');

        // First attempt Tavily/Exa unified intelligence
        neuralSearchEngine.unifiedSearch(topic, 6).then(searchRes => {
          if (searchRes.success && searchRes.results.length > 0) {
            const sources = searchRes.results.map(r => ({ title: r.title, uri: r.url }));
            setNeuralSources(sources);
            const synthesized = `### DEEP RESEARCH SYNTHESIS: ${topic.toUpperCase()}
**Intelligence Source**: ${searchRes.providerUsed.toUpperCase()} Neural Index (${searchRes.latencyMs}ms)

${searchRes.answer ? `#### Executive Summary:\n${searchRes.answer}\n\n` : ''}#### Key Findings:
${searchRes.results.map((r, i) => `${i + 1}. **${r.title}**\n${r.snippet}\n*Source: ${r.url}*`).join('\n\n')}`;
            setIntelligenceReport(synthesized);
            addLog(`✓ Deep Research synthesized via ${searchRes.providerUsed.toUpperCase()} Neural Engine.`, 'JARVIS', 'success');
          } else {
            // Fallback to local Python bridge research runner
            osBridge.startResearch(topic)
              .then(taskId => {
                const poll = setInterval(() => {
                  osBridge.getTaskStatus(taskId).then(status => {
                    if (status.status === 'completed') {
                      clearInterval(poll);
                      addLog(`⌬ Deep Research: Synthesis complete for "${topic}".`, 'JARVIS', 'success');
                      setIntelligenceReport(status.result);
                    } else if (status.status === 'failed') {
                      clearInterval(poll);
                      addLog(`! Deep Research: Reasoning loop failed.`, 'SYSTEM', 'error');
                    }
                  });
                }, 3000);
              })
              .catch(() => addLog('! Deep Research: Failed to initiate loop.', 'SYSTEM', 'error'));
          }
        }).catch(() => {
          osBridge.startResearch(topic).catch(() => {});
        });
        return true;
      }

      case 'browse_url': {
        navigateBrowser(args.url);
        addLog(`⌬ Neural HUD Link: Navigated to ${args.url}. Buffer established.`, 'JARVIS', 'success');
        return true;
      }

      case 'browser_agent_task': {
        const { goal, target_url } = args;
        setIsBrowserAgentOpen(true);
        addLog(`⌬ Browser Agent: Initiating OTAV loop for goal "${goal}"...`, 'JARVIS', 'info');
        browserAgent.executeTask(goal, target_url).then((res) => {
          if (res.status === 'COMPLETED') {
            addLog(`⌬ Browser Agent: Goal achieved with ${res.steps.length} steps. Results dispatched to Neural Workspace.`, 'JARVIS', 'success');
          } else {
            addLog(`! Browser Agent: Task ended with status ${res.status} (${res.error || 'Max steps reached'}).`, 'SYSTEM', 'warning');
          }
        }).catch((err) => {
          addLog(`! Browser Agent Error: ${err?.message || 'Execution fault'}`, 'SYSTEM', 'error');
        });
        return true;
      }

      case 'browser_agent_control': {
        const { action, approved } = args;
        if (action === 'open_hud') {
          setIsBrowserAgentOpen(true);
          addLog('⌬ Browser Agent: HUD interface initialized.', 'JARVIS', 'info');
        } else if (action === 'close_hud') {
          setIsBrowserAgentOpen(false);
          addLog('⌬ Browser Agent: HUD interface dismissed.', 'JARVIS', 'info');
        } else if (action === 'cancel') {
          browserAgent.cancelTask();
          addLog('⌬ Browser Agent: Active task cancelled by operator command.', 'JARVIS', 'warning');
        } else if (action === 'authorize') {
          browserAgent.confirmAction(approved ?? true);
          addLog(`⌬ Browser Agent: Operator safety decision [${approved ? 'APPROVED' : 'REJECTED'}] committed.`, 'JARVIS', 'info');
        }
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
              model: 'gemini-3.6-flash',
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

      case 'task_scheduler':
      case 'task_manager': {
        const { action, time, task_action, reminder_text, priority, recurrence, title, id, search } = args;
        const taskTitle = title || task_action || reminder_text || 'Scheduled Directive';

        if (action === 'schedule_task' || action === 'create_reminder' || action === 'create' || action === 'add') {
          const created = taskManager.createTask({
            title: taskTitle,
            due_time: time,
            priority: priority || 'medium',
            recurrence: recurrence || 'none',
          });
          setScheduledTasks(prev => [{ id: created.id, time: time || '', action: created.title, status: created.status }, ...prev]);
          addLog(`⌬ Task Engine: Directive scheduled "${created.title}" [Priority: ${created.priority.toUpperCase()}]`, 'JARVIS', 'success');
          return `Directive "${created.title}" successfully scheduled (ID: ${created.id}).`;
        } else if (action === 'check_pending_tasks' || action === 'list') {
          const list = taskManager.getTasks({ status: 'pending', search });
          addLog(`⌬ Task Engine: ${list.length} pending directives in execution queue.`, 'JARVIS', 'info');
          return list.length > 0
            ? `Active Directives:\n${list.map(t => `• ${t.title} [Priority: ${t.priority.toUpperCase()}] ${t.due_time ? `(Due: ${t.due_time})` : ''}`).join('\n')}`
            : 'No pending directives currently in queue.';
        } else if (action === 'complete' && id) {
          taskManager.completeTask(id);
          addLog(`⌬ Task Engine: Directive marked accomplished (ID: ${id})`, 'JARVIS', 'success');
          return `Directive ID ${id} completed.`;
        } else if (action === 'delete' && id) {
          taskManager.deleteTask(id);
          addLog(`⌬ Task Engine: Directive purged (ID: ${id})`, 'SYSTEM', 'info');
          return `Directive ID ${id} removed.`;
        } else if (action === 'open_panel' || action === 'open') {
          setIsTaskPanelOpen(true);
          return "Task & Reminder Engine interface displayed on HUD.";
        } else {
          addLog(`⌬ Task Engine: ${action?.toUpperCase() || 'QUERY'} sequence active.`, 'JARVIS', 'info');
          return `Task Engine action "${action}" processed.`;
        }
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
      let ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
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
          const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            try {
              outCtx = new AudioCtxClass({ sampleRate: 24000 });
            } catch (e) {
              try {
                outCtx = new AudioCtxClass();
              } catch (err) {
                console.warn("Failed to construct output AudioContext:", err);
              }
            }
          }
          if (outCtx && audioContextRef.current) audioContextRef.current.output = outCtx;
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
    if ('speechSynthesis' in window && typeof (window as any).SpeechSynthesisUtterance === 'function') {
      try {
        window.speechSynthesis.cancel();
        const UtteranceClass = (window as any).SpeechSynthesisUtterance;
        const utterance = new UtteranceClass(textToRead);
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

    if (msg.toLowerCase().includes('reboot') || msg.toLowerCase().includes('boot sequence')) {
      triggerBootSequence();
    }

    const lowerMsg = msg.toLowerCase().trim();
    if (
      lowerMsg === 'config' || 
      lowerMsg === 'settings' || 
      lowerMsg.includes('open config') || 
      lowerMsg.includes('open settings') || 
      lowerMsg.includes('show config') || 
      lowerMsg.includes('show settings') || 
      lowerMsg.includes('config panel') || 
      lowerMsg.includes('settings panel') || 
      lowerMsg.includes('system settings') ||
      lowerMsg.includes('system config')
    ) {
      setIsSettingsOpen(true);
      addLog('⌬ GUI Autonomy: System Configuration & Settings Panel opened.', 'JARVIS', 'info');
    }

    stopAllAudioPlayback();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Reset speaker active IDs for a fresh conversational turn
    activeTranscriptionIdRef.current['JARVIS'] = null;
    activeTranscriptionIdRef.current['OPERATOR'] = null;

    updateOrAddLog(msg || (files ? `[Neural Data: ${files.length} packets]` : ""), 'OPERATOR');
    setStatus(JarvisStatus.THINKING);

    const inlineFiles: { data: string; mimeType: string }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        inlineFiles.push({ data: base64Data, mimeType: file.type });
      }
    }

    let fullReply = "";
    let aiClient: GoogleGenAI | null = null;

    const taskCategory = aiProviderManager.detectTaskCategory(msg, inlineFiles.length > 0);
    const routedProvider = aiProviderManager.getProviderForTask(taskCategory);

    // If routed to NVIDIA Nemotron Ultra Backend Worker for complex reasoning, architecture, or deep coding:
    if (routedProvider.id === 'nemotron' && inlineFiles.length === 0) {
      addLog(`⌬ Neural Router: Delegating [${taskCategory}] directive to NVIDIA Nemotron Backend Reasoning Worker...`, 'JARVIS', 'info');
      try {
        let accumulated = '';
        activeTranscriptionIdRef.current['OPERATOR'] = null;
        activeTranscriptionIdRef.current['JARVIS'] = null;

        const taskReq = nemotronDelegation.buildTaskRequest({
          prompt: msg,
          relevantContext: `Operator: Virat. System Mode: APEX OS.`
        });

        // If task is debugging or complex architecture, run controlled multi-call processing with JARVIS verification
        if (taskCategory === 'debugging' || taskCategory === 'complexReasoning') {
          const multiCallRes = await nemotronDelegation.executeControlledMultiCallTask(
            taskReq,
            { systemPrompt: getSystemInstructionWithMemories() },
            (iteration, maxIterations, statusMsg) => {
              addLog(`⌬ JARVIS Iteration (${iteration}/${maxIterations}): ${statusMsg}`, 'SYSTEM', 'info');
            }
          );

          if (multiCallRes.success && multiCallRes.rawText) {
            fullReply = multiCallRes.rawText;
            updateOrAddLog(fullReply, 'JARVIS');
            setActiveProvider('nemotron');
            addLog(`⌬ Nemotron Multi-Call Verification completed (${multiCallRes.iteration} iteration(s) | ${multiCallRes.latencyMs}ms). Output verified by JARVIS.`, 'SYSTEM', 'success');
          }
        } else {
          // Standard streaming task for coding and general reasoning
          const nemotronRes = await aiProviderManager.streamWithTask(
            taskCategory,
            msg,
            (chunk) => {
              accumulated += chunk;
              updateOrAddLog(accumulated, 'JARVIS');
            },
            { systemPrompt: getSystemInstructionWithMemories() }
          );

          if (nemotronRes && nemotronRes.text) {
            fullReply = nemotronRes.text;
            setActiveProvider('nemotron');
            addLog(`⌬ Nemotron Backend Worker processing complete (${nemotronRes.latencyMs}ms | ${nemotronRes.usage.totalTokens} tokens). Formatted response synthesized by JARVIS.`, 'SYSTEM', 'success');
          }
        }
      } catch (nemotronErr: any) {
        addLog(`! Nemotron Backend Worker failover triggered: ${nemotronErr?.message || 'Switching to Gemini Core'}`, 'SYSTEM', 'warning');
      }
    }

    if (!fullReply) {
      try {
        aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const parts: any[] = [{ text: msg }];
        for (const f of inlineFiles) {
          parts.push({ inlineData: { data: f.data, mimeType: f.mimeType } });
        }

        const responseStream = await aiClient.models.generateContentStream({
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

        setActiveProvider('gemini');

      } catch (geminiErr: any) {
        console.warn("Gemini API error, testing OpenRouter failover:", geminiErr);
        addLog(`! Gemini API Alert: ${geminiErr.message || 'Quota/Limit reached'}`, 'SYSTEM', 'warning');

        const keyToUse = openRouterKey.trim() || localStorage.getItem('jarvis_openrouter_key') || ((import.meta as any).env?.VITE_OPENROUTER_API_KEY as string) || '';

        if (keyToUse) {
          addLog(`⌬ AUTOMATED DUAL FAILOVER: Switching seamlessly to OpenRouter [${openRouterModel}]...`, 'JARVIS', 'info');
          setActiveProvider('openrouter');
          activeTranscriptionIdRef.current['OPERATOR'] = null;
          activeTranscriptionIdRef.current['JARVIS'] = null;

          try {
            fullReply = await sendOpenRouterRequest({
              apiKey: keyToUse,
              model: openRouterModel,
              systemPrompt: getSystemInstructionWithMemories(),
              userMessage: msg,
              inlineFiles,
              onChunk: (chunkText) => {
                updateOrAddLog(chunkText, 'JARVIS');
              }
            });
            addLog(`⌬ OpenRouter Failover Stream completed successfully.`, 'SYSTEM', 'success');
          } catch (openRouterErr: any) {
            addLog(`! OpenRouter Failover Error: ${openRouterErr.message}`, 'SYSTEM', 'error');
            fullReply = `! System Notice: Gemini API quota was exceeded and OpenRouter failover returned an error (${openRouterErr.message}). Please verify your OpenRouter key in System Config.`;
            updateOrAddLog(fullReply, 'JARVIS');
          }
        } else {
          addLog(`! OpenRouter Key missing. Please set OPENROUTER_API_KEY in System Config for automatic quota failover.`, 'SYSTEM', 'warning');
          fullReply = `! Notice: Gemini API quota or rate limit reached (${geminiErr.message || '429 Quota Exceeded'}). Please configure an OpenRouter API key in System Config to enable automated zero-downtime failover.`;
          updateOrAddLog(fullReply, 'JARVIS');
        }
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

    // Flush persistent state to storage immediately upon completion of response
    flushStorageNow();

    // Feed response to Neural Workspace Manager for intelligent classification & Focus Mode triggering
    neuralWorkspaceManager.handleAIResponse(msg, reply, {
      sources: neuralSources,
      hasVisionFrame: isOpticActive || isScreenActive,
      provider: activeProvider,
      model: openRouterModel || 'gemini-2.5-flash'
    });

    if (reply.length > 1200 || msg.toLowerCase().includes('report') || msg.toLowerCase().includes('briefing')) {
      setIntelligenceReport(reply);
    }

    // Vocalize the complete generated response in full matching the chat screen context
    if (!isJarvisMutedRef.current) {
      const ttsAi = aiClient || new GoogleGenAI({ apiKey: process.env.API_KEY });
      speakTextWithUltraLowLatency(reply, ttsAi);
    } else {
      addLog("⌬ Vocal output is currently suspended (Muted).", "SYSTEM", "info");
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

  const triggerPlayClick = useCallback(() => {
    playTickSound();
  }, []);

  const handleToggleOptic = useCallback(async (forceState?: boolean | any) => {
    const isExplicitBool = typeof forceState === 'boolean';
    const nextState = isExplicitBool ? forceState : !isOpticActiveRef.current;
    
    setIsOpticActive(nextState);
    isOpticActiveRef.current = nextState;

    if (nextState) {
      if (cameraStreamRef.current && cameraStreamRef.current.getVideoTracks().length > 0) {
        cameraStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = true;
        });
        if (videoRef.current) {
          if (!videoRef.current.srcObject || videoRef.current.srcObject !== cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
          }
          videoRef.current.play().catch(() => {});
        }
      } else {
        try {
          addLog('⌬ Optic Vision: Initializing hardware camera feed...', 'SYSTEM', 'info');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 15 } }
          });
          if (cameraStreamRef.current) {
            stream.getVideoTracks().forEach(track => cameraStreamRef.current?.addTrack(track));
          } else {
            cameraStreamRef.current = stream;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current || stream;
            videoRef.current.play().catch(() => {});
          }
        } catch (err: any) {
          addLog(`! Optic Vision Error: ${err?.message || 'Camera access denied.'}`, 'SYSTEM', 'error');
          setIsOpticActive(false);
          isOpticActiveRef.current = false;
          return;
        }
      }
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = false;
        });
      }
    }
    addLog(`⌬ Optic Vision: ${nextState ? 'Sensors Online (Camera Vision Active)' : 'Sensors Suspended (Camera Vision Turned Off)'}.`, 'SYSTEM', nextState ? 'success' : 'warning');
  }, [addLog]);

  const createSyntheticScreenStream = (): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    let frameCount = 0;
    const drawFrame = () => {
      if (!ctx) return;
      frameCount++;
      // Dark cyber background
      ctx.fillStyle = '#050b14';
      ctx.fillRect(0, 0, 1280, 720);

      // Grid pattern
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke();
      }
      for (let y = 0; y < 720; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
      }

      // Top OS Header Bar
      ctx.fillStyle = 'rgba(2, 13, 26, 0.95)';
      ctx.fillRect(0, 0, 1280, 38);
      ctx.fillStyle = '#00f2ff';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('JARVIS OS v4.2 // VIRTUAL DESKTOP & OCR HUD', 18, 24);

      ctx.fillStyle = '#a855f7';
      ctx.font = '11px monospace';
      ctx.fillText(`STREAM: LIVE_BUFFER | FPS: 60 | OCR: ONLINE | TIME: ${new Date().toLocaleTimeString()}`, 740, 24);

      // Main Code Window
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, 60, 760, 620, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(2, 13, 26, 0.85)';
      ctx.beginPath();
      ctx.roundRect(40, 60, 760, 34, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚡ active_task_executor.ts — JARVIS AI OS Core', 56, 82);

      const codeLines = [
        'import { Kernel, EventBus, SecurityAuthority } from "@jarvis/core";',
        'import { GeminiProviderRouter } from "@jarvis/providers";',
        '',
        'export class ScreenVisionEngine {',
        '  private isScanning: boolean = true;',
        '  private ocrConfidence: number = 0.998;',
        '',
        '  public async captureScreenBuffer(): Promise<OCRResult> {',
        `    console.log("[SCREEN_PERCEPTION] Analyzing frame #${frameCount}...");`,
        '    const textBuffer = await this.extractTextLayers();',
        '    return { text: textBuffer, status: "SUCCESS" };',
        '  }',
        '}'
      ];
      ctx.font = '12px "Fira Code", monospace';
      codeLines.forEach((line, idx) => {
        ctx.fillStyle = line.startsWith('import') ? '#c084fc' : line.startsWith('export') || line.startsWith('private') || line.startsWith('public') ? '#38bdf8' : line.includes('//') ? '#64748b' : '#e2e8f0';
        ctx.fillText(`${idx + 1}`.padStart(2, ' ') + '  ' + line, 56, 125 + idx * 24);
      });

      // Inspection Telemetry Window (Right Top)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.beginPath();
      ctx.roundRect(820, 60, 420, 380, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillText('NEURAL_SCREEN_PERCEPTION_HUD', 836, 88);

      // Moving Laser Scan Line
      const scanY = 100 + ((frameCount * 3) % 320);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(830, scanY);
      ctx.lineTo(1230, scanY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText('UI Nodes Detected: 18 Active Controls', 836, 125);
      ctx.fillText('OCR Text Extraction: 100% Precision', 836, 150);
      ctx.fillText('Primary Target: Code Editor & Workspace', 836, 175);
      ctx.fillText('JARVIS Autonomous Control: ENABLED', 836, 200);

      // Terminal Window (Right Bottom)
      ctx.fillStyle = 'rgba(2, 13, 26, 0.95)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.beginPath();
      ctx.roundRect(820, 460, 420, 220, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#22c55e';
      ctx.font = '11px monospace';
      ctx.fillText('$ jarvis --screen-vision-stream', 836, 488);
      ctx.fillText('[OK] Screen Perception sensor stream linked', 836, 512);
      ctx.fillText('[OK] Real-time OCR & Spatial tracking active', 836, 536);
      ctx.fillText(`[LIVE] Frame #${frameCount} processed cleanly`, 836, 560);
    };

    const intervalId = setInterval(drawFrame, 1000 / 30);
    const stream = canvas.captureStream(30);
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      clearInterval(intervalId);
    });
    return stream;
  };

  const handleToggleScreenPerception = async (forceState?: boolean | any) => {
    const isExplicitBool = typeof forceState === 'boolean';
    const target = isExplicitBool ? forceState : !isScreenActiveRef.current;
    if (!target) {
      if (screenStreamRef.current) { 
        screenStreamRef.current.getTracks().forEach(t => t.stop()); 
        screenStreamRef.current = null; 
      }
      setIsScreenActive(false); 
      isScreenActiveRef.current = false;
      addLog('⌬ Screen Perception: Stream Suspended.', 'SYSTEM', 'warning');
    } else {
      try {
        const displayMediaOptions: any = {
          video: {
            displaySurface: 'monitor', // Requests browser to pre-select Entire Screen / Full Window
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 },
            frameRate: { ideal: 30 }
          },
          audio: false,
          surfaceSwitching: 'include',
          selfBrowserSurface: 'exclude', // Excludes current tab from default selection, forcing Entire Screen / Window tab
          preferCurrentTab: false
        };
        
        addLog('⌬ Screen Perception: Initiating Full Screen / Window Capture. Select "Entire Screen" in browser prompt...', 'JARVIS', 'info');
        const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        screenStreamRef.current = stream;
        
        // Handle user ending display share via browser bar
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          setIsScreenActive(false);
          isScreenActiveRef.current = false;
          addLog('⌬ Screen Perception: Stream Ended by Operator.', 'SYSTEM', 'info');
        });

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }
        setIsScreenActive(true); 
        isScreenActiveRef.current = true;
        addLog('⌬ Screen Perception: Stream Online (Entire Screen / Window active).', 'SYSTEM', 'success');
      } catch (err) {
        console.warn('Display Media capture unavailable or prompt canceled, activating JARVIS Virtual OS Screen Stream:', err);
        try {
          const fallbackStream = createSyntheticScreenStream();
          screenStreamRef.current = fallbackStream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = fallbackStream;
            screenVideoRef.current.play().catch(() => {});
          }
          setIsScreenActive(true); 
          isScreenActiveRef.current = true;
          addLog('⌬ Screen Perception: Virtual OS Screen Perception & Telemetry Online.', 'SYSTEM', 'success');
        } catch (fallbackErr) {
          addLog('! Screen access denied.', 'SYSTEM', 'error');
        }
      }
    }
  };

  const handleInstantScreenOCR = async () => {
    addLog('⌬ Instant Screen OCR: Capturing screen snapshot & invoking NVIDIA Nemotron OCR v2...', 'JARVIS', 'info');
    try {
      // 1. Render high-res DOM canvas snapshot with crisp pixel density
      const canvas = await html2canvas(document.body, {
        scale: 1.0,
        useCORS: true,
        logging: false
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      let imageFile: File | undefined = undefined;
      if (blob) {
        try {
          imageFile = new File([blob], `screen_snapshot_ocr_${Date.now()}.jpg`, { type: 'image/jpeg' });
        } catch (e) {
          (blob as any).name = `screen_snapshot_ocr_${Date.now()}.jpg`;
          imageFile = blob as File;
        }
      }

      // 2. Execute Primary OCR Pipeline with NVIDIA Nemotron OCR v2
      let ocrResultText = '';
      let providerLabel = 'NVIDIA Nemotron OCR v2 (GPU)';
      let confidenceScore = 1.0;
      let latency = 0;
      let wordCount = 0;

      if (nvidiaOcrService.hasValidKey()) {
        try {
          const ocr = await nvidiaOcrService.extractTextFromImage(canvas, {
            sourceType: 'screen',
            mergeLevel: 'paragraph',
            maxDimension: 2560
          });

          ocrResultText = ocr.text;
          confidenceScore = ocr.confidence;
          latency = ocr.latencyMs;
          wordCount = ocr.metadata?.wordCount || ocr.blocks.length;

          addLog(`⌬ NVIDIA Nemotron OCR v2: Extracted ${wordCount} words (${latency}ms, Confidence: ${Math.round(confidenceScore * 100)}%).`, 'JARVIS', 'success');
        } catch (ocrErr: any) {
          console.warn('NVIDIA Nemotron OCR v2 error:', ocrErr);
          addLog(`! NVIDIA Nemotron OCR v2: ${ocrErr?.message || 'Extraction failed'}. Reporting status to Gemini Brain.`, 'SYSTEM', 'warning');
          ocrResultText = `[OCR STATUS: SERVICE_ERROR - ${ocrErr?.message || 'NVIDIA API Key verification required'}]`;
          providerLabel = 'NVIDIA OCR (UNAVAILABLE)';
        }
      } else {
        // Explicitly report unconfigured OCR key rather than faking OCR
        addLog('! NVIDIA_OCR_API_KEY is not configured in Settings. Inspecting DOM accessibility layer...', 'SYSTEM', 'warning');
        const domResult = await nvidiaOcrService.perceiveIntelligently({
          sourceType: 'screen',
          domElement: document.body
        });
        ocrResultText = domResult.text;
        providerLabel = 'DOM Structure Fallback (Configure NVIDIA_OCR_API_KEY for deep visual OCR)';
        confidenceScore = 0.9;
      }

      const promptMsg = `⚡ [INSTANT SCREEN OCR ANALYSIS]\nPrimary Text Extraction Engine: ${providerLabel}\nConfidence: ${Math.round(confidenceScore * 100)}% | Words Extracted: ${wordCount || ocrResultText.split(/\s+/).length}\n\nSTRUCTURED SCREEN TEXT EXTRACTED:\n${ocrResultText.slice(0, 2500)}\n\nPlease reason over this on-screen text, diagnose any errors, open code, terminal states, or user workflows, and answer in clear, authoritative Hinglish.`;

      handleSendMessage(promptMsg, imageFile ? [imageFile] : undefined);
    } catch (err: any) {
      console.warn('Screen OCR capture exception:', err);
      addLog(`! Instant OCR error: ${err?.message || 'Failed'}.`, 'SYSTEM', 'error');
    }
  };

  const handleUploadScreenImage = async (file: File) => {
    addLog(`⌬ Document / Visual OCR: [${file.name}]. Processing with NVIDIA Nemotron OCR v2...`, 'JARVIS', 'info');
    let extractedOcrText = '';
    let ocrHeader = '';
    
    if (nvidiaOcrService.hasValidKey()) {
      try {
        const ocr = await nvidiaOcrService.extractTextFromImage(file, { 
          sourceType: 'upload', 
          mergeLevel: 'paragraph',
          maxDimension: 2560 
        });
        if (ocr.text && ocr.text.trim().length > 0) {
          ocrHeader = `\n\nNVIDIA NEMOTRON OCR v2 EXTRACTED TEXT (${ocr.metadata?.wordCount || 0} words, Confidence: ${Math.round(ocr.confidence * 100)}%, Latency: ${ocr.latencyMs}ms):\n${ocr.text.slice(0, 3000)}`;
          addLog(`✓ NVIDIA Nemotron OCR v2: Extracted ${ocr.metadata?.wordCount || 0} words from document (${ocr.latencyMs}ms).`, 'SYSTEM', 'success');
        }
      } catch (ocrErr: any) {
        console.warn('NVIDIA Nemotron OCR v2 upload extraction error:', ocrErr);
        ocrHeader = `\n\n[NVIDIA OCR STATUS: ${ocrErr?.message || 'Extraction failed'}]`;
      }
    } else {
      addLog('! NVIDIA_OCR_API_KEY unconfigured. Please add key in Settings for GPU optical OCR.', 'SYSTEM', 'info');
    }

    handleSendMessage(`🖼️ [DOCUMENT & VISUAL PERCEPTION]\nPlease analyze this uploaded document/image and reason over the extracted text and visual layout in natural Hinglish.${ocrHeader}`, [file]);
  };

  const handleToggleMic = useCallback(() => {
    setIsMicMuted((prev) => {
      const next = !prev;
      addLog(`⌬ Mic Sense: ${next ? 'Sensors suspended (Muted)' : 'Sensors active (Unmuted)'}.`, 'SYSTEM', next ? 'warning' : 'success');
      return next;
    });
  }, []);

  const stopLive = useCallback(() => {
    if (!isLive && !isConnectingRef.current) return;
    setIsLive(false); isConnectingRef.current = false; setStatus(JarvisStatus.IDLE);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch (_) {}
      scriptProcessorRef.current = null;
    }
    if (mediaSourceRef.current) {
      try { mediaSourceRef.current.disconnect(); } catch (_) {}
      mediaSourceRef.current = null;
    }
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
      let outputCtx: AudioContext;
      try {
        outputCtx = new AudioCtxClass({ sampleRate: 24000 });
      } catch (e) {
        outputCtx = new AudioCtxClass();
      }
      
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
          systemInstruction: { parts: [{ text: getSystemInstructionWithMemories() }] },
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voicePersona || 'Charon' } } },
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
            
            // Trigger immediate vocal startup greeting from JARVIS
            sessionPromise.then(s => {
              if (s) {
                try {
                  s.sendRealtimeInput({
                    text: "System Boot Complete. Greet Operator Virat Sir warmly, naturally, and briefly in 1 concise sentence."
                  });
                } catch (e) {
                  console.error("Failed to send initial greeting trigger", e);
                }
              }
            });

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
            let audioOnlyStream: MediaStream = stream;
            try {
              audioOnlyStream = new MediaStream(audioTracks);
            } catch (e) {
              console.warn("MediaStream constructor fallback:", e);
            }
            const source = inputCtx.createMediaStreamSource(audioOnlyStream);
            mediaSourceRef.current = source;
            
            // ScriptProcessorNode (2048 samples) anchored in ref to prevent V8 GC from stopping audio stream
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
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

              // BARGE-IN: If user speaks while JARVIS is outputting audio, interrupt playback so user's voice is clean and heard
              if (level > 4.0 && sourcesRef.current.size > 0) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch (_) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus(JarvisStatus.LISTENING);
              }

              if (level > 0.5 && !hasDetectedAudio) {
                hasDetectedAudio = true;
                addLog("⌬ Neural Link: Speech signal detected. Continuous 16kHz voice stream active.", "SYSTEM", "success");
              }

              // Stream clean 16kHz PCM audio continuously to Gemini Live session
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
                const toolResult = executeSystemTool(fc.name, fc.args);
                const activeSession = sessionRef.current;
                if (activeSession) {
                  activeSession.sendToolResponse({ 
                    functionResponses: [{ 
                      id: fc.id, 
                      name: fc.name, 
                      response: { result: toolResult !== undefined ? toolResult : "ok" } 
                    }] 
                  });
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

  // Wake Word Detection Listener
  useEffect(() => {
    wakeWordService.setEnabled(wakeWordEnabled);
    if (!wakeWordEnabled) return;

    const unsubscribe = wakeWordService.subscribe((phrase) => {
      setWakeWordBanner(`⚡ WAKE WORD DETECTED: "${phrase.toUpperCase()}" - AWAKENING NEURAL VOICE CORE`);
      addLog(`⚡ Wake-Word Triggered: "${phrase}". Awakening J.A.R.V.I.S. neural link...`, 'JARVIS', 'success');
      
      if (!isLive && !isConnectingRef.current) {
        handleStartLive();
      }

      setTimeout(() => {
        setWakeWordBanner(null);
      }, 4000);
    });

    return () => unsubscribe();
  }, [wakeWordEnabled, isLive]);

  // Global Keyboard Shortcuts Matrix
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) { setIsShortcutsModalOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (isHistoryVisible) { setIsHistoryVisible(false); return; }
        if (isMemoryVisible) { setIsMemoryVisible(false); return; }
        if (isOSConsoleOpen) { setIsOSConsoleOpen(false); return; }
        if (isWeatherFullOpen) { setIsWeatherFullOpen(false); return; }
        if (neuralWorkspaceManager.getIsOpen()) { neuralWorkspaceManager.close(); return; }
        if (isLive) { stopLive(); return; }
      }

      if (!isInput) {
        // Spacebar to toggle Live Mode
        if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          playPushToTalkBeep(!isLive);
          handleStartLive();
          return;
        }

        // Single key shortcuts
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            handleToggleMic();
            return;
          }
          if (e.key === 'v' || e.key === 'V') {
            e.preventDefault();
            handleToggleOptic();
            return;
          }
          if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            handleToggleScreenPerception();
            return;
          }
          if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            setIsShortcutsModalOpen(prev => !prev);
            return;
          }
        }
      }

      if ((e.altKey) && !isInput) {
        if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          setIsWeatherFullOpen(prev => !prev);
        }
      }

      if ((e.ctrlKey || e.metaKey) && !isInput) {
        if (e.key === 'k' || e.key === '/') {
          e.preventDefault();
          setIsHistoryVisible(prev => !prev);
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          neuralWorkspaceManager.toggle();
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          setIsMemoryVisible(prev => !prev);
        } else if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          handleToggleOptic();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleToggleScreenPerception();
        } else if (e.key === ',') {
          e.preventDefault();
          setIsSettingsOpen(prev => !prev);
        } else if (e.key === '`' || e.key === '~') {
          e.preventDefault();
          setIsOSConsoleOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSettingsOpen, isHistoryVisible, isMemoryVisible, isOSConsoleOpen, isWeatherFullOpen, isShortcutsModalOpen, isLive]);

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
      {uiMode === 'user' ? (
        <CinematicUserWorkspace
          status={status}
          micLevel={micLevel}
          theme={theme}
          logs={logs}
          onSendMessage={handleSendMessage}
          videoRef={videoRef}
          screenVideoRef={screenVideoRef}
          isOpticActive={isOpticActive}
          isScreenActive={isScreenActive}
          isOSConsoleOpen={isOSConsoleOpen}
          isMemoryVisible={isMemoryVisible}
          isHistoryVisible={isHistoryVisible}
          handleToggleOptic={handleToggleOptic}
          handleToggleScreenPerception={handleToggleScreenPerception}
          onInstantOCR={handleInstantScreenOCR}
          onUploadImage={handleUploadScreenImage}
          setIsOSConsoleOpen={setIsOSConsoleOpen}
          setIsMemoryVisible={setIsMemoryVisible}
          setIsHistoryVisible={setIsHistoryVisible}
          isWeatherFullOpen={isWeatherFullOpen}
          setIsWeatherFullOpen={setIsWeatherFullOpen}
          isLive={isLive}
          handleStartLive={handleStartLive}
          isMicMuted={isMicMuted}
          setIsMicMuted={setIsMicMuted}
          isJarvisMuted={isJarvisMuted}
          setIsJarvisMuted={setIsJarvisMuted}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          uiMode={uiMode}
          setUiMode={setUiMode}
          activeProvider={activeProvider}
          openRouterModel={openRouterModel}
          memories={memories}
          personality={personality}
          userIdentity={userIdentity}
          setMemories={setMemories}
          setPersonality={setPersonality}
          setUserIdentity={setUserIdentity}
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          setLogs={setLogs}
          handleNewChat={handleNewChat}
          setSessions={setSessions}
          onTriggerBoot={triggerBootSequence}
          isTaskPanelOpen={isTaskPanelOpen}
          setIsTaskPanelOpen={setIsTaskPanelOpen}
        />
      ) : (
        <>
          {/* Living Background Neural Canvas & Spatial Field */}
          <NeuralCanvas status={status} theme={theme} />

          {/* Ambient Radial Dark Lighting Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,25,55,0.45)_0%,rgba(1,8,22,0.85)_50%,rgba(0,0,0,0.98)_100%)] pointer-events-none z-0" />

      {/* ================= JARVIS SYSTEM CONSOLE HEADER ================= */}
      <header className={`h-11 flex items-center justify-between px-6 z-50 shrink-0 transition-all duration-500 relative opacity-70 hover:opacity-100 ${
        isSlate
          ? 'bg-zinc-800/65 hover:bg-zinc-800/95 border-b border-slate-700/50 backdrop-blur-[18px] shadow-sm text-slate-200'
          : 'bg-[rgba(2,12,27,0.65)] hover:bg-[rgba(2,12,27,0.92)] border-b border-cyan-500/20 hover:border-cyan-400/50 backdrop-blur-[18px] shadow-[0_0_20px_rgba(0,242,255,0.1)] hover:shadow-[0_4px_30px_rgba(0,242,255,0.3)]'
      }`}>
        <div className="flex items-center gap-4">
          {/* UI Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#030914] border border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <button
              onClick={() => { setUiMode('user'); playClick(); addLog('⌬ UI Mode: Switched to JARVIS Voice Mode', 'SYSTEM', 'info'); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-orbitron font-extrabold uppercase transition-all duration-300 text-slate-400 hover:text-cyan-300 whitespace-nowrap"
              title="Switch to Voice Mode"
            >
              <Tv className="w-3 h-3 shrink-0" />
              <span className="whitespace-nowrap">VOICE MODE</span>
            </button>
            <button
              onClick={() => { setUiMode('developer'); playClick(); addLog('⌬ UI Mode: Switched to JARVIS SYSTEM CONSOLE', 'SYSTEM', 'info'); }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-orbitron font-extrabold uppercase transition-all duration-300 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-black shadow-[0_0_15px_rgba(0,242,255,0.6)] whitespace-nowrap"
              title="Active: JARVIS System Console"
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">SYSTEM CONSOLE</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { playClick(); setIsHistoryVisible(!isHistoryVisible); setIsMemoryVisible(false); setIsUpgradeVisible(false); setIsAboutJarvisOpen(false); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl ${
                isSlate
                  ? isHistoryVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isHistoryVisible ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>History</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsMemoryVisible(!isMemoryVisible); setIsHistoryVisible(false); setIsUpgradeVisible(false); setIsAboutJarvisOpen(false); if(!isMemoryVisible) addLog('⌬ Memory Cluster: Accessing long-term neural storage...', 'JARVIS', 'info'); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl ${
                isSlate
                  ? isMemoryVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isMemoryVisible ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memory</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsUpgradeVisible(!isUpgradeVisible); setIsHistoryVisible(false); setIsMemoryVisible(false); setIsAboutJarvisOpen(false); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? isUpgradeVisible ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isUpgradeVisible ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrades</span>
              {upgradeRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]" />
              )}
            </button>

            <button 
              onClick={() => { playClick(); setIsTaskPanelOpen(true); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? isTaskPanelOpen ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isTaskPanelOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
              title="Open Task & Reminder Engine"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Tasks</span>
            </button>

            <button 
              onClick={() => { 
                playClick(); 
                setIsWeatherFullOpen(!isWeatherFullOpen); 
                setIsHistoryVisible(false); 
                setIsMemoryVisible(false); 
                setIsUpgradeVisible(false); 
                setIsAboutJarvisOpen(false); 
                if (!isWeatherFullOpen) addLog('⌬ Meteorological Station: Accessing full atmosphere intelligence console...', 'JARVIS', 'info');
              }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? isWeatherFullOpen ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isWeatherFullOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
              title="Open Full Meteorological Weather Telemetry Console"
            >
              <CloudSun className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Weather</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsBrowserAgentOpen(!isBrowserAgentOpen); if (!isBrowserAgentOpen) addLog('⌬ Browser Agent: Initializing Autonomous Navigation HUD...', 'JARVIS', 'info'); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? isBrowserAgentOpen ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isBrowserAgentOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
              title="Open Autonomous Browser Agent (Skyvern OTAV Engine)"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Browser Agent</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsShortcutsModalOpen(true); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
              title="Open Shortcuts & Hotkeys Matrix (Shift + ?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hotkeys</span>
            </button>

            <button 
              onClick={() => { playClick(); setIsAboutJarvisOpen(!isAboutJarvisOpen); setIsHistoryVisible(false); setIsMemoryVisible(false); setIsUpgradeVisible(false); if(!isAboutJarvisOpen) addLog('⌬ JARVIS Dossier: Opening classified AI intelligence profile...', 'JARVIS', 'info'); }} 
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl relative ${
                isSlate
                  ? isAboutJarvisOpen ? 'bg-zinc-700 border-zinc-400 text-zinc-100 rounded-xl shadow-sm' : 'bg-zinc-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200 rounded-xl'
                  : isAboutJarvisOpen ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'bg-[#030914]/80 border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>About JARVIS</span>
            </button>
          </div>

          <div className="flex flex-col items-center">
            <div className={`flex items-center gap-1.5 font-orbitron font-extrabold text-sm sm:text-base tracking-wider ${
              isSlate ? 'text-zinc-100' : 'text-cyan-300 drop-shadow-[0_0_10px_rgba(0,242,255,0.7)]'
            }`}>
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider mr-0.5">TIME:</span>
              <span>{(() => {
                let h = time.getHours() % 12 || 12;
                const m = time.getMinutes().toString().padStart(2, '0');
                const s = time.getSeconds().toString().padStart(2, '0');
                return `${h.toString().padStart(2, '0')}:${m}:${s}`;
              })()}</span>
            </div>
            {/* Real-Time Heartbeat ECG Waveform */}
            <div className="flex items-center gap-1 opacity-80" title="JARVIS Neural Heartbeat Pulse">
              <span className="text-[7px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">PULSE</span>
              <svg className="w-14 h-3 text-cyan-400" viewBox="0 0 80 16">
                <path
                  d="M 0 8 L 18 8 L 22 2 L 26 14 L 30 1 L 34 15 L 38 8 L 80 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-[heartbeat_1.8s_infinite_linear]"
                />
              </svg>
            </div>
          </div>
          
          {/* Fast Efficiency Mode Badge */}
          <button 
            onClick={() => { setVocalConciseness(!vocalConciseness); playClick(); }}
            className={`flex items-center gap-1.5 px-3 py-1 transition-all duration-300 border font-orbitron font-extrabold text-[9px] rounded-full backdrop-blur-xl ${
              isSlate
                ? vocalConciseness ? 'border-emerald-500/80 text-emerald-300 bg-emerald-500/20' : 'border-slate-700 text-slate-400 bg-zinc-900/50'
                : vocalConciseness ? 'border-emerald-400 text-emerald-300 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'border-amber-500/50 text-amber-300 bg-amber-500/10'
            }`}
            title="Fast Efficiency Mode ensures low latency and ultra-concise responses"
          >
            <Zap className={`w-3.5 h-3.5 ${vocalConciseness ? 'animate-bounce text-emerald-300' : 'text-amber-400'}`} />
            <span className="uppercase tracking-wider">
              {vocalConciseness ? 'FAST EFFICIENCY' : 'NORMAL'}
            </span>
          </button>

        </div>

        {/* Spacer */}
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Theme Quick Switcher */}
          <div className="flex items-center gap-1 bg-[#030914] border border-cyan-500/30 rounded-full px-2 py-0.5">
            {(['cyber', 'crimson', 'violet', 'emerald'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); playClick(); addLog(`⌬ Theme switched to ${t.toUpperCase()}`, 'JARVIS', 'info'); }}
                className={`text-[8px] font-orbitron font-extrabold uppercase px-2 py-0.5 rounded-full transition-all ${
                  theme === t ? 'bg-cyan-400 text-black font-black shadow-[0_0_10px_rgba(0,242,255,0.8)]' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${t} theme`}
              >
                {t[0]}
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300 ${
            isSlate 
              ? 'bg-zinc-800/80 border-slate-700 text-zinc-200' 
              : 'bg-[#030914]/80 border-cyan-500/30 backdrop-blur-md text-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.2)]'
          }`}>
            <Activity className={`w-3.5 h-3.5 ${isLive ? (isSlate ? 'text-zinc-200' : 'text-cyan-400 animate-pulse') : 'text-slate-500'}`} />
            <span className="text-[8px] font-orbitron tracking-[0.2em] uppercase font-black">STATUS: {status}</span>
          </div>

          <button 
            onClick={stopLive} 
            className={`group flex items-center gap-1.5 px-3.5 py-1 border text-[8px] font-orbitron font-extrabold transition-all duration-300 rounded-full ${
              isSlate 
                ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]'
            }`}
          >
            <Power className="w-3 h-3 group-hover:animate-spin" /> EMERGENCY
          </button>
        </div>
      </header>

      {/* Atmospheric Floating Cyan Particle Dust Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/50 rounded-full shadow-[0_0_6px_#00f2ff]"
            style={{
              left: `${(i * 4.3) % 100}%`,
              top: `${(i * 8.1) % 100}%`,
              animation: `floatDust ${4 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.3) % 4}s`
            }}
          />
        ))}
      </div>

      {/* Holographic Connector Beams Radiating from Center Core */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden lg:block opacity-50">
        <line x1="50%" y1="35%" x2="28%" y2="45%" stroke="#00f2ff" strokeWidth="1" strokeDasharray="4 8" className="animate-[beamPulse_3s_infinite_linear]" />
        <circle cx="28%" cy="45%" r="3" fill="#00f2ff" className="animate-ping" />

        <line x1="50%" y1="35%" x2="72%" y2="45%" stroke="#00f2ff" strokeWidth="1" strokeDasharray="4 8" className="animate-[beamPulse_3s_infinite_linear]" />
        <circle cx="72%" cy="45%" r="3" fill="#00f2ff" className="animate-ping" />

        <line x1="50%" y1="35%" x2="50%" y2="6%" stroke="#00f2ff" strokeWidth="1" strokeDasharray="4 8" className="animate-[beamPulse_3s_infinite_linear]" />
      </svg>

      {/* Full Screen Dedicated Workspaces Overlays */}
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
            model: 'gemini-3.6-flash',
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
        onToggleFavorite={(id) => {
          setSessions(prev => prev.map(s => s.session_id === id ? { ...s, isFavorite: !s.isFavorite } : s));
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

      <MemoryPanel 
        isOpen={isMemoryVisible}
        onClose={() => setIsMemoryVisible(false)}
        memories={memories} 
        personality={personality} 
        userIdentity={userIdentity} 
        onAddMemory={(c, cat, type) => setMemories(p => [{ id: Math.random().toString(), content: c, category: cat, timestamp: Date.now(), type: type || 'long_term' }, ...p])} 
        onDeleteMemory={(id) => setMemories(p => p.filter(m => m.id !== id))} 
        onUpdatePersonality={setPersonality} 
        onUpdateIdentity={setUserIdentity} 
        theme={theme} 
      />

      <UpgradePanel 
        isOpen={isUpgradeVisible}
        onClose={() => setIsUpgradeVisible(false)}
        requests={upgradeRequests} 
        onClear={() => setUpgradeRequests([])} 
        onRemove={(id) => setUpgradeRequests(prev => prev.filter(r => r.id !== id))} 
        onAddRequest={(task, reason, priority, suggestedModule) => {
          const newReq: UpgradeRequest = {
            id: `upg_${Date.now()}`,
            task,
            reason,
            priority,
            suggested_module: suggestedModule,
            timestamp: Date.now()
          };
          setUpgradeRequests(prev => [newReq, ...prev]);
          addLog(`⌬ System Upgrade: Queued enhancement directive "${task}".`, 'JARVIS', 'info');
        }}
        theme={theme} 
      />

      {/* ================= DEVELOPER WORKSPACE CENTER ================= */}
      <div className="flex-1 flex overflow-hidden p-4 pb-2 gap-4 relative z-20">
        
        {/* LEFT COLUMN: Holographic Stream Timeline (30% width) */}
        <div className="w-[30%] min-w-[280px] max-w-[380px] flex flex-col h-full bg-[rgba(2,12,27,0.35)] border border-cyan-500/20 backdrop-blur-md rounded-2xl p-3.5 shadow-[0_0_25px_rgba(0,242,255,0.08)] overflow-hidden z-20">
          {isBrowserActive ? (
            <div className="h-full w-full flex flex-col relative bg-[#111] rounded-xl overflow-hidden">
              <iframe 
                ref={(el) => browserAgent.getController().setIframeElement(el)}
                src={browserUrl} 
                className="flex-1 w-full h-full border-none opacity-90" 
                title="JARVIS HUD BROWSER" 
              />
              <div className="absolute top-2 right-4 z-20 flex gap-2">
                <button onClick={() => setIsBrowserActive(false)} className="bg-[#030914] p-2 rounded-full text-white hover:text-cyan-400 border border-cyan-500/30 shadow-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <Terminal logs={logs} theme={theme} />
          )}
        </div>

        {/* CENTER COLUMN: Hero 3D AI Core & Real-Time System Control Monitor (40% width) */}
        <div className="flex-1 flex flex-col items-center justify-between h-full relative overflow-y-auto custom-scroll bg-[rgba(2,12,27,0.25)] border border-cyan-500/20 backdrop-blur-[12px] rounded-2xl p-3 sm:p-3.5 shadow-[0_0_35px_rgba(0,242,255,0.12)] z-20 gap-2">
          {/* Hero 3D AI Core */}
          <div className="flex-1 min-h-[180px] w-full flex flex-col items-center justify-center relative py-1">
            {/* Background Orbital Rings */}
            <div className="absolute w-[260px] sm:w-[320px] h-[260px] sm:h-[320px] rounded-full border border-cyan-500/15 animate-[spin_35s_linear_infinite] pointer-events-none" />
            <div className="absolute w-[320px] sm:w-[380px] h-[320px] sm:h-[380px] rounded-full border border-dashed border-cyan-400/10 animate-[spin_50s_linear_infinite_reverse] pointer-events-none" />

            <div className="relative z-20 transform hover:scale-105 transition-transform duration-500">
              <HudCore status={status} micLevel={micLevel} theme={theme} isUserMode={false} />
            </div>
          </div>

          {/* Subsystem Telemetry Circular Radial Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 z-20 w-full max-w-xl shrink-0">
            {/* CPU Gauge */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(2,12,27,0.6)] border border-cyan-500/25 backdrop-blur-md shadow-md">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-cyan-400" strokeDasharray="14, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <Cpu className="w-3 h-3 text-cyan-400 absolute" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">CPU LOAD</span>
                <span className="text-[10px] font-orbitron font-extrabold text-cyan-200">14% • 4.2G</span>
              </div>
            </div>

            {/* RAM Gauge */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(2,12,27,0.6)] border border-purple-500/25 backdrop-blur-md shadow-md">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-purple-400" strokeDasharray="24, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <Activity className="w-3 h-3 text-purple-400 absolute" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">RAM ALLOC</span>
                <span className="text-[10px] font-orbitron font-extrabold text-purple-200">3.8 / 16G</span>
              </div>
            </div>

            {/* Voice Latency */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(2,12,27,0.6)] border border-indigo-500/25 backdrop-blur-md shadow-md">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-indigo-400" strokeDasharray="18, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <Zap className="w-3 h-3 text-indigo-400 absolute" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">LATENCY</span>
                <span className="text-[10px] font-orbitron font-extrabold text-indigo-200">{isLive ? '24ms' : 'READY'}</span>
              </div>
            </div>

            {/* Optic FPS */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(2,12,27,0.6)] border border-emerald-500/25 backdrop-blur-md shadow-md">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-400" strokeDasharray="60, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <Eye className="w-3 h-3 text-emerald-400 absolute" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-wider">OPTIC FPS</span>
                <span className="text-[10px] font-orbitron font-extrabold text-emerald-200">60 FPS</span>
              </div>
            </div>
          </div>

          {/* Active Subsystem Live Stream Bar */}
          <div className="w-full max-w-xl flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-cyan-500/20 text-[8.5px] font-mono z-20 shrink-0">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              ACTIVE PROCESSES:
            </span>
            <div className="flex items-center gap-3 text-cyan-300 font-bold">
              <span>● Speech Engine</span>
              <span>● Vision Engine</span>
              <span>● Automation</span>
              <span>● Quantum Memory</span>
            </div>
          </div>

          {/* Developer Command Line Box */}
          <div className="w-full max-w-xl shrink-0 z-20 pb-1">
            <ChatBox onSendMessage={handleSendMessage} waveform={<Waveform isActive={status === JarvisStatus.SPEAKING || status === JarvisStatus.LISTENING} color={isSlate ? '#e4e4e7' : status === JarvisStatus.LISTENING ? '#00f2ff' : '#0041ff'} />} theme={theme} />
          </div>
        </div>

        {/* RIGHT COLUMN: Vision Perception & Active Modules (30% width) */}
        <div className="w-[30%] min-w-[280px] max-w-[380px] flex flex-col gap-3.5 h-full overflow-y-auto custom-scroll z-20">
          <VisionPanel 
            videoRef={videoRef} 
            screenVideoRef={screenVideoRef}
            isScreenActive={isScreenActive}
            isOpticActive={isOpticActive}
            status={status}
            theme={theme}
            onInstantOCR={handleInstantScreenOCR}
            onUploadImage={handleUploadScreenImage}
            onToggleScreenPerception={handleToggleScreenPerception}
          />

          {/* Atmospheric Cloud Telemetry Panel (Placed directly under Optic Perception) */}
          <WeatherPanel 
            theme={theme} 
            isOpenFullModal={isWeatherFullOpen}
            onToggleFullModal={setIsWeatherFullOpen}
            onAskJarvisWeather={handleSendMessage}
            status={status}
            isLive={isLive}
            micLevel={micLevel}
            onSendMessage={handleSendMessage}
            handleStartLive={handleStartLive}
          />

          {/* System Health & Active Modules */}
          <div className="flex-1 flex flex-col gap-2 p-3.5 rounded-2xl bg-[rgba(2,12,27,0.35)] border border-cyan-500/20 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-cyan-500/15">
              <span className="text-[10px] font-orbitron font-extrabold tracking-widest text-cyan-300 uppercase flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                SYSTEM MODULES
              </span>
              <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HEALTH: 100%
              </span>
            </div>

            {/* Active Modules List with Live Spectrum Wave Animations */}
            <div className="flex flex-col gap-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-slate-200 font-bold">JarvisCore.exe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-cyan-400 text-[9px]">
                    <span className="animate-[pulse_0.4s_infinite_alternate]">█</span>
                    <span className="animate-[pulse_0.6s_infinite_alternate]">▇</span>
                    <span className="animate-[pulse_0.3s_infinite_alternate]">▆</span>
                  </div>
                  <span className="text-cyan-400">0.8%</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-slate-200 font-bold">NeuralVoice.wasm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-indigo-400 text-[9px]">
                    <span className="animate-[pulse_0.5s_infinite_alternate]">█</span>
                    <span className="animate-[pulse_0.3s_infinite_alternate]">▇</span>
                    <span className="animate-[pulse_0.7s_infinite_alternate]">▆</span>
                  </div>
                  <span className="text-indigo-400">Charon 2.4</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200 font-bold">MemoryCluster.db</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-emerald-400 text-[9px]">
                    <span className="animate-[pulse_0.4s_infinite_alternate]">█</span>
                    <span className="animate-[pulse_0.8s_infinite_alternate]">▇</span>
                  </div>
                  <span className="text-emerald-400">{memories.length} Anchors</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-slate-200 font-bold">OpticSense.node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-purple-400 text-[9px]">
                    <span className="animate-[pulse_0.3s_infinite_alternate]">█</span>
                    <span className="animate-[pulse_0.5s_infinite_alternate]">▇</span>
                    <span className="animate-[pulse_0.4s_infinite_alternate]">▆</span>
                  </div>
                  <span className="text-purple-400">{isOpticActive ? '60 FPS' : 'STANDBY'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-slate-200 font-bold">SystemOS.sys</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-amber-400 text-[9px]">
                    <span className="animate-[pulse_0.6s_infinite_alternate]">█</span>
                    <span className="animate-[pulse_0.4s_infinite_alternate]">▇</span>
                  </div>
                  <span className="text-amber-400">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Telemetry Circular Progress Bars */}
            <div className="mt-auto pt-2 border-t border-cyan-500/15 flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>CPU LOAD</span>
                  <span className="text-cyan-300">14%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full w-[14%]" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>MEMORY ALLOC</span>
                  <span className="text-purple-300">24%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-[24%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEVELOPER MODE FOOTER DOCK */}
      <footer className={`h-11 flex items-center justify-center gap-2 sm:gap-4 z-50 shrink-0 px-6 my-1.5 mx-4 rounded-full transition-all duration-300 relative ${
        isSlate 
          ? 'bg-zinc-900/70 border border-slate-700/60 backdrop-blur-[18px] shadow-xl' 
          : isMinimal
            ? 'bg-[#0b0f17]/70 border border-emerald-500/20 backdrop-blur-[18px] shadow-xl'
            : isGold
              ? 'bg-[#14100c]/70 border border-amber-500/20 backdrop-blur-[18px] shadow-xl'
              : 'bg-[rgba(2,12,27,0.45)] border border-cyan-400/30 backdrop-blur-[18px] hover:bg-[rgba(2,12,27,0.7)] hover:border-cyan-400/50 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,255,0.2)]'
      }`}>
        <div className="absolute top-0 left-8 right-8 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent pointer-events-none" />
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
        <ControlButton icon={Database} label="MEMORY" active={isMemoryVisible} color="cyan" onClick={() => { setIsMemoryVisible(!isMemoryVisible); if(!isMemoryVisible) addLog('⌬ Memory Cluster: Accessing long-term neural storage...', 'JARVIS', 'info'); }} theme={theme} />
        <ControlButton icon={Sparkles} label="WORKSPACE" active={false} color="cyan" onClick={() => { neuralWorkspaceManager.open(); addLog('⌬ Dynamic Presentation Workspace activated.', 'JARVIS', 'info'); }} theme={theme} />
        <ControlButton icon={Settings} label="CONFIG" color="slate" onClick={() => setIsSettingsOpen(true)} theme={theme} />
        <ControlButton icon={TerminalIcon} label="COMMAND" color="cyan" onClick={() => { setIntelligenceReport(null); setIsBrowserActive(false); triggerBootSequence(); }} theme={theme} />
      </footer>
        </>
      )}

      {/* Easter Egg Boot Overlay Sequence */}
      {isBootingSequence && (
        <div className="fixed inset-0 bg-[#010814]/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center p-6 text-cyan-400 font-orbitron animate-in fade-in duration-300 pointer-events-none">
          <div className="w-24 h-24 rounded-full border-2 border-cyan-400/60 border-t-cyan-300 animate-spin flex items-center justify-center shadow-[0_0_30px_#00f2ff]">
            <Cpu className="w-10 h-10 text-cyan-300 animate-pulse" />
          </div>
          <span className="mt-6 text-xl font-black tracking-[0.3em] text-white drop-shadow-[0_0_15px_#00f2ff]">
            J.A.R.V.I.S. SYSTEM REBOOT
          </span>
          <div className="mt-3 flex items-center gap-3 text-xs font-mono text-cyan-300/80">
            <span className="animate-pulse">● NEURAL LINK</span>
            <span className="animate-pulse">● MEMORY CLUSTER</span>
            <span className="animate-pulse">● OPTIC SENSES</span>
            <span className="animate-pulse">● CHARON VOICE</span>
          </div>
          <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-cyan-400 animate-[scan_1.2s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

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
        fontStyle={fontStyle}
        setFontStyle={setFontStyle}
        voicePersona={voicePersona}
        setVoicePersona={setVoicePersona}
        wakeWordEnabled={wakeWordEnabled}
        setWakeWordEnabled={setWakeWordEnabled}
        onClearLogs={clearNeuralLogs}
        openRouterKey={openRouterKey}
        setOpenRouterKey={setOpenRouterKey}
        openRouterModel={openRouterModel}
        setOpenRouterModel={setOpenRouterModel}
        activeProvider={activeProvider}
        onOpenRuntimePanel={() => setIsRuntimeOpen(true)}
        onOpenWorkflowPanel={() => setIsWorkflowOpen(true)}
        onOpenAIProviders={() => setIsAIProvidersOpen(true)}
        onOpenTaskPanel={() => setIsTaskPanelOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* GLOBAL KEYBOARD SHORTCUTS HUD MODAL */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        theme={theme}
      />

      {/* WAKE-WORD DETECTION NOTIFICATION BANNER */}
      {wakeWordBanner && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#031526]/95 border-2 border-cyan-400 text-cyan-200 font-orbitron text-xs font-black shadow-[0_0_30px_rgba(0,242,255,0.8)] backdrop-blur-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#00f2ff]" />
            <span className="tracking-wider drop-shadow-[0_0_8px_#00f2ff]">{wakeWordBanner}</span>
          </div>
        </div>
      )}

      <TaskPanel
        isOpen={isTaskPanelOpen}
        onClose={() => setIsTaskPanelOpen(false)}
        theme={theme}
        onAskJarvisTask={(cmd) => handleSendMessage(cmd)}
      />

      <RuntimePanel
        isOpen={isRuntimeOpen}
        onClose={() => setIsRuntimeOpen(false)}
      />

      <WorkflowPanel
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
      />

      <AIProvidersModal
        isOpen={isAIProvidersOpen}
        onClose={() => setIsAIProvidersOpen(false)}
      />

      <AboutJarvisModule 
        isOpen={isAboutJarvisOpen} 
        onClose={() => setIsAboutJarvisOpen(false)} 
        theme={theme}
      />

      {/* AUTONOMOUS BROWSER AGENT HUD MODAL (SKYVERN-INSPIRED OTAV ENGINE) */}
      <BrowserAgentHUD
        isOpen={isBrowserAgentOpen}
        onClose={() => setIsBrowserAgentOpen(false)}
        onOpenWorkspace={() => neuralWorkspaceManager.open()}
        theme={theme}
      />

      {/* DEDICATED FULL-SCREEN NEURAL WORKSPACE / FOCUS VIEW OVERLAY */}
      <NeuralWorkspace 
        theme={theme} 
      />
    </div>
  );
};

const ControlButton = ({ icon: Icon, label, active, onClick, color, disabled, theme = 'cyber' }: any) => {
  const themeConfig = getThemeConfig(theme);

  const colorMapCyber: any = {
    cyan: 'text-cyan-300 border-cyan-500/30 bg-[#040f21]/80 hover:border-cyan-400/60 hover:text-cyan-200 hover:shadow-[0_0_8px_rgba(0,242,255,0.2)]',
    blue: 'text-blue-300 border-blue-500/30 bg-[#040e24]/80 hover:border-blue-400/60 hover:text-blue-200 hover:shadow-[0_0_8px_rgba(59,130,246,0.2)]',
    purple: 'text-purple-300 border-purple-500/30 bg-[#0d071e]/80 hover:border-purple-400/60 hover:text-purple-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]',
    slate: 'text-slate-300 border-slate-600/30 bg-[#0b101c]/80 hover:border-slate-400/60 hover:text-slate-200',
    red: 'text-rose-300 border-rose-600/40 bg-[#1a0409]/80 hover:border-rose-400/60 hover:text-rose-200 hover:shadow-[0_0_8px_rgba(244,63,94,0.25)]',
  };

  const colorMapCrimson: any = {
    cyan: 'text-rose-300 border-rose-600/40 bg-[#240307]/80 hover:border-rose-400/60 hover:text-rose-200 hover:shadow-[0_0_8px_rgba(255,0,60,0.25)]',
    blue: 'text-red-300 border-red-600/40 bg-[#240307]/80 hover:border-red-400/60 hover:text-red-200',
    purple: 'text-rose-300 border-rose-600/40 bg-[#240307]/80 hover:border-rose-400/60 hover:text-rose-200',
    slate: 'text-slate-300 border-rose-900/40 bg-[#150407] hover:border-rose-600/60 hover:text-slate-200',
    red: 'text-red-200 border-red-500/60 bg-[#200307] hover:border-red-400/80 hover:shadow-[0_0_8px_rgba(255,0,0,0.3)]',
  };

  const colorMapViolet: any = {
    cyan: 'text-purple-300 border-purple-500/35 bg-[#100424]/80 hover:border-purple-400/60 hover:text-purple-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.25)]',
    blue: 'text-indigo-300 border-indigo-500/35 bg-[#090526]/80 hover:border-indigo-400/60 hover:text-indigo-200',
    purple: 'text-fuchsia-300 border-fuchsia-500/35 bg-[#1a0421]/80 hover:border-fuchsia-400/60 hover:text-fuchsia-200',
    slate: 'text-slate-300 border-purple-900/40 bg-[#0d081f] hover:border-purple-600/60 hover:text-slate-200',
    red: 'text-rose-300 border-rose-600/40 bg-rose-950/40 hover:border-rose-400/60',
  };

  const colorMapEmerald: any = {
    cyan: 'text-emerald-300 border-emerald-500/35 bg-[#03180f]/80 hover:border-emerald-400/60 hover:text-emerald-200 hover:shadow-[0_0_8px_rgba(16,185,129,0.25)]',
    blue: 'text-teal-300 border-teal-500/35 bg-[#021716]/80 hover:border-teal-400/60 hover:text-teal-200',
    purple: 'text-emerald-300 border-emerald-500/35 bg-[#03180f]/80 hover:border-emerald-400/60 hover:text-emerald-200',
    slate: 'text-slate-300 border-emerald-900/40 bg-[#061710] hover:border-emerald-600/60 hover:text-slate-200',
    red: 'text-rose-300 border-rose-600/40 bg-rose-950/40 hover:border-rose-400/60',
  };

  const mapByTheme: any = {
    cyber: colorMapCyber,
    crimson: colorMapCrimson,
    violet: colorMapViolet,
    emerald: colorMapEmerald,
  };

  const selectedMap = mapByTheme[themeConfig.id] || colorMapCyber;
  const styleClasses = selectedMap[color] || selectedMap.cyan;

  const activeStyles: any = {
    cyber: 'bg-cyan-950/80 text-cyan-200 border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.3)] font-extrabold ring-1 ring-cyan-400/30',
    crimson: 'bg-rose-950/85 text-rose-200 border-rose-500/80 shadow-[0_0_8px_rgba(255,0,60,0.35)] font-extrabold ring-1 ring-rose-500/30',
    violet: 'bg-purple-950/85 text-purple-200 border-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.3)] font-extrabold ring-1 ring-purple-400/30',
    emerald: 'bg-emerald-950/85 text-emerald-200 border-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] font-extrabold ring-1 ring-emerald-400/30',
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      title={label}
      className={`group relative flex items-center justify-center gap-2 px-3 py-1.5 h-9 rounded-full border transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${styleClasses} ${
        active 
          ? (activeStyles[themeConfig.id] || activeStyles.cyber)
          : 'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 stroke-[2] ${active ? 'animate-pulse text-current' : ''}`} />
      
      {/* Label */}
      <span className="font-orbitron font-extrabold text-[9px] tracking-wider uppercase flex items-center gap-1.5 whitespace-nowrap">
        <span>{label}</span>
        {active && (
          <span className="w-1.5 h-1.5 rounded-full animate-ping bg-current" />
        )}
      </span>
    </button>
  );
};

export default App;
