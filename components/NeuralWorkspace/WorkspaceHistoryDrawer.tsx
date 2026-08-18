import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  Trash2, 
  Calendar, 
  Clock, 
  AlignLeft, 
  Code2, 
  Network, 
  Table, 
  Sparkles, 
  X, 
  ChevronRight, 
  Layers, 
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { WorkspaceHistoryEntry, PresentationMode, WorkspaceHistoryFilter } from '../../types/workspace';
import { workspaceHistoryService } from '../../services/workspaceHistoryService';
import { neuralWorkspaceManager } from '../../services/neuralWorkspaceManager';
import { playTickSound, playWhooshSound, playDigitalPingSound } from '../../services/soundEffects';

interface WorkspaceHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activePayloadId?: string;
}

const TYPE_CONFIG: Record<PresentationMode, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  PARAGRAPH: { 
    label: 'PARAGRAPH', 
    icon: AlignLeft, 
    color: 'text-amber-300', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30' 
  },
  CODE: { 
    label: 'CODE', 
    icon: Code2, 
    color: 'text-emerald-300', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/30' 
  },
  STRUCTURE: { 
    label: 'STRUCTURE', 
    icon: Network, 
    color: 'text-cyan-300', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/30' 
  },
  DATA: { 
    label: 'DATA', 
    icon: Table, 
    color: 'text-purple-300', 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/30' 
  },
  OVERVIEW: { 
    label: 'OVERVIEW', 
    icon: Sparkles, 
    color: 'text-blue-300', 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30' 
  }
};

export const WorkspaceHistoryDrawer: React.FC<WorkspaceHistoryDrawerProps> = ({
  isOpen,
  onClose,
  activePayloadId
}) => {
  const [history, setHistory] = useState<WorkspaceHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<WorkspaceHistoryFilter>('ALL');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(workspaceHistoryService.getHistory());
    const unsubscribe = workspaceHistoryService.subscribe(() => {
      setHistory(workspaceHistoryService.getHistory());
    });
    return unsubscribe;
  }, []);

  const handleSelectEntry = (entry: WorkspaceHistoryEntry) => {
    playWhooshSound();
    neuralWorkspaceManager.restoreFromHistory(entry.id);
    onClose();
  };

  const handleDeleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    playTickSound();
    workspaceHistoryService.deleteEntry(id);
  };

  const handleClearHistory = () => {
    playTickSound();
    workspaceHistoryService.clearHistory();
    setConfirmClear(false);
  };

  const filteredHistory = history.filter(item => {
    const matchesFilter = filterType === 'ALL' || item.presentationType === filterType;
    const matchesSearch = 
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourcePrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rawContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.presentationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filterButtons: Array<{ type: WorkspaceHistoryFilter; label: string; icon?: React.ElementType }> = [
    { type: 'ALL', label: 'ALL' },
    { type: 'PARAGRAPH', label: 'PARAGRAPH', icon: AlignLeft },
    { type: 'CODE', label: 'CODE', icon: Code2 },
    { type: 'STRUCTURE', label: 'STRUCTURE', icon: Network },
    { type: 'DATA', label: 'DATA', icon: Table },
    { type: 'OVERVIEW', label: 'OVERVIEW', icon: Sparkles }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-lg sm:max-w-xl h-full bg-[#020712] border-l border-cyan-500/30 flex flex-col shadow-[0_0_50px_rgba(0,242,255,0.15)] relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-cyan-500/20 bg-[#040e20]/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white tracking-wider flex items-center gap-2">
                  WORKSPACE ARCHIVE
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {filteredHistory.length} {filteredHistory.length === 1 ? 'ITEM' : 'ITEMS'}
                  </span>
                </h2>
                <p className="text-[11px] font-mono text-slate-400">
                  Persistent multi-modal presentation records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {history.length > 0 && (
                confirmClear ? (
                  <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded-xl border border-red-500/40">
                    <button
                      onClick={handleClearHistory}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-orbitron font-bold rounded-lg transition-all"
                    >
                      CONFIRM
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-[10px] font-orbitron font-bold rounded-lg"
                    >
                      CANCEL
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all text-xs"
                    title="Clear All Workspace History"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-200 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all"
                title="Close Archive (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 border-b border-cyan-500/15 bg-black/40 space-y-3 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, prompt, content or date..."
                className="w-full bg-[#030b18] border border-cyan-500/25 rounded-xl pl-10 pr-9 py-2 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mode Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {filterButtons.map(({ type, label, icon: Icon }) => {
                const isActive = filterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      playTickSound();
                      setFilterType(type);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-orbitron font-extrabold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,242,255,0.25)]'
                        : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* History List Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {filteredHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyan-500/20 rounded-2xl bg-cyan-950/10">
                <History className="w-10 h-10 text-cyan-500/40 mb-3" />
                <h3 className="text-sm font-orbitron font-bold text-slate-300 mb-1">
                  NO ARCHIVED PRESENTATIONS FOUND
                </h3>
                <p className="text-xs font-mono text-slate-500 max-w-xs">
                  {searchQuery || filterType !== 'ALL'
                    ? 'No records matching current search or filter criteria.'
                    : 'Whenever JARVIS generates stories, code, diagrams, or tables, they will automatically be archived here.'}
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const conf = TYPE_CONFIG[item.presentationType] || TYPE_CONFIG.PARAGRAPH;
                const Icon = conf.icon;
                const isCurrentlyActive = item.payload.id === activePayloadId;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectEntry(item)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                      isCurrentlyActive
                        ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_20px_rgba(0,242,255,0.15)] ring-1 ring-cyan-400/40'
                        : 'bg-[#030c1c]/90 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-[#05142e] hover:shadow-[0_0_15px_rgba(0,242,255,0.08)]'
                    }`}
                  >
                    {/* Active Accent Ribbon */}
                    {isCurrentlyActive && (
                      <div className="absolute top-0 right-0 bg-cyan-400 text-black text-[9px] font-orbitron font-black px-2 py-0.5 rounded-bl-lg tracking-wider">
                        ACTIVE ON DISPLAY
                      </div>
                    )}

                    {/* Top Meta Line: Mode Pill + Date/Time + Delete Action */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Type Badge */}
                        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-orbitron font-extrabold ${conf.bg} ${conf.color} border ${conf.border}`}>
                          <Icon className="w-3 h-3" />
                          <span>{conf.label}</span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cyan-400/60" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400/60" />
                            {item.time}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteEntry(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all"
                        title="Delete from archive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Main Title */}
                    <h3 className="text-xs sm:text-sm font-orbitron font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1 mb-1.5">
                      {item.title}
                    </h3>

                    {/* User Prompt / Request snippet */}
                    <p className="text-[11px] font-mono text-cyan-300/70 mb-2 line-clamp-1 flex items-center gap-1.5">
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                        PROMPT
                      </span>
                      {item.sourcePrompt}
                    </p>

                    {/* Content Preview */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 line-clamp-2 leading-relaxed">
                      {item.rawContent.slice(0, 180)}
                    </div>

                    {/* Footer Stats & Open Action */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <div className="flex items-center gap-3">
                        {item.stats?.lineCount && (
                          <span>{item.stats.lineCount} Lines</span>
                        )}
                        {item.stats?.wordCount && (
                          <span>{item.stats.wordCount} Words</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-cyan-400 font-orbitron font-bold group-hover:translate-x-0.5 transition-transform">
                        <span>RESTORE</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
