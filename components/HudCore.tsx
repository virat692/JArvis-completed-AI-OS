import React, { useEffect, useRef, useState } from 'react';
import { JarvisStatus, JarvisTheme } from '../types';
import { getThemeConfig } from '../services/themeManager';

interface HudCoreProps {
  status: JarvisStatus;
  micLevel?: number;
  theme?: JarvisTheme;
  isUserMode?: boolean;
  bootPower?: number;
  onInterrupt?: () => void;
}

// Expressive AI Core Eye Component (Living Expressions, Blinking, Audio Modulation)
interface ExpressiveEyeProps {
  status: JarvisStatus;
  micLevel: number;
  themeColor: string;
  isUserMode: boolean;
}

const ExpressiveJarvisEye: React.FC<ExpressiveEyeProps> = ({
  status,
  micLevel,
  themeColor,
  isUserMode,
}) => {
  const eyeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = eyeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currScaleX = 1;
    let currScaleY = 1;
    let currOffsetX = 0;
    let currOffsetY = 0;
    let blinkTimer = Date.now() + Math.random() * 4000 + 3000;
    let isBlinking = false;
    let blinkEnd = 0;

    // Floating particle glints inside lens
    const lensParticles = Array.from({ length: 24 }, () => ({
      x: (Math.random() - 0.5) * 80,
      y: (Math.random() - 0.5) * 80,
      size: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.45,
      speedY: (Math.random() - 0.5) * 0.45,
      alpha: Math.random() * 0.85 + 0.15,
    }));

    // Concentric shockwaves queue
    const shockwaves: { r: number; alpha: number; maxR: number }[] = [];

    const size = isUserMode ? 175 : 100;
    canvas.width = size * 2;
    canvas.height = size * 2;

    const renderEye = () => {
      const now = Date.now();
      const time = now / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseR = isUserMode ? 28 : 16;

      // 1. Blink Logic
      if (now > blinkTimer && !isBlinking) {
        isBlinking = true;
        blinkEnd = now + 140;
      }
      if (isBlinking) {
        if (now > blinkEnd) {
          isBlinking = false;
          blinkTimer = now + Math.random() * 5000 + 4000;
        }
      }

      // 2. Target Scale & Offset Calculation based on JARVIS Expression/Status
      let targetScaleX = 1;
      let targetScaleY = 1;
      let targetOffsetX = 0;
      let targetOffsetY = 0;

      if (isBlinking) {
        targetScaleY = 0.08;
        targetScaleX = 1.4;
      } else if (status === JarvisStatus.LISTENING) {
        const levelBoost = (micLevel / 100) * 0.7;
        targetScaleX = 1.25 + levelBoost + Math.sin(time * 12) * 0.05;
        targetScaleY = 1.25 + levelBoost + Math.cos(time * 12) * 0.05;

        if (Math.random() < 0.25 || micLevel > 30) {
          shockwaves.push({ r: baseR * targetScaleX, alpha: 0.8, maxR: baseR * 3.8 });
        }
      } else if (status === JarvisStatus.THINKING) {
        targetScaleX = 0.85 + Math.sin(time * 14) * 0.25;
        targetScaleY = 1.15 + Math.cos(time * 14) * 0.25;
        targetOffsetX = Math.sin(time * 6) * 4;
        targetOffsetY = Math.cos(time * 6) * 3;
      } else if (status === JarvisStatus.SPEAKING) {
        const speakPulse = Math.abs(Math.sin(time * 10) * 40 + Math.cos(time * 16) * 20);
        const speakBoost = (speakPulse / 100) * 0.65;
        targetScaleX = 1.1 + speakBoost + Math.sin(time * 8) * 0.06;
        targetScaleY = 1.1 + speakBoost + Math.cos(time * 8) * 0.06;

        if (Math.random() < 0.3) {
          shockwaves.push({ r: baseR * targetScaleX, alpha: 0.85, maxR: baseR * 3.2 });
        }
      } else {
        targetScaleX = 1.0 + Math.sin(time * 2.5) * 0.08;
        targetScaleY = 1.0 + Math.sin(time * 2.5) * 0.08;
        targetOffsetX = Math.sin(time * 0.7) * 3.5;
        targetOffsetY = Math.cos(time * 0.5) * 2.5;

        if (Math.random() < 0.02) {
          shockwaves.push({ r: baseR, alpha: 0.5, maxR: baseR * 2.5 });
        }
      }

      currScaleX += (targetScaleX - currScaleX) * 0.18;
      currScaleY += (targetScaleY - currScaleY) * 0.18;
      currOffsetX += (targetOffsetX - currOffsetX) * 0.1;
      currOffsetY += (targetOffsetY - currOffsetY) * 0.1;

      const eyeCenterX = cx + currOffsetX;
      const eyeCenterY = cy + currOffsetY;

      // 3. Render Floating Lens Particle Glints (Dark Cobalt/Blue)
      lensParticles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x > 60 || p.x < -60) p.speedX *= -1;
        if (p.y > 60 || p.y < -60) p.speedY *= -1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 85, 255, ${p.alpha * 0.75})`;
        ctx.shadowColor = '#0055ff';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 4. Render Shockwaves / Expression Ripples (Electric Dark Blue)
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r += 1.8;
        sw.alpha -= 0.02;
        if (sw.alpha <= 0 || sw.r >= sw.maxR) {
          shockwaves.splice(i, 1);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(eyeCenterX, eyeCenterY, sw.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 85, 255, ${sw.alpha})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#0055ff';
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 5. Render Outer 3D Camera Lens Volumetric Dark Blue Gradient
      const glowR = baseR * Math.max(currScaleX, currScaleY) * 2.3;
      const coreGlow = ctx.createRadialGradient(
        eyeCenterX,
        eyeCenterY,
        2,
        eyeCenterX,
        eyeCenterY,
        glowR
      );
      coreGlow.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
      coreGlow.addColorStop(0.25, `${themeColor}ee`);
      coreGlow.addColorStop(0.55, `${themeColor}66`);
      coreGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeCenterY, glowR, 0, Math.PI * 2);
      ctx.fill();

      // 6. Render Expressive 3D Iris Aperture
      ctx.save();
      ctx.translate(eyeCenterX, eyeCenterY);
      ctx.scale(currScaleX, currScaleY);

      // Outer Iris Rim
      ctx.beginPath();
      ctx.arc(0, 0, baseR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 16;
      ctx.fill();

      // Inner Core Pupil (Deep Electric Dark Blue)
      ctx.beginPath();
      ctx.arc(0, 0, baseR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#0055ff';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.restore();

      // 7. Lens Glass Curved Specular Glint (3D Lens Look)
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        eyeCenterX - baseR * 0.38 * currScaleX,
        eyeCenterY - baseR * 0.38 * currScaleY,
        baseR * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.restore();

      // 8. Thinking Laser Scan Line
      if (status === JarvisStatus.THINKING) {
        const scanY = eyeCenterY + Math.sin(time * 10) * (baseR * currScaleY * 0.9);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(eyeCenterX - baseR * currScaleX * 1.4, scanY);
        ctx.lineTo(eyeCenterX + baseR * currScaleX * 1.4, scanY);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(renderEye);
    };

    renderEye();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [status, micLevel, themeColor, isUserMode]);

  return (
    <canvas
      ref={eyeCanvasRef}
      className="pointer-events-none z-20 filter drop-shadow-[0_0_15px_rgba(0,242,255,0.7)]"
      style={{
        width: isUserMode ? '140px' : '100px',
        height: isUserMode ? '140px' : '100px',
      }}
    />
  );
};

export const HudCore: React.FC<HudCoreProps> = ({
  status,
  micLevel = 0,
  theme = 'cyber',
  isUserMode = false,
  bootPower = 1,
  onInterrupt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Dynamic Telemetry Stats (Updated every 3s)
  const [telemetry, setTelemetry] = useState({ cpu: 12, ram: '5.8' });

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry({
        cpu: Math.floor(Math.random() * 12) + 8,
        ram: (5.6 + Math.random() * 0.4).toFixed(1),
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Procedural Canvas Arc Reactor Core with Integrated Audio Spectrum Orbit Bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const size = isUserMode ? 440 : 320;
    canvas.width = size * 2;
    canvas.height = size * 2;

    // Particles array inside plasma core
    const particles = Array.from({ length: 45 }, () => ({
      r: Math.random() * 95 + 10,
      theta: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.03,
      size: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const getColors = () => {
      switch (status) {
        case JarvisStatus.LISTENING:
          return { primary: '#0066ff', secondary: '#001a66', core: '#3b82f6' };
        case JarvisStatus.THINKING:
          return { primary: '#60a5fa', secondary: '#1e3a8a', core: '#93c5fd' };
        case JarvisStatus.SPEAKING:
          return { primary: '#0055ff', secondary: '#00144d', core: '#60a5fa' };
        case JarvisStatus.DIAGNOSTIC:
          return { primary: '#3b82f6', secondary: '#1e40af', core: '#bfdbfe' };
        default:
          return theme === 'gold'
            ? { primary: '#d97706', secondary: '#b45309', core: '#f59e0b' }
            : { primary: '#0055ff', secondary: '#001a66', core: '#2563eb' };
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const { primary, secondary, core } = getColors();
      const time = Date.now() / 1000;

      angle += status === JarvisStatus.THINKING ? 0.03 : 0.012;

      // 1. Center Solid Deep Blue Plasma Core Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, isUserMode ? 130 : 90);
      glowGrad.addColorStop(0, `${core}dd`);
      glowGrad.addColorStop(0.3, `${primary}77`);
      glowGrad.addColorStop(0.65, `${secondary}33`);
      glowGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, isUserMode ? 130 : 90, 0, Math.PI * 2);
      ctx.fill();

      // 2. Quantum Swirling Micro-particles
      ctx.save();
      ctx.translate(cx, cy);
      particles.forEach((p) => {
        p.theta += p.speed;
        const px = Math.cos(p.theta) * p.r * (isUserMode ? 1.15 : 0.85);
        const py = Math.sin(p.theta) * p.r * (isUserMode ? 1.15 : 0.85);

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = primary;
        ctx.globalAlpha = p.alpha * 0.85;
        ctx.shadowColor = primary;
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.restore();

      // 3. Rotating Arc Reactor Coil Segments (12 Dark Titanium & Blue Arc Coils)
      const coilCount = 12;
      const coilDist = isUserMode ? 102 : 72;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      for (let i = 0; i < coilCount; i++) {
        const segAngle = ((Math.PI * 2) / coilCount) * i;
        ctx.save();
        ctx.rotate(segAngle);

        ctx.fillStyle = '#020b22';
        ctx.fillRect(-10, -coilDist, 20, 26);

        ctx.strokeStyle = `${primary}dd`;
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-10, -coilDist, 20, 26);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, -coilDist + 8);
        ctx.lineTo(6, -coilDist + 8);
        ctx.moveTo(-6, -coilDist + 16);
        ctx.lineTo(6, -coilDist + 16);
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();

      // 4. Counter-rotating Laser Target Reticle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 1.5);
      ctx.strokeStyle = `${primary}88`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([8, 16]);
      ctx.beginPath();
      ctx.arc(0, 0, isUserMode ? 128 : 88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 5. Circular Audio Amplitude Orbit Waveform (Drawn directly in canvas loop - 0 React Re-renders!)
      const barCount = 36;
      const orbitR = isUserMode ? 175 : 120;
      const isListeningOrSpeaking = status === JarvisStatus.LISTENING || status === JarvisStatus.SPEAKING;

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < barCount; i++) {
        const barAngle = ((Math.PI * 2) / barCount) * i;
        const base =
          status === JarvisStatus.SPEAKING
            ? 45
            : status === JarvisStatus.LISTENING
            ? 25 + micLevel * 0.6
            : 20;
        const variance =
          Math.sin(time * 8.5 + i * 0.3) * 30 +
          Math.cos(time * 12.5 + i) * 22;
        const waveHeight = Math.min(100, Math.max(8, Math.abs(base + variance)));
        const finalBarLen = waveHeight * (isListeningOrSpeaking ? (isUserMode ? 0.38 : 0.30) : (isUserMode ? 0.32 : 0.24));

        ctx.save();
        ctx.rotate(barAngle);
        ctx.beginPath();
        ctx.moveTo(0, -orbitR);
        ctx.lineTo(0, -(orbitR + finalBarLen));
        ctx.strokeStyle = primary;
        ctx.lineWidth = isListeningOrSpeaking ? 3.2 : 2.4;
        ctx.lineCap = 'round';
        ctx.globalAlpha = status !== JarvisStatus.IDLE ? 0.95 : 0.45;
        ctx.shadowColor = primary;
        ctx.shadowBlur = isListeningOrSpeaking ? 8 : 4;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, theme, micLevel, isUserMode]);

  const getThemeColor = () => {
    const config = getThemeConfig(theme);
    if (status === JarvisStatus.ERROR) return '#ff003c';
    return config.primaryColorHex;
  };

  const themeColor = getThemeColor();

  return (
    <div
      className={`relative flex flex-col items-center justify-center transition-all duration-700 ${
        isUserMode ? 'w-[640px] h-[560px]' : 'w-[440px] h-[420px]'
      } select-none overflow-visible`}
      style={{
        opacity: Math.max(0.1, bootPower),
        filter: `brightness(${0.15 + bootPower * 0.85}) contrast(${0.8 + bootPower * 0.2})`,
        transform: `scale(${0.9 + bootPower * 0.1})`,
      }}
    >
      {/* 1. Deep Dark Blue Volumetric Core Glow */}
      <div
        className="absolute inset-0 rounded-full blur-[90px] pointer-events-none transition-all duration-1000 opacity-80 animate-[pulse_5s_ease-in-out_infinite]"
        style={{
          background: `radial-gradient(circle, rgba(0, 85, 255, 0.45) 0%, rgba(2, 18, 55, 0.75) 45%, transparent 80%)`,
        }}
      />

      {/* 2. Outer Ring 1: Laser Compass Ticks (Very Slow Clockwise) */}
      <div className={`absolute rounded-full border border-blue-500/35 animate-[spin_85s_linear_infinite] pointer-events-none ${
        isUserMode ? 'w-[520px] h-[520px]' : 'w-[360px] h-[360px]'
      }`}>
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="98"
            fill="none"
            stroke={themeColor}
            strokeWidth="0.8"
            strokeDasharray="1 7"
            opacity="0.9"
          />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.35"
            strokeDasharray="14 14"
            opacity="0.6"
          />
          <path
            d="M 100 2 L 100 10 M 100 190 L 100 198 M 2 100 L 10 100 M 190 100 L 198 100"
            stroke={themeColor}
            strokeWidth="2"
          />
        </svg>
      </div>


      {/* 3. Outer Ring 2: Medium Counter-Rotating Tactical Data Ring */}
      <div className={`absolute rounded-full border border-dashed border-blue-400/40 animate-[spin_24s_linear_infinite_reverse] pointer-events-none ${
        isUserMode ? 'w-[470px] h-[470px]' : 'w-[320px] h-[320px]'
      }`} />

      {/* 4. Outer Ring 3: Slow Intermittent Arc Ring */}
      <div className={`absolute rounded-full border-2 border-transparent border-t-blue-400/80 border-b-blue-500/80 animate-[spin_40s_linear_infinite] pointer-events-none ${
        isUserMode ? 'w-[430px] h-[430px]' : 'w-[290px] h-[290px]'
      }`} />

      {/* 5. Central Procedural Quantum Arc Reactor Core (Digital Eye Effect) */}
      <div className={`relative flex items-center justify-center z-10 ${
        isUserMode ? 'w-[440px] h-[440px]' : 'w-[320px] h-[320px]'
      }`}>
        {/* Canvas Internal Swirl, Coil & Integrated Audio Spectrum Orbit Renderer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-[0_0_30px_rgba(0,85,255,0.6)]"
        />

        {/* Precision Dark Titanium & Curved Dark Blue Glass Digital Eye Overlay */}
        <div className={`relative rounded-full border border-blue-500/60 backdrop-blur-2xl bg-[#01091d]/95 flex items-center justify-center overflow-hidden transition-all duration-500 ${
          status === JarvisStatus.LISTENING
            ? 'shadow-[inset_0_0_50px_rgba(0,85,255,0.75),0_0_50px_rgba(0,85,255,0.65)]'
            : 'shadow-[inset_0_0_35px_rgba(0,85,255,0.4),0_10px_40px_rgba(0,0,0,0.95)]'
        } ${
          isUserMode ? 'w-56 h-56' : 'w-38 h-38'
        }`}>
          {/* Glass Lens Curved Specular Highlight Reflection */}
          <div className="absolute top-0 left-2 right-2 h-1/2 rounded-t-full bg-gradient-to-b from-blue-200/30 via-blue-400/10 to-transparent pointer-events-none z-20" />

          {/* Slow Rotating Inner Iris Ring with Telemetry Ticks */}
          <div className={`absolute rounded-full border border-blue-400/50 animate-[spin_30s_linear_infinite] pointer-events-none flex items-center justify-center ${
            isUserMode ? 'w-44 h-44' : 'w-28 h-28'
          }`}>
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={themeColor}
                strokeWidth="0.8"
                strokeDasharray="2 6"
                opacity="0.85"
              />
            </svg>
          </div>

          {/* Counter-Rotating Iris Blade Ring */}
          <div className={`absolute rounded-full border border-dashed border-blue-300/30 animate-[spin_18s_linear_infinite_reverse] pointer-events-none ${
            isUserMode ? 'w-36 h-36' : 'w-24 h-24'
          }`} />

          {/* Inner Arc Reactor Dark Core Frame */}
          <div
            onClick={() => {
              if ((status === JarvisStatus.SPEAKING || status === JarvisStatus.THINKING) && onInterrupt) {
                onInterrupt();
              }
            }}
            className={`rounded-full border border-blue-400/80 bg-black/95 flex items-center justify-center transition-all duration-300 z-10 overflow-hidden relative ${
              isUserMode ? 'w-32 h-32' : 'w-20 h-20'
            } scale-100 shadow-[0_0_25px_rgba(0,85,255,0.5)] ${
              (status === JarvisStatus.SPEAKING || status === JarvisStatus.THINKING) && onInterrupt
                ? 'cursor-pointer hover:scale-105 hover:border-red-400/80 hover:shadow-[0_0_30px_rgba(239,68,68,0.7)]'
                : ''
            }`}
            title={status === JarvisStatus.SPEAKING ? 'Click to Stop / Interrupt JARVIS (Esc)' : undefined}
          >
            <ExpressiveJarvisEye
              status={status}
              micLevel={micLevel}
              themeColor={themeColor}
              isUserMode={isUserMode}
            />
          </div>

          {/* Micro Telemetry Ticks inside Core Lens */}
          <div className="absolute inset-2 rounded-full border border-blue-500/40 pointer-events-none" />
        </div>
      </div>

      {/* Holographic Projection Beam Light Beam & 3D Ground Reflection Ellipse */}
      <div className="absolute top-[75%] w-60 h-20 bg-gradient-to-b from-blue-500/35 via-blue-600/10 to-transparent blur-md pointer-events-none transform -skew-x-6" />
      
      {/* 3D Ground Reflection Ellipse */}
      <div className="absolute bottom-2 w-72 h-8 rounded-[100%] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent blur-lg pointer-events-none shadow-[0_0_30px_#00f2ff] opacity-80 border-t border-cyan-400/40 transform rotate-x-60" />

      {/* 7. Prominent Glowing JARVIS Title & Live Conversation Status */}
      <div className="-mt-1 flex flex-col items-center gap-1 z-30">
        {/* Futuristic Glowing JARVIS Text with Dynamic Dark Blue Core Pulse */}
        <div className={`font-orbitron font-black text-xl sm:text-2xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-400 pl-[0.3em] transition-all duration-300 ${
          status === JarvisStatus.SPEAKING || status === JarvisStatus.LISTENING
            ? 'drop-shadow-[0_0_28px_rgba(0,120,255,0.95)] animate-pulse'
            : 'drop-shadow-[0_0_18px_rgba(0,120,255,0.75)] animate-[pulse_4s_ease-in-out_infinite]'
        }`}>
          JARVIS
        </div>

        {/* Compact & Ultra-Sleek Telemetry Status Pill */}
        <div 
          onClick={() => {
            if ((status === JarvisStatus.SPEAKING || status === JarvisStatus.THINKING) && onInterrupt) {
              onInterrupt();
            }
          }}
          className={`flex items-center justify-center gap-1.5 px-3 py-0.5 min-h-[22px] sm:min-h-[24px] rounded-full bg-[rgba(2,12,27,0.55)] border border-cyan-400/35 backdrop-blur-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(0,242,255,0.2)] hover:border-cyan-300/60 transition-all duration-300 ${
            (status === JarvisStatus.SPEAKING || status === JarvisStatus.THINKING) && onInterrupt
              ? 'cursor-pointer hover:bg-red-950/60 hover:border-red-400/70 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : ''
          }`}
          title={status === JarvisStatus.SPEAKING ? 'Click to Stop / Interrupt JARVIS (Esc)' : undefined}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              status === JarvisStatus.SPEAKING
                ? 'bg-cyan-400 animate-ping shadow-[0_0_8px_#38bdf8]'
                : status === JarvisStatus.LISTENING
                ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]'
                : status === JarvisStatus.THINKING
                ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            }`}
          />
          <span className="font-orbitron font-bold text-[9px] sm:text-[10px] tracking-[0.18em] text-cyan-200/95 uppercase">
            {status === JarvisStatus.IDLE
              ? 'J.A.R.V.I.S. SYSTEM • ONLINE'
              : status === JarvisStatus.LISTENING
              ? 'LISTENING • VOICE SENSE ACTIVE'
              : status === JarvisStatus.THINKING
              ? 'ANALYZING • QUANTUM REASONING'
              : status === JarvisStatus.SPEAKING
              ? 'VOCALIZING • CHARON VOICE'
              : status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HudCore;
