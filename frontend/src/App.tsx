// ============================================================
// App.tsx — Composant Racine de l'Application
//
// Ce script initialise le routeur global (React Router), configure
// les notifications (Toaster) et enveloppe l'ensemble de l'application
// dans le fournisseur d'authentification (AuthProvider) pour rendre le
// contexte accessible à tous les sous-composants et pages.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// * Action : Importation du Provider depuis le bon nom de fichier *
import { AuthProvider } from './context/AuthProvider' 
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Workouts from './pages/Workouts'
import WorkoutDetail from './pages/WorkoutDetail'
// import Profile from './pages/Profile'

export default function App() {
  return (
    // * Action : Enveloppement global de l'arbre des routes avec le contexte d'authentification *
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
            },
          }}
        />
        <Routes>
          {/* ---- Routes Publiques ---- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ---- Routes Sécurisées (Soumises à Token valide) ---- */}
          {/* ! Sécurité : Le composant PrivateRoute filtre les accès avant le rendu du Layout ! */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
              {/* <Route path="/profile" element={<Profile />} /> */}
            </Route>
          </Route>
          
          {/* ---- Route de Redirection par Défaut ---- */}
          {/* * Action : Redirige n'importe quelle URL inconnue vers le tableau de bord * */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// ============================================================
// Fin du fichier App.tsx
// ============================================================