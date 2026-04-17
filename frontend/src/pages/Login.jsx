import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import commandCenterLogo from '../assets/command-center-logo.png'
import loginHero from '../assets/login-hero.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e?.preventDefault?.()
    setLoading(true)
    setError('')

    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signErr) {
      setError(signErr.message)
    } else {
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <main className="font-ui min-h-screen overflow-x-hidden bg-slate-100 text-slate-900 antialiased">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[440px] lg:max-w-4xl">
          {/* Same surface language as EcShell: white, slate borders */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_300px] lg:items-stretch xl:grid-cols-[1fr_340px]">
              {/* Form — first on mobile */}
              <div className="order-1 border-slate-200 px-6 py-8 sm:px-8 sm:py-10 lg:border-r">
                <div className="mb-8">
                  <img
                    src={commandCenterLogo}
                    alt="Command Center logo"
                    className="h-10 w-auto max-w-[180px] object-contain"
                  />
                  <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-slate-400">Executive Committee</p>
                  <h1 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">Sign in</h1>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Use your FCSC account to open the Command Center.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <div className="group relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-slate-200 transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="group relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full touch-manipulation items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Signing in…' : 'Sign in'}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </button>
                </form>

                <p className="mt-8 text-xs leading-relaxed text-slate-500">
                  Authorized Executive Committee access only. Contact your administrator if you need an account.
                </p>
              </div>

              {/* Illustration — same chrome as app: light panel, no dark split */}
              <div className="order-2 flex flex-col items-center justify-center border-t border-slate-200 bg-slate-50 px-6 py-8 sm:py-10 lg:order-2 lg:border-l lg:border-t-0 lg:px-5 lg:py-10">
                <div className="flex w-full max-w-[220px] flex-col items-center lg:max-w-none">
                  <div className="w-full rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <img
                      src={loginHero}
                      alt=""
                      className="mx-auto h-auto w-full max-w-[200px] object-contain lg:max-w-[240px]"
                      decoding="async"
                    />
                  </div>
                  <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                    Events, tasks, and updates in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">FCSC · Events Hub</p>
        </div>
      </div>
    </main>
  )
}
