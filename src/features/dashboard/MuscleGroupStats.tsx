import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { useAuth } from '@/features/auth/AuthContext'
import { getMuscleColor } from '@/lib/muscleColors'
import type { MuscleGroup } from '@/lib/types'

interface GroupVolume {
  group: MuscleGroup
  sets: number
  volume: number
}

export default function MuscleGroupStats() {
  const { user } = useAuth()
  const [rows, setRows] = useState<GroupVolume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [sets, muscleGroups, exercises] = await Promise.all([
        db.strength_sets.where('workout_id').notEqual('').toArray().catch(() => []),
        db.muscle_groups.toArray().catch(() => []),
        db.exercises.toArray().catch(() => []),
      ])

      const exMap = new Map(exercises.map(e => [e.id, e]))
      const mgMap = new Map(muscleGroups.map(m => [m.id, m]))

      const byGroup = new Map<string, { sets: number; volume: number }>()

      for (const s of sets) {
        const ex = exMap.get(s.exercise_id)
        if (!ex?.muscle_group_id) continue
        const cur = byGroup.get(ex.muscle_group_id) ?? { sets: 0, volume: 0 }
        cur.sets += 1
        cur.volume += s.weight_kg * s.reps
        byGroup.set(ex.muscle_group_id, cur)
      }

      const result: GroupVolume[] = []
      for (const [mgId, stats] of byGroup) {
        const group = mgMap.get(mgId)
        if (group) result.push({ group, ...stats })
      }

      result.sort((a, b) => b.volume - a.volume)
      setRows(result)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return (
    <div className="flex justify-center py-4">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
    </div>
  )

  if (rows.length === 0) return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4">
      <h2 className="mb-1 text-sm font-bold text-slate-900">Muscle groups</h2>
      <p className="text-xs text-slate-400">Log some sets to see your breakdown</p>
    </div>
  )

  const maxVolume = rows[0].volume

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4">
      <h2 className="mb-4 text-sm font-bold text-slate-900">Muscle groups</h2>

      {/* Bar chart */}
      <div className="flex flex-col gap-2.5 mb-5">
        {rows.map(({ group, volume }) => {
          const col = getMuscleColor(group.name)
          const pct = maxVolume > 0 ? (volume / maxVolume) * 100 : 0
          return (
            <div key={group.id} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-xs font-medium text-slate-500">{group.name}</span>
              <div className="flex-1 rounded-full bg-slate-100 h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: col.bar }}
                />
              </div>
              <span className="w-14 text-right text-xs text-slate-400">
                {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume} kg
              </span>
            </div>
          )
        })}
      </div>

      {/* Set count chips */}
      <div className="flex flex-wrap gap-2">
        {rows.map(({ group, sets }) => {
          const col = getMuscleColor(group.name)
          return (
            <div
              key={group.id}
              className="flex flex-col items-center rounded-xl px-3 py-2 min-w-[52px]"
              style={{ background: col.bg }}
            >
              <span className="text-sm font-bold" style={{ color: col.bar }}>{sets}</span>
              <span className="text-[9px] font-semibold mt-0.5" style={{ color: col.text }}>{group.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
