/** Blend 2 color system — consistent across library chips, dashboard bars, and any future views. */
export interface MuscleColor {
  bg: string      // chip / card fill
  text: string    // chip text
  bar: string     // dashboard bar / dot
}

const MUSCLE_COLORS: Record<string, MuscleColor> = {
  'Back':          { bg: '#bfdbfe', text: '#1e3a8a', bar: '#2563eb' },
  'Chest':         { bg: '#fbcfe8', text: '#831843', bar: '#db2777' },
  'Shoulders':     { bg: '#fde68a', text: '#78350f', bar: '#d97706' },
  'Legs':          { bg: '#bbf7d0', text: '#14532d', bar: '#16a34a' },
  'Biceps':        { bg: '#a5f3fc', text: '#164e63', bar: '#0891b2' },
  'Triceps':       { bg: '#fed7aa', text: '#7c2d12', bar: '#ea580c' },
  'Core':          { bg: '#ddd6fe', text: '#3b0764', bar: '#7c3aed' },
  'Glutes':        { bg: '#f5d0fe', text: '#701a75', bar: '#a21caf' },
  'Conditioning':  { bg: '#99f6e4', text: '#134e4a', bar: '#0d9488' },
  'Olympic lifts': { bg: '#e9d5ff', text: '#4a044e', bar: '#9333ea' },
  'Gymnastics':    { bg: '#e2e8f0', text: '#1e293b', bar: '#475569' },
}

const FALLBACK: MuscleColor = { bg: '#f1f5f9', text: '#334155', bar: '#64748b' }

export function getMuscleColor(groupName: string): MuscleColor {
  return MUSCLE_COLORS[groupName] ?? FALLBACK
}
