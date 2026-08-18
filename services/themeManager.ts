export type JarvisTheme = 'cyber' | 'crimson' | 'violet' | 'emerald';

export interface ThemeMetadata {
  id: JarvisTheme;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  inspiration: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  accentClass: string;
  bgHex: string;
  
  // Canvas RGB values for particle engines & orb visualizers
  canvas: {
    primary: { r: number; g: number; b: number };
    secondary: { r: number; g: number; b: number };
    background: { r: number; g: number; b: number };
  };

  // Tailwind CSS classes for UI components
  styles: {
    bg: string;
    cardBg: string;
    panelBg: string;
    border: string;
    borderHover: string;
    activeBorder: string;
    activeBg: string;
    glowShadow: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentGlow: string;
    headerGradient: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    scrollbarThumb: string;
    hudBorder: string;
    hudGlow: string;
  };
}

export const THEMES: Record<JarvisTheme, ThemeMetadata> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon HUD',
    subtitle: 'IRON MAN HUD • DEFAULT MODE',
    badge: 'DEFAULT',
    description: 'Neon cyan holographic sci-fi UI with glowing HUD optics, particle mesh & Mark-III interface.',
    inspiration: 'Iron Man JARVIS HUD System',
    primaryColorHex: '#00f2ff',
    secondaryColorHex: '#0041ff',
    accentClass: 'cyan',
    bgHex: '#01040a',
    canvas: {
      primary: { r: 0, g: 242, b: 255 },
      secondary: { r: 0, g: 65, b: 255 },
      background: { r: 2, g: 14, b: 34 }
    },
    styles: {
      bg: 'bg-[#01040a]',
      cardBg: 'bg-[rgba(2,13,26,0.7)]',
      panelBg: 'bg-[rgba(2,12,27,0.92)]',
      border: 'border-cyan-500/30',
      borderHover: 'hover:border-cyan-400/60',
      activeBorder: 'border-cyan-400',
      activeBg: 'bg-cyan-500/20',
      glowShadow: 'shadow-[0_0_25px_rgba(0,242,255,0.25)]',
      textPrimary: 'text-cyan-300',
      textSecondary: 'text-cyan-200/90',
      textMuted: 'text-cyan-400/60',
      accentGlow: 'shadow-[0_0_15px_#00f2ff]',
      headerGradient: 'from-cyan-300 via-blue-200 to-indigo-300',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/30',
      badgeText: 'text-cyan-300',
      scrollbarThumb: '#00f2ff',
      hudBorder: 'border-cyan-400/40',
      hudGlow: 'shadow-[0_0_20px_rgba(0,242,255,0.3)]'
    }
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Alert Core',
    subtitle: 'EMERGENCY AI • CRITICAL LOCKDOWN',
    badge: 'ALERT',
    description: 'Emergency AI protocol. Dark crimson background, red holographic glow, scarlet alert scanning & weapon lockdown.',
    inspiration: 'Friday Emergency Mode & Tactical Defense',
    primaryColorHex: '#ff003c',
    secondaryColorHex: '#9f1239',
    accentClass: 'rose',
    bgHex: '#050002',
    canvas: {
      primary: { r: 255, g: 0, b: 60 },
      secondary: { r: 225, g: 29, b: 72 },
      background: { r: 35, g: 2, b: 8 }
    },
    styles: {
      bg: 'bg-[#050002]',
      cardBg: 'bg-[rgba(25,3,8,0.75)]',
      panelBg: 'bg-[rgba(20,2,7,0.94)]',
      border: 'border-rose-600/40',
      borderHover: 'hover:border-rose-400/70',
      activeBorder: 'border-rose-400',
      activeBg: 'bg-rose-950/50',
      glowShadow: 'shadow-[0_0_30px_rgba(255,0,60,0.35)]',
      textPrimary: 'text-rose-300',
      textSecondary: 'text-rose-200/90',
      textMuted: 'text-rose-400/60',
      accentGlow: 'shadow-[0_0_18px_#ff003c]',
      headerGradient: 'from-rose-400 via-red-300 to-amber-300',
      badgeBg: 'bg-rose-950/50',
      badgeBorder: 'border-rose-500/40',
      badgeText: 'text-rose-300',
      scrollbarThumb: '#ff003c',
      hudBorder: 'border-rose-500/50',
      hudGlow: 'shadow-[0_0_22px_rgba(255,0,60,0.4)]'
    }
  },
  violet: {
    id: 'violet',
    name: 'Quantum Violet',
    subtitle: 'SUPER INTELLIGENCE • QUANTUM CORE',
    badge: 'QUANTUM',
    description: 'Dark navy background with electric violet glow, magenta highlights & quantum reactor energy fields.',
    inspiration: 'Artificial Super Intelligence & Vision Pro',
    primaryColorHex: '#a855f7',
    secondaryColorHex: '#6366f1',
    accentClass: 'purple',
    bgHex: '#050414',
    canvas: {
      primary: { r: 168, g: 85, b: 247 },
      secondary: { r: 232, g: 121, b: 249 },
      background: { r: 15, g: 9, b: 36 }
    },
    styles: {
      bg: 'bg-[#050414]',
      cardBg: 'bg-[rgba(16,9,38,0.75)]',
      panelBg: 'bg-[rgba(13,7,32,0.94)]',
      border: 'border-purple-500/40',
      borderHover: 'hover:border-purple-300/70',
      activeBorder: 'border-purple-400',
      activeBg: 'bg-purple-900/40',
      glowShadow: 'shadow-[0_0_30px_rgba(168,85,247,0.35)]',
      textPrimary: 'text-purple-300',
      textSecondary: 'text-purple-200/90',
      textMuted: 'text-purple-400/60',
      accentGlow: 'shadow-[0_0_18px_#a855f7]',
      headerGradient: 'from-purple-300 via-fuchsia-200 to-indigo-300',
      badgeBg: 'bg-purple-950/50',
      badgeBorder: 'border-purple-500/40',
      badgeText: 'text-purple-300',
      scrollbarThumb: '#a855f7',
      hudBorder: 'border-purple-400/50',
      hudGlow: 'shadow-[0_0_22px_rgba(168,85,247,0.4)]'
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Sentinel',
    subtitle: 'MILITARY AI • CYBER DEFENSE',
    badge: 'SENTINEL',
    description: 'Dark graphite background, emerald green lighting, military satellite radar & plasma reactor UI.',
    inspiration: 'Military Command & Satellite Operations',
    primaryColorHex: '#10b981',
    secondaryColorHex: '#059669',
    accentClass: 'emerald',
    bgHex: '#020b08',
    canvas: {
      primary: { r: 16, g: 185, b: 129 },
      secondary: { r: 52, g: 211, b: 153 },
      background: { r: 5, g: 26, b: 18 }
    },
    styles: {
      bg: 'bg-[#020b08]',
      cardBg: 'bg-[rgba(5,24,17,0.75)]',
      panelBg: 'bg-[rgba(3,18,13,0.94)]',
      border: 'border-emerald-500/40',
      borderHover: 'hover:border-emerald-300/70',
      activeBorder: 'border-emerald-400',
      activeBg: 'bg-emerald-950/50',
      glowShadow: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
      textPrimary: 'text-emerald-300',
      textSecondary: 'text-emerald-200/90',
      textMuted: 'text-emerald-400/60',
      accentGlow: 'shadow-[0_0_18px_#10b981]',
      headerGradient: 'from-emerald-300 via-teal-200 to-green-300',
      badgeBg: 'bg-emerald-950/50',
      badgeBorder: 'border-emerald-500/40',
      badgeText: 'text-emerald-300',
      scrollbarThumb: '#10b981',
      hudBorder: 'border-emerald-400/50',
      hudGlow: 'shadow-[0_0_22px_rgba(16,185,129,0.4)]'
    }
  }
};

export function getThemeConfig(themeName?: string): ThemeMetadata {
  const normalized = normalizeThemeName(themeName);
  return THEMES[normalized] || THEMES.cyber;
}

export function normalizeThemeName(themeName?: string): JarvisTheme {
  if (!themeName) return 'cyber';
  if (themeName === 'cyber') return 'cyber';
  if (themeName === 'crimson' || themeName === 'slate') return 'crimson';
  if (themeName === 'violet' || themeName === 'gold') return 'violet';
  if (themeName === 'emerald' || themeName === 'minimal') return 'emerald';
  return 'cyber';
}
