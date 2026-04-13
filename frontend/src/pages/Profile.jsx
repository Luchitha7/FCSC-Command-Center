import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  ClipboardList,
  Download,
  LayoutDashboard,
  PlusCircle,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import commandCenterLogo from '../assets/command-center-logo.png'
import LogoutButton from '../components/LogoutButton'
import { supabase } from '../lib/supabase'
import { displayNameFromUser, initialsFromDisplayName, roleLabelFromUser } from '../lib/userDisplay'
import { useAuthProfile } from '../hooks/useAuthProfile'

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'New Event', icon: PlusCircle, path: '/events' },
  { label: 'Members', icon: Users, path: '/members' },
  { label: 'Roles', icon: ShieldCheck, path: '/profile' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, authReady } = useAuthProfile()

  const [hostedCount, setHostedCount] = useState(null)
  const [taskRate, setTaskRate] = useState(null)
  const [organizing, setOrganizing] = useState([])
  const [completedTasks, setCompletedTasks] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const displayName = useMemo(
    () => (authReady ? displayNameFromUser(user, profile) : '…'),
    [authReady, user, profile],
  )
  const initials = useMemo(() => initialsFromDisplayName(displayName), [displayName])
  const roleLabel = useMemo(() => roleLabelFromUser(user, profile), [user, profile])

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
          .select('id, status, title, created_at')
          .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)

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

  const email = profile?.email || user?.email || ''

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div className="flex items-center gap-3">
            <img src={commandCenterLogo} alt="Command Center logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-700">Command Center</h1>
              <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-slate-400">Executive Committee</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-left text-sm font-medium text-indigo-700"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <div className="w-full">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-indigo-700">Profile Settings</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {roleLabel}
              </span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-700 text-sm font-semibold text-white">
                {initials}
              </div>
            </div>
          </header>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-indigo-700 text-4xl font-bold text-white">
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

              <div className="min-w-[220px] flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  {roleLabel}
                </p>
                {profile?.role && (
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                      {profile.role}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-700">
                    {loading ? '…' : hostedCount ?? '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Events Hosted</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-3xl font-bold text-rose-700">
                    {loading ? '…' : taskRate != null ? `${taskRate}%` : '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Task Rate</p>
                </article>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">Personal Information</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Full Name</span>
                    <input
                      readOnly
                      value={displayName}
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
                <label className="mt-4 block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Department</span>
                  <input
                    readOnly
                    value={profile?.department || '—'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                  />
                </label>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
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
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">Organizing Events</h3>
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
                          <h4 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{event.name}</h4>
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
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
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

              <article className="rounded-2xl bg-indigo-700 p-5 text-white">
                <h3 className="text-3xl font-bold tracking-tight">Export Records</h3>
                <p className="mt-2 text-sm text-indigo-100">
                  Generate a comprehensive report of your event participation and EC task history for your portfolio.
                </p>
                <button
                  type="button"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700 opacity-80"
                  disabled
                >
                  <Download className="h-4 w-4" />
                  Coming soon
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
        </main>
      </div>
    </div>
  )
}
