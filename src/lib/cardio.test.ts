import { describe, it, expect } from 'vitest'
import { formatPace, formatDuration } from './cardio'

describe('formatPace', () => {
  it('formats 6:00 /km', () => {
    expect(formatPace(360)).toBe('6:00')
  })
  it('formats 5:30 /km', () => {
    expect(formatPace(330)).toBe('5:30')
  })
  it('pads seconds', () => {
    expect(formatPace(301)).toBe('5:01')
  })
})

describe('formatDuration', () => {
  it('formats under 1 hour as m:ss', () => {
    expect(formatDuration(905)).toBe('15:05')
  })
  it('formats over 1 hour', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })
  it('formats 0 as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
})
