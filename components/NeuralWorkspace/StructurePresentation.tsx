import React, { useState } from 'react';
import { StructureData, StructureTreeNode } from '../../types/workspace';
import { 
  Network, 
  Folder, 
  FolderOpen, 
  FileCode, 
  Cpu, 
  User, 
  Layout, 
  Sparkles, 
  Terminal, 
  Monitor, 
  ArrowRight, 
  Layers,
  ChevronRight,
  ChevronDown,
  BookOpen
} from 'lucide-react';

interface StructurePresentationProps {
  structure: StructureData;
}

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  Layout,
  Cpu,
  Network,
  Sparkles,
  Terminal,
  Monitor,
  Layers
};

export const StructurePresentation: React.FC<StructurePresentationProps> = ({ structure }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 animate-fadeIn select-text">
      {/* Header */}
      <div className="border-b border-cyan-500/20 pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              STRUCTURAL RELATIONSHIP & ARCHITECTURE MATRIX
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white tracking-wide">
            {structure.title}
          </h2>
          {structure.subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {structure.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Case 1: Project Hierarchy Directory Tree */}
      {structure.treeNodes && structure.treeNodes.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/25 backdrop-blur-xl shadow-lg">
          <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase mb-6 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            DIRECTORY & MODULE STRUCTURE
          </h3>
          <div className="space-y-3 font-mono text-sm">
            {structure.treeNodes.map((node) => (
              <TreeNodeItem key={node.id} node={node} level={0} />
            ))}
          </div>
        </div>
      )}

      {/* Case 2: Parsed Architecture Subsystems Grid */}
      {structure.nodes && structure.nodes.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.08)] flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              SYSTEM ARCHITECTURE SUBSYSTEMS ({structure.nodes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {structure.nodes.map((node, index) => {
              const IconComponent = (node.iconName && ICON_MAP[node.iconName]) || Cpu;
              const isLast = index === structure.nodes!.length - 1;

              return (
                <div
                  key={node.id}
                  className="p-5 rounded-2xl bg-black/50 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <IconComponent className="w-4 h-4 text-cyan-300" />
                      </div>
                      {node.badge && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase">
                          {node.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-orbitron font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {node.label}
                    </h4>
                    {node.sublabel && (
                      <span className="text-[11px] font-mono text-cyan-400/80 block mb-2 font-medium">
                        {node.sublabel}
                      </span>
                    )}

                    {node.description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal mt-2">
                        {node.description}
                      </p>
                    )}
                  </div>

                  {!isLast && (
                    <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>NEXT COMPONENT</span>
                      <div className="flex items-center gap-1 text-cyan-400 font-bold">
                        <span>FLOW</span>
                        <ArrowRight className="w-3 h-3 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case 3: Step-by-Step Pipeline Roadmap */}
      {structure.steps && structure.steps.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/20 backdrop-blur-xl">
          <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase mb-6 flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            SEQUENTIAL EXECUTION STEPS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {structure.steps.map((st) => (
              <div
                key={st.step}
                onClick={() => setActiveStep(activeStep === st.step ? null : st.step)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  activeStep === st.step
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                    : 'bg-black/40 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-orbitron font-bold flex items-center justify-center">
                    0{st.step}
                  </span>
                  {st.tag && (
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {st.tag}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-white mb-1.5">{st.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{st.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case 4: Full Architecture Details & Narrative from JARVIS */}
      {structure.rawText && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/20 backdrop-blur-xl">
          <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            FULL ARCHITECTURE SPECIFICATION & DETAILS
          </h3>
          <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line font-normal space-y-4">
            {structure.rawText}
          </div>
        </div>
      )}
    </div>
  );
};

interface TreeNodeItemProps {
  node: StructureTreeNode;
  level: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, level }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder' || (node.children && node.children.length > 0);

  return (
    <div className="flex flex-col gap-1">
      <div
        onClick={() => isFolder && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${level * 20}px` }}
        className={`flex items-center gap-2 p-2 rounded-xl transition-colors cursor-pointer ${
          isFolder ? 'hover:bg-cyan-950/40 text-cyan-200' : 'hover:bg-slate-900/60 text-slate-300'
        }`}
      >
        {isFolder ? (
          isOpen ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        ) : (
          <div className="w-3.5 h-3.5 shrink-0" />
        )}

        {isFolder ? (
          isOpen ? <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" /> : <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
        ) : (
          <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
        )}

        <span className="font-mono text-xs sm:text-sm font-semibold">{node.name}</span>
        {node.description && (
          <span className="text-[10px] font-mono text-slate-500 ml-2 hidden sm:inline">
            // {node.description}
          </span>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div className="flex flex-col border-l border-cyan-500/15 ml-3 pl-1">
          {node.children.map((child) => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
