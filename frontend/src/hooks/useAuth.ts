// ============================================================
// hooks/useAuth.ts — Hook personnalisé pour accéder au contexte d'auth
//
// Un hook React est une fonction qui commence par "use" et peut appeler
// d'autres hooks (useState, useContext, useEffect...).
// Celui-ci encapsule useContext(AuthContext) pour deux raisons :
//   1. Interface plus propre : useAuth() au lieu de useContext(AuthContext)
//   2. Sécurité : lève une erreur claire si utilisé hors du Provider
// ============================================================

import { useContext } from 'react'
import { AuthContext, AuthContextType } from '../context/AuthContext'

export function useAuth(): AuthContextType {
  // ? Récupération du contexte d'authentification via l'API React ?
  const context = useContext(AuthContext)

  // ! Sécurité : Si le contexte est null, le composant appelant est hors du AuthProvider !
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  // * Retourne le contexte d'authentification typé et prêt à l'emploi *
  return context
}

// ============================================================