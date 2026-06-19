export interface HistoryPoint {
  weight_kg: number
  reps: number
}

export interface EffortResult {
  score: number        // 1–100, rounded to 2 decimal places
  isBaseline: boolean  // true when no history existed
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function stdDev(values: number[], avg: number): number {
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Compute effort score for a single strength set.
 * history = last ≤10 working sets at same exercise+setIndex (most recent first).
 */
export function computeEffortScore(
  weightKg: number,
  reps: number,
  type: string,
  history: HistoryPoint[]
): EffortResult {
  if (history.length === 0) {
    return { score: 50, isBaseline: true }
  }

  const volumes = history.map(h => h.weight_kg * h.reps)
  const avg = mean(volumes)
  const std = stdDev(volumes, avg)

  const volume = weightKg * reps
  const z = (volume - avg) / Math.max(std, 1e-6)
  const raw = 50 + 18 * z

  const intensityMult =
    1 +
    (type === 'failure' ? 0.05 : 0) +
    (reps >= 5 && reps <= 12 ? 0.03 : 0)

  const score = clamp(raw * intensityMult, 1, 100)
  return { score: Math.round(score * 100) / 100, isBaseline: false }
}

/** Map a 0–100 score to a human label and a Tailwind color class. */
export function scoreLabel(score: number): { label: string; colorClass: string } {
  if (score >= 90) return { label: 'Elite',   colorClass: 'text-emerald-400' }
  if (score >= 75) return { label: 'Strong',  colorClass: 'text-green-400'   }
  if (score >= 55) return { label: 'Good',    colorClass: 'text-zinc-300'    }
  if (score >= 40) return { label: 'Average', colorClass: 'text-zinc-500'    }
  return                   { label: 'Light',  colorClass: 'text-zinc-600'    }
}
