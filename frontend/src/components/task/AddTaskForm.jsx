import { useState } from 'react'
import { CalendarDays, ClipboardPlus, Flag, UserCircle2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AddTaskForm({ eventId, onClose, onTaskAdded, profiles = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'Medium',
    status: 'Not Started',
    due_date: '',
    assigned_to: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const statusOptions = ['Not Started', 'In Progress', 'Completed']
  const priorityOptions = ['Low', 'Medium', 'High']

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
      if (!formData.title) {
        setError('Task title is required')
        setLoading(false)
        return
      }

      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('tasks').insert([
        {
          event_id: eventId,
          title: formData.title,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          assigned_to: formData.assigned_to || null,
          created_by: user.user.id,
        },
      ])

      if (insertError) throw insertError

      console.log('Task created successfully')
      onTaskAdded()
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error creating task:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-indigo-100 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-100">Task Workspace</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Create New Task</h2>
            <p className="mt-1 text-xs text-indigo-100 sm:text-sm">
              Set the objective, urgency, and ownership clearly from the start.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation rounded-lg p-2 text-indigo-100 hover:bg-white/15 hover:text-white"
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
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Book Venue"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Flag className="h-4 w-4 text-amber-500" />
                Priority
              </div>
              <div className="grid grid-cols-3 gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, priority: option }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                      formData.priority === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ClipboardPlus className="h-4 w-4 text-emerald-600" />
                Status
              </div>
              <div className="grid grid-cols-1 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: option }))}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold text-left transition sm:text-sm ${
                      formData.status === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserCircle2 className="h-4 w-4 text-violet-500" />
                Assignee
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Unassigned</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name || profile.email || 'Unnamed member'}
                  </option>
                ))}
              </select>
            </div>
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
              {loading ? 'Creating task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
