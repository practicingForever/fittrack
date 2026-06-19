import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '@/components/BottomSheet'
import type { Exercise, SetType, SetSide, StrengthSet } from '@/lib/types'
import type { LogSetInput } from '@/lib/workouts'

interface LogSetSheetProps {
  open: boolean
  onClose: () => void
  exercise: Exercise | null
  setIndex: number               // next set index for this exercise
  ghost: StrengthSet | null      // previous set at this index (for ghost text)
  onLog: (input: Omit<LogSetInput, 'workoutId'>) => Promise<StrengthSet | null | undefined>
}

const SET_TYPES: { id: SetType; label: string }[] = [
  { id: 'warmup', label: 'Warm-up' },
  { id: 'working', label: 'Working' },
  { id: 'dropset', label: 'Drop' },
  { id: 'failure', label: 'Failure' },
]

const SIDES: { id: SetSide; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'alternating', label: 'Alt' },
]

export default function LogSetSheet({ open, onClose, exercise, setIndex, ghost, onLog }: LogSetSheetProps) {
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [type, setType] = useState<SetType>('working')
  const [side, setSide] = useState<SetSide>('both')
  const [loading, setLoading] = useState(false)

  // Reset when exercise changes
  useEffect(() => {
    setWeight('')
    setReps('')
    setType('working')
    setSide('both')
  }, [exercise?.id, setIndex])

  const weightPlaceholder = ghost ? `${ghost.weight_kg} kg` : 'Weight (kg)'
  const repsPlaceholder = ghost ? `${ghost.reps} reps` : 'Reps'

  const handleLog = async () => {
    if (!exercise) return
    const w = parseFloat(weight) || (ghost?.weight_kg ?? 0)
    const r = parseInt(reps) || (ghost?.reps ?? 0)
    if (!w || !r) return
    setLoading(true)
    try {
      await onLog({
        exerciseId: exercise.id,
        setIndex,
        weightKg: w,
        reps: r,
        side,
        type,
      })
      setWeight('')
      setReps('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const segBtn = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
      active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'
    }`

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={exercise ? `${exercise.name} — set ${setIndex}` : 'Log set'}
    >
      <div className="flex flex-col gap-4">
        {/* Weight + Reps */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="mb-1.5 text-xs text-zinc-500">Weight</p>
            <input
              type="number"
              inputMode="decimal"
              placeholder={weightPlaceholder}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="h-14 w-full rounded-xl bg-zinc-800 px-4 text-center text-lg font-semibold text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-xs text-zinc-500">Reps</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder={repsPlaceholder}
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="h-14 w-full rounded-xl bg-zinc-800 px-4 text-center text-lg font-semibold text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
            />
          </div>
        </div>

        {/* Ghost hint */}
        {ghost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-zinc-600"
          >
            Last: {ghost.weight_kg} kg × {ghost.reps} reps
          </motion.p>
        )}

        {/* Set type */}
        <div>
          <p className="mb-2 text-xs text-zinc-500">Type</p>
          <div className="flex gap-1 rounded-xl bg-zinc-800 p-1">
            {SET_TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)} className={segBtn(type === t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side — only for unilateral */}
        {exercise?.is_unilateral && (
          <div>
            <p className="mb-2 text-xs text-zinc-500">Side</p>
            <div className="flex gap-1 rounded-xl bg-zinc-800 p-1">
              {SIDES.map(s => (
                <button key={s.id} onClick={() => setSide(s.id)} className={segBtn(side === s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleLog}
          disabled={loading}
          className="h-14 rounded-xl bg-zinc-100 text-base font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading ? 'Logging…' : 'Log set'}
        </button>
      </div>
    </BottomSheet>
  )
}
