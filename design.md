# JARVIS AI OS — Design System & UI/UX Guidelines
**Document:** `design.md`  
**Version:** 5.0.0-PRO  
**Classification:** Holographic Cybernetic Design Specification  
**Source of Truth:** `PRD.md`  
**Current Date:** August 21, 2026  

---

## 1. Visual Identity & Atmosphere

- **Theme Palette:**
  - **Cyber Blue (Default Holographic):** Base background `#020712`, primary glow `#00f2ff`, secondary `#0284c7`, accent amber `#f59e0b`.
  - **Slate Carbon:** Dark obsidian `#090d16`, neutral border `#1e293b`, text `#f8fafc`.
  - **Emerald Minimal:** Accent green `#10b981`, status glow `#059669`.
  - **Solar Gold:** High-authority highlight `#eab308`.

- **Atmospheric Aura Lighting (Meteorological Engine):**
  - *Sunny / Clear:* Radiant solar amber-gold aura (`rgba(245, 158, 11, 0.15)`).
  - *Rain / Drizzle:* Deep indigo-cyan precipitation aura (`rgba(6, 182, 212, 0.18)`).
  - *Thunderstorm:* Electric violet-amber surge (`rgba(139, 92, 246, 0.22)`).
  - *Snow / Ice:* Crystalline cyan-white shimmer (`rgba(186, 230, 253, 0.20)`).
  - *Cloudy / Overcast:* Soft silver slate aura (`rgba(148, 163, 184, 0.14)`).

---

## 2. Typography & Hierarchy

- **Display & Headings:** `Orbitron`, sans-serif (High-tech geometric monospace display with uppercase tracking).
- **Body & Data Text:** `Plus Jakarta Sans` / `Inter`, sans-serif (Clear, legible, geometric modern sans).
- **Code & Telemetry:** `JetBrains Mono` / monospace for terminal readouts and selector paths.
- **Typographic Scale:**
  - `H1 / Display`: 24px–32px, bold, uppercase, letter-spacing `0.08em`.
  - `H2 / Section`: 18px–20px, semibold, letter-spacing `0.04em`.
  - `Body`: 14px–16px, line-height `1.6`, text-slate-300.
  - `Meta / Labels`: 11px–12px, uppercase tracking `0.1em`, text-slate-400.

---

## 3. Layout, Surface & Anti-Slop Principles

1. **Strict Anti-Slop Invariants:**
   - **NO** generic purple-to-blue SaaS gradients.
   - **NO** nested cards inside cards or competing border frames.
   - **NO** generic 3-column marketing feature grids.
   - **NO** simulated progress meters or fake telemetry readouts.
2. **Edge-to-Edge Full-Screen Canvases:**
   - Modals and drawers (Weather Console, Neural Workspace, Browser HUD, Session History, Swarm Hub) extend across the complete viewport with smooth backdrop blurs (`backdrop-blur-xl`).
3. **Audio-Tactile Feedback Synthesizer:**
   - Web Audio API real-time acoustic synthesis: low-frequency confirmation tones (220Hz), high-frequency alerts (880Hz), and futuristic interface bleeps.
4. **Canvas Particle Rendering:**
   - Interactive background particle mesh responding to mouse hover and audio frequency spikes at 60 FPS without memory leaks.
