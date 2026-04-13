import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import commandCenterLogo from '../../assets/command-center-logo.png'

/**
 * App chrome: mobile drawer nav + desktop sidebar, shared across Dashboard / Calendar / Profile.
 */
export default function EcShell({ navItems, footer, sidebarHeader, children }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setOpen(false)
  const go = (path) => {
    if (path) {
      navigate(path)
      close()
    }
  }

  const brand = sidebarHeader ?? (
    <div>
      <img src={commandCenterLogo} alt="Command Center logo" className="h-10 w-auto max-w-full object-contain" />
      <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-slate-400">Executive Committee</p>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="touch-manipulation rounded-lg p-2 text-slate-700 hover:bg-slate-100 active:bg-slate-200"
          aria-expanded={open}
          aria-controls="ec-shell-nav"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <img src={commandCenterLogo} alt="" className="h-8 w-auto max-w-[140px] object-contain" />
        <span className="ml-auto truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Command Center
        </span>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
          onClick={close}
        />
      )}

      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col lg:flex-row">
        <aside
          id="ec-shell-nav"
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,90vw)] flex-col border-r border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 ease-out sm:p-5 lg:static lg:z-0 lg:min-h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
            open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">{brand}</div>
            <button
              type="button"
              className="touch-manipulation shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Close menu"
              onClick={close}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-4 lg:mt-8">
            {navItems.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => go(link.path)}
                  disabled={!link.path}
                  className={`flex w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    link.active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">{footer}</div>
        </aside>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
