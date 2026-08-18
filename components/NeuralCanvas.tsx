import React, { useEffect, useRef } from 'react';
import { JarvisStatus, JarvisTheme } from '../types';
import { getThemeConfig } from '../services/themeManager';

interface NeuralCanvasProps {
  status: JarvisStatus;
  theme?: JarvisTheme;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({ status, theme = 'cyber' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const themeConfig = getThemeConfig(theme);

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes for neural mesh
    const particleCount = 75;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    // Ambient Radial Shockwave pulse
    let shockwaveRadius = 0;
    let shockwaveAlpha = 0;
    let lastPulseTime = Date.now();

    // Micro dust particles
    const dustCount = 30;
    const dustParticles = Array.from({ length: dustCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.2, // Drifts upward
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const getPrimaryColor = () => {
      if (status === JarvisStatus.ERROR) return { r: 255, g: 68, b: 68 };
      
      switch (themeConfig.id) {
        case 'crimson':
          if (status === JarvisStatus.LISTENING) return { r: 255, g: 80, b: 100 };
          if (status === JarvisStatus.THINKING) return { r: 255, g: 140, b: 0 };
          return themeConfig.canvas.primary;
        case 'violet':
          if (status === JarvisStatus.LISTENING) return { r: 232, g: 121, b: 249 };
          if (status === JarvisStatus.THINKING) return { r: 192, g: 132, b: 252 };
          return themeConfig.canvas.primary;
        case 'emerald':
          if (status === JarvisStatus.LISTENING) return { r: 52, g: 211, b: 153 };
          if (status === JarvisStatus.THINKING) return { r: 16, g: 185, b: 129 };
          return themeConfig.canvas.primary;
        case 'cyber':
        default:
          if (status === JarvisStatus.LISTENING) return { r: 0, g: 242, b: 255 };
          if (status === JarvisStatus.THINKING) return { r: 192, g: 132, b: 252 };
          if (status === JarvisStatus.SPEAKING) return { r: 59, g: 130, b: 246 };
          return themeConfig.canvas.primary;
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const color = getPrimaryColor();
      const rgbStr = `${color.r}, ${color.g}, ${color.b}`;
      const bgRgb = themeConfig.canvas.background;

      // Deep Dark Atmosphere with Soft Ambient Glow behind AI Core
      const centerX = width / 2;
      const centerY = height / 2 - 40;

      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        30,
        centerX,
        centerY,
        Math.max(width, height) * 0.65
      );
      bgGrad.addColorStop(0, `rgba(${rgbStr}, 0.16)`);
      bgGrad.addColorStop(0.35, `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.92)`);
      bgGrad.addColorStop(1, themeConfig.bgHex);

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Shockwave Pulse from AI Core (Triggered every ~8-10 seconds or when idle)
      if ((Math.random() < 0.0035 || lastPulseTime + 8000 < Date.now()) && shockwaveRadius === 0) {
        shockwaveRadius = 30;
        shockwaveAlpha = 0.75;
        lastPulseTime = Date.now();
      }
      if (shockwaveRadius > 0) {
        shockwaveRadius += 3.8;
        shockwaveAlpha -= 0.0045;
        if (shockwaveAlpha <= 0 || shockwaveRadius > Math.max(width, height) * 0.85) {
          shockwaveRadius = 0;
          shockwaveAlpha = 0;
        } else {
          ctx.save();
          // Primary Wave Ring (Layered crisp core + outer soft glow stroke)
          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgbStr}, ${Math.max(0, shockwaveAlpha * 0.35)})`;
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${rgbStr}, ${Math.max(0, shockwaveAlpha)})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Secondary Inner Echo Ring
          if (shockwaveRadius > 60) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius - 35, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${rgbStr}, ${Math.max(0, shockwaveAlpha * 0.4)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Micro Ambient Light Dust Particles
      for (let i = 0; i < dustParticles.length; i++) {
        const d = dustParticles[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.y < 0) {
          d.y = height + 10;
          d.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbStr}, ${d.alpha * 0.5})`;
        ctx.fill();
      }

      // 3. Layer 3: Render Floating Neural Network Nodes with Batched Proximity Web
      // Update particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        p1.pulse += 0.02;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;
      }

      // Draw all neural web links in a single batched stroke call (0 CPU software blur, 10x faster)
      ctx.save();
      ctx.beginPath();
      const maxDist = 110;
      const maxDistSq = maxDist * maxDist;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.strokeStyle = `rgba(${rgbStr}, 0.12)`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
      ctx.restore();

      // Draw all particle nodes in a batched single-pass with hardware accelerated subtle halo
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        const currentAlpha = Math.max(0.15, p1.alpha + Math.sin(p1.pulse) * 0.25);

        // Core particle point
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbStr}, ${currentAlpha})`;
        ctx.fill();

        // Subtle lightweight ambient halo (Replaces software-based shadowBlur)
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbStr}, ${currentAlpha * 0.25})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000"
    />
  );
};
