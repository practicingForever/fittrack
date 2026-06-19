import { describe, it, expect } from 'vitest'

describe('rest timer helpers', () => {
  it('formats 90s as 1:30', () => {
    const remaining = 90
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    expect(`${mins}:${String(secs).padStart(2, '0')}`).toBe('1:30')
  })

  it('formats 0s as 0:00', () => {
    const remaining = 0
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    expect(`${mins}:${String(secs).padStart(2, '0')}`).toBe('0:00')
  })

  it('formats 65s as 1:05', () => {
    const remaining = 65
    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    expect(`${mins}:${String(secs).padStart(2, '0')}`).toBe('1:05')
  })

  it('computes circle progress ratio', () => {
    const progress = (remaining: number, duration: number) =>
      duration > 0 ? remaining / duration : 0
    expect(progress(90, 90)).toBe(1)
    expect(progress(45, 90)).toBe(0.5)
    expect(progress(0, 90)).toBe(0)
  })

  it('turns red at 10s or less', () => {
    const isRed = (remaining: number) => remaining <= 10
    expect(isRed(10)).toBe(true)
    expect(isRed(11)).toBe(false)
    expect(isRed(0)).toBe(true)
  })
})
