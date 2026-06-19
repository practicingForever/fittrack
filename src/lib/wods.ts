import { db } from './db'
import { enqueueMutation } from './sync'
import type { Wod, WodType } from './types'

export interface CreateWodInput {
  workoutId: string
  type: WodType
  title?: string
  totalSeconds?: number
  intervalSeconds?: number
  workSeconds?: number
  restSeconds?: number
  rounds?: number
}

export async function createWod(input: CreateWodInput): Promise<Wod> {
  const now = new Date().toISOString()
  const wod: Wod = {
    id: crypto.randomUUID(),
    workout_id: input.workoutId,
    type: input.type,
    title: input.title ?? '',
    total_seconds: input.totalSeconds ?? null,
    interval_seconds: input.intervalSeconds ?? null,
    work_seconds: input.workSeconds ?? null,
    rest_seconds: input.restSeconds ?? null,
    rounds: input.rounds ?? null,
    result_seconds: null,
    result_rounds: null,
    notes: null,
    created_at: now,
    updated_at: now,
  }
  await db.wods.put(wod)
  await enqueueMutation('insert', 'wods', wod)
  return wod
}

export async function saveWodResult(
  wodId: string,
  result: { result_seconds?: number; result_rounds?: number; notes?: string }
): Promise<void> {
  const now = new Date().toISOString()
  await db.wods.update(wodId, { ...result, updated_at: now })
  const updated = await db.wods.get(wodId)
  if (updated) await enqueueMutation('update', 'wods', updated)
}
