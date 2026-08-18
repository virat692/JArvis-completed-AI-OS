import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ListTodo, 
  CheckSquare, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Filter, 
  Calendar, 
  Tag, 
  Repeat, 
  CheckCircle2, 
  Circle, 
  Flame, 
  ArrowUpRight, 
  Search, 
  Shield, 
  ChevronRight, 
  Edit3, 
  CornerDownLeft, 
  Maximize2, 
  Minimize2, 
  Check, 
  Bell, 
  BellRing, 
  Play, 
  SlidersHorizontal, 
  Layers,
  FolderOpen,
  CalendarDays,
  CheckCheck,
  RotateCcw,
  Zap,
  Cpu,
  Bot
} from 'lucide-react';
import { 
  taskManager, 
  TaskItem, 
  TaskPriority, 
  TaskStatus, 
  TaskRecurrence, 
  TaskFilterOptions 
} from '../services/taskManager';
import { eventBus } from '../services/eventBus';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: string;
  onAskJarvisTask?: (taskDirective: string) => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  isOpen,
  onClose,
  theme = 'cyber',
  onAskJarvisTask,
}) => {
  // Mode & Layout States
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  
  // Quick Add State
  const [quickInput, setQuickInput] = useState('');
  
  // Manual Full Creator / Editor Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formCategory, setFormCategory] = useState('Protocol');
  const [formDuePreset, setFormDuePreset] = useState<'none' | '15m' | '1hr' | 'tonight' | 'tomorrow' | '3days' | 'custom'>('1hr');
  const [formCustomDate, setFormCustomDate] = useState('');
  const [formCustomTime, setFormCustomTime] = useState('18:00');
  const [formRecurrence, setFormRecurrence] = useState<TaskRecurrence>('none');
  const [formTags, setFormTags] = useState<string[]>(['directive']);
  const [formTagInput, setFormTagInput] = useState('');
  const [formChecklist, setFormChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [formChecklistInput, setFormChecklistInput] = useState('');

  const quickInputRef = useRef<HTMLInputElement>(null);

  // Audio effects
  const playSound = (freq = 800, type: OscillatorType = 'sine', duration = 0.05) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Sync tasks on mount & listen to EventBus
  const refreshTasks = () => {
    const all = taskManager.getAllTasks();
    setTasks([...all]);
    if (selectedTask) {
      const fresh = all.find(t => t.id === selectedTask.id);
      setSelectedTask(fresh || null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshTasks();

    const unsubUpdated = eventBus.on('task.updated', refreshTasks);
    const unsubCreated = eventBus.on('task.created', refreshTasks);
    const unsubCompleted = eventBus.on('task.completed', refreshTasks);
    const unsubDeleted = eventBus.on('task.deleted', refreshTasks);
    const unsubDue = eventBus.on('task.due', () => {
      playSound(950, 'triangle', 0.15);
      refreshTasks();
    });

    return () => {
      unsubUpdated();
      unsubCreated();
      unsubCompleted();
      unsubDeleted();
      unsubDue();
    };
  }, [isOpen]);

  // Telemetry Metrics
  const stats = useMemo(() => {
    const now = Date.now();
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => {
      if (t.status !== 'pending' || !t.due_time) return false;
      const ts = typeof t.due_time === 'number' ? t.due_time : new Date(t.due_time).getTime();
      return ts < now;
    }).length;
    const urgent = tasks.filter(t => t.status === 'pending' && (t.priority === 'urgent' || t.priority === 'high')).length;
    return { pending, completed, overdue, urgent, total: tasks.length };
  }, [tasks]);

  // All Unique Tags in System
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Filtered List
  const filteredTasks = useMemo(() => {
    return taskManager.getTasks({
      status: activeTab === 'completed' ? 'completed' : (activeTab === 'all' ? undefined : 'pending'),
      priority: priorityFilter,
      tag: selectedTag || undefined,
      search: searchQuery || undefined,
      timeframe: activeTab
    });
  }, [tasks, activeTab, priorityFilter, selectedTag, searchQuery]);

  // Format Due Relative & Exact Strings
  const formatDueTime = (dueTime?: number | string) => {
    if (!dueTime) return null;
    const targetMs = typeof dueTime === 'number' ? dueTime : new Date(dueTime).getTime();
    if (isNaN(targetMs)) return null;

    const now = Date.now();
    const diffMs = targetMs - now;
    const isPast = diffMs < 0;
    const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);
    const minutes = Math.floor(absDiffSec / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const targetDate = new Date(targetMs);
    const dateFormatted = targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeFormatted = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let relativeStr = '';
    if (days > 0) {
      relativeStr = `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      relativeStr = `${hours}h ${minutes % 60}m`;
    } else {
      relativeStr = `${minutes}m`;
    }

    return {
      isPast,
      relative: isPast ? `${relativeStr} overdue` : `in ${relativeStr}`,
      full: `${dateFormatted} at ${timeFormatted}`,
      exactDate: dateFormatted,
      exactTime: timeFormatted
    };
  };

  // Quick Add Parser (Extracts #tags, !priority, @tomorrow)
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    let text = quickInput.trim();
    let priority: TaskPriority = 'medium';
    let dueTime: number | string | undefined = Date.now() + 3600000; // default 1 hr
    const tags: string[] = ['directive'];

    // Parse !priority
    if (text.includes('!urgent') || text.includes('!critical')) {
      priority = 'urgent';
      text = text.replace(/!urgent|!critical/gi, '').trim();
    } else if (text.includes('!high')) {
      priority = 'high';
      text = text.replace(/!high/gi, '').trim();
    } else if (text.includes('!low')) {
      priority = 'low';
      text = text.replace(/!low/gi, '').trim();
    }

    // Parse #tags
    const tagMatches = text.match(/#(\w+)/g);
    if (tagMatches) {
      tagMatches.forEach(tm => {
        tags.push(tm.replace('#', '').toLowerCase());
        text = text.replace(tm, '').trim();
      });
    }

    // Parse @timing
    if (text.includes('@tomorrow') || text.includes('@tom')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      dueTime = tomorrow.getTime();
      text = text.replace(/@tomorrow|@tom/gi, '').trim();
    } else if (text.includes('@tonight')) {
      const tonight = new Date();
      tonight.setHours(20, 0, 0, 0);
      dueTime = tonight.getTime();
      text = text.replace(/@tonight/gi, '').trim();
    } else if (text.includes('@none') || text.includes('@nodate')) {
      dueTime = undefined;
      text = text.replace(/@none|@nodate/gi, '').trim();
    }

    if (!text) text = 'Quick Directive Objective';

    taskManager.createTask({
      title: text,
      priority,
      due_time: dueTime,
      tags: Array.from(new Set(tags)),
      metadata: { source: 'manual' }
    });

    playSound(1100, 'sine', 0.08);
    setQuickInput('');
    refreshTasks();
  };

  // Open Full Manual Modal (Create or Edit)
  const openManualForm = (taskToEdit?: TaskItem) => {
    if (taskToEdit) {
      setEditingTaskId(taskToEdit.id);
      setFormTitle(taskToEdit.title);
      setFormDesc(taskToEdit.description || '');
      setFormPriority(taskToEdit.priority);
      setFormRecurrence(taskToEdit.recurrence || 'none');
      setFormTags(taskToEdit.tags || ['directive']);
      if (taskToEdit.due_time) {
        setFormDuePreset('custom');
        const d = new Date(taskToEdit.due_time);
        setFormCustomDate(d.toISOString().split('T')[0]);
        setFormCustomTime(d.toTimeString().slice(0, 5));
      } else {
        setFormDuePreset('none');
      }
    } else {
      setEditingTaskId(null);
      setFormTitle('');
      setFormDesc('');
      setFormPriority('medium');
      setFormCategory('Protocol');
      setFormDuePreset('1hr');
      setFormRecurrence('none');
      setFormTags(['directive']);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormCustomDate(tomorrow.toISOString().split('T')[0]);
      setFormCustomTime('09:00');
      setFormChecklist([]);
    }
    setIsFormOpen(true);
    playSound(750, 'sine', 0.06);
  };

  // Save Full Manual Directive Form
  const handleSaveManualForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let dueTime: number | undefined;
    const now = new Date();

    switch (formDuePreset) {
      case '15m':
        dueTime = Date.now() + 15 * 60 * 1000;
        break;
      case '1hr':
        dueTime = Date.now() + 60 * 60 * 1000;
        break;
      case 'tonight':
        const tonight = new Date();
        tonight.setHours(20, 0, 0, 0);
        if (tonight.getTime() < Date.now()) tonight.setDate(tonight.getDate() + 1);
        dueTime = tonight.getTime();
        break;
      case 'tomorrow':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        dueTime = tomorrow.getTime();
        break;
      case '3days':
        const threeDays = new Date();
        threeDays.setDate(threeDays.getDate() + 3);
        threeDays.setHours(9, 0, 0, 0);
        dueTime = threeDays.getTime();
        break;
      case 'custom':
        if (formCustomDate) {
          const [year, month, day] = formCustomDate.split('-').map(Number);
          const [hour, min] = (formCustomTime || '12:00').split(':').map(Number);
          const customD = new Date(year, month - 1, day, hour, min);
          dueTime = customD.getTime();
        }
        break;
      case 'none':
      default:
        dueTime = undefined;
        break;
    }

    if (editingTaskId) {
      taskManager.updateTask(editingTaskId, {
        title: formTitle.trim(),
        description: formDesc.trim(),
        priority: formPriority,
        due_time: dueTime,
        recurrence: formRecurrence,
        tags: formTags
      });
    } else {
      taskManager.createTask({
        title: formTitle.trim(),
        description: formDesc.trim(),
        priority: formPriority,
        due_time: dueTime,
        recurrence: formRecurrence,
        tags: formTags,
        metadata: { source: 'manual' }
      });
    }

    playSound(1200, 'sine', 0.1);
    setIsFormOpen(false);
    setEditingTaskId(null);
    refreshTasks();
  };

  const handleToggleComplete = (task: TaskItem) => {
    playSound(task.status === 'completed' ? 600 : 1000, 'triangle', 0.08);
    if (task.status === 'completed') {
      taskManager.updateTask(task.id, { status: 'pending' });
    } else {
      taskManager.completeTask(task.id);
    }
    refreshTasks();
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound(400, 'sawtooth', 0.1);
    taskManager.deleteTask(id);
    if (selectedTask?.id === id) setSelectedTask(null);
    refreshTasks();
  };

  const handleSnoozeTask = (task: TaskItem, minutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound(850, 'sine', 0.08);
    const newDue = Date.now() + minutes * 60 * 1000;
    taskManager.updateTask(task.id, { due_time: newDue });
    refreshTasks();
  };

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.35)]';
      case 'high':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'medium':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(0,242,255,0.2)]';
      case 'low':
      default:
        return 'bg-slate-900/80 text-slate-300 border-slate-700/60';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#020817] w-screen h-screen overflow-hidden text-slate-100 font-sans select-none animate-in fade-in duration-200">
      
      {/* 1. TOP STATUS & NAVIGATION HUD */}
      <header className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <ListTodo className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                TASK & REMINDER ENGINE
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AUTONOMOUS SCHEDULER ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Directive Matrix</span>
              <span>•</span>
              <span>EventBus Synced</span>
              <span>•</span>
              <span className="text-cyan-400">{stats.pending} Directives Queued</span>
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openManualForm()}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>MANUAL DIRECTIVE</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen HUD' : 'Enter Full Screen HUD'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            title="Close Task Engine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. ALWAYS-VISIBLE QUICK MANUAL ADD COMMAND BAR */}
      <div className="px-6 py-2.5 bg-[#010816]/95 border-b border-cyan-500/20 shrink-0">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 text-xs font-orbitron font-bold shrink-0">
            <Zap className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">QUICK DIRECTIVE</span>
          </div>

          <div className="relative flex-1">
            <input
              ref={quickInputRef}
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder='Type manual directive (e.g. "Deploy security patch at 6 PM #ops !urgent" or "Call Mark @tomorrow")...'
              className="w-full pl-3.5 pr-24 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-slate-100 placeholder:text-slate-500 text-xs font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                ENTER ↵
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs font-orbitron font-bold hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
          >
            + ADD
          </button>

          <button
            type="button"
            onClick={() => openManualForm()}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-orbitron hover:border-cyan-500/40 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            title="Open Full Directive Configurator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ADVANCED</span>
          </button>
        </form>
      </div>

      {/* 3. MAIN WORKSPACE: SIDEBAR + MATRIX + INSPECTOR */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* LEFT SIDEBAR: FILTERS, DIRECTIVE STREAMS, METRICS */}
        <aside className="w-64 sm:w-72 bg-[#020b1c]/80 border-r border-cyan-500/20 flex flex-col p-4 space-y-4 shrink-0 overflow-y-auto custom-scroll">
          
          {/* Telemetry Metric Pods */}
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              TELEMETRY OVERVIEW
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div 
                onClick={() => setActiveTab('today')} 
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'today' ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(0,242,255,0.2)]' : 'bg-slate-900/40 border-cyan-500/20 hover:border-cyan-500/40'
                }`}
              >
                <span className="text-[9px] font-mono text-slate-400 block">PENDING</span>
                <span className="text-xl font-orbitron font-black text-cyan-300">{stats.pending}</span>
              </div>

              <div 
                onClick={() => setActiveTab('overdue')} 
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'overdue' ? 'bg-rose-950/60 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'bg-slate-900/40 border-cyan-500/20 hover:border-rose-500/40'
                }`}
              >
                <span className="text-[9px] font-mono text-slate-400 block">OVERDUE</span>
                <span className={`text-xl font-orbitron font-black ${stats.overdue > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  {stats.overdue}
                </span>
              </div>

              <div 
                onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')} 
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  priorityFilter === 'urgent' ? 'bg-amber-950/60 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]' : 'bg-slate-900/40 border-cyan-500/20 hover:border-amber-500/40'
                }`}
              >
                <span className="text-[9px] font-mono text-slate-400 block">CRITICAL</span>
                <span className="text-xl font-orbitron font-black text-amber-300">{stats.urgent}</span>
              </div>

              <div 
                onClick={() => setActiveTab('completed')} 
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'completed' ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]' : 'bg-slate-900/40 border-cyan-500/20 hover:border-emerald-500/40'
                }`}
              >
                <span className="text-[9px] font-mono text-slate-400 block">COMPLETED</span>
                <span className="text-xl font-orbitron font-black text-emerald-400">{stats.completed}</span>
              </div>
            </div>
          </div>

          {/* Timeframe Streams */}
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              TIMEFRAME STREAMS
            </span>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Active Directives', icon: Layers, count: stats.pending },
                { id: 'today', label: "Today's Agenda", icon: Clock, count: tasks.filter(t => t.status === 'pending').length },
                { id: 'upcoming', label: 'Upcoming Scheduled', icon: CalendarDays, count: tasks.filter(t => t.status === 'pending' && t.due_time).length },
                { id: 'overdue', label: 'Overdue Warnings', icon: AlertTriangle, count: stats.overdue, isAlert: stats.overdue > 0 },
                { id: 'completed', label: 'Completed Archive', icon: CheckCheck, count: stats.completed },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      playSound(700, 'sine', 0.04);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-orbitron transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-200 shadow-[0_0_15px_rgba(0,242,255,0.2)] font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : item.isAlert ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-cyan-900 text-cyan-200' : item.isAlert ? 'bg-rose-950 text-rose-300' : 'bg-slate-900 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Matrix Filters */}
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
              PRIORITY LEVEL
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPriorityFilter(p);
                    playSound(650, 'sine', 0.04);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-orbitron font-bold uppercase transition-all border cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,242,255,0.25)]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Matrix */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  SYSTEM TAGS
                </span>
                {selectedTag && (
                  <button 
                    onClick={() => setSelectedTag(null)}
                    className="text-[9px] font-mono text-cyan-400 hover:underline cursor-pointer"
                  >
                    Clear Tag
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono border transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.3)] font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-cyan-300 hover:border-cyan-500/40'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Manual Actions */}
          <div className="pt-2 mt-auto border-t border-cyan-500/20 flex flex-col gap-2">
            <button
              onClick={() => openManualForm()}
              className="w-full py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-900/90 text-xs font-orbitron font-bold flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,242,255,0.2)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 font-black" />
              <span>CUSTOM DIRECTIVE</span>
            </button>
          </div>
        </aside>

        {/* CENTER COLUMN: SEARCH & DIRECTIVES MATRIX */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#010714]/60 overflow-hidden">
          
          {/* Matrix Search & Controls Bar */}
          <div className="px-6 py-3 border-b border-cyan-500/20 bg-[#020b1a]/90 flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search directives by title, description or tag..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-slate-200 placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">
                Displaying <span className="text-cyan-300 font-bold">{filteredTasks.length}</span> items
              </span>
              {stats.completed > 0 && (
                <button
                  onClick={() => {
                    taskManager.clearCompletedTasks();
                    refreshTasks();
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-orbitron uppercase text-slate-400 hover:text-rose-300 border border-transparent hover:border-rose-500/30 hover:bg-rose-950/20 transition-all cursor-pointer"
                >
                  Purge Completed
                </button>
              )}
            </div>
          </div>

          {/* Task Directives Scrollable List */}
          <div className="flex-1 p-6 overflow-y-auto custom-scroll space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-72 text-center text-slate-400 font-mono text-xs border border-dashed border-cyan-500/20 rounded-3xl p-8 bg-slate-950/20">
                <CheckSquare className="w-12 h-12 text-cyan-500/40 mb-3 stroke-[1.5]" />
                <p className="text-slate-200 font-orbitron text-sm font-bold">NO DIRECTIVES IN THIS VIEW</p>
                <p className="text-slate-500 text-xs mt-1 max-w-sm">
                  All temporal schedules are fulfilled or no directives match the active filters.
                </p>
                <button
                  onClick={() => openManualForm()}
                  className="mt-4 px-4 py-2 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 text-xs font-orbitron font-bold hover:bg-cyan-900 shadow-[0_0_15px_rgba(0,242,255,0.3)] transition-all cursor-pointer"
                >
                  + CREATE NEW DIRECTIVE
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const dueInfo = formatDueTime(task.due_time);
                const isCompleted = task.status === 'completed';
                const isSelected = selectedTask?.id === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      playSound(600, 'sine', 0.03);
                    }}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isCompleted
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-90'
                        : isSelected
                        ? 'bg-[#031d3d]/90 border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.25)] ring-1 ring-cyan-400'
                        : dueInfo?.isPast
                        ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-[#021226]/80 border-cyan-500/25 hover:border-cyan-400/70 hover:bg-[#031836] hover:shadow-[0_0_18px_rgba(0,242,255,0.12)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3.5">
                      {/* Checkbox Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-cyan-300 transition-transform active:scale-90 shrink-0 cursor-pointer"
                        title={isCompleted ? 'Mark Active' : 'Mark Completed'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950/80 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors" />
                        )}
                      </button>

                      {/* Directive Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-sm font-semibold tracking-wide ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {task.title}
                          </span>

                          {/* Priority Pill */}
                          <span className={`text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>

                          {/* Recurrence Pill */}
                          {task.recurrence && task.recurrence !== 'none' && (
                            <span className="inline-flex items-center gap-1 text-[8.5px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                              <Repeat className="w-2.5 h-2.5" />
                              {task.recurrence}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-slate-400 font-sans line-clamp-2 leading-relaxed mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400">
                          {dueInfo && (
                            <div className={`flex items-center gap-1.5 ${dueInfo.isPast && !isCompleted ? 'text-rose-400 font-bold animate-pulse' : 'text-cyan-300/90'}`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{dueInfo.relative} ({dueInfo.full})</span>
                            </div>
                          )}

                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-slate-500" />
                              {task.tags.map(t => (
                                <span key={t} className="text-slate-400 hover:text-cyan-300">#{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons on Hover/Focus */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Snooze +1h */}
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => handleSnoozeTask(task, 60, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
                            title="Snooze +1 Hour"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openManualForm(task);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 transition-colors cursor-pointer"
                          title="Edit Directive"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* JARVIS Execute */}
                        {onAskJarvisTask && !isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound(1200, 'sine', 0.1);
                              onAskJarvisTask(`Execute directive: "${task.title}". ${task.description || ''}`);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400 text-[9px] font-orbitron font-extrabold text-cyan-200 hover:shadow-[0_0_12px_rgba(0,242,255,0.5)] transition-all cursor-pointer"
                            title="Command JARVIS AI to analyze/execute directive"
                          >
                            JARVIS EXEC
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Delete Directive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* RIGHT INSPECTOR PANE: SELECTED DIRECTIVE TELEMETRY */}
        {selectedTask ? (
          <aside className="w-80 sm:w-96 bg-[#020b1c]/90 border-l border-cyan-500/20 p-5 flex flex-col justify-between shrink-0 overflow-y-auto custom-scroll animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <span className="text-[10px] font-orbitron font-extrabold text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  DIRECTIVE INSPECTOR
                </span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-slate-400 hover:text-cyan-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(selectedTask.priority)}`}>
                  {selectedTask.priority} PRIORITY
                </span>
                <h3 className="text-base font-orbitron font-bold text-slate-100 mt-2 leading-snug">
                  {selectedTask.title}
                </h3>
              </div>

              {selectedTask.description && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block mb-1">EXECUTION INSTRUCTIONS</span>
                  <p className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Due Date Details */}
              {selectedTask.due_time && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase block">SCHEDULED TEMPORAL TARGET</span>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{new Date(selectedTask.due_time).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block mb-1.5">ASSIGNED TAGS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTask.tags.map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* JARVIS AI Assistance Options */}
              {onAskJarvisTask && (
                <div className="p-3 rounded-2xl bg-gradient-to-b from-cyan-950/50 to-blue-950/30 border border-cyan-500/40 space-y-2">
                  <span className="text-[10px] font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                    JARVIS COGNITIVE ACTIONS
                  </span>
                  <button
                    onClick={() => {
                      playSound(1200, 'sine', 0.1);
                      onAskJarvisTask(`Analyze this task and generate an actionable plan: "${selectedTask.title}". ${selectedTask.description || ''}`);
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-xs font-orbitron font-bold hover:bg-cyan-500/30 transition-all text-left px-3 flex items-center justify-between cursor-pointer"
                  >
                    <span>Generate Execution Plan</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      playSound(1200, 'sine', 0.1);
                      onAskJarvisTask(`Execute directive: "${selectedTask.title}". ${selectedTask.description || ''}`);
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-xs font-orbitron font-extrabold shadow-[0_0_15px_rgba(0,242,255,0.5)] transition-all text-left px-3 flex items-center justify-between cursor-pointer"
                  >
                    <span>Execute with JARVIS</span>
                    <Play className="w-3.5 h-3.5 fill-black" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-cyan-500/20 flex gap-2">
              <button
                onClick={() => openManualForm(selectedTask)}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-orbitron font-bold cursor-pointer"
              >
                Edit Task
              </button>
              <button
                onClick={() => handleToggleComplete(selectedTask)}
                className="flex-1 py-2 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-200 text-xs font-orbitron font-bold hover:bg-cyan-900 cursor-pointer"
              >
                {selectedTask.status === 'completed' ? 'Reopen' : 'Complete'}
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      {/* 4. FULL MANUAL DIRECTIVE BUILDER MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#020d20] border border-cyan-500/40 shadow-[0_0_60px_rgba(0,242,255,0.25)] overflow-hidden text-slate-100 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/25 bg-[#03152e]/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="font-orbitron font-extrabold text-sm tracking-wider text-cyan-200">
                  {editingTaskId ? 'UPDATE TASK DIRECTIVE' : 'MANUAL DIRECTIVE BUILDER'}
                </h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveManualForm} className="flex-1 p-6 overflow-y-auto custom-scroll space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Directive Title / Goal *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Recalibrate neural perception models..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-slate-100 placeholder:text-slate-500 text-sm font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Priority & Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPriority(p)}
                        className={`py-2 rounded-xl text-[10px] font-orbitron font-bold uppercase transition-all border cursor-pointer ${
                          formPriority === p
                            ? getPriorityBadgeClass(p) + ' ring-1 ring-cyan-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                    Recurrence Cycle
                  </label>
                  <select
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as TaskRecurrence)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="none">One-time Directive</option>
                    <option value="daily">Daily Loop</option>
                    <option value="weekly">Weekly Cycle</option>
                    <option value="monthly">Monthly Routine</option>
                  </select>
                </div>
              </div>

              {/* Due Date Preset Options */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Scheduled Due Time Target
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2.5">
                  {[
                    { id: 'none', label: 'No Due Date' },
                    { id: '15m', label: '+15 Mins' },
                    { id: '1hr', label: '+1 Hour' },
                    { id: 'tonight', label: 'Tonight (8 PM)' },
                    { id: 'tomorrow', label: 'Tomorrow (9 AM)' },
                    { id: 'custom', label: 'Custom Picker' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormDuePreset(preset.id as any)}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-mono border transition-all cursor-pointer ${
                        formDuePreset === preset.id
                          ? 'bg-cyan-950 text-cyan-200 border-cyan-400 font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {formDuePreset === 'custom' && (
                  <div className="flex gap-2 p-3 rounded-2xl bg-slate-900/70 border border-cyan-500/30">
                    <div className="flex-1">
                      <label className="text-[9px] font-mono text-slate-400 block mb-1">Target Date</label>
                      <input
                        type="date"
                        value={formCustomDate}
                        onChange={(e) => setFormCustomDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-slate-100 text-xs font-mono"
                      />
                    </div>
                    <div className="w-36">
                      <label className="text-[9px] font-mono text-slate-400 block mb-1">Target Time</label>
                      <input
                        type="time"
                        value={formCustomTime}
                        onChange={(e) => setFormCustomTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/40 text-slate-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Contextual Instructions & Notes (Optional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detailed execution parameters, logs or steps..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-slate-100 placeholder:text-slate-500 text-xs font-sans focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Tags & Taxonomy
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formTagInput}
                    onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (formTagInput.trim() && !formTags.includes(formTagInput.trim())) {
                          setFormTags([...formTags, formTagInput.trim().toLowerCase()]);
                          setFormTagInput('');
                        }
                      }
                    }}
                    placeholder="Type tag and press Enter..."
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-slate-100 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formTagInput.trim() && !formTags.includes(formTagInput.trim())) {
                        setFormTags([...formTags, formTagInput.trim().toLowerCase()]);
                        setFormTagInput('');
                      }
                    }}
                    className="px-4 py-1.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 text-xs font-orbitron font-bold cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {formTags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                      #{t}
                      <button
                        type="button"
                        onClick={() => setFormTags(formTags.filter(tag => tag !== t))}
                        className="hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-cyan-500/20">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-orbitron font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black font-orbitron font-black text-xs shadow-[0_0_20px_rgba(0,242,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {editingTaskId ? 'SAVE DIRECTIVE' : 'COMMIT DIRECTIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. BOTTOM FOOTER TELEMETRY STATUS */}
      <footer className="px-6 py-2.5 border-t border-cyan-500/20 bg-[#020a1a] flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SCHEDULER ENGINE: ONLINE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span>Background Scan: 10s Frequency</span>
          <span className="text-slate-600">|</span>
          <span>Storage: Persistent Local Key ('jarvis_tasks_v2')</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-orbitron text-xs font-bold hover:bg-cyan-900 hover:border-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
          >
            DISMISS HUD
          </button>
        </div>
      </footer>
    </div>
  );
};

export default TaskPanel;
