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
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#0B4B6E] to-[#0D2D7D] text-xl font-bold text-white shadow-sm">
            FC
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-indigo-800">EventHub</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Administrative Portal</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="mt-1 text-sm text-slate-500">Please enter your credentials to manage events.</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Email Address
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5">
                <span className="text-slate-500">@</span>
                <input
                  type="email"
                  placeholder="admin@fcsc.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Password</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5">
                <span className="text-slate-500">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Logging in...' : 'Login'}
            <span aria-hidden="true">↪</span>
          </button>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="leading-relaxed">
              Contact your EC administrator to get access. Unauthorized access to the EventHub management system is
              strictly prohibited.
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">FCSC © 2024</p>
      </section>
    </main>
  )
}