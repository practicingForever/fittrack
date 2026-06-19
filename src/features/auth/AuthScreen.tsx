import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './AuthContext'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
      } else {
        if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return }
        const { error } = await signUp(email, password, displayName)
        if (error) setError(error)
        else setError('Check your email to confirm your account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <h1 className="mb-1 text-2xl font-semibold text-zinc-100">FitTrack</h1>
        <p className="mb-8 text-sm text-zinc-500">
          {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.input
                key="displayName"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 48 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-12 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
                autoComplete="name"
              />
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            autoComplete={mode === 'signin' ? 'email' : 'email'}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className={`text-xs ${error.startsWith('Check') ? 'text-emerald-400' : 'text-red-400'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null) }}
          className="mt-6 w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </motion.div>
    </div>
  )
}
