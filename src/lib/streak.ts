import { db } from './db'

export interface StreakData {
  current: number
  longest: number
  totalWorkouts: number
  activeDays: number
}

export interface ContributionDay {
  date: string        // 'YYYY-MM-DD'
  count: number       // completed workouts
  label: string       // 'Jun 3'
}

function toLocalDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toLocalDate(date.toISOString())
}

export async function getStreakData(userId: string): Promise<StreakData> {
  const workouts = await db.workouts
    .where('user_id').equals(userId)
    .filter(w => w.ended_at != null)
    .toArray()

  const daySet = new Set(workouts.map(w => toLocalDate(w.started_at)))
  const days = Array.from(daySet).sort()

  const today = toLocalDate(new Date().toISOString())

  // Current streak
  let current = 0
  let check = daySet.has(today) ? today : addDays(today, -1)
  while (daySet.has(check)) {
    current++
    check = addDays(check, -1)
  }

  // Longest streak
  let longest = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || addDays(days[i - 1], 1) === days[i]) {
      run++
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
  }

  return {
    current,
    longest,
    totalWorkouts: workouts.length,
    activeDays: daySet.size,
  }
}

export async function getContributionData(userId: string): Promise<ContributionDay[]> {
  const today = toLocalDate(new Date().toISOString())
  const days: ContributionDay[] = []

  // Build 112-day window ending today
  for (let i = 111; i >= 0; i--) {
    const date = addDays(today, -i)
    days.push({ date, count: 0, label: dateLabel(date) })
  }

  const since = days[0].date
  const workouts = await db.workouts
    .where('user_id').equals(userId)
    .filter(w => w.ended_at != null && toLocalDate(w.started_at) >= since)
    .toArray()

  const countByDay = new Map<string, number>()
  for (const w of workouts) {
    const d = toLocalDate(w.started_at)
    countByDay.set(d, (countByDay.get(d) ?? 0) + 1)
  }

  return days.map(d => ({ ...d, count: countByDay.get(d.date) ?? 0 }))
}
