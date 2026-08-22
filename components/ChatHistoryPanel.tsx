import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Pin, MessageSquare, Trash2, ChevronRight, FileText, Zap, Shield, Sparkles, X, Copy, Download, Check,
  Star, Brain, Code, Globe, Mic, Folder, Activity, BarChart2, Share2, Network, Eye, Clock, ListFilter, Tag, Cpu,
  Layers, AlertTriangle, CheckCircle2, FileCode, ImageIcon, ExternalLink, Printer, User, Bot, RefreshCw, Send, RotateCcw,
  ArrowRight, Radio, ShieldCheck
} from 'lucide-react';
import { ChatSession, LogEntry, ConversationMessage, ConversationRole } from '../types';
import { 
  playMechanicalClick, 
  playWhooshSound, 
  playDigitalPingSound, 
  playDirectiveCompleteChime, 
  playArcReactorSound 
} from '../services/soundEffects';

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
  const [favoritesMap, setFavoritesMap] = useState<{ [id: string]: boolean }>({});
  const [quickInputText, setQuickInputText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  // Toggle favorite locally if no external prop provided
  const handleToggleFavorite = (id: string) => {
    playMechanicalClick();
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

  const currentSession = sessions.find(s => s.session_id === activeSessionId) || sessions[0];

  // STRICT ARCHIVE CONVERSATION EXTRACTOR
  const conversationMessages: ConversationMessage[] = useMemo(() => {
    if (!currentSession) return [];

    if (Array.isArray(currentSession.messages) && currentSession.messages.length > 0) {
      return currentSession.messages.filter(m => m && (m.role === 'USER' || m.role === 'JARVIS'));
    }

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

        const isUser = log.source === 'OPERATOR' || (log as any).role === 'USER';
        const isJarvis = log.source === 'JARVIS' || (log as any).role === 'JARVIS';
        if (!isUser && !isJarvis) return false;

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

  // Overall Statistics Metrics
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
    playDirectiveCompleteChime();
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
    playDigitalPingSound();
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.messageId);
    setTimeout(() => setCopiedMsgId(null), 1800);
  };

  // Export Format Handlers
  const exportSession = (format: 'json' | 'md' | 'html' | 'txt') => {
    if (!currentSession || conversationMessages.length === 0) return;
    playArcReactorSound();
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
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #010814; color: #e2e8f0; padding: 2.5rem; line-height: 1.6; max-width: 900px; margin: 0 auto; }
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
    playMechanicalClick();
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

  const handleRefreshCaches = () => {
    playMechanicalClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      playDigitalPingSound();
    }, 600);
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

  const CATEGORY_FILTERS = [
    { id: 'all', label: 'All Sessions', count: sessions.length },
    { id: 'pinned', label: 'Pinned', count: stats.totalPinned },
    { id: 'favorites', label: 'Starred', count: stats.totalStarred },
    { id: 'coding', label: 'Coding', count: sessions.filter(s => getSessionCategory(s) === 'coding').length },
    { id: 'voice', label: 'Voice Mode', count: sessions.filter(s => getSessionCategory(s) === 'voice').length },
    { id: 'memory', label: 'Memory', count: sessions.filter(s => getSessionCategory(s) === 'memory').length },
    { id: 'browser', label: 'Browser & Web', count: sessions.filter(s => getSessionCategory(s) === 'browser').length },
    { id: 'automation', label: 'Automation', count: sessions.filter(s => getSessionCategory(s) === 'automation').length },
    { id: 'research', label: 'Research', count: sessions.filter(s => getSessionCategory(s) === 'research').length },
  ];

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col justify-between p-3 sm:p-4 md:p-5 bg-[#010814]/98 backdrop-blur-3xl animate-in fade-in duration-300 overflow-hidden font-sans select-none text-white max-h-screen no-scrollbar scrollbar-none"
      onClick={onClose}
    >
      {/* Soft Radial Ambient Aura Glows (Matching Weather & Settings Panel) */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/12 blur-3xl pointer-events-none -z-10" />

      {/* 1. TOP STATUS & NAVIGATION HUD (EXACT TASK PANEL TOP BAR STANDARD) */}
      <header 
        onClick={(e) => e.stopPropagation()}
        className="px-6 py-3 border-b border-cyan-500/30 bg-[#031024]/90 backdrop-blur-2xl flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,242,255,0.08)] rounded-2xl mb-2.5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/90 border border-cyan-400/80 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            <MessageSquare className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-orbitron font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-400">
                JARVIS OS CONVERSATION ARCHIVES
              </h1>
              <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/90 border border-cyan-500/50 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {stats.totalSessions} SESSIONS ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>{currentSession ? `Current: ${currentSession.title}` : 'Archive Browser'}</span>
              <span>•</span>
              <span>Vector Search Synced</span>
              <span>•</span>
              <span className="text-cyan-400">{stats.totalMessages} Messages Logged</span>
            </p>
          </div>
        </div>

        {/* Action Header Buttons & Close */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playDigitalPingSound();
              onNewChat();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-orbitron font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black border border-cyan-200 shadow-[0_0_20px_rgba(0,242,255,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>NEW CHAT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playMechanicalClick();
              setShowAnalyticsModal(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border border-cyan-500/20 transition-all cursor-pointer hidden sm:flex"
            title="Session Analytics & AI Usage"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              playMechanicalClick();
              setShowNeuralGraphModal(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer hidden sm:flex"
            title="Conversation Knowledge Graph"
          >
            <Network className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRefreshCaches}
            className={`p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-cyan-300' : ''}`}
            title="Refresh Archives"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={() => { playWhooshSound(); onClose(); }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
              title="Close Archive (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN BODY: 2-COLUMN BALANCED ZERO-OVERFLOW FULL-SCREEN MATRIX */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 my-1 items-stretch min-h-0 overflow-hidden"
      >
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Archives List, Timeline & Filter Hub (4 cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col min-h-0 bg-[#020b18]/80 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl shadow-[0_0_30px_rgba(0,242,255,0.08)] p-3 sm:p-3.5 space-y-3 overflow-hidden">
          
          {/* 4-Metric Telemetry Bar */}
          <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-center shrink-0">
            <div className="flex flex-col p-1 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[8px] font-mono uppercase tracking-wider">ARCHIVES</span>
              <span className="text-cyan-300 font-extrabold font-orbitron text-xs mt-0.5">{stats.totalSessions}</span>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[8px] font-mono uppercase tracking-wider">EXCHANGES</span>
              <span className="text-blue-300 font-extrabold font-orbitron text-xs mt-0.5">{stats.totalConversations}</span>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[8px] font-mono uppercase tracking-wider">STARRED</span>
              <span className="text-amber-300 font-extrabold font-orbitron text-xs mt-0.5">{stats.totalStarred}</span>
            </div>
            <div className="flex flex-col p-1 rounded-lg bg-black/40 border border-white/5">
              <span className="text-slate-400 text-[8px] font-mono uppercase tracking-wider">PINNED</span>
              <span className="text-purple-300 font-extrabold font-orbitron text-xs mt-0.5">{stats.totalPinned}</span>
            </div>
          </div>

          {/* Filter Search Input with Instant Clear */}
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
            <input 
              type="text"
              placeholder="Search conversations, tags, transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#031526]/90 border border-cyan-500/30 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-slate-100 focus:border-cyan-400 focus:outline-none transition-all placeholder:text-slate-500 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1 shrink-0 scrollbar-none">
            {CATEGORY_FILTERS.map(f => {
              const active = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    playMechanicalClick();
                    setSelectedFilter(f.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,255,0.3)]'
                      : 'bg-slate-900/60 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] ${active ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grouped Timeline Session Cards (Scrollable Zero-Overflow) */}
          <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-1">
            {filteredSessions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
                <Search className="w-6 h-6 opacity-40 text-cyan-400" />
                <span>No archives found matching filters.</span>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
                  className="text-cyan-400 underline text-[11px] hover:text-cyan-300 mt-1"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              (Object.entries(grouped) as [string, ChatSession[]][]).map(([groupTitle, groupSessions]) => {
                if (!groupSessions || groupSessions.length === 0) return null;

                return (
                  <div key={groupTitle} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-orbitron font-bold text-cyan-400/80 px-1 pt-1 tracking-wider uppercase">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {groupTitle}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {groupSessions.length} {groupSessions.length === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {groupSessions.map((session) => {
                        const isSelected = activeSessionId === session.session_id;
                        const isFav = isSessionFavorite(session);
                        const cat = getSessionCategory(session);
                        const catConfig = getCategoryConfig(cat);
                        const IconComponent = catConfig.icon;

                        return (
                          <div
                            key={session.session_id}
                            onClick={() => {
                              playMechanicalClick();
                              onSelectSession(session.session_id);
                            }}
                            className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-cyan-950/80 to-[#031526]/90 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,242,255,0.25)] ring-1 ring-cyan-400/50'
                                : 'bg-[#030e1d]/70 hover:bg-[#061830]/80 border-cyan-500/20 hover:border-cyan-400/50 text-slate-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`p-1.5 rounded-lg border shrink-0 ${catConfig.color}`}>
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-orbitron font-bold text-slate-100 truncate group-hover:text-cyan-200 transition-colors">
                                      {session.title}
                                    </h4>
                                    {session.isPinned && (
                                      <Pin className="w-3 h-3 text-purple-400 shrink-0 fill-purple-400" />
                                    )}
                                    {isFav && (
                                      <Star className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                    {session.last_message_preview || 'Transcript recorded.'}
                                  </p>
                                </div>
                              </div>

                              {/* Quick Pin / Star / Delete Actions on Hover */}
                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(session.session_id);
                                  }}
                                  className={`p-1 rounded-md hover:bg-amber-500/20 transition-all ${
                                    isFav ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                                  }`}
                                  title={isFav ? "Remove Favorite" : "Favorite Session"}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                                </button>

                                {onTogglePin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playMechanicalClick();
                                      onTogglePin(session.session_id);
                                    }}
                                    className={`p-1 rounded-md hover:bg-purple-500/20 transition-all ${
                                      session.isPinned ? 'text-purple-400' : 'text-slate-500 hover:text-purple-300'
                                    }`}
                                    title={session.isPinned ? "Unpin Session" : "Pin Session"}
                                  >
                                    <Pin className={`w-3.5 h-3.5 ${session.isPinned ? 'fill-purple-400' : ''}`} />
                                  </button>
                                )}

                                {onDeleteSession && sessions.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playWhooshSound();
                                      onDeleteSession(session.session_id);
                                    }}
                                    className="p-1 rounded-md hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                                    title="Delete Session"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Footer Info */}
                            <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                              <span className="flex items-center gap-1 text-cyan-400/80">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDateCreated(session.timestamp_last_message || session.timestamp_created)}
                              </span>
                              <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-white/5 text-slate-300 font-semibold">
                                {session.messages?.length || session.messageCount || 0} msgs
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Left Column Bottom Status Badge */}
          <div className="p-2 rounded-xl bg-[#010a17]/90 border border-cyan-500/20 text-[10px] font-mono text-slate-300 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              ARCHIVE SECURITY: LEVEL 5
            </span>
            <span className="text-emerald-400 font-bold">ENCRYPTED</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Conversational Workspace Stage (8 cols)    */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 flex flex-col min-h-0 bg-[#020b18]/80 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl shadow-[0_0_30px_rgba(0,242,255,0.08)] p-3 sm:p-4 space-y-3 overflow-hidden">
          
          {currentSession ? (
            <>
              {/* Active Conversation Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-[#031526]/90 via-[#020d1c]/90 to-[#010814]/90 border border-cyan-500/30 shadow-md shrink-0">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-orbitron font-extrabold text-white tracking-wide truncate">
                      {currentSession.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                      MODE: {currentSession.mode || 'DEVELOPER'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {currentSession.session_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 flex-wrap">
                    <span>Created: {formatDateCreated(currentSession.timestamp_created)}</span>
                    <span>•</span>
                    <span className="text-cyan-300">{conversationMessages.length} exchanges</span>
                    <span>•</span>
                    <span className="text-purple-300">{totalWords} words ({estimatedReadingTime} min read)</span>
                  </div>
                </div>

                {/* Right Top Action Bar */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Copy Full Transcript Button */}
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    disabled={conversationMessages.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {copiedId === currentSession.session_id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === currentSession.session_id ? 'COPIED!' : 'COPY TRANSCRIPT'}</span>
                  </button>

                  {/* Multi-Format Export Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        playMechanicalClick();
                        setShowExportMenu(!showExportMenu);
                      }}
                      disabled={conversationMessages.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-mono font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT</span>
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-2 w-52 p-2 bg-[#020b18] border border-cyan-500/40 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(0,242,255,0.2)] z-50 flex flex-col gap-1 text-xs font-mono backdrop-blur-2xl animate-in fade-in duration-150">
                        <button onClick={() => exportSession('json')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left transition-all">
                          <FileCode className="w-3.5 h-3.5 text-amber-400" /> Export JSON (.json)
                        </button>
                        <button onClick={() => exportSession('md')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left transition-all">
                          <FileText className="w-3.5 h-3.5 text-blue-400" /> Export Markdown (.md)
                        </button>
                        <button onClick={() => exportSession('html')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left transition-all">
                          <Globe className="w-3.5 h-3.5 text-emerald-400" /> Export HTML (.html)
                        </button>
                        <button onClick={() => exportSession('txt')} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left transition-all">
                          <Tag className="w-3.5 h-3.5 text-slate-400" /> Plain Text (.txt)
                        </button>
                        <button onClick={handlePrintPDF} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-left border-t border-white/10 pt-1.5 transition-all">
                          <Printer className="w-3.5 h-3.5 text-purple-400" /> Print / PDF View
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Memory Tags Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                  TAGS:
                </span>
                {memoryTags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono whitespace-nowrap">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Conversational Stream Area (User ↔ JARVIS) */}
              <div className="flex-1 overflow-y-auto custom-scroll space-y-3.5 pr-2">
                {conversationMessages.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-3">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                      <MessageSquare className="w-8 h-8 opacity-60 animate-pulse" />
                    </div>
                    <span className="text-slate-300 font-bold font-orbitron">NO CONVERSATION LOGS IN THIS SESSION</span>
                    <span className="text-[11px] text-slate-500">Send text prompts or activate neural voice to record exchanges.</span>
                  </div>
                ) : (
                  conversationMessages.map((msg, idx) => {
                    const isUser = msg.role === 'USER';

                    return (
                      <div 
                        key={msg.messageId || idx}
                        className={`flex flex-col transition-all duration-200 ${
                          isUser ? 'items-end pl-6 sm:pl-16' : 'items-start pr-6 sm:pr-16'
                        }`}
                      >
                        {/* Message Bubble Card with Atmospheric Sci-Fi Styling */}
                        <div 
                          className={`w-full p-4 rounded-2xl border relative group/msg transition-all duration-300 ${
                            isUser
                              ? 'bg-gradient-to-r from-[#07152e]/95 to-[#040e20]/95 border-blue-500/40 text-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.12)] rounded-tr-sm'
                              : 'bg-gradient-to-r from-[#031526]/95 via-[#020e1f]/95 to-[#010814]/95 border-cyan-500/40 text-cyan-50 shadow-[0_0_25px_rgba(0,242,255,0.15)] rounded-tl-sm'
                          }`}
                        >
                          {/* Card Header with Role Badge, Time & Copy Action */}
                          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10 text-[10px] font-orbitron font-bold">
                            <div className="flex items-center gap-2">
                              {isUser ? (
                                <span className="px-2.5 py-0.5 rounded-full border border-blue-400/50 bg-blue-500/20 text-blue-300 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                  <User className="w-3 h-3 text-blue-400" />
                                  <span>OPERATOR</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.3)]">
                                  <Bot className="w-3 h-3 text-cyan-400" />
                                  <span>J.A.R.V.I.S.</span>
                                </span>
                              )}
                              <span className="font-mono text-slate-400 text-[9.5px]">
                                {formatLogTime(msg.timestamp)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopySingleMessage(msg)}
                              className="opacity-70 group-hover/msg:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
                              title="Copy message text"
                            >
                              {copiedMsgId === msg.messageId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Content text with clean typography and readability */}
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
      </div>

      {/* ======================================================== */}
      {/* STICKY BOTTOM ACTION BAR                                 */}
      {/* ======================================================== */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full flex flex-wrap items-center justify-between gap-2.5 py-2.5 px-4 sm:px-6 rounded-2xl bg-[#030e1d]/90 border border-cyan-500/35 shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,255,0.12)] mt-2 relative z-50 shrink-0"
      >
        <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline text-cyan-300 font-bold">JARVIS ARCHIVES:</span>
          <span>NEURAL SYNCHRONIZED // 100% OPERATIONAL</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              playDigitalPingSound();
              onNewChat();
            }}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 rounded-xl text-xs font-orbitron font-black flex items-center gap-2 shadow-[0_0_25px_rgba(0,242,255,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            <span>START NEW CONVERSATION</span>
          </button>
        </div>
      </div>

      {/* SESSION ANALYTICS MODAL */}
      {showAnalyticsModal && (
        <div 
          onClick={() => setShowAnalyticsModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[100000] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#020b18] border border-cyan-500/50 rounded-2xl w-full max-w-xl p-5 space-y-4 text-slate-100 font-sans shadow-[0_0_50px_rgba(0,242,255,0.25)] animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-cyan-300 font-orbitron font-bold text-sm">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <span>CONVERSATION ANALYTICS & TOKENS</span>
              </div>
              <button 
                onClick={() => setShowAnalyticsModal(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/20">
                <div className="text-slate-400 text-[10px] font-mono uppercase">EXCHANGES</div>
                <div className="text-cyan-300 font-orbitron font-bold text-base mt-1">{conversationMessages.length} msgs</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-purple-500/20">
                <div className="text-slate-400 text-[10px] font-mono uppercase">TOTAL WORDS</div>
                <div className="text-purple-300 font-orbitron font-bold text-base mt-1">{totalWords.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/20">
                <div className="text-slate-400 text-[10px] font-mono uppercase">AI MODEL</div>
                <div className="text-emerald-300 font-orbitron font-bold text-xs mt-1 truncate">{currentSession?.model || 'Gemini Flash'}</div>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/20">
                <div className="text-slate-400 text-[10px] font-mono uppercase">MODE</div>
                <div className="text-amber-300 font-orbitron font-bold text-xs mt-1">{currentSession?.mode || 'DEVELOPER'}</div>
              </div>
            </div>

            <button 
              onClick={() => setShowAnalyticsModal(false)} 
              className="w-full py-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-xl font-orbitron font-bold text-xs hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              CLOSE ANALYTICS
            </button>
          </div>
        </div>
      )}

      {/* NEURAL RELATIONSHIP GRAPH MODAL */}
      {showNeuralGraphModal && (
        <div 
          onClick={() => setShowNeuralGraphModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[100000] flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#020b18] border border-cyan-500/50 rounded-2xl w-full max-w-2xl h-[450px] p-5 flex flex-col space-y-3 text-slate-100 font-sans shadow-[0_0_50px_rgba(0,242,255,0.25)] relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-cyan-300 font-orbitron font-bold text-sm">
                <Network className="w-5 h-5 text-purple-400 animate-pulse" />
                <span>CONVERSATION KNOWLEDGE GRAPH</span>
              </div>
              <button 
                onClick={() => setShowNeuralGraphModal(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-black/70 border border-cyan-500/20 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.12)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute p-3.5 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-orbitron font-bold text-xs shadow-[0_0_25px_rgba(0,242,255,0.5)] animate-pulse">
                  JARVIS CONVERSATION CORE
                </div>

                <div className="absolute top-6 left-10 p-2 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 text-[10px] font-mono shadow-md">
                  👤 Operator Prompts
                </div>

                <div className="absolute bottom-8 left-12 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[10px] font-mono shadow-md">
                  🤖 JARVIS Intelligence
                </div>

                <div className="absolute top-8 right-10 p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-mono shadow-md">
                  🎙️ Voice Persona
                </div>

                <div className="absolute bottom-6 right-10 p-2 rounded-xl bg-blue-500/20 border border-blue-400 text-blue-300 text-[10px] font-mono shadow-md">
                  🧠 Quantum Memory Graph
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-cyan-500/40 stroke-1">
                  <line x1="50%" y1="50%" x2="20%" y2="20%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="25%" y2="80%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="80%" y2="25%" strokeDasharray="4 4" />
                  <line x1="50%" y1="50%" x2="78%" y2="78%" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>Conversational Nodes: {conversationMessages.length} | Synapses Active</span>
              <button 
                onClick={() => setShowNeuralGraphModal(false)} 
                className="px-3.5 py-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-lg font-orbitron font-bold text-xs hover:bg-cyan-500/30 transition-all cursor-pointer"
              >
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
