import React, { useState } from 'react';
import { DataPresentationData } from '../../types/workspace';
import { Table as TableIcon, Sparkles, Check, Search, Copy, Download, Braces } from 'lucide-react';
import { playTickSound } from '../../services/soundEffects';

interface DataPresentationProps {
  data: DataPresentationData;
}

export const DataPresentation: React.FC<DataPresentationProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'raw'>(data.type === 'json' ? 'raw' : 'visual');
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = () => {
    const raw = data.rawFormatted || (data.jsonData ? JSON.stringify(data.jsonData, null, 2) : JSON.stringify(data.rows, null, 2));
    navigator.clipboard.writeText(raw);
    setCopied(true);
    playTickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (!data.columns || !data.rows || data.rows.length === 0) return;
    const header = data.columns.map(c => `"${c.label}"`).join(',');
    const rowsCsv = data.rows.map(row => 
      data.columns!.map(col => `"${String(row[col.key] || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = `${header}\n${rowsCsv}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jarvis_data_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    playTickSound();
  };

  // Filter table rows
  const filteredRows = data.rows?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 animate-fadeIn select-text">
      {/* Header */}
      <div className="border-b border-cyan-500/20 pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TableIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              STRUCTURED DATA & MATRIX PRESENTATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white tracking-wide">
            {data.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {data.jsonData && (
            <div className="flex rounded-xl bg-black/40 border border-slate-700 p-1">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  viewMode === 'visual' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400' : 'text-slate-400'
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  viewMode === 'raw' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400' : 'text-slate-400'
                }`}
              >
                JSON Raw
              </button>
            </div>
          )}

          {data.rows && data.rows.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={handleCopyRaw}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Data' : 'Copy Data'}</span>
          </button>
        </div>
      </div>

      {/* Case 1: Comparative Evaluation Cards */}
      {data.comparisonCards && data.comparisonCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.comparisonCards.map((card, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-[#061224]/85 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col justify-between group hover:border-cyan-400 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                    {card.badge}
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>

                <h3 className="text-lg font-orbitron font-extrabold text-white mb-4">
                  {card.subject}
                </h3>

                {card.specs && (
                  <div className="grid grid-cols-1 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 mb-5 font-mono text-xs">
                    {Object.entries(card.specs).map(([k, v], sIdx) => (
                      <div key={sIdx} className="flex justify-between">
                        <span className="text-[10px] text-slate-500 uppercase">{k}:</span>
                        <span className="text-slate-200 font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    KEY CHARACTERISTICS
                  </span>
                  {card.pros.map((pro, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
              </div>

              {card.verdict && (
                <div className="pt-4 border-t border-cyan-500/15">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block mb-1">SYNTHESIS NOTE</span>
                  <p className="text-xs text-cyan-200 font-medium italic">
                    "{card.verdict}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Case 2: Real Markdown Structured Table */}
      {data.columns && data.rows && data.rows.length > 0 && viewMode === 'visual' && (
        <div className="rounded-3xl bg-[#061224]/85 border border-cyan-500/30 overflow-hidden shadow-xl">
          {/* Table Search Bar */}
          <div className="p-4 bg-[#071326] border-b border-cyan-500/20 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter table rows..."
                className="w-full bg-black/50 border border-cyan-500/20 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {filteredRows.length} of {data.rows.length} rows
            </span>
          </div>

          {/* HTML Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-mono border-collapse">
              <thead>
                <tr className="bg-[#030d1e] text-cyan-300 border-b border-cyan-500/20">
                  {data.columns.map((col) => (
                    <th key={col.key} className="py-3 px-4 font-bold tracking-wider uppercase">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10">
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/5 transition-colors">
                    {data.columns!.map((col) => (
                      <td key={col.key} className="py-3 px-4 text-slate-200">
                        {String(row[col.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case 3: Raw JSON / Raw Text View */}
      {(viewMode === 'raw' || (!data.columns && !data.comparisonCards)) && (
        <div className="rounded-3xl bg-[#040914] border border-cyan-500/30 overflow-hidden shadow-xl p-6 font-mono text-xs sm:text-sm text-cyan-200 leading-relaxed overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            {data.rawFormatted || (data.jsonData ? JSON.stringify(data.jsonData, null, 2) : 'No structured data available.')}
          </pre>
        </div>
      )}
    </div>
  );
};
