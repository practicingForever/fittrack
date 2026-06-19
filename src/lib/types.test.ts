import { describe, it, expect } from 'vitest'
import type { StrengthSet, Workout } from './types'

describe('types', () => {
  it('StrengthSet shape is correct', () => {
    const s: StrengthSet = {
      id: 'abc',
      workout_id: 'w1',
      exercise_id: 'e1',
      wod_id: null,
      set_index: 1,
      weight_kg: 100,
      reps: 5,
      side: 'both',
      type: 'working',
      effort_score: null,
      logged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(s.weight_kg).toBe(100)
  })

  it('Workout shape is correct', () => {
    const w: Workout = {
      id: 'w1',
      user_id: 'u1',
      title: 'Morning session',
      started_at: new Date().toISOString(),
      ended_at: null,
      planned_duration_min: null,
      session_grade: null,
      session_letter: null,
      notes: null,
      is_shared: true,
      updated_at: new Date().toISOString(),
    }
    expect(w.is_shared).toBe(true)
  })
})
