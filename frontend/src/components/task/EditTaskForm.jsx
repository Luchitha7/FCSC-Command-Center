import { useState } from 'react'
import { CalendarDays, ClipboardCheck, Flag, Plus, Trash2, UserCircle2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { normalizeSubtasks, serializeSubtasksForDb } from '../../lib/taskSubtasks'

export default function EditTaskForm({ task, onClose, onTaskUpdated, profiles = [] }) {
  const [formData, setFormData] = useState({
    title: task.title,
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || '',
    assigned_to: task.assigned_to || '',
  })
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState(null)
  const [subtasks, setSubtasks] = useState(normalizeSubtasks(task.subtasks))
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const statusOptions = ['Not Started', 'In Progress', 'Completed']
  const priorityOptions = ['Low', 'Medium', 'High']

  const addSubtask = () => {
    const title = newSubtaskTitle.trim()
    if (!title) return
    setSubtasks((prev) => [...prev, { id: `sub-${Date.now()}`, title, done: false }])
    setNewSubtaskTitle('')
  }

  const removeSubtask = (subtaskId) => {
    setSubtasks((prev) => prev.filter((item) => item.id !== subtaskId))
  }

  const toggleSubtaskDone = (subtaskId) => {
    setSubtasks((prev) =>
      prev.map((item) => (item.id === subtaskId ? { ...item, done: !item.done } : item)),
    )
  }

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

      const normalizedSubtasks = normalizeSubtasks(subtasks)
      const basePayload = {
        title: formData.title,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        subtasks: serializeSubtasksForDb(normalizedSubtasks),
      }

      const { error: updateError } = await supabase.from('tasks').update(basePayload).eq('id', task.id)
      if (updateError) throw updateError

      console.log('Task updated successfully')
      onTaskUpdated()
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error updating task:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    setDeleteLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (deleteError) throw deleteError

      console.log('Task deleted successfully')
      onTaskUpdated()
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting task:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-indigo-100 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-100">Task Workspace</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Refine Task Details</h2>
            <p className="mt-1 text-xs text-indigo-100 sm:text-sm">Update status, assignment, and due date in one place.</p>
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
              placeholder="What needs to be done?"
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
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
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

          <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Subtasks</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSubtask()
                  }
                }}
                placeholder="e.g., Confirm sponsor assets"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {subtasks.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {subtasks.map((subtask) => (
                  <li key={subtask.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={subtask.done === true}
                      onChange={() => toggleSubtaskDone(subtask.id)}
                      className="h-4 w-4 accent-emerald-600"
                      aria-label={`Toggle ${subtask.title}`}
                    />
                    <span className={`flex-1 text-sm ${subtask.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
                      className="rounded p-1 text-rose-600 hover:bg-rose-50"
                      aria-label={`Remove subtask ${subtask.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No subtasks yet.</p>
            )}
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

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:flex-wrap sm:gap-3">
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
              {loading ? 'Saving changes...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              <Trash2 size={16} />
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
