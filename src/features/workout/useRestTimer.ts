import { useState, useEffect, useRef, useCallback } from 'react'

export interface RestTimerState {
  active: boolean
  remaining: number   // seconds left
  duration: number    // configured duration
}

async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fireNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Rest done', { body: 'Time for your next set!', silent: true })
  }
  if ('vibrate' in navigator) navigator.vibrate([300, 100, 300])
}

export function useRestTimer(defaultDuration = 90) {
  const [state, setState] = useState<RestTimerState>({
    active: false,
    remaining: defaultDuration,
    duration: defaultDuration,
  })

  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const durationRef = useRef(defaultDuration)

  const tick = useCallback(() => {
    if (!startRef.current) return
    const elapsed = (performance.now() - startRef.current) / 1000
    const remaining = Math.max(0, durationRef.current - elapsed)

    setState(s => ({ ...s, remaining: Math.ceil(remaining) }))

    if (remaining <= 0) {
      fireNotification()
      setState(s => ({ ...s, active: false, remaining: 0 }))
      startRef.current = null
      return
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async (duration?: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    await requestNotifPermission()
    const dur = duration ?? durationRef.current
    durationRef.current = dur
    startRef.current = performance.now()
    setState({ active: true, remaining: dur, duration: dur })
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const skip = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null
    setState(s => ({ ...s, active: false, remaining: s.duration }))
  }, [])

  const setDuration = useCallback((dur: number) => {
    durationRef.current = dur
    setState(s => ({ ...s, duration: dur }))
  }, [])

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return { state, start, skip, setDuration }
}
