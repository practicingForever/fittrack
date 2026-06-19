import Dexie, { type Table } from 'dexie'
import type {
  Profile, Connection, MuscleGroup, Exercise,
  Workout, Wod, StrengthSet, CardioSet
} from './types'

export type SyncOp = 'insert' | 'update' | 'delete'

export interface SyncQueueItem {
  id?: number
  op: SyncOp
  table: string
  payload: unknown
  created_at: number // Date.now()
  attempts: number
}

export class FitTrackDB extends Dexie {
  profiles!: Table<Profile, string>
  connections!: Table<Connection, string>
  muscle_groups!: Table<MuscleGroup, string>
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  wods!: Table<Wod, string>
  strength_sets!: Table<StrengthSet, string>
  cardio_sets!: Table<CardioSet, string>
  sync_queue!: Table<SyncQueueItem, number>

  constructor() {
    super('fittrack')
    this.version(1).stores({
      profiles:      'id',
      connections:   'id, user_id, friend_id',
      muscle_groups: 'id, name',
      exercises:     'id, owner_id, category, muscle_group_id, visibility',
      workouts:      'id, user_id, started_at',
      wods:          'id, workout_id',
      strength_sets: 'id, workout_id, exercise_id, wod_id, [exercise_id+set_index]',
      cardio_sets:   'id, workout_id, exercise_id, wod_id, mode',
      sync_queue:    '++id, table, created_at',
    })
  }
}

export const db = new FitTrackDB()
