import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Info, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddTaskForm from '../components/task/AddTaskForm'
import EditTaskForm from '../components/task/EditTaskForm'
import EcShell from '../components/layout/EcShell'
import LogoutButton from '../components/LogoutButton'
import { getNavItems } from '../hooks/useNavItems'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [events, setEvents] = useState({})
  const [profilesById, setProfilesById] = useState({})
  const [allProfiles, setAllProfiles] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const navItems = getNavItems('tasks')
  const footerContent = <LogoutButton />

  useEffect(() => {
    fetchTasks()
    fetchAllEvents()
    fetchAllProfiles()
  }, [])

  const fetchAllEvents = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('id, name')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setAllEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false })

      if (fetchError) throw fetchError

      setTasks(data || [])

      // Fetch event names for display
      if (data && data.length > 0) {
        const eventIds = [...new Set(data.map((t) => t.event_id))]
        const { data: eventsData } = await supabase
          .from('events')
          .select('id, name')
          .in('id', eventIds)

        const eventMap = {}
        eventsData?.forEach((e) => {
          eventMap[e.id] = e.name
        })
        setEvents(eventMap)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProfiles = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })
      if (fetchError) throw fetchError

      const rows = data || []
      setAllProfiles(rows)
      setProfilesById(
        Object.fromEntries(rows.map((profile) => [profile.id, profile.full_name || profile.email || 'Unknown'])),
      )
    } catch (err) {
      console.error('Error fetching profiles:', err)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="text-green-500" size={18} />
      case 'In Progress':
        return <Clock className="text-blue-500" size={18} />
      default:
        return <AlertCircle className="text-gray-400" size={18} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'Low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredTasks = selectedEventId
    ? tasks.filter((task) => String(task.event_id) === String(selectedEventId))
    : tasks
  const selectedEventName = selectedEventId ? allEvents.find((event) => event.id === selectedEventId)?.name : ''

  return (
    <EcShell navItems={navItems} footer={footerContent}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tasks</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">All Tasks</h1>
          </div>

          {/* Select Event and Add Task Button */}
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end sm:gap-3">
            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select Event to Create Task
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500 sm:px-4 sm:py-2"
              >
                <option value="">-- Choose an event --</option>
                {allEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              disabled={!selectedEventId}
              className={`inline-flex touch-manipulation items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium transition sm:shrink-0 sm:py-2 ${
                selectedEventId
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }`}
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
            <Info size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <p className="text-xs text-blue-700 sm:text-sm">
              <strong>Tip:</strong> Select an event from the dropdown above to create a new task, or open an event details page to manage tasks directly.
            </p>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading tasks...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && filteredTasks.length === 0 && (
          <p className="text-gray-600">
            {selectedEventId
              ? `No tasks found for ${selectedEventName || 'the selected event'}.`
              : 'No tasks found. Create one by opening an event!'}
          </p>
        )}

        {!loading && filteredTasks.length > 0 && (
          <div className="grid gap-4">
            <div className="-mx-1 overflow-x-auto rounded-lg border border-gray-200 sm:mx-0">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Task
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Event
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Assignee
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Priority
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Due Date
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900 sm:px-6 sm:py-3 sm:text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="cursor-pointer transition hover:bg-gray-50 touch-manipulation"
                      onClick={() => setSelectedTask(task)}
                    >
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          {getStatusIcon(task.status)}
                          <span className="break-words font-medium text-gray-900">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                        {events[task.event_id] || 'Unknown'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                        {task.assigned_to ? profilesById[task.assigned_to] || 'Unknown' : 'Unassigned'}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold sm:px-3 ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 sm:px-6 sm:py-4 sm:text-sm">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTask(task)
                          }}
                          className="min-h-[44px] min-w-[44px] touch-manipulation px-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:min-h-0 sm:min-w-0 sm:px-0"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showAddForm && selectedEventId && (
          <AddTaskForm
            eventId={selectedEventId}
            profiles={allProfiles}
            onClose={() => {
              setShowAddForm(false)
              setSelectedEventId('')
            }}
            onTaskAdded={() => {
              fetchTasks()
              setShowAddForm(false)
              setSelectedEventId('')
            }}
          />
        )}

        {selectedTask && (
          <EditTaskForm
            task={selectedTask}
            profiles={allProfiles}
            onClose={() => setSelectedTask(null)}
            onTaskUpdated={() => {
              fetchTasks()
              setSelectedTask(null)
            }}
          />
        )}
      </div>
    </EcShell>
  )
}
