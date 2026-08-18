import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Pin, MessageSquare, Trash2, ChevronRight, FileText, Zap, Shield, Sparkles, X, Copy, Download, Check,
  Star, Brain, Code, Globe, Mic, Folder, Activity, BarChart2, Share2, Network, Eye, Clock, ListFilter, Tag, Cpu,
  Layers, AlertTriangle, CheckCircle2, FileCode, ImageIcon, ExternalLink, Printer, User, Bot, RefreshCw, Send
} from 'lucide-react';
import { ChatSession, LogEntry, ConversationMessage, ConversationRole } from '../types';

interface ChatHistoryPanelProps {
  isVisible: boolean;
  activeSessionId: string | null;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onTogglePin?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  onClose?: () => void;
  activeLogs?: LogEntry[];
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ 
  isVisible, 
  activeSessionId, 
  sessions,
  onSelectSession, 
  onNewChat,
  onTogglePin,
  onToggleFavorite,
  onDeleteSession,
  onClose,
  activeLogs = [],
  theme = 'cyber'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showNeuralGraphModal, setShowNeuralGraphModal] = useState(false);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);
  const [favoritesMap, setFavoritesMap] = useState<{ [id: string]: boolean }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  // Toggle favorite locally if no external prop provided
  const handleToggleFavorite = (id: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    } else {
      setFavoritesMap(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const isSessionFavorite = (session: ChatSession) => {
    if (session.isFavorite !== undefined) return session.isFavorite;
    return !!favoritesMap[session.session_id];
  };

  // Helper: Format time
  const formatLogTime = (timestamp: number | string) => {
    if (!timestamp) return new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDateCreated = (timestamp: number | string) => {
    if (!timestamp) return new Date().toLocaleString();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return new Date().toLocaleString();
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour12: false, minute: '2-digit' });
  };

  // Category Detection Helper
  const getSessionCategory = (s: ChatSession) => {
    if (s.category) return s.category;
    const titleLower = s.title.toLowerCase();
    const previewLower = (s.last_message_preview || '').toLowerCase();
    if (titleLower.includes('code') || titleLower.includes('script') || previewLower.includes('const ') || previewLower.includes('function')) return 'coding';
    if (titleLower.includes('voice') || titleLower.includes('speak') || titleLower.includes('speech')) return 'voice';
    if (titleLower.includes('memory') || titleLower.includes('graph') || titleLower.includes('remember')) return 'memory';
    if (titleLower.includes('web') || titleLower.includes('browse') || titleLower.includes('http')) return 'browser';
    if (titleLower.includes('workflow') || titleLower.includes('auto') || titleLower.includes('cron')) return 'automation';
    if (titleLower.includes('research') || titleLower.includes('find') || titleLower.includes('search')) return 'research';
    if (titleLower.includes('file') || titleLower.includes('doc') || titleLower.includes('data')) return 'file';
    return 'neural';
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'coding':
        return { label: 'Coding', icon: Code, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'voice':
        return { label: 'Voice', icon: Mic, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'memory':
        return { label: 'Memory', icon: Brain, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'browser':
        return { label: 'Browser', icon: Globe, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'automation':
        return { label: 'Automation', icon: Zap, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'file':
        return { label: 'File System', icon: Folder, color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' };
      case 'research':
        return { label: 'Research', icon: Search, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      default:
        return { label: 'Neural AI', icon: Cpu, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
  };

  // Filter & Search Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = searchQuery === '' || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.last_message_preview && s.last_message_preview.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      const cat = getSessionCategory(s);
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'pinned') return s.isPinned;
      if (selectedFilter === 'favorites') return isSessionFavorite(s);
      return cat === selectedFilter;
    });
  }, [sessions, searchQuery, selectedFilter, favoritesMap]);

  // Timeline Grouping
  const grouped = useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = { 
      'Pinned History': [], 
      'Starred Favorites': [],
      'Today': [], 
      'Yesterday': [],
      'Last Week': [],
      'Older History': [] 
    };

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const lastWeekCutoff = new Date(now);
    lastWeekCutoff.setDate(now.getDate() - 7);

    filteredSessions.forEach(s => {
      let d = new Date(s.timestamp_last_message || s.timestamp_created);
      if (isNaN(d.getTime())) d = new Date();

      if (s.isPinned) {
        groups['Pinned History'].push(s);
      } else if (isSessionFavorite(s)) {
        groups['Starred Favorites'].push(s);
      } else if (d.toDateString() === todayStr) {
        groups['Today'].push(s);
      } else if (d.toDateString() === yesterdayStr) {
        groups['Yesterday'].push(s);
      } else if (d >= lastWeekCutoff) {
        groups['Last Week'].push(s);
      } else {
        groups['Older History'].push(s);
      }
    });

    return groups;
  }, [filteredSessions, favoritesMap]);

  if (!isVisible) return null;

  const currentSession = sessions.find(s => s.session_id === activeSessionId) || sessions[0];

  // STRICT ARCHIVE CONVERSATION EXTRACTOR:
  // ONLY extracts USER (OPERATOR) and JARVIS messages.
  // Filters out SYSTEM messages, diagnostics, telemetry, EventBus logs, debug logs.
  const conversationMessages: ConversationMessage[] = useMemo(() => {
    if (!currentSession) return [];

    // If session has structured `messages`, use those directly
    if (Array.isArray(currentSession.messages) && currentSession.messages.length > 0) {
      return currentSession.messages.filter(m => m && (m.role === 'USER' || m.role === 'JARVIS'));
    }

    // Otherwise derive from raw logs or active logs
    const rawLogs = currentSession.logs || (activeSessionId === currentSession.session_id ? activeLogs : []);
    if (!Array.isArray(rawLogs)) return [];

    const systemFilterPatterns = [
      '● session [',
      '⚡ workflow',
      '✓ workflow',
      '! workflow',
      '⌬ system',
      'subsystem diagnostic',
      '● new neural session',
      '● neural cache purged',
      'logger.entry',
      'telemetry',
      'diagnostic normal',
      'cpu ',
      'memory '
    ];

    return rawLogs
      .filter(log => {
        if (!log || typeof log.message !== 'string') return false;
        const msg = log.message.trim();
        if (!msg || msg === 'undefined' || msg === 'null') return false;

        // STRICT ROLE FILTER: Only OPERATOR / USER or JARVIS are conversation
        const isUser = log.source === 'OPERATOR' || (log as any).role === 'USER';
        const isJarvis = log.source === 'JARVIS' || (log as any).role === 'JARVIS';
        if (!isUser && !isJarvis) return false;

        // Extra guard: Check if message starts with internal system telemetry markers
        const lower = msg.toLowerCase();
        for (const pattern of systemFilterPatterns) {
          if (lower.startsWith(pattern)) return false;
        }

        return true;
      })
      .map((log, index) => {
        let validTs = Date.now();
        if (log.timestamp) {
          const parsed = new Date(log.timestamp).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            validTs = parsed;
          }
        }

        const isUser = log.source === 'OPERATOR' || (log as any).role === 'USER';

        return {
          sessionId: currentSession.session_id,
          messageId: log.id || `msg_${index}_${validTs}`,
          role: (isUser ? 'USER' : 'JARVIS') as ConversationRole,
          content: log.message.trim(),
          timestamp: validTs
        };
      });
  }, [currentSession, activeSessionId, activeLogs]);

  // Overall Statistics Metrics (calculated on actual conversational exchanges)
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalConversations = sessions.reduce((acc, s) => {
      if (s.messages && s.messages.length > 0) return acc + s.messages.length;
      if (s.logs && s.logs.length > 0) {
        return acc + s.logs.filter(l => l.source === 'OPERATOR' || l.source === 'JARVIS').length;
      }
      return acc + (s.messageCount || 0);
    }, 0);
    const totalPinned = sessions.filter(s => s.isPinned).length;
    const totalStarred = sessions.filter(s => isSessionFavorite(s)).length;
    return { totalSessions, totalConversations, totalPinned, totalStarred };
  }, [sessions, favoritesMap]);

  // Copy Full Conversation Transcript Handler
  const handleCopyTranscript = () => {
    if (!currentSession || conversationMessages.length === 0) return;
    const text = conversationMessages.map(m => {
      const roleLabel = m.role === 'USER' ? 'USER' : 'JARVIS';
      return `[${roleLabel}] (${formatLogTime(m.timestamp)}):\n${m.content}\n`;
    }).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(currentSession.session_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Single Message Handler
  const handleCopySingleMessage = (msg: ConversationMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.messageId);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  // Export Format Handlers
  const exportSession = (format: 'json' | 'md' | 'html' | 'txt') => {
    if (!currentSession || conversationMessages.length === 0) return;
    setShowExportMenu(false);

    let content = '';
    let mimeType = 'text/plain';
    const filename = `jarvis_conversation_${currentSession.session_id}.${format}`;

    if (format === 'json') {
      const exportData = {
        sessionId: currentSession.session_id,
        title: currentSession.title,
        created: formatDateCreated(currentSession.timestamp_created),
        mode: currentSession.mode,
        messagesCount: conversationMessages.length,
        messages: conversationMessages
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
    } else if (format === 'md') {
      content = `# JARVIS Conversation Archive\n**Session Title:** ${currentSession.title}\n**Session ID:** ${currentSession.session_id}\n**Date:** ${formatDateCreated(currentSession.timestamp_created)}\n**System Mode:** ${currentSession.mode}\n**Exchanges:** ${conversationMessages.length}\n\n---\n\n` +
        conversationMessages.map(m => `### ${m.role === 'USER' ? '👤 USER' : '🤖 JARVIS'} (${formatLogTime(m.timestamp)})\n\n${m.content}\n\n`).join('---\n\n');
      mimeType = 'text/markdown';
    } else if (format === 'html') {
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${currentSession.title} - JARVIS Conversation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #030816; color: #e2e8f0; padding: 2.5rem; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 2px solid #00f2ff; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    .title { color: #00f2ff; margin: 0; font-size: 1.75rem; font-family: monospace; letter-spacing: 0.05em; }
    .meta { color: #94a3b8; font-size: 0.85rem; margin-top: 0.5rem; font-family: monospace; }
    .msg-card { padding: 1.25rem; margin-bottom: 1.25rem; border-radius: 12px; border: 1px solid #1e293b; }
    .user-card { background: #0b1528; border-left: 4px solid #38bdf8; }
    .jarvis-card { background: #041224; border-left: 4px solid #00f2ff; }
    .msg-header { font-weight: bold; font-size: 0.8rem; margin-bottom: 0.6rem; display: flex; justify-content: space-between; font-family: monospace; }
    .user-header { color: #38bdf8; }
    .jarvis-header { color: #00f2ff; }
    .message-text { white-space: pre-wrap; margin: 0; font-size: 0.95rem; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">⌬ JARVIS CONVERSATION ARCHIVE: ${currentSession.title}</h1>
    <div class="meta">Session ID: ${currentSession.session_id} | Mode: ${currentSession.mode} | Created: ${formatDateCreated(currentSession.timestamp_created)} | Total Messages: ${conversationMessages.length}</div>
  </div>
  ${conversationMessages.map(m => `
    <div class="msg-card ${m.role === 'USER' ? 'user-card' : 'jarvis-card'}">
      <div class="msg-header ${m.role === 'USER' ? 'user-header' : 'jarvis-header'}">
        <span>${m.role === 'USER' ? '◆ USER' : '◈ JARVIS'}</span>
        <span>${formatLogTime(m.timestamp)}</span>
      </div>
      <p class="message-text">${m.content}</p>
    </div>
  `).join('')}
</body>
</html>`;
      mimeType = 'text/html';
    } else if (format === 'txt') {
      content = `====================================================\nJARVIS CONVERSATIONAL TRANSCRIPT ARCHIVE\nTitle: ${currentSession.title}\nID: ${currentSession.session_id}\nCreated: ${formatDateCreated(currentSession.timestamp_created)}\nTotal Messages: ${conversationMessages.length}\n====================================================\n\n` +
        conversationMessages.map(m => `[${formatLogTime(m.timestamp)}] ${m.role === 'USER' ? 'USER' : 'JARVIS'}:\n${m.content}\n`).join('\n----------------------------------------------------\n\n');
      mimeType = 'text/plain';
    }

    const dataStr = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPDF = () => {
    if (!currentSession || conversationMessages.length === 0) return;
    setShowExportMenu(false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentSession.title} - Conversation Transcript</title>
          <style>
            body { font-family: monospace; padding: 25px; background: #fff; color: #111; max-width: 850px; margin: 0 auto; }
            h1 { font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 4px; }
            .meta-info { font-size: 11px; color: #555; margin-bottom: 20px; }
            .entry { margin-bottom: 16px; padding: 10px; border-radius: 6px; border: 1px solid #ddd; }
            .user-entry { background: #f0f7ff; border-left: 4px solid #0066cc; }
            .jarvis-entry { background: #f4faf9; border-left: 4px solid #00a896; }
            .meta { font-weight: bold; font-size: 11px; margin-bottom: 6px; display: flex; justify-content: space-between; }
            .msg { font-size: 12px; white-space: pre-wrap; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>JARVIS CONVERSATION ARCHIVE: ${currentSession.title}</h1>
          <div class="meta-info">Session ID: ${currentSession.session_id} | Created: ${formatDateCreated(currentSession.timestamp_created)} | Total Messages: ${conversationMessages.length}</div>
          ${conversationMessages.map(m => `
            <div class="entry ${m.role === 'USER' ? 'user-entry' : 'jarvis-entry'}">
              <div class="meta">
                <span>${m.role === 'USER' ? 'USER' : 'JARVIS'}</span>
                <span>${formatLogTime(m.timestamp)}</span>
              </div>
              <div class="msg">${m.content}</div>
            </div>
          `).join('')}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // AI Memory Links
  const memoryTags = useMemo(() => {
    if (currentSession?.tags && currentSession.tags.length > 0) {
      return currentSession.tags;
    }
    const defaults = ['#ConversationHistory', '#AIInteraction', '#NeuralMemory', '#AutonomousOS'];
    if (currentSession?.title.toLowerCase().includes('voice')) defaults.push('#VoiceSynthesizer');
    if (currentSession?.title.toLowerCase().includes('code')) defaults.push('#TypeScript', '#FullStack');
    return defaults;
  }, [currentSession]);

  const totalWords = useMemo(() => {
    return conversationMessages.reduce((acc, m) => acc + m.content.split(/\s+/).filter(Boolean).length, 0);
  }, [conversationMessages]);

  const estimatedReadingTime = Math.max(1, Math.ceil(totalWords / 180));

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-3.5 overflow-hidden relative font-sans text-slate-100 select-none">
      
      {/* LEFT COLUMN: Archives List, Timeline & Filters */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 rounded-2xl border overflow-hidden p-3.5 space-y-2.5 transition-all duration-300 ${
        isSlate
          ? 'bg-zinc-900/80 border-slate-800/80 text-slate-200 shadow-xl'
          : isMinimal
            ? 'bg-[#0f172a]/80 border-emerald-500/15 text-slate-100 shadow-xl'
            : isGold
              ? 'bg-[#181310]/80 border-amber-500/15 text-amber-100 shadow-xl'
              : 'bg-[#040a17]/80 border-cyan-500/15 text-slate-100 shadow-[0_0_20px_rgba(0,242,255,0.05)]'
      }`}>
        
        {/* Statistics Header Bar */}
        <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/50 border border-white/5 text-center text-[9px] font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[8px] uppercase">Archives</span>
            <span className="text-cyan-300 font-bold font-orbitron">{stats.totalSessions}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[8px] uppercase">Exchanges</span>
            <span className="text-blue-300 font-bold font-orbitron">{stats.totalConversations}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[8px] uppercase">Starred</span>
            <span className="text-amber-300 font-bold font-orbitron">{stats.totalStarred}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[8px] uppercase">Pinned</span>
            <span className="text-purple-300 font-bold font-orbitron">{stats.totalPinned}</span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onNewChat}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 font-orbitron text-[10px] tracking-wider transition-all group font-bold rounded-xl active:scale-[0.98] ${
              isSlate
                ? 'bg-zinc-800 hover:bg-zinc-700 border border-slate-600 text-zinc-100 shadow-md'
                : 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform text-cyan-400" />
            <span>NEW CONVERSATION</span>
          </button>

          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-all"
            title="Session Analytics & AI Usage"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowNeuralGraphModal(true)}
            className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-all"
            title="Conversation Knowledge Graph"
          >
            <Network className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Input with Live Search Indicator */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search conversation archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Smart Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1 pt-0.5 text-[9.5px] font-mono">
          {[
            { id: 'all', label: 'All', icon: Layers },
            { id: 'pinned', label: 'Pinned', icon: Pin },
            { id: 'favorites', label: 'Starred', icon: Star },
            { id: 'coding', label: 'Coding', icon: Code },
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'memory', label: 'Memory', icon: Brain },
            { id: 'browser', label: 'Browser', icon: Globe },
            { id: 'automation', label: 'Auto', icon: Zap },
          ].map(f => {
            const Icon = f.icon;
            const active = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap shrink-0 ${
                  active 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,242,255,0.2)]' 
                    : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grouped Session Cards List */}
        <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1">
          {(Object.entries(grouped) as [string, ChatSession[]][]).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="space-y-1.5">
                <div className="flex items-center justify-between px-1 pt-1">
                  <h3 className="text-[9px] font-orbitron text-slate-400 tracking-[0.2em] uppercase font-bold flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{groupName}</span>
                  </h3>
                  <span className="text-[8.5px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.2 rounded-full">
                    {items.length}
                  </span>
                </div>

                {items.map((session) => {
                  const isActive = currentSession?.session_id === session.session_id;
                  const cat = getSessionCategory(session);
                  const catConfig = getCategoryConfig(cat);
                  const CatIcon = catConfig.icon;
                  const isFav = isSessionFavorite(session);

                  return (
                    <div 
                      key={session.session_id}
                      onClick={() => onSelectSession(session.session_id)}
                      onMouseEnter={() => setHoveredSessionId(session.session_id)}
                      onMouseLeave={() => setHoveredSessionId(null)}
                      className={`group relative p-3 rounded-xl transition-all duration-300 border cursor-pointer select-none ${
                        isActive 
                          ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_20px_rgba(0,242,255,0.25)] ring-1 ring-cyan-400/50 scale-[1.01]' 
                          : 'bg-black/40 border-white/5 hover:border-cyan-500/40 hover:bg-white/5'
                      }`}
                    >
                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[8.5px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/40 shadow-[0_0_8px_rgba(0,242,255,0.4)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                          <span>ACTIVE</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <div className={`p-1 rounded-md border ${catConfig.color} shrink-0`}>
                            <CatIcon className="w-3 h-3" />
                          </div>
                          
                          <h4 className={`text-xs font-semibold truncate ${isActive ? 'text-cyan-200 font-bold' : 'text-slate-200'}`}>
                            {session.title}
                          </h4>
                        </div>
                        
                        {/* Actions (Star, Pin, Delete) */}
                        <div className={`flex items-center gap-1 ${isActive ? 'mr-16' : ''}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(session.session_id);
                            }}
                            className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'}`}
                            title={isFav ? "Remove Star" : "Star Favorite"}
                          >
                            <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>

                          {onTogglePin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(session.session_id);
                              }}
                              className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${session.isPinned ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-300'}`}
                              title={session.isPinned ? "Unpin session" : "Pin session"}
                            >
                              <Pin className={`w-3 h-3 ${session.isPinned ? 'fill-cyan-400' : ''}`} />
                            </button>
                          )}

                          {onDeleteSession && sessions.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.session_id);
                              }}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                              title="Delete conversation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-300 font-sans leading-snug line-clamp-2 bg-black/40 p-1.5 rounded-lg border border-white/5 my-1.5">
                        {session.last_message_preview || "Conversation initialized."}
                      </p>

                      <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400/90 font-bold uppercase">
                            {session.mode}
                          </span>
                          <span className="text-slate-400">
                            {session.messages?.length || session.messageCount || 0} msgs
                          </span>
                        </div>
                        <span>{formatLogTime(session.timestamp_last_message)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Full Conversational Stage (USER ↔ JARVIS Only) */}
      <div className={`flex-1 flex flex-col rounded-2xl border overflow-hidden p-4 relative transition-all duration-300 ${
        isSlate
          ? 'bg-zinc-900/80 border-slate-800/80 text-slate-100 shadow-xl'
          : isMinimal
            ? 'bg-[#0f172a]/80 border-emerald-500/15 text-slate-100 shadow-xl'
            : isGold
              ? 'bg-[#181310]/80 border-amber-500/15 text-amber-100 shadow-xl'
              : 'bg-[#040a17]/80 border-cyan-500/15 text-slate-100 shadow-[0_0_25px_rgba(0,242,255,0.06)]'
      }`}>
        {currentSession ? (
          <>
            {/* Conversational Header Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-500/15 border border-cyan-400/40 rounded-xl text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.2)]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-orbitron font-bold text-cyan-300 tracking-wide flex items-center gap-2">
                    <span>{currentSession.title}</span>
                    <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase">
                      {currentSession.mode} MODE
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                    <span>ID: {currentSession.session_id}</span>
                    <span>•</span>
                    <span>Created: {formatDateCreated(currentSession.timestamp_created)}</span>
                    <span>•</span>
                    <span className="text-cyan-300">{conversationMessages.length} Conversational Messages</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Copy Transcript & Multi-Format Export */}
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={handleCopyTranscript}
                  disabled={conversationMessages.length === 0}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 text-xs font-mono font-bold transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy Full Conversation Transcript"
                >
                  {copiedId === currentSession.session_id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  )}
                  <span>{copiedId === currentSession.session_id ? 'COPIED!' : 'COPY TRANSCRIPT'}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={conversationMessages.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-xs font-mono font-bold transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT</span>
                  </button>

                  {/* Multi-Format Export Dropdown */}
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-52 p-2 bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl z-50 flex flex-col gap-1 text-xs font-mono backdrop-blur-xl animate-in fade-in duration-150">
                      <button onClick={() => exportSession('json')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left">
                        <FileCode className="w-3.5 h-3.5 text-amber-400" /> Export JSON (.json)
                      </button>
                      <button onClick={() => exportSession('md')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left">
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> Export Markdown (.md)
                      </button>
                      <button onClick={() => exportSession('html')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" /> Export HTML (.html)
                      </button>
                      <button onClick={() => exportSession('txt')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left">
                        <Tag className="w-3.5 h-3.5 text-slate-400" /> Plain Text (.txt)
                      </button>
                      <button onClick={handlePrintPDF} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left border-t border-white/10 pt-1.5">
                        <Printer className="w-3.5 h-3.5 text-purple-400" /> Print / PDF View
                      </button>
                    </div>
                  )}
                </div>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-white transition-all ml-1"
                    title="Close Archives"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Stats Subheader */}
            <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs font-sans text-slate-300 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                <span className="text-[11px] font-mono text-cyan-200">
                  Clean User ↔ JARVIS Communication History (Zero System / Diagnostic Clutter)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9.5px] font-mono text-cyan-400/80">
                <span className="bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  📝 {totalWords} words
                </span>
                <span className="bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                  ⏱ {estimatedReadingTime} min read
                </span>
              </div>
            </div>

            {/* Conversational Stream Area (Strictly User ↔ JARVIS Messages) */}
            <div className="flex-1 overflow-y-auto custom-scroll space-y-4 pr-2">
              {conversationMessages.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
                  <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <MessageSquare className="w-8 h-8 opacity-60 animate-pulse" />
                  </div>
                  <span className="text-slate-400 font-bold">No conversation exchanges in this session yet.</span>
                  <span className="text-[11px] text-slate-500">Send a text command or speak with JARVIS to record messages.</span>
                </div>
              ) : (
                conversationMessages.map((msg, idx) => {
                  const isUser = msg.role === 'USER';
                  const isJarvis = msg.role === 'JARVIS';

                  return (
                    <div 
                      key={msg.messageId || idx}
                      className={`flex flex-col transition-all duration-200 ${
                        isUser ? 'items-end pl-8 sm:pl-16' : 'items-start pr-8 sm:pr-16'
                      }`}
                    >
                      {/* Message Bubble Card */}
                      <div 
                        className={`w-full max-w-4xl p-4 rounded-2xl border relative group/msg transition-all duration-300 ${
                          isUser
                            ? 'bg-[#08152c]/90 border-blue-500/40 text-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.1)] rounded-tr-sm'
                            : 'bg-[#040f21]/90 border-cyan-500/40 text-cyan-50 shadow-[0_0_25px_rgba(0,242,255,0.12)] rounded-tl-sm'
                        }`}
                      >
                        {/* Card Header with Role Badge, Time & Copy Action */}
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-[10px] font-orbitron font-bold">
                          <div className="flex items-center gap-2">
                            {isUser ? (
                              <span className="px-2.5 py-0.5 rounded-full border border-blue-400/50 bg-blue-500/20 text-blue-300 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                <User className="w-3 h-3 text-blue-400" />
                                <span>USER</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
                                <Bot className="w-3 h-3 text-cyan-400" />
                                <span>JARVIS</span>
                              </span>
                            )}
                            <span className="font-mono text-slate-400 text-[9.5px]">
                              {formatLogTime(msg.timestamp)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopySingleMessage(msg)}
                            className="opacity-60 group-hover/msg:opacity-100 p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all"
                            title="Copy message text"
                          >
                            {copiedMsgId === msg.messageId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Content text */}
                        <div className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap break-words text-slate-100 selection:bg-cyan-500 selection:text-black">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
            <span>Select an archive session from the left column to inspect conversation history.</span>
          </div>
        )}
      </div>

      {/* SESSION ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-xl p-5 space-y-4 text-slate-100 font-sans shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
                <BarChart2 className="w-5 h-5" />
                <span>CONVERSATION ANALYTICS & TOKENS</span>
              </div>
              <button onClick={() => setShowAnalyticsModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px] font-mono">TOTAL EXCHANGES</div>
                <div className="text-cyan-300 font-orbitron font-bold text-base mt-1">{conversationMessages.length} msgs</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px] font-mono">TOTAL WORDS</div>
                <div className="text-purple-300 font-orbitron font-bold text-base mt-1">{totalWords.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px] font-mono">AI MODEL</div>
                <div className="text-emerald-300 font-orbitron font-bold text-xs mt-1 truncate">{currentSession?.model || 'Gemini 2.5'}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="text-slate-400 text-[10px] font-mono">SYSTEM MODE</div>
                <div className="text-amber-300 font-orbitron font-bold text-xs mt-1">{currentSession?.mode || 'CHILL'}</div>
              </div>
            </div>

            <button onClick={() => setShowAnalyticsModal(false)} className="w-full py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-xl font-orbitron font-bold text-xs hover:bg-cyan-500/30">
              CLOSE ANALYTICS
            </button>
          </div>
        </div>
      )}

      {/* NEURAL RELATIONSHIP GRAPH MODAL */}
      {showNeuralGraphModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-2xl h-[450px] p-5 flex flex-col space-y-3 text-slate-100 font-sans shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
                <Network className="w-5 h-5 text-purple-400 animate-spin" />
                <span>CONVERSATION KNOWLEDGE GRAPH</span>
              </div>
              <button onClick={() => setShowNeuralGraphModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-black/60 border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.08)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute p-3 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs shadow-[0_0_20px_rgba(0,242,255,0.4)] animate-pulse">
                  JARVIS CONVERSATION CORE
                </div>

                <div className="absolute top-8 left-12 p-2 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 text-[10px] font-mono">
                  👤 User Directives
                </div>

                <div className="absolute bottom-10 left-16 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono">
                  🤖 JARVIS Responses
                </div>

                <div className="absolute top-10 right-14 p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-mono">
                  🎙️ Voice Interactions
                </div>

                <div className="absolute bottom-8 right-12 p-2 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-300 text-[10px] font-mono">
                  🧠 Quantum Memory Sync
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/30 stroke-1">
                  <line x1="50%" y1="50%" x2="20%" y2="20%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="25%" y2="80%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="80%" y2="25%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="78%" y2="78%" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>Conversational Nodes: {conversationMessages.length} | Synapses Active</span>
              <button onClick={() => setShowNeuralGraphModal(false)} className="px-3 py-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-lg font-orbitron font-bold">
                CLOSE GRAPH
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatHistoryPanel;
