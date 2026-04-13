import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Members() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (cancelled) return
      if (err) setError(err.message)
      else setProfiles(data || [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-6xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
      <h1 className="mb-4 text-xl font-semibold tracking-tight sm:mb-6 sm:text-2xl">Members</h1>

      {loading && <p className="text-gray-600">Loading members…</p>}
      {error && <p className="text-red-600">Could not load members: {error}</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="text-gray-600">No profiles found.</p>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="-mx-1 overflow-x-auto rounded-lg border border-gray-200 bg-white sm:mx-0">
          <table className="w-full min-w-[520px] text-left text-sm sm:text-base">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-900 sm:px-4 sm:py-3 sm:text-sm">Name</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-900 sm:px-4 sm:py-3 sm:text-sm">Email</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-900 sm:px-4 sm:py-3 sm:text-sm">Role</th>
                <th className="px-3 py-2.5 text-xs font-semibold text-gray-900 sm:px-4 sm:py-3 sm:text-sm">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-800 grid place-items-center text-xs font-bold">
                          {(p.full_name || p.email || '?')
                            .split(/\s+|@/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((s) => s[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{p.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="max-w-[140px] px-3 py-2.5 text-xs text-gray-600 sm:max-w-none sm:px-4 sm:py-3 sm:text-sm">
                    {p.email || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 sm:px-4 sm:py-3 sm:text-sm">{p.role || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 sm:px-4 sm:py-3 sm:text-sm">{p.department || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
