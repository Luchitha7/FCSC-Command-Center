import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function EditEventForm({ event, onClose, onEventUpdated }) {
  const [formData, setFormData] = useState({
    name: event.name,
    type: event.type,
    description: event.description || '',
    venue: event.venue,
    date: event.date,
    status: event.status,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

      console.log('Updating event with ID:', event.id)
      console.log('Form data:', formData)

      // Update event
      const { data, error: updateError } = await supabase
        .from('events')
        .update({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          venue: formData.venue,
          date: formData.date,
          status: formData.status,
        })
        .eq('id', event.id)
        .select()

      console.log('Update response:', { data, error: updateError })

      if (updateError) throw updateError

      console.log('Event updated successfully:', data)
      setError(null)
      onEventUpdated()
      onClose()
    } catch (err) {
      console.error('Error updating event:', err)
      setError(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)

      if (deleteError) throw deleteError

      console.log('Event deleted successfully')
      onEventUpdated()
      onClose()
    } catch (err) {
      setError(err.message)
      console.error('Error deleting event:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const eventTypes = ['MUSICAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'TECHNICAL', 'OTHER']
  const eventStatuses = ['Planning', 'ACTIVE', 'COMPLETED', 'CANCELLED']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-gray-200 bg-white shadow-lg sm:max-h-[90vh] sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-2xl">Edit Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 pb-6 sm:p-6 sm:pb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Musical Night 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Type</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue *
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., University Auditorium"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {eventStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] w-full touch-manipulation rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 sm:min-w-0 sm:flex-1 sm:py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] w-full touch-manipulation rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:order-none sm:flex-1 sm:py-2"
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="min-h-[44px] w-full touch-manipulation rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
