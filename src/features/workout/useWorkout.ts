import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createWorkout, finishWorkout, logStrengthSet,
  getSetsForExercise, getPreviousSet, type LogSetInput
} from '@/lib/workouts'
import { logCardioSet, type LogCardioInput } from '@/lib/cardio'
import { createWod, type CreateWodInput } from '@/lib/wods'
import type { Workout, StrengthSet, Exercise, CardioSet, Wod } from '@/lib/types'

interface ExerciseEntry {
  exercise: Exercise
  sets: StrengthSet[]
}

export function useWorkout() {
  const { user } = useAuth()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [elapsed, setElapsed] = useState(0) // seconds
  const [cardioSets, setCardioSets] = useState<CardioSet[]>([])
  const [activeWod, setActiveWod] = useState<Wod | null>(null)

  // Timer
  useEffect(() => {
    if (!workout || workout.ended_at) return
    const interval = setInterval(() => {
      const startMs = new Date(workout.started_at).getTime()
      setElapsed(Math.floor((Date.now() - startMs) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [workout])

  const startWorkout = useCallback(async () => {
    if (!user) return
    const w = await createWorkout(user.id)
    setWorkout(w)
    setEntries([])
    setCardioSets([])
    setActiveWod(null)
  }, [user])

  const endWorkout = useCallback(async () => {
    if (!workout) return
    await finishWorkout(workout.id)
    setWorkout(null)
    setEntries([])
    setElapsed(0)
    setCardioSets([])
    setActiveWod(null)
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

  return {
    workout, entries, elapsed,
    cardioSets, logCardio,
    activeWod, startWod, clearWod,
    startWorkout, endWorkout, addExercise, logSet, getGhostSet,
  }
}
