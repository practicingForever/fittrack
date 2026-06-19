import { useState } from 'react'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import AuthScreen from '@/features/auth/AuthScreen'
import BottomNav, { type NavTab } from '@/components/BottomNav'
import LibraryScreen from '@/features/library/LibraryScreen'

function PlaceholderScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 pb-24">
      <p className="text-sm text-zinc-600">{label} — coming soon</p>
    </div>
  )
}

function AppShell() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<NavTab>('library')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <div className="bg-zinc-950">
      {tab === 'workout'   && <PlaceholderScreen label="Workout" />}
      {tab === 'library'   && <LibraryScreen />}
      {tab === 'dashboard' && <PlaceholderScreen label="Dashboard" />}
      {tab === 'feed'      && <PlaceholderScreen label="Feed" />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
