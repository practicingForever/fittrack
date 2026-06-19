import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export type Database = Record<string, unknown>

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey
)
