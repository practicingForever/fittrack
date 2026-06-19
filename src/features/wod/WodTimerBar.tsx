import { motion, AnimatePresence } from 'framer-motion'
import type { WodTimerState } from './useWodTimer'
import type { Wod } from '@/lib/types'

interface WodTimerBarProps {
  wod: Wod | null
  timerState: WodTimerState
  onDone: () => void   // for_time: capture result
  onStop: () => void   // abort
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const PHASE_COLORS: Record<string, string> = {
  running: 'text-zinc-100',
  rest:    'text-sky-400',
  done:    'text-emerald-400',
  idle:    'text-zinc-500',
}

const TYPE_LABELS: Record<string, string> = {
  amrap:    'AMRAP',
  emom:     'EMOM',
  for_time: 'For time',
  tabata:   'Tabata',
}

export default function WodTimerBar({ wod, timerState, onDone, onStop }: WodTimerBarProps) {
  if (!wod || timerState.phase === 'idle') return null

  const { phase, currentRound, totalRounds, displaySeconds, isCountingUp } = timerState
  const colorClass = PHASE_COLORS[phase] ?? 'text-zinc-100'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 260 }}
        className="fixed inset-x-0 z-40 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-md"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}
      >
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Left: type + round */}
          <div className="w-20 shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
              {TYPE_LABELS[wod.type]}
            </p>
            {totalRounds > 1 && (
              <p className="text-xs text-zinc-400">
                {phase === 'rest' ? 'Rest' : `Round ${currentRound}`}/{totalRounds}
              </p>
            )}
            {phase === 'done' && (
              <p className="text-xs text-emerald-400">Done!</p>
            )}
          </div>

          {/* Center: clock */}
          <div className="flex-1 text-center">
            <span className={`font-mono text-3xl font-bold tabular-nums ${colorClass}`}>
              {isCountingUp ? '+' : ''}{formatClock(displaySeconds)}
            </span>
          </div>

          {/* Right: action button */}
          <div className="flex w-20 shrink-0 justify-end gap-2">
            {wod.type === 'for_time' && phase === 'running' && (
              <button onClick={onDone} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                Done
              </button>
            )}
            <button onClick={onStop} className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400">
              {phase === 'done' ? 'Close' : 'Stop'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
