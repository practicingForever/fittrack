import { describe, it, expect } from 'vitest'
import type { Wod } from './types'

const NOW = '2024-01-01T00:00:00.000Z'

function makeWod(overrides: Partial<Wod> = {}): Wod {
  return {
    id: '1',
    workout_id: 'w1',
    type: 'amrap',
    title: '',
    total_seconds: 1200,
    interval_seconds: null,
    work_seconds: null,
    rest_seconds: null,
    rounds: null,
    result_seconds: null,
    result_rounds: null,
    notes: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

describe('wod types', () => {
  it('AMRAP has total_seconds', () => {
    const wod = makeWod({ type: 'amrap', total_seconds: 1200 })
    expect(wod.total_seconds).toBe(1200)
    expect(wod.type).toBe('amrap')
  })

  it('EMOM has interval_seconds and rounds', () => {
    const wod = makeWod({ type: 'emom', interval_seconds: 60, rounds: 10 })
    expect(wod.interval_seconds).toBe(60)
    expect(wod.rounds).toBe(10)
  })

  it('Tabata has work/rest/rounds', () => {
    const wod = makeWod({ type: 'tabata', work_seconds: 20, rest_seconds: 10, rounds: 8 })
    expect(wod.work_seconds).toBe(20)
    expect(wod.rest_seconds).toBe(10)
  })
})
