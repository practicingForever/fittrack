import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import {
  createWorkout, finishWorkout, logStrengthSet,
  getSetsForExercise, getPreviousSet, type LogSetInput
} from '@/lib/workouts'
import type { Workout, StrengthSet, Exercise } from '@/lib/types'

interface ExerciseEntry {
  exercise: Exercise
  sets: StrengthSet[]
}

export function useWorkout() {
  const { user } = useAuth()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [entries, setEntries] = useState<ExerciseEntry[]>([])
  const [elapsed, setElapsed] = useState(0) // seconds

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
  }, [user])

  const endWorkout = useCallback(async () => {
    if (!workout) return
    await finishWorkout(workout.id)
    setWorkout(null)
    setEntries([])
    setElapsed(0)
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

  const getGhostSet = useCallback(async (exerciseId: string, setIndex: number) => {
    return getPreviousSet(exerciseId, setIndex)
  }, [])

  return {
    workout, entries, elapsed,
    startWorkout, endWorkout, addExercise, logSet, getGhostSet,
  }
}
