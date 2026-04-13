import {
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react'

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Events', icon: Calendar },
  { label: 'Tasks', icon: ClipboardList },
  { label: 'Calendar', icon: Calendar },
  { label: 'New Event', icon: PlusCircle },
  { label: 'Members', icon: Users },
  { label: 'Roles', icon: ShieldCheck },
]

const organizingEvents = [
  {
    tag: 'Cultural Heritage',
    title: 'Unity Gala 2024',
    location: 'Main Auditorium',
    date: 'Oct 24',
  },
  {
    tag: 'Academic / Tech',
    title: 'Innovation Summit',
    location: 'Lecture Theatre A',
    date: 'Nov 12',
  },
]

const recentActivity = [
  {
    title: 'Task Completed',
    note: 'Approved the budget for Unity Gala.',
    time: '2 hours ago',
    tone: 'bg-emerald-500',
  },
  {
    title: 'New Event Added',
    note: "Drafted 'Innovation Summit' proposal.",
    time: 'Yesterday',
    tone: 'bg-indigo-600',
  },
]

export default function Profile() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-700 font-bold text-white">EH</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-700">EventHub</h1>
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
            <h2 className="text-xl font-bold tracking-tight text-indigo-700">Profile Settings</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">EC Member</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-700 text-sm font-semibold text-white">KP</div>
            </div>
          </header>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-indigo-700 text-4xl font-bold text-white">KP</div>
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-[220px] flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Kavindu P.</h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  Executive Committee Member
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700">
                    Administrator
                  </span>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
                    Event Lead
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-700">12</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Events Hosted</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-3xl font-bold text-rose-700">98%</p>
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
                  <button type="button" className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                    Save Changes
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Full Name</span>
                    <input
                      readOnly
                      value="Kavindu P."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Email Address</span>
                    <input
                      readOnly
                      value="kavindu.p@eventhub.ec"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                    />
                  </label>
                </div>
                <label className="mt-4 block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Department</span>
                  <input
                    readOnly
                    value="Student Council - Event Management Division"
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
                      <p className="font-semibold text-slate-900">Change Password</p>
                      <p className="text-sm text-slate-500">Last updated 3 months ago</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-700"
                    >
                      Update
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Strong security enabled</p>
                    </div>
                    <button type="button" className="relative h-7 w-14 rounded-full bg-indigo-700">
                      <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white" />
                    </button>
                  </div>
                </div>
              </article>

              <article>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-3xl font-bold tracking-tight text-slate-900">Organizing Events</h3>
                  <button type="button" className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {organizingEvents.map((event) => (
                    <article key={event.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">{event.tag}</p>
                      <h4 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{event.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {event.location} • {event.date}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">+12</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </div>

            <div className="space-y-5">
              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Task Efficiency</h3>
                <div className="mt-4 grid place-items-center">
                  <div className="relative grid h-42 w-42 place-items-center rounded-full border-[10px] border-indigo-700 border-l-slate-200 border-b-slate-200">
                    <div className="text-center">
                      <p className="text-5xl font-bold tracking-tight text-indigo-700">75%</p>
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
                    <span className="font-semibold text-slate-900">24</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      Open Tasks
                    </span>
                    <span className="font-semibold text-slate-900">8</span>
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
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent Activity</h3>
                <div className="mt-4 space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone}`} />
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.note}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.time}</p>
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