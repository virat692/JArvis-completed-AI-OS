export type PresentationMode = 'OVERVIEW' | 'PARAGRAPH' | 'STRUCTURE' | 'CODE' | 'DATA';

export interface WorkspaceSource {
  title: string;
  uri: string;
  snippet?: string;
}

export interface WorkspaceContent {
  type: PresentationMode;
  title: string;
  subtitle?: string;
  content: string; // The exact, full raw content supplied by JARVIS
  metadata?: {
    provider?: string;
    model?: string;
    sources?: WorkspaceSource[];
    lineCount?: number;
    wordCount?: number;
    readingTimeMinutes?: number;
  };
}

export interface OverviewPoint {
  title: string;
  detail: string;
  tag?: string;
}

export interface OverviewData {
  summary: string;
  keyPoints: OverviewPoint[];
  stats?: Array<{
    label: string;
    value: string;
    change?: string;
    tone?: 'positive' | 'neutral' | 'accent' | 'warning';
  }>;
  statusBadges?: Array<{
    label: string;
    status: 'ONLINE' | 'OPTIMAL' | 'ACTIVE' | 'VERIFIED' | 'READY';
  }>;
}

export interface ParagraphSection {
  id: string;
  heading?: string;
  subheading?: string;
  body: string;
  bulletPoints?: string[];
  highlight?: string;
  quote?: string;
}

export interface ParagraphData {
  title: string;
  content: string; // Complete un-truncated generated story or explanation
  sections?: ParagraphSection[];
  markdownContent: string;
  wordCount: number;
  lineCount: number;
  readingTimeMinutes: number;
}

export interface StructureTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'module' | 'service';
  children?: StructureTreeNode[];
  description?: string;
  badge?: string;
}

export interface StructureFlowNode {
  id: string;
  label: string;
  sublabel?: string;
  layer?: string;
  iconName?: string;
  badge?: string;
  description?: string;
}

export interface StructureFlowEdge {
  from: string;
  to: string;
  label?: string;
  arrowType?: 'solid' | 'pulse';
}

export interface StructureStep {
  step: number;
  title: string;
  description: string;
  tag?: string;
}

export interface StructureData {
  type: 'system_architecture' | 'project_tree' | 'flowchart' | 'hierarchy';
  title: string;
  subtitle?: string;
  nodes?: StructureFlowNode[];
  flows?: StructureFlowEdge[];
  treeNodes?: StructureTreeNode[];
  steps?: StructureStep[];
  rawText: string;
}

export interface CodeFile {
  filename: string;
  language: string;
  code: string;
  description?: string;
  lineCount?: number;
}

export interface CodeData {
  files: CodeFile[];
  rawText?: string;
}

export interface DataTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'number';
}

export interface ComparisonCard {
  subject: string;
  badge: string;
  pros: string[];
  specs: Record<string, string>;
  verdict?: string;
}

export interface DataPresentationData {
  type: 'table' | 'json' | 'yaml' | 'comparison' | 'metrics';
  title: string;
  columns?: DataTableColumn[];
  rows?: Array<Record<string, any>>;
  jsonData?: any;
  rawFormatted?: string;
  comparisonCards?: ComparisonCard[];
  hasRealData?: boolean;
}

export interface PresentationPayload {
  id: string;
  headerTitle: string; // e.g. "JARVIS // SYSTEM ARCHITECTURE"
  category: string;
  sourcePrompt: string;
  timestamp: number;
  primaryMode: PresentationMode;
  availableModes: PresentationMode[];
  rawContent: string; // The exact, full untruncated response from JARVIS
  overview: OverviewData;
  paragraph: ParagraphData;
  structure: StructureData;
  code: CodeData;
  data: DataPresentationData;
  metadata?: {
    provider?: string;
    model?: string;
    sources?: WorkspaceSource[];
    executionTimeMs?: number;
    confidence?: number;
    wordCount?: number;
    lineCount?: number;
    readingTimeMinutes?: number;
  };
}

export interface WorkspaceHistoryEntry {
  id: string;
  title: string;
  presentationType: PresentationMode;
  payload: PresentationPayload; // Complete original payload
  rawContent: string; // Complete un-truncated content
  sourcePrompt: string;
  date: string; // e.g. "16 Aug 2026"
  time: string; // e.g. "22:30"
  timestamp: number;
  description?: string;
  stats?: {
    lineCount?: number;
    wordCount?: number;
    charCount?: number;
  };
}

export type WorkspaceHistoryFilter = 'ALL' | PresentationMode;

// Backward-compatibility aliases if needed
export type NeuralWorkspaceType = PresentationMode;
export type WorkspaceItem = PresentationPayload;


