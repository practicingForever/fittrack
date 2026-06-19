import { db } from './db'
import type { StrengthSet, CardioSet } from './types'

export interface ExerciseDataPoint {
  date: string          // 'MMM d' e.g. 'Jun 3'
  volume: number        // weight_kg * reps (working sets only)
  effortScore: number   // mean effort_score of working sets that day
  maxWeight: number     // heaviest single working set
  reps: number          // total reps
}

export interface VolumePoint {
  week: string          // 'Jun 2' (Monday of that week)
  totalVolume: number   // sum weight_kg*reps across all exercises
  sessions: number
}

export interface CardioPoint {
  date: string
  pace: number          // sec/km for running, sec/500m for rowing
  distance: number
  mode: 'running' | 'rowing'
}

function toLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function mondayOfWeek(iso: string): string {
  const d = new Date(iso)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Effort + volume progression for one exercise over last N days. */
export async function getExerciseProgress(
  exerciseId: string,
  userId: string,
  days = 90
): Promise<ExerciseDataPoint[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString()

  const userWorkouts = await db.workouts
    .where('user_id').equals(userId)
    .filter(w => w.started_at >= since)
    .toArray()
  const workoutIds = new Set(userWorkouts.map(w => w.id))

  const sets = await db.strength_sets
    .where('exercise_id').equals(exerciseId)
    .filter((s: StrengthSet) => s.type !== 'warmup' && workoutIds.has(s.workout_id))
    .toArray()

  const byDate = new Map<string, StrengthSet[]>()
  for (const s of sets) {
    const label = toLabel(s.logged_at)
    if (!byDate.has(label)) byDate.set(label, [])
    byDate.get(label)!.push(s)
  }

  return Array.from(byDate.entries())
    .map(([date, daySets]) => {
      const volumes = daySets.map(s => s.weight_kg * s.reps)
      const scores = daySets.map(s => s.effort_score ?? 50)
      return {
        date,
        volume: Math.round(volumes.reduce((a, b) => a + b, 0)),
        effortScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        maxWeight: Math.max(...daySets.map(s => s.weight_kg)),
        reps: daySets.reduce((a, s) => a + s.reps, 0),
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

/** Weekly volume totals for the last N weeks. */
export async function getWeeklyVolume(userId: string, weeks = 12): Promise<VolumePoint[]> {
  const since = new Date(Date.now() - weeks * 7 * 86400_000).toISOString()

  const userWorkouts = await db.workouts
    .where('user_id').equals(userId)
    .filter(w => w.started_at >= since)
    .toArray()
  const workoutIds = new Set(userWorkouts.map(w => w.id))
  const workoutDateMap = new Map(userWorkouts.map(w => [w.id, w.started_at]))

  const sets = await db.strength_sets
    .filter((s: StrengthSet) => s.type !== 'warmup' && workoutIds.has(s.workout_id))
    .toArray()

  const byWeek = new Map<string, { volume: number; sessions: Set<string> }>()
  for (const s of sets) {
    const wDate = workoutDateMap.get(s.workout_id) ?? s.logged_at
    const week = mondayOfWeek(wDate)
    if (!byWeek.has(week)) byWeek.set(week, { volume: 0, sessions: new Set() })
    const entry = byWeek.get(week)!
    entry.volume += s.weight_kg * s.reps
    entry.sessions.add(s.workout_id)
  }

  return Array.from(byWeek.entries())
    .map(([week, { volume, sessions }]) => ({
      week,
      totalVolume: Math.round(volume),
      sessions: sessions.size,
    }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
}

/** Cardio pace trend for running or rowing over last N days. */
export async function getCardioTrend(
  userId: string,
  mode: 'running' | 'rowing',
  days = 60
): Promise<CardioPoint[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString()

  const userWorkouts = await db.workouts
    .where('user_id').equals(userId)
    .filter(w => w.started_at >= since)
    .toArray()
  const workoutIds = new Set(userWorkouts.map(w => w.id))

  const sets = await db.cardio_sets
    .where('mode').equals(mode)
    .filter((s: CardioSet) => workoutIds.has(s.workout_id))
    .toArray()

  return sets
    .filter((s: CardioSet) => (mode === 'running' ? s.pace_sec_per_unit : s.split_sec_per_500) != null)
    .map((s: CardioSet) => ({
      date: toLabel(s.logged_at),
      pace: mode === 'running' ? s.pace_sec_per_unit! : s.split_sec_per_500!,
      distance: s.distance ?? 0,
      mode,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
