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
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    fontSize: 12,
    color: '#e4e4e7',
  }

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-zinc-100">Weekly volume</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        </div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-600">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${(v as number).toLocaleString()} kg`, 'Volume']}
            />
            <Bar dataKey="totalVolume" fill="#52525b" radius={[4, 4, 0, 0]} name="Volume" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
