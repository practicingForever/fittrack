import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/AuthContext'
import { getMuscleColor } from '@/lib/muscleColors'
import type { Exercise, MuscleGroup } from '@/lib/types'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

export default function ExercisePicker({ open, onClose, onSelect }: ExercisePickerProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Load once when picker opens
  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    Promise.all([
      supabase.from('exercises').select('*'),
      supabase.from('muscle_groups').select('*').order('sort_order'),
    ]).then(([{ data: exData }, { data: mgData }]) => {
      setExercises((exData ?? []) as Exercise[])
      setMuscleGroups((mgData ?? []) as MuscleGroup[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [open, user])

  // Reset on close
  useEffect(() => {
    if (!open) { setQuery(''); setGroupFilter('all') }
  }, [open])

  const mgMap = useMemo(() => new Map(muscleGroups.map(m => [m.id, m])), [muscleGroups])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return exercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (groupFilter !== 'all' && ex.muscle_group_id !== groupFilter) return false
      return true
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, query, groupFilter])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-50"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 pt-12 pb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  autoFocus
                  type="search"
                  placeholder="Search exercises…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-9 w-full rounded-xl bg-slate-100 pl-8 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
              <button onClick={onClose} className="shrink-0 text-sm font-medium text-slate-500">
                Cancel
              </button>
            </div>

            {/* Muscle group pills */}
            {muscleGroups.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
                <button
                  onClick={() => setGroupFilter('all')}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                  style={{
                    background: groupFilter === 'all' ? '#1e293b' : '#f1f5f9',
                    color: groupFilter === 'all' ? '#fff' : '#64748b',
                  }}
                >
                  All
                </button>
                {muscleGroups.map(mg => {
                  const col = getMuscleColor(mg.name)
                  const active = groupFilter === mg.id
                  return (
                    <button
                      key={mg.id}
                      onClick={() => setGroupFilter(active ? 'all' : mg.id)}
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                      style={{
                        background: active ? col.bar : col.bg,
                        color: active ? '#fff' : col.text,
                      }}
                    >
                      {mg.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
            {loading ? (
              <div className="flex justify-center pt-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="pt-12 text-center text-sm text-slate-400">No exercises found</p>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white border border-slate-100">
                {filtered.map(ex => {
                  const mg = ex.muscle_group_id ? mgMap.get(ex.muscle_group_id) : null
                  const col = mg ? getMuscleColor(mg.name) : null
                  return (
                    <button
                      key={ex.id}
                      onClick={() => { onSelect(ex); onClose() }}
                      className="flex w-full items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-0 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{ex.name}</p>
                        {mg && (
                          <span
                            className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: col!.bg, color: col!.text }}
                          >
                            {mg.name}
                          </span>
                        )}
                      </div>
                      {ex.is_unilateral && (
                        <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">L/R</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
