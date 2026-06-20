import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createWorkout, finishWorkout, deleteWorkout, logStrengthSet,
  getSetsForExercise, getPreviousSet, updateStrengthSet, deleteStrengthSet, type LogSetInput
} from '@/lib/workouts'
import { logCardioSet, type LogCardioInput } from '@/lib/cardio'
import { createWod, type CreateWodInput } from '@/lib/wods'
import type { Workout, StrengthSet, Exercise, CardioSet, Wod, SetType } from '@/lib/types'

interface ExerciseEntry {
  exercise: Exercise
  sets: StrengthSet[]
}

type TimerStatus = 'idle' | 'running' | 'paused'

export function useWorkout() {
  const { user } = useAuth()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [elapsed, setElapsed] = useState(0) // seconds
  const [cardioSets, setCardioSets] = useState<CardioSet[]>([])
  const [activeWod, setActiveWod] = useState<Wod | null>(null)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')

  const timerStartRef = useRef<number | null>(null)   // performance.now() when last resumed
  const accumulatedRef = useRef(0)                     // ms accumulated before last pause
  const rafRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const tick = useCallback(() => {
    if (!timerStartRef.current) return
    const ms = accumulatedRef.current + (performance.now() - timerStartRef.current)
    setElapsed(Math.floor(ms / 1000))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const startTimer = useCallback(() => {
    timerStartRef.current = performance.now()
    setTimerStatus('running')
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pauseTimer = useCallback(() => {
    if (timerStartRef.current) {
      accumulatedRef.current += performance.now() - timerStartRef.current
      timerStartRef.current = null
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setTimerStatus('paused')
  }, [])

  const resumeTimer = useCallback(() => {
    timerStartRef.current = performance.now()
    setTimerStatus('running')
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const startWorkout = useCallback(async () => {
    if (!user) return
    const w = await createWorkout(user.id)
    setWorkout(w)
    setEntries([])
    setCardioSets([])
    setActiveWod(null)
    setTimerStatus('idle')
    setElapsed(0)
    timerStartRef.current = null
    accumulatedRef.current = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [user])

  const endWorkout = useCallback(async () => {
    if (!workout) return
    await finishWorkout(workout.id)
    setWorkout(null)
    setEntries([])
    setElapsed(0)
    setCardioSets([])
    setActiveWod(null)
    setTimerStatus('idle')
    timerStartRef.current = null
    accumulatedRef.current = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [workout])

  const cancelWorkout = useCallback(async () => {
    if (!workout) return
    await deleteWorkout(workout.id)
    setWorkout(null)
    setEntries([])
    setElapsed(0)
    setCardioSets([])
    setActiveWod(null)
    setTimerStatus('idle')
    timerStartRef.current = null
    accumulatedRef.current = 0
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [workout])

  const addExercise = useCallback(async (exercise: Exercise) => {
    if (!workout) return
    // Don't add duplicates
    if (entries.some(e => e.exercise.id === exercise.id)) return
    const sets = await getSetsForExercise(workout.id, exercise.id)
    setEntries(prev => [...prev, { exercise, sets }])
  }, [workout, entries])

  const logSet = useCallback(async (input: Omit<LogSetInput, 'workoutId'>) => {
    if (!workout) return null
    const set = await logStrengthSet({ ...input, workoutId: workout.id })
    setEntries(prev => prev.map(e =>
      e.exercise.id === input.exerciseId
        ? { ...e, sets: [...e.sets, set] }
        : e
    ))
    return set
  }, [workout])

  const logCardio = useCallback(async (input: Omit<LogCardioInput, 'workoutId'>) => {
    if (!workout) return null
    const set = await logCardioSet({ ...input, workoutId: workout.id })
    setCardioSets(prev => [...prev, set])
    return set
  }, [workout])

  const getGhostSet = useCallback(async (exerciseId: string, setIndex: number) => {
    return getPreviousSet(exerciseId, setIndex)
  }, [])

  const startWod = useCallback(async (input: Omit<CreateWodInput, 'workoutId'>) => {
    if (!workout) return null
    const wod = await createWod({ ...input, workoutId: workout.id })
    setActiveWod(wod)
    return wod
  }, [workout])

  const clearWod = useCallback(() => {
    setActiveWod(null)
  }, [])

  const editSet = useCallback(async (
    setId: string,
    exerciseId: string,
    updates: { weightKg?: number; reps?: number; type?: SetType }
  ) => {
    const updated = await updateStrengthSet(setId, updates)
    setEntries(prev => prev.map(e =>
      e.exercise.id === exerciseId
        ? { ...e, sets: e.sets.map(s => s.id === setId ? updated : s) }
        : e
    ))
    return updated
  }, [])

  const deleteSet = useCallback(async (setId: string, exerciseId: string) => {
    await deleteStrengthSet(setId)
    setEntries(prev => prev.map(e =>
      e.exercise.id === exerciseId
        ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
        : e
    ))
  }, [])

  return {
    workout, entries, elapsed,
    cardioSets, logCardio,
    activeWod, startWod, clearWod,
    startWorkout, endWorkout, cancelWorkout, addExercise, logSet, getGhostSet,
    timerStatus, startTimer, pauseTimer, resumeTimer,
    editSet, deleteSet,
  }
}
