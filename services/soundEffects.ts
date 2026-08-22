// Web Audio API Sound Synthesizer for JARVIS Sci-Fi OS Sound Design

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let soundVolume = 0.8; // 0.0 to 1.0

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

export function playMechanicalClick() {
  playTickSound();
}

export const playClick = playTickSound;

export function setSoundVolume(volume: number) {
  soundVolume = Math.max(0, Math.min(1, volume));
}

export function getSoundVolume(): number {
  return soundVolume;
}

function getAudioContext(): AudioContext | null {
  if (!soundEnabled || soundVolume <= 0) return null;
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && typeof AudioContextClass === 'function') {
        audioCtx = new AudioContextClass();
      }
    } catch (err) {
      console.warn('AudioContext disabled or unavailable:', err);
      audioCtx = null;
    }
  }
  
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Security Alarm Sound for Tactical Mode
 */
export function playSecurityAlarmSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.2);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    // ignore
  }
}

export function playTickSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    filter.type = 'highpass';
    filter.frequency.value = 800;

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * 2. WHOOSH (Close Sound): Filtered pitch drop / whoosh
 */
export function playWhooshSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // White noise buffer
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * 3. DIGITAL PING (Memory Sound): High glass chime / dual digital ping
 */
export function playDigitalPingSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Dual frequencies for harmonic crystal ping
    [1760, 2640].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.15, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.25);
    });
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * 4. HUM (Listening Sound): Sub-bass reactor hum blip
 */
export function playListeningHumSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * 5. SPEAKING (Soft Reactor Pulse): Soft harmonic pulse
 */
export function playSpeakingPulseSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * BOOT STEP: Short sci-fi data tick for boot sequence items
 */
export function playBootStepSound(stepIndex: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 600 + stepIndex * 180;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * BOOT COMPLETE: Powerful Arc Reactor ONLINE power-up chime
 */
export function playBootCompleteSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Arpeggio chord swell (C-E-G-C-E)
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.6);
    });

    // Low reactor boom bass
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();

    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now + 0.2);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    subGain.gain.setValueAtTime(0.25, now + 0.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    sub.connect(subGain);
    subGain.connect(ctx.destination);

    sub.start(now + 0.2);
    sub.stop(now + 0.8);
  } catch (e) {
    // ignore audio errors
  }
}

/**
 * 6. WAKE CHIME: Dual futuristic digital chime for "Hey Jarvis" detection
 */
export function playWakeChimeSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonic rise 880Hz -> 1320Hz -> 1760Hz
    const freqs = [880, 1320, 1760];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  } catch (e) {
    // ignore
  }
}

/**
 * 7. PUSH-TO-TALK TACTICAL BEEP
 */
export function playPushToTalkBeep(isStart: boolean = true) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (isStart) {
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
    } else {
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.05);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    // ignore
  }
}

/**
 * 8. DIRECTIVE COMPLETE CHIME: Accomplishment harmonic chord
 */
export function playDirectiveCompleteChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [587.33, 739.99, 880.00, 1174.66]; // D-F#-A-D
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.4);
    });
  } catch (e) {
    // ignore
  }
}

/**
 * 9. ARC REACTOR SURGE: High energy sci-fi capacitor charging sound
 */
export function playArcReactorSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.4);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    // ignore
  }
}

/**
 * Preview Voice Persona sample
 */
export function previewVoiceSample(voiceName: string) {
  playWakeChimeSound();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `Hello Operator Virat. J.A.R.V.I.S. neural voice persona calibrated to ${voiceName}. All systems online.`
    );
    
    // Adjust pitch and rate to mirror the selected Gemini voice personality
    switch (voiceName.toLowerCase()) {
      case 'charon':
        utterance.pitch = 0.85;
        utterance.rate = 1.05;
        break;
      case 'fenrir':
        utterance.pitch = 0.7;
        utterance.rate = 0.95;
        break;
      case 'puck':
        utterance.pitch = 1.15;
        utterance.rate = 1.15;
        break;
      case 'aoede':
        utterance.pitch = 1.25;
        utterance.rate = 1.0;
        break;
      case 'kore':
        utterance.pitch = 1.0;
        utterance.rate = 1.05;
        break;
      default:
        utterance.pitch = 0.9;
        utterance.rate = 1.0;
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Voice preview speech error:', e);
  }
}

