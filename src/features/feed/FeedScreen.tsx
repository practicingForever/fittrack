import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { getConnection, loadFeed, type FeedItem } from '@/lib/feed'
import { supabase } from '@/lib/supabase'
import ConnectionGate from './ConnectionGate'
import FeedCard from './FeedCard'
import Leaderboard from './Leaderboard'
import type { Connection } from '@/lib/types'

type FeedTab = 'feed' | 'leaderboard'

export default function FeedScreen() {
  const { user } = useAuth()
  const [connection, setConnection] = useState<Connection | null | undefined>(undefined)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [tab, setTab] = useState<FeedTab>('feed')
  const [loadingFeed, setLoadingFeed] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user) return
    getConnection(user.id).then(setConnection)
  }, [user])

  const partnerId = connection
    ? connection.user_id === user?.id ? connection.friend_id : connection.user_id
    : null

  useEffect(() => {
    if (!user || !partnerId) return
    setLoadingFeed(true)
    loadFeed(user.id, partnerId).then(items => {
      setFeedItems(items)
      setLoadingFeed(false)
    })

    const channel = supabase
      .channel('feed-workouts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workouts',
          filter: `is_shared=eq.true`,
        },
        () => {
          loadFeed(user.id, partnerId).then(setFeedItems)
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { void supabase.removeChannel(channel) }
  }, [user, partnerId])

  if (!user) return null

  if (connection === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-zinc-950 pb-28">
        <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
          <h1 className="text-xl font-semibold text-zinc-100">Feed</h1>
        </div>
        <ConnectionGate onConnected={() => getConnection(user.id).then(setConnection)} />
      </div>
    )
  }

  const segClass = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <h1 className="mb-3 text-xl font-semibold text-zinc-100">Feed</h1>
        <div className="flex gap-1 rounded-xl bg-zinc-900 p-1">
          <button className={segClass(tab === 'feed')} onClick={() => setTab('feed')}>Activity</button>
          <button className={segClass(tab === 'leaderboard')} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        </div>
      </div>

      <div className="px-4 pt-2">
        {tab === 'feed' && (
          <div className="flex flex-col gap-3">
            {loadingFeed && (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
              </div>
            )}
            {!loadingFeed && feedItems.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-600">
                No shared workouts yet — finish a workout to see it here
              </p>
            )}
            {feedItems.map(item => (
              <FeedCard key={item.workout.id} item={item} isMe={item.workout.user_id === user.id} />
            ))}
          </div>
        )}

        {tab === 'leaderboard' && partnerId && (
          <Leaderboard userId={user.id} partnerId={partnerId} />
        )}
      </div>
    </div>
  )
}
