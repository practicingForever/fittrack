import { describe, it, expect } from 'vitest'

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function currentStreak(daySet: Set<string>): number {
  const today = new Date()
  let streak = 0
  const d = new Date()
  if (!daySet.has(toYmd(today))) d.setDate(d.getDate() - 1)
  while (daySet.has(toYmd(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

describe('feed helpers', () => {
  it('currentStreak is 0 for empty set', () => {
    expect(currentStreak(new Set())).toBe(0)
  })

  it('volume accumulates correctly', () => {
    const sets = [
      { weight_kg: 100, reps: 5 },
      { weight_kg: 80, reps: 8 },
    ]
    const total = Math.round(sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0))
    expect(total).toBe(1140)
  })

  it('set count groups by workout_id', () => {
    const sets = [
      { workout_id: 'w1' }, { workout_id: 'w1' }, { workout_id: 'w2' }
    ]
    const countMap = new Map<string, number>()
    for (const s of sets) countMap.set(s.workout_id, (countMap.get(s.workout_id) ?? 0) + 1)
    expect(countMap.get('w1')).toBe(2)
    expect(countMap.get('w2')).toBe(1)
  })
})
