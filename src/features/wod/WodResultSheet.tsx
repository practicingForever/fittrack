import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import type { Wod } from '@/lib/types'
import { saveWodResult } from '@/lib/wods'
import { formatDuration } from '@/lib/cardio'

interface WodResultSheetProps {
  open: boolean
  onClose: () => void
  wod: Wod
  elapsedSeconds: number
}

export default function WodResultSheet({ open, onClose, wod, elapsedSeconds }: WodResultSheetProps) {
  const [rounds, setRounds] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const result: { result_seconds?: number; result_rounds?: number } = {}
      if (wod.type === 'for_time') result.result_seconds = elapsedSeconds
      if (wod.type === 'amrap') result.result_rounds = parseInt(rounds) || 0
      await saveWodResult(wod.id, result)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="WOD complete">
      <div className="flex flex-col gap-4">
        {wod.type === 'for_time' && (
          <div className="rounded-xl bg-zinc-800 p-4 text-center">
            <p className="text-xs text-zinc-500">Your time</p>
            <p className="mt-1 font-mono text-4xl font-bold text-emerald-400">
              {formatDuration(elapsedSeconds)}
            </p>
          </div>
        )}
        {wod.type === 'amrap' && (
          <>
            <p className="text-sm text-zinc-400">How many rounds did you complete?</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Rounds"
              value={rounds}
              onChange={e => setRounds(e.target.value)}
              className="h-12 rounded-xl bg-zinc-800 px-4 text-center text-lg font-semibold text-zinc-100 outline-none ring-1 ring-zinc-700"
            />
          </>
        )}
        <button onClick={handleSave} disabled={saving} className="h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save result'}
        </button>
      </div>
    </BottomSheet>
  )
}
