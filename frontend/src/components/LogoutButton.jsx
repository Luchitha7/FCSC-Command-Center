import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
    >
      <LogOut size={18} />
      Logout
    </button>
  )
}
