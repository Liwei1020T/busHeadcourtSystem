/**
 * Design System Tokens - Enterprise Dark Theme
 * Centralized design tokens for consistent styling across the application
 */

// Shift color mappings (used in badges and status indicators)
export const SHIFT_COLORS = {
  morning: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  night: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  },
  unknown: {
    bg: 'bg-slate-600/30',
    text: 'text-slate-400',
    badge: 'bg-slate-600/30 text-slate-400 border border-slate-500/30',
  },
} as const;

// Status color mappings
export const STATUS_COLORS = {
  present: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  unknown_batch: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  unknown_shift: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  },
  active: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  inactive: {
    bg: 'bg-slate-600/30',
    text: 'text-slate-400',
    badge: 'bg-slate-600/30 text-slate-400 border border-slate-500/30',
  },
} as const;

// KPI card color mappings - Dark theme with glow
export const KPI_COLORS = {
  blue: {
    bg: 'gradient-cyan',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'glow-cyan',
    icon: 'text-cyan-400',
  },
  green: {
    bg: 'gradient-emerald',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'glow-emerald',
    icon: 'text-emerald-400',
  },
  yellow: {
    bg: 'gradient-amber',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'glow-amber',
    icon: 'text-amber-400',
  },
  red: {
    bg: 'gradient-rose',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    glow: 'glow-rose',
    icon: 'text-rose-400',
  },
} as const;

// Spacing tokens (consistent spacing scale)
export const SPACING = {
  section: 'space-y-6', // Between major sections
  card: 'space-y-4', // Inside cards
  form: 'space-y-4', // Form fields
  inline: 'gap-2', // Inline elements (buttons, badges)
  inlineMd: 'gap-3', // Medium inline spacing
  inlineLg: 'gap-4', // Large inline spacing
} as const;

// Container and layout tokens
export const LAYOUT = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  cardPadding: 'p-6',
  cardPaddingSm: 'p-4',
  navHeight: 'h-16',
} as const;

// Typography tokens - Light text for dark theme
export const TYPOGRAPHY = {
  pageTitle: 'text-2xl font-bold text-slate-100',
  pageSubtitle: 'text-sm text-slate-400',
  sectionTitle: 'text-lg font-semibold text-slate-100',
  cardTitle: 'text-base font-medium text-slate-100',
  label: 'text-sm font-medium text-slate-300',
  labelUppercase: 'text-xs font-medium text-slate-400 uppercase tracking-wider',
  body: 'text-sm text-slate-200',
  bodySm: 'text-xs text-slate-400',
  kpiValue: 'text-3xl font-bold',
  kpiLabel: 'text-xs text-slate-400',
} as const;

// Border radius tokens
export const RADIUS = {
  card: 'rounded-xl',
  input: 'rounded-lg',
  badge: 'rounded-full',
  button: 'rounded-lg',
} as const;

// Shadow tokens - Enhanced for dark theme
export const SHADOW = {
  card: 'shadow-xl shadow-black/20',
  cardHover: 'shadow-2xl shadow-black/30',
  none: 'shadow-none',
} as const;

// Transition tokens
export const TRANSITION = {
  default: 'transition-colors',
  all: 'transition-all',
  fast: 'transition-all duration-150',
  medium: 'transition-all duration-300',
} as const;

// Chart colors for dark theme - Neon palette
export const CHART_COLORS = {
  primary: '#06b6d4',   // Cyan
  secondary: '#10b981', // Emerald
  tertiary: '#f59e0b',  // Amber
  quaternary: '#a855f7', // Purple
  quinary: '#f43f5e',   // Rose
  grid: '#334155',      // Slate-700
  text: '#94a3b8',      // Slate-400
} as const;

// Helper function to get shift badge variant
export function getShiftBadgeVariant(shift: string): 'default' | 'secondary' | 'outline' {
  if (shift === 'morning') return 'default';
  if (shift === 'night') return 'secondary';
  return 'outline';
}

// Helper function to get status badge variant
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'present' || status === 'active') return 'default';
  if (status === 'unknown_batch') return 'secondary';
  if (status === 'unknown_shift') return 'destructive';
  return 'outline';
}

