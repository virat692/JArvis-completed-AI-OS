
export type JarvisTheme = 'cyber' | 'crimson' | 'violet' | 'emerald';

export enum JarvisStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  EXECUTING = 'EXECUTING',
  DIAGNOSTIC = 'DIAGNOSTIC',
  HAPPY = 'HAPPY',
  ERROR = 'ERROR'
}

export type JarvisMode = 'CHILL' | 'WORK' | 'DEVELOPER' | 'AUTONOMOUS';

export type FontStyle = 'space' | 'orbitron' | 'rajdhani' | 'mono' | 'modern' | 'exo';

export interface MemoryEntry {
  id: string;
  category: 'User' | 'Project' | 'System' | 'Goal';
  content: string;
  timestamp: number;
  type: 'long_term' | 'short_term';
}

export interface LogEntry {
  id: string;
  source: 'SYSTEM' | 'OPERATOR' | 'JARVIS';
  message: string;
  timestamp: number;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface UpgradeRequest {
  id: string;
  task: string;
  status?: 'failed' | 'pending' | 'applied' | string;
  reason: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  suggested_module?: string;
}

export type ConversationRole = 'USER' | 'JARVIS';

export interface ConversationMessage {
  sessionId: string;
  messageId: string;
  role: ConversationRole;
  content: string;
  timestamp: number;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface ChatSession {
  session_id: string;
  title: string;
  timestamp_created: number;
  timestamp_last_message: number;
  last_message_preview: string;
  mode: JarvisMode;
  model: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  category?: 'neural' | 'research' | 'coding' | 'memory' | 'voice' | 'browser' | 'automation' | 'file';
  tags?: string[];
  voiceDurationMin?: number;
  filesCount?: number;
  imagesCount?: number;
  websitesCount?: number;
  toolsUsedCount?: number;
  summary?: string;
  messageCount: number;
  memorySaved: boolean;
  messages?: ConversationMessage[];
  logs?: LogEntry[];
}

export interface RuntimeMetrics {
  uptimeSeconds: number;
  heartbeatCount: number;
  cpuPercent: number;
  memoryUsageMb: number;
  activeWorkers: number;
  scheduledTasksCount: number;
  totalEventsProcessed: number;
  activeSessionsCount: number;
  lastCrashTimestamp?: number;
  recoveredCount: number;
}

export interface RuntimeJob {
  id: string;
  name: string;
  intervalMs: number;
  lastRun?: number;
  nextRun: number;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  runCount: number;
  fn?: () => void | Promise<void>;
}

export interface RuntimeNotification {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
  read: boolean;
}

// --- Knowledge Graph Memory System Types ---
export type KnowledgeNodeType = 'Person' | 'Project' | 'Goal' | 'Tech' | 'Concept' | 'File' | 'Preference';

export interface KnowledgeNode {
  id: string;
  name: string;
  type: KnowledgeNodeType;
  properties: Record<string, string>;
  timestamp: number;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string; // e.g., 'WORKS_ON', 'USES_TECH', 'HAS_GOAL', 'DEPENDS_ON'
  weight: number;
}

export interface GraphQueryResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// --- Modular Workflow Engine Types ---
export type WorkflowActionType = 'launch_app' | 'run_command' | 'open_url' | 'voice_speak' | 'memory_commit' | 'browser_task' | 'custom';

export interface WorkflowStep {
  id: string;
  name: string;
  action: WorkflowActionType;
  target: string;
  payload?: any;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface WorkflowPipeline {
  id: string;
  name: string;
  description: string;
  trigger: 'MANUAL' | 'SCHEDULED' | 'EVENT';
  eventName?: string;
  steps: WorkflowStep[];
  lastExecuted?: number;
  isBuiltin?: boolean;
}

// --- Multi-Model Neural Router Types ---
export interface AIModelRoute {
  id: string;
  name: string;
  provider: 'gemini' | 'nemotron' | 'openrouter';
  contextLimit: string;
  latencyScore: 'ULTRA_FAST' | 'BALANCED' | 'HIGH_REASONING';
  costPer1kTokens: string;
  recommendedFor: string[];
  active: boolean;
}

// --- Task & Reminder Engine Types ---
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  due_time?: number | string; // Milliseconds timestamp or ISO string
  priority: TaskPriority;
  status: TaskStatus;
  recurrence?: TaskRecurrence;
  recurrence_custom_days?: number;
  tags?: string[];
  created_at: number;
  updated_at: number;
  completed_at?: number;
  reminder_fired?: boolean;
  metadata?: Record<string, any>;
}

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  search?: string;
  tag?: string;
  timeframe?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';
}


