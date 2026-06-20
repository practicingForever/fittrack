import { motion } from 'framer-motion'

export type NavTab = 'workout' | 'wod' | 'library' | 'dashboard' | 'feed'

interface BottomNavProps {
  active: NavTab
  onChange: (tab: NavTab) => void
}

const ACTIVE_COLOR = '#2563eb'
const INACTIVE_COLOR = '#94a3b8'

function IconDumbbell({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11" /><path d="M6.5 17.5h11" />
      <path d="M3 9.5v5" /><path d="M21 9.5v5" />
      <rect x="1.5" y="8" width="3" height="8" rx="1.5" />
      <rect x="19.5" y="8" width="3" height="8" rx="1.5" />
      <rect x="5" y="5" width="3" height="14" rx="1.5" />
      <rect x="16" y="5" width="3" height="14" rx="1.5" />
    </svg>
  )
}

function IconTimer({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M9.5 3h5" /><path d="M12 3v2" />
    </svg>
  )
}

function IconBookOpen({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function IconBarChart({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconTrophy({ active }: { active: boolean }) {
  const c = active ? ACTIVE_COLOR : INACTIVE_COLOR
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3V4h3" /><path d="M18 9h3V4h-3" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0z" />
      <path d="M12 17v4" /><path d="M8 21h8" />
    </svg>
  )
}

const tabs: { id: NavTab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: 'workout',   label: 'Workout',   Icon: IconDumbbell },
  { id: 'wod',       label: 'WOD',       Icon: IconTimer },
  { id: 'library',   label: 'Library',   Icon: IconBookOpen },
  { id: 'dashboard', label: 'Dashboard', Icon: IconBarChart },
  { id: 'feed',      label: 'Feed',      Icon: IconTrophy },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md">
      <div className="flex">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex flex-1 flex-col items-center gap-1 pt-2 pb-3"
            >
              {/* Dot indicator */}
              <div className="mb-0.5 h-1 w-1 rounded-full transition-all duration-200"
                style={{ background: isActive ? ACTIVE_COLOR : 'transparent' }}
              />
              <Icon active={isActive} />
              <span
                className="text-[10px] font-semibold transition-colors duration-200"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ background: ACTIVE_COLOR }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
