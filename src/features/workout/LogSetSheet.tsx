import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '@/components/BottomSheet'
import { getUnitPref, setUnitPref, toDisplay, toKg } from '@/lib/units'
import type { Exercise, SetType, SetSide, StrengthSet, WeightUnit } from '@/lib/types'
import type { LogSetInput } from '@/lib/workouts'

interface LogSetSheetProps {
  open: boolean
  onClose: () => void
  exercise: Exercise | null
  setIndex: number
  ghost: StrengthSet | null
  onLog: (input: Omit<LogSetInput, 'workoutId'>) => Promise<StrengthSet | null | undefined>
}

const SET_TYPES: { id: SetType; label: string }[] = [
  { id: 'warmup',  label: 'Warm-up' },
  { id: 'working', label: 'Working' },
  { id: 'dropset', label: 'Drop' },
  { id: 'failure', label: 'Failure' },
]

const SIDES: { id: SetSide; label: string }[] = [
  { id: 'both',        label: 'Both' },
  { id: 'left',        label: 'Left' },
  { id: 'right',       label: 'Right' },
  { id: 'alternating', label: 'Alt' },
]

export default function LogSetSheet({ open, onClose, exercise, setIndex, ghost, onLog }: LogSetSheetProps) {
  const [unit, setUnit] = useState<WeightUnit>(getUnitPref)
  const [weight, setWeight] = useState('')

  const toggleUnit = () => {
    const next: WeightUnit = unit === 'kg' ? 'lbs' : 'kg'
    setUnit(next)
    setUnitPref(next)
    // Convert the currently-typed value to the new unit so the number stays coherent
    if (weight !== '') {
      const inKg = toKg(parseFloat(weight), unit)
      setWeight(String(toDisplay(inKg, next)))
    }
  }
  const [reps, setReps]     = useState('')
  const [type, setType]     = useState<SetType>('working')
  const [side, setSide]     = useState<SetSide>('both')
  const [loading, setLoading] = useState(false)

  const defaultSide = (ex: Exercise | null, idx: number): SetSide => {
    if (!ex?.is_unilateral) return 'both'
    return idx % 2 === 1 ? 'left' : 'right'
  }

  useEffect(() => {
    setWeight('')
    setReps('')
    setType('working')
    setSide(defaultSide(exercise, setIndex))
  }, [exercise?.id, setIndex])

  const ghostDisplayWeight = ghost ? toDisplay(ghost.weight_kg, unit) : null
  const weightPlaceholder  = ghostDisplayWeight !== null ? `${ghostDisplayWeight} ${unit}` : `Weight (${unit})`
  const repsPlaceholder    = ghost ? `${ghost.reps} reps` : 'Reps'

  const handleLog = async () => {
    if (!exercise) return
    const displayVal = parseFloat(weight) || (ghostDisplayWeight ?? 0)
    const weightKg   = toKg(displayVal, unit)
    const r          = parseInt(reps) || (ghost?.reps ?? 0)
    if (!weightKg || !r) return
    setLoading(true)
    try {
      await onLog({ exerciseId: exercise.id, setIndex, weightKg, reps: r, side, type })
      setWeight('')
      setReps('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const segBtn = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
      active ? 'text-white' : 'text-slate-400'
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
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Weight</p>
              <button
                onClick={toggleUnit}
                className="flex rounded-full border border-slate-200 bg-white text-[10px] font-bold overflow-hidden"
              >
                {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                  <span
                    key={u}
                    className="px-2 py-0.5 transition-colors"
                    style={unit === u ? { background: '#2563eb', color: '#fff' } : { color: '#94a3b8' }}
                  >
                    {u}
                  </span>
                ))}
              </button>
            </div>
            <input
              type="number"
              inputMode="decimal"
              placeholder={weightPlaceholder}
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="h-14 w-full rounded-xl bg-slate-100 px-4 text-center text-lg font-semibold text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-blue-300"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-medium text-slate-500">Reps</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder={repsPlaceholder}
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="h-14 w-full rounded-xl bg-slate-100 px-4 text-center text-lg font-semibold text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* Ghost hint */}
        {ghost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-slate-400"
          >
            Last: {toDisplay(ghost.weight_kg, unit)} {unit} × {ghost.reps} reps
          </motion.p>
        )}

        {/* Set type */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">Type</p>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {SET_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={segBtn(type === t.id)}
                style={type === t.id ? { background: '#2563eb' } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side — only for unilateral */}
        {exercise?.is_unilateral && (
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Side</p>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {SIDES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSide(s.id)}
                  className={segBtn(side === s.id)}
                  style={side === s.id ? { background: '#2563eb' } : {}}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleLog}
          disabled={loading}
          className="h-14 rounded-xl text-base font-semibold text-white disabled:opacity-50"
          style={{ background: '#2563eb' }}
        >
          {loading ? 'Logging…' : 'Log set'}
        </button>
      </div>
    </BottomSheet>
  )
}
