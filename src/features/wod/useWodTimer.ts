import { useState, useEffect, useRef, useCallback } from 'react'
import type { Wod } from '@/lib/types'
import {
  playWarning30, playWarning10, playCountdown,
  playRoundStart, playRestStart, playComplete,
} from '@/lib/wodAudio'

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

// Key = `${round}:${phase}:${cueType}` — prevents re-firing the same cue
type CueFiredSet = Set<string>

export function useWodTimer(wod: Wod | null) {
  const [state, setState] = useState<WodTimerState>({
    phase: 'idle',
    currentRound: 1,
    totalRounds: 1,
    displaySeconds: 0,
    isCountingUp: false,
  })

  const startTimeRef   = useRef<number | null>(null)
  const phaseStartRef  = useRef<number | null>(null)
  const rafRef         = useRef<number | null>(null)
  const firedRef       = useRef<CueFiredSet>(new Set())

  // Fire a cue at most once per unique key
  function once(key: string, fn: () => void) {
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    fn()
  }

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
        once('done', playComplete)
        return
      }
      // for_time counts up — warn at (cap - 30) and (cap - 10) remaining
      if (cap) {
        const remaining = cap - display
        if (remaining === 30) once('warn30', playWarning30)
        if (remaining === 10) once('warn10', playWarning10)
        if (remaining === 3)  once('countdown', playCountdown)
      }
      setState(s => ({ ...s, displaySeconds: display, isCountingUp: true }))

    } else if (wod.type === 'amrap') {
      const cap = wod.total_seconds ?? 600
      const remaining = cap - elapsed
      if (remaining <= 0) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        once('done', playComplete)
        return
      }
      const rem = Math.ceil(remaining)
      if (rem === 30) once('warn30', playWarning30)
      if (rem === 10) once('warn10', playWarning10)
      if (rem === 3)  once('countdown', playCountdown)
      setState(s => ({ ...s, displaySeconds: rem }))

    } else if (wod.type === 'emom') {
      const interval    = wod.interval_seconds ?? 60
      const totalRounds = wod.rounds ?? 10
      const totalTime   = interval * totalRounds
      const totalElapsed = (now - startTimeRef.current!) / 1000
      if (totalElapsed >= totalTime) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        once('done', playComplete)
        return
      }
      const currentRound = Math.floor(totalElapsed / interval) + 1
      const intoInterval = totalElapsed % interval
      const remaining    = interval - intoInterval
      const rem          = Math.ceil(remaining)

      if (rem === 30) once(`r${currentRound}:warn30`, playWarning30)
      if (rem === 10) once(`r${currentRound}:warn10`, playWarning10)
      if (rem === 3)  once(`r${currentRound}:countdown`, playCountdown)

      setState(prev => {
        if (currentRound !== prev.currentRound) {
          vibrate([100])
          once(`r${currentRound}:start`, () => playRoundStart(`Round ${currentRound}`))
        }
        return { ...prev, currentRound, totalRounds, displaySeconds: rem }
      })

    } else if (wod.type === 'tabata') {
      const work        = wod.work_seconds ?? 20
      const rest        = wod.rest_seconds ?? 10
      const totalRounds = wod.rounds ?? 8
      const cycleLen    = work + rest
      const totalTime   = cycleLen * totalRounds
      const totalElapsed = (now - startTimeRef.current!) / 1000
      if (totalElapsed >= totalTime) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: 0 }))
        vibrate([200, 100, 200])
        once('done', playComplete)
        return
      }
      const currentRound = Math.floor(totalElapsed / cycleLen) + 1
      const intoRound    = totalElapsed % cycleLen
      const isWork       = intoRound < work
      const remaining    = isWork ? work - intoRound : cycleLen - intoRound
      const rem          = Math.ceil(remaining)
      const phaseKey     = isWork ? 'work' : 'rest'

      // 3-2-1 countdown before each phase transition
      if (rem === 3) once(`r${currentRound}:${phaseKey}:countdown`, playCountdown)

      setState(prev => {
        const newPhase: TimerPhase = isWork ? 'running' : 'rest'
        if (newPhase !== prev.phase) {
          vibrate(isWork ? [100] : [50])
          if (isWork) {
            once(`r${currentRound}:work:start`, () =>
              playRoundStart(totalRounds > 1 ? `Round ${currentRound}` : 'Work')
            )
          } else {
            once(`r${currentRound}:rest:start`, playRestStart)
          }
        }
        return { ...prev, phase: newPhase, currentRound, totalRounds, displaySeconds: rem }
      })
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [wod]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (!wod) return
    firedRef.current = new Set() // reset cue history on each new start
    const now = performance.now()
    startTimeRef.current  = now
    phaseStartRef.current = now
    const totalRounds = wod.rounds ?? (wod.type === 'tabata' ? 8 : wod.type === 'emom' ? 10 : 1)
    setState({
      phase: 'running',
      currentRound: 1,
      totalRounds,
      displaySeconds: wod.type === 'for_time' ? 0 : (wod.total_seconds ?? wod.interval_seconds ?? 60),
      isCountingUp: wod.type === 'for_time',
    })
    // Announce round 1 start
    playRoundStart(wod.type === 'emom' ? 'Round 1' : undefined)
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
