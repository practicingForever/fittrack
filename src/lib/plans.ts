import { db } from './db'
import type { WorkoutPlan, PlanExercise, Exercise } from './types'

export async function createPlan(name: string): Promise<WorkoutPlan> {
  const now = new Date().toISOString()
  const plan: WorkoutPlan = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled plan',
    created_at: now,
    updated_at: now,
  }
  await db.workout_plans.put(plan)
  return plan
}

export async function updatePlanName(planId: string, name: string): Promise<void> {
  await db.workout_plans.update(planId, { name: name.trim(), updated_at: new Date().toISOString() })
}

export async function deletePlan(planId: string): Promise<void> {
  await db.plan_exercises.where('plan_id').equals(planId).delete()
  await db.workout_plans.delete(planId)
}

export async function addExerciseToPlan(
  planId: string,
  exercise: Exercise,
  targetSets = 3,
  targetReps: number | null = null,
  targetWeightKg: number | null = null
): Promise<PlanExercise> {
  const existing = await db.plan_exercises.where('plan_id').equals(planId).toArray()
  const pe: PlanExercise = {
    id: crypto.randomUUID(),
    plan_id: planId,
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    order_index: existing.length,
    target_sets: targetSets,
    target_reps: targetReps,
    target_weight_kg: targetWeightKg,
  }
  await db.plan_exercises.put(pe)
  return pe
}

export async function updatePlanExercise(
  peId: string,
  updates: Partial<Pick<PlanExercise, 'target_sets' | 'target_reps' | 'target_weight_kg'>>
): Promise<void> {
  await db.plan_exercises.update(peId, updates)
}

export async function removeExerciseFromPlan(peId: string): Promise<void> {
  await db.plan_exercises.delete(peId)
}

export async function getPlans(): Promise<WorkoutPlan[]> {
  return db.workout_plans.orderBy('updated_at').reverse().toArray()
}

export async function getPlanExercises(planId: string): Promise<PlanExercise[]> {
  const items = await db.plan_exercises.where('plan_id').equals(planId).toArray()
  return items.sort((a, b) => a.order_index - b.order_index)
}

/** Touch updated_at so this plan floats to top of recents. */
export async function touchPlan(planId: string): Promise<void> {
  await db.workout_plans.update(planId, { updated_at: new Date().toISOString() })
}
