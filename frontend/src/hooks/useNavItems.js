import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  ShieldCheck,
} from 'lucide-react'

export function getNavItems(activePage = '') {
  return [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      active: activePage === 'dashboard',
    },
    {
      label: 'Events',
      icon: Calendar,
      path: '/events',
      active: activePage === 'events',
    },
    {
      label: 'Tasks',
      icon: ClipboardList,
      path: '/tasks',
      active: activePage === 'tasks',
    },
    {
      label: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      active: activePage === 'calendar',
    },
    {
      label: 'Members',
      icon: Users,
      path: '/members',
      active: activePage === 'members',
    },
    {
      label: 'Roles',
      icon: ShieldCheck,
      path: '/profile',
      active: activePage === 'profile',
    },
  ]
}
