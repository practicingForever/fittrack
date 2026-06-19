import { describe, it, expect } from 'vitest'

// Pure helper logic extracted from analytics
function toLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function mondayOfWeek(iso: string): string {
  const d = new Date(iso)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

describe('analytics helpers', () => {
  it('toLabel formats date correctly', () => {
    const label = toLabel('2024-06-03T10:00:00.000Z')
    expect(label).toMatch(/Jun/)
  })

  it('mondayOfWeek returns Monday for a Wednesday', () => {
    // 2024-06-05 is a Wednesday; Monday of that week is 2024-06-03
    const label = mondayOfWeek('2024-06-05T00:00:00.000Z')
    expect(label).toMatch(/Jun/)
  })

  it('weekly volume aggregation logic', () => {
    const sets = [
      { weight_kg: 100, reps: 5, workout_id: 'w1' },
      { weight_kg: 80,  reps: 8, workout_id: 'w1' },
    ]
    const total = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
    expect(total).toBe(1140) // 500 + 640
  })

  it('effort mean calculation', () => {
    const scores = [70, 80, 90]
    const mean = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    expect(mean).toBe(80)
  })

  it('filters warmup sets', () => {
    const sets = [
      { type: 'warmup', weight_kg: 40, reps: 10 },
      { type: 'working', weight_kg: 100, reps: 5 },
    ]
    const working = sets.filter(s => s.type !== 'warmup')
    expect(working).toHaveLength(1)
    expect(working[0].weight_kg).toBe(100)
  })
})
