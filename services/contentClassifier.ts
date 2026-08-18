import { 
  PresentationMode, 
  PresentationPayload, 
  OverviewData, 
  ParagraphData, 
  ParagraphSection, 
  StructureData, 
  CodeData, 
  DataPresentationData, 
  StructureFlowNode, 
  StructureTreeNode, 
  StructureStep,
  ComparisonCard 
} from '../types/workspace';

export interface ClassificationDecision {
  shouldOpenWorkspace: boolean;
  payload: PresentationPayload;
  reason: string;
}

export class ContentClassifier {
  /**
   * Intelligently classifies the user prompt and actual model response
   * into a rich presentation payload with accurate mode routing.
   * 
   * Architecture Directives:
   * 1. Smart Eligibility: Normal/short conversation, greetings, simple definitions ("Python kya hai?", "India ki capital?"),
   *    simple math, casual feelings ("mood kharab hai"), short live status checks MUST STAY IN CHAT/VOICE ONLY.
   * 2. Content-Aware Mode: Real mode (CODE, PARAGRAPH, STRUCTURE, DATA, OVERVIEW) selected based on true content.
   * 3. DATA is NEVER a fallback: DATA requires authentic tabular (markdown table) or genuine dataset content.
   * 4. Explicit User Format has highest priority ("in paragraph", "in table", "code do", "architecture diagram", "simple mein").
   */
  public static classify(
    prompt: string,
    responseText: string,
    options?: {
      sources?: Array<{ title: string; uri: string; snippet?: string }>;
      hasVisionFrame?: boolean;
      provider?: string;
      model?: string;
      forceOpen?: boolean;
    }
  ): ClassificationDecision {
    const p = prompt.toLowerCase().trim();
    const r = responseText.trim();

    // 1. Compute response text metrics
    const charCount = r.length;
    const words = r.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lines = r.split('\n');
    const headingLines = lines.filter(l => /^#{1,6}\s+/.test(l.trim()));

    // 2. Extract genuine content across all presentation dimensions
    const codeData = this.extractCode(r, prompt);
    const dataObj = this.extractData(r, prompt);
    const structureData = this.extractStructure(r, prompt);
    const paragraphData = this.extractParagraph(r, prompt);
    const overviewData = this.extractOverview(r, prompt, options?.sources);

    // Code metrics
    const totalCodeLines = codeData.files.reduce((acc, f) => acc + (f.lineCount || 0), 0);
    const hasCodeBlock = codeData.files.length > 0 && totalCodeLines >= 4;
    const hasSubstantialCode = totalCodeLines >= 10 || (codeData.files.length > 0 && totalCodeLines >= 6);

    // Tabular / Dataset metrics
    const hasRealTable = dataObj.type === 'table' && dataObj.hasRealData === true && (dataObj.rows?.length || 0) >= 2;
    const hasRealJson = dataObj.type === 'json' && dataObj.hasRealData === true && dataObj.jsonData !== null;
    const hasRealComparison = dataObj.type === 'comparison' && dataObj.hasRealData === true && (dataObj.comparisonCards?.length || 0) >= 2;
    const hasSubstantialData = hasRealTable || hasRealJson || hasRealComparison;

    // Structural / Architecture metrics
    const hasAsciiTree = r.includes('├──') || r.includes('└──') || r.includes('──') || r.includes('│');
    const hasAsciiFlow = (r.includes('->') || r.includes('→') || r.includes('↓')) && lines.filter(l => l.includes('->') || l.includes('→') || l.includes('↓')).length >= 2;
    const hasSubstantialSteps = (structureData.steps?.length || 0) >= 3;
    const hasSubstantialNodes = (structureData.nodes?.length || 0) >= 3;
    const hasSubstantialStructure = hasAsciiTree || hasAsciiFlow || hasSubstantialSteps || hasSubstantialNodes;

    // 3. User Intent Classification from Prompt

    // A. Explicit Format Requests
    const isExplicitCodeRequest = 
      /\b(code do|code banao|write code|give code|python code|script do|program do|function likho|code dikhao|code generate)\b/i.test(p);

    const isExplicitTableRequest = 
      /\b(table mein|table banao|tabular form|show in table|create a table|matrix mein|tabular format)\b/i.test(p);

    const isExplicitStructureRequest = 
      /\b(architecture|system design|flowchart|diagram|project structure|pipeline design|hierarchy|structure mein)\b/i.test(p);

    const isExplicitParagraphRequest = 
      /\b(paragraph mein|essay likho|story likho|kahani|long story|detailed story|in detail paragraph)\b/i.test(p);

    const isExplicitWorkspaceRequest = 
      p.includes('workspace me dikhao') || 
      p.includes('workspace mein dikhao') || 
      p.includes('show in workspace') || 
      p.includes('open in workspace') || 
      p.includes('open workspace') || 
      p.includes('display in workspace') || 
      p.includes('visualize in workspace');

    const isExplicitShortRequest = 
      /\b(simple mein|simple me|short mein|short me|in 1 line|in 2 lines|in 3 lines|one line|in short|briefly|quick answer|concisely|1 sentence|2 sentences)\b/i.test(p);

    // B. Conversational / Casual / Simple Queries (MUST STAY IN CHAT)
    const isGreetingOrCasual = 
      p.length < 40 && (
        /^(hello|hi|hey|good morning|good evening|good afternoon|how are you|kya haal|who are you|thanks|thank you|ok|okay|bye|namaste|jarvis)\b/i.test(p) ||
        /\b(mood kharab|kaisa hai|kaisi ho|bore ho raha|kaise ho|kaisi chal rahi)\b/i.test(p)
      );

    // Simple definitions & short factual queries (e.g. "Python kya hai?", "Capital of India?", "10+20?", "Weather kya hai?")
    const isSimpleDefinitionOrFact = 
      /^(python kya hai|ai kya hai|react kya hai|what is [a-z0-9 ]{2,30}|who is [a-z0-9 ]{2,30}|india ki capital|capital of [a-z ]+|weather kya hai|aaj ka weather|temperature kya hai|\d+\s*[\+\-\*\/]\s*\d+)\b/i.test(p) &&
      !isExplicitCodeRequest && !isExplicitTableRequest && !isExplicitStructureRequest && !p.includes('story') && !p.includes('detail');

    const isStory = 
      p.includes('story') || 
      p.includes('kahani') || 
      p.includes('tale') || 
      p.includes('novel') || 
      p.includes('chapter') || 
      p.includes('narrative') || 
      p.includes('essay') || 
      p.includes('fiction');

    const isSummaryPrompt = 
      p.includes('summarize') || 
      p.includes('summary') || 
      p.includes('executive summary') || 
      p.includes('briefing') || 
      p.includes('key points') || 
      p.includes('in 10 points') || 
      p.includes('10 points') || 
      p.includes('5 points') || 
      p.includes('takeaways');

    // 4. Determine Primary Presentation Mode
    let primaryMode: PresentationMode = 'PARAGRAPH';
    let headerTitle = 'JARVIS // INTELLIGENCE PRESENTATION';
    let category = 'Intelligence Dossier';

    // Priority 1: User requested Explicit Table or Response has authentic Table/Dataset
    if ((isExplicitTableRequest && hasRealTable) || (hasRealTable && !isStory && !hasCodeBlock)) {
      primaryMode = 'DATA';
      headerTitle = 'JARVIS // TABULAR DATA PRESENTATION';
      category = 'Tabular Presentation';
    }
    // Priority 2: User requested Code or Response has substantial Code block
    else if ((isExplicitCodeRequest && codeData.files.length > 0) || hasSubstantialCode || (codeData.files.length > 0 && totalCodeLines >= 5)) {
      primaryMode = 'CODE';
      const lang = codeData.files[0]?.language?.toUpperCase() || 'PYTHON';
      headerTitle = `JARVIS // ${lang} CODE PRESENTATION`;
      category = `${lang} Source`;
    }
    // Priority 3: Architecture / System Structure / Flowcharts
    else if (isExplicitStructureRequest || hasAsciiTree || hasAsciiFlow || (structureData.nodes && structureData.nodes.length >= 3)) {
      primaryMode = 'STRUCTURE';
      if (hasAsciiTree || p.includes('project structure')) {
        headerTitle = 'JARVIS // PROJECT HIERARCHY MAP';
        category = 'Module Hierarchy';
      } else {
        headerTitle = 'JARVIS // SYSTEM ARCHITECTURE';
        category = 'Architecture & Flow';
      }
    }
    // Priority 4: Authentic Data comparisons or JSON datasets (NEVER as generic fallback!)
    else if (dataObj.hasRealData && hasSubstantialData) {
      primaryMode = 'DATA';
      if (hasRealComparison) {
        headerTitle = 'JARVIS // COMPARATIVE MATRIX';
        category = 'Comparative Analysis';
      } else if (hasRealJson) {
        headerTitle = 'JARVIS // JSON DATA MATRIX';
        category = 'Structured Payload';
      } else {
        headerTitle = 'JARVIS // TABULAR PRESENTATION';
        category = 'Tabular Presentation';
      }
    }
    // Priority 5: Multi-point Executive Briefings / Live Internet Research
    else if (isSummaryPrompt && (overviewData.keyPoints.length >= 3 || headingLines.length >= 3)) {
      primaryMode = 'OVERVIEW';
      headerTitle = 'JARVIS // EXECUTIVE BRIEFING';
      category = 'Intelligence Briefing';
    }
    // Priority 6: Paragraph (Stories, Long-Form Articles, Deep Explanations)
    else {
      primaryMode = 'PARAGRAPH';
      if (isStory) {
        headerTitle = 'JARVIS // STORY PRESENTATION';
        category = 'Narrative Presentation';
      } else if (p.includes('explain') || p.includes('deep dive') || p.includes('guide') || isExplicitParagraphRequest) {
        headerTitle = 'JARVIS // TECHNICAL ANALYSIS';
        category = 'Comprehensive Analysis';
      } else {
        headerTitle = 'JARVIS // LONG-FORM DOSSIER';
        category = 'Intelligence Dossier';
      }
    }

    // 5. Intelligent Multi-Signal Decision: Should Workspace Open?
    let shouldOpen = false;

    // Direct Hard Rule 1: Explicit User Request to open in Workspace
    if (isExplicitWorkspaceRequest || options?.forceOpen) {
      shouldOpen = true;
    }
    // Direct Hard Rule 2: Explicit short request ("simple mein batao", "in short", "1 line mein") -> NEVER open workspace
    else if (isExplicitShortRequest) {
      shouldOpen = false;
    }
    // Direct Hard Rule 3: Greetings & Casual conversation ("Hello Jarvis", "Mood kharab hai") -> NEVER open workspace
    else if (isGreetingOrCasual) {
      shouldOpen = false;
    }
    // Direct Hard Rule 4: Simple definitions and short factual questions ("Python kya hai?", "Capital of India?", "10+20?", "Weather kya hai?") -> NEVER open workspace
    else if (isSimpleDefinitionOrFact) {
      shouldOpen = false;
    }
    // Direct Hard Rule 5: Short casual response (< 100 words, < 600 chars) without substantial code/tables -> Stay in Chat
    else if (wordCount < 100 && charCount < 600 && !hasCodeBlock && !hasRealTable && !hasAsciiTree && !hasAsciiFlow) {
      shouldOpen = false;
    }
    // Deep Evaluation by Mode:
    else {
      switch (primaryMode) {
        case 'CODE':
          // Open workspace for code blocks with >= 6 lines or if explicitly requested
          shouldOpen = hasCodeBlock || isExplicitCodeRequest || totalCodeLines >= 6;
          break;

        case 'DATA':
          // Open workspace ONLY if authentic table with >= 2 data rows or real comparison exists
          shouldOpen = hasSubstantialData || (isExplicitTableRequest && hasRealTable);
          break;

        case 'STRUCTURE':
          // Open workspace for ASCII trees, architectural flows, or structured diagrams
          shouldOpen = hasAsciiTree || hasAsciiFlow || isExplicitStructureRequest || hasSubstantialStructure;
          break;

        case 'OVERVIEW':
          // Open workspace for substantial briefings with >= 4 key bullet points
          shouldOpen = (overviewData.keyPoints.length >= 4) || (isSummaryPrompt && wordCount >= 120);
          break;

        case 'PARAGRAPH':
        default:
          // Open workspace for stories (>= 100 words), long narrative articles (>= 180 words / >= 900 chars), or multi-section documents
          shouldOpen = 
            (isStory && wordCount >= 80) || 
            wordCount >= 180 || 
            charCount >= 900 || 
            (paragraphData.sections.length >= 4 && wordCount >= 140) ||
            isExplicitParagraphRequest;
          break;
      }
    }

    // 6. Available Modes
    const availableModes: PresentationMode[] = ['PARAGRAPH'];
    if (overviewData.keyPoints.length >= 2 || wordCount >= 80) availableModes.push('OVERVIEW');
    if (structureData.nodes?.length || structureData.steps?.length || hasAsciiTree || hasAsciiFlow) availableModes.push('STRUCTURE');
    if (codeData.files.length > 0) availableModes.push('CODE');
    if (dataObj.hasRealData && (hasRealTable || hasRealJson || hasRealComparison)) availableModes.push('DATA');

    const payload: PresentationPayload = {
      id: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      headerTitle,
      category,
      sourcePrompt: prompt,
      timestamp: Date.now(),
      primaryMode,
      availableModes,
      rawContent: responseText,
      overview: overviewData,
      paragraph: paragraphData,
      structure: structureData,
      code: codeData,
      data: dataObj,
      metadata: {
        provider: options?.provider || 'JARVIS Core',
        model: options?.model || 'gemini-2.5-flash',
        sources: options?.sources || [],
        confidence: 0.99,
        wordCount: paragraphData.wordCount,
        lineCount: paragraphData.lineCount,
        readingTimeMinutes: paragraphData.readingTimeMinutes
      }
    };

    return {
      shouldOpenWorkspace: shouldOpen,
      payload,
      reason: shouldOpen 
        ? `Workspace Opened: Mode [${primaryMode}] (${category}) for: "${prompt.slice(0, 35)}..."` 
        : `Normal Chat: Stay in chat for prompt: "${prompt.slice(0, 35)}..."`
    };
  }

  /**
   * Generates genuine Paragraph presentation data from the exact response text.
   */
  private static extractParagraph(text: string, prompt: string): ParagraphData {
    const rawContent = text.trim();
    const lines = rawContent.split('\n');
    const words = rawContent.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const lineCount = lines.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    let title = '';
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
        title = trimmed.replace(/^[#\s]+/, '').trim();
        break;
      }
    }
    if (!title) {
      if (prompt.toLowerCase().includes('story')) {
        title = 'Generated Story';
      } else if (prompt) {
        title = prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt;
      } else {
        title = 'JARVIS Intelligence Presentation';
      }
    }

    const sections: ParagraphSection[] = [];
    let currentHeading = '';
    let currentBody: string[] = [];
    let currentBullets: string[] = [];
    let currentHighlight: string | undefined;
    let sectionIdx = 1;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
        if (currentBody.length > 0 || currentBullets.length > 0) {
          sections.push({
            id: `sec_${sectionIdx++}`,
            heading: currentHeading || undefined,
            body: currentBody.join('\n').trim(),
            bulletPoints: currentBullets.length > 0 ? currentBullets : undefined,
            highlight: currentHighlight
          });
          currentBody = [];
          currentBullets = [];
          currentHighlight = undefined;
        }
        currentHeading = line.replace(/^[#\s]+/, '').trim();
      } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        currentBullets.push(line.replace(/^[-*\d.]+\s*/, '').trim());
      } else if (line.startsWith('>') || line.startsWith('Important:') || line.startsWith('Note:')) {
        currentHighlight = line.replace(/^[>\s*]+/, '').trim();
      } else if (line.length > 0) {
        currentBody.push(rawLine);
      } else {
        if (currentBody.length > 0) {
          currentBody.push('');
        }
      }
    }

    if (currentBody.length > 0 || currentBullets.length > 0) {
      sections.push({
        id: `sec_${sectionIdx++}`,
        heading: currentHeading || undefined,
        body: currentBody.join('\n').trim(),
        bulletPoints: currentBullets.length > 0 ? currentBullets : undefined,
        highlight: currentHighlight
      });
    }

    return {
      title,
      content: rawContent,
      sections,
      markdownContent: rawContent,
      wordCount,
      lineCount,
      readingTimeMinutes
    };
  }

