import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '@/components/BottomSheet'
import ExercisePicker from './ExercisePicker'
import {
  createPlan, updatePlanName, addExerciseToPlan,
  updatePlanExercise, removeExerciseFromPlan, getPlanExercises, clonePlan,
} from '@/lib/plans'
import { getUnitPref, setUnitPref, toDisplay, toKg } from '@/lib/units'
import type { WorkoutPlan, PlanExercise, Exercise, WeightUnit } from '@/lib/types'

interface PlanBuilderSheetProps {
  open: boolean
  onClose: () => void
  plan: WorkoutPlan | null
  onPlanCreated: (plan: WorkoutPlan) => void
  onPlanUpdated: () => void
}

// Local weight display/entry for a single plan exercise row
function ExerciseRow({
  pe, unit, onRemove, onChange,
}: {
  pe: PlanExercise
  unit: WeightUnit
  onRemove: () => void
  onChange: (updates: Partial<Pick<PlanExercise, 'target_sets' | 'target_reps' | 'target_weights_kg'>>) => void
}) {
  const sets = pe.target_sets
  const weights: (number | null)[] = pe.target_weights_kg ?? Array(sets).fill(null)

  const updateWeight = (idx: number, raw: string) => {
    const val = raw === '' ? null : toKg(parseFloat(raw), unit)
    const next = [...weights]
    while (next.length < sets) next.push(null)
    next[idx] = isNaN(val as number) ? null : val
    onChange({ target_weights_kg: next.slice(0, sets) })
  }

  const updateSets = (raw: string) => {
    const n = Math.max(1, parseInt(raw) || 1)
    const next = Array(n).fill(null).map((_, i) => weights[i] ?? null)
    onChange({ target_sets: n, target_weights_kg: next })
  }

  const inputCls = 'h-10 w-full rounded-lg bg-slate-100 px-2 text-sm text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-blue-300 text-center tabular-nums'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-slate-50 border border-slate-100 p-3"
    >
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{pe.exercise_name}</p>
        <button onClick={onRemove} className="text-xs text-slate-400 hover:text-red-500">
          Remove
        </button>
      </div>

      {/* Sets + Reps row */}
      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <p className="mb-1 text-center text-[10px] font-medium text-slate-400">Sets</p>
          <input
            type="number" inputMode="numeric"
            value={sets}
            onChange={e => updateSets(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <p className="mb-1 text-center text-[10px] font-medium text-slate-400">Reps</p>
          <input
            type="number" inputMode="numeric"
            placeholder="—"
            value={pe.target_reps ?? ''}
            onChange={e => {
              const n = e.target.value === '' ? null : parseInt(e.target.value)
              onChange({ target_reps: n } as Partial<Pick<PlanExercise, 'target_sets' | 'target_reps' | 'target_weights_kg'>>)
            }}
            className={inputCls}
          />
        </div>
      </div>

      {/* Per-set weight rows */}
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: sets }, (_, i) => {
          const stored = weights[i] ?? null
          const displayed = stored !== null ? toDisplay(stored, unit) : ''
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-right text-[10px] font-medium text-slate-400">
                Set {i + 1}
              </span>
              <input
                type="number" inputMode="decimal"
                placeholder={`${unit}`}
                value={displayed === '' ? '' : displayed}
                onChange={e => updateWeight(i, e.target.value)}
                className={inputCls}
              />
              <span className="w-8 shrink-0 text-[10px] text-slate-400">{unit}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function PlanBuilderSheet({
  open, onClose, plan, onPlanCreated, onPlanUpdated
}: PlanBuilderSheetProps) {
  const [name, setName]           = useState('')
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null)
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cloning, setCloning]     = useState(false)
  const [unit, setUnit]           = useState<WeightUnit>(getUnitPref)

  useEffect(() => {
    if (!open) return
    if (plan) {
      setActivePlan(plan)
      setName(plan.name)
      getPlanExercises(plan.id).then(setExercises)
    } else {
      setActivePlan(null)
      setName('')
      setExercises([])
    }
  }, [open, plan])

  const toggleUnit = () => {
    const next: WeightUnit = unit === 'kg' ? 'lbs' : 'kg'
    setUnit(next)
    setUnitPref(next)
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    if (activePlan) {
      await updatePlanName(activePlan.id, name)
      onPlanUpdated()
    } else {
      const created = await createPlan(name)
      setActivePlan(created)
      onPlanCreated(created)
    }
  }

  const handleAddExercise = async (exercise: Exercise) => {
    let currentPlan = activePlan
    if (!currentPlan) {
      currentPlan = await createPlan(name || 'Untitled plan')
      setActivePlan(currentPlan)
      setName(currentPlan.name)
      onPlanCreated(currentPlan)
    }
    const pe = await addExerciseToPlan(currentPlan.id, exercise)
    setExercises(prev => [...prev, pe])
    onPlanUpdated()
  }

  const handleChange = async (pe: PlanExercise, updates: Partial<Pick<PlanExercise, 'target_sets' | 'target_reps' | 'target_weights_kg'>>) => {
    const merged = { ...pe, ...updates }
    setExercises(prev => prev.map(e => e.id === pe.id ? merged : e))
    await updatePlanExercise(pe.id, updates)
  }

  const handleRemove = async (pe: PlanExercise) => {
    await removeExerciseFromPlan(pe.id)
    setExercises(prev => prev.filter(e => e.id !== pe.id))
    onPlanUpdated()
  }

  const handleClone = async () => {
    if (!activePlan) return
    const newName = prompt('Name for the new plan:', `${activePlan.name} (copy)`)
    if (!newName?.trim()) return
    setCloning(true)
    try {
      const cloned = await clonePlan(activePlan.id, newName.trim())
      onPlanCreated(cloned)
      onClose()
    } finally {
      setCloning(false)
    }
  }

  return (
    <>
      <BottomSheet
        open={open && !pickerOpen}
        onClose={onClose}
        title={activePlan ? 'Edit plan' : 'New plan'}
      >
        <div className="flex flex-col gap-4">
          {/* Plan name */}
          <input
            type="text"
            placeholder="Plan name (e.g. Push day)"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleSaveName}
            className="h-12 w-full rounded-xl bg-slate-100 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-blue-300"
          />

          {/* Unit toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-500">Weight unit</span>
            <button
              onClick={toggleUnit}
              className="flex rounded-full bg-white border border-slate-200 text-xs font-bold overflow-hidden shadow-sm"
            >
              {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                <span
                  key={u}
                  className="px-3 py-1 transition-colors"
                  style={unit === u
                    ? { background: '#2563eb', color: '#fff' }
                    : { color: '#94a3b8' }
                  }
                >
                  {u}
                </span>
              ))}
            </button>
          </div>

          {/* Exercise list */}
          {exercises.length > 0 && (
            <div className="flex flex-col gap-3">
              {exercises.map(pe => (
                <ExerciseRow
                  key={pe.id}
                  pe={pe}
                  unit={unit}
                  onRemove={() => handleRemove(pe)}
                  onChange={updates => handleChange(pe, updates)}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="h-12 rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500"
          >
            + Add exercise
          </button>

          {activePlan && (
            <button
              onClick={onClose}
              className="h-12 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#2563eb' }}
            >
              Done
            </button>
          )}
          {activePlan && (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="h-12 rounded-xl bg-slate-100 text-sm font-medium text-slate-500 disabled:opacity-50"
            >
              {cloning ? 'Saving…' : 'Save as new plan'}
            </button>
          )}
        </div>
      </BottomSheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={ex => { handleAddExercise(ex); setPickerOpen(false) }}
      />
    </>
  )
}
