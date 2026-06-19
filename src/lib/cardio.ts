import { db } from './db'
import { enqueueMutation } from './sync'
import type { CardioSet } from './types'

export interface LogCardioInput {
  workoutId: string
  exerciseId?: string
  wodId?: string
  mode: 'running' | 'rowing'
  // running
  distanceKm?: number
  durationSec?: number
  routeNotes?: string
  // rowing
  distanceMeters?: number
  strokeRate?: number
}

function computePaceSec(distanceKm: number, durationSec: number): number {
  // seconds per km
  return durationSec / distanceKm
}

function computeSplitSec(distanceMeters: number, durationSec: number): number {
  // seconds per 500m
  return (durationSec / distanceMeters) * 500
}

export async function logCardioSet(input: LogCardioInput): Promise<CardioSet> {
  const now = new Date().toISOString()

  let pace_sec_per_unit: number | null = null
  let split_sec_per_500: number | null = null
  let distance: number | null = null
  let distance_unit: string | null = null

  if (input.mode === 'running' && input.distanceKm && input.durationSec) {
    distance = input.distanceKm
    distance_unit = 'km'
    pace_sec_per_unit = computePaceSec(input.distanceKm, input.durationSec)
  }
  if (input.mode === 'rowing' && input.distanceMeters && input.durationSec) {
    distance = input.distanceMeters
    distance_unit = 'm'
    split_sec_per_500 = computeSplitSec(input.distanceMeters, input.durationSec)
  }

  const set: CardioSet = {
    id: crypto.randomUUID(),
    workout_id: input.workoutId,
    exercise_id: input.exerciseId ?? null,
    wod_id: input.wodId ?? null,
    mode: input.mode,
    distance,
    distance_unit,
    duration_sec: input.durationSec ?? null,
    pace_sec_per_unit,
    route_notes: input.routeNotes ?? null,
    split_sec_per_500,
    stroke_rate: input.strokeRate ?? null,
    effort_score: null,
    logged_at: now,
    updated_at: now,
  }

  await db.cardio_sets.put(set)
  await enqueueMutation('insert', 'cardio_sets', set)
  return set
}

/** Format seconds as m:ss pace string */
export function formatPace(secPerUnit: number): string {
  const m = Math.floor(secPerUnit / 60)
  const s = Math.round(secPerUnit % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format duration seconds as h:mm:ss or m:ss */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
