import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibrary } from './useLibrary'
import AddExerciseSheet from './AddExerciseSheet'
import { getMuscleColor } from '@/lib/muscleColors'
import type { Exercise, MuscleGroup } from '@/lib/types'

const CROSSFIT_GROUPS = new Set(['Olympic lifts', 'Gymnastics', 'Conditioning'])

type StyleFilter = 'all' | 'lifting' | 'crossfit'

const STYLE_TABS: { id: StyleFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'lifting',  label: 'Lifting' },
  { id: 'crossfit', label: 'CrossFit' },
]

function ExerciseRow({ ex, groupName }: { ex: Exercise; groupName?: string }) {
  const color = groupName ? getMuscleColor(groupName) : null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-800">{ex.name}</span>
      {ex.is_unilateral && (
        <span
          className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={color ? { background: color.bg, color: color.text } : { background: '#f1f5f9', color: '#334155' }}
        >
          L/R
        </span>
      )}
    </div>
  )
}

export default function LibraryScreen() {
  const {
    exercises, muscleGroups, loading,
    query, setQuery,
    addExercise, addMuscleGroup,
  } = useLibrary()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [styleFilter, setStyleFilter] = useState<StyleFilter>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')

  // Reset group filter when style changes
  const handleStyleChange = (s: StyleFilter) => {
    setStyleFilter(s)
    setGroupFilter('all')
  }

  // Muscle groups visible for the current style tab
  const visibleGroups = useMemo(() => {
    return muscleGroups.filter(mg => {
      if (styleFilter === 'all') return true
      if (styleFilter === 'crossfit') return CROSSFIT_GROUPS.has(mg.name)
      return !CROSSFIT_GROUPS.has(mg.name)
    })
  }, [muscleGroups, styleFilter])

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    const q = query.toLowerCase().trim()
    return exercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (styleFilter !== 'all') {
        const mg = muscleGroups.find(m => m.id === ex.muscle_group_id)
        if (!mg) return false
        const isCF = CROSSFIT_GROUPS.has(mg.name)
        if (styleFilter === 'crossfit' && !isCF) return false
        if (styleFilter === 'lifting' && isCF) return false
      }
      if (groupFilter !== 'all' && ex.muscle_group_id !== groupFilter) return false
      return true
    })
  }, [exercises, muscleGroups, query, styleFilter, groupFilter])

  // Group exercises by muscle group for the grouped view
  const groupedRows = useMemo(() => {
    if (query.trim()) return null // flat list when searching
    const map = new Map<string, { group: MuscleGroup; exercises: Exercise[] }>()
    for (const mg of visibleGroups) {
      map.set(mg.id, { group: mg, exercises: [] })
    }
    for (const ex of filteredExercises) {
      if (ex.muscle_group_id && map.has(ex.muscle_group_id)) {
        map.get(ex.muscle_group_id)!.exercises.push(ex)
      }
    }
    return [...map.values()]
      .filter(({ exercises }) => exercises.length > 0)
      .map(({ group, exercises }) => ({
        group,
        exercises: exercises.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.group.name.localeCompare(b.group.name))
  }, [filteredExercises, visibleGroups, query])

  const mgMap = useMemo(() => new Map(muscleGroups.map(m => [m.id, m])), [muscleGroups])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-12 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900">Library</h1>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-lg font-medium"
            style={{ background: '#2563eb' }}
          >
            +
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search exercises…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-9 w-full rounded-xl bg-slate-100 pl-8 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        {/* Style segmented control */}
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1 mb-0">
          {STYLE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleStyleChange(t.id)}
              className="relative flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: styleFilter === t.id ? '#fff' : 'transparent',
                color: styleFilter === t.id ? '#1e3a8a' : '#94a3b8',
                boxShadow: styleFilter === t.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Muscle group pill row — slides in when style is not 'all' */}
        <AnimatePresence initial={false}>
          {styleFilter !== 'all' && visibleGroups.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
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
                {visibleGroups.map(mg => {
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <p className="text-sm text-slate-400">No exercises found</p>
            <button onClick={() => setSheetOpen(true)} className="mt-3 text-sm font-medium" style={{ color: '#2563eb' }}>
              Add one
            </button>
          </div>
        ) : query.trim() ? (
          /* Flat search results */
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-100">
            {filteredExercises.map(ex => {
              const mg = ex.muscle_group_id ? mgMap.get(ex.muscle_group_id) : null
              const col = mg ? getMuscleColor(mg.name) : null
              return (
                <div key={ex.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
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
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">L/R</span>
                  )}
                </div>
              )
            })}
          </div>
        ) : groupedRows ? (
          /* Grouped view */
          <div className="flex flex-col gap-3">
            {groupedRows.map(({ group, exercises: exList }) => {
              const col = getMuscleColor(group.name)
              return (
                <GroupSection key={group.id} group={group} exercises={exList} col={col} />
              )
            })}
          </div>
        ) : null}
      </div>

      <AddExerciseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        muscleGroups={muscleGroups}
        onAdd={addExercise}
        onAddMuscleGroup={addMuscleGroup}
      />
    </div>
  )
}

function GroupSection({
  group, exercises, col,
}: {
  group: MuscleGroup
  exercises: Exercise[]
  col: { bg: string; text: string; bar: string }
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: open ? col.bg : 'transparent', background: col.bg + '40' }}
      >
        <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: col.bar }} />
        <span className="flex-1 text-left text-xs font-bold uppercase tracking-wide" style={{ color: col.text }}>
          {group.name}
        </span>
        <span className="text-xs font-semibold" style={{ color: col.bar }}>
          {open ? '▲' : `${exercises.length}`}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {exercises.map(ex => <ExerciseRow key={ex.id} ex={ex} groupName={group.name} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
