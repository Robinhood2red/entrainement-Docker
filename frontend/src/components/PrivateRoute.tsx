// ============================================================
// components/PrivateRoute.tsx — Protection des routes authentifiées
//
// Ce composant agit comme un "garde" devant les pages privées.
// Il est utilisé dans App.tsx pour envelopper les routes qui
// nécessitent d'être connecté (Dashboard, Workouts, etc.).
// ============================================================

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute() {
  // ? Récupération et vérification de l'état d'authentification de l'utilisateur ?
  const { user, loading } = useAuth()

  // ? Vérification : Si l'état est en cours de chargement, on affiche le spinner ?
  if (loading) return <LoadingSpinner />

  // ! Sécurité : Redirection immédiate vers /login si aucun utilisateur n'est connecté !
  if (!user) return <Navigate to="/login" replace />

  // * Action : Rendu des composants enfants (les routes protégées) via l'Outlet de React Router *
  return <Outlet />
}

// ============================================================