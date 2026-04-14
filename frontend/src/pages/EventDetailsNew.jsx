import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Calendar, MapPin, Users, CheckCircle, Clock, AlertCircle, Plus, Upload } from 'lucide-react'
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
  const [allProfiles, setAllProfiles] = useState([])
  const [announcementsList, setAnnouncementsList] = useState([])
  const [filesList, setFilesList] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [taskStatusSavingId, setTaskStatusSavingId] = useState(null)
  const [taskStatusError, setTaskStatusError] = useState(null)
  const [memberRole, setMemberRole] = useState('Member')
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [memberError, setMemberError] = useState(null)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)
  const [announcementError, setAnnouncementError] = useState(null)
  const [fileTitle, setFileTitle] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileInput, setFileInput] = useState(null)
  const [fileSubmitting, setFileSubmitting] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [extrasLoading, setExtrasLoading] = useState(true)

  const eventId = propEventId || paramEventId

  useEffect(() => {
    async function loadCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)
    }
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (eventId) {
      fetchEventData()
      fetchEventTasks()
      fetchProfiles()
      fetchEventFiles()
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
            .select('id, role, profile_id, user_id, profiles(id, full_name, avatar_url, email)')
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
                profileId: p?.id || row.profile_id || row.user_id || null,
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
                  profileId: uid || null,
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

  const fetchProfiles = async () => {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .order('full_name', { ascending: true })

    if (!fetchError) {
      setAllProfiles(data || [])
    }
  }

  const fetchEventFiles = async () => {
    const tableCandidates = ['event_files', 'files', 'attachments']

    for (const table of tableCandidates) {
      const { data, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (!fetchError) {
        setFilesList(
          (data || []).map((row, idx) => ({
            id: row.id || `${table}-${idx}`,
            name: row.name || row.file_name || row.filename || row.title || 'Untitled file',
            url: row.url || row.file_url || row.public_url || null,
            created_at: row.created_at || row.uploaded_at || row.updated_at || null,
          })),
        )
        return
      }
    }

    setFilesList([])
  }

  const toggleTaskDone = async (task, checked) => {
    const nextStatus = checked ? 'Completed' : 'In Progress'
    const previousStatus = task.status

    setTaskStatusSavingId(task.id)
    setTaskStatusError(null)
    setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)))

    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', task.id)

    if (updateError) {
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status: previousStatus } : item)))
      setTaskStatusError(updateError.message || 'Failed to update task status')
    }
    setTaskStatusSavingId(null)
  }

  const addMemberToEvent = async (e) => {
    e.preventDefault()
    if (!selectedMemberId) return

    setMemberSubmitting(true)
    setMemberError(null)
    try {
      const basePayload = { event_id: eventId, role: memberRole || 'Member' }
      let insertError = null

      const tryPayloads = [
        { ...basePayload, profile_id: selectedMemberId },
        { ...basePayload, user_id: selectedMemberId },
      ]

      for (const payload of tryPayloads) {
        const { error: err } = await supabase.from('event_members').insert(payload)
        if (!err) {
          const profile = allProfiles.find((p) => p.id === selectedMemberId)
          setOrganizers((prev) => [
            ...prev,
            {
              id: `new-${selectedMemberId}`,
              profileId: selectedMemberId,
              name: profile?.full_name?.trim() || profile?.email || 'Member',
              role: memberRole || 'Member',
              avatar: profile?.avatar_url || null,
            },
          ])
          setSelectedMemberId('')
          setMemberRole('Member')
          setMemberSubmitting(false)
          return
        }
        insertError = err
      }

      throw insertError || new Error('Could not add member')
    } catch (err) {
      setMemberError(err.message || 'Failed to add member')
    } finally {
      setMemberSubmitting(false)
    }
  }

  const addAnnouncement = async (e) => {
    e.preventDefault()
    if (!announcementTitle.trim()) return

    setAnnouncementSubmitting(true)
    setAnnouncementError(null)
    try {
      const basePayload = {
        event_id: eventId,
        title: announcementTitle.trim(),
      }
      if (currentUserId) basePayload.created_by = currentUserId

      const payloads = [
        { ...basePayload, body: announcementBody.trim() },
        { ...basePayload, content: announcementBody.trim() },
      ]

      let insertError = null
      for (const payload of payloads) {
        const { data, error: err } = await supabase.from('announcements').insert(payload).select('*').single()
        if (!err) {
          setAnnouncementsList((prev) => [data, ...prev])
          setAnnouncementTitle('')
          setAnnouncementBody('')
          setAnnouncementSubmitting(false)
          return
        }
        insertError = err
      }

      throw insertError || new Error('Could not add announcement')
    } catch (err) {
      setAnnouncementError(err.message || 'Failed to add announcement')
    } finally {
      setAnnouncementSubmitting(false)
    }
  }

  const addFile = async (e) => {
    e.preventDefault()
    if (!fileInput && !fileUrl.trim()) return

    setFileSubmitting(true)
    setFileError(null)
    try {
      let resolvedUrl = fileUrl.trim()
      const resolvedTitle = fileTitle.trim() || fileInput?.name || 'Event file'

      if (fileInput) {
        const storagePath = `${eventId}/${Date.now()}-${fileInput.name}`
        const { error: uploadError } = await supabase.storage.from('event-files').upload(storagePath, fileInput)
        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('event-files').getPublicUrl(storagePath)
        resolvedUrl = publicData?.publicUrl || ''
      }

      const tableCandidates = ['event_files', 'files', 'attachments']
      const payloads = [
        { event_id: eventId, name: resolvedTitle, url: resolvedUrl },
        { event_id: eventId, file_name: resolvedTitle, file_url: resolvedUrl },
        { event_id: eventId, title: resolvedTitle, url: resolvedUrl },
      ]

      let inserted = false
      let lastError = null

      for (const table of tableCandidates) {
        for (const payload of payloads) {
          const { error: err } = await supabase.from(table).insert(payload)
          if (!err) {
            inserted = true
            break
          }
          lastError = err
        }
        if (inserted) break
      }

      if (!inserted) throw lastError || new Error('Could not save file metadata')

      setFilesList((prev) => [
        {
          id: `new-${Date.now()}`,
          name: resolvedTitle,
          url: resolvedUrl || null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      setFileTitle('')
      setFileUrl('')
      setFileInput(null)
    } catch (err) {
      setFileError(err.message || 'Failed to add file')
    } finally {
      setFileSubmitting(false)
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
      <div className="min-h-screen overflow-x-hidden p-4 sm:p-6">
        <p className="text-gray-600">Loading event...</p>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen overflow-x-hidden p-4 sm:p-6">
        <p className="text-red-600">Error: {error || 'Event not found'}</p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-4 touch-manipulation text-indigo-600 hover:text-indigo-700"
        >
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
  const existingMemberIds = new Set(organizers.map((o) => o.profileId).filter(Boolean))
  const availableProfiles = allProfiles.filter((profile) => !existingMemberIds.has(profile.id))

  const rsvpCount = eventData.rsvp_count ?? eventData.attendee_count
  const rsvpTarget = eventData.rsvp_target ?? eventData.expected_attendees ?? eventData.capacity

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <div className="relative min-h-[14rem] bg-gradient-to-r from-purple-600 to-purple-800 pb-8 sm:h-64 sm:pb-0">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-3 top-3 z-10 flex touch-manipulation items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition hover:bg-white/20 sm:left-4 sm:top-4"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="absolute inset-0 opacity-30">
          <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-purple-500 blur-3xl sm:right-20 sm:h-32 sm:w-32"></div>
          <div className="absolute bottom-6 left-4 h-28 w-28 rounded-full bg-purple-700 blur-3xl sm:bottom-10 sm:left-10 sm:h-40 sm:w-40"></div>
        </div>

        <div className="relative px-4 pb-6 pt-16 sm:px-6 sm:pt-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
                <span className="inline-block rounded-full bg-purple-500 px-2.5 py-1 text-xs font-semibold text-white sm:px-3">
                  {eventData.type}
                </span>
                <span className="inline-block rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white sm:px-3">
                  {eventData.status}
                </span>
              </div>
              <h1 className="mb-3 break-words text-2xl font-bold text-white sm:mb-4 sm:text-3xl lg:text-4xl">
                {eventData.name}
              </h1>
              <div className="flex flex-col gap-3 text-sm text-white sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 sm:text-base">
                <div className="flex min-w-0 items-center gap-2">
                  <Calendar className="shrink-0" size={18} />
                  <span className="break-words">{eventDate}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="shrink-0" size={18} />
                  <span className="break-words">{eventData.venue}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Users className="shrink-0" size={18} />
                  <span>{memberLabel}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditForm(true)}
              className="w-full touch-manipulation rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto sm:self-start sm:px-6"
            >
              Manage Event
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
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

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="space-y-6 sm:space-y-8 lg:col-span-2">
            {activeTab === 'overview' && (
              <>
                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Event Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {eventData.description || 'No description provided.'}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 sm:mb-6 sm:text-xl">Milestone Timeline</h2>
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
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Tasks</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddTaskForm(true)}
                    className="inline-flex touch-manipulation items-center justify-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white transition hover:bg-indigo-700 sm:py-1"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-gray-600">No tasks yet. Create one to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {taskStatusError && <p className="text-sm text-red-600">{taskStatusError}</p>}
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      >
                        <div className="mt-0.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-emerald-600"
                            checked={task.status === 'Completed'}
                            disabled={taskStatusSavingId === task.id}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => toggleTaskDone(task, e.target.checked)}
                            aria-label={`Mark ${task.title} as done`}
                          />
                          {task.status === 'Completed' && <CheckCircle className="text-green-500" size={20} />}
                          {task.status === 'In Progress' && <Clock className="text-blue-500" size={20} />}
                          {task.status === 'Not Started' && <AlertCircle className="text-gray-400" size={20} />}
                        </div>
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
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Members</h2>
                <form onSubmit={addMemberToEvent} className="mb-5 space-y-3 rounded-lg border border-gray-200 p-3 sm:p-4">
                  {memberError && <p className="text-sm text-red-600">{memberError}</p>}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2"
                    >
                      <option value="">Select member</option>
                      {availableProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.full_name || profile.email || 'Unnamed user'}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Role"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={memberSubmitting || !selectedMemberId}
                    className="inline-flex touch-manipulation items-center justify-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {memberSubmitting ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
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
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Files</h2>
                <form onSubmit={addFile} className="mb-5 space-y-3 rounded-lg border border-gray-200 p-3 sm:p-4">
                  {fileError && <p className="text-sm text-red-600">{fileError}</p>}
                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="File title (optional)"
                  />
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Or paste file URL"
                  />
                  <input
                    type="file"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={fileSubmitting || (!fileInput && !fileUrl.trim())}
                    className="inline-flex touch-manipulation items-center justify-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    <Upload size={16} />
                    {fileSubmitting ? 'Adding file...' : 'Add File'}
                  </button>
                </form>

                {filesList.length === 0 ? (
                  <p className="text-gray-600">No files added yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {filesList.map((file) => (
                      <li key={file.id} className="rounded-lg border border-gray-200 p-3">
                        <p className="font-medium text-gray-900">{file.name}</p>
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block break-all text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            Open file
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">No public URL available</p>
                        )}
                        {file.created_at && (
                          <p className="mt-1 text-xs text-gray-400">{new Date(file.created_at).toLocaleString()}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Announcements</h2>
                <form
                  onSubmit={addAnnouncement}
                  className="mb-5 space-y-3 rounded-lg border border-gray-200 p-3 sm:p-4"
                >
                  {announcementError && <p className="text-sm text-red-600">{announcementError}</p>}
                  <input
                    type="text"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    placeholder="What should everyone know?"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={announcementSubmitting || !announcementTitle.trim()}
                    className="inline-flex touch-manipulation items-center justify-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {announcementSubmitting ? 'Posting...' : 'Post Announcement'}
                  </button>
                </form>
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

          <div className="space-y-6 lg:space-y-6">
            <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">Organizers</h3>
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
