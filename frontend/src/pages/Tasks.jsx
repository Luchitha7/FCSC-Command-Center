import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Info, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddTaskForm from '../components/task/AddTaskForm'
import EditTaskForm from '../components/task/EditTaskForm'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [events, setEvents] = useState({})
  const [allEvents, setAllEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchAllEvents()
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

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Tasks</h1>

        {/* Select Event and Add Task Button */}
        <div className="flex items-end gap-3 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event to Create Task
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            onClick={() => setShowAddForm(true)}
            disabled={!selectedEventId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              selectedEventId
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Select an event from the dropdown above to create a new task, or open an event details page to manage tasks directly.
          </p>
        </div>
      </div>

      {loading && <p className="text-gray-600">Loading tasks...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && tasks.length === 0 && (
        <p className="text-gray-600">No tasks found. Create one by opening an event!</p>
      )}

      {!loading && tasks.length > 0 && (
        <div className="grid gap-4">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <span className="font-medium text-gray-900">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {events[task.event_id] || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
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
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            fetchTasks()
            setSelectedTask(null)
          }}
        />
      )}
    </main>
  )
}
