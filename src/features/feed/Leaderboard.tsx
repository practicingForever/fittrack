import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getLeaderboardStats, type LeaderboardStats } from '@/lib/feed'

interface LeaderboardProps {
  userId: string
  partnerId: string
}

type LbTab = 'volume' | 'streak'

export default function Leaderboard({ userId, partnerId }: LeaderboardProps) {
  const [stats, setStats] = useState<LeaderboardStats[]>([])
  const [tab, setTab] = useState<LbTab>('volume')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboardStats(userId, partnerId).then(setStats).finally(() => setLoading(false))
  }, [userId, partnerId])

  const me = stats.find(s => s.userId === userId)
  const them = stats.find(s => s.userId === partnerId)

  const segClass = (active: boolean) =>
    `flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`

  function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    )
  }

  function StatRow({ label, myVal, theirVal, format }: { label: string; myVal: number; theirVal: number; format: (v: number) => string }) {
    const max = Math.max(myVal, theirVal, 1)
    return (
      <div className="mb-4">
        <p className="mb-2 text-xs text-zinc-500">{label}</p>
        <div className="flex items-center gap-3">
          <p className="w-20 shrink-0 text-right text-xs font-semibold text-zinc-100">{format(myVal)}</p>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Bar value={myVal} max={max} color="bg-zinc-400" />
            </div>
            <div className="flex items-center gap-2">
              <Bar value={theirVal} max={max} color="bg-zinc-600" />
            </div>
          </div>
          <p className="w-20 shrink-0 text-xs font-semibold text-zinc-100">{format(theirVal)}</p>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
          <span>{me?.displayName ?? 'You'}</span>
          <span>{them?.displayName ?? 'Partner'}</span>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
    </div>
  )

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-zinc-100">Leaderboard</h2>
      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-800 p-1">
        <button className={segClass(tab === 'volume')} onClick={() => setTab('volume')}>Volume</button>
        <button className={segClass(tab === 'streak')} onClick={() => setTab('streak')}>Streak</button>
      </div>

      {tab === 'volume' && me && them && (
        <div>
          <StatRow
            label="This week (kg)"
            myVal={me.weeklyVolume}
            theirVal={them.weeklyVolume}
            format={v => v.toLocaleString()}
          />
          <StatRow
            label="All time (kg)"
            myVal={me.allTimeVolume}
            theirVal={them.allTimeVolume}
            format={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString()}
          />
        </div>
      )}

      {tab === 'streak' && me && them && (
        <StatRow
          label="Current streak (days)"
          myVal={me.currentStreak}
          theirVal={them.currentStreak}
          format={v => `${v}d`}
        />
      )}

      {(!me || !them) && (
        <p className="text-center text-xs text-zinc-600 py-4">Not enough data yet</p>
      )}
    </div>
  )
}
