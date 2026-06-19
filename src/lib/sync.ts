import { supabase } from './supabase'
import { db, type SyncOp, type SyncQueueItem } from './db'

export async function enqueueMutation(
  op: SyncOp,
  table: string,
  payload: unknown
): Promise<void> {
  await db.sync_queue.add({ op, table, payload, created_at: Date.now(), attempts: 0 })
}

async function sendItem(item: SyncQueueItem): Promise<boolean> {
  try {
    if (item.op === 'insert') {
      const { error } = await supabase.from(item.table as never).insert(item.payload as never)
      if (error) throw error
    } else if (item.op === 'update') {
      const row = item.payload as Record<string, unknown>
      const { error } = await supabase.from(item.table as never).upsert(row as never)
      if (error) throw error
    } else if (item.op === 'delete') {
      const row = item.payload as { id: string }
      const { error } = await supabase.from(item.table as never).delete().eq('id', row.id)
      if (error) throw error
    }
    return true
  } catch {
    return false
  }
}

export async function flushSyncQueue(): Promise<void> {
  const items = await db.sync_queue.orderBy('created_at').toArray()
  for (const item of items) {
    const ok = await sendItem(item)
    if (ok) {
      await db.sync_queue.delete(item.id!)
    } else {
      await db.sync_queue.update(item.id!, { attempts: item.attempts + 1 })
    }
  }
}

export function initSync(): () => void {
  const flush = () => { void flushSyncQueue() }
  window.addEventListener('online', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flush()
  })
  // Flush immediately if we're already online
  if (navigator.onLine) flush()

  return () => {
    window.removeEventListener('online', flush)
  }
}
