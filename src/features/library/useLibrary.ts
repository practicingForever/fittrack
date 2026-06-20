import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { createExercise, createMuscleGroup, type CreateExerciseInput } from '@/lib/exercises'
import { useAuth } from '@/features/auth/AuthContext'
import type { Exercise, MuscleGroup, ExerciseCat } from '@/lib/types'

export type LibraryFilter = 'all' | 'mine' | 'shared'
export type CategoryFilter = ExerciseCat | 'all'

export function useLibrary() {
  const { user } = useAuth()
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [library, setLibrary] = useState<LibraryFilter>('all')
  const [loading, setLoading] = useState(true)

  // Load directly from Supabase on mount, cache to Dexie as side-effect
  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      supabase.from('exercises').select('*'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
    ]).then(([{ data: exData }, { data: mgData }]) => {
      const exs = (exData ?? []) as Exercise[]
      const mgs = (mgData ?? []) as MuscleGroup[]

      setAllExercises(exs)
      setMuscleGroups(mgs)
      setLoading(false)

      // Cache to Dexie for offline use (non-blocking)
      if (exs.length) db.exercises.bulkPut(exs).catch(() => {})
      if (mgs.length) db.muscle_groups.bulkPut(mgs).catch(() => {})
    }).catch(() => {
      // Supabase failed — fall back to Dexie
      Promise.all([
        db.exercises.toCollection().toArray().catch(() => [] as Exercise[]),
        db.muscle_groups.orderBy('sort_order').toArray().catch(() => [] as MuscleGroup[]),
      ]).then(([exs, mgs]) => {
        setAllExercises(exs)
        setMuscleGroups(mgs)
        setLoading(false)
      })
    })
  }, [user])

  // Filter exercises whenever source data or filters change
  useEffect(() => {
    const q = query.toLowerCase().trim()
    const filtered = allExercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (category !== 'all' && ex.category !== category) return false
      if (library === 'mine' && ex.owner_id !== user?.id) return false
      if (library === 'shared' && ex.visibility !== 'shared') return false
      return true
    })
    setExercises(filtered)
  }, [allExercises, query, category, library, user])

  const addExercise = useCallback(async (input: Omit<CreateExerciseInput, 'userId'>) => {
    if (!user) return
    const ex = await createExercise({ ...input, userId: user.id })
    setAllExercises(prev => [ex, ...prev])
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
    category, setCategory,
    library, setLibrary,
    addExercise, addMuscleGroup,
  }
}
