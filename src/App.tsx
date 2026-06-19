import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import AuthScreen from '@/features/auth/AuthScreen'
import { motion } from 'framer-motion'

function SignedInShell() {
  const { signOut, profile } = useAuth()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4"
    >
      <h1 className="text-2xl font-semibold text-zinc-100">FitTrack</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Hey {profile?.display_name || 'there'}, you're in.
      </p>
      <p className="mt-1 text-xs text-zinc-700">Dashboard coming in step 4+</p>
      <button
        onClick={signOut}
        className="mt-8 text-sm text-zinc-600 hover:text-zinc-400"
      >
        Sign out
      </button>
    </motion.div>
  )
}

function Inner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    )
  }

  if (!user) return <AuthScreen />
  return <SignedInShell />
}

export default function App() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  )
}
