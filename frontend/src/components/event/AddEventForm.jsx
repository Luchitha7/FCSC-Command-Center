import { useState } from 'react'
import { CalendarDays, MapPin, Sparkles, Tag, Type, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AddEventForm({ onClose, onEventAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    venue: '',
    date: '',
    status: 'Planning',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.type || !formData.venue || !formData.date) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      // Insert event
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([
          {
            name: formData.name,
            type: formData.type,
            description: formData.description,
            venue: formData.venue,
            date: formData.date,
            status: formData.status,
            created_by: user.id,
          },
        ])
        .select()

      if (insertError) throw insertError

      console.log('Event created:', data)
      onEventAdded()
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error creating event:', err)
    } finally {
      setLoading(false)
    }
  }

  const eventTypes = ['MUSICAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'TECHNICAL', 'OTHER']
  const eventStatuses = ['Planning', 'ACTIVE', 'COMPLETED', 'CANCELLED']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-purple-100 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-purple-100 bg-gradient-to-r from-purple-700 to-indigo-700 p-4 text-white sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-100">Event Studio</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Create New Event</h2>
            <p className="mt-1 text-xs text-purple-100 sm:text-sm">
              Start with clear details so tasks, members, and timelines stay aligned.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation rounded-lg p-2 text-purple-100 hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 pb-6 sm:p-6 sm:pb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Type className="h-4 w-4 text-indigo-500" />
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Musical Night 2026"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4 text-purple-500" />
                Event Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Type</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 text-rose-500" />
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., University Auditorium"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {eventStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                      formData.status === status
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full touch-manipulation rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-1 sm:py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] w-full touch-manipulation rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:flex-1 sm:py-2"
            >
              {loading ? 'Creating event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
