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
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 12,
    color: '#1e293b',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  }

  const paceLabel = mode === 'running' ? '/km' : '/500m'

  const paceValues = data.map(d => d.pace)
  const minPace = paceValues.length ? Math.min(...paceValues) * 0.97 : 0
  const maxPace = paceValues.length ? Math.max(...paceValues) * 1.03 : 600

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4">
      <h2 className="mb-4 text-sm font-bold text-slate-900">Cardio pace</h2>

      <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {(['running', 'rowing'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors capitalize"
            style={{
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#1e3a8a' : '#94a3b8',
              boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No {mode} data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
            <YAxis
              domain={[minPace, maxPace]}
              reversed
              tick={{ fontSize: 10, fill: '#94a3b8' }}
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
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5 }}
              name="Pace"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
