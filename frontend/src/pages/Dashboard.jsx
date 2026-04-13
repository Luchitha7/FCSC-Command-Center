import {
  Bell,
  Calendar,
  CheckCircle2,
  Circle,
  CircleDot,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import commandCenterLogo from '../assets/command-center-logo.png'

import { useNavigate } from 'react-router-dom'

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Events', icon: Calendar, path: "/events" },
  { label: 'Tasks', icon: ClipboardList, path: "/tasks" },
  { label: 'Calendar', icon: Calendar, path: "/calendar" },
  { label: 'New Event', icon: PlusCircle },
  { label: 'Members', icon: Users, path: "/members" },
  { label: 'Roles', icon: ShieldCheck },
]

const statCards = [
  { label: 'Total', value: '12', caption: 'Events tracked', accent: 'text-indigo-700' },
  { label: 'Active', value: '78', caption: 'Members engaged', accent: 'text-purple-700' },
  { label: 'Pending', value: '24', caption: 'Open tasks', accent: 'text-rose-700' },
  { label: 'Growth', value: '65%', caption: 'Overall completion', accent: 'text-emerald-700' },
]

const events = [
  {
    type: 'Musical',
    status: 'Active',
    title: 'Musical Night 2026',
    date: 'May 15, 2026',
    progress: 72,
    color: 'bg-pink-500',
  },
  {
    type: 'Cultural',
    status: 'Planning',
    title: 'Aurudu Uthsawaya',
    date: 'Apr 25, 2026',
    progress: 45,
    color: 'bg-amber-500',
  },
  {
    type: 'Sports',
    status: 'Planning',
    title: 'Cricket Tournament',
    date: 'Jun 3, 2026',
    progress: 20,
    color: 'bg-emerald-500',
  },
  {
    type: 'Academic',
    status: 'Active',
    title: 'Study Support Sessions',
    date: 'Ongoing',
    progress: 90,
    color: 'bg-indigo-600',
  },
]

const pendingTasks = [
  { title: 'Finalize Sponsor List', event: 'Musical Night 2026', status: 'OK', tone: 'text-emerald-600' },
  { title: 'Vendor Ground Map', event: 'Aurudu Uthsawaya', status: 'Soon', tone: 'text-amber-600' },
  { title: 'Budget Proposal V2', event: 'Cricket Tournament', status: 'Overdue', tone: 'text-rose-600' },
]

const announcements = [
  {
    time: 'Today, 09:42 AM',
    title: 'General Body Meeting Rescheduled',
    details: 'The GBM scheduled for tomorrow has been moved to Friday at the Main Hall.',
  },
  {
    time: 'Yesterday',
    title: 'New Budget Approval Flow',
    details: 'Please use the new EventHub module for all financial reimbursement requests.',
  },
]

export default function Dashboard() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div>
            <img src={commandCenterLogo} alt="Command Center logo" className="h-10 w-auto" />
            <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-slate-400">Executive Committee</p>
          </div>

          <nav className="mt-8 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    link.active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
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
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current View</p>
              <h2 className="text-lg font-semibold text-slate-900">Dashboard Overview</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                EC Member
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                KP
              </div>
            </div>
          </header>

          <section className="mt-7">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back, Kavindu P. <span className="text-indigo-300">(EC Member)</span>
            </h1>
            <p className="mt-2 text-base text-slate-600">
              The curated overview of your executive committee responsibilities for FCSC.
            </p>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${stat.accent}`}>{stat.label}</p>
                <p className="mt-5 text-4xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">{stat.caption}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">Upcoming Events</h3>
                <button type="button" className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                  View all events
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <article key={event.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{event.type}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">{event.status}</span>
                    </div>

                    <h4 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">{event.title}</h4>
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
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">My Pending Tasks</h3>
                <div className="mt-4 space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.title} className="flex items-start gap-3">
                      <Circle className="mt-0.5 h-5 w-5 text-slate-400" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <span className={`text-xs font-bold uppercase tracking-[0.14em] ${task.tone}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{task.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">Recent Announcements</h3>
                <div className="mt-4 space-y-5">
                  {announcements.map((item, index) => (
                    <div key={item.title} className="flex gap-3">
                      {index === 0 ? (
                        <CircleDot className="mt-1 h-4 w-4 text-indigo-700" />
                      ) : (
                        <CheckCircle2 className="mt-1 h-4 w-4 text-fuchsia-700" />
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.time}</p>
                        <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
