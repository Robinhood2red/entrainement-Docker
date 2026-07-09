// ============================================================================
// AuthContext.tsx — Gestion globale de l'authentification
//
// Le "Context" React est un mécanisme pour partager des données
// entre composants sans passer des props à chaque niveau.
// Ici, n'importe quel écran peut accéder à user/login/logout
// grâce au hook useAuth(), sans prop drilling.
//
// Persiste le JWT dans AsyncStorage pour survivre aux redémarrages de l'app.
// Expose : user (null si déconnecté), loading (hydratation initiale), login/register/logout.
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'
import { User } from '../types'

// ── Types TypeScript ─────────────────────────────────────────

// Ce que le Context expose à tous les composants enfants
interface AuthContextType {
  user: User | null                // Utilisateur connecté, ou null si déconnecté
  loading: boolean                 // true pendant la vérification initiale du token
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

// Données envoyées à l'API pour créer un compte
interface RegisterData {
  username: string
  email: string
  password: string
  goal: 'lose' | 'maintain' | 'gain'
  weight?: number // Le "?" rend le champ optionnel en TypeScript
}

// ── Création du Context ─────────────────────────────────────
// createContext crée un "canal" de communication entre composants.
// La valeur initiale null sera remplacée dès que AuthProvider se monte.
const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider ─────────────────────────────────────────────────
// AuthProvider enveloppe toute l'app (dans App.tsx).
// Il maintient l'état d'auth et rend les fonctions disponibles via le Context.
// { children }: ReactNode — children représente tout ce qui est entre les balises <AuthProvider>...</AuthProvider>
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // true au démarrage : on n'a pas encore vérifié le token

  // ── Vérification du token au démarrage ─────────────────────
  // useEffect avec [] en dépendances = s'exécute UNE SEULE FOIS au montage du composant.
  // C'est l'équivalent de componentDidMount dans les class components.
  useEffect(() => {
    const initAuth = async () => {
      try {
        // ? Récupération du token JWT stocké en local sur l'appareil ?
        const token = await AsyncStorage.getItem('token')
        if (token) {
          // ? Interrogation de l'API backend pour vérifier la validité du token et charger le profil ?
          const res = await api.get('/auth/me')
          // * Action : hydratation de la session utilisateur avec les données de l'API *
          setUser(res.data.user)
        }
      } catch {
        // ! Alerte sécurité : token invalide, altéré ou expiré, purge obligatoire du stockage local !
        await AsyncStorage.removeItem('token')
      } finally {
        // * Fin de la phase de chargement initial de l'authentification *
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  // ── Fonctions d'authentification ───────────────────────────

  const login = async (email: string, password: string) => {
    // ? Envoi des identifiants au backend pour authentification ?
    const res = await api.post('/auth/login', { email, password })
    // ! Sécurité : stockage persistant du JWT renvoyé par l'API !
    await AsyncStorage.setItem('token', res.data.token)
    // * Action : mise à jour du state user déclenchant la redirection globale *
    setUser(res.data.user)
  }

  const register = async (data: RegisterData) => {
    // ? Envoi des données d'inscription au backend ?
    const res = await api.post('/auth/register', data)
    // ! Sécurité : stockage persistant du JWT suite à l'inscription réussie !
    await AsyncStorage.setItem('token', res.data.token)
    // * Action : authentification immédiate et mise à jour de la session utilisateur *
    setUser(res.data.user)
  }

  const logout = async () => {
    // ! Sécurité : suppression pure et simple du JWT stocké localement !
    await AsyncStorage.removeItem('token')
    // * Action : réinitialisation de l'état utilisateur entraînant la redirection vers l'écran de Login *
    setUser(null)
  }

  // ── Rendu du Provider ───────────────────────────────────────
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook personnalisé ───────────────────────────────────────
export function useAuth(): AuthContextType {
  // ? Requêtage et consommation du contexte d'authentification React ?
  const ctx = useContext(AuthContext)
  // ! Sécurité : vérification que le hook est bien utilisé à l'intérieur d'un AuthProvider !
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider')
  return ctx
}