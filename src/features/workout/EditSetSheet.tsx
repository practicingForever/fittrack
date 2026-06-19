import { useState, useEffect } from 'react'
import BottomSheet from '@/components/BottomSheet'
import type { StrengthSet, SetType } from '@/lib/types'

interface EditSetSheetProps {
  open: boolean
  onClose: () => void
  set: StrengthSet | null
  onSave: (setId: string, updates: { weightKg?: number; reps?: number; type?: SetType }) => Promise<void>
  onDelete: (setId: string) => Promise<void>
}

const SET_TYPES: SetType[] = ['working', 'warmup', 'failure', 'dropset']

export default function EditSetSheet({ open, onClose, set, onSave, onDelete }: EditSetSheetProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [type, setType] = useState<SetType>('working')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (set) {
      setWeight(set.weight_kg > 0 ? String(set.weight_kg) : '')
      setReps(set.reps > 0 ? String(set.reps) : '')
      setType(set.type)
    }
  }, [set])

  const handleSave = async () => {
    if (!set) return
    setSaving(true)
    try {
      await onSave(set.id, {
        weightKg: weight ? parseFloat(weight) : undefined,
        reps: reps ? parseInt(reps) : undefined,
        type,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!set) return
    if (!confirm('Delete this set?')) return
    setDeleting(true)
    try {
      await onDelete(set.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const inputClass = 'h-12 w-full rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500 tabular-nums'

  return (
    <BottomSheet open={open} onClose={onClose} title={`Edit set ${set?.set_index ?? ''}`}>
      <div className="flex flex-col gap-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {SET_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition-colors ${
                type === t ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <p className="mb-1.5 text-xs text-zinc-500">Weight (kg)</p>
            <input
              type="number" inputMode="decimal"
              placeholder="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-xs text-zinc-500">Reps</p>
            <input
              type="number" inputMode="numeric"
              placeholder="0"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || deleting}
          className="h-12 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          onClick={handleDelete}
          disabled={saving || deleting}
          className="h-12 rounded-xl bg-zinc-900 text-sm font-medium text-red-400 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete set'}
        </button>
      </div>
    </BottomSheet>
  )
}
