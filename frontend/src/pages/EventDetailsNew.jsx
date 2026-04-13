import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Calendar, MapPin, Users, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EditEventForm from '../components/event/EditEventForm'
import AddTaskForm from '../components/task/AddTaskForm'
import EditTaskForm from '../components/task/EditTaskForm'

export default function EventDetails({ eventId: propEventId, onBack }) {
  const { id: paramEventId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [eventData, setEventData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [tasks, setTasks] = useState([])
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  const [milestones, setMilestones] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [announcementsList, setAnnouncementsList] = useState([])
  const [extrasLoading, setExtrasLoading] = useState(true)

  const eventId = propEventId || paramEventId

  useEffect(() => {
    if (eventId) {
      fetchEventData()
      fetchEventTasks()
    }
    // Only reload when navigating to another event
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    let cancelled = false

    async function loadExtras() {
      setExtrasLoading(true)
      try {
        const [mRes, memRes, annRes] = await Promise.all([
          supabase.from('milestones').select('*').eq('event_id', eventId).order('due_date', { ascending: true }),
          supabase
            .from('event_members')
            .select('id, role, profiles(full_name, avatar_url, email)')
            .eq('event_id', eventId),
          supabase
            .from('announcements')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false }),
        ])

        if (cancelled) return

        if (!mRes.error && mRes.data) setMilestones(mRes.data)
        else setMilestones([])

        if (!memRes.error && memRes.data?.length) {
          setOrganizers(
            memRes.data.map((row) => {
              const p = row.profiles
              return {
                id: row.id,
                name: p?.full_name?.trim() || p?.email || 'Member',
                role: row.role || 'Member',
                avatar: p?.avatar_url || null,
              }
            }),
          )
        } else if (memRes.error) {
          const raw = await supabase.from('event_members').select('*').eq('event_id', eventId)
          const rows = raw.data || []
          const ids = [...new Set(rows.map((r) => r.user_id || r.profile_id).filter(Boolean))]
          let byId = {}
          if (ids.length) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, email')
              .in('id', ids)
            byId = Object.fromEntries((profs || []).map((p) => [p.id, p]))
          }
          if (!cancelled) {
            setOrganizers(
              rows.map((r) => {
                const uid = r.user_id || r.profile_id
                const p = byId[uid]
                return {
                  id: r.id,
                  name: p?.full_name?.trim() || p?.email || 'Member',
                  role: r.role || 'Member',
                  avatar: p?.avatar_url || null,
                }
              }),
            )
          }
        } else {
          setOrganizers([])
        }

        if (!annRes.error && annRes.data) setAnnouncementsList(annRes.data)
        else setAnnouncementsList([])
      } catch (e) {
        console.error('Event extras:', e)
        if (!cancelled) {
          setMilestones([])
          setOrganizers([])
          setAnnouncementsList([])
        }
      } finally {
        if (!cancelled) setExtrasLoading(false)
      }
    }

    loadExtras()
    return () => {
      cancelled = true
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase.from('events').select('*').eq('id', eventId).single()

      if (fetchError) throw fetchError
      setEventData(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching event:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchEventTasks = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (fetchError) throw fetchError
      setTasks(data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (paramEventId) {
      navigate('/events')
    }
  }

  const readiness = useMemo(() => {
    if (!tasks.length) return 0
    const done = tasks.filter((t) => t.status === 'Completed').length
    return Math.round((done / tasks.length) * 100)
  }, [tasks])

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

  const memberLabel =
    organizers.length > 0
      ? `${organizers.length} team ${organizers.length === 1 ? 'member' : 'members'}`
      : extrasLoading
        ? '…'
        : 'No members yet'

  const rsvpCount = eventData.rsvp_count ?? eventData.attendee_count
  const rsvpTarget = eventData.rsvp_target ?? eventData.expected_attendees ?? eventData.capacity

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-64 bg-gradient-to-r from-purple-600 to-purple-800 overflow-hidden">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 text-white hover:bg-white/20 px-3 py-2 rounded-lg transition"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-20 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-700 rounded-full blur-3xl"></div>
        </div>

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
              <div className="flex flex-wrap items-center gap-6 text-white">
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
                  <span>{memberLabel}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowEditForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Manage Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">OVERALL READINESS</h3>
            <span className="text-lg font-bold text-indigo-600">{readiness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readiness}%` }}
            ></div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Event Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {eventData.description || 'No description provided.'}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900">Milestone Timeline</h2>
                  {extrasLoading && <p className="text-gray-600 text-sm">Loading milestones…</p>}
                  {!extrasLoading && milestones.length === 0 && (
                    <p className="text-gray-600 text-sm">No milestones for this event yet.</p>
                  )}
                  {!extrasLoading && milestones.length > 0 && (
                    <div className="space-y-6">
                      {milestones.map((milestone, idx) => {
                        const done = milestone.completed === true || milestone.is_completed === true
                        const rawDate = milestone.due_date || milestone.target_date
                        const dateLabel =
                          rawDate && !Number.isNaN(new Date(rawDate).getTime())
                            ? format(new Date(rawDate), 'MMMM d').toUpperCase()
                            : 'TBD'
                        return (
                          <div key={milestone.id ?? idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full ${done ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              {idx < milestones.length - 1 && (
                                <div className="w-1 bg-gray-200 flex-1 my-2" style={{ minHeight: '60px' }}></div>
                              )}
                            </div>
                            <div className="pb-6">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{dateLabel}</p>
                              <h3 className="text-lg font-semibold text-gray-900 mt-1">{milestone.title}</h3>
                              <p className="text-sm text-gray-600 mt-2">{milestone.description || ''}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
                  <button
                    onClick={() => setShowAddTaskForm(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-gray-600">No tasks yet. Create one to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <button type="button" onClick={() => setSelectedTask(task)} className="mt-1">
                          {task.status === 'Completed' && <CheckCircle className="text-green-500" size={20} />}
                          {task.status === 'In Progress' && <Clock className="text-blue-500" size={20} />}
                          {task.status === 'Not Started' && <AlertCircle className="text-gray-400" size={20} />}
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                task.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'Medium'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                task.status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : task.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {task.status}
                            </span>
                            {task.due_date && (
                              <span className="text-xs text-gray-600">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Members</h2>
                {extrasLoading && <p className="text-gray-600">Loading…</p>}
                {!extrasLoading && organizers.length === 0 && (
                  <p className="text-gray-600">No members assigned to this event yet.</p>
                )}
                {!extrasLoading && organizers.length > 0 && (
                  <ul className="divide-y divide-gray-200">
                    {organizers.map((o, i) => (
                      <li key={i} className="flex items-center gap-3 py-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-sm font-semibold">
                          {o.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{o.name}</p>
                          <p className="text-xs text-gray-500 uppercase">{o.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Files</h2>
                <p className="text-gray-600">File attachments are not configured in this build.</p>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Announcements</h2>
                {extrasLoading && <p className="text-gray-600">Loading…</p>}
                {!extrasLoading && announcementsList.length === 0 && (
                  <p className="text-gray-600">No announcements for this event.</p>
                )}
                {!extrasLoading && announcementsList.length > 0 && (
                  <ul className="space-y-4">
                    {announcementsList.map((a) => (
                      <li key={a.id} className="border-b border-gray-100 pb-4 last:border-0">
                        <p className="font-semibold text-gray-900">{a.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{a.body ?? a.content}</p>
                        {(a.created_at || a.published_at) && (
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(a.created_at || a.published_at).toLocaleString()}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Organizers</h3>
              {extrasLoading && <p className="text-gray-600 text-sm">Loading…</p>}
              {!extrasLoading && organizers.length === 0 && (
                <p className="text-gray-600 text-sm">No organizers listed.</p>
              )}
              {!extrasLoading && organizers.length > 0 && (
                <div className="space-y-4">
                  {organizers.map((organizer, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {organizer.avatar ? (
                        <img
                          src={organizer.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-xs font-bold">
                          {organizer.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{organizer.name}</p>
                        <p className="text-xs text-gray-600 uppercase">{organizer.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(rsvpCount != null || rsvpTarget != null) && (
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-lg shadow-sm text-white">
                <h3 className="text-sm font-semibold mb-2 opacity-90">RSVP</h3>
                <p className="text-4xl font-bold mb-1">{rsvpCount ?? '—'}</p>
                {rsvpTarget != null && (
                  <p className="text-xs uppercase opacity-75">Target: {rsvpTarget}</p>
                )}
              </div>
            )}
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

      {showAddTaskForm && (
        <AddTaskForm
          eventId={eventId}
          onClose={() => setShowAddTaskForm(false)}
          onTaskAdded={() => {
            fetchEventTasks()
            setShowAddTaskForm(false)
          }}
        />
      )}

      {selectedTask && (
        <EditTaskForm
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchEventTasks()
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
