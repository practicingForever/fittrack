import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/features/auth/AuthContext'
import {
  getPendingConnections, sendConnectionRequest, acceptConnection,
} from '@/lib/feed'
import type { Connection } from '@/lib/types'

interface ConnectionGateProps {
  onConnected: () => void
}

export default function ConnectionGate({ onConnected }: ConnectionGateProps) {
  const { user } = useAuth()
  const [pending, setPending] = useState<Connection[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)

  useEffect(() => {
    if (!user) return
    getPendingConnections(user.id).then(setPending)
  }, [user])

  if (!user) return null

  const incoming = pending.filter(c => c.friend_id === user.id)
  const outgoing = pending.filter(c => c.user_id === user.id)

  const handleSend = async () => {
    if (!query.trim()) return
    setLoading(true)
    const { error } = await sendConnectionRequest(user.id, query.trim())
    setLoading(false)
    if (error) {
      setMessage({ text: error, isError: true })
    } else {
      setMessage({ text: 'Request sent! Waiting for your partner to accept.', isError: false })
      setQuery('')
      getPendingConnections(user.id).then(setPending)
    }
  }

  const handleAccept = async (conn: Connection) => {
    await acceptConnection(conn.id)
    onConnected()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 px-4 pt-8"
    >
      <div>
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Connect with your partner</h2>
        <p className="text-sm text-zinc-500">
          Your user ID: <span className="font-mono text-xs text-zinc-400">{user.id.slice(0, 8)}…</span>
        </p>
      </div>

      {/* Incoming requests */}
      {incoming.map(conn => (
        <div key={conn.id} className="rounded-xl bg-zinc-900 p-4">
          <p className="mb-3 text-sm text-zinc-300">Partner wants to connect</p>
          <button
            onClick={() => handleAccept(conn)}
            className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950"
          >
            Accept connection
          </button>
        </div>
      ))}

      {/* Outgoing requests */}
      {outgoing.map(conn => (
        <div key={conn.id} className="rounded-xl bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Waiting for your partner to accept…</p>
        </div>
      ))}

      {/* Send request */}
      {incoming.length === 0 && outgoing.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">Enter your partner's display name to connect:</p>
          <input
            type="text"
            placeholder="Display name"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="h-12 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          />
          {message && (
            <p className={`text-xs ${message.isError ? 'text-red-400' : 'text-emerald-400'}`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSend}
            disabled={loading}
            className="h-12 rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      )}
    </motion.div>
  )
}
