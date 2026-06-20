import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { createExercise, createMuscleGroup, type CreateExerciseInput } from '@/lib/exercises'
import { useAuth } from '@/features/auth/AuthContext'
import type { Exercise, MuscleGroup } from '@/lib/types'

export function useLibrary() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Load directly from Supabase, cache to Dexie as side-effect
  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      supabase.from('exercises').select('*'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
    ]).then(([{ data: exData }, { data: mgData }]) => {
      const exs = (exData ?? []) as Exercise[]
      const mgs = (mgData ?? []) as MuscleGroup[]
      setExercises(exs)
      setMuscleGroups(mgs)
      setLoading(false)
      if (exs.length) db.exercises.bulkPut(exs).catch(() => {})
      if (mgs.length) db.muscle_groups.bulkPut(mgs).catch(() => {})
    }).catch(() => {
      Promise.all([
        db.exercises.toCollection().toArray().catch(() => [] as Exercise[]),
        db.muscle_groups.orderBy('sort_order').toArray().catch(() => [] as MuscleGroup[]),
      ]).then(([exs, mgs]) => {
        setExercises(exs)
        setMuscleGroups(mgs)
        setLoading(false)
      })
    })
  }, [user])

  const addExercise = useCallback(async (input: Omit<CreateExerciseInput, 'userId'>) => {
    if (!user) return
    const ex = await createExercise({ ...input, userId: user.id })
    setExercises(prev => [ex, ...prev])
  }, [user])

  const addMuscleGroup = useCallback(async (name: string) => {
    if (!user) return null
    const mg = await createMuscleGroup(name, user.id)
    setMuscleGroups(prev => [...prev, mg])
    return mg
  }, [user])

  return {
    exercises, muscleGroups, loading,
    query, setQuery,
    addExercise, addMuscleGroup,
  }
}
