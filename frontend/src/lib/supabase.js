import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.sgkpvwrunlrhegohorcz
const anonKey = import.meta.env.sb_publishable_ykoReR1rvoKhuH4gQ20fZA_BaI3VQfV

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
  )
}

export const supabase = createClient(url, anonKey)
