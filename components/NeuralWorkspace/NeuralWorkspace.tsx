import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { neuralWorkspaceManager } from '../../services/neuralWorkspaceManager';
import { PresentationPayload, PresentationMode } from '../../types/workspace';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceRouter } from './WorkspaceRouter';

interface NeuralWorkspaceProps {
  theme?: string;
}

export const NeuralWorkspace: React.FC<NeuralWorkspaceProps> = () => {
  const [isOpen, setIsOpen] = useState(neuralWorkspaceManager.getIsOpen());
  const [payload, setPayload] = useState<PresentationPayload | null>(neuralWorkspaceManager.getActivePayload());
  const [currentMode, setCurrentMode] = useState<PresentationMode>(neuralWorkspaceManager.getCurrentMode());
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    const unsubscribe = neuralWorkspaceManager.subscribe(() => {
      setIsOpen(neuralWorkspaceManager.getIsOpen());
      setPayload(neuralWorkspaceManager.getActivePayload());
      setCurrentMode(neuralWorkspaceManager.getCurrentMode());
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        neuralWorkspaceManager.close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen || !payload) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/95 backdrop-blur-3xl"
      >
        {/* Seamless edge-to-edge presentation surface window without borders */}
        <div
          className={`w-full h-full ${
            isFullscreen ? 'max-w-none max-h-none rounded-none' : 'max-w-7xl max-h-[95vh] rounded-2xl'
          } bg-[#020712] overflow-hidden flex flex-col relative`}
        >
          {/* Presentation Header */}
          <WorkspaceHeader
            payload={payload}
            currentMode={currentMode}
            onSelectMode={(mode) => neuralWorkspaceManager.setMode(mode)}
            onClose={() => neuralWorkspaceManager.close()}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* Main Presentation Surface Content Area */}
          <main className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            {/* Subtle background ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <WorkspaceRouter
              payload={payload}
              currentMode={currentMode}
            />
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
