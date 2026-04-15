import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Camera,
  ChevronRight,
  Download,
  Pencil,
  Settings,
  Shield,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import commandCenterLogo from '../assets/command-center-logo.png'
import EcShell from '../components/layout/EcShell'
import LogoutButton from '../components/LogoutButton'
import EditProfileModal from '../components/profile/EditProfileModal'
import { supabase } from '../lib/supabase'
import { downloadCsv, toCsv } from '../lib/csvExport'
import { displayNameFromUser, initialsFromDisplayName } from '../lib/userDisplay'
import { useAuthProfile } from '../hooks/useAuthProfile'
import { getNavItems } from '../hooks/useNavItems'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, authReady, refetchProfile } = useAuthProfile()

  const [editOpen, setEditOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hostedCount, setHostedCount] = useState(null)
  const [taskRate, setTaskRate] = useState(null)
  const [organizing, setOrganizing] = useState([])
  const [completedTasks, setCompletedTasks] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [recent, setRecent] = useState([])
  const [allHostedEvents, setAllHostedEvents] = useState([])
  const [allMyTasks, setAllMyTasks] = useState([])
  const [exportError, setExportError] = useState('')
  const [loading, setLoading] = useState(true)

  const displayName = useMemo(
    () => (authReady ? displayNameFromUser(user, profile) : '…'),
    [authReady, user, profile],
  )
  const initials = useMemo(() => initialsFromDisplayName(displayName), [displayName])

  useEffect(() => {
    if (!authReady || !user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const { count: evCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)

        const { data: myTasks } = await supabase
          .from('tasks')
          .select('id, status, title, priority, due_date, event_id, created_at')
          .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

        const { data: hostedEventsForExport } = await supabase
          .from('events')
          .select('id, name, venue, date, type, status, created_at')
          .eq('created_by', user.id)
          .order('date', { ascending: false })

        const { data: orgEvents } = await supabase
          .from('events')
          .select('id, name, venue, date, type')
          .eq('created_by', user.id)
          .order('date', { ascending: false })
          .limit(6)

        const tasks = myTasks || []
        const done = tasks.filter((t) => t.status === 'Completed').length
        const open = tasks.filter((t) => t.status !== 'Completed').length
        const rate = tasks.length ? Math.round((done / tasks.length) * 100) : null

        const activity = [...tasks]
          .sort((a, b) => {
            const ta = new Date(a.created_at || 0).getTime()
            const tb = new Date(b.created_at || 0).getTime()
            return tb - ta
          })
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            title: t.status === 'Completed' ? 'Task completed' : 'Task updated',
            note: t.title,
            time: t.created_at,
            tone: t.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600',
          }))

        if (cancelled) return
        setHostedCount(evCount ?? 0)
        setTaskRate(rate)
        setOrganizing(orgEvents || [])
        setCompletedTasks(done)
        setOpenTasks(open)
        setRecent(activity)
        setAllHostedEvents(hostedEventsForExport || [])
        setAllMyTasks(tasks)
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authReady, user?.id])

  useEffect(() => {
    if (!saveSuccess) return
    const t = setTimeout(() => setSaveSuccess(false), 5000)
    return () => clearTimeout(t)
  }, [saveSuccess])

  const email = profile?.email || user?.email || ''

  const handleProfileSaved = async () => {
    await refetchProfile()
    setSaveSuccess(true)
  }

  const handleExportRecords = () => {
    setExportError('')

    if (allHostedEvents.length === 0 && allMyTasks.length === 0) {
      setExportError('No hosted events or tasks found to export yet.')
      return
    }

    const rows = [
      ...allHostedEvents.map((event) => ({
        recordType: 'Event',
        title: event.name || '',
        status: event.status || '',
        priority: '',
        dueDate: event.date || '',
        venue: event.venue || '',
        eventType: event.type || '',
        linkedEventId: event.id || '',
        createdAt: event.created_at || '',
      })),
      ...allMyTasks.map((task) => ({
        recordType: 'Task',
        title: task.title || '',
        status: task.status || '',
        priority: task.priority || '',
        dueDate: task.due_date || '',
        venue: '',
        eventType: '',
        linkedEventId: task.event_id || '',
        createdAt: task.created_at || '',
      })),
    ]

    const csv = toCsv(
      [
        { key: 'recordType', label: 'Record Type' },
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'dueDate', label: 'Due/Event Date' },
        { key: 'venue', label: 'Venue' },
        { key: 'eventType', label: 'Event Type' },
        { key: 'linkedEventId', label: 'Linked Event ID' },
        { key: 'createdAt', label: 'Created At' },
      ],
      rows,
    )

    const stamp = new Date().toISOString().slice(0, 10)
    downloadCsv(`command-center-records-${stamp}.csv`, csv)
  }

  const profileBrand = (
    <div className="flex items-center gap-3">
      <img src={commandCenterLogo} alt="Command Center logo" className="h-9 w-auto shrink-0 sm:h-10" />
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold tracking-tight text-indigo-700 sm:text-2xl">Command Center</h1>
        <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-slate-400 sm:text-xs">Executive Committee</p>
      </div>
    </div>
  )

  const shellFooter = (
    <>
      <button
        type="button"
        className="flex w-full touch-manipulation items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2.5 text-left text-sm font-medium text-indigo-700"
      >
        <Settings className="h-4 w-4 shrink-0" />
        Settings
      </button>
      <div className="w-full">
        <LogoutButton />
      </div>
    </>
  )

  return (
    <>
      <EcShell navItems={getNavItems('profile')} footer={shellFooter} sidebarHeader={profileBrand}>
          {saveSuccess && (
            <div
              className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              role="status"
            >
              Your profile was updated successfully.
            </div>
          )}
          {exportError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {exportError}
            </div>
          )}

          <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h2 className="min-w-0 truncate text-lg font-bold tracking-tight text-indigo-700 sm:text-xl">
              Profile Settings
            </h2>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="touch-manipulation rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-700 text-sm font-semibold text-white">
                {initials}
              </div>
            </div>
          </header>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:mt-6 sm:p-6">
            <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative mx-auto sm:mx-0">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-indigo-700 text-3xl font-bold text-white sm:h-24 sm:w-24 sm:text-4xl">
                  {initials}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                  aria-label="Avatar (read-only)"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1 break-all text-sm text-slate-500">{email}</p>
              </div>

              <div className="flex w-full justify-center gap-3 sm:w-auto sm:justify-start">
                <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:flex-none sm:p-4">
                  <p className="text-2xl font-bold text-indigo-700 sm:text-3xl">
                    {loading ? '…' : hostedCount ?? '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Events Hosted</p>
                </article>
                <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center sm:flex-none sm:p-4">
                  <p className="text-2xl font-bold text-rose-700 sm:text-3xl">
                    {loading ? '…' : taskRate != null ? `${taskRate}%` : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Task Rate</p>
                </article>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                    Personal Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-indigo-700 sm:w-auto"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Full Name</span>
                    <input
                      readOnly
                      value={profile?.full_name || displayName}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Email Address</span>
                    <input
                      readOnly
                      value={email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700">Student ID</h4>
                  <label className="mt-2 block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Student ID</span>
                    <input
                      readOnly
                      value={profile?.stu_id || '—'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700"
                    />
                  </label>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                  <Shield className="h-5 w-5 text-rose-700" />
                  Security & Access
                </h3>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">Password</p>
                      <p className="text-sm text-slate-500">Managed through Supabase Auth</p>
                    </div>
                  </div>
                </div>
              </article>

              <article>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">Organizing Events</h3>
                  <button
                    type="button"
                    onClick={() => navigate('/events')}
                    className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {loading && <p className="text-sm text-slate-500">Loading…</p>}
                {!loading && organizing.length === 0 && (
                  <p className="text-sm text-slate-500">You have not created any events yet.</p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {!loading &&
                    organizing.map((event) => {
                      const d = event.date ? new Date(event.date) : null
                      const dateStr =
                        d && !Number.isNaN(d.getTime()) ? format(d, 'MMM d, yyyy') : '—'
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-200 hover:shadow-sm"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">
                            {event.type || 'Event'}
                          </p>
                          <h4 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                            {event.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {event.venue || '—'} • {dateStr}
                          </p>
                          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                            <span className="text-xs text-indigo-600">Open event</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </button>
                      )
                    })}
                </div>
              </article>
            </div>

            <div className="space-y-5">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Task Efficiency</h3>
                <div className="mt-4 grid place-items-center">
                  <div className="relative grid h-42 w-42 place-items-center rounded-full border-[10px] border-indigo-700 border-l-slate-200 border-b-slate-200">
                    <div className="text-center">
                      <p className="text-5xl font-bold tracking-tight text-indigo-700">
                        {loading ? '…' : taskRate != null ? `${taskRate}%` : '0%'}
                      </p>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-indigo-700" />
                      Completed Tasks
                    </span>
                    <span className="font-semibold text-slate-900">{loading ? '…' : completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      Open Tasks
                    </span>
                    <span className="font-semibold text-slate-900">{loading ? '…' : openTasks}</span>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl bg-indigo-700 p-4 text-white sm:p-5">
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">Export Records</h3>
                <p className="mt-2 text-sm text-indigo-100">
                  Generate a comprehensive report of your event participation and EC task history for your portfolio.
                </p>
                <button
                  type="button"
                  onClick={handleExportRecords}
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="h-4 w-4" />
                  {loading ? 'Preparing...' : 'Export CSV'}
                </button>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent Activity</h3>
                <div className="mt-4 space-y-4">
                  {loading && <p className="text-sm text-slate-500">Loading…</p>}
                  {!loading && recent.length === 0 && (
                    <p className="text-sm text-slate-500">No recent task activity.</p>
                  )}
                  {!loading &&
                    recent.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-500">{item.note}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            {item.time
                              ? formatDistanceToNow(new Date(item.time), { addSuffix: true })
                              : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </article>
            </div>
          </section>
      </EcShell>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
        profile={profile}
        onSaved={handleProfileSaved}
      />
    </>
  )
}
