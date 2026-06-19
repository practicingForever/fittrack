import { useState } from 'react'
import BottomSheet from '@/components/BottomSheet'
import type { WodType } from '@/lib/types'
import type { CreateWodInput } from '@/lib/wods'

interface WodConfigSheetProps {
  open: boolean
  onClose: () => void
  onStart: (input: Omit<CreateWodInput, 'workoutId'>) => void
}

const WOD_TYPES: { id: WodType; label: string; description: string }[] = [
  { id: 'amrap',    label: 'AMRAP',    description: 'As many rounds as possible in a time cap' },
  { id: 'emom',     label: 'EMOM',     description: 'Every minute on the minute' },
  { id: 'for_time', label: 'For time', description: 'Complete the work as fast as possible' },
  { id: 'tabata',   label: 'Tabata',   description: '20s work / 10s rest × 8 rounds' },
]

export default function WodConfigSheet({ open, onClose, onStart }: WodConfigSheetProps) {
  const [type, setType] = useState<WodType>('amrap')
  const [title, setTitle] = useState('')
  const [totalMin, setTotalMin] = useState('20')
  const [intervalSec, setIntervalSec] = useState('60')
  const [rounds, setRounds] = useState('10')
  const [workSec, setWorkSec] = useState('20')
  const [restSec, setRestSec] = useState('10')
  const [tabataRounds, setTabataRounds] = useState('8')

  const handleStart = () => {
    const input: Omit<CreateWodInput, 'workoutId'> = { type, title }
    if (type === 'amrap' || type === 'for_time') {
      input.totalSeconds = parseInt(totalMin) * 60
    } else if (type === 'emom') {
      input.intervalSeconds = parseInt(intervalSec)
      input.rounds = parseInt(rounds)
    } else if (type === 'tabata') {
      input.workSeconds = parseInt(workSec)
      input.restSeconds = parseInt(restSec)
      input.rounds = parseInt(tabataRounds)
    }
    onStart(input)
    onClose()
  }

  const inputClass = 'h-11 w-full rounded-xl bg-zinc-800 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500'

  return (
    <BottomSheet open={open} onClose={onClose} title="Start WOD">
      <div className="flex flex-col gap-4">
        {/* Type picker */}
        <div className="flex flex-col gap-2">
          {WOD_TYPES.map(w => (
            <button
              key={w.id}
              onClick={() => setType(w.id)}
              className={`flex items-start gap-3 rounded-xl p-3 text-left ring-1 transition-colors ${
                type === w.id ? 'bg-zinc-800 ring-zinc-600' : 'ring-zinc-800'
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${type === w.id ? 'border-zinc-100 bg-zinc-100' : 'border-zinc-600'}`} />
              <div>
                <p className="text-sm font-medium text-zinc-100">{w.label}</p>
                <p className="text-xs text-zinc-500">{w.description}</p>
              </div>
            </button>
          ))}
        </div>

        <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />

        {/* Type-specific config */}
        {(type === 'amrap' || type === 'for_time') && (
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">{type === 'amrap' ? 'Cap (minutes)' : 'Cap in minutes (optional)'}</p>
            <input type="number" inputMode="numeric" value={totalMin} onChange={e => setTotalMin(e.target.value)} className={inputClass} />
          </div>
        )}
        {type === 'emom' && (
          <div className="flex gap-3">
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
          <div className="flex gap-2">
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

        <button onClick={handleStart} className="h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950">
          Start WOD
        </button>
      </div>
    </BottomSheet>
  )
}
