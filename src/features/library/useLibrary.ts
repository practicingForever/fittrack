import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { seedLibrary, searchExercises, createExercise, createMuscleGroup, type CreateExerciseInput } from '@/lib/exercises'
import { useAuth } from '@/features/auth/AuthContext'
import type { Exercise, MuscleGroup, ExerciseCat } from '@/lib/types'

export type LibraryFilter = 'all' | 'mine' | 'shared'
export type CategoryFilter = ExerciseCat | 'all'

export function useLibrary() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [library, setLibrary] = useState<LibraryFilter>('all')
  const [loading, setLoading] = useState(true)
  const [seeded, setSeeded] = useState(false)

  // Seed from Supabase first, then mark ready
  useEffect(() => {
    if (!user) return
    seedLibrary()
      .then(() => setSeeded(true))
      .catch(console.error)
  }, [user])

  // Load muscle groups after seed completes
  useEffect(() => {
    if (!seeded) return
    db.muscle_groups.orderBy('sort_order').toArray().then(setMuscleGroups)
  }, [seeded])

  // Reactive search — only after seed completes
  useEffect(() => {
    if (!user || !seeded) return
    searchExercises({ query, category, library, userId: user.id })
      .then(results => { setExercises(results); setLoading(false) })
  }, [query, category, library, user, seeded])

  const addExercise = useCallback(async (input: Omit<CreateExerciseInput, 'userId'>) => {
    if (!user) return
    const ex = await createExercise({ ...input, userId: user.id })
    setExercises(prev => [ex, ...prev])
    // Reload muscle groups in case junction table has new rows
    db.muscle_groups.orderBy('sort_order').toArray().then(setMuscleGroups)
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
