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
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    fontSize: 12,
    color: '#e4e4e7',
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-zinc-100">Exercise progress</h2>

      {!selected ? (
        <div>
          <input
            type="search"
            placeholder="Search exercise…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="mb-2 h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          />
          {results.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setSelected(ex); setQuery('') }}
              className="flex w-full items-center gap-3 border-b border-zinc-900 py-3 text-left"
            >
              <div>
                <p className="text-sm text-zinc-100">{ex.name}</p>
                <p className="text-xs capitalize text-zinc-500">{ex.category}</p>
              </div>
            </button>
          ))}
          {query && results.length === 0 && (
            <p className="py-6 text-center text-xs text-zinc-600">No exercises found</p>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-medium text-zinc-100">{selected.name}</p>
            <button
              onClick={() => { setSelected(null); setData([]) }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Change
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
            </div>
          )}

          {!loading && data.length === 0 && (
            <p className="py-6 text-center text-xs text-zinc-600">No data yet — log some sets first</p>
          )}

          {!loading && data.length > 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-xs text-zinc-500">Max weight (kg)</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#a1a1aa"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#a1a1aa' }}
                      activeDot={{ r: 5 }}
                      name="Max weight"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="mb-2 text-xs text-zinc-500">Effort score</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: unknown) => [v as number, 'Effort']}
                    />
                    <Line
                      type="monotone"
                      dataKey="effortScore"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#34d399' }}
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
