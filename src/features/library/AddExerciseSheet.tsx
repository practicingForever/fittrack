import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import type { MuscleGroup, ExerciseCat, ExerciseVisibility } from '@/lib/types'
import type { CreateExerciseInput } from '@/lib/exercises'

interface AddExerciseSheetProps {
  open: boolean
  onClose: () => void
  muscleGroups: MuscleGroup[]
  onAdd: (input: Omit<CreateExerciseInput, 'userId'>) => Promise<void>
  onAddMuscleGroup: (name: string) => Promise<MuscleGroup | null | undefined>
}

export default function AddExerciseSheet({ open, onClose, muscleGroups, onAdd, onAddMuscleGroup }: AddExerciseSheetProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCat>('strength')
  const [muscleGroupId, setMuscleGroupId] = useState<string | null>(null)
  const [isUnilateral, setIsUnilateral] = useState(false)
  const [visibility, setVisibility] = useState<ExerciseVisibility>('private')
  const [newGroupName, setNewGroupName] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName(''); setCategory('strength'); setMuscleGroupId(null)
    setIsUnilateral(false); setVisibility('private'); setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return
    const mg = await onAddMuscleGroup(newGroupName.trim())
    if (mg) { setMuscleGroupId(mg.id); setNewGroupName(''); setAddingGroup(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    try {
      await onAdd({ name, category, muscleGroupId, isUnilateral, visibility })
      handleClose()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const segmentClass = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`

  return (
    <BottomSheet open={open} onClose={handleClose} title="New exercise">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Exercise name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-12 rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
        />

        {/* Category */}
        <div>
          <p className="mb-2 text-xs text-zinc-500">Category</p>
          <div className="flex gap-1 rounded-xl bg-zinc-800 p-1">
            {(['strength', 'running', 'rowing'] as ExerciseCat[]).map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)} className={segmentClass(category === cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Muscle group */}
        <div>
          <p className="mb-2 text-xs text-zinc-500">Muscle group</p>
          <select
            value={muscleGroupId ?? ''}
            onChange={e => setMuscleGroupId(e.target.value || null)}
            className="h-12 w-full rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700"
          >
            <option value="">None</option>
            {muscleGroups.map(mg => (
              <option key={mg.id} value={mg.id}>{mg.name}</option>
            ))}
          </select>
          {!addingGroup ? (
            <button type="button" onClick={() => setAddingGroup(true)} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300">
              + Add muscle group
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="h-10 flex-1 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700"
              />
              <button type="button" onClick={handleAddGroup} className="h-10 rounded-xl bg-zinc-700 px-4 text-xs text-zinc-100">
                Add
              </button>
            </div>
          )}
        </div>

        {/* Unilateral */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isUnilateral}
            onChange={e => setIsUnilateral(e.target.checked)}
            className="h-5 w-5 rounded accent-zinc-400"
          />
          <span className="text-sm text-zinc-300">Unilateral (left/right)</span>
        </label>

        {/* Visibility */}
        <div>
          <p className="mb-2 text-xs text-zinc-500">Visibility</p>
          <div className="flex gap-1 rounded-xl bg-zinc-800 p-1">
            {(['private', 'shared'] as ExerciseVisibility[]).map(v => (
              <button key={v} type="button" onClick={() => setVisibility(v)} className={segmentClass(visibility === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Add exercise'}
        </button>
      </form>
    </BottomSheet>
  )
}
