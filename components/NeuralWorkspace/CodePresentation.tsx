import React, { useState } from 'react';
import { CodeData, CodeFile } from '../../types/workspace';
import { Code2, Copy, Check, Download, FileCode, WrapText } from 'lucide-react';
import { playTickSound } from '../../services/soundEffects';

interface CodePresentationProps {
  codeData: CodeData;
}

export const CodePresentation: React.FC<CodePresentationProps> = ({ codeData }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const activeFile: CodeFile | undefined = codeData.files[selectedFileIdx] || codeData.files[0];

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playTickSound();
  };

  if (!activeFile) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 text-center text-slate-400 font-mono text-sm">
        No code blocks detected in the current presentation payload.
      </div>
    );
  }

  const lines = activeFile.code.split('\n');

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn">
      {/* File Selector Tabs (if multiple files) */}
      {codeData.files.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-cyan-500/15">
          {codeData.files.map((file, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFileIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedFileIdx === idx
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>{file.filename}</span>
              <span className="text-[10px] text-slate-500">({file.language})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Code Viewer Frame */}
      <div className="rounded-3xl bg-[#040914] border border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        {/* Top Code Banner */}
        <div className="px-5 py-3.5 bg-[#071326] border-b border-cyan-500/20 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            </div>
            <div className="h-4 w-px bg-cyan-500/20" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">
                {activeFile.filename}
              </span>
              <span className="text-[10px] font-mono uppercase text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                {activeFile.language}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {lines.length} lines
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWrapLines(!wrapLines)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-mono flex items-center gap-1.5 border transition-all ${
                wrapLines
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-black/40 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle line wrapping"
            >
              <WrapText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wrap</span>
            </button>

            <button
              onClick={handleCopyCode}
              className="p-1.5 sm:px-3 sm:py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Copy entire code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-300" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400/50 text-slate-300 hover:text-cyan-200 text-xs font-mono flex items-center gap-1.5 transition-all"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Code Content Line Display */}
        <div className="p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed max-h-[70vh]">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-cyan-500/5 group">
                  <td className="w-12 pr-4 text-right select-none text-slate-600 group-hover:text-cyan-400/60 font-mono text-xs align-top">
                    {idx + 1}
                  </td>
                  <td className={`text-slate-100 ${wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'} pl-2 font-mono`}>
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Surrounding Explanation / Documentation from JARVIS if present */}
      {codeData.rawText && codeData.rawText.replace(/```[\s\S]*?```/g, '').trim().length > 30 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/20 backdrop-blur-xl">
          <h3 className="text-xs font-orbitron font-extrabold text-cyan-300 tracking-widest uppercase mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            IMPLEMENTATION NOTES & EXPLANATION
          </h3>
          <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line font-normal">
            {codeData.rawText.replace(/```[\s\S]*?```/g, '').trim()}
          </div>
        </div>
      )}
    </div>
  );
};

