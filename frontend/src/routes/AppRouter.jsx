import { Navigate, Route, Routes } from 'react-router-dom'
import Calendar from '../pages/Calendar.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Events from '../pages/Events.jsx'
import EventDetails from '../pages/EventDetails.jsx'
import Login from '../pages/Login.jsx'
import Members from '../pages/Members.jsx'
import Profile from '../pages/Profile.jsx'
import Tasks from '../pages/Tasks.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetails />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/members" element={<Members />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
