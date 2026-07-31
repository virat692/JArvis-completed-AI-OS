
import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Pin, MessageSquare, Trash2, ChevronRight, FileText, Zap, Shield, Sparkles, X
} from 'lucide-react';
import { ChatSession, LogEntry } from '../types';

interface ChatHistoryPanelProps {
  isVisible: boolean;
  activeSessionId: string | null;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onTogglePin?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  onClose?: () => void;
  activeLogs?: LogEntry[];
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ 
  isVisible, 
  activeSessionId, 
  sessions,
  onSelectSession, 
  onNewChat,
  onTogglePin,
  onDeleteSession,
  onClose,
  activeLogs = [],
  theme = 'cyber'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.last_message_preview && s.last_message_preview.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sessions, searchQuery]);

  const grouped = useMemo(() => {
    const groups: { [key: string]: ChatSession[] } = { 'Pinned Archives': [], 'Today': [], 'Older Archives': [] };
    filteredSessions.forEach(s => {
      if (s.isPinned) groups['Pinned Archives'].push(s);
      else if (new Date(s.timestamp_last_message).toDateString() === new Date().toDateString()) groups['Today'].push(s);
      else groups['Older Archives'].push(s);
    });
    return groups;
  }, [filteredSessions]);

  if (!isVisible) return null;

  const currentSession = sessions.find(s => s.session_id === activeSessionId);

  return (
    <div className={`w-80 sm:w-96 shrink-0 min-w-[320px] flex flex-col h-full overflow-hidden shadow-2xl relative animate-in slide-in-from-left duration-300 z-40 transition-all ${
      isSlate
        ? 'bg-zinc-900/95 border-r border-slate-700/80 rounded-r-3xl text-slate-200'
        : isMinimal
          ? 'bg-[#0f172a]/95 border-r border-emerald-500/20 rounded-r-3xl text-slate-100 backdrop-blur-xl'
          : isGold
            ? 'bg-[#181310]/95 border-r border-amber-500/20 rounded-r-3xl text-amber-100 backdrop-blur-xl'
            : 'glass border-r border-cyan-500/20 bg-black/80 backdrop-blur-xl'
    }`}>
      {/* Panel Header */}
      <div className={`p-4 border-b space-y-3 ${
        isSlate ? 'border-slate-800 bg-zinc-800/80' : isMinimal ? 'border-emerald-500/20 bg-emerald-950/20' : isGold ? 'border-amber-500/20 bg-amber-950/20' : 'border-cyan-500/20 bg-gradient-to-b from-black/60 to-black/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isSlate ? 'text-zinc-300' : isMinimal ? 'text-emerald-400' : isGold ? 'text-amber-400' : 'text-cyan-400 animate-pulse'}`} />
            <span className={`text-[11px] font-orbitron font-bold tracking-[0.2em] uppercase ${
              isSlate ? 'text-zinc-200' : isMinimal ? 'text-emerald-300' : isGold ? 'text-amber-300' : 'text-cyan-400'
            }`}>NEURAL_ARCHIVES</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isSlate ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
            }`}>
              <Zap className="w-2.5 h-2.5 animate-bounce" /> FAST_EFFICIENCY
            </span>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-colors"
                title="Close Archives"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 py-2.5 font-orbitron text-[10px] tracking-widest transition-all group font-bold active:scale-98 ${
            isSlate
              ? 'bg-zinc-800 hover:bg-zinc-700 border border-slate-600 rounded-xl text-zinc-100 shadow-md'
              : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded-lg text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.1)]'
          }`}
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          START_NEW_SESSION
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input 
            type="text"
            placeholder="Search transcripts & archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-md pl-10 pr-4 py-2 text-[11px] font-mono text-slate-200 focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Session List & Expanded Inspection */}
      <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-5">
        {(Object.entries(grouped) as [string, ChatSession[]][]).map(([groupName, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={groupName} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[9px] font-orbitron text-slate-500 tracking-[0.2em] uppercase">
                  {groupName}
                </h3>
                <span className="text-[8px] font-mono text-slate-600">({items.length})</span>
              </div>

              {items.map((session) => {
                const isActive = activeSessionId === session.session_id;
                const isExpanded = expandedSessionId === session.session_id;
                const sessionLogs = session.logs || (isActive ? activeLogs : []);

                return (
                  <div 
                    key={session.session_id}
                    className={`group relative rounded-xl transition-all duration-300 border overflow-hidden ${
                      isActive 
                        ? 'bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.12)]' 
                        : 'bg-black/30 border-white/5 hover:border-cyan-500/30 hover:bg-white/5'
                    }`}
                  >
                    {/* Session Summary Card */}
                    <div 
                      onClick={() => onSelectSession(session.session_id)}
                      className="p-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                          <h4 className={`text-[12px] font-semibold truncate ${isActive ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                            {session.title}
                          </h4>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {onTogglePin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(session.session_id);
                              }}
                              className={`p-1 rounded hover:bg-white/10 ${session.isPinned ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'}`}
                              title={session.isPinned ? "Unpin session" : "Pin session"}
                            >
                              <Pin className="w-3 h-3 fill-current" />
                            </button>
                          )}

                          {onDeleteSession && sessions.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.session_id);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                              title="Delete session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSessionId(isExpanded ? null : session.session_id);
                            }}
                            className="p-1 rounded hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Inspect full transcript"
                          >
                            <FileText className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Full Preview Text (No harsh truncated clipping) */}
                      <p className="text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-2 mb-2 bg-black/40 p-1.5 rounded border border-white/5">
                        {session.last_message_preview || "Speech/Text transcript initialized."}
                      </p>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="uppercase text-cyan-400/80 font-bold">{session.mode}</span>
                          <span>• {sessionLogs.length} entries</span>
                        </div>
                        <span>{new Date(session.timestamp_last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Expanded Session Transcript Viewer */}
                    {isExpanded && (
                      <div className="p-3 bg-black/90 border-t border-cyan-500/20 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[9px] font-orbitron text-cyan-400 border-b border-cyan-500/20 pb-1">
                          <span>FULL_VOICE_&_TEXT_TRANSCRIPT</span>
                          <button 
                            onClick={() => setExpandedSessionId(null)}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            Close
                          </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto custom-scroll space-y-2 pr-1 text-[11px] font-mono">
                          {sessionLogs.length === 0 ? (
                            <div className="text-slate-600 text-[10px] italic py-2 text-center">No transcript logs recorded in this session.</div>
                          ) : (
                            sessionLogs.map((log) => (
                              <div key={log.id} className="p-2 rounded bg-slate-900/60 border border-white/5 space-y-0.5">
                                <div className="flex items-center justify-between text-[8px] font-orbitron">
                                  <span className={log.source === 'JARVIS' ? 'text-cyan-400 font-bold' : log.source === 'OPERATOR' ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                                    {log.source}
                                  </span>
                                  <span className="text-slate-600">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-slate-200 leading-snug whitespace-pre-wrap break-words">
                                  {log.message}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-cyan-500/20 bg-black/60 text-center flex items-center justify-between">
        <div className="text-[8px] font-orbitron text-slate-500 uppercase tracking-widest flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-500/50" /> ARCHIVE_STORAGE_ONLINE
        </div>
        <div className="text-[9px] font-mono text-cyan-400 font-bold">
          {sessions.length} SESSIONS
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryPanel;

