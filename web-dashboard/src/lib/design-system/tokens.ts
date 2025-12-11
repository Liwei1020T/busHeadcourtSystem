/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

// Shift color mappings (used in badges and status indicators)
export const SHIFT_COLORS = {
  morning: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
  },
  night: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  unknown: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    badge: 'bg-gray-100 text-gray-800',
  },
} as const;

// Status color mappings
export const STATUS_COLORS = {
  present: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
  },
  unknown_batch: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  unknown_shift: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
  },
  inactive: {
    bg: 'bg-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-200 text-gray-700',
  },
} as const;

// KPI card color mappings
export const KPI_COLORS = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
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

// Typography tokens
export const TYPOGRAPHY = {
  pageTitle: 'text-2xl font-bold text-gray-900',
  pageSubtitle: 'text-sm text-gray-500',
  sectionTitle: 'text-lg font-semibold text-gray-900',
  cardTitle: 'text-base font-medium text-gray-900',
  label: 'text-sm font-medium text-gray-700',
  labelUppercase: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
  body: 'text-sm text-gray-900',
  bodySm: 'text-xs text-gray-600',
  kpiValue: 'text-2xl font-semibold',
  kpiLabel: 'text-xs text-gray-500',
} as const;

// Border radius tokens
export const RADIUS = {
  card: 'rounded-lg',
  input: 'rounded-md',
  badge: 'rounded-full',
  button: 'rounded-md',
} as const;

// Shadow tokens
export const SHADOW = {
  card: 'shadow',
  cardHover: 'shadow-md',
  none: 'shadow-none',
} as const;

// Transition tokens
export const TRANSITION = {
  default: 'transition-colors',
  all: 'transition-all',
  fast: 'transition-all duration-150',
  medium: 'transition-all duration-300',
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
