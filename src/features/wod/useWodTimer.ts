import { useState, useEffect, useRef, useCallback } from 'react'
import type { Wod } from '@/lib/types'
import {
  playWarning30, playWarning10, playCountdown,
  playRoundStart, playRestStart, playComplete,
} from '@/lib/wodAudio'

export type TimerPhase = 'idle' | 'running' | 'rest' | 'done'

export interface WodTimerState {
  phase: TimerPhase
  currentRound: number
  totalRounds: number
  displaySeconds: number
  isCountingUp: boolean
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

  const startTimeRef  = useRef<number | null>(null)
  const phaseStartRef = useRef<number | null>(null)
  const rafRef        = useRef<number | null>(null)
  // Track what we've already announced so each cue fires exactly once
  const firedRef      = useRef<Set<string>>(new Set())
  // Track previous round/phase outside of setState to avoid setState-callback side-effects
  const prevRoundRef  = useRef(0)
  const prevPhaseRef  = useRef<TimerPhase>('idle')

  function once(key: string, fn: () => void) {
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    fn()
  }

  function roundLabel(round: number, total: number): string {
    if (round === total)     return 'Last round'
    if (round === total - 1) return '2 rounds to go'
    return `Round ${round}`
  }

  const tick = useCallback(() => {
    if (!wod || !startTimeRef.current || !phaseStartRef.current) return
    const now     = performance.now()
    const elapsed = (now - phaseStartRef.current) / 1000

    if (wod.type === 'for_time') {
      const cap     = wod.total_seconds
      const display = Math.floor(elapsed)
      if (cap && display >= cap) {
        setState(s => ({ ...s, phase: 'done', displaySeconds: cap }))
        vibrate([200, 100, 200])
        once('done', playComplete)
        return
      }
      if (cap) {
        const rem = cap - display
        if (rem === 30) once('warn30', playWarning30)
        if (rem === 10) once('warn10', playWarning10)
        if (rem === 3)  once('countdown', playCountdown)
      }
      setState(s => ({ ...s, displaySeconds: display, isCountingUp: true }))

    } else if (wod.type === 'amrap') {
      const cap       = wod.total_seconds ?? 600
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
      const rem          = Math.ceil(interval - (totalElapsed % interval))

      // Per-round warnings on the countdown clock
      if (rem === 30 && interval > 35) once(`r${currentRound}:warn30`, playWarning30)
      if (rem === 10) once(`r${currentRound}:warn10`, playWarning10)
      if (rem === 3)  once(`r${currentRound}:countdown`, playCountdown)

      // Round change — fire outside setState using ref comparison
      if (currentRound !== prevRoundRef.current) {
        prevRoundRef.current = currentRound
        vibrate([100])
        once(`r${currentRound}:start`, () =>
          playRoundStart(roundLabel(currentRound, totalRounds))
        )
      }

      setState(s => ({ ...s, currentRound, totalRounds, displaySeconds: rem }))

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
      const rem          = Math.ceil(isWork ? work - intoRound : cycleLen - intoRound)
      const newPhase: TimerPhase = isWork ? 'running' : 'rest'
      const phaseKey     = isWork ? 'work' : 'rest'

      if (rem === 3) once(`r${currentRound}:${phaseKey}:countdown`, playCountdown)

      // Phase/round change detection via refs
      if (newPhase !== prevPhaseRef.current || currentRound !== prevRoundRef.current) {
        prevPhaseRef.current = newPhase
        prevRoundRef.current = currentRound
        vibrate(isWork ? [100] : [50])
        if (isWork) {
          once(`r${currentRound}:work:start`, () =>
            playRoundStart(
              totalRounds > 1 ? roundLabel(currentRound, totalRounds) : 'Work'
            )
          )
        } else {
          once(`r${currentRound}:rest:start`, playRestStart)
        }
      }

      setState(s => ({ ...s, phase: newPhase, currentRound, totalRounds, displaySeconds: rem }))
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [wod]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (!wod) return
    firedRef.current   = new Set()
    prevRoundRef.current = 0  // will trigger round-1 announcement on first tick
    prevPhaseRef.current = 'idle'
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
