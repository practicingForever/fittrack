import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/features/auth/AuthContext'
import { getStreakData, getContributionData, type StreakData, type ContributionDay } from '@/lib/streak'

// Color for a day cell
function cellColor(count: number): string {
  if (count === 0) return 'bg-zinc-900'
  if (count === 1) return 'bg-zinc-600'
  if (count === 2) return 'bg-zinc-400'
  return 'bg-zinc-100'
}

// Group 112 days into 16 columns of 7 (Mon-Sun)
// days[0] is the oldest. We want a grid where each column is a week.
// Pad the first column so day 0 aligns with the correct weekday.
function buildGrid(days: ContributionDay[]): (ContributionDay | null)[][] {
  // days[0].date is the start; find its weekday (0=Sun..6=Sat → 0=Mon..6=Sun)
  const [y, m, d] = days[0].date.split('-').map(Number)
  const startDate = new Date(y, m - 1, d)
  const startDow = startDate.getDay() // 0=Sun
  // Convert to Mon-based: Mon=0 .. Sun=6
  const offset = (startDow + 6) % 7

  const padded: (ContributionDay | null)[] = [
    ...Array(offset).fill(null),
    ...days,
  ]

  // Chunk into columns of 7
  const cols: (ContributionDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    cols.push(padded.slice(i, i + 7))
  }
  return cols
}

// Month label for a column (first day of the column that is the 1st of its month, or new month)
function monthLabel(col: (ContributionDay | null)[]): string | null {
  for (const day of col) {
    if (!day) continue
    if (day.date.endsWith('-01')) {
      const [, m] = day.date.split('-').map(Number)
      return new Date(2024, m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    }
  }
  return null
}

export default function StreakCard() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [days, setDays] = useState<ContributionDay[]>([])
  const [tooltip, setTooltip] = useState<{ day: ContributionDay; x: number; y: number } | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getStreakData(user.id),
      getContributionData(user.id),
    ]).then(([s, d]) => { setStreak(s); setDays(d) })
  }, [user])

  const grid = days.length ? buildGrid(days) : []

  return (
    <div>
      {/* Streak stats row */}
      <div className="mb-4 flex gap-4">
        {[
          { label: 'Current streak', value: streak?.current ?? 0, unit: 'days' },
          { label: 'Longest streak', value: streak?.longest ?? 0, unit: 'days' },
          { label: 'Total workouts', value: streak?.totalWorkouts ?? 0, unit: '' },
        ].map(stat => (
          <div key={stat.label} className="flex-1 rounded-xl bg-zinc-900 px-3 py-3 text-center">
            <p className="text-2xl font-bold text-zinc-100">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Contribution grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Month labels */}
          <div className="mb-1 flex gap-1">
            {grid.map((col, ci) => {
              const label = monthLabel(col)
              return (
                <div key={ci} className="w-3 text-[8px] text-zinc-600">
                  {label ?? ''}
                </div>
              )
            })}
          </div>

          {/* Day grid (7 rows = Mon-Sun) */}
          <div className="flex gap-1">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.map((day, ri) =>
                  day ? (
                    <button
                      key={day.date}
                      onClick={e => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect()
                        setTooltip(t =>
                          t?.day.date === day.date
                            ? null
                            : { day, x: rect.left, y: rect.top }
                        )
                      }}
                      className={`h-3 w-3 rounded-sm transition-opacity hover:opacity-75 ${cellColor(day.count)}`}
                    />
                  ) : (
                    <div key={`pad-${ci}-${ri}`} className="h-3 w-3" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
            onClick={() => setTooltip(null)}
          >
            {tooltip.day.label} · {tooltip.day.count === 0 ? 'No workout' : `${tooltip.day.count} workout${tooltip.day.count > 1 ? 's' : ''}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
