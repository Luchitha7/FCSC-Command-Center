import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Calendar, MapPin, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EditEventForm from '../components/EditEventForm'

// Mock data for organizers, milestones (until we create separate tables)
const mockOrganizers = [
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
]

const mockMilestones = [
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
]

export default function EventDetails({ eventId: propEventId, onBack }) {
  const { id: paramEventId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const eventId = propEventId || paramEventId

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (fetchError) throw fetchError
      setEventData(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (paramEventId) {
      navigate('/events')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading event...</p>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error: {error || 'Event not found'}</p>
        <button onClick={handleBack} className="text-indigo-600 mt-4 hover:text-indigo-700">
          ← Go back
        </button>
      </div>
    )
  }

  const tabs = ['overview', 'tasks', 'members', 'files', 'announcements']
  const eventDate = new Date(eventData.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative h-64 bg-gradient-to-r from-purple-600 to-purple-800 overflow-hidden">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white hover:bg-white/20 px-3 py-2 rounded-lg transition"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-700 rounded-full blur-3xl"></div>
        </div>

        {/* Content overlay */}
        <div className="relative pt-24 px-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                  {eventData.type}
                </span>
                <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  {eventData.status}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">{eventData.name}</h1>
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{eventDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>{eventData.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span>TBD Confirmed</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowEditForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition">
              Manage Event
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">OVERALL READINESS</h3>
            <span className="text-lg font-bold text-indigo-600">68%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: '68%' }}></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 capitalize font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Event Description */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Event Description</h2>
                  <p className="text-gray-600 leading-relaxed">{eventData.description}</p>
                </div>

                {/* Milestone Timeline */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900">Milestone Timeline</h2>
                  <div className="space-y-6">
                    {mockMilestones.map((milestone, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          ></div>
                          {idx < mockMilestones.length - 1 && (
                            <div className="w-1 bg-gray-200 flex-1 my-2" style={{ minHeight: '60px' }}></div>
                          )}
                        </div>
                        <div className="pb-6">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {milestone.date}
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900 mt-1">{milestone.title}</h3>
                          <p className="text-sm text-gray-600 mt-2">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Tasks</h2>
                <p className="text-gray-600">Tasks will be displayed here</p>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Members</h2>
                <p className="text-gray-600">Members will be displayed here</p>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Files</h2>
                <p className="text-gray-600">Files will be displayed here</p>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Announcements</h2>
                <p className="text-gray-600">Announcements will be displayed here</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-6">
            {/* Organizers Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Organizers</h3>
              <div className="space-y-4">
                {mockOrganizers.map((organizer, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={organizer.avatar}
                      alt={organizer.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{organizer.name}</p>
                      <p className="text-xs text-gray-600 uppercase">{organizer.role}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-indigo-600 text-sm font-semibold hover:text-indigo-700">
                View All Team →
              </button>
            </div>

            {/* RSVP Count Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-lg shadow-sm text-white">
              <h3 className="text-sm font-semibold mb-2 opacity-90">RSVP Count</h3>
              <p className="text-4xl font-bold mb-1">120</p>
              <p className="text-xs uppercase opacity-75">Target: 300 Seats</p>
              <div className="mt-4 flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-white/30 border border-white/50"
                  ></div>
                ))}
              </div>
            </div>
          </div>

      {showEditForm && (
        <EditEventForm
          event={eventData}
          onClose={() => setShowEditForm(false)}
          onEventUpdated={() => {
            fetchEventData()
            setShowEditForm(false)
          }}
        />
      )}
        </div>
      </div>
    </div>
  )
}
