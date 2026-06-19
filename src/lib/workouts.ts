import { db } from './db'
import { enqueueMutation } from './sync'
import type { Workout, StrengthSet, SetType, SetSide } from './types'
import { computeEffortScore } from './scoring'

export async function createWorkout(userId: string, title = ''): Promise<Workout> {
  const now = new Date().toISOString()
  const workout: Workout = {
    id: crypto.randomUUID(),
    user_id: userId,
    title,
    started_at: now,
    ended_at: null,
    planned_duration_min: null,
    session_grade: null,
    session_letter: null,
    notes: null,
    is_shared: true,
    updated_at: now,
  }
  await db.workouts.put(workout)
  await enqueueMutation('insert', 'workouts', workout)
  return workout
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const now = new Date().toISOString()
  await db.workouts.update(workoutId, { ended_at: now, updated_at: now })
  const updated = await db.workouts.get(workoutId)
  if (updated) await enqueueMutation('update', 'workouts', updated)
}

export interface LogSetInput {
  workoutId: string
  exerciseId: string
  setIndex: number
  weightKg: number
  reps: number
  side: SetSide
  type: SetType
  wodId?: string
}

export async function logStrengthSet(input: LogSetInput): Promise<StrengthSet> {
  // Fetch history for effort score
  const historySets = await db.strength_sets
    .where('[exercise_id+set_index]')
    .equals([input.exerciseId, input.setIndex])
    .filter(s => s.type !== 'warmup')
    .toArray()

  // Sort newest first, take last 10
  historySets.sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  const history = historySets.slice(0, 10).map(s => ({
    weight_kg: s.weight_kg,
    reps: s.reps,
  }))

  const { score } = computeEffortScore(input.weightKg, input.reps, input.type, history)

  const now = new Date().toISOString()
  const set: StrengthSet = {
    id: crypto.randomUUID(),
    workout_id: input.workoutId,
    exercise_id: input.exerciseId,
    wod_id: input.wodId ?? null,
    set_index: input.setIndex,
    weight_kg: input.weightKg,
    reps: input.reps,
    side: input.side,
    type: input.type,
    effort_score: score,
    logged_at: now,
    updated_at: now,
  }
  await db.strength_sets.put(set)
  await enqueueMutation('insert', 'strength_sets', set)
  return set
}

/** Get the previous set logged for this exercise at this set index, for ghost text. */
export async function getPreviousSet(exerciseId: string, setIndex: number): Promise<StrengthSet | null> {
  const sets = await db.strength_sets
    .where('[exercise_id+set_index]')
    .equals([exerciseId, setIndex])
    .toArray()
  if (!sets.length) return null
  sets.sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  return sets[0]
}

/** Get all sets for an exercise in the current workout, ordered by set_index. */
export async function getSetsForExercise(workoutId: string, exerciseId: string): Promise<StrengthSet[]> {
  const sets = await db.strength_sets
    .where('workout_id').equals(workoutId)
    .filter(s => s.exercise_id === exerciseId)
    .toArray()
  sets.sort((a, b) => a.set_index - b.set_index)
  return sets
}
