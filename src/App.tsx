import { useState } from 'react'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import AuthScreen from '@/features/auth/AuthScreen'
import BottomNav, { type NavTab } from '@/components/BottomNav'
import LibraryScreen from '@/features/library/LibraryScreen'
import WorkoutScreen from '@/features/workout/WorkoutScreen'
import DashboardScreen from '@/features/dashboard/DashboardScreen'
import FeedScreen from '@/features/feed/FeedScreen'
import WodScreen from '@/features/wod/WodScreen'


function AppShell() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<NavTab>('workout')

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
      {tab === 'workout'   && <WorkoutScreen />}
      {tab === 'wod'       && <WodScreen />}
      {tab === 'library'   && <LibraryScreen />}
      {tab === 'dashboard' && <DashboardScreen />}
      {tab === 'feed'      && <FeedScreen />}
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
