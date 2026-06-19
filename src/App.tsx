import { motion } from 'framer-motion'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          FitTrack
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Offline-first fitness tracker
        </p>
      </motion.div>
    </div>
  )
}
