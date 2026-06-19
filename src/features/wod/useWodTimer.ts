import { useState, useEffect, useRef, useCallback } from 'react'
import type { Wod } from '@/lib/types'

export type TimerPhase = 'idle' | 'running' | 'rest' | 'done'

export interface WodTimerState {
  phase: TimerPhase
  currentRound: number    // 1-based
  totalRounds: number
  displaySeconds: number  // seconds to show on the clock (countdown or elapsed)
  isCountingUp: boolean   // for_time counts up; others count down
}

function vibrate(pattern: number[]) {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}

export function useWodTimer(wod: Wod | null) {
  const [state, setState] = useState<WodTimerState>({
    phase: 'idle',
    currentRound: 1,
    totalRounds: 1,
    displaySeconds: 0,
    isCountingUp: false,
  })

  const startTimeRef = useRef<number | null>(null)
  const phaseStartRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (!wod || !startTimeRef.current || !phaseStartRef.current) return
    const now = performance.now()
    const elapsed = (now - phaseStartRef.current) / 1000

    if (wod.type === 'for_time') {
      const cap = wod.total_seconds
      const display = Math.floor(elapsed)
      if (cap && display >= cap) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: cap }))
        vibrate([200, 100, 200])
        return
      }
      setState(s => ({ ...s, displaySeconds: display, isCountingUp: true }))
    } else if (wod.type === 'amrap') {
      const cap = wod.total_seconds ?? 600
      const remaining = cap - elapsed
      if (remaining <= 0) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        return
      }
      setState(s => ({ ...s, displaySeconds: Math.ceil(remaining) }))
    } else if (wod.type === 'emom') {
      const interval = wod.interval_seconds ?? 60
      const totalRounds = wod.rounds ?? 10
      const totalTime = interval * totalRounds
      const totalElapsed = (now - startTimeRef.current!) / 1000
      if (totalElapsed >= totalTime) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        return
      }
      const currentRound = Math.floor(totalElapsed / interval) + 1
      const intoInterval = totalElapsed % interval
      const remaining = interval - intoInterval
      // Beep at each new round boundary
      setState(prev => {
        if (currentRound !== prev.currentRound) vibrate([100])
        return { ...prev, currentRound, totalRounds, displaySeconds: Math.ceil(remaining) }
      })
    } else if (wod.type === 'tabata') {
      const work = wod.work_seconds ?? 20
      const rest = wod.rest_seconds ?? 10
      const totalRounds = wod.rounds ?? 8
      const cycleLen = work + rest
      const totalTime = cycleLen * totalRounds
      const totalElapsed = (now - startTimeRef.current!) / 1000
      if (totalElapsed >= totalTime) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        return
      }
      const currentRound = Math.floor(totalElapsed / cycleLen) + 1
      const intoRound = totalElapsed % cycleLen
      const isWork = intoRound < work
      const remaining = isWork ? work - intoRound : cycleLen - intoRound
      setState(prev => {
        const newPhase: TimerPhase = isWork ? 'running' : 'rest'
        if (newPhase !== prev.phase) vibrate(isWork ? [100] : [50])
        return { ...prev, phase: newPhase, currentRound, totalRounds, displaySeconds: Math.ceil(remaining) }
      })
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [wod])

  const start = useCallback(() => {
    if (!wod) return
    const now = performance.now()
    startTimeRef.current = now
    phaseStartRef.current = now
    const totalRounds = wod.rounds ?? (wod.type === 'tabata' ? 8 : wod.type === 'emom' ? 10 : 1)
    setState({
      phase: 'running',
      currentRound: 1,
      totalRounds,
      displaySeconds: wod.type === 'for_time' ? 0 : (wod.total_seconds ?? wod.interval_seconds ?? 60),
      isCountingUp: wod.type === 'for_time',
    })
    rafRef.current = requestAnimationFrame(tick)
  }, [wod, tick])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setState(s => ({ ...s, phase: 'done' }))
  }, [])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const elapsedSeconds = startTimeRef.current
    ? Math.floor((performance.now() - startTimeRef.current) / 1000)
    : 0

  return { state, start, stop, elapsedSeconds }
}
