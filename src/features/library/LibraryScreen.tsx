import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibrary, type LibraryFilter } from './useLibrary'
import AddExerciseSheet from './AddExerciseSheet'
import type { Exercise, MuscleGroup } from '@/lib/types'

// Which muscle groups belong to each style
const CROSSFIT_GROUPS = new Set(['Olympic lifts', 'Gymnastics', 'Conditioning'])

const LIBRARY_TABS: { id: LibraryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'shared', label: 'Shared' },
]

interface GroupedExercises {
  style: string
  groups: { group: MuscleGroup; exercises: Exercise[] }[]
}

function buildGroups(exercises: Exercise[], muscleGroups: MuscleGroup[]): GroupedExercises[] {
  // Group exercises by muscle_group_id
  const byGroup = new Map<string, Exercise[]>()
  const ungrouped: Exercise[] = []

  for (const ex of exercises) {
    if (ex.muscle_group_id) {
      const list = byGroup.get(ex.muscle_group_id) ?? []
      list.push(ex)
      byGroup.set(ex.muscle_group_id, list)
    } else {
      ungrouped.push(ex)
    }
  }

  // Sort exercises within each group alphabetically
  for (const list of byGroup.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const bbGroups: { group: MuscleGroup; exercises: Exercise[] }[] = []
  const cfGroups: { group: MuscleGroup; exercises: Exercise[] }[] = []

  // Sort muscle groups alphabetically within each style
  const sortedGroups = [...muscleGroups].sort((a, b) => a.name.localeCompare(b.name))

  for (const mg of sortedGroups) {
    const exList = byGroup.get(mg.id)
    if (!exList?.length) continue
    const entry = { group: mg, exercises: exList }
    if (CROSSFIT_GROUPS.has(mg.name)) {
      cfGroups.push(entry)
    } else {
      bbGroups.push(entry)
    }
  }

  const result: GroupedExercises[] = []
  if (bbGroups.length) result.push({ style: 'Bodybuilding', groups: bbGroups })
  if (cfGroups.length) result.push({ style: 'CrossFit', groups: cfGroups })

  // Any ungrouped at the end
  if (ungrouped.length) {
    const fakeGroup: MuscleGroup = { id: '__ungrouped__', name: 'Other', is_preset: false, created_by: null, sort_order: 999, created_at: '' }
    result.push({ style: 'Other', groups: [{ group: fakeGroup, exercises: ungrouped.sort((a, b) => a.name.localeCompare(b.name)) }] })
  }

  return result
}

function ExerciseRow({ ex }: { ex: Exercise }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-zinc-100">{ex.name}</p>
        {ex.is_unilateral && (
          <p className="mt-0.5 text-xs text-zinc-600">Unilateral</p>
        )}
      </div>
    </div>
  )
}

function MuscleGroupSection({ group, exercises }: { group: MuscleGroup; exercises: Exercise[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-2 overflow-hidden rounded-2xl">
      {/* Header — distinct background + accent bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between bg-zinc-800 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-zinc-500" />
          <p className="text-sm font-bold uppercase tracking-wide text-zinc-200">{group.name}</p>
        </div>
        <span className="text-xs text-zinc-500">
          {open ? '▲' : `${exercises.length} exercises`}
        </span>
      </button>
      {/* Exercises — darker bg to contrast with header */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-zinc-900"
          >
            {exercises.map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LibraryScreen() {
  const {
    exercises, muscleGroups, loading,
    query, setQuery,
    library, setLibrary,
    addExercise, addMuscleGroup,
  } = useLibrary()

  const [sheetOpen, setSheetOpen] = useState(false)

  const isSearching = query.trim().length > 0
  const grouped = buildGroups(exercises, muscleGroups)
  const mgMap = new Map(muscleGroups.map(mg => [mg.id, mg]))

  // Flat sorted list for search results
  const flatResults = [...exercises].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-100">Library</h1>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-lg text-zinc-100"
          >
            +
          </button>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search exercises…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="mb-3 h-10 w-full rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
        />

        {/* All / Mine / Shared */}
        <div className="flex gap-1 rounded-xl bg-zinc-900 p-1">
          {LIBRARY_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setLibrary(t.id)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                library === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-3">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center pt-16 text-center">
            <p className="text-sm text-zinc-500">No exercises found</p>
            <button onClick={() => setSheetOpen(true)} className="mt-3 text-sm text-zinc-400 underline">
              Add one
            </button>
          </div>
        ) : isSearching ? (
          /* Flat list while searching */
          <div className="rounded-2xl bg-zinc-900 overflow-hidden">
            {flatResults.map(ex => {
              const mg = ex.muscle_group_id ? mgMap.get(ex.muscle_group_id) : null
              return (
                <div key={ex.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{ex.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {mg?.name ?? ex.category}{ex.is_unilateral ? ' · Unilateral' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Grouped view */
          grouped.map(({ style, groups }) => (
            <div key={style} className="mb-4">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                {style}
              </p>
              {groups.map(({ group, exercises: exList }) => (
                <MuscleGroupSection key={group.id} group={group} exercises={exList} />
              ))}
            </div>
          ))
        )}
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