  /**
   * Generates genuine Overview data (Summary & real extracted key points).
   */
  private static extractOverview(text: string, prompt: string, sources?: Array<{ title: string; uri: string }>): OverviewData {
    const raw = text.trim();
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const words = raw.split(/\s+/).filter(Boolean);
    
    let summary = '';
    const nonHeadingLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('```') && !l.startsWith('|') && !l.startsWith('├──'));
    if (nonHeadingLines.length > 0) {
      summary = nonHeadingLines.slice(0, 4).join(' ');
      if (summary.length > 380) {
        summary = summary.substring(0, 380) + '...';
      }
    } else {
      summary = `JARVIS synthesized intelligence for: "${prompt}". Full content available in presentation view.`;
    }

    const bulletLines = lines.filter(l => l.startsWith('- ') || l.startsWith('* ') || /^\d+[\.\)]\s/.test(l));
    const keyPoints = bulletLines.map((line, idx) => {
      const clean = line.replace(/^[-*\d.)]+\s*/, '').trim();
      const parts = clean.split(/:\s|\s-\s/);
      if (parts.length > 1) {
        return {
          title: parts[0].replace(/[*_]/g, '').trim(),
          detail: parts.slice(1).join(' : ').trim(),
          tag: `POINT ${idx + 1}`
        };
      }
      return {
        title: `Key Insight #${idx + 1}`,
        detail: clean,
        tag: `POINT ${idx + 1}`
      };
    });

    if (keyPoints.length === 0) {
      const paras = raw.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20 && !p.startsWith('#'));
      paras.slice(0, 4).forEach((p, idx) => {
        keyPoints.push({
          title: `Key Takeaway #${idx + 1}`,
          detail: p.length > 180 ? `${p.slice(0, 177)}...` : p,
          tag: `SECTION ${idx + 1}`
        });
      });
    }

    const stats: OverviewData['stats'] = [
      { label: 'WORD COUNT', value: `${words.length} WORDS`, tone: 'positive' },
      { label: 'LINE COUNT', value: `${lines.length} LINES`, tone: 'neutral' },
      { label: 'READING TIME', value: `${Math.max(1, Math.ceil(words.length / 200))} MIN`, tone: 'accent' }
    ];

    if (sources && sources.length > 0) {
      stats.push({ label: 'GROUNDED SOURCES', value: `${sources.length} CITATIONS`, tone: 'positive' });
    }

    return {
      summary,
      keyPoints,
      stats
    };
  }

  /**
   * Extracts clean, real Code blocks from markdown code fences.
   */
  private static extractCode(text: string, prompt: string): CodeData {
    const files: CodeData['files'] = [];
    const codeRegex = /```(\w+)?(?:\s*[:\-]\s*([^\n\r]+))?\n([\s\S]*?)```/g;
    let match;
    let index = 1;

    while ((match = codeRegex.exec(text)) !== null) {
      const language = (match[1] || 'python').toLowerCase();
      const declaredName = match[2]?.trim();
      const code = match[3].trim();
      const lines = code.split('\n').length;
      
      const extMap: Record<string, string> = {
        python: 'py',
        py: 'py',
        typescript: 'ts',
        ts: 'ts',
        javascript: 'js',
        js: 'js',
        html: 'html',
        css: 'css',
        json: 'json',
        sql: 'sql',
        bash: 'sh',
        sh: 'sh',
        shell: 'sh',
        rust: 'rs',
        go: 'go',
        cpp: 'cpp',
        java: 'java'
      };

      const ext = extMap[language] || 'txt';
      const filename = declaredName || (prompt.toLowerCase().includes('calculator') ? `calculator.${ext}` : prompt.toLowerCase().includes('fibonacci') ? `fibonacci.${ext}` : `module_${index}.${ext}`);

      files.push({
        filename,
        language,
        code,
        lineCount: lines,
        description: `Source code snippet #${index} (${language.toUpperCase()})`
      });
      index++;
    }

    if (files.length === 0) {
      const isCodePrompt = prompt.toLowerCase().includes('python') || prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('calculator') || prompt.toLowerCase().includes('script');
      const hasCodeKeywords = text.includes('def ') || text.includes('function ') || text.includes('class ') || text.includes('import ') || text.includes('const ');
      
      if (isCodePrompt && hasCodeKeywords) {
        const lang = prompt.toLowerCase().includes('python') ? 'python' : 'typescript';
        const ext = lang === 'python' ? 'py' : 'ts';
        files.push({
          filename: prompt.toLowerCase().includes('calculator') ? `calculator.${ext}` : `script.${ext}`,
          language: lang,
          code: text.trim(),
          lineCount: text.split('\n').length,
          description: `Generated ${lang.toUpperCase()} program`
        });
      }
    }

    return { files, rawText: text };
  }

  /**
   * Generates genuine Structure Presentation (System Architecture / Project Tree / Flowchart).
   */
  private static extractStructure(text: string, prompt: string): StructureData {
    const p = prompt.toLowerCase();
    const r = text.trim();

    // 1. ASCII Tree Parsing (├──, └──, etc.)
    if (p.includes('project structure') || r.includes('├──') || r.includes('└──') || r.includes('──')) {
      const treeNodes = this.parseAsciiTree(text);
      if (treeNodes.length > 0) {
        return {
          type: 'project_tree',
          title: 'PROJECT HIERARCHY & DIRECTORY MAP',
          subtitle: 'Directory organization structure parsed from output',
          treeNodes,
          rawText: text
        };
      }
    }

    // 2. Parse Step-by-Step Execution Roadmap from numbered items
    const stepRegex = /(?:^|\n)(?:Step\s*(\d+)[:\.\-]|(\d+)[\.\)]\s+)\s*([^\n\r]+)([\s\S]*?)(?=(?:\n(?:Step\s*\d+|\d+[\.\)])|\n#|$))/gi;
    const steps: StructureStep[] = [];
    let stepMatch;

    while ((stepMatch = stepRegex.exec(text)) !== null) {
      const stepNum = parseInt(stepMatch[1] || stepMatch[2], 10);
      const title = stepMatch[3].replace(/[*_#]/g, '').trim();
      const descBlock = stepMatch[4]?.trim() || '';
      const cleanDesc = descBlock.replace(/^[*\s\-:]+/, '').split('\n')[0] || title;

      if (!isNaN(stepNum) && title) {
        steps.push({
          step: stepNum,
          title,
          description: cleanDesc.length > 160 ? `${cleanDesc.slice(0, 157)}...` : cleanDesc,
          tag: `STEP ${stepNum}`
        });
      }
    }

    // 3. Parse Architecture Subsystems from Headings or ASCII arrows (USER -> CORE -> ROUTER)
    const nodes: StructureFlowNode[] = [];
    const ICON_LIST = ['Cpu', 'Network', 'Sparkles', 'Terminal', 'Layout', 'User', 'Monitor'];

    // Check if there are arrow flow lines (e.g. USER \n ↓ \n VOICE INPUT \n ↓ \n CORE ...)
    if (text.includes('↓') || text.includes('->') || text.includes('├──')) {
      const arrowBlocks = text.split(/↓|->|→|\n\s*\|\s*\n/g).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50);
      if (arrowBlocks.length >= 3) {
        arrowBlocks.slice(0, 8).forEach((block, idx) => {
          nodes.push({
            id: `node_flow_${idx + 1}`,
            label: block.replace(/[*_#`]/g, '').trim(),
            sublabel: `Flow Node 0${idx + 1}`,
            iconName: ICON_LIST[idx % ICON_LIST.length],
            badge: `STAGE 0${idx + 1}`,
            description: `Sequential execution stage ${idx + 1}`
          });
        });
      }
    }

    if (nodes.length === 0) {
      const sectionRegex = /(?:^|\n)#{1,3}\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#{1,3}\s+|$))/g;
      let secMatch;
      let nodeIndex = 1;

      while ((secMatch = sectionRegex.exec(text)) !== null) {
        const heading = secMatch[1].replace(/[*_]/g, '').trim();
        const body = secMatch[2].trim();
        const firstLine = body.split('\n')[0].replace(/^[-*\s]+/, '').trim();

        if (heading && heading.toLowerCase() !== 'introduction' && heading.toLowerCase() !== 'conclusion') {
          nodes.push({
            id: `node_${nodeIndex}`,
            label: heading,
            sublabel: `Subsystem ${nodeIndex}`,
            iconName: ICON_LIST[(nodeIndex - 1) % ICON_LIST.length],
            badge: `STAGE ${nodeIndex}`,
            description: firstLine.length > 140 ? `${firstLine.slice(0, 137)}...` : (firstLine || 'Core architectural component')
          });
          nodeIndex++;
        }
      }
    }

    if (nodes.length === 0) {
      const bullets = text.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
      bullets.slice(0, 6).forEach((b, idx) => {
        const clean = b.replace(/^[-*\s]+/, '').trim();
        const parts = clean.split(/:\s|\s-\s/);
        nodes.push({
          id: `node_${idx + 1}`,
          label: parts[0].replace(/[*_]/g, '').trim(),
          sublabel: `Layer 0${idx + 1}`,
          iconName: ICON_LIST[idx % ICON_LIST.length],
          badge: `MODULE 0${idx + 1}`,
          description: parts[1] || 'Subsystem architecture node'
        });
      });
    }

    return {
      type: 'system_architecture',
      title: 'JARVIS // SYSTEM ARCHITECTURE',
      subtitle: 'Structural relationship matrix synthesized from real output',
      nodes: nodes.length > 0 ? nodes : undefined,
      steps: steps.length > 0 ? steps : undefined,
      rawText: text
    };
  }

  /**
   * Generates genuine Data presentation data (Markdown Tables, JSON, Comparisons).
   * NEVER returns mock rows or synthetic numbers!
   */
  private static extractData(text: string, prompt: string): DataPresentationData {
    const p = prompt.toLowerCase();

    // 1. Explicit Markdown Table Parsing
    const tableRegex = /\|(.+)\|[\r\n]+\|[-:| ]+\|[\r\n]+((?:\|.+\|[\r\n]*)+)/;
    const match = text.match(tableRegex);
    if (match) {
      try {
        const headerLine = match[1];
        const bodyBlock = match[2];

        const rawCols = headerLine
          .split('|')
          .map(c => c.trim())
          .filter(Boolean);

        const columns = rawCols.map((col, i) => ({
          key: `col_${i}_${col.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          label: col,
          type: 'text' as const
        }));

        const rows: Record<string, any>[] = [];
        const rowLines = bodyBlock.trim().split('\n');

        for (const rLine of rowLines) {
          const cells = rLine.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
          if (cells.length === 0) continue;
          const rowObj: Record<string, any> = {};
          columns.forEach((col, idx) => {
            rowObj[col.key] = cells[idx] || '';
          });
          rows.push(rowObj);
        }

        if (columns.length >= 2 && rows.length >= 2) {
          return {
            type: 'table',
            title: p.includes('compare') ? 'MODEL COMPARISON MATRIX' : 'SYNTHESIZED DATA TABLE',
            columns,
            rows,
            rawFormatted: match[0],
            hasRealData: true
          };
        }
      } catch {
        // Fall through
      }
    }

    // 2. Real JSON parsing
    const explicitJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (explicitJsonMatch) {
      try {
        const parsed = JSON.parse(explicitJsonMatch[1].trim());
        if (parsed && typeof parsed === 'object') {
          return {
            type: 'json',
            title: 'PARSED JSON DATA MATRIX',
            jsonData: parsed,
            rawFormatted: JSON.stringify(parsed, null, 2),
            hasRealData: true
          };
        }
      } catch {
        // Fall through
      }
    }

    // 3. Real Comparison Extraction
    const isComparisonPrompt = p.includes('compare') || p.includes('comparison') || /\bvs\b|\bversus\b/i.test(p);
    if (isComparisonPrompt) {
      const cards = this.parseComparisonCards(text);
      if (cards.length >= 2) {
        return {
          type: 'comparison',
          title: 'REAL COMPARATIVE ANALYSIS MATRIX',
          comparisonCards: cards,
          hasRealData: true
        };
      }
    }

    // No valid table, JSON, or comparison was generated in this response
    return {
      type: 'table',
      title: 'DATA PRESENTATION',
      hasRealData: false
    };
  }

  /**
   * Helper to parse real comparison subjects and points from text.
   */
  private static parseComparisonCards(text: string): ComparisonCard[] {
    const cards: ComparisonCard[] = [];
    const sectionRegex = /(?:^|\n)#{1,3}\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#{1,3}\s+|$))/g;
    let match;

    while ((match = sectionRegex.exec(text)) !== null) {
      const title = match[1].replace(/[*_]/g, '').trim();
      const body = match[2].trim();
      const bullets = body.split('\n')
        .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))
        .map(l => l.replace(/^[-*\s]+/, '').trim());

      if (bullets.length > 0) {
        cards.push({
          subject: title,
          badge: 'EVALUATED MODEL / SYSTEM',
          pros: bullets.slice(0, 5),
          specs: {
            'Attribute Focus': 'Comparative Evaluation',
            'Context Points': `${bullets.length} Key Characteristics`
          },
          verdict: body.split('\n').filter(l => !l.startsWith('-') && !l.startsWith('*')).join(' ').trim().slice(0, 140)
        });
      }
    }

    return cards;
  }

  /**
   * Helper to parse ASCII trees into real interactive hierarchy nodes.
   */
  private static parseAsciiTree(text: string): StructureTreeNode[] {
    const lines = text.split('\n');
    const rootNodes: StructureTreeNode[] = [];
    const stack: { node: StructureTreeNode; depth: number }[] = [];

    for (const rawLine of lines) {
      if (!rawLine.includes('──') && !rawLine.includes('|') && !rawLine.includes('/')) continue;
      
      const cleanLine = rawLine.replace(/[│├└─|\\]+/g, '').trim();
      if (!cleanLine) continue;

      const depth = rawLine.indexOf(cleanLine[0]);
      const isFolder = cleanLine.endsWith('/') || !cleanLine.includes('.');
      const name = cleanLine.replace(/\/$/, '');

      const newNode: StructureTreeNode = {
        id: `node_${Math.random().toString(36).substr(2, 6)}`,
        name,
        type: isFolder ? 'folder' : 'file',
        description: isFolder ? 'Directory module' : 'Source file'
      };

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      if (stack.length === 0) {
        rootNodes.push(newNode);
      } else {
        const parent = stack[stack.length - 1].node;
        if (!parent.children) parent.children = [];
        parent.children.push(newNode);
      }

      if (isFolder) {
        stack.push({ node: newNode, depth });
      }
    }

    return rootNodes;
  }
}
