import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Network, Plus, Trash2, Search, Link2, Sparkles, Filter, Database, Tag, ArrowRight } from 'lucide-react';
import { KnowledgeNode, KnowledgeEdge, KnowledgeNodeType } from '../types';
import { memorySystem } from '../memory/memorySystem';
import { playDigitalPingSound, playWhooshSound } from '../services/soundEffects';

const NODE_TYPE_COLORS: Record<KnowledgeNodeType, { bg: string; text: string; border: string; dot: string }> = {
  Person: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-400/50', dot: 'bg-cyan-400' },
  Project: { bg: 'bg-purple-950/60', text: 'text-purple-300', border: 'border-purple-400/50', dot: 'bg-purple-400' },
  Goal: { bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-400/50', dot: 'bg-emerald-400' },
  Tech: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-400/50', dot: 'bg-blue-400' },
  Concept: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-400/50', dot: 'bg-amber-400' },
  File: { bg: 'bg-slate-900/80', text: 'text-slate-300', border: 'border-slate-500/50', dot: 'bg-slate-400' },
  Preference: { bg: 'bg-rose-950/60', text: 'text-rose-300', border: 'border-rose-400/50', dot: 'bg-rose-400' }
};

export const KnowledgeGraphView: React.FC = () => {
  const graph = useSyncExternalStore(
    (cb) => memorySystem.subscribe(cb),
    () => memorySystem.getGraph()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);

  // New Node State
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState<KnowledgeNodeType>('Project');
  const [nodePropKey, setNodePropKey] = useState('');
  const [nodePropVal, setNodePropVal] = useState('');

  // New Edge State
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relation, setRelation] = useState('DEPENDS_ON');

  const filteredGraph = searchQuery ? memorySystem.search(searchQuery) : graph;

  const selectedNode = graph.nodes.find(n => n.id === selectedNodeId);

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;
    const props: Record<string, string> = {};
    if (nodePropKey.trim() && nodePropVal.trim()) {
      props[nodePropKey.trim()] = nodePropVal.trim();
    }
    const created = memorySystem.addNode(nodeName.trim(), nodeType, props);
    playDigitalPingSound();
    setSelectedNodeId(created.id);
    setNodeName('');
    setNodePropKey('');
    setNodePropVal('');
    setIsAddNodeOpen(false);
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    memorySystem.addEdge(sourceId, targetId, relation);
    playDigitalPingSound();
    setIsAddEdgeOpen(false);
    setSourceId('');
    setTargetId('');
  };

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search Query */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge graph (entities, concepts, tech)..."
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 font-mono placeholder:text-slate-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsAddNodeOpen(!isAddNodeOpen); setIsAddEdgeOpen(false); playWhooshSound(); }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-cyan-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> ADD ENTITY
          </button>
          <button
            onClick={() => { setIsAddEdgeOpen(!isAddEdgeOpen); setIsAddNodeOpen(false); playWhooshSound(); }}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 text-purple-300 text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Link2 className="w-3.5 h-3.5" /> LINK RELATION
          </button>
        </div>
      </div>

      {/* Add Entity Form Drawer */}
      {isAddNodeOpen && (
        <form onSubmit={handleAddNode} className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbitron font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> New Knowledge Node
            </span>
            <button type="button" onClick={() => setIsAddNodeOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="Entity / Concept Name..."
              required
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-400/60"
            />
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as KnowledgeNodeType)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-orbitron focus:outline-none focus:border-cyan-400/60"
            >
              <option value="Person">Person</option>
              <option value="Project">Project</option>
              <option value="Goal">Goal</option>
              <option value="Tech">Tech</option>
              <option value="Concept">Concept</option>
              <option value="File">File</option>
              <option value="Preference">Preference</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={nodePropKey}
              onChange={(e) => setNodePropKey(e.target.value)}
              placeholder="Property Key (e.g., status)"
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60"
            />
            <input
              type="text"
              value={nodePropVal}
              onChange={(e) => setNodePropVal(e.target.value)}
              placeholder="Property Value (e.g., Active)"
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400/60"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-orbitron text-xs font-bold py-2 rounded-xl transition-all uppercase tracking-widest"
          >
            Commit Node To Memory Graph
          </button>
        </form>
      )}

      {/* Add Edge Form Drawer */}
      {isAddEdgeOpen && (
        <form onSubmit={handleAddEdge} className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbitron font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5" /> Connect Nodes
            </span>
            <button type="button" onClick={() => setIsAddEdgeOpen(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-purple-300 focus:outline-none focus:border-purple-400/60"
              required
            >
              <option value="">Select Source Node...</option>
              {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
            </select>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Relation (e.g. USES_TECH)"
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400/60"
              required
            />
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-purple-300 focus:outline-none focus:border-purple-400/60"
              required
            >
              <option value="">Select Target Node...</option>
              {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-300 font-orbitron text-xs font-bold py-2 rounded-xl transition-all uppercase tracking-widest"
          >
            Establish Relation Link
          </button>
        </form>
      )}

      {/* Main Knowledge Graph Display & Inspector Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
        {/* Nodes Grid Canvas */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-4 overflow-y-auto custom-scroll space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-orbitron font-bold text-slate-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> KNOWLEDGE NODES ({filteredGraph.nodes.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {filteredGraph.edges.length} RELATIONAL LINKS
            </span>
          </div>

          {filteredGraph.nodes.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-slate-500 uppercase tracking-widest">
              No matching knowledge nodes found in graph.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredGraph.nodes.map((node) => {
                const style = NODE_TYPE_COLORS[node.type] || NODE_TYPE_COLORS.Concept;
                const isSelected = node.id === selectedNodeId;
                const connectedEdges = graph.edges.filter(e => e.sourceId === node.id || e.targetId === node.id);

                return (
                  <div
                    key={node.id}
                    onClick={() => { setSelectedNodeId(node.id); playWhooshSound(); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between gap-2 ${
                      isSelected 
                        ? `${style.bg} ${style.border} shadow-[0_0_20px_rgba(0,242,255,0.2)] ring-1 ring-cyan-400/50` 
                        : 'bg-black/50 border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                        <span className={`text-xs font-bold font-sans truncate ${style.text}`}>
                          {node.name}
                        </span>
                      </div>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border uppercase shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                        {node.type}
                      </span>
                    </div>

                    {/* Edge Badges */}
                    {connectedEdges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {connectedEdges.slice(0, 3).map(edge => {
                          const isSource = edge.sourceId === node.id;
                          const otherId = isSource ? edge.targetId : edge.sourceId;
                          const otherNode = graph.nodes.find(n => n.id === otherId);
                          return (
                            <span key={edge.id} className="text-[8px] font-mono bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-1">
                              <span>{edge.relation}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-cyan-400" />
                              <span className="text-slate-300 font-bold">{otherNode?.name || 'Node'}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Node Inspector Panel */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto custom-scroll">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10 shrink-0">
            <Tag className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-orbitron font-bold text-slate-200 uppercase tracking-widest">NODE INSPECTOR</span>
          </div>

          {selectedNode ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{selectedNode.type}</span>
                <h4 className="text-sm font-bold font-orbitron text-cyan-200">{selectedNode.name}</h4>
                <p className="text-[9px] font-mono text-slate-400">ID: {selectedNode.id}</p>
              </div>

              {/* Node Properties */}
              <div className="space-y-2">
                <span className="text-[10px] font-orbitron font-bold text-slate-400 uppercase tracking-wider">PROPERTIES</span>
                <div className="bg-black/60 p-3 rounded-xl border border-white/10 space-y-1.5 font-mono text-xs">
                  {Object.entries(selectedNode.properties).length === 0 ? (
                    <span className="text-slate-500 text-[10px]">No properties set.</span>
                  ) : (
                    Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-cyan-400">{k}:</span>
                        <span className="text-slate-200 font-sans">{String(v)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Related Edges */}
              <div className="space-y-2">
                <span className="text-[10px] font-orbitron font-bold text-slate-400 uppercase tracking-wider">GRAPH CONNECTIONS</span>
                <div className="space-y-1.5">
                  {graph.edges
                    .filter(e => e.sourceId === selectedNode.id || e.targetId === selectedNode.id)
                    .map(edge => {
                      const isSource = edge.sourceId === selectedNode.id;
                      const otherId = isSource ? edge.targetId : edge.sourceId;
                      const otherNode = graph.nodes.find(n => n.id === otherId);
                      return (
                        <div key={edge.id} className="p-2 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-purple-400 font-bold">{edge.relation}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-200">{otherNode?.name}</span>
                          </div>
                          <button
                            onClick={() => memorySystem.deleteEdge(edge.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Remove relation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Delete Node Control */}
              <button
                onClick={() => {
                  memorySystem.deleteNode(selectedNode.id);
                  setSelectedNodeId(null);
                }}
                className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-orbitron font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> DELETE ENTITY FROM GRAPH
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-mono">Select any node in the knowledge graph to inspect details and relations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
