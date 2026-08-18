/**
 * JARVIS Universal Event Bus
 * Centralized, decoupled pub/sub message backbone for all JARVIS subsystems.
 * All engines (Runtime, Voice, Desktop, Browser, Authority, Memory) communicate through this event bus.
 */

export interface SystemEventPayloads {
  'voice.command': { text: string; confidence?: number };
  'voice.state': { status: string };
  'runtime.heartbeat': { uptime: number; heartbeatCount: number; timestamp: number };
  'runtime.notification': { id: string; title: string; message: string; level: 'info' | 'warning' | 'error' | 'success'; timestamp: number };
  'runtime.job': { id: string; name: string; status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' };
  'runtime.crash': { module: string; error: string; timestamp: number };
  'authority.permission_requested': { id: string; action: string; requiredLevel: string; module: string; rationale: string };
  'authority.permission_resolved': { id: string; status: 'GRANTED' | 'DENIED' };
  'authority.level_changed': { newLevel: string; previousLevel: string };
  'os.command': { command: string; result?: string; status: 'executed' | 'failed' };
  'hud.status_change': { status: string };
  'logger.entry': { source: string; message: string; type?: string };
  [key: string]: any;
}

export type EventCallback<T = any> = (payload: T) => void;

class UniversalEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private eventHistory: Array<{ event: string; payload: any; timestamp: number }> = [];
  private maxHistoryLength = 200;
  private totalEventsProcessed = 0;

  /**
   * Subscribe to an event topic
   */
  public on<K extends keyof SystemEventPayloads>(
    event: K | string,
    callback: EventCallback<SystemEventPayloads[K]>
  ): () => void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(callback);

    // Return unsubscriber function
    return () => this.off(event as string, callback);
  }

  /**
   * Subscribe to an event topic once
   */
  public once<K extends keyof SystemEventPayloads>(
    event: K | string,
    callback: EventCallback<SystemEventPayloads[K]>
  ): void {
    const wrapper: EventCallback = (payload) => {
      this.off(event as string, wrapper);
      callback(payload);
    };
    this.on(event, wrapper);
  }

  /**
   * Unsubscribe a listener
   */
  public off(event: string, callback: EventCallback): void {
    const topicListeners = this.listeners.get(event);
    if (topicListeners) {
      topicListeners.delete(callback);
      if (topicListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Publish an event to all subscribers
   */
  public emit<K extends keyof SystemEventPayloads>(
    event: K | string,
    payload: SystemEventPayloads[K]
  ): void {
    this.totalEventsProcessed++;
    const timestamp = Date.now();

    // Store in event history
    this.eventHistory.push({ event: event as string, payload, timestamp });
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory.shift();
    }

    const topicListeners = this.listeners.get(event as string);
    if (topicListeners) {
      topicListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error executing listener for event '${String(event)}':`, err);
        }
      });
    }
  }

  /**
   * Retrieve recent event history for telemetry and debugging
   */
  public getHistory() {
    return [...this.eventHistory];
  }

  /**
   * Retrieve total number of events processed
   */
  public getTotalEventsProcessed(): number {
    return this.totalEventsProcessed;
  }

  /**
   * Clear event history
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }
}

export const eventBus = new UniversalEventBus();
