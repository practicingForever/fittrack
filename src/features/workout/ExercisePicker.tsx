import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchExercises } from '@/lib/exercises'
import { useAuth } from '@/features/auth/AuthContext'
import type { Exercise } from '@/lib/types'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

export default function ExercisePicker({ open, onClose, onSelect }: ExercisePickerProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])

  useEffect(() => {
    if (!user || !open) return
    searchExercises({ query, category: 'all', library: 'all', userId: user.id })
      .then(setResults)
  }, [query, user, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-50 flex flex-col bg-zinc-950"
        >
          <div className="flex items-center gap-3 px-4 pt-12 pb-3">
            <input
              autoFocus
              type="search"
              placeholder="Search exercises…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-11 flex-1 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
            <button onClick={onClose} className="shrink-0 text-sm text-zinc-500">
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {results.map(ex => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); onClose() }}
                className="flex w-full items-center gap-3 border-b border-zinc-900 py-3.5 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{ex.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 capitalize">{ex.category}</p>
                </div>
              </button>
            ))}
            {results.length === 0 && (
              <p className="pt-12 text-center text-sm text-zinc-600">No exercises found</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
