import React, { useState } from 'react';
import { ParagraphData } from '../../types/workspace';
import { 
  BookOpen, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  FileText, 
  Layers, 
  Sparkles,
  AlignLeft
} from 'lucide-react';
import { playTickSound } from '../../services/soundEffects';

interface ParagraphPresentationProps {
  paragraph: ParagraphData;
}

export const ParagraphPresentation: React.FC<ParagraphPresentationProps> = ({ paragraph }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(paragraph.content || paragraph.markdownContent || '');
    setCopied(true);
    playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = paragraph.content || paragraph.markdownContent || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paragraph.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'jarvis_document'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playTickSound();
  };

  const rawContent = paragraph.content || paragraph.markdownContent || '';
  const lines = rawContent.split('\n');

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn select-text">
      {/* Document Header & Reading Metrics Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#061224]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,242,255,0.06)] flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                NARRATIVE & DOCUMENTATION PRESENTATION
              </span>
              <h2 className="text-lg sm:text-xl font-orbitron font-extrabold text-white tracking-wide">
                {paragraph.title}
              </h2>
            </div>
          </div>

          {/* Action buttons: Copy & Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Copy entire story to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-300" />}
              <span>{copied ? 'Copied Full Text' : 'Copy Story'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95"
              title="Download as Text file (.txt)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download .txt</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Badges (Real Word Count, Line Count, Reading Time) */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap pt-3 border-t border-cyan-500/15 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>{paragraph.wordCount || rawContent.split(/\s+/).filter(Boolean).length} words</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{paragraph.lineCount || lines.length} lines</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>~{paragraph.readingTimeMinutes || Math.max(1, Math.ceil((paragraph.wordCount || 100) / 200))} min read</span>
          </div>
        </div>
      </div>

      {/* Main Document Reading Canvas (Scrollable, Full Length, Pristine Spacing) */}
      <article className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-[#040a17]/90 border border-cyan-500/25 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-6 relative overflow-hidden">
        {/* Subtle holographic watermark */}
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5">
          <Sparkles className="w-48 h-48 text-cyan-400" />
        </div>

        <MarkdownDocumentRenderer content={rawContent} />
      </article>
    </div>
  );
};

/**
 * High-performance, robust Markdown & Story document renderer that handles
 * long-form stories, headings, quotes, bullet lists, and paragraphs with proper whitespace.
 */
const MarkdownDocumentRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) {
    return <p className="text-slate-400 italic">No content to display.</p>;
  }

  // Split by double newline or preserve line paragraphs
  const rawBlocks = content.split(/\n\n+/);

  return (
    <div className="space-y-6 text-slate-100 font-sans leading-relaxed text-base sm:text-lg">
      {rawBlocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Heading 1 (# ...)
        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className="text-2xl sm:text-3xl font-orbitron font-extrabold text-cyan-200 tracking-wide pt-4 pb-2 border-b border-cyan-500/20"
            >
              <InlineFormatting text={trimmed.slice(2).trim()} />
            </h1>
          );
        }

        // Heading 2 (## ...)
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-xl sm:text-2xl font-orbitron font-bold text-cyan-300 tracking-wide pt-4 pb-1 border-b border-cyan-500/15"
            >
              <InlineFormatting text={trimmed.slice(3).trim()} />
            </h2>
          );
        }

        // Heading 3 (### ...)
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-lg sm:text-xl font-orbitron font-semibold text-cyan-400 tracking-wide pt-2"
            >
              <InlineFormatting text={trimmed.slice(4).trim()} />
            </h3>
          );
        }

        // Blockquote (> ...)
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join(' ');
          return (
            <blockquote
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-cyan-950/30 border-l-4 border-cyan-400 italic text-cyan-100 my-4 text-base sm:text-lg leading-relaxed shadow-sm"
            >
              <InlineFormatting text={quoteLines} />
            </blockquote>
          );
        }

        // Bullet list (- ... or * ...)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={idx} className="space-y-2.5 pl-2 my-3">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shrink-0" />
                  <span className="text-slate-200 text-base sm:text-lg leading-relaxed">
                    <InlineFormatting text={item.replace(/^[-*]\s+/, '').trim()} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list (1. ...)
        if (/^\d+[\.\)]\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter(l => /^\d+[\.\)]\s/.test(l.trim()));
          return (
            <ol key={idx} className="space-y-2.5 pl-2 my-3">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 mt-1 shrink-0">
                    {itemIdx + 1}
                  </span>
                  <span className="text-slate-200 text-base sm:text-lg leading-relaxed">
                    <InlineFormatting text={item.replace(/^\d+[\.\)]\s+/, '').trim()} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        // Regular story / explanation paragraph (handles single newlines gracefully)
        const subLines = trimmed.split('\n');
        return (
          <p key={idx} className="text-slate-100 text-base sm:text-lg leading-relaxed font-normal whitespace-pre-line tracking-normal">
            {subLines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                <InlineFormatting text={line} />
                {lIdx < subLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

/**
 * Formats inline bold (**text**), code (`code`), italics (*text*), and highlighted terms.
 */
const InlineFormatting: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-cyan-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-black/60 border border-cyan-500/30 text-cyan-300 font-mono text-sm">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={i} className="italic text-slate-300">
              {part.slice(1, -1)}
            </em>
          );
        }
        return part;
      })}
    </>
  );
};
