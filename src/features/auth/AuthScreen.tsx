import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './AuthContext'

type Mode = 'signin' | 'signup' | 'reset'

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (next: Mode) => { setMode(next); setError(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
      } else if (mode === 'signup') {
        if (!displayName.trim()) { setError('Display name is required'); return }
        const { error } = await signUp(email, password, displayName)
        if (error) setError(error)
        else setError('Check your email to confirm your account.')
      } else {
        const { error } = await resetPassword(email)
        if (error) setError(error)
        else setError('Password reset email sent — check your inbox.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'h-12 rounded-xl bg-zinc-900 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600'

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
          {mode === 'signin' ? 'Sign in to continue'
            : mode === 'signup' ? 'Create your account'
            : 'Reset your password'}
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
                className={inputClass}
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
            className={inputClass}
            autoComplete="email"
          />

          <AnimatePresence>
            {mode !== 'reset' && (
              <motion.input
                key="password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 48 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className={inputClass}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            )}
          </AnimatePresence>

          {error && (
            <p className={`text-xs ${error.startsWith('Check') || error.startsWith('Password reset') ? 'text-emerald-400' : 'text-red-400'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 h-12 rounded-xl bg-zinc-100 text-sm font-medium text-zinc-950 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Please wait…'
              : mode === 'signin' ? 'Sign in'
              : mode === 'signup' ? 'Create account'
              : 'Send reset email'}
          </button>
        </form>

        {/* Forgot password — only on sign in */}
        {mode === 'signin' && (
          <button
            onClick={() => switchMode('reset')}
            className="mt-4 w-full text-center text-sm text-zinc-600 hover:text-zinc-400"
          >
            Forgot password?
          </button>
        )}

        {/* Back to sign in — on reset screen */}
        {mode === 'reset' && (
          <button
            onClick={() => switchMode('signin')}
            className="mt-4 w-full text-center text-sm text-zinc-600 hover:text-zinc-400"
          >
            Back to sign in
          </button>
        )}

        {/* Sign up / Sign in toggle */}
        <button
          onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
          className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-zinc-300"
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </motion.div>
    </div>
  )
}
