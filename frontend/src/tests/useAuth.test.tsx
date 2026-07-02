// ============================================================================
// ROLE MACRO : Tests unitaires pour le hook d'authentification (tests/useAuth.test.tsx).
// Ce script valide le cycle de vie et l'étanchéité du custom hook useAuth.
// Il s'assure du crash sécurisé en l'absence de fournisseur de contexte (Provider),
// de la restitution exacte des états globaux (données utilisateur, indicateur de
// chargement), et de la bonne exposition des fonctions de pilotage de session.
// ============================================================================

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: 75,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Prépare une copie propre d'un faux contexte d'authentification pour chaque cas de test. *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: mockUser,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

describe('useAuth', () => {

  // ==========================================================================
  // ---- Tests d'étanchéité et de périmètre du contexte ----
  // ==========================================================================

  it('lève une erreur si utilisé en dehors de AuthProvider', () => {
    // ! ALERTE SÉCURITÉ ARCHITECTURALE : Interception des erreurs de logs. !
    // ! React lève une erreur verbeuse attendue dans la console lors d'un crash provoqué. !
    // ! Ce spy isole et neutralise temporairement le flux d'erreur pour garder un terminal propre. !
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // ! ALERTE SÉCURITÉ ARCHITECTURALE : Le hook doit obligatoirement être consommé sous un AuthProvider. !
    // ! Sans wrapper, useAuth doit lancer une exception immédiate pour empêcher l'exécution de l'application. !
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    )

    consoleSpy.mockRestore()
  })

  // ==========================================================================
  // ---- Tests de restitution des états et types de données ----
  // ==========================================================================

  it('retourne les valeurs du contexte depuis AuthProvider', () => {
    const ctx = makeAuthContext()

    // * Action / Montage : Encapsulation du hook dans un composant de wrapper injectant le Provider. *
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    // ? Lecture et extraction des données du hook ?
    const { result } = renderHook(() => useAuth(), { wrapper })

    // ? Vérification de l'intégrité de la session ?
    // ? On s'assure que le hook extrait et transmet exactement les valeurs sous-jacentes du contexte. ?
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.loading).toBe(false)
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.register).toBe('function')
  })

  it('retourne user null si non connecté', () => {
    // ? Requêtage et configuration d'état ?
    // ? Simulation d'un état où aucun token de session valide n'est stocké en base ou en cookie local. ?
    const ctx = makeAuthContext({ user: null })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // ? Vérification d'absence de session ?
    expect(result.current.user).toBeNull()
  })

  it('retourne loading: true pendant le chargement', () => {
    // ? Requêtage et configuration d'état ?
    // ? Simulation de la phase transitoire d'appel à l'API distante d'authentification. ?
    const ctx = makeAuthContext({ loading: true })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // ? Vérification du verrou de chargement ?
    expect(result.current.loading).toBe(true)
  })

  // ==========================================================================
  // ---- Tests de conformité des pointeurs de fonctions ----
  // ==========================================================================

  it('expose les fonctions login, logout et register', () => {
    // * Action / Espionnage : Instanciation de fonctions espionnes Vitest dédiées. *
    const login = vi.fn()
    const logout = vi.fn()
    const register = vi.fn()
    const ctx = makeAuthContext({ login, logout, register })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // ? Vérification de référence mémoire ?
    // ? L'assertion .toBe s'assure qu'aucune réassignation ou proxy n'altère l'adresse de la fonction déléguée par le contexte. ?
    expect(result.current.login).toBe(login)
    expect(result.current.logout).toBe(logout)
    expect(result.current.register).toBe(register)
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests unitaires du custom hook useAuth terminée.
// ============================================================================