import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { getWeeklyVolume, type VolumePoint } from '@/lib/analytics'
import { useAuth } from '@/features/auth/AuthContext'

export default function VolumeTrend() {
  const { user } = useAuth()
  const [data, setData] = useState<VolumePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getWeeklyVolume(user.id).then(setData).finally(() => setLoading(false))
  }, [user])

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
      <h2 className="mb-4 text-sm font-bold text-slate-900">Weekly volume</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${(v as number).toLocaleString()} kg`, 'Volume']}
            />
            <Bar dataKey="totalVolume" fill="#2563eb" radius={[4, 4, 0, 0]} name="Volume" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
