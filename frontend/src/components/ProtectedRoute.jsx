// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (err) {
      console.error('Auth check failed:', err)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  // While checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Authenticated - render protected content
  return children
}