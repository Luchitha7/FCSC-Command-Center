import { useState } from 'react'
import EventDetails from './EventDetails'

// Mock event data - replace with API call once backend is ready
const mockEvent = {
  id: 1,
  title: 'Musical Night 2026',
  category: 'MUSICAL',
  status: 'ACTIVE',
  date: 'May 15, 2026',
  location: 'University Auditorium',
  attendees: 120,
  readiness: 68,
  description:
    'The Musical Night 2026 is our flagship cultural event of the year. Bringing together talented musicians, vocalists, and performers from across the campus, this night promises an eclectic mix of contemporary pop, classical compositions, and fusion rhythms. The event serves as a platform to celebrate student artistry and strengthen community bonds through the universal language of music.',
  organizers: [
    {
      id: 1,
      name: 'Kavindu P.',
      role: 'Lead Coordinator',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    },
    {
      id: 2,
      name: 'Nethmi F.',
      role: 'Logistics Lead',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    },
    {
      id: 3,
      name: 'Thisara W.',
      role: 'Technical Director',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    },
  ],
  rsvpCount: 120,
  rsvpTarget: 300,
  milestones: [
    {
      date: 'MARCH 10',
      title: 'Venue Booking Confirmed',
      description: 'Auditorium slots secured and deposit paid.',
      completed: true,
    },
    {
      date: 'APRIL 05',
      title: 'Auditions Completed',
      description: 'Selected 15 solo artists and 4 bands for the main setlist.',
      completed: true,
    },
    {
      date: 'APRIL 25',
      title: 'Ticket Sales Launch',
      description: 'Early bird tickets will be available on the portal.',
      completed: false,
    },
    {
      date: 'MAY 14',
      title: 'Dress Rehearsal',
      description: 'Final sound check and stage lighting setup.',
      completed: false,
    },
  ],
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null)

  if (selectedEvent) {
    return (
      <EventDetails
        event={selectedEvent}
        onBack={() => setSelectedEvent(null)}
      />
    )
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Events</h1>
      
      {/* Events List - temporary display */}
      <button
        onClick={() => setSelectedEvent(mockEvent)}
        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer w-full text-left"
      >
        <h3 className="font-semibold text-gray-900">{mockEvent.title}</h3>
        <p className="text-sm text-gray-600">{mockEvent.date} • {mockEvent.location}</p>
      </button>
    </main>
  )
}
