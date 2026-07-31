import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { JarvisStatus } from '../types';

interface JarvisExpressionProps {
  status: JarvisStatus;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  size: number;
  color: string;
  speed: number;
  orbitRadius: number;
  angle: number;
  orbitAngleX: number;
  orbitAngleY: number;
  alpha: number;
}

const JarvisExpression: React.FC<JarvisExpressionProps> = ({ status }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 320);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle Generation for Spherical Galaxy
    const particleCount = 450;
    const particles: Particle[] = [];
    const colors = {
      cyan: ['#00f2ff', '#00b8ff', '#0088ff', '#80f7ff'],
      purple: ['#a855f7', '#d8b4fe', '#c084fc', '#e879f9'],
      error: ['#ff4444', '#ff7777', '#ff1111', '#ffaa00'],
    };

    const getColorsByStatus = () => {
      if (status === JarvisStatus.ERROR) return colors.error;
      if (status === JarvisStatus.THINKING) return colors.purple;
      return colors.cyan;
    };

    const palette = getColorsByStatus();

    for (let i = 0; i < particleCount; i++) {
      // Uniform random distribution on a sphere surface or inside galaxy disc
      const isDisc = i < particleCount * 0.65;
      const radius = isDisc 
        ? Math.pow(Math.random(), 0.7) * (Math.min(width, height) * 0.38)
        : Math.pow(Math.random(), 0.5) * (Math.min(width, height) * 0.35);

      const theta = Math.random() * Math.PI * 2;
      const phi = isDisc ? (Math.random() - 0.5) * 0.35 : Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        size: Math.random() * 2.2 + 0.6,
        color: palette[Math.floor(Math.random() * palette.length)],
        speed: (Math.random() * 0.015 + 0.005) * (isDisc ? 1.5 : 0.8),
        orbitRadius: Math.sqrt(x * x + y * y + z * z),
        angle: theta,
        orbitAngleX: (Math.random() - 0.5) * 0.01,
        orbitAngleY: (Math.random() - 0.5) * 0.01,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let rotationX = 0;
    let rotationY = 0;
    let pulseAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const focalLength = 300;

      // Status-dependent dynamics
      let speedMult = 1.0;
      let pulseSpeed = 0.03;
      let coreGlowSize = 45;

      if (status === JarvisStatus.SPEAKING) {
        speedMult = 2.4;
        pulseSpeed = 0.08;
        coreGlowSize = 65 + Math.sin(pulseAngle * 3) * 15;
      } else if (status === JarvisStatus.LISTENING) {
        speedMult = 1.8;
        pulseSpeed = 0.05;
        coreGlowSize = 55;
      } else if (status === JarvisStatus.THINKING) {
        speedMult = 2.0;
        pulseSpeed = 0.06;
      } else if (status === JarvisStatus.ERROR) {
        speedMult = 3.0;
        pulseSpeed = 0.12;
      }

      pulseAngle += pulseSpeed;
      rotationY += 0.008 * speedMult;
      rotationX += 0.003 * speedMult;

      // Draw Glowing Core Nebula
      const activePalette = getColorsByStatus();
      const primaryColor = activePalette[0];
      const secondaryColor = activePalette[1] || activePalette[0];

      const coreGradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreGlowSize * 1.8);
      coreGradient.addColorStop(0, `${primaryColor}ff`);
      coreGradient.addColorStop(0.25, `${primaryColor}88`);
      coreGradient.addColorStop(0.6, `${secondaryColor}22`);
      coreGradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, coreGlowSize * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render 3D Galaxy Rings / Orbital Lines
      ctx.save();
      ctx.translate(cx, cy);
      
      // Draw outer glowing orbital ring
      const ringRadius = Math.min(width, height) * 0.32;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadius, ringRadius * 0.35, rotationY * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = `${primaryColor}33`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();

      // Inner counter-rotating ring
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadius * 0.65, ringRadius * 0.22, -rotationY * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = `${secondaryColor}44`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.restore();

      // Sort particles by Z-index for true 3D depth rendering
      const projectedParticles = particles.map((p) => {
        // Orbit update
        p.angle += p.speed * speedMult;
        
        let cosY = Math.cos(rotationY);
        let sinY = Math.sin(rotationY);
        let cosX = Math.cos(rotationX);
        let sinX = Math.sin(rotationX);

        // Rotate initial particle position
        let x1 = p.baseX * cosY - p.baseZ * sinY;
        let z1 = p.baseZ * cosY + p.baseX * sinY;

        let y2 = p.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.baseY * sinX;

        // Apply audio pulse displacement
        const pulse = 1 + Math.sin(pulseAngle + p.orbitRadius * 0.05) * (status === JarvisStatus.SPEAKING ? 0.12 : 0.04);
        x1 *= pulse;
        y2 *= pulse;

        const scale = focalLength / (focalLength + z2 + 250);
        const projX = cx + x1 * scale;
        const projY = cy + y2 * scale;

        return {
          projX,
          projY,
          scale,
          z2,
          size: p.size * scale * (1 + (z2 / 300)),
          color: p.color,
          alpha: Math.min(1, Math.max(0.1, (z2 + 200) / 400)) * p.alpha,
        };
      });

      projectedParticles.sort((a, b) => b.z2 - a.z2);

      // Draw projected galaxy particles
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (const p of projectedParticles) {
        if (p.projX < 0 || p.projX > width || p.projY < 0 || p.projY > height) continue;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, Math.max(0.4, p.size), 0, Math.PI * 2);
        ctx.fill();

        // Extra outer glow for larger foreground stars
        if (p.size > 2.0 && p.z2 > -50) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.35;
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  return (
    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-transparent group">
      {/* Canvas container for spherical glowing galaxy */}
      <canvas ref={canvasRef} className="w-full h-full absolute inset-0 z-0 cursor-pointer" />

      {/* Cybernetic HUD Overlay Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Outer Tech Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="w-64 h-64 rounded-full border border-cyan-500/15 border-dashed"
        />

        {/* Counter Rotating Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute w-72 h-72 rounded-full border border-cyan-400/10"
        />

        {/* Status Indicator Orbit Nodes */}
        <motion.div
          animate={{ scale: status === JarvisStatus.SPEAKING ? [1, 1.08, 1] : [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-44 h-44 rounded-full border border-cyan-500/20 shadow-[0_0_20px_rgba(0,242,255,0.15)] pointer-events-none"
        />
      </div>

      {/* Bottom JARVIS Title Label */}
      <div className="absolute bottom-3 left-0 w-full flex flex-col items-center gap-1 z-10 pointer-events-none">
        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <span className="text-[10px] font-orbitron tracking-[0.45em] text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">
          JARVIS
        </span>
      </div>
    </div>
  );
};

export default JarvisExpression;

