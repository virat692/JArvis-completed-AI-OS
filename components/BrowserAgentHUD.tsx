import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Play, 
  Square, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Cpu, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  X, 
  Layers, 
  Terminal as TerminalIcon,
  ChevronRight,
  Zap
} from 'lucide-react';
import { browserAgent, BrowserTask, BrowserAgentStatus, TaskStepLog } from '../services/browserAgent';
import { eventBus } from '../services/eventBus';

interface BrowserAgentHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkspace?: () => void;
  theme?: string;
}

export const BrowserAgentHUD: React.FC<BrowserAgentHUDProps> = ({
  isOpen,
  onClose,
  onOpenWorkspace,
  theme = 'cyan'
}) => {
  const [task, setTask] = useState<BrowserTask | null>(browserAgent.getCurrentTask());
  const [status, setStatus] = useState<BrowserAgentStatus>(task?.status || 'IDLE');
  const [customGoal, setCustomGoal] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'trajectory' | 'elements' | 'raw_data'>('trajectory');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubStarted = eventBus.on('browser.task_started', (newTask: BrowserTask) => {
      setTask(newTask);
      setStatus(newTask.status);
    });

    const unsubStep = eventBus.on('browser.step_progress', ({ task: updatedTask }: { task: BrowserTask }) => {
      setTask({ ...updatedTask });
      setStatus(updatedTask.status);
    });

    const unsubStatus = eventBus.on('browser.status_change', ({ status: newStatus }: { status: BrowserAgentStatus }) => {
      setStatus(newStatus);
      if (task) setTask(prev => prev ? { ...prev, status: newStatus } : null);
    });

    const unsubCompleted = eventBus.on('browser.task_completed', (finalTask: BrowserTask) => {
      setTask({ ...finalTask });
      setStatus('COMPLETED');
    });

    const unsubConfirmation = eventBus.on('browser.awaiting_confirmation', (awaitingTask: BrowserTask) => {
      setTask({ ...awaitingTask });
      setStatus('AWAITING_CONFIRMATION');
    });

    return () => {
      unsubStarted();
      unsubStep();
      unsubStatus();
      unsubCompleted();
      unsubConfirmation();
    };
  }, [task]);

  if (!isOpen) return null;

  const handleStartTask = async () => {
    if (!customGoal.trim()) return;
    await browserAgent.executeTask(customGoal.trim(), targetUrl.trim() || undefined);
  };

  const handleCancel = () => {
    browserAgent.cancelTask();
  };

  const handleAuthorize = (approved: boolean) => {
    browserAgent.confirmAction(approved);
  };

  const getStatusBadge = (st: BrowserAgentStatus) => {
    switch (st) {
      case 'PLANNING':
      case 'THINKING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse flex items-center gap-1.5"><Cpu className="w-3 h-3 animate-spin" /> {st}</span>;
      case 'OBSERVING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5"><Eye className="w-3 h-3 animate-pulse" /> {st}</span>;
      case 'ACTING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5"><Zap className="w-3 h-3 animate-bounce" /> {st}</span>;
      case 'VERIFYING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> {st}</span>;
      case 'RECOVERING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> SELF-HEALING</span>;
      case 'AWAITING_CONFIRMATION':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-red-500/20 text-red-300 border border-red-500/50 animate-pulse flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> SAFETY CHECKPOINT</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>;
      case 'FAILED':
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5"><X className="w-3 h-3" /> {st}</span>;
      case 'IDLE':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-orbitron bg-slate-800 text-slate-400 border border-slate-700">STANDBY / READY</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className={`flex flex-col bg-[rgba(2,12,27,0.95)] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.2)] overflow-hidden transition-all duration-300 ${isExpanded ? 'w-full h-full max-w-[98vw] max-h-[96vh]' : 'w-full max-w-5xl h-[85vh]'}`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-cyan-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.3)]">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-orbitron font-extrabold tracking-widest text-cyan-200">JARVIS AUTONOMOUS BROWSER AGENT</h2>
                {getStatusBadge(status)}
              </div>
              <p className="text-[10px] font-mono text-slate-400">OTAV Control Loop • Playwright + In-Browser Dual Mode • Neural Workspace Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900/60 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors"
              title="Close HUD"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Safety Checkpoint Banner (If awaiting operator approval) */}
        {status === 'AWAITING_CONFIRMATION' && task?.pendingConfirmation && (
          <div className="p-4 bg-red-950/50 border-b border-red-500/40 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h4 className="text-xs font-orbitron font-bold text-red-200">SAFETY CONFIRMATION REQUIRED</h4>
                <p className="text-[11px] font-mono text-red-300/90">{task.pendingConfirmation.riskReason}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button 
                onClick={() => handleAuthorize(true)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron text-xs font-bold shadow-lg transition-all"
              >
                AUTHORIZE ACTION
              </button>
              <button 
                onClick={() => handleAuthorize(false)}
                className="px-4 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-orbitron text-xs font-bold transition-all"
              >
                DENY & ABORT
              </button>
            </div>
          </div>
        )}

        {/* Quick Task Launcher Bar */}
        <div className="p-3.5 bg-slate-900/40 border-b border-cyan-500/15 flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex-1 min-w-[280px] relative">
            <input 
              type="text" 
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartTask()}
              placeholder="Give JARVIS a browser goal (e.g. 'Search 1TB NVMe SSD under ₹5000 on Amazon and compare top 3')..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
            />
          </div>
          <div className="w-48 relative">
            <input 
              type="text" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Optional Start URL..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          {status !== 'IDLE' && status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELLED' ? (
            <button 
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Square className="w-3.5 h-3.5" /> CANCEL
            </button>
          ) : (
            <button 
              onClick={handleStartTask}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-orbitron text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(0,242,255,0.4)]"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> EXECUTE TASK
            </button>
          )}

          {task?.extractedData && onOpenWorkspace && (
            <button 
              onClick={onOpenWorkspace}
              className="px-4 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-orbitron text-xs font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" /> VIEW IN WORKSPACE
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-cyan-500/15 bg-slate-950/40 shrink-0">
          <button 
            onClick={() => setActiveTab('trajectory')}
            className={`px-4 py-2 text-xs font-orbitron font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'trajectory' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="w-3.5 h-3.5" /> ACTION TRAJECTORY {task ? `(${task.steps.length})` : ''}
          </button>
          <button 
            onClick={() => setActiveTab('elements')}
            className={`px-4 py-2 text-xs font-orbitron font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'elements' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Eye className="w-3.5 h-3.5" /> DOM & ELEMENT MAP
          </button>
          <button 
            onClick={() => setActiveTab('raw_data')}
            className={`px-4 py-2 text-xs font-orbitron font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'raw_data' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <TerminalIcon className="w-3.5 h-3.5" /> EXTRACTED INTELLIGENCE
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-4">
          
          {/* TAB 1: TRAJECTORY & STEPS */}
          {activeTab === 'trajectory' && (
            <div className="space-y-3.5">
              {task?.steps && task.steps.length > 0 ? (
                task.steps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-orbitron bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                          STEP #{step.stepIndex}
                        </span>
                        <span className="text-xs font-orbitron font-bold text-cyan-200 uppercase">
                          [{step.action.type}] {step.action.targetDescription || step.action.targetSelector || step.action.parameters.url || 'Page'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        {step.verification?.isVerified ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> RECOVERED ({step.recoveryAttempts} attempts)
                          </span>
                        )}
                        <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs font-mono">
                      <p className="text-slate-300 flex items-start gap-2">
                        <span className="text-purple-400 font-bold shrink-0">THOUGHT:</span>
                        <span>{step.thought}</span>
                      </p>
                      <p className="text-slate-400 flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0">RESULT:</span>
                        <span>{step.result?.message || 'Done'} ({step.result?.durationMs || 0}ms)</span>
                      </p>
                      {step.verification?.reason && (
                        <p className="text-slate-400 flex items-start gap-2 text-[11px]">
                          <span className="text-indigo-400 font-bold shrink-0">VERIFICATION:</span>
                          <span>{step.verification.reason}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-cyan-500/20 text-slate-400">
                  <Globe className="w-8 h-8 text-cyan-500/40 mb-2 animate-pulse" />
                  <p className="text-xs font-mono">No active browser task running.</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">Enter a browser prompt above or ask JARVIS to research / navigate automatically.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOM & INTERACTIVE ELEMENT MAP */}
          {activeTab === 'elements' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/20 text-xs font-mono">
                <span className="text-cyan-400 font-bold">CURRENT URL: </span>
                <span className="text-slate-300">{browserAgent.getController().getCurrentUrl()}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                <h4 className="text-xs font-orbitron font-bold text-cyan-300 mb-2">PAGE HIERARCHY & OBSERVATION BUFFER</h4>
                <pre className="text-[11px] font-mono text-slate-300 bg-slate-950/80 p-3 rounded-lg overflow-x-auto max-h-96 custom-scroll whitespace-pre-wrap">
                  {task?.steps.slice(-1)[0]?.observationSummary || 'Observation state will appear during active execution.'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: EXTRACTED INTELLIGENCE & COMPARISON CARDS */}
          {activeTab === 'raw_data' && (
            <div className="space-y-4">
              {task?.extractedData ? (
                <>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                    <h3 className="text-sm font-orbitron font-bold text-cyan-200 mb-2">{task.extractedData.title}</h3>
                    <p className="text-xs font-mono text-slate-300 mb-3">{task.extractedData.summary}</p>
                    
                    {/* Comparison Cards if present */}
                    {task.extractedData.comparisonCards && task.extractedData.comparisonCards.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {task.extractedData.comparisonCards.map((card, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-orbitron font-bold text-cyan-300">{card.subject}</h4>
                                <span className="px-2 py-0.5 rounded text-[9px] font-orbitron bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                  {card.badge}
                                </span>
                              </div>
                              <div className="space-y-1 my-2">
                                {Object.entries(card.specs).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-[10px] font-mono">
                                    <span className="text-slate-400">{k}:</span>
                                    <span className="text-cyan-100 font-bold">{v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {card.verdict && (
                              <p className="mt-2 text-[10px] font-mono text-emerald-300/90 pt-2 border-t border-cyan-500/20">
                                {card.verdict}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 font-mono text-xs">
                  No extracted data yet. Complete a task to view structured results.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="px-5 py-2.5 bg-slate-950/90 border-t border-cyan-500/15 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-4">
            <span>PAGES VISITED: <strong className="text-cyan-300">{task?.metadata.pagesVisited.length || 0}</strong></span>
            <span>ACTIONS: <strong className="text-cyan-300">{task?.metadata.actionsExecuted || 0}</strong></span>
            <span>RECOVERIES: <strong className="text-amber-300">{task?.metadata.recoveriesExecuted || 0}</strong></span>
          </div>
          <span className="text-cyan-400 font-orbitron">JARVIS QUANTUM BROWSER ENGINE</span>
        </div>

      </div>
    </div>
  );
};
