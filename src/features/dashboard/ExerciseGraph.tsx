import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { searchExercises } from '@/lib/exercises'
import { getExerciseProgress, type ExerciseDataPoint } from '@/lib/analytics'
import { useAuth } from '@/features/auth/AuthContext'
import type { Exercise } from '@/lib/types'

export default function ExerciseGraph() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Exercise[]>([])
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [data, setData] = useState<ExerciseDataPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !query.trim()) { setResults([]); return }
    searchExercises({ query, category: 'all', library: 'all', userId: user.id })
      .then(setResults)
  }, [query, user])

  useEffect(() => {
    if (!selected || !user) return
    setLoading(true)
    getExerciseProgress(selected.id, user.id)
      .then(setData)
      .finally(() => setLoading(false))
  }, [selected, user])

  const tooltipStyle = {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 12,
    color: '#1e293b',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-4">
      <h2 className="mb-4 text-sm font-bold text-slate-900">Exercise progress</h2>

      {!selected ? (
        <div>
          <div className="relative mb-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search exercise…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-9 w-full rounded-xl bg-slate-100 pl-8 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          {results.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSelected(ex); setQuery('') }}
              className="flex w-full items-center gap-3 border-b border-slate-100 py-3 text-left last:border-0"
            >
              <p className="text-sm text-slate-800">{ex.name}</p>
            </button>
          ))}
          {query && results.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-400">No exercises found</p>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-slate-900">{selected.name}</p>
            <button
              onClick={() => { setSelected(null); setData([]) }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Change
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
            </div>
          )}

          {!loading && data.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-400">No data yet — log some sets first</p>
          )}

          {!loading && data.length > 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Max weight (kg)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb' }}
                      activeDot={{ r: 5 }}
                      name="Max weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">Effort score</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: unknown) => [v as number, 'Effort']}
                    />
                    <Line
                      type="monotone"
                      dataKey="effortScore"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#16a34a' }}
                      activeDot={{ r: 5 }}
                      name="Effort"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
