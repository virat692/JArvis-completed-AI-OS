// Wake-Word Detection Engine for JARVIS (Listens for "Hey Jarvis", "Jarvis", "Ok Jarvis")
import { playWakeChimeSound } from './soundEffects';

export type WakeWordCallback = (detectedPhrase: string) => void;

class WakeWordService {
  private recognition: any = null;
  private isListening = false;
  private isEnabled = true;
  private callbacks: Set<WakeWordCallback> = new Set();
  private restartTimeout: any = null;
  private isTemporarilyPaused = false;
  private lastTriggerTime = 0;
  private readonly TRIGGER_COOLDOWN_MS = 3500;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.info('SpeechRecognition not supported in this browser for background wake-word.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        if (!this.isEnabled || this.isTemporarilyPaused) return;

        const now = Date.now();
        if (now - this.lastTriggerTime < this.TRIGGER_COOLDOWN_MS) {
          return;
        }

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0]?.transcript?.trim().toLowerCase() || '';
          
          // Check for wake phrases
          if (
            transcript.includes('hey jarvis') ||
            transcript.includes('jarvis') ||
            transcript.includes('ok jarvis') ||
            transcript.includes('hello jarvis') ||
            transcript.includes('listen jarvis') ||
            transcript.includes('sun jarvis')
          ) {
            this.lastTriggerTime = Date.now();
            console.log(`[VOICE][STT] Wake word detected: "${transcript}" (cooldown triggered)`);
            playWakeChimeSound();
            this.notify(transcript);
            break;
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto restart if still enabled
        if (this.isEnabled && !this.isTemporarilyPaused) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            this.start();
          }, 1500);
        }
      };
    } catch (e) {
      console.warn('WakeWord service init failed:', e);
    }
  }

  public subscribe(cb: WakeWordCallback) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  private notify(phrase: string) {
    this.callbacks.forEach(cb => {
      try { cb(phrase); } catch (e) { console.error('WakeWord callback error:', e); }
    });
  }

  public start() {
    if (!this.recognition || this.isListening || !this.isEnabled) return;
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      // already started or busy
    }
  }

  public stop() {
    clearTimeout(this.restartTimeout);
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (e) {}
  }

  public pause() {
    this.isTemporarilyPaused = true;
    this.stop();
  }

  public resume() {
    this.isTemporarilyPaused = false;
    if (this.isEnabled) {
      this.start();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('jarvis_wakeword_enabled', enabled ? 'true' : 'false');
    } catch (_) {}

    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const wakeWordService = new WakeWordService();
