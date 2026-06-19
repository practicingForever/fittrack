import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BottomSheet from '@/components/BottomSheet'
import EditSetSheet from './EditSetSheet'
import { getRecentWorkouts, getAllSetsForWorkout, updateStrengthSet, deleteStrengthSet } from '@/lib/workouts'
import { db } from '@/lib/db'
import type { Workout, StrengthSet, SetType } from '@/lib/types'
import { scoreLabel } from '@/lib/scoring'

interface WorkoutHistorySheetProps {
  open: boolean
  onClose: () => void
  userId: string
}

interface WorkoutWithSets {
  workout: Workout
  setsByExercise: Map<string, { name: string; sets: StrengthSet[] }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatDuration(started: string, ended: string | null) {
  if (!ended) return ''
  const mins = Math.round((new Date(ended).getTime() - new Date(started).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function WorkoutHistorySheet({ open, onClose, userId }: WorkoutHistorySheetProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Map<string, WorkoutWithSets>>(new Map())
  const [editSheet, setEditSheet] = useState<{ open: boolean; set: StrengthSet | null; workoutId: string | null }>({
    open: false, set: null, workoutId: null
  })

  useEffect(() => {
    if (open) {
      getRecentWorkouts(userId).then(setWorkouts)
    }
  }, [open, userId])

  const loadWorkoutDetails = async (workout: Workout) => {
    if (details.has(workout.id)) return
    const sets = await getAllSetsForWorkout(workout.id)
    const byExercise = new Map<string, { name: string; sets: StrengthSet[] }>()
    for (const set of sets) {
      const ex = await db.exercises.get(set.exercise_id)
      const name = ex?.name ?? 'Unknown'
      if (!byExercise.has(set.exercise_id)) {
        byExercise.set(set.exercise_id, { name, sets: [] })
      }
      byExercise.get(set.exercise_id)!.sets.push(set)
    }
    setDetails(prev => new Map(prev).set(workout.id, { workout, setsByExercise: byExercise }))
  }

  const handleExpand = async (workout: Workout) => {
    if (expanded === workout.id) { setExpanded(null); return }
    setExpanded(workout.id)
    await loadWorkoutDetails(workout)
  }

  const handleSave = async (setId: string, updates: { weightKg?: number; reps?: number; type?: SetType }) => {
    const updated = await updateStrengthSet(setId, updates)
    setDetails(prev => {
      const next = new Map(prev)
      for (const [wid, wd] of next) {
        for (const [eid, ed] of wd.setsByExercise) {
          const idx = ed.sets.findIndex(s => s.id === setId)
          if (idx !== -1) {
            const newSets = [...ed.sets]
            newSets[idx] = updated
            const newByEx = new Map(wd.setsByExercise)
            newByEx.set(eid, { ...ed, sets: newSets })
            next.set(wid, { ...wd, setsByExercise: newByEx })
          }
        }
      }
      return next
    })
  }

  const handleDelete = async (setId: string) => {
    await deleteStrengthSet(setId)
    setDetails(prev => {
      const next = new Map(prev)
      for (const [wid, wd] of next) {
        for (const [eid, ed] of wd.setsByExercise) {
          if (ed.sets.some(s => s.id === setId)) {
            const newSets = ed.sets.filter(s => s.id !== setId)
            const newByEx = new Map(wd.setsByExercise)
            newByEx.set(eid, { ...ed, sets: newSets })
            next.set(wid, { ...wd, setsByExercise: newByEx })
          }
        }
      }
      return next
    })
  }

  return (
    <>
      <BottomSheet open={open && !editSheet.open} onClose={onClose} title="Workout history">
        <div className="flex flex-col gap-2">
          {workouts.length === 0 && (
            <p className="text-center text-sm text-zinc-600">No workouts yet</p>
          )}
          {workouts.map(w => {
            const isExpanded = expanded === w.id
            const detail = details.get(w.id)
            return (
              <div key={w.id} className="rounded-xl bg-zinc-900 overflow-hidden">
                <button
                  onClick={() => handleExpand(w)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {w.title || formatDate(w.started_at)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(w.started_at)} · {formatDuration(w.started_at, w.ended_at)}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600">{isExpanded ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                  {isExpanded && detail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-zinc-800"
                    >
                      {Array.from(detail.setsByExercise.values()).map(({ name, sets }) => (
                        <div key={name} className="px-4 py-2">
                          <p className="mb-1 text-xs font-medium text-zinc-400">{name}</p>
                          {sets.map(set => {
                            const { colorClass } = scoreLabel(set.effort_score ?? 50)
                            return (
                              <button
                                key={set.id}
                                onClick={() => setEditSheet({ open: true, set, workoutId: w.id })}
                                className="flex w-full items-center gap-2 py-1.5 text-sm"
                              >
                                <span className="w-5 text-center text-xs text-zinc-600">{set.set_index}</span>
                                <span className="w-16 text-xs capitalize text-zinc-500">{set.type}</span>
                                <span className="flex-1 text-right font-medium text-zinc-100">{set.weight_kg} kg</span>
                                <span className="w-10 text-right text-zinc-300">{set.reps}</span>
                                <span className={`w-8 text-right text-xs font-semibold tabular-nums ${colorClass}`}>
                                  {set.effort_score != null ? Math.round(set.effort_score) : '—'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ))}
                      {detail.setsByExercise.size === 0 && (
                        <p className="px-4 py-3 text-xs text-zinc-600">No sets logged</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </BottomSheet>

      <EditSetSheet
        open={editSheet.open}
        onClose={() => setEditSheet(s => ({ ...s, open: false }))}
        set={editSheet.set}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  )
}
