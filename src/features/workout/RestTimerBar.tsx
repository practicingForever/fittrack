import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RestTimerState } from './useRestTimer'

interface RestTimerBarProps {
  state: RestTimerState
  onSkip: () => void
  onChangeDuration: (sec: number) => void
  wodActive: boolean   // shift up when WOD bar is also showing
}

const QUICK_DURATIONS = [
  { label: '1 min', value: 60 },
  { label: '90 s',  value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
]

function CircleProgress({ remaining, duration }: { remaining: number; duration: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const progress = duration > 0 ? remaining / duration : 0
  const dash = circ * progress

  return (
    <svg width="36" height="36" className="shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" stroke="#27272a" strokeWidth="3" />
      <circle
        cx="18" cy="18" r={r}
        fill="none"
        stroke={remaining <= 10 ? '#f87171' : '#a1a1aa'}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function RestTimerBar({ state, onSkip, onChangeDuration, wodActive }: RestTimerBarProps) {
  const [picking, setPicking] = useState(false)

  if (!state.active) return null

  // Stack above BottomNav (56px) + optionally WodTimerBar (~60px)
  const bottomOffset = wodActive
    ? 'calc(env(safe-area-inset-bottom) + 56px + 60px)'
    : 'calc(env(safe-area-inset-bottom) + 56px)'

  const mins = Math.floor(state.remaining / 60)
  const secs = state.remaining % 60
  const display = `${mins}:${String(secs).padStart(2, '0')}`

  return (
    <>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        exit={{ y: 80 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed inset-x-0 z-30 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md"
        style={{ bottom: bottomOffset }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5">
          <CircleProgress remaining={state.remaining} duration={state.duration} />

          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Rest</p>
            <p
              className={`font-mono text-xl font-bold tabular-nums ${
                state.remaining <= 10 ? 'text-red-400' : 'text-zinc-100'
              }`}
            >
              {display}
            </p>
          </div>

          <button
            onClick={() => setPicking(p => !p)}
            className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400"
          >
            {picking ? 'Close' : 'Change'}
          </button>

          <button
            onClick={onSkip}
            className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400"
          >
            Skip
          </button>
        </div>

        {/* Quick duration picker */}
        <AnimatePresence>
          {picking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-zinc-800"
            >
              <div className="flex gap-2 px-4 py-2.5">
                {QUICK_DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { onChangeDuration(d.value); setPicking(false) }}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
                      state.duration === d.value
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
