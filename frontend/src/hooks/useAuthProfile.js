import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Current auth user and matching profiles row (if table + RLS allow).
 */
export function useAuthProfile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async (userId) => {
      if (!userId) {
        if (!cancelled) setProfile(null)
        return
      }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (!cancelled) setProfile(p ?? null)
    }

    const syncSession = async (session) => {
      const u = session?.user ?? null
      if (!cancelled) setUser(u)
      if (u) await loadProfile(u.id)
      else if (!cancelled) setProfile(null)
      if (!cancelled) setAuthReady(true)
    }

    supabase.auth.getSession().then(({ data: { session } }) => syncSession(session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  return { user, profile, authReady }
}
