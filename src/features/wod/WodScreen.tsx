import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWodTimer } from './useWodTimer'
import { formatDuration } from '@/lib/cardio'
import { isMuted, setMuted } from '@/lib/wodAudio'
import type { Wod, WodType } from '@/lib/types'

const WOD_TYPES: { id: WodType; label: string; description: string }[] = [
  { id: 'amrap',    label: 'AMRAP',    description: 'As many rounds as possible in a time cap' },
  { id: 'emom',     label: 'EMOM',     description: 'Every minute on the minute' },
  { id: 'for_time', label: 'For time', description: 'Complete the work as fast as possible' },
  { id: 'tabata',   label: 'Tabata',   description: '20s work / 10s rest × 8 rounds' },
]

const PHASE_COLORS: Record<string, string> = {
  running: 'text-slate-900',
  rest:    'text-sky-500',
  done:    'text-emerald-500',
  idle:    'text-slate-400',
}

function formatClock(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function makeWod(type: WodType, title: string, opts: {
  totalMin: string
  intervalSec: string
  rounds: string
  workSec: string
  restSec: string
  tabataRounds: string
}): Wod {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    workout_id: '',
    type,
    title,
    total_seconds:    (type === 'amrap' || type === 'for_time') ? parseInt(opts.totalMin) * 60 : null,
    interval_seconds: type === 'emom'   ? parseInt(opts.intervalSec) : null,
    work_seconds:     type === 'tabata' ? parseInt(opts.workSec)     : null,
    rest_seconds:     type === 'tabata' ? parseInt(opts.restSec)     : null,
    rounds:           type === 'emom'   ? parseInt(opts.rounds)
                    : type === 'tabata' ? parseInt(opts.tabataRounds)
                    : null,
    result_seconds: null,
    result_rounds:  null,
    notes: null,
    created_at: now,
    updated_at: now,
  }
}

