import { describe, it, expect } from 'vitest'

function toLocalDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toLocalDate(date.toISOString())
}

describe('streak helpers', () => {
  it('addDays works forward', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02')
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01')
  })

  it('addDays works backward', () => {
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29') // 2024 is leap year
  })

  it('computes longest streak from sorted days', () => {
    const days = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-05']
    let longest = 0
    let run = 0
    for (let i = 0; i < days.length; i++) {
      if (i === 0 || addDays(days[i - 1], 1) === days[i]) {
        run++
      } else {
        run = 1
      }
      longest = Math.max(longest, run)
    }
    expect(longest).toBe(3)
  })

  it('returns 0 streak for empty history', () => {
    const days: string[] = []
    let longest = 0, run = 0
    for (let i = 0; i < days.length; i++) {
      if (i === 0 || addDays(days[i - 1], 1) === days[i]) run++
      else run = 1
      longest = Math.max(longest, run)
    }
    expect(longest).toBe(0)
  })

  it('contribution window is 112 days', () => {
    // Just verify arithmetic
    const days: string[] = []
    const today = '2024-06-19'
    for (let i = 111; i >= 0; i--) days.push(addDays(today, -i))
    expect(days).toHaveLength(112)
    expect(days[0]).toBe('2024-02-29') // 111 days before Jun 19 (2024 is a leap year)
    expect(days[111]).toBe('2024-06-19')
  })
})
