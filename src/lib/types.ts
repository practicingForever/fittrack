export type WeightUnit = 'kg' | 'lbs'
export type PaceUnit = 'mile' | 'km'
export type ExerciseCat = 'strength' | 'running' | 'rowing'
export type SetSide = 'both' | 'left' | 'right' | 'alternating'
export type SetType = 'warmup' | 'working' | 'dropset' | 'failure'
export type CardioMode = 'running' | 'rowing'
export type WodType = 'amrap' | 'emom' | 'for_time' | 'tabata'
export type ConnectionStatus = 'pending' | 'accepted'
export type ExerciseVisibility = 'private' | 'shared'

export interface Profile {
  id: string
  display_name: string
  unit_pref: WeightUnit
  pace_pref: PaceUnit
  created_at: string
  updated_at: string
}

export interface Connection {
  id: string
  user_id: string
  friend_id: string
  status: ConnectionStatus
  created_at: string
}

export interface MuscleGroup {
  id: string
  name: string
  is_preset: boolean
  created_by: string | null
  sort_order: number
  created_at: string
}

export interface Exercise {
  id: string
  owner_id: string | null
  name: string
  category: ExerciseCat
  muscle_group_id: string | null
  is_unilateral: boolean
  visibility: ExerciseVisibility
  created_at: string
  updated_at: string
}

export interface ExerciseMuscleGroup {
  exercise_id: string
  muscle_group_id: string
}

export interface Workout {
  id: string
  user_id: string
  title: string
  started_at: string
  ended_at: string | null
  planned_duration_min: number | null
  session_grade: number | null
  session_letter: string | null
  notes: string | null
  is_shared: boolean
  updated_at: string
}

export interface Wod {
  id: string
  workout_id: string
  type: WodType
  title: string
  total_seconds: number | null
  interval_seconds: number | null
  work_seconds: number | null
  rest_seconds: number | null
  rounds: number | null
  result_seconds: number | null
  result_rounds: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StrengthSet {
  id: string
  workout_id: string
  exercise_id: string
  wod_id: string | null
  set_index: number
  weight_kg: number
  reps: number
  side: SetSide
  type: SetType
  effort_score: number | null
  logged_at: string
  updated_at: string
}

export interface WorkoutPlan {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  exercise_name: string    // denormalised for display without join
  order_index: number
  target_sets: number
  target_reps: number | null
  target_weight_kg: number | null
}

export interface CardioSet {
  id: string
  workout_id: string
  exercise_id: string | null
  wod_id: string | null
  mode: CardioMode
  distance: number | null
  distance_unit: string | null
  duration_sec: number | null
  pace_sec_per_unit: number | null
  route_notes: string | null
  split_sec_per_500: number | null
  stroke_rate: number | null
  effort_score: number | null
  logged_at: string
  updated_at: string
}
