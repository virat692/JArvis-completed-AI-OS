export async function speakMessage(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof (window as any).SpeechSynthesisUtterance !== 'function') {
      console.log(`[TTS Fallback Speech]: ${text}`);
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const UtteranceClass = (window as any).SpeechSynthesisUtterance;
      const utterance = new UtteranceClass(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesisUtterance execution error:', e);
      resolve();
    }
  });
}
