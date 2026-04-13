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
    <main className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Members</h1>

      {loading && <p className="text-gray-600">Loading members…</p>}
      {error && <p className="text-red-600">Could not load members: {error}</p>}

      {!loading && !error && profiles.length === 0 && (
        <p className="text-gray-600">No profiles found.</p>
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Role</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-900">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-sm text-gray-600">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.role || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.department || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
