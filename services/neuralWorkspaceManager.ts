import { PresentationPayload, PresentationMode } from '../types/workspace';
import { ContentClassifier } from './contentClassifier';
import { playWhooshSound, playDigitalPingSound } from './soundEffects';
import { workspaceHistoryService } from './workspaceHistoryService';

export class NeuralWorkspaceManager {
  private static instance: NeuralWorkspaceManager;
  private isOpen: boolean = false;
  private activePayload: PresentationPayload | null = null;
  private currentMode: PresentationMode = 'OVERVIEW';
  private listeners: Array<() => void> = [];

  private constructor() {
    this.seedDefaultPresentation();
  }

  public static getInstance(): NeuralWorkspaceManager {
    if (!NeuralWorkspaceManager.instance) {
      NeuralWorkspaceManager.instance = new NeuralWorkspaceManager();
    }
    return NeuralWorkspaceManager.instance;
  }

  private seedDefaultPresentation() {
    const classification = ContentClassifier.classify(
      'Explain how JARVIS works and show system architecture',
      `# JARVIS Cognitive Operating System Architecture
JARVIS is an autonomous human-AI symbiotic operating system engineered for real-time natural language interaction, live screen and audio perception, and deep multi-modal reasoning.

## Core Architectural Subsystems
- **Sensory Perception Layer:** Continuous 48kHz PCM audio capture via Charon DSP and 60 FPS spatial screen OCR extraction.
- **Kernel Governance:** Central dispatch orchestrating state transitions, event bus routing, and security policies.
- **Neural Router:** Evaluates query complexity and routes lightweight requests to Gemini 2.5 Flash and deep multi-step logic to NVIDIA Nemotron 4 340B.
- **OS Control & Tool Execution:** Executes native desktop shell workflows, memory graph persistence, and dynamic presentation rendering.

## Dynamic Presentation Surface
When information is complex, structured, or code-heavy, JARVIS projects the data onto this dedicated presentation surface across Overview, Paragraph, Structure, Code, and Data views.`
    );
    this.activePayload = classification.payload;
    this.currentMode = classification.payload.primaryMode;
    // Archive initial seed entry if history is empty
    if (workspaceHistoryService.getHistory().length === 0) {
      workspaceHistoryService.addEntry(classification.payload);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Getters ---
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getActivePayload(): PresentationPayload | null {
    return this.activePayload;
  }

  public getCurrentMode(): PresentationMode {
    return this.currentMode;
  }

  // Backward compatibility alias for any existing caller
  public getActiveWorkspace(): PresentationPayload | null {
    return this.activePayload;
  }

  public getWorkspaces(): PresentationPayload[] {
    return this.activePayload ? [this.activePayload] : [];
  }

  // --- Actions ---
  public open(payload?: PresentationPayload, initialMode?: PresentationMode, skipSaveToHistory: boolean = false) {
    playWhooshSound();
    if (payload) {
      this.activePayload = payload;
      this.currentMode = initialMode || payload.primaryMode;
      if (!skipSaveToHistory) {
        workspaceHistoryService.addEntry(payload);
      }
    } else if (!this.activePayload) {
      this.seedDefaultPresentation();
    }
    if (initialMode) {
      this.currentMode = initialMode;
    }
    this.isOpen = true;
    this.notify();
  }

  /**
   * Restore a historical Workspace entry with its exact original payload and mode.
   */
  public restoreFromHistory(id: string): boolean {
    const entry = workspaceHistoryService.getEntryById(id);
    if (!entry) return false;
    this.open(entry.payload, entry.presentationType, true);
    return true;
  }

  public close() {
    playWhooshSound();
    this.isOpen = false;
    this.notify();
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public setMode(mode: PresentationMode) {
    playDigitalPingSound();
    this.currentMode = mode;
    this.notify();
  }

  // Alias for backward compatibility
  public switchOrCreateType(mode: any) {
    const validModes: PresentationMode[] = ['OVERVIEW', 'PARAGRAPH', 'STRUCTURE', 'CODE', 'DATA'];
    const target = validModes.includes(mode) ? mode : 'OVERVIEW';
    this.setMode(target);
  }

  public switchWorkspace(_id: string) {
    // Single active presentation
    this.notify();
  }

  public deleteWorkspace(_id: string) {
    this.close();
  }

  public togglePin(_id: string) {
    this.notify();
  }

  /**
   * Automatically classifies completed AI response and launches the presentation surface
   * if response is complex, large, structured, code-rich, or explicitly requested.
   */
  public handleAIResponse(
    prompt: string,
    responseText: string,
    options?: {
      sources?: Array<{ title: string; uri: string; snippet?: string }>;
      hasVisionFrame?: boolean;
      provider?: string;
      model?: string;
    }
  ): boolean {
    const result = ContentClassifier.classify(prompt, responseText, options);

    // Keep payload updated for manual user inspection via WORKSPACE button, but do not automatically pop up a modal card over the HUD core
    this.activePayload = result.payload;
    this.currentMode = result.payload.primaryMode;

    const isExplicitUserOpen = options?.hasVisionFrame === false && (
      prompt.toLowerCase().includes('open workspace') ||
      prompt.toLowerCase().includes('workspace mein dikhao') ||
      prompt.toLowerCase().includes('workspace me dikhao') ||
      prompt.toLowerCase().includes('show in workspace') ||
      prompt.toLowerCase().includes('open in workspace')
    );

    if (isExplicitUserOpen) {
      this.isOpen = true;
      workspaceHistoryService.addEntry(result.payload);
      this.notify();
      return true;
    }

    return false;
  }
}

export const neuralWorkspaceManager = NeuralWorkspaceManager.getInstance();

