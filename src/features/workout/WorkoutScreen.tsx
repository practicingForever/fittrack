import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from './useWorkout'
import LogSetSheet from './LogSetSheet'
import LogCardioSheet from './LogCardioSheet'
import ExercisePicker from './ExercisePicker'
import WodConfigSheet from '@/features/wod/WodConfigSheet'
import WodTimerBar from '@/features/wod/WodTimerBar'
import WodResultSheet from '@/features/wod/WodResultSheet'
import { useWodTimer } from '@/features/wod/useWodTimer'
import type { Exercise, StrengthSet } from '@/lib/types'
import { getPreviousSet } from '@/lib/workouts'
import { scoreLabel } from '@/lib/scoring'
import { formatDuration as formatCarduroDuration } from '@/lib/cardio'

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function WorkoutScreen() {
  const {
    workout, entries, elapsed,
    startWorkout, endWorkout, addExercise, logSet,
    cardioSets, logCardio,
    activeWod, startWod, clearWod,
  } = useWorkout()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false)
  const [wodConfigOpen, setWodConfigOpen] = useState(false)
  const [wodResultOpen, setWodResultOpen] = useState(false)
  const [logSheet, setLogSheet] = useState<{
    open: boolean
    exercise: Exercise | null
    setIndex: number
    ghost: StrengthSet | null
  }>({ open: false, exercise: null, setIndex: 1, ghost: null })

  const { state: timerState, start: startTimer, stop: stopTimer, elapsedSeconds } = useWodTimer(activeWod)

  const openLogSheet = async (exercise: Exercise, currentSetCount: number) => {
    const setIndex = currentSetCount + 1
    const ghost = await getPreviousSet(exercise.id, setIndex)
    setLogSheet({ open: true, exercise, setIndex, ghost })
  }

  const handleEndWorkout = async () => {
    if (!confirm('Finish workout?')) return
    await endWorkout()
  }

  const handleWodDone = () => {
    stopTimer()
    if (activeWod && (activeWod.type === 'for_time' || activeWod.type === 'amrap')) {
      setWodResultOpen(true)
    } else {
      clearWod()
    }
  }

  const handleWodStop = () => {
    stopTimer()
    if (activeWod && timerState.phase === 'done' && (activeWod.type === 'for_time' || activeWod.type === 'amrap')) {
      setWodResultOpen(true)
    } else {
      clearWod()
    }
  }

  const handleWodResultClose = () => {
    setWodResultOpen(false)
    clearWod()
  }

  // No active workout
  if (!workout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs text-center"
        >
          <p className="mb-6 text-sm text-zinc-500">No active workout</p>
          <button
            onClick={startWorkout}
            className="w-full rounded-2xl bg-zinc-100 py-4 text-base font-semibold text-zinc-950"
          >
            Start workout
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Active workout</p>
            <p className="font-mono text-2xl font-semibold text-zinc-100">
              {formatElapsed(elapsed)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWodConfigOpen(true)}
              className="rounded-xl bg-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300"
            >
              WOD
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
                        className="flex items-center gap-2 py-1.5 text-sm"
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
        onLog={logSet}
      />

      {/* Log cardio sheet */}
      <LogCardioSheet
        open={cardioSheetOpen}
        onClose={() => setCardioSheetOpen(false)}
        onLog={logCardio}
      />

      {/* WOD config sheet */}
      <WodConfigSheet
        open={wodConfigOpen}
        onClose={() => setWodConfigOpen(false)}
        onStart={async (input) => {
          const wod = await startWod(input)
          if (wod) startTimer()
        }}
      />

      {/* WOD timer bar */}
      <WodTimerBar
        wod={activeWod}
        timerState={timerState}
        onDone={handleWodDone}
        onStop={handleWodStop}
      />

      {/* WOD result sheet */}
      {activeWod && (activeWod.type === 'for_time' || activeWod.type === 'amrap') && (
        <WodResultSheet
          open={wodResultOpen}
          onClose={handleWodResultClose}
          wod={activeWod}
          elapsedSeconds={elapsedSeconds}
        />
      )}
    </div>
  )
}
