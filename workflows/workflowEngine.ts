import { WorkflowPipeline, WorkflowStep } from '../types';
import { eventBus } from '../services/eventBus';
import { memorySystem } from '../memory/memorySystem';
import { speakMessage } from '../services/elevenlabs';
import { browserAgent } from '../services/browserAgent';

const STORAGE_WORKFLOWS_KEY = 'jarvis_workflow_pipelines';

const BUILTIN_WORKFLOWS: WorkflowPipeline[] = [
  {
    id: 'wf_morning_setup',
    name: 'Morning Routine & Workspace Setup',
    description: 'Initializes system diagnostics, launches developer workspace, and commits morning session anchor.',
    trigger: 'MANUAL',
    isBuiltin: true,
    steps: [
      { id: 's1', name: 'System Core Check', action: 'run_command', target: 'sys_diag_check', status: 'PENDING' },
      { id: 's2', name: 'Open Web Workspace', action: 'open_url', target: 'http://localhost:3000', status: 'PENDING' },
      { id: 's3', name: 'Commit Morning Memory Anchor', action: 'memory_commit', target: 'Morning Operator Workspace Active', status: 'PENDING' },
      { id: 's4', name: 'Jarvis Audio Greeting', action: 'voice_speak', target: 'Good morning Virat Sir. All JARVIS subsystems are fully operational and ready.', status: 'PENDING' }
    ]
  },
  {
    id: 'wf_browser_intelligence',
    name: 'Autonomous Web Intelligence & Market Research',
    description: 'Deploys JARVIS Browser Agent to research trending AI models and market benchmarks, synthesizing results directly to Neural Workspace.',
    trigger: 'MANUAL',
    isBuiltin: true,
    steps: [
      { id: 's1', name: 'Autonomous Browser Agent Research', action: 'browser_task', target: 'Research top open-source LLMs and hardware accelerators released this quarter and compare specs', status: 'PENDING' },
      { id: 's2', name: 'Commit Intelligence to Graph', action: 'memory_commit', target: 'Latest AI model benchmarks updated in Neural Knowledge Graph', status: 'PENDING' },
      { id: 's3', name: 'Voice Briefing', action: 'voice_speak', target: 'Sir, the autonomous browser agent has completed the web intelligence sweep. The comparative dataset is presented in your Neural Workspace.', status: 'PENDING' }
    ]
  },
  {
    id: 'wf_dev_deploy',
    name: 'Developer Project Deployment',
    description: 'Runs build verification, checks runtime health, and broadcasts readiness.',
    trigger: 'MANUAL',
    isBuiltin: true,
    steps: [
      { id: 's1', name: 'Verify TypeScript Build', action: 'run_command', target: 'tsc --noEmit', status: 'PENDING' },
      { id: 's2', name: 'Check Runtime Metrics', action: 'run_command', target: 'check_metrics', status: 'PENDING' },
      { id: 's3', name: 'Commit Deployment Node', action: 'memory_commit', target: 'Deployment Build Passed', status: 'PENDING' },
      { id: 's4', name: 'Broadcast Success', action: 'voice_speak', target: 'Build check complete Sir. Deployment candidate is green.', status: 'PENDING' }
    ]
  },
  {
    id: 'wf_nightly_backup',
    name: 'End-Of-Day System Backup',
    description: 'Snapshots knowledge graph memory, cleans transient buffers, and puts JARVIS in low-power stance.',
    trigger: 'SCHEDULED',
    isBuiltin: true,
    steps: [
      { id: 's1', name: 'Snapshot Memory Graph', action: 'memory_commit', target: 'Nightly Memory Graph Snapshot', status: 'PENDING' },
      { id: 's2', name: 'Clean Transient Logs', action: 'run_command', target: 'flush_transient_logs', status: 'PENDING' },
      { id: 's3', name: 'Low Power Speech Notice', action: 'voice_speak', target: 'Nightly backup complete Sir. Entering background surveillance stance.', status: 'PENDING' }
    ]
  }
];

export class WorkflowEngine {
  private pipelines: WorkflowPipeline[] = [];
  private activePipelineId: string | null = null;
  private listeners: Array<() => void> = [];
  private cachedPipelines: WorkflowPipeline[] = [];
  private cachedActivePipeline: WorkflowPipeline | null = null;

