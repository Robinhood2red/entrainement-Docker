// ============================================================================
// ROLE MACRO : Tests d'intégration UI pour la barre de navigation latérale (tests/Sidebar.test.tsx).
// Ce script valide l'affichage des éléments structurels de l'application (liens, logo),
// le formatage dynamique du profil utilisateur (initiales de l'avatar et fallback),
// ainsi que le déclenchement de la procédure de déconnexion globale avec redirection.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/Layout/Sidebar'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockNavigate = vi.fn()

// ! vi.mock('react-router-dom', ...) !
// ! ALERTE ARCHITECTURALE : Mock du système de routage pour intercepter et espionner les demandes de changements de page (useNavigate). !
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: null,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

const mockLogout = vi.fn()

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Prépare le contexte d'authentification avec la fonction de déconnexion bouchonnée pour suivre son exécution. *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: mockUser,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: mockLogout,
  ...overrides,
})

// * const renderSidebar = (...) => ... *
// * Action / Rendu : Monte le composant Sidebar dans un routeur virtuel pré-positionné sur l'URL '/dashboard' pour permettre aux NavLink d'activer leurs styles CSS. *
const renderSidebar = (ctx = makeAuthContext()) =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('Sidebar', () => {
  beforeEach(() => {
    // * Action de nettoyage : Réinitialise l'état et l'historique d'appels de l'ensemble des espions. *
    vi.clearAllMocks()
  })

  // ==========================================================================
  // ---- Tests de rendu visuel et présence des éléments ----
  // ==========================================================================

  it('affiche tous les liens de navigation', () => {
    renderSidebar()

    // ? Vérification des nœuds de navigation ?
    // ? Recherche textuelle stricte pour attester que les ancres principales de l'application sont bien à la disposition de l'utilisateur. ?
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Exercices')).toBeInTheDocument()
    expect(screen.getByText('Déconnexion')).toBeInTheDocument()
  })

  it("affiche le nom d'utilisateur et l'email", () => {
    renderSidebar()

    // ? Lecture de l'état du DOM ?
    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it("affiche les initiales de l'utilisateur (2 premières lettres en majuscules)", () => {
    renderSidebar()

    // ? Vérification du formatage des données ?
    // ? Valide la transformation de la chaîne brute du modèle métier en chaîne de présentation majuscule ("testuser" -> "TE"). ?
    expect(screen.getByText('TE')).toBeInTheDocument()
  })

  it("affiche 'FT' si aucun utilisateur n'est connecté", () => {
    // ! ALERTE COMPORTEMENTALE : Cas limite. Si aucune donnée de session n'est disponible, l'avatar doit afficher un fallback sécurisé sans planter le composant. !
    renderSidebar(makeAuthContext({ user: null }))

    // ? Vérification de la valeur de repli ?
    expect(screen.getByText('FT')).toBeInTheDocument()
  })

  it('affiche le logo FitTrack', () => {
    renderSidebar()

    // ? Vérification de la marque ?
    expect(screen.getByText('FitTrack')).toBeInTheDocument()
  })

  // ==========================================================================
  // ---- Tests de comportement et d'interaction ----
  // ==========================================================================

  it('appelle logout et redirige vers /login au clic sur Déconnexion', () => {
    renderSidebar()

    // * Action utilisateur : Simule l'événement de clic synchrone sur le bouton d'action de sortie. *
    fireEvent.click(screen.getByText('Déconnexion'))

    // ? Vérification des effets de la logique métier ?
    // ? S'assure que la fonction logout du contexte a été sollicitée et que l'utilisateur est redirigé vers l'écran d'accueil d'authentification. ?
    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration du composant Sidebar terminée.
// ============================================================================