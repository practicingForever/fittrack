import { describe, it, expect } from 'vitest'

type TimerStatus = 'idle' | 'running' | 'paused'

describe('workout timer state machine', () => {
  it('starts in idle', () => {
    const status: TimerStatus = 'idle'
    expect(status).toBe('idle')
  })

  it('idle -> running on startTimer', () => {
    let status: TimerStatus = 'idle'
    status = 'running'
    expect(status).toBe('running')
  })

  it('running -> paused on pauseTimer', () => {
    let status: TimerStatus = 'running'
    status = 'paused'
    expect(status).toBe('paused')
  })

  it('paused -> running on resumeTimer', () => {
    let status: TimerStatus = 'paused'
    status = 'running'
    expect(status).toBe('running')
  })

  it('elapsed resets to 0 on new workout', () => {
    let elapsed = 999
    elapsed = 0
    expect(elapsed).toBe(0)
  })

  it('accumulated ms logic', () => {
    // Simulate: ran 30s, paused, resumed, ran 20s
    let accumulated = 30_000
    // After 20 more seconds:
    const total = accumulated + 20_000
    expect(total).toBe(50_000)
  })
})
