import { describe, it, expect } from 'vitest'
import type { StrengthSet } from './types'

const NOW = '2024-01-01T00:00:00.000Z'

function makeSet(overrides: Partial<StrengthSet> = {}): StrengthSet {
  return {
    id: crypto.randomUUID(),
    workout_id: 'w1',
    exercise_id: 'e1',
    wod_id: null,
    set_index: 1,
    weight_kg: 100,
    reps: 5,
    side: 'both',
    type: 'working',
    effort_score: null,
    logged_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

describe('workouts helpers', () => {
  it('set shape is valid', () => {
    const s = makeSet({ weight_kg: 80, reps: 8 })
    expect(s.weight_kg).toBe(80)
    expect(s.reps).toBe(8)
    expect(s.type).toBe('working')
  })

  it('orders sets by set_index', () => {
    const sets = [makeSet({ set_index: 3 }), makeSet({ set_index: 1 }), makeSet({ set_index: 2 })]
    const sorted = [...sets].sort((a, b) => a.set_index - b.set_index)
    expect(sorted.map(s => s.set_index)).toEqual([1, 2, 3])
  })

  it('finds most recent set by logged_at', () => {
    const sets = [
      makeSet({ logged_at: '2024-01-01T00:00:00.000Z' }),
      makeSet({ logged_at: '2024-01-03T00:00:00.000Z' }),
      makeSet({ logged_at: '2024-01-02T00:00:00.000Z' }),
    ]
    sets.sort((a, b) => b.logged_at.localeCompare(a.logged_at))
    expect(sets[0].logged_at).toBe('2024-01-03T00:00:00.000Z')
  })
})
