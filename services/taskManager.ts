import { TaskItem, TaskPriority, TaskStatus, TaskRecurrence, TaskFilterOptions } from '../types';
import { eventBus } from './eventBus';

export type { TaskItem, TaskPriority, TaskStatus, TaskRecurrence, TaskFilterOptions };

const STORAGE_KEY = 'jarvis_tasks_v2';
const LEGACY_STORAGE_KEY = 'jarvis_scheduled_tasks';

class TaskManager {
  private tasks: TaskItem[] = [];
  private checkInterval: any = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public getAllTasks(): TaskItem[] {
    return [...this.tasks];
  }

  private init() {
    if (typeof window === 'undefined') return;
    this.loadFromStorage();
    this.startScheduler();
    this.isInitialized = true;
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.tasks = parsed.map(t => this.sanitizeTask(t));
          return;
        }
      }

      // Check legacy format migration
      const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacySaved) {
        const legacyParsed = JSON.parse(legacySaved);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          this.tasks = legacyParsed.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            title: item.action || item.reminder_text || item.title || 'Scheduled Task',
            description: item.description || '',
            due_time: item.time ? this.parseDueTime(item.time) : undefined,
            priority: 'medium',
            status: item.status === 'completed' ? 'completed' : 'pending',
            recurrence: 'none',
            tags: ['migrated'],
            created_at: Date.now(),
            updated_at: Date.now(),
            reminder_fired: false
          }));
          this.saveToStorage();
          return;
        }
      }

      // Default sample tasks for initial operational state
      const now = Date.now();
      this.tasks = [
        {
          id: 'task-1',
          title: 'Review Arc Reactor Telemetry and Sector 4 thermal sensors',
          description: 'Ensure all sensory arrays are calibrated and operating within safe thresholds.',
          priority: 'high',
          status: 'pending',
          due_time: now + 3600000 * 2, // 2 hours from now
          recurrence: 'none',
          tags: ['diagnostics', 'hardware'],
          created_at: now - 3600000,
          updated_at: now - 3600000,
          reminder_fired: false
        },
        {
          id: 'task-2',
          title: 'Daily Neural Core synchronization backup',
          description: 'Synchronize long-term episodic memories to encrypted local cluster.',
          priority: 'medium',
          status: 'pending',
          due_time: now + 3600000 * 6,
          recurrence: 'daily',
          tags: ['system', 'maintenance'],
          created_at: now - 7200000,
          updated_at: now - 7200000,
          reminder_fired: false
        }
      ];
      this.saveToStorage();
    } catch (e) {
      console.warn('Failed to load tasks from storage:', e);
      this.tasks = [];
    }
  }

  private sanitizeTask(raw: any): TaskItem {
    return {
      id: String(raw.id || Math.random().toString(36).substr(2, 9)),
      title: String(raw.title || 'Untitled Directive'),
      description: raw.description ? String(raw.description) : undefined,
      due_time: raw.due_time ? Number(raw.due_time) || raw.due_time : undefined,
      priority: ['low', 'medium', 'high', 'urgent'].includes(raw.priority) ? raw.priority : 'medium',
      status: ['pending', 'in_progress', 'completed', 'cancelled'].includes(raw.status) ? raw.status : 'pending',
      recurrence: ['none', 'daily', 'weekly', 'monthly', 'custom'].includes(raw.recurrence) ? raw.recurrence : 'none',
      recurrence_custom_days: raw.recurrence_custom_days ? Number(raw.recurrence_custom_days) : undefined,
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
      created_at: Number(raw.created_at) || Date.now(),
      updated_at: Number(raw.updated_at) || Date.now(),
      completed_at: raw.completed_at ? Number(raw.completed_at) : undefined,
      reminder_fired: Boolean(raw.reminder_fired),
      metadata: raw.metadata || {}
    };
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
      // Also sync to legacy key for backward compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(this.tasks.map(t => ({
        id: t.id,
        time: t.due_time ? new Date(t.due_time).toISOString() : '',
        action: t.title,
        status: t.status
      }))));
    } catch (e) {
      console.error('Failed to persist tasks to storage:', e);
    }
  }

  public parseDueTime(timeStr: string | number): number | undefined {
    if (typeof timeStr === 'number') {
      return timeStr > 0 ? timeStr : undefined;
    }
    if (!timeStr || typeof timeStr !== 'string') return undefined;

    const trimmed = timeStr.trim().toLowerCase();

    // Check if ISO / parseable Date string
    const parsedDate = Date.parse(timeStr);
    if (!isNaN(parsedDate) && parsedDate > 0) {
      return parsedDate;
    }

    const now = Date.now();

    // Natural relative time parsing
    const inMinMatch = trimmed.match(/in\s+(\d+)\s*(?:min|mins|minute|minutes)/);
    if (inMinMatch) {
      return now + parseInt(inMinMatch[1], 10) * 60 * 1000;
    }

    const inHourMatch = trimmed.match(/in\s+(\d+)\s*(?:hr|hrs|hour|hours)/);
    if (inHourMatch) {
      return now + parseInt(inHourMatch[1], 10) * 3600 * 1000;
    }

    const inDayMatch = trimmed.match(/in\s+(\d+)\s*(?:day|days)/);
    if (inDayMatch) {
      return now + parseInt(inDayMatch[1], 10) * 86400 * 1000;
    }

    if (trimmed.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // Default 9 AM
      return tomorrow.getTime();
    }

    if (trimmed.includes('tonight')) {
      const tonight = new Date();
      tonight.setHours(20, 0, 0, 0); // 8 PM
      return tonight.getTime();
    }

    return undefined;
  }

  public createTask(input: {
    title: string;
    description?: string;
    due_time?: number | string;
    priority?: TaskPriority;
    recurrence?: TaskRecurrence;
    recurrence_custom_days?: number;
    tags?: string[];
    metadata?: Record<string, any>;
  }): TaskItem {
    const now = Date.now();
    const resolvedDueTime = input.due_time !== undefined ? this.parseDueTime(input.due_time) : undefined;

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      due_time: resolvedDueTime,
      priority: input.priority || 'medium',
      status: 'pending',
      recurrence: input.recurrence || 'none',
      recurrence_custom_days: input.recurrence_custom_days,
      tags: input.tags || [],
      created_at: now,
      updated_at: now,
      reminder_fired: false,
      metadata: input.metadata || {}
    };

    this.tasks = [newTask, ...this.tasks];
    this.saveToStorage();

    eventBus.emit('task.created', { task: newTask });
    eventBus.emit('logger.entry', {
      source: 'JARVIS',
      message: `⌬ Task Engine: Created directive "${newTask.title}" [Priority: ${newTask.priority.toUpperCase()}]`,
      type: 'success'
    });

    return newTask;
  }

  public updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const existing = this.tasks[index];
    const resolvedDueTime = updates.due_time !== undefined 
      ? this.parseDueTime(updates.due_time) 
      : existing.due_time;

    const updated: TaskItem = {
      ...existing,
      ...updates,
      due_time: resolvedDueTime,
      updated_at: Date.now()
    };

    // If due_time was changed into future, reset reminder_fired
    const dueNumeric = typeof resolvedDueTime === 'number' ? resolvedDueTime : (resolvedDueTime ? new Date(resolvedDueTime).getTime() : null);
    if (updates.due_time !== undefined && dueNumeric && dueNumeric > Date.now()) {
      updated.reminder_fired = false;
    }

    this.tasks[index] = updated;
    this.saveToStorage();

    eventBus.emit('task.updated', { task: updated });
    return updated;
  }

  public completeTask(id: string): { completed: TaskItem; nextOccurrence?: TaskItem } | null {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = this.tasks[index];
    const now = Date.now();

    const completed: TaskItem = {
      ...current,
      status: 'completed',
      completed_at: now,
      updated_at: now
    };

    let nextOccurrence: TaskItem | undefined;

    // Handle Recurrence
    if (current.recurrence && current.recurrence !== 'none') {
      let nextDue: number | undefined;
      const baseDue = (current.due_time && typeof current.due_time === 'number') ? current.due_time : now;

      if (current.recurrence === 'daily') {
        nextDue = baseDue + 86400 * 1000;
      } else if (current.recurrence === 'weekly') {
        nextDue = baseDue + 7 * 86400 * 1000;
      } else if (current.recurrence === 'monthly') {
        const d = new Date(baseDue);
        d.setMonth(d.getMonth() + 1);
        nextDue = d.getTime();
      } else if (current.recurrence === 'custom' && current.recurrence_custom_days) {
        nextDue = baseDue + current.recurrence_custom_days * 86400 * 1000;
      }

      if (nextDue) {
        nextOccurrence = {
          ...current,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          status: 'pending',
          due_time: nextDue,
          created_at: now,
          updated_at: now,
          completed_at: undefined,
          reminder_fired: false
        };
      }
    }

    this.tasks[index] = completed;
    if (nextOccurrence) {
      this.tasks.unshift(nextOccurrence);
    }

    this.saveToStorage();

    eventBus.emit('task.completed', { task: completed, nextOccurrence });
    eventBus.emit('logger.entry', {
      source: 'JARVIS',
      message: `✓ Task Engine: Directive "${completed.title}" marked as COMPLETED.` + (nextOccurrence ? ` Recurring cycle scheduled for ${new Date(nextOccurrence.due_time!).toLocaleString()}` : ''),
      type: 'success'
    });

    return { completed, nextOccurrence };
  }

  public deleteTask(id: string): boolean {
    const initialLen = this.tasks.length;
    const removed = this.tasks.find(t => t.id === id);
    this.tasks = this.tasks.filter(t => t.id !== id);

    if (this.tasks.length !== initialLen) {
      this.saveToStorage();
      if (removed) {
        eventBus.emit('task.deleted', { id, title: removed.title });
        eventBus.emit('logger.entry', {
          source: 'JARVIS',
          message: `⌬ Task Engine: Deleted directive "${removed.title}".`,
          type: 'info'
        });
      }
      return true;
    }
    return false;
  }

  public getTask(id: string): TaskItem | null {
    return this.tasks.find(t => t.id === id) || null;
  }

  public getTasks(filter?: TaskFilterOptions): TaskItem[] {
    let result = [...this.tasks];

    if (!filter) return result;

    if (filter.status && filter.status !== 'all') {
      result = result.filter(t => t.status === filter.status);
    }

    if (filter.priority && filter.priority !== 'all') {
      result = result.filter(t => t.priority === filter.priority);
    }

    if (filter.tag) {
      result = result.filter(t => t.tags && t.tags.includes(filter.tag!));
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    if (filter.timeframe && filter.timeframe !== 'all') {
      const now = Date.now();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (filter.timeframe === 'today') {
        result = result.filter(t => {
          if (!t.due_time || typeof t.due_time !== 'number') return false;
          return t.due_time >= startOfToday.getTime() && t.due_time <= endOfToday.getTime();
        });
      } else if (filter.timeframe === 'upcoming') {
        result = result.filter(t => {
          if (!t.due_time || typeof t.due_time !== 'number') return false;
          return t.due_time > endOfToday.getTime() && t.status !== 'completed';
        });
      } else if (filter.timeframe === 'overdue') {
        result = result.filter(t => {
          if (!t.due_time || typeof t.due_time !== 'number') return false;
          return t.due_time < now && t.status === 'pending';
        });
      } else if (filter.timeframe === 'completed') {
        result = result.filter(t => t.status === 'completed');
      }
    }

    return result;
  }

  public clearCompletedTasks(): number {
    const beforeCount = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.status !== 'completed');
    const removedCount = beforeCount - this.tasks.length;
    if (removedCount > 0) {
      this.saveToStorage();
      eventBus.emit('logger.entry', {
        source: 'JARVIS',
        message: `⌬ Task Engine: Cleared ${removedCount} completed archive tasks.`,
        type: 'info'
      });
    }
    return removedCount;
  }

  // Autonomous Temporal Scan Loop
  private startScheduler() {
    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, 10000); // Scan every 10 seconds
  }

  public checkDueReminders() {
    const now = Date.now();
    let hasChanges = false;

    for (const task of this.tasks) {
      if (
        task.status === 'pending' &&
        task.due_time &&
        typeof task.due_time === 'number' &&
        task.due_time <= now &&
        !task.reminder_fired
      ) {
        task.reminder_fired = true;
        hasChanges = true;

        // Emit Universal EventBus Events
        eventBus.emit('task.due', { task });
        eventBus.emit('reminder.fired', { task });

        eventBus.emit('logger.entry', {
          source: 'JARVIS',
          message: `🔔 TASK REMINDER DUE: "${task.title}" [Priority: ${task.priority.toUpperCase()}]`,
          type: 'warning'
        });

        // Trigger browser notification if supported and granted
        this.triggerBrowserNotification(task);
      }
    }

    if (hasChanges) {
      this.saveToStorage();
    }
  }

  private triggerBrowserNotification(task: TaskItem) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`JARVIS Reminder: ${task.title}`, {
            body: task.description || `Priority: ${task.priority.toUpperCase()} • Scheduled for now`,
            icon: '/favicon.ico'
          });
        } catch (e) {
          // Ignore sandbox notification restrictions
        }
      }
    }
  }

  public requestNotificationPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  public getStats() {
    const total = this.tasks.length;
    const pending = this.tasks.filter(t => t.status === 'pending').length;
    const completed = this.tasks.filter(t => t.status === 'completed').length;
    const now = Date.now();
    const overdue = this.tasks.filter(t => t.status === 'pending' && t.due_time && typeof t.due_time === 'number' && t.due_time < now).length;
    const highPriority = this.tasks.filter(t => t.status === 'pending' && (t.priority === 'high' || t.priority === 'urgent')).length;

    return {
      total,
      pending,
      completed,
      overdue,
      highPriority
    };
  }
}

export const taskManager = new TaskManager();
