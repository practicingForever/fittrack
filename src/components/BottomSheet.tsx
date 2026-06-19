import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-zinc-900 pb-safe"
          >
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: '75vh' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
