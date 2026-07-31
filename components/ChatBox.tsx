
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Paperclip, X, Zap, Mic, MicOff } from 'lucide-react';

interface ChatBoxProps {
  onSendMessage: (msg: string, files?: File[]) => void;
  waveform?: React.ReactNode;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
}

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, waveform, theme = 'cyber' }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'hi-IN'; // Supports Hindi & Hinglish/English mix

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputValue(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition (Voice Input) is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = (navigator.language && navigator.language.startsWith('hi')) ? 'hi-IN' : 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputValue(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setInputValue('');
      rec.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(inputValue, selectedFiles);
      setInputValue('');
      setSelectedFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`z-20 w-full px-4 py-2.5 shadow-2xl transition-all ${
      isSlate 
        ? 'bg-zinc-900/95 border-x border-b border-slate-800 text-slate-200 rounded-b-2xl'
        : isMinimal
          ? 'bg-[#0f172a]/95 border-x border-b border-emerald-500/20 text-slate-100 rounded-b-3xl backdrop-blur-xl'
          : isGold
            ? 'bg-[#181310]/95 border-x border-b border-amber-500/20 text-amber-100 rounded-b-3xl backdrop-blur-xl'
            : 'glass rounded-b-none border border-cyan-500/20 bg-slate-950/60 backdrop-blur-3xl border-t-0'
    }`}>
      {/* File Previews - Compact */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 max-h-16 overflow-y-auto custom-scroll p-1 border-b border-white/5 pb-2">
          {selectedFiles.map((f, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-0.5 rounded text-[8px] font-mono animate-in zoom-in-95 ${
              isSlate 
                ? 'bg-zinc-800 border border-slate-700 text-zinc-200' 
                : isMinimal
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : isGold
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                    : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
            }`}>
              <span className="truncate max-w-[100px]">{f.name}</span>
              <button onClick={() => removeFile(i)} className="hover:text-red-400 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Compact Quick Actions */}
        <div className="flex gap-1 shrink-0">
          <button 
            onClick={() => imageInputRef.current?.click()}
            className={`p-1.5 transition-all group relative ${
              isSlate 
                ? 'text-slate-400 hover:text-zinc-100' 
                : isMinimal
                  ? 'text-slate-400 hover:text-emerald-400'
                  : isGold
                    ? 'text-amber-400/60 hover:text-amber-300'
                    : 'text-slate-500 hover:text-cyan-400'
            }`}
            title="Attach Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-1.5 transition-all group relative ${
              isSlate 
                ? 'text-slate-400 hover:text-zinc-100' 
                : isMinimal
                  ? 'text-slate-400 hover:text-emerald-400'
                  : isGold
                    ? 'text-amber-400/60 hover:text-amber-300'
                    : 'text-slate-500 hover:text-cyan-400'
            }`}
            title="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Input Area - Ultra Sleek */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Listening... Speak your directive now..." : "Direct directive, Sir..."}
            className={`w-full border rounded-xl pl-4 pr-20 py-2 text-[14px] font-sans focus:outline-none transition-all shadow-inner h-[38px] ${
              isSlate
                ? isListening ? 'bg-zinc-800 border-zinc-300 text-zinc-100 animate-pulse' : 'bg-zinc-800/90 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-zinc-400'
                : isMinimal
                  ? isListening ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100 animate-pulse' : 'bg-[#030712]/70 border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50'
                  : isGold
                    ? isListening ? 'bg-amber-950/60 border-amber-400 text-amber-100 animate-pulse' : 'bg-[#0f0c09]/80 border-amber-500/20 text-amber-100 placeholder-amber-500/50 focus:border-amber-500/50'
                    : isListening ? 'bg-black/40 border-cyan-400 text-slate-200 shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse' : 'bg-black/40 border-cyan-500/10 text-slate-200 placeholder-slate-500 focus:border-cyan-500/40'
            }`}
          />

          <div className="absolute right-1 flex items-center gap-1">
            <button
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-all ${
                isListening 
                  ? isSlate ? 'bg-zinc-200 text-zinc-900 animate-bounce' : isMinimal ? 'bg-emerald-500 text-black animate-bounce shadow-[0_0_10px_#10b981]' : isGold ? 'bg-amber-500 text-black animate-bounce shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-500 text-black animate-bounce shadow-[0_0_10px_#00f2ff]' 
                  : isSlate ? 'text-slate-400 hover:text-zinc-100 hover:bg-zinc-800' : isMinimal ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10' : isGold ? 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
              }`}
              title={isListening ? "Stop Listening" : "Voice Input (Speech-to-Text)"}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() && selectedFiles.length === 0}
              className={`p-1.5 rounded-lg disabled:opacity-10 transition-all active:scale-95 group ${
                isSlate ? 'text-zinc-300 hover:text-white' : isMinimal ? 'text-emerald-400 hover:text-emerald-300' : isGold ? 'text-amber-400 hover:text-amber-300' : 'text-cyan-500/50 hover:text-cyan-400'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Integrated Waveform */}
        <div className="w-20 shrink-0 h-6 flex items-center justify-center border-l border-white/5 pl-2 opacity-60">
           {waveform}
        </div>
      </div>

      {/* Ultra-Minimal Status Bar */}
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex items-center gap-2">
           <Zap className="w-2.5 h-2.5 text-cyan-500/30" />
           <span className="text-[7px] font-orbitron text-slate-600 uppercase tracking-widest">
             {isListening ? 'VOICE_INPUT_RECORDING_STT' : 'Neural_Sync_Ready'}
           </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-20 hover:opacity-100 transition-opacity">
           <span className="text-[6px] font-mono text-slate-500 uppercase tracking-tighter">Command_Channel_AES256_Active</span>
        </div>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={imageInputRef} hidden accept="image/*" multiple onChange={(e) => e.target.files && setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
      <input type="file" ref={fileInputRef} hidden multiple onChange={(e) => e.target.files && setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
    </div>
  );
};

export default ChatBox;
