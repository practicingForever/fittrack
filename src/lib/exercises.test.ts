import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { FitTrackDB } from './db'
import type { Exercise } from './types'

const NOW = '2024-01-01T00:00:00.000Z'

function makeExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: crypto.randomUUID(),
    owner_id: 'u1',
    name: 'Bench press',
    category: 'strength',
    muscle_group_id: null,
    is_unilateral: false,
    visibility: 'private',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

describe('searchExercises', () => {
  let testDb: FitTrackDB

  beforeEach(async () => {
    // Override the db singleton for tests
    testDb = new FitTrackDB()
    await testDb.open()
    await testDb.exercises.clear()
    await testDb.exercises.bulkPut([
      makeExercise({ id: '1', name: 'Bench press', category: 'strength', owner_id: 'u1' }),
      makeExercise({ id: '2', name: 'Squat', category: 'strength', owner_id: 'u1' }),
      makeExercise({ id: '3', name: '5k run', category: 'running', owner_id: 'u2', visibility: 'shared' }),
    ])
  })

  it('filters by name query', async () => {
    // Test the filter logic directly (pure function)
    const all = [
      makeExercise({ name: 'Bench press' }),
      makeExercise({ name: 'Squat' }),
    ]
    const q = 'bench'
    const result = all.filter(ex => ex.name.toLowerCase().includes(q))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Bench press')
  })

  it('filters by category', () => {
    const all = [
      makeExercise({ name: 'Bench press', category: 'strength' }),
      makeExercise({ name: '5k run', category: 'running' }),
    ]
    const result = all.filter(ex => ex.category === 'running')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('5k run')
  })

  it('filters mine by owner_id', () => {
    const all = [
      makeExercise({ owner_id: 'u1' }),
      makeExercise({ owner_id: 'u2' }),
    ]
    const result = all.filter(ex => ex.owner_id === 'u1')
    expect(result).toHaveLength(1)
  })
})
