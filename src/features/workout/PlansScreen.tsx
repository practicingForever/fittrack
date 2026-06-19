import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getPlans, deletePlan, getPlanExercises } from '@/lib/plans'
import type { WorkoutPlan, PlanExercise } from '@/lib/types'
import PlanBuilderSheet from './PlanBuilderSheet'

interface PlansScreenProps {
  onStartFromPlan: (plan: WorkoutPlan, exercises: PlanExercise[]) => void
  onBack: () => void
}

export default function PlansScreen({ onStartFromPlan, onBack }: PlansScreenProps) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

  const reload = () => getPlans().then(setPlans)

  useEffect(() => { reload() }, [])

  const handleStartFromPlan = async (plan: WorkoutPlan) => {
    const exercises = await getPlanExercises(plan.id)
    onStartFromPlan(plan, exercises)
  }

  const handleDelete = async (plan: WorkoutPlan) => {
    if (!confirm(`Delete "${plan.name}"?`)) return
    await deletePlan(plan.id)
    reload()
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-28">
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
          <h1 className="flex-1 text-xl font-semibold text-zinc-100">Plans</h1>
          <button
            onClick={() => { setIsNew(true); setEditingPlan(null); setBuilderOpen(true) }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-lg text-zinc-100"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-2">
        {plans.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <p className="text-sm text-zinc-500">No plans yet</p>
            <button
              onClick={() => { setIsNew(true); setEditingPlan(null); setBuilderOpen(true) }}
              className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm text-zinc-300"
            >
              Create your first plan
            </button>
          </div>
        )}

        {plans.map(plan => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-zinc-900 p-4"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-medium text-zinc-100">{plan.name}</p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  {new Date(plan.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsNew(false); setEditingPlan(plan); setBuilderOpen(true) }}
                  className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-600 hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => handleStartFromPlan(plan)}
              className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950"
            >
              Start from this plan
            </button>
          </motion.div>
        ))}
      </div>

      <PlanBuilderSheet
        open={builderOpen}
        onClose={() => { setBuilderOpen(false); reload() }}
        plan={isNew ? null : editingPlan}
        onPlanCreated={p => { setEditingPlan(p); setIsNew(false); reload() }}
        onPlanUpdated={reload}
      />
    </div>
  )
}