export default function WodScreen() {
  // Config state
  const [type, setType] = useState<WodType>('amrap')
  const [title, setTitle] = useState('')
  const [totalMin, setTotalMin] = useState('20')
  const [intervalSec, setIntervalSec] = useState('60')
  const [rounds, setRounds] = useState('10')
  const [workSec, setWorkSec] = useState('20')
  const [restSec, setRestSec] = useState('10')
  const [tabataRounds, setTabataRounds] = useState('8')
  const [resultRounds, setResultRounds] = useState('')

  const [activeWod, setActiveWod] = useState<Wod | null>(null)
  const [muted, setMutedState] = useState(isMuted)

  const { state: timerState, start, stop, elapsedSeconds } = useWodTimer(activeWod)

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  const handleStart = useCallback(() => {
    const wod = makeWod(type, title, { totalMin, intervalSec, rounds, workSec, restSec, tabataRounds })
    setActiveWod(wod)
    // start() depends on wod ref — use a small timeout to let state settle
    setTimeout(() => start(), 0)
  }, [type, title, totalMin, intervalSec, rounds, workSec, restSec, tabataRounds, start])

  const handleStop = () => {
    stop()
  }

  const handleDone = () => {
    stop()
  }

  const handleReset = () => {
    setActiveWod(null)
    setResultRounds('')
  }

  const inputClass = 'h-11 w-full rounded-xl bg-slate-100 px-4 text-sm text-slate-800 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-blue-300'

  const phase = timerState.phase
  const colorClass = PHASE_COLORS[phase] ?? 'text-zinc-100'
  const isActive = activeWod && phase !== 'idle'
  const isDone = phase === 'done'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-24 pt-12">
      <AnimatePresence mode="wait">
        {/* ── Config screen ── */}
        {!isActive && !isDone && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-1 flex-col px-4"
          >
            <h1 className="mb-6 text-2xl font-bold text-slate-900">WOD timer</h1>

            {/* Type selector */}
            <div className="mb-4 flex flex-col gap-2">
              {WOD_TYPES.map(w => (
                <button
                  key={w.id}
                  onClick={() => setType(w.id)}
                  className={`flex items-start gap-3 rounded-xl p-3 text-left border transition-colors ${
                    type === w.id ? 'bg-white border-blue-200 shadow-sm' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${type === w.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{w.label}</p>
                    <p className="text-xs text-slate-400">{w.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`${inputClass} mb-4`}
            />

            {/* Type-specific config */}
            {(type === 'amrap' || type === 'for_time') && (
              <div className="mb-4">
                <p className="mb-1.5 text-xs text-zinc-500">{type === 'amrap' ? 'Cap (minutes)' : 'Cap in minutes (optional)'}</p>
                <input type="number" inputMode="numeric" value={totalMin} onChange={e => setTotalMin(e.target.value)} className={inputClass} />
              </div>
            )}
            {type === 'emom' && (
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-zinc-500">Interval (sec)</p>
                  <input type="number" inputMode="numeric" value={intervalSec} onChange={e => setIntervalSec(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-zinc-500">Rounds</p>
                  <input type="number" inputMode="numeric" value={rounds} onChange={e => setRounds(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
            {type === 'tabata' && (
              <div className="mb-4 flex gap-2">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-zinc-500">Work (s)</p>
                  <input type="number" inputMode="numeric" value={workSec} onChange={e => setWorkSec(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-zinc-500">Rest (s)</p>
                  <input type="number" inputMode="numeric" value={restSec} onChange={e => setRestSec(e.target.value)} className={inputClass} />
                </div>
                <div className="flex-1">
                  <p className="mb-1.5 text-xs text-zinc-500">Rounds</p>
                  <input type="number" inputMode="numeric" value={tabataRounds} onChange={e => setTabataRounds(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              className="h-12 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#2563eb' }}
            >
              Start WOD
            </button>
          </motion.div>
        )}

        {/* ── Running screen ── */}
        {isActive && !isDone && (
          <motion.div
            key="running"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-4"
          >
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {activeWod.type.replace('_', ' ')}
              </p>
              {timerState.totalRounds > 1 && (
                <p className="mt-1 text-sm text-slate-500">
                  {phase === 'rest' ? 'Rest' : `Round ${timerState.currentRound}`} / {timerState.totalRounds}
                </p>
              )}
            </div>

            {activeWod.type === 'tabata' && (
              <p className={`text-lg font-semibold ${phase === 'rest' ? 'text-sky-500' : 'text-slate-700'}`}>
                {phase === 'rest' ? 'Rest' : 'Work'}
              </p>
            )}

            <span className={`font-mono text-8xl font-bold tabular-nums ${colorClass}`}>
              {timerState.isCountingUp ? '+' : ''}{formatClock(timerState.displaySeconds)}
            </span>

            {activeWod.title && (
              <p className="text-sm text-slate-400">{activeWod.title}</p>
            )}

            <div className="flex gap-3 items-center">
              {activeWod.type === 'for_time' && (
                <button
                  onClick={handleDone}
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white"
                >
                  Done
                </button>
              )}
              <button
                onClick={handleStop}
                className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
              >
                Stop
              </button>
              <button
                onClick={toggleMute}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg"
                title={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? '🔇' : '🔊'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Done screen ── */}
        {isDone && activeWod && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-4"
          >
            <p className="text-lg font-semibold text-emerald-500">WOD complete!</p>

            {activeWod.type === 'for_time' && (
              <div className="w-full rounded-2xl bg-white border border-slate-100 p-6 text-center">
                <p className="text-xs text-slate-400">Your time</p>
                <p className="mt-2 font-mono text-6xl font-bold text-emerald-500">
                  {formatDuration(elapsedSeconds)}
                </p>
              </div>
            )}

            {activeWod.type === 'amrap' && (
              <div className="w-full rounded-2xl bg-white border border-slate-100 p-6">
                <p className="mb-3 text-sm text-slate-500">How many rounds did you complete?</p>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Rounds"
                  value={resultRounds}
                  onChange={e => setResultRounds(e.target.value)}
                  className="h-14 w-full rounded-xl bg-slate-100 px-4 text-center text-2xl font-semibold text-slate-800 outline-none ring-1 ring-slate-200"
                />
              </div>
            )}

            {(activeWod.type === 'emom' || activeWod.type === 'tabata') && (
              <div className="w-full rounded-2xl bg-white border border-slate-100 p-6 text-center">
                <p className="text-slate-600">Great work!</p>
                <p className="mt-1 text-xs text-slate-400">
                  {timerState.totalRounds} rounds completed
                </p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full rounded-xl text-sm font-semibold text-white py-3"
              style={{ background: '#2563eb' }}
            >
              New WOD
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
