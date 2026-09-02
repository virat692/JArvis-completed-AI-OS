
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Paperclip, X, Zap, Mic, MicOff } from 'lucide-react';
import { JarvisStatus } from '../types';

interface ChatBoxProps {
  onSendMessage: (msg: string, files?: File[]) => void;
  waveform?: React.ReactNode;
  theme?: 'cyber' | 'slate' | 'minimal' | 'gold';
  status?: JarvisStatus;
  onInterrupt?: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ onSendMessage, waveform, theme = 'cyber', status, onInterrupt }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const statusRef = useRef<JarvisStatus | undefined>(status);

  useEffect(() => {
    statusRef.current = status;
    // Auto-stop speech recognition when JARVIS is vocalizing
    if (status === JarvisStatus.SPEAKING && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  }, [status, isListening]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const isSlate = theme === 'slate';
  const isMinimal = theme === 'minimal';
  const isGold = theme === 'gold';

  // Safe helper to instantiate SpeechRecognition across browsers
  const createSpeechRecognitionInstance = () => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognitionClass = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognitionClass) return null;
    try {
      return new SpeechRecognitionClass();
    } catch (e) {
      console.warn('Failed to construct SpeechRecognition:', e);
      try {
        if ((window as any).webkitSpeechRecognition) {
          const WebkitClass = (window as any).webkitSpeechRecognition;
          return new WebkitClass();
        }
      } catch (err) {
        console.warn('webkitSpeechRecognition fallback constructor failed:', err);
      }
      return null;
    }
  };

  const toggleVoiceInput = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    // Do not start mic capture if Jarvis is currently speaking out loud
    if (statusRef.current === JarvisStatus.SPEAKING) {
      return;
    }

    try {
      const rec = createSpeechRecognitionInstance();
      if (!rec) {
        alert('Speech recognition (Voice Input) is not supported in this browser environment. Please use Google Chrome.');
        return;
      }

      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = (navigator.language && navigator.language.startsWith('hi')) ? 'hi-IN' : 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        // Prevent typing into text box if JARVIS is speaking
        if (statusRef.current === JarvisStatus.SPEAKING) {
          return;
        }

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
    <div className={`z-20 w-full px-3.5 py-2 shadow-2xl transition-all rounded-2xl ${
      isSlate 
        ? 'bg-zinc-900/90 border border-slate-700/80 text-slate-200 backdrop-blur-[18px]'
        : isMinimal
          ? 'bg-[#0f172a]/90 border border-emerald-500/30 text-slate-100 backdrop-blur-[18px]'
          : isGold
            ? 'bg-[#181310]/90 border border-amber-500/30 text-amber-100 backdrop-blur-[18px]'
            : 'border border-cyan-500/35 bg-[rgba(2,12,27,0.7)] backdrop-blur-[20px] shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_25px_rgba(0,242,255,0.18)]'
    }`}>
      {/* File Previews - Compact */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 max-h-16 overflow-y-auto custom-scroll p-1 border-b border-cyan-500/10 pb-2">
          {selectedFiles.map((f, i) => (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-[9px] font-mono transition-all ${
              isSlate 
                ? 'bg-zinc-800 border border-slate-700 text-zinc-200' 
                : isMinimal
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : isGold
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                    : 'bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(0,242,255,0.2)]'
            }`}>
              <span className="truncate max-w-[120px] font-semibold">{f.name}</span>
              <button onClick={() => removeFile(i)} className="hover:text-red-400 transition-colors p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Compact Quick Actions */}
        <div className="flex gap-1 shrink-0">
          <button 
            onClick={() => imageInputRef.current?.click()}
            className={`p-2 rounded-lg transition-all group relative ${
              isSlate 
                ? 'text-slate-400 hover:text-zinc-100 hover:bg-zinc-800/60' 
                : isMinimal
                  ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                  : isGold
                    ? 'text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30'
            }`}
            title="Attach Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-lg transition-all group relative ${
              isSlate 
                ? 'text-slate-400 hover:text-zinc-100 hover:bg-zinc-800/60' 
                : isMinimal
                  ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                  : isGold
                    ? 'text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/30'
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
            className={`w-full border rounded-xl pl-4 pr-20 py-2 text-[13px] font-sans focus:outline-none transition-all shadow-inner h-[38px] ${
              isSlate
                ? isListening ? 'bg-zinc-800 border-zinc-300 text-zinc-100 animate-pulse' : 'bg-zinc-800/90 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-zinc-400'
                : isMinimal
                  ? isListening ? 'bg-emerald-950/60 border-emerald-400 text-emerald-100 animate-pulse' : 'bg-[#030712]/70 border-emerald-500/20 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50'
                  : isGold
                    ? isListening ? 'bg-amber-950/60 border-amber-400 text-amber-100 animate-pulse' : 'bg-[#0f0c09]/80 border-amber-500/20 text-amber-100 placeholder-amber-500/50 focus:border-amber-500/50'
                    : isListening ? 'bg-black/60 border-cyan-400 text-slate-200 shadow-[0_0_18px_rgba(0,242,255,0.35)] animate-pulse' : 'bg-black/45 border-cyan-500/20 text-slate-100 placeholder:text-cyan-300/40 focus:border-cyan-400 focus:bg-black/65 focus:shadow-[0_0_20px_rgba(0,242,255,0.25)]'
            }`}
          />

          <div className="absolute right-1 flex items-center gap-1">
            <button
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-lg transition-all ${
                isListening 
                  ? isSlate ? 'bg-zinc-200 text-zinc-900 animate-bounce' : isMinimal ? 'bg-emerald-500 text-black animate-bounce shadow-[0_0_10px_#10b981]' : isGold ? 'bg-amber-500 text-black animate-bounce shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-400 text-black animate-bounce shadow-[0_0_12px_#00f2ff]' 
                  : isSlate ? 'text-slate-400 hover:text-zinc-100 hover:bg-zinc-800' : isMinimal ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10' : isGold ? 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10' : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/15'
              }`}
              title={isListening ? "Stop Listening" : "Voice Input (Speech-to-Text)"}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() && selectedFiles.length === 0}
              className={`p-2 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shrink-0 ${
                inputValue.trim() || selectedFiles.length > 0
                  ? isSlate 
                    ? 'bg-zinc-200 text-zinc-900 shadow-[0_0_12px_rgba(255,255,255,0.4)] hover:scale-110' 
                    : isMinimal 
                      ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.7)] hover:scale-110' 
                      : isGold 
                        ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.7)] hover:scale-110' 
                        : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-black shadow-[0_0_20px_rgba(0,242,255,0.85)] border border-cyan-200/90 hover:scale-110 hover:-translate-y-0.5'
                  : 'bg-slate-800/40 text-slate-600 border border-slate-700/40 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-3.5 h-3.5 font-black" />
            </button>
          </div>
        </div>

        {/* Integrated Waveform */}
        <div className="w-20 shrink-0 h-6 flex items-center justify-center border-l border-white/10 pl-2 opacity-75">
           {waveform}
        </div>
      </div>

      {/* Ultra-Minimal Status Bar */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <div className="flex items-center gap-2">
           <Zap className="w-2.5 h-2.5 text-cyan-400/60" />
           <span className="text-[8px] font-orbitron text-cyan-300/60 uppercase tracking-widest font-semibold">
             {isListening ? 'VOICE_INPUT_RECORDING_STT' : 'Neural_Sync_Ready'}
           </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
           <span className="text-[7px] font-mono text-cyan-300/60 uppercase tracking-tight">Command_Channel_AES256_Active</span>
        </div>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={imageInputRef} hidden accept="image/*" multiple onChange={(e) => e.target.files && setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
      <input type="file" ref={fileInputRef} hidden multiple onChange={(e) => e.target.files && setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
    </div>
  );
};

export default ChatBox;
