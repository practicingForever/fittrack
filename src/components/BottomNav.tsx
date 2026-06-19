import { motion } from 'framer-motion'

export type NavTab = 'workout' | 'library' | 'dashboard' | 'feed'

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

const tabs: { id: NavTab; label: string; icon: string }[] = [
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'library', label: 'Library', icon: '📚' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'feed', label: 'Feed', icon: '🏆' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-800 bg-zinc-950/90 pb-safe backdrop-blur-md">
      <div className="flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex flex-1 flex-col items-center gap-1 py-3"
          >
            {active === tab.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-zinc-100"
              />
            )}
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className={`text-[10px] font-medium ${active === tab.id ? 'text-zinc-100' : 'text-zinc-600'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
