import { describe, it, expect } from 'vitest'
import type { WorkoutPlan, PlanExercise } from './types'

const NOW = '2024-01-01T00:00:00.000Z'

function makePlan(overrides: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return { id: '1', name: 'Push day', created_at: NOW, updated_at: NOW, ...overrides }
}

describe('plans helpers', () => {
  it('plan has a name', () => {
    const plan = makePlan({ name: 'Push day' })
    expect(plan.name).toBe('Push day')
  })

  it('sorts plans by updated_at desc', () => {
    const plans = [
      makePlan({ id: '1', updated_at: '2024-01-01T00:00:00.000Z' }),
      makePlan({ id: '2', updated_at: '2024-01-03T00:00:00.000Z' }),
      makePlan({ id: '3', updated_at: '2024-01-02T00:00:00.000Z' }),
    ]
    const sorted = [...plans].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
  })

  it('plan exercise order_index increments', () => {
    const existing: PlanExercise[] = [
      { id: 'pe1', plan_id: 'p1', exercise_id: 'e1', exercise_name: 'Bench', order_index: 0, target_sets: 3, target_reps: 5, target_weight_kg: 100 },
    ]
    const nextIndex = existing.length
    expect(nextIndex).toBe(1)
  })

  it('target weight defaults to null', () => {
    const pe: PlanExercise = {
      id: 'pe1', plan_id: 'p1', exercise_id: 'e1', exercise_name: 'Squat',
      order_index: 0, target_sets: 3, target_reps: 5, target_weight_kg: null,
    }
    expect(pe.target_weight_kg).toBeNull()
  })
})
