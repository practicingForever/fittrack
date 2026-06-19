import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { FitTrackDB } from './db'

describe('FitTrackDB', () => {
  let testDb: FitTrackDB

  beforeEach(async () => {
    testDb = new FitTrackDB()
    await testDb.open()
  })

  it('can add and retrieve a sync queue item', async () => {
    const id = await testDb.sync_queue.add({
      op: 'insert',
      table: 'workouts',
      payload: { id: 'w1', title: 'Test' },
      created_at: Date.now(),
      attempts: 0,
    })
    const item = await testDb.sync_queue.get(id)
    expect(item?.table).toBe('workouts')
    expect(item?.op).toBe('insert')
  })

  it('can store and retrieve a workout', async () => {
    const now = new Date().toISOString()
    await testDb.workouts.put({
      id: 'w1',
      user_id: 'u1',
      title: 'Push day',
      started_at: now,
      ended_at: null,
      planned_duration_min: null,
      session_grade: null,
      session_letter: null,
      notes: null,
      is_shared: true,
      updated_at: now,
    })
    const w = await testDb.workouts.get('w1')
    expect(w?.title).toBe('Push day')
  })
})
