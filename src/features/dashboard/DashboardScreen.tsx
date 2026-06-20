import { motion } from 'framer-motion'
import StreakCard from './StreakCard'
import ExerciseGraph from './ExerciseGraph'
import VolumeTrend from './VolumeTrend'
import CardioTrend from './CardioTrend'
import MuscleGroupStats from './MuscleGroupStats'

export default function DashboardScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pb-28"
    >
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-12 pb-3">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-5">
        <StreakCard />
        <MuscleGroupStats />
        <VolumeTrend />
        <ExerciseGraph />
        <CardioTrend />
      </div>
    </motion.div>
  )
}