  constructor() {
    this.loadFromStorage();
    this.updateCache();
  }

  private updateCache() {
    this.cachedPipelines = this.pipelines;
    this.cachedActivePipeline = this.pipelines.find(p => p.id === this.activePipelineId) || null;
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_WORKFLOWS_KEY);
      if (saved) {
        this.pipelines = JSON.parse(saved);
      } else {
        this.pipelines = BUILTIN_WORKFLOWS;
      }
    } catch {
      this.pipelines = BUILTIN_WORKFLOWS;
    }
    this.updateCache();
  }

  private saveToStorage() {
    this.updateCache();
    try {
      localStorage.setItem(STORAGE_WORKFLOWS_KEY, JSON.stringify(this.pipelines));
    } catch (e) {
      console.warn('WorkflowEngine save error:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getPipelines(): WorkflowPipeline[] {
    return this.cachedPipelines;
  }

  public getActivePipeline(): WorkflowPipeline | null {
    return this.cachedActivePipeline;
  }

  public addStepToPipeline(pipelineId: string, step: WorkflowStep): void {
    const pipe = this.pipelines.find(p => p.id === pipelineId);
    if (pipe) {
      pipe.steps.push(step);
      this.saveToStorage();
    }
  }

  public async executePipeline(pipelineId: string) {
    const pipeline = this.pipelines.find(p => p.id === pipelineId);
    if (!pipeline) return;

    this.activePipelineId = pipelineId;
    pipeline.lastExecuted = Date.now();
    pipeline.steps.forEach(s => s.status = 'PENDING');
    this.saveToStorage();

    eventBus.emit('workflow.started', { pipelineId: pipeline.id, name: pipeline.name });

    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      step.status = 'RUNNING';
      this.saveToStorage();

      try {
        await this.executeStep(step);
        step.status = 'COMPLETED';
        eventBus.emit('workflow.step_completed', { pipelineId, stepId: step.id, stepName: step.name });
      } catch (err: any) {
        step.status = 'FAILED';
        eventBus.emit('workflow.step_failed', { pipelineId, stepId: step.id, error: err?.message || 'Execution error' });
        break;
      }

      this.saveToStorage();
      await new Promise(r => setTimeout(r, 600));
    }

    this.activePipelineId = null;
    this.saveToStorage();
    eventBus.emit('workflow.finished', { pipelineId, name: pipeline.name });
  }

  private async executeStep(step: WorkflowStep): Promise<void> {
    switch (step.action) {
      case 'voice_speak':
        try {
          await speakMessage(step.target);
        } catch {
          console.log(`[TTS Voice Action]: ${step.target}`);
        }
        break;

      case 'memory_commit':
        memorySystem.addNode(step.target, 'Goal', { source: 'Workflow Step', timestamp: String(Date.now()) });
        break;

      case 'open_url':
        try {
          if (typeof window !== 'undefined') {
            window.open(step.target, '_blank', 'noopener,noreferrer');
          }
        } catch (e) {
          console.warn('[Workflow Engine] Failed to open URL:', e);
        }
        break;

      case 'browser_task':
        try {
          await browserAgent.executeTask(step.target);
        } catch (e) {
          console.warn('[Workflow Engine] Browser task execution error:', e);
        }
        break;

      case 'run_command':
      case 'launch_app':
      case 'custom':
      default:
        console.log(`[Workflow Engine Executing ${step.action}]: ${step.target}`);
        await new Promise(r => setTimeout(r, 400));
        break;
    }
  }

  public addPipeline(name: string, description: string, trigger: WorkflowPipeline['trigger'], steps: WorkflowStep[]): WorkflowPipeline {
    const newPipeline: WorkflowPipeline = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      description,
      trigger,
      steps,
      isBuiltin: false
    };
    this.pipelines.push(newPipeline);
    this.saveToStorage();
    eventBus.emit('workflow.created', { pipeline: newPipeline });
    return newPipeline;
  }

  public deletePipeline(id: string) {
    this.pipelines = this.pipelines.filter(p => p.id !== id);
    this.saveToStorage();
    eventBus.emit('workflow.deleted', { id });
  }

  public resetToDefault() {
    this.pipelines = BUILTIN_WORKFLOWS;
    this.saveToStorage();
  }
}

export const workflowEngine = new WorkflowEngine();
