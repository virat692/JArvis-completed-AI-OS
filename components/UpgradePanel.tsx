import React from 'react';
import { BrainCircuit, Clock, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { UpgradeRequest } from '../types';

interface UpgradePanelProps {
  requests: UpgradeRequest[];
  onClear: () => void;
  onRemove: (id: string) => void;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const UpgradePanel: React.FC<UpgradePanelProps> = ({ requests, onClear, onRemove, theme = 'cyber' }) => {
  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  return (
    <div className={`flex flex-col h-full rounded-r-2xl overflow-hidden backdrop-blur-md transition-all ${
      isSlate
        ? 'bg-zinc-900/95 border-r border-slate-700/80 text-slate-200'
        : isMinimal
          ? 'bg-[#0f172a]/95 border-r border-emerald-500/20 text-slate-100'
          : isGold
            ? 'bg-[#181310]/95 border-r border-amber-500/20 text-amber-100'
            : 'bg-black/40 border-l border-cyan-500/30 text-cyan-400'
    }`}>
      <div className={`p-4 border-b flex justify-between items-center ${
        isSlate ? 'border-slate-800 bg-zinc-800/80' : isMinimal ? 'border-emerald-500/20 bg-emerald-950/20' : isGold ? 'border-amber-500/20 bg-amber-950/20' : 'border-cyan-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold tracking-wider uppercase">Upgrade Memory</h2>
        </div>
        <button 
          onClick={onClear}
          className="p-1 hover:bg-cyan-500/20 rounded-full transition-colors"
          title="Clear All"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {requests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
            <CheckCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">System fully optimized.<br/>No capability gaps detected.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div 
              key={req.id} 
              className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg relative group hover:border-cyan-500/40 transition-all"
            >
              <button 
                onClick={() => onRemove(req.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1 rounded ${
                  req.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  req.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono opacity-60">
                      {new Date(req.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      req.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      req.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {req.priority}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 truncate text-white">{req.task}</h3>
                  <p className="text-xs opacity-80 leading-relaxed mb-2">
                    <span className="text-amber-400">Reason:</span> {req.reason}
                  </p>
                  {req.suggested_module && (
                    <div className="text-[10px] bg-cyan-500/10 p-1.5 rounded border border-cyan-500/10 flex items-center gap-1.5">
                      <span className="text-cyan-300 font-bold">SUGGESTED:</span>
                      <span className="truncate">{req.suggested_module}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-cyan-500/30 bg-cyan-500/5">
        <div className="flex items-center gap-2 text-xs opacity-60">
          <Clock className="w-3 h-3" />
          <span>Last analysis: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default UpgradePanel;
