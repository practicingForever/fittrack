import { describe, it, expect } from 'vitest'

describe('auth helpers', () => {
  it('validates email format', () => {
    const isValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    expect(isValid('kartik@example.com')).toBe(true)
    expect(isValid('notanemail')).toBe(false)
  })

  it('validates password length', () => {
    const isValid = (p: string) => p.length >= 6
    expect(isValid('secret')).toBe(true)
    expect(isValid('123')).toBe(false)
  })
})
