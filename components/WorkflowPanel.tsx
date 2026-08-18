import React, { useState, useSyncExternalStore } from 'react';
import { Play, Plus, Trash2, CheckCircle2, Clock, Zap, Cpu, Sparkles, Terminal, Volume2, Globe, Database, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { WorkflowPipeline, WorkflowStep, WorkflowActionType } from '../types';
import { workflowEngine } from '../workflows/workflowEngine';
import { playWhooshSound, playDigitalPingSound } from '../services/soundEffects';

interface WorkflowPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ isOpen, onClose }) => {
  const pipelines = useSyncExternalStore(
    (cb) => workflowEngine.subscribe(cb),
    () => workflowEngine.getPipelines()
  );

  const activePipeline = useSyncExternalStore(
    (cb) => workflowEngine.subscribe(cb),
    () => workflowEngine.getActivePipeline()
  );

  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || 'wf_morning_setup');
  const [isCreating, setIsCreating] = useState(false);

  // New Workflow Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<WorkflowPipeline['trigger']>('MANUAL');
  const [steps, setSteps] = useState<Array<{ name: string; action: WorkflowActionType; target: string }>>([
    { name: 'Initial Routine Action', action: 'voice_speak', target: 'Executing custom pipeline step Sir.' }
  ]);

  if (!isOpen) return null;

  const currentPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];

  const handleRunPipeline = (id: string) => {
    playWhooshSound();
    workflowEngine.executePipeline(id);
  };

  const handleAddStepToForm = () => {
    setSteps([...steps, { name: 'Subsystem Task', action: 'run_command', target: 'execute_task' }]);
  };

  const handleCreatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || steps.length === 0) return;

    const formattedSteps: WorkflowStep[] = steps.map((s, idx) => ({
      id: `s_${idx + 1}`,
      name: s.name,
      action: s.action,
      target: s.target,
      status: 'PENDING'
    }));

    const created = workflowEngine.addPipeline(name.trim(), description.trim(), trigger, formattedSteps);
    playDigitalPingSound();
    setSelectedPipelineId(created.id);
    setIsCreating(false);
    setName('');
    setDescription('');
  };

  const getActionIcon = (action: WorkflowActionType) => {
    switch (action) {
      case 'voice_speak': return <Volume2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'memory_commit': return <Database className="w-3.5 h-3.5 text-cyan-400" />;
      case 'open_url': return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'run_command': return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-amber-500/30 w-full max-w-5xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-cyan-400 to-purple-500" />

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-orbitron font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                WORKFLOW AUTOMATION ENGINE <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">PHASE 2</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Modular multi-step automation routines, event-driven pipelines, and continuous background tasks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 min-h-0 overflow-hidden">
          {/* Pipelines Navigation Sidebar */}
          <div className="p-4 border-r border-white/10 bg-black/40 flex flex-col gap-3 overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-orbitron font-bold text-slate-300">ROUTINE PIPELINES</span>
              <button
                onClick={() => { setIsCreating(!isCreating); playWhooshSound(); }}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" /> BUILD NEW
              </button>
            </div>

            <div className="space-y-2">
              {pipelines.map(pipeline => {
                const isSelected = pipeline.id === selectedPipelineId;
                const isRunning = activePipeline?.id === pipeline.id;

                return (
                  <div
                    key={pipeline.id}
                    onClick={() => setSelectedPipelineId(pipeline.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-black/50 border-white/10 hover:border-amber-500/30 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold font-orbitron truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {pipeline.name}
                      </span>
                      {isRunning && (
                        <span className="text-[8px] font-mono bg-amber-500/20 text-amber-400 border border-amber-400/50 px-2 py-0.5 rounded-full animate-pulse">
                          RUNNING...
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{pipeline.description}</p>
                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <span>{pipeline.steps.length} STEPS</span>
                      <span className="uppercase text-amber-400/80">{pipeline.trigger}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline Details / Builder View */}
          <div className="md:col-span-2 p-6 bg-slate-950/80 flex flex-col gap-6 overflow-y-auto custom-scroll">
            {isCreating ? (
              <form onSubmit={handleCreatePipeline} className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-sm font-orbitron font-bold text-amber-300 uppercase">Construct Custom Workflow Pipeline</h3>
                  <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Pipeline Name..."
                    required
                    className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none focus:border-amber-400/60"
                  />
                  <select
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value as any)}
                    className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-300 font-orbitron focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="MANUAL">MANUAL TRIGGER</option>
                    <option value="SCHEDULED">SCHEDULED TRIGGER</option>
                    <option value="EVENT">EVENT BUS TRIGGER</option>
                  </select>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe pipeline intent and behavior..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400/60 h-16 resize-none"
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-orbitron font-bold text-slate-300">PIPELINE STEPS ({steps.length})</span>
                    <button
                      type="button"
                      onClick={handleAddStepToForm}
                      className="text-[10px] font-orbitron text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>

                  {steps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-amber-400 font-bold">STEP {idx + 1}</span>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => {
                            const newS = [...steps];
                            newS[idx].name = e.target.value;
                            setSteps(newS);
                          }}
                          placeholder="Step Name..."
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={step.action}
                          onChange={(e) => {
                            const newS = [...steps];
                            newS[idx].action = e.target.value as any;
                            setSteps(newS);
                          }}
                          className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-amber-300 font-orbitron"
                        >
                          <option value="voice_speak">voice_speak (Audio Broadcast)</option>
                          <option value="memory_commit">memory_commit (Knowledge Node)</option>
                          <option value="open_url">open_url (Browser Workspace)</option>
                          <option value="run_command">run_command (System Tool)</option>
                        </select>
                        <input
                          type="text"
                          value={step.target}
                          onChange={(e) => {
                            const newS = [...steps];
                            newS[idx].target = e.target.value;
                            setSteps(newS);
                          }}
                          placeholder="Target Payload..."
                          className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-orbitron text-xs font-bold py-2.5 rounded-xl transition-all uppercase tracking-widest"
                >
                  Save and Compile Routine Pipeline
                </button>
              </form>
            ) : currentPipeline ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Active Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-orbitron font-extrabold text-amber-300">{currentPipeline.name}</h3>
                      <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                        {currentPipeline.trigger}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{currentPipeline.description}</p>
                    {currentPipeline.lastExecuted && (
                      <p className="text-[9px] font-mono text-slate-500 flex items-center gap-1 pt-1">
                        <Clock className="w-3 h-3" /> Last Executed: {new Date(currentPipeline.lastExecuted).toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRunPipeline(currentPipeline.id)}
                    disabled={activePipeline?.id === currentPipeline.id}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-orbitron font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-40"
                  >
                    <Play className="w-4 h-4 fill-black" /> EXECUTE ROUTINE
                  </button>
                </div>

                {/* Steps Timeline Visualizer */}
                <div className="space-y-3">
                  <span className="text-xs font-orbitron font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" /> PIPELINE EXECUTION STEPS ({currentPipeline.steps.length})
                  </span>

                  <div className="space-y-2 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
                    {currentPipeline.steps.map((step, idx) => {
                      const isCompleted = step.status === 'COMPLETED';
                      const isRunning = step.status === 'RUNNING';
                      const isFailed = step.status === 'FAILED';

                      return (
                        <div
                          key={step.id}
                          className={`p-3.5 rounded-2xl border transition-all relative pl-12 flex items-center justify-between gap-4 ${
                            isRunning 
                              ? 'bg-amber-950/40 border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                              : isCompleted 
                                ? 'bg-emerald-950/20 border-emerald-500/30'
                                : isFailed
                                  ? 'bg-red-950/20 border-red-500/30'
                                  : 'bg-black/50 border-white/10'
                          }`}
                        >
                          <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-bold ${
                            isCompleted 
                              ? 'bg-emerald-500 border-emerald-400 text-black' 
                              : isRunning 
                                ? 'bg-amber-500 border-amber-400 text-black animate-ping' 
                                : isFailed
                                  ? 'bg-red-500 border-red-400 text-white'
                                  : 'bg-slate-800 border-slate-600 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {getActionIcon(step.action)}
                              <span className="text-xs font-bold font-sans text-slate-100">{step.name}</span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-md">
                              {step.action}: <span className="text-amber-300">{step.target}</span>
                            </p>
                          </div>

                          <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full uppercase border ${
                            isCompleted 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : isRunning 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' 
                                : isFailed
                                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                  : 'bg-white/5 text-slate-500 border-white/5'
                          }`}>
                            {step.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!currentPipeline.isBuiltin && (
                  <button
                    onClick={() => workflowEngine.deletePipeline(currentPipeline.id)}
                    className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1 pt-4"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Custom Pipeline
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
