import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from './useWorkout'
import LogSetSheet from './LogSetSheet'
import LogCardioSheet from './LogCardioSheet'
import ExercisePicker from './ExercisePicker'
import { useRestTimer } from './useRestTimer'
import RestTimerBar from './RestTimerBar'
import PlanBuilderSheet from './PlanBuilderSheet'
import EditSetSheet from './EditSetSheet'
import WorkoutHistorySheet from './WorkoutHistorySheet'
import { touchPlan, getPlans, getPlanExercises, deletePlan } from '@/lib/plans'
import { db } from '@/lib/db'
import type { Exercise, StrengthSet, WorkoutPlan, PlanExercise } from '@/lib/types'
import { getPreviousSet } from '@/lib/workouts'
import { scoreLabel } from '@/lib/scoring'
import { formatDuration as formatCarduroDuration } from '@/lib/cardio'
import { useAuth } from '@/features/auth/AuthContext'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function WorkoutScreen() {
  const { user } = useAuth()
  const {
    workout, entries, elapsed,
    startWorkout, endWorkout, cancelWorkout, addExercise, logSet,
    cardioSets, logCardio,
    timerStatus, startTimer, pauseTimer, resumeTimer,
    editSet, deleteSet,
  } = useWorkout()

  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const reloadPlans = () => getPlans().then(setPlans)
  useEffect(() => { reloadPlans() }, [])
  const [editSheet, setEditSheet] = useState<{ open: boolean; set: StrengthSet | null }>({ open: false, set: null })
  const [planTargets, setPlanTargets] = useState<Map<string, PlanExercise>>(new Map())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false)
  const [logSheet, setLogSheet] = useState<{
    open: boolean
    exercise: Exercise | null
    setIndex: number
    ghost: StrengthSet | null
  }>({ open: false, exercise: null, setIndex: 1, ghost: null })

  const { state: restState, start: startRest, skip: skipRest, setDuration: setRestDuration } = useRestTimer(90)

  const handleStartFromPlan = async (plan: WorkoutPlan) => {
    const planExercises = await getPlanExercises(plan.id)
    await touchPlan(plan.id)
    await startWorkout()
    const targetMap = new Map(planExercises.map(pe => [pe.exercise_id, pe]))
    setPlanTargets(targetMap)
    for (const pe of planExercises) {
      const ex = await db.exercises.get(pe.exercise_id)
      if (ex) await addExercise(ex)
    }
  }

  const handleDeletePlan = async (plan: WorkoutPlan) => {
    if (!confirm(`Delete "${plan.name}"?`)) return
    await deletePlan(plan.id)
    reloadPlans()
  }

  const openLogSheet = async (exercise: Exercise, currentSetCount: number) => {
    const setIndex = currentSetCount + 1
    let ghost = await getPreviousSet(exercise.id, setIndex)
    // Use plan targets as ghost hint if no history yet
    if (!ghost) {
      const planTarget = planTargets.get(exercise.id)
      if (planTarget && (planTarget.target_weight_kg || planTarget.target_reps)) {
        ghost = {
          id: 'plan-hint',
          workout_id: '',
          exercise_id: exercise.id,
          wod_id: null,
          set_index: setIndex,
          weight_kg: planTarget.target_weight_kg ?? 0,
          reps: planTarget.target_reps ?? 0,
          side: 'both',
          type: 'working',
          effort_score: null,
          logged_at: '',
          updated_at: '',
        } as StrengthSet
      }
    }
    setLogSheet({ open: true, exercise, setIndex, ghost })
  }

  const handleEndWorkout = async () => {
    if (!confirm('Finish workout?')) return
    await endWorkout()
  }

  const handleCancelWorkout = async () => {
    if (!confirm('Discard this workout? All logged sets will be deleted.')) return
    await cancelWorkout()
  }

  // No active workout — home screen
  if (!workout) {
    return (
      <>
        <div className="flex min-h-screen flex-col bg-slate-50 pb-28">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-12 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-900">Workout</h1>
              <button
                onClick={() => setHistoryOpen(true)}
                className="text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                History
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-4 pt-5">
            {/* Quick start */}
            <button
              onClick={startWorkout}
              className="w-full rounded-2xl bg-white border border-slate-200 py-4 text-base font-semibold text-slate-900 shadow-sm"
            >
              + Start blank workout
            </button>

            {/* Plans section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">My plans</h2>
                <button
                  onClick={() => { setEditingPlan(null); setBuilderOpen(true) }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ background: '#2563eb' }}
                >
                  +
                </button>
              </div>

              {plans.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white border border-slate-100 py-10 text-center">
                  <p className="text-sm text-slate-400">No plans yet</p>
                  <button
                    onClick={() => { setEditingPlan(null); setBuilderOpen(true) }}
                    className="rounded-xl px-5 py-2 text-sm font-semibold text-white"
                    style={{ background: '#2563eb' }}
                  >
                    Create your first plan
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {plans.map(plan => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-white border border-slate-100 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{plan.name}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {new Date(plan.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingPlan(plan); setBuilderOpen(true) }}
                            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan)}
                            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartFromPlan(plan)}
                        className="w-full rounded-xl py-3 text-sm font-semibold text-white"
                        style={{ background: '#2563eb' }}
                      >
                        Start this plan
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <PlanBuilderSheet
          open={builderOpen}
          onClose={() => { setBuilderOpen(false); reloadPlans() }}
          plan={editingPlan}
          onPlanCreated={p => { setEditingPlan(p); reloadPlans() }}
          onPlanUpdated={reloadPlans}
        />

        {user && (
          <WorkoutHistorySheet
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            userId={user.id}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {/* Left: timer display */}
          <div>
            <p className="text-xs text-zinc-500">
              {timerStatus === 'idle' ? 'Workout ready' : timerStatus === 'paused' ? 'Paused' : 'Active workout'}
            </p>
            <p className={`font-mono text-2xl font-semibold ${timerStatus === 'idle' ? 'text-zinc-600' : timerStatus === 'paused' ? 'text-yellow-400' : 'text-zinc-100'}`}>
              {timerStatus === 'idle' ? '--:--' : formatElapsed(elapsed)}
            </p>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {timerStatus === 'idle' && (
              <button
                onClick={startTimer}
                className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Start timer
              </button>
            )}
            {timerStatus === 'running' && (
              <button
                onClick={pauseTimer}
                className="rounded-xl bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300"
              >
                Pause
              </button>
            )}
            {timerStatus === 'paused' && (
              <button
                onClick={resumeTimer}
                className="rounded-xl bg-zinc-800 px-3 py-2.5 text-sm font-medium text-yellow-400"
              >
                Resume
              </button>
            )}
            <button
              onClick={handleCancelWorkout}
              className="rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:text-red-400"
            >
              Cancel
            </button>
            <button
              onClick={handleEndWorkout}
              className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      {/* Exercise entries */}
      <div className="flex-1 px-4 pt-2">
        <AnimatePresence initial={false}>
          {entries.map(({ exercise, sets }) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl bg-zinc-900 overflow-hidden"
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <div>
                  <p className="font-medium text-zinc-100">{exercise.name}</p>
                  <p className="text-xs capitalize text-zinc-500">{exercise.category}</p>
                </div>
                <button
                  onClick={() => openLogSheet(exercise, sets.length)}
                  className="h-9 rounded-xl bg-zinc-800 px-3 text-sm text-zinc-300"
                >
                  + Set
                </button>
              </div>

              {/* Sets table */}
              {sets.length > 0 && (
                <div className="border-t border-zinc-800 px-4 py-2">
                  <div className="mb-1 flex gap-2 text-[10px] text-zinc-600">
                    <span className="w-6 text-center">#</span>
                    <span className="flex-1">Type</span>
                    <span className="w-16 text-right">Weight</span>
                    <span className="w-10 text-right">Reps</span>
                    <span className="w-10 text-right">Score</span>
                  </div>
                  {sets.map(set => {
                    const { colorClass } = scoreLabel(set.effort_score ?? 50)
                    return (
                      <motion.div
                        key={set.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 py-1.5 text-sm cursor-pointer"
                        onClick={() => setEditSheet({ open: true, set })}
                      >
                        <span className="w-6 text-center text-xs text-zinc-600">{set.set_index}</span>
                        <span className="flex-1 text-xs capitalize text-zinc-500">{set.type}</span>
                        <span className="w-16 text-right font-medium text-zinc-100">{set.weight_kg} kg</span>
                        <span className="w-10 text-right text-zinc-300">{set.reps}</span>
                        <motion.span
                          key={set.effort_score}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 12, stiffness: 300 }}
                          className={`w-10 text-right text-xs font-semibold tabular-nums ${colorClass}`}
                        >
                          {set.effort_score != null ? Math.round(set.effort_score) : '—'}
                        </motion.span>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {sets.length === 0 && (
                <p className="px-4 pb-3 text-xs text-zinc-600">Tap + Set to log your first set</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cardio sets list */}
        {cardioSets.length > 0 && (
          <div className="mb-4 rounded-2xl bg-zinc-900 overflow-hidden">
            <div className="px-4 pt-3 pb-2">
              <p className="font-medium text-zinc-100">Cardio</p>
            </div>
            <div className="border-t border-zinc-800 px-4 py-2">
              {cardioSets.map((cs, i) => (
                <div key={cs.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-6 text-center text-xs text-zinc-600">{i + 1}</span>
                  <span className="flex-1 capitalize text-xs text-zinc-500">{cs.mode}</span>
                  {cs.distance != null && (
                    <span className="text-zinc-300">
                      {cs.distance}{cs.distance_unit}
                    </span>
                  )}
                  {cs.duration_sec != null && (
                    <span className="text-zinc-400 ml-2">{formatCarduroDuration(cs.duration_sec)}</span>
                  )}
                  {cs.pace_sec_per_unit != null && (
                    <span className="text-zinc-500 ml-2 text-xs">
                      {Math.floor(cs.pace_sec_per_unit / 60)}:{String(Math.round(cs.pace_sec_per_unit % 60)).padStart(2, '0')}/km
                    </span>
                  )}
                  {cs.split_sec_per_500 != null && (
                    <span className="text-zinc-500 ml-2 text-xs">
                      {Math.floor(cs.split_sec_per_500 / 60)}:{String(Math.round(cs.split_sec_per_500 % 60)).padStart(2, '0')}/500m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add exercise button */}
        <button
          onClick={() => setPickerOpen(true)}
          className="mt-2 w-full rounded-2xl border border-dashed border-zinc-800 py-4 text-sm text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
        >
          + Add exercise
        </button>

        {/* Log cardio button */}
        <button
          onClick={() => setCardioSheetOpen(true)}
          className="mt-2 w-full rounded-2xl border border-dashed border-zinc-800 py-4 text-sm text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
        >
          + Log cardio
        </button>
      </div>

      {/* Exercise picker */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={ex => { addExercise(ex); setPickerOpen(false) }}
      />

      {/* Log set sheet */}
      <LogSetSheet
        open={logSheet.open}
        onClose={() => setLogSheet(s => ({ ...s, open: false }))}
        exercise={logSheet.exercise}
        setIndex={logSheet.setIndex}
        ghost={logSheet.ghost}
        onLog={async (input) => {
          const set = await logSet(input)
          if (set) void startRest()
          return set
        }}
      />

      {/* Log cardio sheet */}
      <LogCardioSheet
        open={cardioSheetOpen}
        onClose={() => setCardioSheetOpen(false)}
        onLog={logCardio}
      />

      <EditSetSheet
        open={editSheet.open}
        onClose={() => setEditSheet(s => ({ ...s, open: false }))}
        set={editSheet.set}
        onSave={async (setId, updates) => {
          if (!editSheet.set) return
          await editSet(setId, editSheet.set.exercise_id, updates)
        }}
        onDelete={async (setId) => {
          if (!editSheet.set) return
          await deleteSet(setId, editSheet.set.exercise_id)
        }}
      />

      <RestTimerBar
        state={restState}
        onSkip={skipRest}
        onChangeDuration={(dur) => { setRestDuration(dur); void startRest(dur) }}
        wodActive={false}
      />
    </div>
  )
}
