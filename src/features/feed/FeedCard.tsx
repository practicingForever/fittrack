import { motion } from 'framer-motion'
import type { FeedItem } from '@/lib/feed'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'just now'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

function gradeColor(letter: string | null): string {
  if (!letter) return 'text-zinc-600'
  if (letter.startsWith('A')) return 'text-emerald-400'
  if (letter.startsWith('B')) return 'text-green-400'
  if (letter.startsWith('C')) return 'text-yellow-400'
  return 'text-zinc-500'
}

interface FeedCardProps {
  item: FeedItem
  isMe: boolean
}

export default function FeedCard({ item, isMe }: FeedCardProps) {
  const { workout, profile, setCount, cardioCount } = item
  const name = profile.display_name || 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-zinc-900 p-4"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isMe ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-300'}`}>
          {initials(name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-zinc-100 truncate">{name}</p>
            <span className="shrink-0 text-xs text-zinc-600">{timeAgo(workout.started_at)}</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 truncate">
            {workout.title || 'Workout'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4">
        {setCount > 0 && (
          <span className="text-xs text-zinc-500">{setCount} sets</span>
        )}
        {cardioCount > 0 && (
          <span className="text-xs text-zinc-500">{cardioCount} cardio</span>
        )}
        {workout.session_letter && (
          <span className={`ml-auto text-lg font-bold ${gradeColor(workout.session_letter)}`}>
            {workout.session_letter}
          </span>
        )}
        {workout.session_grade != null && (
          <span className="text-sm text-zinc-500">{Math.round(workout.session_grade)}</span>
        )}
      </div>
    </motion.div>
  )
}
