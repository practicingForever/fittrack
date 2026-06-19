import { motion } from 'framer-motion'
import ExerciseGraph from './ExerciseGraph'
import VolumeTrend from './VolumeTrend'
import CardioTrend from './CardioTrend'

export default function DashboardScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-zinc-950 pb-28"
    >
      <div className="sticky top-0 z-20 bg-zinc-950/90 px-4 pt-12 pb-3 backdrop-blur-md">
        <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
      </div>

      <div className="flex flex-col gap-8 px-4 pt-4">
        <ExerciseGraph />
        <div className="border-t border-zinc-900" />
        <VolumeTrend />
        <div className="border-t border-zinc-900" />
        <CardioTrend />
      </div>
    </motion.div>
  )
}
