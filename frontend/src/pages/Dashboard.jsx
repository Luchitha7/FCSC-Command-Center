import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import EcShell from '../components/layout/EcShell'
import LogoutButton from '../components/LogoutButton'
import { supabase } from '../lib/supabase'
import { displayNameFromUser, initialsFromDisplayName, roleLabelFromUser } from '../lib/userDisplay'
import { useAuthProfile } from '../hooks/useAuthProfile'

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'New Event', icon: PlusCircle },
  { label: 'Members', icon: Users, path: '/members' },
  { label: 'Roles', icon: ShieldCheck, path: '/profile' },
]

const TYPE_BAR = {
  MUSICAL: 'bg-pink-500',
  CULTURAL: 'bg-amber-500',
  SPORTS: 'bg-emerald-500',
  ACADEMIC: 'bg-indigo-600',
  TECHNICAL: 'bg-violet-500',
  OTHER: 'bg-slate-500',
}

function taskStatusTone(status, dueDate) {
  if (status === 'Completed') return 'text-emerald-600'
  if (dueDate && status !== 'Completed') {
    const d = new Date(dueDate)
    if (!Number.isNaN(d.getTime()) && d < new Date()) return 'text-rose-600'
  }
  if (status === 'In Progress') return 'text-amber-600'
  return 'text-slate-600'
}

function formatAnnounceTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, authReady } = useAuthProfile()

  const [stats, setStats] = useState({
    totalEvents: '—',
    memberCount: '—',
    pendingTasks: '—',
    completionPct: '—',
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pendingRows, setPendingRows] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState(null)

  const displayName = useMemo(
    () => (authReady ? displayNameFromUser(user, profile) : '…'),
    [authReady, user, profile],
  )
  const avatarInitials = useMemo(() => initialsFromDisplayName(displayName), [displayName])
  const roleLabel = useMemo(() => roleLabelFromUser(user, profile), [user, profile])

  useEffect(() => {
    if (!authReady) return
    let cancelled = false

    async function load() {
      setDashLoading(true)
      setDashError(null)
      try {
        const today = new Date().toISOString().slice(0, 10)

        const eventsCount = await supabase.from('events').select('*', { count: 'exact', head: true })
        const profilesCount = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const allTasks = await supabase.from('tasks').select('id, status')

        let upcoming = []
        const futureRes = await supabase
          .from('events')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(8)
        if (!futureRes.error && futureRes.data?.length) {
          upcoming = futureRes.data.slice(0, 4)
        } else {
          const anyRes = await supabase.from('events').select('*').order('date', { ascending: true }).limit(4)
          if (!anyRes.error) upcoming = anyRes.data || []
        }

        const eventIds = upcoming.map((e) => e.id)
        const taskAgg = {}
        if (eventIds.length) {
          const { data: evTasks } = await supabase.from('tasks').select('event_id, status').in('event_id', eventIds)
          evTasks?.forEach((t) => {
            if (!taskAgg[t.event_id]) taskAgg[t.event_id] = { total: 0, done: 0 }
            taskAgg[t.event_id].total += 1
            if (t.status === 'Completed') taskAgg[t.event_id].done += 1
          })
        }

        const mappedEvents = upcoming.map((e) => {
          const agg = taskAgg[e.id] || { total: 0, done: 0 }
          const progress = agg.total ? Math.round((agg.done / agg.total) * 100) : 0
          const bar = TYPE_BAR[e.type] || TYPE_BAR.OTHER
          let displayDate = '—'
          if (e.date) {
            const dt = new Date(e.date)
            if (!Number.isNaN(dt.getTime())) {
              displayDate = format(dt, 'MMM d, yyyy')
            }
          }
          return {
            id: e.id,
            type: e.type || 'Event',
            status: e.status || '—',
            title: e.name,
            date: displayDate,
            progress,
            color: bar,
          }
        })

        const tasks = allTasks.data || []
        const completed = tasks.filter((t) => t.status === 'Completed').length
        const pending = tasks.filter((t) => t.status !== 'Completed').length
        const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

        let ann = []
        let annRes = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(6)
        if (annRes.error) {
          annRes = await supabase.from('announcements').select('*').order('published_at', { ascending: false }).limit(6)
        }
        if (!annRes.error && annRes.data?.length) {
          ann = annRes.data.map((a) => ({
            id: a.id,
            time: formatAnnounceTime(a.created_at || a.published_at || a.updated_at),
            title: a.title,
            details: a.body ?? a.content ?? '',
          }))
        }

        let myPending = []
        if (user?.id) {
          const taskQuery = () =>
            supabase
              .from('tasks')
              .select('id, title, status, priority, due_date, event_id, events(name)')
              .neq('status', 'Completed')
              .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
              .order('due_date', { ascending: true, nullsFirst: false })
              .limit(8)

          let tRes = await taskQuery()
          if (tRes.error) {
            tRes = await supabase
              .from('tasks')
              .select('id, title, status, priority, due_date, event_id')
              .neq('status', 'Completed')
              .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
              .order('due_date', { ascending: true, nullsFirst: false })
              .limit(8)
            const rows = tRes.data || []
            const eids = [...new Set(rows.map((t) => t.event_id).filter(Boolean))]
            let nameById = {}
            if (eids.length && !tRes.error) {
              const { data: evs } = await supabase.from('events').select('id, name').in('id', eids)
              nameById = Object.fromEntries((evs || []).map((e) => [e.id, e.name]))
            }
            myPending = rows.map((t) => ({
              id: t.id,
              title: t.title,
              event: nameById[t.event_id] || 'Event',
              event_id: t.event_id,
              status: t.status,
              tone: taskStatusTone(t.status, t.due_date),
              due_date: t.due_date,
            }))
          } else if (tRes.data?.length) {
            myPending = tRes.data.map((t) => ({
              id: t.id,
              title: t.title,
              event: t.events?.name || 'Event',
              event_id: t.event_id,
              status: t.status,
              tone: taskStatusTone(t.status, t.due_date),
              due_date: t.due_date,
            }))
          }
        }

        if (cancelled) return

        setStats({
          totalEvents: eventsCount.error ? '—' : String(eventsCount.count ?? 0),
          memberCount: profilesCount.error ? '—' : String(profilesCount.count ?? 0),
          pendingTasks: allTasks.error ? '—' : String(pending),
          completionPct: allTasks.error ? '—' : `${pct}%`,
        })
        setUpcomingEvents(mappedEvents)
        setPendingRows(myPending)
        setAnnouncements(ann)
      } catch (e) {
        if (!cancelled) setDashError(e.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setDashLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [authReady, user?.id])

  const statCards = [
    { label: 'Total', value: stats.totalEvents, caption: 'Events tracked', accent: 'text-indigo-700' },
    { label: 'Active', value: stats.memberCount, caption: 'Members engaged', accent: 'text-purple-700' },
    { label: 'Pending', value: stats.pendingTasks, caption: 'Open tasks', accent: 'text-rose-700' },
    { label: 'Growth', value: stats.completionPct, caption: 'Overall completion', accent: 'text-emerald-700' },
  ]

  const shellFooter = (
    <>
      <button
        type="button"
        className="flex w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
    <EcShell navItems={navLinks} footer={shellFooter}>
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current View</p>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Dashboard Overview</h2>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
              <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
                {roleLabel}
              </span>
              <button
                type="button"
                className="touch-manipulation rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="grid h-9 w-9 shrink-0 touch-manipulation place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                title={user?.email || displayName}
                aria-label="Open profile"
              >
                {avatarInitials}
              </button>
            </div>
          </header>

          {dashError && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {dashError}
            </p>
          )}

          <section className="mt-6 sm:mt-7">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              <span className="block sm:inline">Welcome back, {displayName}</span>{' '}
              <span className="text-lg text-indigo-300 sm:text-2xl lg:text-4xl">({roleLabel})</span>
            </h1>
            <p className="mt-2 text-base text-slate-600">
              The curated overview of your executive committee responsibilities for FCSC.
            </p>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat, idx) => {
              const handleStatClick = () => {
                if (idx === 0) navigate('/events')
                else if (idx === 1) navigate('/members')
                else if (idx === 2) navigate('/tasks')
              }
              return (
                <article
                  key={stat.label}
                  onClick={handleStatClick}
                  className="touch-manipulation cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md hover:border-indigo-300"
                >
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${stat.accent}`}>{stat.label}</p>
                  <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900">
                    {dashLoading ? '…' : stat.value}
                  </p>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">{stat.caption}</p>
                </article>
              )
            })}
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">Upcoming Events</h3>
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  className="touch-manipulation self-start text-xs font-bold uppercase tracking-[0.2em] text-indigo-700"
                >
                  View all events
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {dashLoading && (
                  <p className="text-sm text-slate-500 md:col-span-2">Loading events…</p>
                )}
                {!dashLoading && upcomingEvents.length === 0 && (
                  <p className="text-sm text-slate-500 md:col-span-2">No events yet. Create one from the Events page.</p>
                )}
                {!dashLoading &&
                  upcomingEvents.map((event) => (
                    <article
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="touch-manipulation cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition hover:shadow-lg hover:border-indigo-300"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{event.type}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{event.status}</span>
                      </div>

                      <h4 className="mt-4 text-xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-2xl lg:text-3xl">
                        {event.title}
                      </h4>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {event.date}
                      </p>

                      <div className="mt-6">
                        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                          <span>Progress</span>
                          <span>{event.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${event.color}`} style={{ width: `${event.progress}%` }} />
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">My Pending Tasks</h3>
                <div className="mt-4 space-y-4">
                  {dashLoading && <p className="text-sm text-slate-500">Loading tasks…</p>}
                  {!dashLoading && pendingRows.length === 0 && (
                    <p className="text-sm text-slate-500">No open tasks assigned to you.</p>
                  )}
                  {!dashLoading &&
                    pendingRows.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/events/${task.event_id}?tab=tasks`)}
                        className="touch-manipulation cursor-pointer flex items-start gap-3 rounded-lg p-2 transition hover:bg-slate-50"
                      >
                        <Circle className="mt-0.5 h-5 w-5 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-slate-900 truncate">{task.title}</p>
                            <span className={`text-xs font-bold uppercase tracking-[0.14em] ${task.tone} shrink-0`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 truncate">{task.event}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">Recent Announcements</h3>
                <div className="mt-4 space-y-5">
                  {dashLoading && <p className="text-sm text-slate-500">Loading…</p>}
                  {!dashLoading && announcements.length === 0 && (
                    <p className="text-sm text-slate-500">No announcements yet.</p>
                  )}
                  {!dashLoading &&
                    announcements.map((item, index) => (
                      <div
                        key={item.id ?? item.title}
                        className="touch-manipulation cursor-pointer flex gap-3 rounded-lg p-2 transition hover:bg-slate-50"
                      >
                        {index === 0 ? (
                          <CircleDot className="mt-1 h-4 w-4 text-indigo-700" />
                        ) : (
                          <CheckCircle2 className="mt-1 h-4 w-4 text-fuchsia-700" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.time}</p>
                          <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{item.details}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </section>
    </EcShell>
  )
}
