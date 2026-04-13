import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddEventForm from '../components/event/AddEventForm'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

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

  return (
    <main className="mx-auto min-h-screen max-w-4xl overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Events</h1>
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
            <button
              key={event.id}
              type="button"
              onClick={() => handleEventClick(event.id)}
              className="w-full cursor-pointer rounded-lg bg-white p-4 text-left shadow-sm transition hover:shadow-md touch-manipulation"
            >
              <h3 className="break-words font-semibold text-gray-900">{event.name}</h3>
              <p className="mt-1 break-words text-sm text-gray-600">
                {new Date(event.date).toLocaleDateString()} • {event.venue}
              </p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {event.type}
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  {event.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <AddEventForm
          onClose={() => setShowForm(false)}
          onEventAdded={fetchEvents}
        />
      )}
    </main>
  )
}
