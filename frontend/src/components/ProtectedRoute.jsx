// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
      }
      setChecking(false)
    }
    checkSession()
  }, [])

  if (checking) return <p>Loading...</p>
  return children
}