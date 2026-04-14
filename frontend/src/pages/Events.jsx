import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddEventForm from '../components/event/AddEventForm'
import EcShell from '../components/layout/EcShell'
import LogoutButton from '../components/LogoutButton'
import { getNavItems } from '../hooks/useNavItems'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState(null)
  const navigate = useNavigate()
  const navItems = getNavItems('events')
  const footerContent = <LogoutButton />

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      console.log('Fetching events from Supabase...')
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      console.log('Fetch response:', { data, error: fetchError })

      if (fetchError) throw fetchError

      console.log('Events loaded:', data)
      setEvents(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`)
  }

  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Delete "${event.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingEventId(event.id)
      setError(null)

      const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)
      if (deleteError) throw deleteError

      setEvents((prevEvents) => prevEvents.filter((item) => item.id !== event.id))
    } catch (err) {
      setError(err.message || 'Failed to delete event')
      console.error('Error deleting event:', err)
    } finally {
      setDeletingEventId(null)
    }
  }

  return (
    <EcShell navItems={navItems} footer={footerContent}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Events</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">All Events</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex touch-manipulation items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 sm:py-2"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>

        {loading && <p className="text-gray-600">Loading events...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && events.length === 0 && (
          <p className="text-gray-600">No events found</p>
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => handleEventClick(event.id)}
                  className="w-full cursor-pointer touch-manipulation text-left"
                >
                  <h3 className="break-words font-semibold text-gray-900">{event.name}</h3>
                  <p className="mt-1 break-words text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString()} • {event.venue}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                      {event.type}
                    </span>
                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                      {event.status}
                    </span>
                  </div>
                </button>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(event)}
                    disabled={deletingEventId === event.id}
                    className="inline-flex min-h-[36px] touch-manipulation items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Delete ${event.name}`}
                  >
                    <Trash2 size={16} />
                    {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <AddEventForm
            onClose={() => setShowForm(false)}
            onEventAdded={fetchEvents}
          />
        )}
      </div>
    </EcShell>
  )
}
