// ============================================================
// components/Layout/Sidebar.tsx — Barre latérale de navigation
//
// Ce composant affiche le menu de navigation de l'application.
// Il gère l'état actif des liens via NavLink, affiche l'avatar
// de l'utilisateur connecté et fournit l'action de déconnexion.
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Calendar, User, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/exercises', icon: Dumbbell, label: 'Exercices' },
  { to: '/workouts', icon: Calendar, label: 'Séances' },
  { to: '/profile', icon: User, label: 'Profil' },
]

export default function Sidebar() {
  // ? Récupération des informations de l'utilisateur et de la méthode de déconnexion ?
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // * Action : Gestion du processus de déconnexion et redirection de l'utilisateur *
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // * Logique métier : Extraction des initiales du nom pour l'avatar par défaut *
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'FT'

  return (
    <aside className="w-60 bg-[#0D1117] border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-100 tracking-tight">FitTrack</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {/* * Action : Itération et rendu de la liste dynamique des liens de navigation * */}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {/* ? Lecture et affichage des informations du profil utilisateur ? */}
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </NavLink>
        
        {/* ! Alerte : Bouton déclenchant la déconnexion et la destruction de la session ! */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-colors"
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

// ============================================================