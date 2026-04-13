// src/pages/Login.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24 }}>
      <h2>FCSC EventHub</h2>
      <p style={{ color: 'gray', marginBottom: 24 }}>
        Members only. Contact your EC admin for access.
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 10 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 10 }}
      />

      {error && <p style={{ color: 'red', marginBottom: 10 }}>{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', padding: 10 }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}