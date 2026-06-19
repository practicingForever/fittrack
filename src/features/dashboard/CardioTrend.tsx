import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { getCardioTrend, type CardioPoint } from '@/lib/analytics'
import { formatPace as fmtPace } from '@/lib/cardio'
import { useAuth } from '@/features/auth/AuthContext'

type Mode = 'running' | 'rowing'

export default function CardioTrend() {
  const { user } = useAuth()
  const [mode, setMode] = useState<Mode>('running')
  const [data, setData] = useState<CardioPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getCardioTrend(user.id, mode).then(setData).finally(() => setLoading(false))
  }, [user, mode])

  const tooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    fontSize: 12,
    color: '#e4e4e7',
  }

  const paceLabel = mode === 'running' ? '/km' : '/500m'

  const paceValues = data.map(d => d.pace)
  const minPace = paceValues.length ? Math.min(...paceValues) * 0.97 : 0
  const maxPace = paceValues.length ? Math.max(...paceValues) * 1.03 : 600

  const segClass = (active: boolean) =>
    `flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'}`

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-zinc-100">Cardio pace</h2>

      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-800 p-1">
        <button className={segClass(mode === 'running')} onClick={() => setMode('running')}>Running</button>
        <button className={segClass(mode === 'rowing')} onClick={() => setMode('rowing')}>Rowing</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-600">No {mode} data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} />
            <YAxis
              domain={[minPace, maxPace]}
              reversed
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmtPace(v)}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [fmtPace(v as number) + paceLabel, 'Pace']}
            />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 3, fill: '#60a5fa' }}
              activeDot={{ r: 5 }}
              name="Pace"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
