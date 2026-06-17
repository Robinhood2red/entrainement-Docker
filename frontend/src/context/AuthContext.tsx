// ============================================================
// context/AuthProvider.tsx — Composant Provider d'authentification
//
// Ce fichier contient uniquement le composant AuthProvider.
// Il gère l'état d'authentification global de l'application FitTrack
// et injecte les méthodes de connexion/déconnexion via le Context.
// ============================================================

import { useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { AuthContext, RegisterData } from './AuthContext'
import { User } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  //  * == État global : Gestion de l'utilisateur connecté == *
  const [user, setUser] = useState<User | null>(null)
  
  // ! Alerte : loading empêche l'affichage flash de l'application avant la vérification du token !
  const [loading, setLoading] = useState(true)

  // ---- Vérification asynchrone du token au démarrage ----
  // useEffect(() => {
  //   // * Logique métier : Isolation de la vérification dans une fonction dédiée *
  //   const initializeAuth = async () => {
  //     // ? Lecture : Récupération du token potentiel stocké dans le localStorage ?
  //     const token = localStorage.getItem('token')
      
  //     if (token) {
  //       try {
  //         // ? Requêtage : GET /api/auth/me pour vérifier la validité du token ?
  //         const res = await api.get('/auth/me')
  //         // * Action : Hydratation de l'utilisateur si le token est valide *
  //         setUser(res.data.user)
  //       } catch {
  //         // ! Sécurité : Si l'API renvoie une erreur, le token est corrompu ou expiré -> Nettoyage !
  //         localStorage.removeItem('token')
  //       }
  //     }
      
  //     // * Action : Clôture du chargement de manière asynchrone après les vérifications *
  //     setLoading(false)
  //   }

  //   initializeAuth()
  // }, [])

  useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            api.get('/auth/me')
                .then((res) => setUser(res.data.user))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false))
        }
    }, [])

  // useEffect(() => {
  //   const token = localStorage.getItem('token')

  //   if (token) {

  //     // GET /api/auth/me : retourne le profil si le token est valide
  //     api
  //       .get('/auth/me')
  //       .then((res) => setUser(res.data.user))

  //       // Si le token est expiré, l'intercepteur axios le supprime
  //       .catch(() => localStorage.removeItem('token'))

  //       .finally(() => setLoading(false)) // Fin du chargement dans tous les cas

  //   } else {
  //     setLoading(false) // Pas de token → on sait déjà qu'il n'est pas connecté
  //   }

  // }, [])

    
  // ---- Login ----
  const login = async (email: string, password: string) => {
    // ? Requêtage : Envoi des identifiants ?
    const res = await api.post('/auth/login', { email, password })
    // ! Sécurité : Stockage persistant du nouveau token JWT !
    localStorage.setItem('token', res.data.token) 
    // * Action : Mise à jour de l'état utilisateur *
    setUser(res.data.user)                        
  }

  // ---- Register ----
  const register = async (data: RegisterData) => {
    // ? Requêtage : Envoi des données d'inscription ?
    const res = await api.post('/auth/register', data)
    // ! Sécurité : Stockage direct du token généré suite à l'inscription !
    localStorage.setItem('token', res.data.token)
    // * Action : Connexion automatique de l'utilisateur *
    setUser(res.data.user)
  }

  // ---- Logout ----
  const logout = () => {
    // ! Sécurité : Invalidation du token côté client par suppression complète !
    localStorage.removeItem('token')
    // * Action : Remise à zéro de l'état (provoque la redirection via les routes privées) *
    setUser(null) 
  }

  // ---- Rendu du Provider ----
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// Fin du fichier context/AuthProvider.tsx
// ============================================================