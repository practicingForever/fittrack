import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLibrary, type CategoryFilter, type LibraryFilter } from './useLibrary'
import AddExerciseSheet from './AddExerciseSheet'

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength' },
  { id: 'running', label: 'Running' },
  { id: 'rowing', label: 'Rowing' },
]

const LIBRARY_TABS: { id: LibraryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'Mine' },
  { id: 'shared', label: 'Shared' },
]

export default function LibraryScreen() {
  const {
    exercises, muscleGroups, loading,
    query, setQuery, category, setCategory,
    library, setLibrary,
    addExercise, addMuscleGroup,
  } = useLibrary()

  const [sheetOpen, setSheetOpen] = useState(false)

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

        {/* Category filter */}
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c.id
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Library tab */}
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

      {/* Exercise list */}
      <div className="flex-1 px-4 pt-2">
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
        ) : (
          <ul className="flex flex-col gap-2">
            {exercises.map(ex => (
              <motion.li
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{ex.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 capitalize">
                    {ex.category}{ex.is_unilateral ? ' · unilateral' : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  ex.visibility === 'shared' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {ex.visibility}
                </span>
              </motion.li>
            ))}
          </ul>
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
