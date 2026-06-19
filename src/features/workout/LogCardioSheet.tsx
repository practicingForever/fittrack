import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import { formatPace, type LogCardioInput } from '@/lib/cardio'
import type { CardioSet } from '@/lib/types'

interface LogCardioSheetProps {
  open: boolean
  onClose: () => void
  onLog: (input: Omit<LogCardioInput, 'workoutId'>) => Promise<CardioSet | null | undefined>
}

type Mode = 'running' | 'rowing'

function parseDuration(input: string): number {
  // Accept mm:ss or plain seconds
  if (input.includes(':')) {
    const [m, s] = input.split(':').map(Number)
    return (m || 0) * 60 + (s || 0)
  }
  return parseInt(input) || 0
}

export default function LogCardioSheet({ open, onClose, onLog }: LogCardioSheetProps) {
  const [mode, setMode] = useState<Mode>('running')
  // running
  const [distanceKm, setDistanceKm] = useState('')
  const [duration, setDuration] = useState('')
  const [routeNotes, setRouteNotes] = useState('')
  // rowing
  const [distanceM, setDistanceM] = useState('')
  const [rowDuration, setRowDuration] = useState('')
  const [strokeRate, setStrokeRate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setDistanceKm(''); setDuration(''); setRouteNotes('')
    setDistanceM(''); setRowDuration(''); setStrokeRate(''); setError(null)
  }

  // Live pace preview for running
  const durationSec = parseDuration(duration)
  const distKm = parseFloat(distanceKm)
  const pacePreview = distKm > 0 && durationSec > 0
    ? formatPace(durationSec / distKm)
    : null

  // Live split preview for rowing
  const rowDurSec = parseDuration(rowDuration)
  const distM = parseFloat(distanceM)
  const splitPreview = distM > 0 && rowDurSec > 0
    ? formatPace((rowDurSec / distM) * 500)
    : null

  const handleLog = async () => {
    setError(null)
    const input: Omit<LogCardioInput, 'workoutId'> = { mode }

    if (mode === 'running') {
      if (!distKm || !durationSec) { setError('Enter distance and duration'); return }
      input.distanceKm = distKm
      input.durationSec = durationSec
      input.routeNotes = routeNotes || undefined
    } else {
      if (!distM || !rowDurSec) { setError('Enter distance and duration'); return }
      input.distanceMeters = distM
      input.durationSec = rowDurSec
      input.strokeRate = parseInt(strokeRate) || undefined
    }

    setLoading(true)
    try {
      await onLog(input)
      reset()
      onClose()
    } catch {
      setError('Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`

  const inputClass = 'h-12 w-full rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500'

  return (
    <BottomSheet open={open} onClose={() => { reset(); onClose() }} title="Log cardio">
      <div className="flex flex-col gap-4">
        {/* Mode tabs */}
        <div className="flex gap-1 rounded-xl bg-zinc-800 p-1">
          <button className={tabClass(mode === 'running')} onClick={() => setMode('running')}>Running</button>
          <button className={tabClass(mode === 'rowing')} onClick={() => setMode('rowing')}>Rowing</button>
        </div>

        {mode === 'running' ? (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mb-1.5 text-xs text-zinc-500">Distance (km)</p>
                <input type="number" inputMode="decimal" placeholder="5.0" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-xs text-zinc-500">Duration (m:ss)</p>
                <input type="text" inputMode="numeric" placeholder="25:00" value={duration} onChange={e => setDuration(e.target.value)} className={inputClass} />
              </div>
            </div>
            {pacePreview && (
              <p className="text-center text-xs text-zinc-500">Pace: <span className="font-semibold text-zinc-300">{pacePreview} /km</span></p>
            )}
            <input type="text" placeholder="Route notes (optional)" value={routeNotes} onChange={e => setRouteNotes(e.target.value)} className={inputClass} />
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mb-1.5 text-xs text-zinc-500">Distance (m)</p>
                <input type="number" inputMode="numeric" placeholder="2000" value={distanceM} onChange={e => setDistanceM(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-xs text-zinc-500">Duration (m:ss)</p>
                <input type="text" inputMode="numeric" placeholder="7:00" value={rowDuration} onChange={e => setRowDuration(e.target.value)} className={inputClass} />
              </div>
            </div>
            {splitPreview && (
              <p className="text-center text-xs text-zinc-500">Split: <span className="font-semibold text-zinc-300">{splitPreview} /500m</span></p>
            )}
            <div>
              <p className="mb-1.5 text-xs text-zinc-500">Stroke rate (SPM)</p>
              <input type="number" inputMode="numeric" placeholder="24" value={strokeRate} onChange={e => setStrokeRate(e.target.value)} className={inputClass} />
            </div>
          </>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button onClick={handleLog} disabled={loading} className="h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50">
          {loading ? 'Saving…' : 'Log cardio'}
        </button>
      </div>
    </BottomSheet>
  )
}
