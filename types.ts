
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
  status: 'failed';
  reason: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  suggested_module?: string;
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
  messageCount: number;
  memorySaved: boolean;
  logs?: LogEntry[];
}
