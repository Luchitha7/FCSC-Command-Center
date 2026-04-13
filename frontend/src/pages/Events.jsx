import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
    <main className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Events</h1>

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
              onClick={() => handleEventClick(event.id)}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer w-full text-left"
            >
              <h3 className="font-semibold text-gray-900">{event.name}</h3>
              <p className="text-sm text-gray-600">
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
    </main>
  )
}
