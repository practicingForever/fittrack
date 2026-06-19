import { db } from './db'
import { supabase } from './supabase'
import { enqueueMutation } from './sync'
import type { Exercise, ExerciseMuscleGroup, MuscleGroup, ExerciseCat, ExerciseVisibility } from './types'

/** Seed local Dexie with exercises + muscle groups + junction rows from Supabase. */
export async function seedLibrary(): Promise<void> {
  const [{ data: exercises }, { data: groups }, { data: emg }] = await Promise.all([
    supabase.from('exercises').select('*'),
    supabase.from('muscle_groups').select('*').order('sort_order'),
    supabase.from('exercise_muscle_groups').select('*'),
  ])
  if (exercises?.length) {
    await db.exercises.bulkPut(exercises as unknown as Exercise[])
  }
  if (groups?.length) {
    await db.muscle_groups.bulkPut(groups as unknown as MuscleGroup[])
  }
  if (emg?.length) {
    await db.exercise_muscle_groups.bulkPut(emg as unknown as ExerciseMuscleGroup[])
  }
}

/** Returns all muscle group IDs associated with an exercise. */
export async function getExerciseMuscleGroupIds(exerciseId: string): Promise<string[]> {
  const rows = await db.exercise_muscle_groups.where('exercise_id').equals(exerciseId).toArray()
  return rows.map(r => r.muscle_group_id)
}

export interface ExerciseFilters {
  query: string
  category: ExerciseCat | 'all'
  library: 'mine' | 'shared' | 'all'
  userId: string
}

/** Search exercises locally in Dexie. */
export async function searchExercises(filters: ExerciseFilters): Promise<Exercise[]> {
  const collection = db.exercises.toCollection()

  const all = await collection.toArray()
  const q = filters.query.toLowerCase().trim()

  return all.filter(ex => {
    if (q && !ex.name.toLowerCase().includes(q)) return false
    if (filters.category !== 'all' && ex.category !== filters.category) return false
    if (filters.library === 'mine' && ex.owner_id !== filters.userId) return false
    if (filters.library === 'shared' && ex.visibility !== 'shared') return false
    return true
  })
}

export interface CreateExerciseInput {
  name: string
  category: ExerciseCat
  muscleGroupIds: string[]   // first entry = primary (muscle_group_id)
  isUnilateral: boolean
  visibility: ExerciseVisibility
  userId: string
}

export async function createExercise(input: CreateExerciseInput): Promise<Exercise> {
  const now = new Date().toISOString()
  const primaryId = input.muscleGroupIds[0] ?? null
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    owner_id: input.userId,
    name: input.name.trim(),
    category: input.category,
    muscle_group_id: primaryId,
    is_unilateral: input.isUnilateral,
    visibility: input.visibility,
    created_at: now,
    updated_at: now,
  }
  await db.exercises.put(exercise)
  await enqueueMutation('insert', 'exercises', exercise)

  // Write junction rows for all selected muscle groups
  for (const mgId of input.muscleGroupIds) {
    const row: ExerciseMuscleGroup = { exercise_id: exercise.id, muscle_group_id: mgId }
    await db.exercise_muscle_groups.put(row)
    await enqueueMutation('insert', 'exercise_muscle_groups', row)
  }

  return exercise
}

export async function createMuscleGroup(name: string, userId: string): Promise<MuscleGroup> {
  const now = new Date().toISOString()
  const group: MuscleGroup = {
    id: crypto.randomUUID(),
    name: name.trim(),
    is_preset: false,
    created_by: userId,
    sort_order: 100,
    created_at: now,
  }
  await db.muscle_groups.put(group)
  await enqueueMutation('insert', 'muscle_groups', group)
  return group
}
