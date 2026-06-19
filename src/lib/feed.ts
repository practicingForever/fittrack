import { supabase } from './supabase'
import type { Workout, Profile, Connection } from './types'

export interface FeedItem {
  workout: Workout
  profile: Profile
  setCount: number
  cardioCount: number
}

/** Fetch accepted connection for current user (as either user_id or friend_id). */
export async function getConnection(userId: string): Promise<Connection | null> {
  const { data } = await supabase
    .from('connections' as never)
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')
    .maybeSingle()
  return (data as Connection | null)
}

export async function getPendingConnections(userId: string): Promise<Connection[]> {
  const { data } = await supabase
    .from('connections' as never)
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'pending')
  return (data ?? []) as Connection[]
}

export async function sendConnectionRequest(fromUserId: string, toEmail: string): Promise<{ error: string | null }> {
  const { data: profilesRaw } = await supabase.from('profiles' as never).select('id, display_name')
  const profiles = (profilesRaw ?? []) as { id: string; display_name: string }[]

  const match = profiles.find((p) =>
    p.display_name.toLowerCase().includes(toEmail.toLowerCase()) && p.id !== fromUserId
  )

  if (!match) return { error: 'User not found. Ask your partner for their display name.' }

  const { error } = await supabase.from('connections' as never).insert({
    id: crypto.randomUUID(),
    user_id: fromUserId,
    friend_id: match.id,
    status: 'pending',
  } as never)

  return { error: (error as { message?: string } | null)?.message ?? null }
}

export async function acceptConnection(connectionId: string): Promise<void> {
  await supabase.from('connections' as never).update({ status: 'accepted' } as never).eq('id', connectionId)
}

/** Load recent shared workouts for feed (own + partner's). */
export async function loadFeed(userId: string, partnerId: string): Promise<FeedItem[]> {
  const { data: workoutsRaw } = await supabase
    .from('workouts' as never)
    .select('*')
    .in('user_id', [userId, partnerId])
    .eq('is_shared', true)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .limit(30)
  const workouts = (workoutsRaw ?? []) as Workout[]

  if (!workouts.length) return []

  const { data: profilesRaw } = await supabase
    .from('profiles' as never)
    .select('*')
    .in('id', [userId, partnerId])
  const profiles = (profilesRaw ?? []) as Profile[]

  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  const workoutIds = workouts.map((w) => w.id)
  const { data: strengthSetsRaw } = await supabase
    .from('strength_sets' as never)
    .select('workout_id')
    .in('workout_id', workoutIds)
  const strengthSets = (strengthSetsRaw ?? []) as { workout_id: string }[]

  const { data: cardioSetsRaw } = await supabase
    .from('cardio_sets' as never)
    .select('workout_id')
    .in('workout_id', workoutIds)
  const cardioSets = (cardioSetsRaw ?? []) as { workout_id: string }[]

  const strengthCount = new Map<string, number>()
  const cardioCountMap = new Map<string, number>()

  for (const s of strengthSets) {
    strengthCount.set(s.workout_id, (strengthCount.get(s.workout_id) ?? 0) + 1)
  }
  for (const s of cardioSets) {
    cardioCountMap.set(s.workout_id, (cardioCountMap.get(s.workout_id) ?? 0) + 1)
  }

  const fallbackProfile = (id: string): Profile => ({
    id,
    display_name: 'Unknown',
    unit_pref: 'kg',
    pace_pref: 'km',
    created_at: '',
    updated_at: '',
  })

  return workouts.map((w) => ({
    workout: w,
    profile: profileMap.get(w.user_id) ?? fallbackProfile(w.user_id),
    setCount: strengthCount.get(w.id) ?? 0,
    cardioCount: cardioCountMap.get(w.id) ?? 0,
  }))
}

export interface LeaderboardStats {
  userId: string
  displayName: string
  weeklyVolume: number
  allTimeVolume: number
  currentStreak: number
}

export async function getLeaderboardStats(userId: string, partnerId: string): Promise<LeaderboardStats[]> {
  const { data: setsRaw } = await supabase
    .from('strength_sets' as never)
    .select('workout_id, weight_kg, reps, type')
    .neq('type', 'warmup')
  const sets = (setsRaw ?? []) as { workout_id: string; weight_kg: number; reps: number; type: string }[]

  const { data: workoutsRaw } = await supabase
    .from('workouts' as never)
    .select('id, user_id, started_at')
    .in('user_id', [userId, partnerId])
    .not('ended_at', 'is', null)
  const workouts = (workoutsRaw ?? []) as { id: string; user_id: string; started_at: string }[]

  const { data: profilesRaw } = await supabase
    .from('profiles' as never)
    .select('id, display_name')
    .in('id', [userId, partnerId])
  const profiles = (profilesRaw ?? []) as { id: string; display_name: string }[]

  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))
  const workoutMap = new Map(workouts.map((w) => [w.id, w]))

  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()

  const stats = new Map<string, { allTime: number; weekly: number; sessions: Set<string> }>()
  for (const uid of [userId, partnerId]) {
    stats.set(uid, { allTime: 0, weekly: 0, sessions: new Set() })
  }

  for (const s of sets) {
    const w = workoutMap.get(s.workout_id)
    if (!w) continue
    const uid = w.user_id
    if (!stats.has(uid)) continue
    const vol = s.weight_kg * s.reps
    const entry = stats.get(uid)!
    entry.allTime += vol
    entry.sessions.add(w.id)
    if (w.started_at >= weekAgo) entry.weekly += vol
  }

  const daysByUser = new Map<string, Set<string>>()
  for (const w of workouts) {
    if (!daysByUser.has(w.user_id)) daysByUser.set(w.user_id, new Set())
    const d = new Date(w.started_at)
    const ymd = toYmd(d)
    daysByUser.get(w.user_id)!.add(ymd)
  }

  function toYmd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function currentStreak(daySet: Set<string>): number {
    let streak = 0
    const d = new Date()
    if (!daySet.has(toYmd(d))) d.setDate(d.getDate() - 1)
    while (daySet.has(toYmd(d))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  return [userId, partnerId].map((uid) => ({
    userId: uid,
    displayName: profileMap.get(uid) ?? 'Unknown',
    weeklyVolume: Math.round(stats.get(uid)?.weekly ?? 0),
    allTimeVolume: Math.round(stats.get(uid)?.allTime ?? 0),
    currentStreak: currentStreak(daysByUser.get(uid) ?? new Set()),
  }))
}
