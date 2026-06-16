// ============================================================
// context/AuthContext.ts — Définition du Contexte d'Authentification
//
// Ce fichier isole uniquement la création du contexte et ses types.
// Cela permet de respecter la règle du Fast Refresh (HMR) de Vite qui demande
// à ce qu'un fichier contenant des composants n'exporte pas d'autres objets.
// ============================================================

import { createContext } from 'react'
import { User } from '../types'

export interface RegisterData {
  username: string
  email: string
  password: string
  weight?: number   
  goal?: string
}

export interface AuthContextType {
  user: User | null   
  loading: boolean    
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}
// * il garantit à toute ton application que chaque fois qu'un composant fera appel à l'authentification, 
// * il aura obligatoirement accès à l'état de l'utilisateur (user), au statut de chargement (loading), 
// * et aux trois fonctions clés (login, register, logout). *

// ! Architecture : Création du contexte global isolé, valeur par défaut null !
export const AuthContext = createContext<AuthContextType | null>(null)
// * Tous les composants qui auront besoin de savoir si l'utilisateur est connecté viendront se 
// * brancher sur ce AuthContext *

// ============================================================
// Fin du fichier context/AuthContext.ts
// ============================================================