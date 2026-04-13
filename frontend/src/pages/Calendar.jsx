import {
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DayPicker } from 'react-day-picker'
import { addDays, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns'
import 'react-day-picker/style.css'

const navLinks = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Events', icon: CalendarDays, path: '/events' },
  { label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { label: 'Calendar', icon: CalendarDays, path: '/calendar', active: true },
  { label: 'New Event', icon: PlusCircle, path: '/events' },
  { label: 'Members', icon: Users, path: '/members' },
  { label: 'Roles', icon: ShieldCheck, path: '/profile' },
]

export default function Calendar() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [view, setView] = useState('month')

  const activeDate = selected ?? new Date()
  const weekStart = startOfWeek(activeDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(activeDate, { weekStartsOn: 0 })
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  const titleByView =
    view === 'month'
      ? format(month, 'MMMM yyyy')
      : view === 'week'
        ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        : format(activeDate, 'EEEE, MMMM d, yyyy')

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-5 lg:flex">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-700">EventHub</h1>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Planning Hub</p>
              <h2 className="text-3xl font-bold tracking-tight text-indigo-700">{titleByView}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">Alex Rivera</p>
                <p className="text-xs text-slate-500">EC Member</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                AR
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setView('month')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition ${
                      view === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('week')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition ${
                      view === 'week' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('day')}
                    className={`rounded-md px-3 py-1.5 font-semibold transition ${
                      view === 'day' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    Day
                  </button>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">{titleByView}</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 sm:p-5">
                {view === 'month' && (
                  <DayPicker
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    selected={selected}
                    onSelect={setSelected}
                    showOutsideDays
                    fixedWeeks
                    className="[--rdp-accent-color:#4338ca] [--rdp-day-width:44px] [--rdp-day-height:44px] w-full"
                    classNames={{
                      months: 'w-full',
                      month: 'w-full',
                      caption: 'mb-3 flex items-center justify-between px-1',
                      caption_label: 'text-lg font-semibold text-slate-900',
                      nav: 'flex items-center gap-2',
                      button_previous:
                        'rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
                      button_next:
                        'rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800',
                      month_grid: 'w-full border-separate border-spacing-y-1.5',
                      weekdays: 'grid grid-cols-7',
                      weekday: 'text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500',
                      week: 'grid grid-cols-7',
                      day: 'flex items-center justify-center p-1',
                      day_button:
                        'h-11 w-11 rounded-2xl border border-transparent bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 aria-selected:border-indigo-300 aria-selected:bg-indigo-700 aria-selected:text-white aria-selected:shadow-sm',
                      outside: 'text-slate-300 opacity-80',
                      today: 'text-indigo-700',
                      selected: 'bg-transparent',
                    }}
                  />
                )}

                {view === 'week' && (
                  <div>
                    <div className="mb-3 grid grid-cols-7 gap-2">
                      {weekDates.map((date) => (
                        <div
                          key={`head-${date.toISOString()}`}
                          className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500"
                        >
                          {format(date, 'EEE')}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {weekDates.map((date) => (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() => setSelected(date)}
                          className={`rounded-2xl border px-2 py-4 text-center text-sm font-semibold transition ${
                            isSameDay(date, activeDate)
                              ? 'border-indigo-300 bg-indigo-700 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          {format(date, 'd')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {view === 'day' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Selected Day</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-700">{format(activeDate, 'EEEE')}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-800">{format(activeDate, 'MMMM d, yyyy')}</p>
                    <p className="mt-4 text-sm text-slate-500">
                      Day view is active. Add time slots or agenda items here when you integrate events.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Selected Date</h3>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Date</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {selected ? format(selected, 'EEEE, MMMM d, yyyy') : 'No date selected'}
                </p>
              </article>

              <article className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-800 p-5 text-white shadow-sm">
                <h4 className="text-2xl font-bold tracking-tight">Need to schedule a new event?</h4>
                <p className="mt-2 text-sm text-indigo-100">
                  Coordinate with your team directly from the calendar.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700"
                >
                  Create Event
                </button>
              </article>
            </aside>
          </section>
        </main>
      </div>
    </div>
  )
}
