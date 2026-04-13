import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { addDays, addMonths, endOfWeek, format, isSameDay, isToday, startOfWeek, subMonths } from 'date-fns'
import commandCenterLogo from '../assets/command-center-logo.png'
import { supabase } from '../lib/supabase'
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
  const timeLabels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

  const titleByView =
    view === 'month'
      ? format(month, 'MMMM yyyy')
      : view === 'week'
        ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
        : format(activeDate, 'EEEE, MMMM d, yyyy')

  const goPrev = () => {
    if (view === 'month') {
      setMonth((current) => subMonths(current, 1))
      return
    }
    const nextDate = addDays(activeDate, view === 'week' ? -7 : -1)
    setSelected(nextDate)
    setMonth(nextDate)
  }

  const goNext = () => {
    if (view === 'month') {
      setMonth((current) => addMonths(current, 1))
      return
    }
    const nextDate = addDays(activeDate, view === 'week' ? 7 : 1)
    setSelected(nextDate)
    setMonth(nextDate)
  }

  const goToday = () => {
    const now = new Date()
    setSelected(now)
    setMonth(now)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
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
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current View</p>
              <h2 className="text-lg font-semibold text-slate-900">Calendar Overview</h2>
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

          <section className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
                {['day', 'week', 'month'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setView(tab)}
                    className={`rounded-md px-3 py-1.5 font-medium capitalize transition ${
                      view === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Current Range</p>
                <p className="text-sm font-semibold text-slate-900">{titleByView}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-4 pt-3 sm:px-5">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {view === 'day' ? (
                  <>
                    {format(activeDate, 'd MMMM')} <span className="font-medium">{format(activeDate, 'yyyy')}</span>
                  </>
                ) : (
                  <>
                    {format(month, 'MMMM')} <span className="font-medium">{format(month, 'yyyy')}</span>
                  </>
                )}
              </h3>
              {view === 'day' && <p className="mt-1 text-xl text-slate-700">{format(activeDate, 'EEEE')}</p>}
            </div>

            {view === 'month' && (
              <div className="px-3 pb-4 sm:px-4">
                <DayPicker
                  mode="single"
                  month={month}
                  onMonthChange={setMonth}
                  selected={selected}
                  onSelect={setSelected}
                  showOutsideDays
                  fixedWeeks
                  className="[--rdp-accent-color:#4338ca] [--rdp-day-width:48px] [--rdp-day-height:48px] w-full"
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
                      'h-12 w-12 rounded-2xl border border-transparent bg-white text-sm font-semibold text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 aria-selected:border-indigo-300 aria-selected:bg-indigo-700 aria-selected:text-white aria-selected:shadow-sm',
                    outside: 'text-slate-300 opacity-80',
                    today: 'text-indigo-700',
                    selected: 'bg-transparent',
                  }}
                />
              </div>
            )}

            {view === 'week' && (
              <div className="pb-4">
                <div className="max-h-[620px] min-w-0 overflow-auto">
                  <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[980px]">
                      <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-y border-slate-200 bg-slate-50 text-center">
                        <div className="border-r border-slate-200 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Time
                        </div>
                        {weekDates.map((date) => (
                          <button
                            key={date.toISOString()}
                            type="button"
                            onClick={() => setSelected(date)}
                            className="border-r border-slate-200 py-2 text-slate-700 last:border-r-0 hover:bg-slate-100"
                          >
                            <p className="text-sm">{format(date, 'EEE')}</p>
                            <p
                              className={`mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${
                                isToday(date) ? 'bg-red-500 text-white' : ''
                              }`}
                            >
                              {format(date, 'd')}
                            </p>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b border-slate-200">
                        <div className="border-r border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">all-day</div>
                        {weekDates.map((date) => (
                          <div key={`allday-${date.toISOString()}`} className="border-r border-slate-200 py-1 last:border-r-0" />
                        ))}
                      </div>

                      {timeLabels.map((time) => (
                        <div key={time} className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))]">
                          <div className="border-r border-slate-200 px-3 py-2 text-sm text-slate-500">{time}</div>
                          {weekDates.map((date) => (
                            <div key={`${time}-${date.toISOString()}`} className="h-11 border-r border-t border-slate-200/80 last:border-r-0" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'day' && (
              <div className="pb-4">
                <div className="max-h-[620px] min-w-0 overflow-auto">
                  <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[680px]">
                      <div className="grid grid-cols-[72px_1fr] border-y border-slate-200 bg-slate-50">
                        <div className="border-r border-slate-200 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Time
                        </div>
                        <div className="px-4 py-2 text-sm font-medium text-slate-700">{format(activeDate, 'EEEE, MMMM d')}</div>
                      </div>

                      <div className="grid grid-cols-[72px_1fr] border-b border-slate-200">
                        <div className="border-r border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">all-day</div>
                        <div className="py-1" />
                      </div>

                      {timeLabels.map((time) => (
                        <div key={`day-${time}`} className="grid grid-cols-[72px_1fr]">
                          <div className="border-r border-slate-200 px-3 py-2 text-sm text-slate-500">{time}</div>
                          <div className="h-11 border-t border-slate-200/80" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

            <aside className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quick Panel</h3>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Selected Date</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {format(activeDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Use Day and Week views to plan task slots and coordination blocks.
                </p>
              </article>

              <article className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-800 p-5 text-white shadow-sm">
                <h4 className="text-2xl font-bold tracking-tight">Need to schedule a new event?</h4>
                <p className="mt-2 text-sm text-indigo-100">
                  Create an event first, then use this calendar to organize your team timeline.
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
