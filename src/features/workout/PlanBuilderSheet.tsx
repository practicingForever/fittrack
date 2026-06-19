import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '@/components/BottomSheet'
import ExercisePicker from './ExercisePicker'
import {
  createPlan, updatePlanName, addExerciseToPlan,
  updatePlanExercise, removeExerciseFromPlan, getPlanExercises, clonePlan,
} from '@/lib/plans'
import type { WorkoutPlan, PlanExercise, Exercise } from '@/lib/types'

interface PlanBuilderSheetProps {
  open: boolean
  onClose: () => void
  plan: WorkoutPlan | null          // null = creating new
  onPlanCreated: (plan: WorkoutPlan) => void
  onPlanUpdated: () => void
}

export default function PlanBuilderSheet({
  open, onClose, plan, onPlanCreated, onPlanUpdated
}: PlanBuilderSheetProps) {
  const [name, setName] = useState('')
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null)
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cloning, setCloning] = useState(false)

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

  const handleSaveName = async () => {
    if (!name.trim()) return
    if (activePlan) {
      await updatePlanName(activePlan.id, name)
      onPlanUpdated()
    } else {
      setSaving(true)
      const created = await createPlan(name)
      setActivePlan(created)
      onPlanCreated(created)
      setSaving(false)
    }
  }

  const handleAddExercise = async (exercise: Exercise) => {
    if (!activePlan) {
      // Auto-create plan with current name first
      const created = await createPlan(name || 'Untitled plan')
      setActivePlan(created)
      setName(created.name)
      onPlanCreated(created)
      const pe = await addExerciseToPlan(created.id, exercise)
      setExercises(prev => [...prev, pe])
    } else {
      const pe = await addExerciseToPlan(activePlan.id, exercise)
      setExercises(prev => [...prev, pe])
      onPlanUpdated()
    }
  }

  const handleUpdateTarget = async (pe: PlanExercise, field: 'target_sets' | 'target_reps' | 'target_weight_kg', value: string) => {
    const num = value === '' ? null : parseFloat(value)
    if (field === 'target_sets' && (num === null || num < 1)) return
    await updatePlanExercise(pe.id, { [field]: num })
    setExercises(prev => prev.map(e => e.id === pe.id ? { ...e, [field]: num } : e))
  }

  const handleRemove = async (pe: PlanExercise) => {
    await removeExerciseFromPlan(pe.id)
    setExercises(prev => prev.filter(e => e.id !== pe.id))
    onPlanUpdated()
  }

  const inputClass = 'h-10 w-full rounded-lg bg-zinc-800 px-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500 text-center tabular-nums'

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

  // suppress unused variable warning
  void saving

  return (
    <>
      <BottomSheet
        open={open && !pickerOpen}
        onClose={onClose}
        title={activePlan ? 'Edit plan' : 'New plan'}
      >
        <div className="flex flex-col gap-4">
          {/* Plan name */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Plan name (e.g. Push day)"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleSaveName}
              className="h-12 flex-1 rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
            />
          </div>

          {/* Exercise list */}
          {exercises.length > 0 && (
            <div className="flex flex-col gap-2">
              {exercises.map(pe => (
                <motion.div
                  key={pe.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-zinc-800 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-100">{pe.exercise_name}</p>
                    <button onClick={() => handleRemove(pe)} className="text-xs text-zinc-600 hover:text-red-400">
                      Remove
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="mb-1 text-center text-[10px] text-zinc-600">Sets</p>
                      <input
                        type="number" inputMode="numeric"
                        value={pe.target_sets}
                        onChange={e => handleUpdateTarget(pe, 'target_sets', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-center text-[10px] text-zinc-600">Reps</p>
                      <input
                        type="number" inputMode="numeric"
                        placeholder="—"
                        value={pe.target_reps ?? ''}
                        onChange={e => handleUpdateTarget(pe, 'target_reps', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-center text-[10px] text-zinc-600">kg</p>
                      <input
                        type="number" inputMode="decimal"
                        placeholder="—"
                        value={pe.target_weight_kg ?? ''}
                        onChange={e => handleUpdateTarget(pe, 'target_weight_kg', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="h-12 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          >
            + Add exercise
          </button>

          {activePlan && (
            <button onClick={onClose} className="h-12 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950">
              Done
            </button>
          )}
          {activePlan && (
            <button
              onClick={handleClone}
              disabled={cloning}
              className="h-12 rounded-xl bg-zinc-900 text-sm font-medium text-zinc-400 disabled:opacity-50"
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
