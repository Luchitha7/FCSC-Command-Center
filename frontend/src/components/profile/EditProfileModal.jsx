import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const emptyForm = () => ({
  full_name: '',
  email: '',
  stu_id: '',
})

export default function EditProfileModal({ isOpen, onClose, user, profile, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !user) return
    setError(null)
    setForm({
      full_name: profile?.full_name ?? '',
      email: profile?.email ?? user?.email ?? '',
      stu_id: profile?.stu_id ?? '',
    })
  }, [isOpen, user, profile])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.full_name.trim() || null,
      email: form.email.trim() || null,
      stu_id: form.stu_id.trim() || null,
    }

    try {
      const { data: updatedRows, error: upErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id)
        .select()

      if (upErr) throw upErr

      if (!updatedRows?.length) {
        const { error: insErr } = await supabase.from('profiles').insert({
          id: user.id,
          ...payload,
        })
        if (insErr) throw insErr
      }

      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="edit-profile-title"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="edit-profile-title" className="text-lg font-semibold text-slate-900">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 pb-6 sm:p-5 sm:pb-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )}

          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Full name</span>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="name"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="email"
              />
            </label>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">Student ID</h3>
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Student ID</span>
                <input
                  name="stu_id"
                  value={form.stu_id}
                  onChange={handleChange}
                  placeholder="University student ID"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 touch-manipulation rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] flex-1 touch-manipulation rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
