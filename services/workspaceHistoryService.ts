import { WorkspaceHistoryEntry, PresentationPayload, PresentationMode } from '../types/workspace';

const STORAGE_KEY = 'jarvis_workspace_history_v1';
const MAX_HISTORY_ITEMS = 100;

export class WorkspaceHistoryService {
  private static instance: WorkspaceHistoryService;
  private history: WorkspaceHistoryEntry[] = [];
  private listeners: Array<() => void> = [];

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): WorkspaceHistoryService {
    if (!WorkspaceHistoryService.instance) {
      WorkspaceHistoryService.instance = new WorkspaceHistoryService();
    }
    return WorkspaceHistoryService.instance;
  }

  private loadFromStorage() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.history = parsed;
        }
      }
    } catch (e) {
      console.warn('[WorkspaceHistory] Failed to parse stored history:', e);
      this.history = [];
    }
  }

  private saveToStorage() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('[WorkspaceHistory] Failed to write history to localStorage:', e);
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

  /**
   * Automatically archives a successfully presented Workspace payload with full original untruncated content.
   */
  public addEntry(payload: PresentationPayload): WorkspaceHistoryEntry {
    const now = new Date(payload.timestamp || Date.now());
    
    // Format Date: "16 Aug 2026"
    const dateFormatted = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Format Time: "22:30"
    const timeFormatted = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const lines = (payload.rawContent || '').split('\n');
    const words = (payload.rawContent || '').split(/\s+/).filter(Boolean);

    // Human-readable Title clean up
    let title = payload.headerTitle.replace(/^JARVIS\s*\/\/\s*/i, '').trim();
    if (!title || title.toUpperCase() === 'INTELLIGENCE PRESENTATION' || title.toUpperCase() === 'LONG-FORM DOSSIER') {
      // Derive cleaner title from prompt
      title = payload.sourcePrompt.length > 50 
        ? `${payload.sourcePrompt.slice(0, 47)}...` 
        : payload.sourcePrompt;
    }

    const entry: WorkspaceHistoryEntry = {
      id: `hist_${payload.id}_${Date.now()}`,
      title: title || 'Workspace Presentation',
      presentationType: payload.primaryMode,
      payload: JSON.parse(JSON.stringify(payload)), // Deep clone complete original payload
      rawContent: payload.rawContent, // Complete un-truncated content
      sourcePrompt: payload.sourcePrompt,
      date: dateFormatted,
      time: timeFormatted,
      timestamp: payload.timestamp || Date.now(),
      description: payload.overview?.summary 
        ? payload.overview.summary.slice(0, 150) 
        : payload.rawContent.slice(0, 150),
      stats: {
        lineCount: lines.length,
        wordCount: words.length,
        charCount: payload.rawContent.length
      }
    };

    // Prepend to history (newest first)
    // Avoid immediate duplicate of identical content in a tight window
    const isDuplicate = this.history.length > 0 && 
      this.history[0].rawContent === entry.rawContent && 
      this.history[0].presentationType === entry.presentationType;

    if (!isDuplicate) {
      this.history = [entry, ...this.history].slice(0, MAX_HISTORY_ITEMS);
      this.saveToStorage();
      this.notify();
    }

    return entry;
  }

  public getHistory(): WorkspaceHistoryEntry[] {
    return [...this.history];
  }

  public getHistoryByType(type: PresentationMode): WorkspaceHistoryEntry[] {
    return this.history.filter(item => item.presentationType === type);
  }

  public getEntryById(id: string): WorkspaceHistoryEntry | undefined {
    return this.history.find(item => item.id === id);
  }

  public deleteEntry(id: string): boolean {
    const initialLen = this.history.length;
    this.history = this.history.filter(item => item.id !== id);
    if (this.history.length !== initialLen) {
      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  public clearHistory(): void {
    this.history = [];
    this.saveToStorage();
    this.notify();
  }
}

export const workspaceHistoryService = WorkspaceHistoryService.getInstance();
