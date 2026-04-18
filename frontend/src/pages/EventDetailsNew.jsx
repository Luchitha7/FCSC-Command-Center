import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronLeft, Calendar, MapPin, Users, CheckCircle, Clock, AlertCircle, Plus, Upload, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import EditEventForm from '../components/event/EditEventForm'
import AddTaskForm from '../components/task/AddTaskForm'
import EditTaskForm from '../components/task/EditTaskForm'
import { mergeTasksWithSubtasks, normalizeSubtasks, serializeSubtasksForDb } from '../lib/taskSubtasks'

export default function EventDetails({ eventId: propEventId, onBack }) {
  const { id: paramEventId } = useParams()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview')
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
  const [subtasksSavingTaskId, setSubtasksSavingTaskId] = useState(null)
  const [taskStatusError, setTaskStatusError] = useState(null)
  const [memberName, setMemberName] = useState('')
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [memberActionId, setMemberActionId] = useState(null)
  const [memberError, setMemberError] = useState(null)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false)
  const [announcementActionId, setAnnouncementActionId] = useState(null)
  const [announcementEditingId, setAnnouncementEditingId] = useState(null)
  const [announcementEditTitle, setAnnouncementEditTitle] = useState('')
  const [announcementEditBody, setAnnouncementEditBody] = useState('')
  const [announcementError, setAnnouncementError] = useState(null)
  const [fileTitle, setFileTitle] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileInput, setFileInput] = useState(null)
  const [fileSubmitting, setFileSubmitting] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [extrasLoading, setExtrasLoading] = useState(true)
  const [eventHeadPoint, setEventHeadPoint] = useState('')
  const [eventHeadDraft, setEventHeadDraft] = useState('')
  const [eventHeadSaving, setEventHeadSaving] = useState(false)
  const [eventHeadError, setEventHeadError] = useState(null)
  const memberRoleOptions = ['Member', 'Lead', 'Coordinator', 'Volunteer']

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
        const [mRes, annRes] = await Promise.all([
          supabase.from('milestones').select('*').eq('event_id', eventId).order('due_date', { ascending: true }),
          supabase
            .from('announcements')
            .select('*, profiles:posted_by(id, full_name, email, avatar_url)')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false }),
        ])

        if (cancelled) return

        if (!mRes.error && mRes.data) {
          setMilestones(mRes.data)
        } else {
          setMilestones([])
        }

        if (annRes.error) {
          console.error('Error fetching announcements:', annRes.error)
          // Try fetching without the profile join as fallback
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('announcements')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
          
          if (fallbackError) {
            console.error('Fallback announcement fetch failed:', fallbackError)
            setAnnouncementsList([])
          } else {
            setAnnouncementsList(fallbackData || [])
          }
        } else if (annRes.data) {
          setAnnouncementsList(annRes.data)
        } else {
          setAnnouncementsList([])
        }
      } catch (e) {
        console.error('Event extras error:', e)
        if (!cancelled) {
          setMilestones([])
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

  // Load members from event_members column whenever eventData changes
  useEffect(() => {
    if (!eventData?.event_members) {
      setOrganizers([])
      return
    }

    try {
      const membersList = typeof eventData.event_members === 'string' 
        ? JSON.parse(eventData.event_members) 
        : eventData.event_members
      
      if (Array.isArray(membersList)) {
        setOrganizers(
          membersList.map((name, idx) => ({
            id: `member-${idx}`,
            profileId: null,
            name: name,
            role: 'Member',
            avatar: null,
          }))
        )
      } else {
        setOrganizers([])
      }
    } catch (e) {
      console.error('Error parsing members:', e)
      setOrganizers([])
    }
  }, [eventData?.event_members])

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

  useEffect(() => {
    if (!eventId) return
    const fromEvent =
      eventData?.event_head_point ||
      eventData?.head_point ||
      eventData?.event_head ||
      eventData?.point_of_contact ||
      ''
    if (fromEvent) {
      setEventHeadPoint(fromEvent)
      setEventHeadDraft(fromEvent)
      return
    }

    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(`fcsc_event_head_point_${eventId}`) || ''
      setEventHeadPoint(stored)
      setEventHeadDraft(stored)
    }
  }, [eventData, eventId])

  const fetchEventTasks = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('event_id', eventId)
        .order('due_date', { ascending: true, nullsFirst: false })

      if (fetchError) throw fetchError
      setTasks(mergeTasksWithSubtasks(data || []))
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

  const fetchAnnouncements = async () => {
    try {
      setExtrasLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*, profiles:posted_by(id, full_name, email, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching announcements:', error)
        // Try without profile join
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('announcements')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
        
        if (fallbackError) {
          console.error('Fallback failed:', fallbackError)
          setAnnouncementsList([])
        } else {
          setAnnouncementsList(fallbackData || [])
        }
      } else {
        setAnnouncementsList(data || [])
      }
    } catch (err) {
      console.error('Error in fetchAnnouncements:', err)
      setAnnouncementsList([])
    } finally {
      setExtrasLoading(false)
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

  const toggleSubtaskDoneInList = async (task, subtaskId) => {
    const list = Array.isArray(task.subtasks) ? task.subtasks : []
    const previous = normalizeSubtasks(list)
    const next = previous.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s))
    const payload = serializeSubtasksForDb(next)

    setSubtasksSavingTaskId(task.id)
    setTaskStatusError(null)
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, subtasks: normalizeSubtasks(next) } : item)),
    )

    const { error: updateError } = await supabase.from('tasks').update({ subtasks: payload }).eq('id', task.id)

    if (updateError) {
      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, subtasks: previous } : item)),
      )
      setTaskStatusError(updateError.message || 'Failed to update subtasks')
    }
    setSubtasksSavingTaskId(null)
  }

  const addMemberToEvent = async (e) => {
    e.preventDefault()
    if (!memberName.trim()) return

    setMemberSubmitting(true)
    setMemberError(null)
    try {
      // Get current members list
      let currentMembers = []
      if (eventData?.event_members) {
        try {
          currentMembers = typeof eventData.event_members === 'string'
            ? JSON.parse(eventData.event_members)
            : eventData.event_members
        } catch (e) {
          currentMembers = []
        }
      }

      // Add new member
      const updatedMembers = [...currentMembers, memberName.trim()]

      // Update events table
      const { error: updateError } = await supabase
        .from('events')
        .update({ event_members: JSON.stringify(updatedMembers) })
        .eq('id', eventId)

      if (updateError) throw updateError

      // Update local state
      setEventData((prev) => ({
        ...prev,
        event_members: JSON.stringify(updatedMembers),
      }))

      setOrganizers((prev) => [
        ...prev,
        {
          id: `member-${Date.now()}`,
          profileId: null,
          name: memberName.trim(),
          role: 'Member',
          avatar: null,
        },
      ])
      setMemberName('')
    } catch (err) {
      setMemberError(err.message || 'Failed to add member')
    } finally {
      setMemberSubmitting(false)
    }
  }

  const updateMemberRole = async (member, nextRole) => {
    // Roles are stored locally in organizers state only
    const normalizedRole = nextRole.trim()
    if (!member?.id || !normalizedRole || normalizedRole === member.role) return

    const previousRole = member.role
    setMemberActionId(member.id)
    setMemberError(null)
    setOrganizers((prev) => prev.map((item) => (item.id === member.id ? { ...item, role: normalizedRole } : item)))

    // Note: Roles are not persisted to database in this implementation
    // If you need to persist roles, add a separate 'event_members_roles' column
    setMemberActionId(null)
  }

  const removeMemberFromEvent = async (member) => {
    if (!member?.id || !member?.name) return
    if (!window.confirm(`Remove ${member.name} from this event?`)) return

    const previousMembers = organizers
    setMemberActionId(member.id)
    setMemberError(null)
    setOrganizers((prev) => prev.filter((item) => item.id !== member.id))

    try {
      // Get current members list
      let currentMembers = []
      if (eventData?.event_members) {
        try {
          currentMembers = typeof eventData.event_members === 'string'
            ? JSON.parse(eventData.event_members)
            : eventData.event_members
        } catch (e) {
          currentMembers = []
        }
      }

      // Remove the member
      const updatedMembers = currentMembers.filter((m) => m !== member.name)

      // Update events table
      const { error: deleteError } = await supabase
        .from('events')
        .update({ event_members: JSON.stringify(updatedMembers) })
        .eq('id', eventId)

      if (deleteError) throw deleteError

      // Update local state
      setEventData((prev) => ({
        ...prev,
        event_members: JSON.stringify(updatedMembers),
      }))
    } catch (err) {
      setOrganizers(previousMembers)
      setMemberError(err.message || 'Failed to remove member')
    }
    setMemberActionId(null)
  }

  const addAnnouncement = async (e) => {
    e.preventDefault()
    if (!announcementTitle.trim()) return

    setAnnouncementSubmitting(true)
    setAnnouncementError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const authorId = user?.id || currentUserId
      if (!authorId) {
        throw new Error('You must be logged in to post announcements')
      }

      const payload = {
        event_id: eventId,
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
        posted_by: authorId,
      }

      const { error: insertError } = await supabase.from('announcements').insert(payload)
      if (insertError) throw insertError

      // Fetch the newly added announcement with profile data
      const { data: newAnnouncements, error: fetchError } = await supabase
        .from('announcements')
        .select('*, profiles:posted_by(id, full_name, email, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (!fetchError && newAnnouncements && newAnnouncements.length > 0) {
        setAnnouncementsList((prev) => [newAnnouncements[0], ...prev])
      }

      setAnnouncementTitle('')
      setAnnouncementBody('')
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
  const assigneeNameById = Object.fromEntries(
    allProfiles.map((profile) => [profile.id, profile.full_name || profile.email || 'Unknown']),
  )

  const rsvpCount = eventData.rsvp_count ?? eventData.attendee_count
  const rsvpTarget = eventData.rsvp_target ?? eventData.expected_attendees ?? eventData.capacity
  const eventHeadNameForPreview = eventHeadDraft.trim() || eventHeadPoint.trim()
  const eventHeadInitials = eventHeadNameForPreview
    ? eventHeadNameForPreview
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HP'
  const canManageAnnouncements = (() => {
    if (!currentUserId) return false
    // Check if user is the event creator
    if (eventData?.created_by && eventData.created_by === currentUserId) return true
    // Check if user is in organizers with elevated role
    // Match by profileId first, then by name if profileId is null
    const myMembership = organizers.find((member) => 
      member.profileId === currentUserId || 
      (member.profileId === null && allProfiles.some(p => p.id === currentUserId && p.full_name === member.name))
    )
    const elevatedRoles = new Set(['Lead', 'Coordinator', 'Organizer', 'Admin', 'Owner'])
    return elevatedRoles.has(myMembership?.role || '')
  })()

  const beginAnnouncementEdit = (announcement) => {
    setAnnouncementError(null)
    setAnnouncementEditingId(announcement.id)
    setAnnouncementEditTitle(announcement.title || '')
    setAnnouncementEditBody(announcement.body ?? announcement.content ?? '')
  }

  const cancelAnnouncementEdit = () => {
    setAnnouncementEditingId(null)
    setAnnouncementEditTitle('')
    setAnnouncementEditBody('')
  }

  const saveAnnouncementEdit = async (announcementId) => {
    const nextTitle = announcementEditTitle.trim()
    const nextBody = announcementEditBody.trim()
    if (!nextTitle) {
      setAnnouncementError('Announcement title is required')
      return
    }

    setAnnouncementActionId(announcementId)
    setAnnouncementError(null)
    try {
      const { data: updatedRecord, error: updateError } = await supabase
        .from('announcements')
        .update({ title: nextTitle, body: nextBody })
        .eq('id', announcementId)
        .select('*')
        .single()

      if (updateError) throw updateError

      setAnnouncementsList((prev) => prev.map((a) => (a.id === announcementId ? updatedRecord : a)))
      cancelAnnouncementEdit()
    } catch (err) {
      setAnnouncementError(err.message || 'Failed to update announcement')
    } finally {
      setAnnouncementActionId(null)
    }
  }

  const deleteAnnouncement = async (announcement) => {
    if (!announcement?.id) return
    if (!window.confirm(`Delete "${announcement.title}"?`)) return

    const previous = announcementsList
    setAnnouncementActionId(announcement.id)
    setAnnouncementError(null)
    setAnnouncementsList((prevList) => prevList.filter((item) => item.id !== announcement.id))

    const { error: deleteError } = await supabase.from('announcements').delete().eq('id', announcement.id)
    if (deleteError) {
      setAnnouncementsList(previous)
      setAnnouncementError(deleteError.message || 'Failed to delete announcement')
    }
    if (announcementEditingId === announcement.id) cancelAnnouncementEdit()
    setAnnouncementActionId(null)
  }

  const saveEventHeadPoint = async () => {
    const nextName = eventHeadDraft.trim()
    setEventHeadSaving(true)
    setEventHeadError(null)
    try {
      const columnCandidates = ['event_head_point', 'head_point', 'event_head', 'point_of_contact']
      let savedToDb = false
      let lastError = null

      for (const column of columnCandidates) {
        const { error: updateError } = await supabase.from('events').update({ [column]: nextName || null }).eq('id', eventId)
        if (!updateError) {
          savedToDb = true
          setEventData((prev) => (prev ? { ...prev, [column]: nextName || null } : prev))
          break
        }
        lastError = updateError
      }

      // Fallback if DB schema does not yet include a dedicated column.
      if (!savedToDb && typeof window !== 'undefined') {
        window.localStorage.setItem(`fcsc_event_head_point_${eventId}`, nextName)
      }

      if (!savedToDb && lastError && typeof window === 'undefined') {
        throw lastError
      }

      setEventHeadPoint(nextName)
    } catch (err) {
      setEventHeadError(err.message || 'Failed to save Event Head Point')
    } finally {
      setEventHeadSaving(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 pb-14">
        <button
          type="button"
          onClick={handleBack}
          className="absolute left-3 top-3 z-10 flex touch-manipulation items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur transition hover:bg-white/20 sm:left-6 sm:top-6"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <div className="absolute inset-0 opacity-40">
          <div className="absolute right-12 top-12 h-32 w-32 rounded-full bg-indigo-400 blur-3xl sm:right-28 sm:h-44 sm:w-44"></div>
          <div className="absolute bottom-8 left-6 h-36 w-36 rounded-full bg-purple-500 blur-3xl sm:bottom-12 sm:left-16 sm:h-52 sm:w-52"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-20 sm:px-6 sm:pt-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
                <span className="inline-block rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-xs font-semibold text-white sm:px-3">
                  {eventData.type}
                </span>
                <span className="inline-block rounded-full border border-emerald-200/30 bg-emerald-500/80 px-2.5 py-1 text-xs font-semibold text-white sm:px-3">
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
              className="w-full touch-manipulation rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 sm:w-auto sm:self-start sm:px-6"
            >
              Manage Event
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-7 max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-lg shadow-indigo-100/40 sm:mb-8 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Overall Readiness</h3>
            <span className="text-lg font-bold text-indigo-600">{readiness}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${readiness}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-3 py-2 capitalize text-sm font-semibold transition whitespace-nowrap sm:px-4 ${
                  activeTab === tab
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Event Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {eventData.description || 'No description provided.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
                    {tasks.map((task) => {
                      const subList = Array.isArray(task.subtasks) ? task.subtasks : []
                      const previewLimit = 5
                      const preview = subList.slice(0, previewLimit)
                      const hiddenCount = Math.max(0, subList.length - preview.length)
                      return (
                        <div
                          key={task.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedTask(task)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedTask(task)
                              }
                            }}
                            className="flex cursor-pointer gap-3 text-left"
                          >
                            <div className="flex shrink-0 items-start gap-2 pt-0.5">
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
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900">{task.title}</h3>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
                                <span className="text-xs text-gray-600">
                                  Assignee:{' '}
                                  {task.assigned_to ? assigneeNameById[task.assigned_to] || 'Unknown' : 'Unassigned'}
                                </span>
                                {subList.length > 0 && (
                                  <span className="text-xs text-gray-600">
                                    Subtasks: {subList.filter((item) => item.done === true).length}/{subList.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {subList.length > 0 && (
                            <div className="mt-3 border-t border-slate-200/80 pt-3" onClick={(e) => e.stopPropagation()}>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Subtasks
                              </p>
                              <ul className="space-y-2">
                                {preview.map((st) => (
                                  <li key={st.id} className="flex gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                                      checked={st.done === true}
                                      disabled={subtasksSavingTaskId === task.id}
                                      onChange={() => toggleSubtaskDoneInList(task, st.id)}
                                      aria-label={`Toggle ${st.title}`}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className={`font-medium ${st.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                      >
                                        {st.title}
                                      </span>
                                      {st.description ? (
                                        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
                                          {st.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              {hiddenCount > 0 ? (
                                <p className="mt-2 text-xs text-slate-500">
                                  +{hiddenCount} more — click the task to edit
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Members</h2>
                <form onSubmit={addMemberToEvent} className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                  {memberError && <p className="text-sm text-red-600">{memberError}</p>}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Enter member name"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={memberSubmitting || !memberName.trim()}
                      className="inline-flex touch-manipulation items-center justify-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60 w-full sm:w-auto"
                    >
                      {memberSubmitting ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
                {extrasLoading && <p className="text-gray-600">Loading…</p>}
                {!extrasLoading && organizers.length === 0 && (
                  <p className="text-gray-600">No members assigned to this event yet.</p>
                )}
                {!extrasLoading && organizers.length > 0 && (
                  <ul className="divide-y divide-gray-200">
                    {organizers.map((o, i) => (
                      <li key={o.id ?? i} className="flex items-start gap-3 py-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-sm font-semibold">
                          {o.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{o.name}</p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              value={o.role || 'Member'}
                              disabled={memberActionId === o.id}
                              onChange={(e) => updateMemberRole(o, e.target.value)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700"
                            >
                              {Array.from(new Set([o.role || 'Member', ...memberRoleOptions])).map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeMemberFromEvent(o)}
                              disabled={memberActionId === o.id}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                            >
                              <Trash2 size={12} />
                              {memberActionId === o.id ? 'Working...' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Files</h2>
                <form onSubmit={addFile} className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
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
                      <li key={file.id} className="rounded-xl border border-slate-200 p-3">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between sm:mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">📢 Announcements</h2>
                  <button
                    type="button"
                    onClick={fetchAnnouncements}
                    disabled={extrasLoading}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 transition"
                  >
                    {extrasLoading ? '⟳ Refreshing...' : '⟳ Refresh'}
                  </button>
                </div>

                {canManageAnnouncements ? (
                  <form
                    onSubmit={addAnnouncement}
                    className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 shadow-sm sm:p-5"
                  >
                    {announcementError && (
                      <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                        {announcementError}
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Title</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g., Important Update, Schedule Change, etc."
                        className="w-full rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Message</label>
                      <textarea
                        value={announcementBody}
                        onChange={(e) => setAnnouncementBody(e.target.value)}
                        placeholder="Share important information with your team..."
                        rows={3}
                        className="w-full rounded-lg border border-indigo-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={announcementSubmitting || !announcementTitle.trim()}
                      className="w-full touch-manipulation rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {announcementSubmitting ? '⏳ Posting...' : '📤 Post Announcement'}
                    </button>
                  </form>
                ) : (
                  <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold mb-1">📝 Want to post announcements?</p>
                    <p className="text-xs leading-relaxed">
                      {eventData?.created_by === currentUserId 
                        ? 'You created this event. Try refreshing the page to see posting options.'
                        : 'Ask the event organizer to add you as a team member with Lead or Coordinator role.'}
                    </p>
                  </div>
                )}

                {extrasLoading && (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 text-sm">Loading announcements...</p>
                  </div>
                )}

                {!extrasLoading && announcementsList.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gray-400 text-sm mb-2">📭 No announcements yet</p>
                    <p className="text-gray-500 text-xs">{canManageAnnouncements ? 'Be the first to share an update!' : 'Check back soon for updates'}</p>
                  </div>
                )}

                {!extrasLoading && announcementsList.length > 0 && (
                  <div className="space-y-3">
                    {announcementsList.map((a) => {
                      const authorProfile = a.profiles
                      const authorName = authorProfile?.full_name || authorProfile?.email || 'Anonymous'
                      const authorInitials = authorName
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                      
                      return (
                        <div key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
                          {announcementEditingId === a.id ? (
                            <div className="p-4 sm:p-5 space-y-3 bg-slate-50">
                              <input
                                type="text"
                                value={announcementEditTitle}
                                onChange={(e) => setAnnouncementEditTitle(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold"
                              />
                              <textarea
                                value={announcementEditBody}
                                onChange={(e) => setAnnouncementEditBody(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={cancelAnnouncementEdit}
                                  disabled={announcementActionId === a.id}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveAnnouncementEdit(a.id)}
                                  disabled={announcementActionId === a.id || !announcementEditTitle.trim()}
                                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                                >
                                  {announcementActionId === a.id ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 sm:px-5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-indigo-200 text-indigo-700 grid place-items-center text-xs font-bold shrink-0">
                                      {authorInitials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-gray-900 text-sm">{authorName}</p>
                                      <p className="text-xs text-gray-500">
                                        {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                      </p>
                                    </div>
                                  </div>
                                  {canManageAnnouncements && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => beginAnnouncementEdit(a)}
                                        disabled={announcementActionId === a.id}
                                        className="rounded px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-white disabled:opacity-60 transition"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteAnnouncement(a)}
                                        disabled={announcementActionId === a.id}
                                        className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-white disabled:opacity-60 transition"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="px-4 py-4 sm:px-5">
                                <h3 className="text-base font-bold text-gray-900 mb-2">{a.title}</h3>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a.body ?? a.content}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6 lg:space-y-6">
            <div className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-4 text-white sm:px-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-base font-semibold sm:text-lg">Event Head Point</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Preview</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {eventHeadInitials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{eventHeadNameForPreview || 'No name set'}</p>
                      <p className="text-xs text-slate-500">
                        {eventHeadNameForPreview ? 'Head point selected' : 'Add one person as event lead'}
                      </p>
                    </div>
                  </div>
                </div>

              {eventHeadError && (
                <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {eventHeadError}
                </p>
              )}
              <input
                type="text"
                value={eventHeadDraft}
                onChange={(e) => setEventHeadDraft(e.target.value)}
                placeholder="Type the responsible person's name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={saveEventHeadPoint}
                disabled={eventHeadSaving || eventHeadDraft.trim() === eventHeadPoint}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {eventHeadSaving ? 'Saving head point...' : 'Update Event Head Point'}
              </button>
              {eventHeadPoint && !eventHeadError && (
                <p className="mt-2 text-xs text-slate-500">Current: {eventHeadPoint}</p>
              )}
              </div>
            </div>

            {(rsvpCount != null || rsvpTarget != null) && (
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-md shadow-indigo-200/50">
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
          profiles={allProfiles}
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
          profiles={allProfiles}
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
