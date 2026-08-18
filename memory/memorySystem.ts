import { KnowledgeNode, KnowledgeEdge, GraphQueryResult, KnowledgeNodeType } from '../types';
import { eventBus } from '../services/eventBus';

const STORAGE_NODES_KEY = 'jarvis_knowledge_nodes';
const STORAGE_EDGES_KEY = 'jarvis_knowledge_edges';

const DEFAULT_NODES: KnowledgeNode[] = [
  {
    id: 'node_1',
    name: 'Virat Prajapati',
    type: 'Person',
    properties: { role: 'Primary Operator / Creator', clearance: 'Level 5 Administrator', status: 'Active' },
    timestamp: Date.now() - 10000000
  },
  {
    id: 'node_2',
    name: 'JARVIS AI OS',
    type: 'Project',
    properties: { architecture: 'Continuous Autonomous OS', version: 'v3.0 Phase 2', status: 'Online' },
    timestamp: Date.now() - 9000000
  },
  {
    id: 'node_3',
    name: 'React 18 & Tailwind CSS',
    type: 'Tech',
    properties: { stack: 'Frontend Core', styling: 'Tailwind v3', language: 'TypeScript' },
    timestamp: Date.now() - 8000000
  },
  {
    id: 'node_4',
    name: 'Autonomous Operations',
    type: 'Goal',
    properties: { objective: '24/7 background runtime & self-healing workflows', priority: 'Critical' },
    timestamp: Date.now() - 7000000
  },
  {
    id: 'node_5',
    name: 'Neural Canvas & Audio Synthesis',
    type: 'Concept',
    properties: { module: 'Multimedia Synthesis', frequency: 'WebAudio API' },
    timestamp: Date.now() - 6000000
  }
];

const DEFAULT_EDGES: KnowledgeEdge[] = [
  { id: 'edge_1', sourceId: 'node_1', targetId: 'node_2', relation: 'COMMANDS', weight: 1.0 },
  { id: 'edge_2', sourceId: 'node_2', targetId: 'node_3', relation: 'BUILT_WITH', weight: 0.9 },
  { id: 'edge_3', sourceId: 'node_1', targetId: 'node_4', relation: 'HAS_GOAL', weight: 1.0 },
  { id: 'edge_4', sourceId: 'node_2', targetId: 'node_5', relation: 'INTEGRATES', weight: 0.8 }
];

export class MemorySystem {
  private nodes: KnowledgeNode[] = [];
  private edges: KnowledgeEdge[] = [];
  private listeners: Array<() => void> = [];
  private cachedGraph: GraphQueryResult = { nodes: [], edges: [] };

  constructor() {
    this.loadFromStorage();
    this.updateCache();
  }

  private updateCache() {
    this.cachedGraph = { nodes: this.nodes, edges: this.edges };
  }

  private loadFromStorage() {
    try {
      const savedNodes = localStorage.getItem(STORAGE_NODES_KEY);
      const savedEdges = localStorage.getItem(STORAGE_EDGES_KEY);
      this.nodes = savedNodes ? JSON.parse(savedNodes) : DEFAULT_NODES;
      this.edges = savedEdges ? JSON.parse(savedEdges) : DEFAULT_EDGES;
    } catch {
      this.nodes = DEFAULT_NODES;
      this.edges = DEFAULT_EDGES;
    }
    this.updateCache();
  }

  private saveToStorage() {
    this.updateCache();
    try {
      localStorage.setItem(STORAGE_NODES_KEY, JSON.stringify(this.nodes));
      localStorage.setItem(STORAGE_EDGES_KEY, JSON.stringify(this.edges));
    } catch (e) {
      console.warn('MemorySystem save error:', e);
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

  public getGraph(): GraphQueryResult {
    return this.cachedGraph;
  }

  public addNode(name: string, type: KnowledgeNodeType, properties: Record<string, string> = {}): KnowledgeNode {
    const newNode: KnowledgeNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      type,
      properties,
      timestamp: Date.now()
    };
    this.nodes.push(newNode);
    this.saveToStorage();

    eventBus.emit('memory.node_added', { node: newNode });
    return newNode;
  }

  public addEdge(sourceId: string, targetId: string, relation: string, weight: number = 1.0): KnowledgeEdge {
    const newEdge: KnowledgeEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sourceId,
      targetId,
      relation: relation.toUpperCase().replace(/\s+/g, '_'),
      weight
    };
    this.edges.push(newEdge);
    this.saveToStorage();

    eventBus.emit('memory.edge_added', { edge: newEdge });
    return newEdge;
  }

  public deleteNode(id: string) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
    this.saveToStorage();
    eventBus.emit('memory.node_deleted', { id });
  }

  public deleteEdge(id: string) {
    this.edges = this.edges.filter(e => e.id !== id);
    this.saveToStorage();
    eventBus.emit('memory.edge_deleted', { id });
  }

  public search(query: string): GraphQueryResult {
    if (!query.trim()) return this.getGraph();
    const q = query.toLowerCase();
    const matchedNodes = this.nodes.filter(n => 
      n.name.toLowerCase().includes(q) || 
      n.type.toLowerCase().includes(q) ||
      Object.values(n.properties).some(v => String(v).toLowerCase().includes(q))
    );
    const matchedIds = new Set(matchedNodes.map(n => n.id));

    const matchedEdges = this.edges.filter(e => matchedIds.has(e.sourceId) || matchedIds.has(e.targetId));
    
    // Expand to include connected nodes
    matchedEdges.forEach(e => {
      matchedIds.add(e.sourceId);
      matchedIds.add(e.targetId);
    });

    const finalNodes = this.nodes.filter(n => matchedIds.has(n.id));

    eventBus.emit('memory.queried', { query, count: finalNodes.length });
    return { nodes: finalNodes, edges: matchedEdges };
  }

  public resetToDefault() {
    this.nodes = DEFAULT_NODES;
    this.edges = DEFAULT_EDGES;
    this.saveToStorage();
  }
}

export const memorySystem = new MemorySystem();
