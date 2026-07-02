// ============================================================================
// ROLE MACRO : Tests d'intégration pour le gardien de navigation (tests/PrivateRoute.test.tsx).
// Ce script valide la protection des routes de l'application selon trois états
// du cycle de vie de la session : affichage du loader pendant la phase de vérification,
// redirection stricte vers la page d'authentification en l'absence d'utilisateur,
// et libération du composant interne (Outlet) dès lors que la session est valide.
// ============================================================================

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PrivateRoute from '../components/PrivateRoute'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { User } from '../types'

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: null,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Initialise une session anonyme fictive modifiable pour chaque scénario de test. *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// * const renderWithRoutes = (...) => ... *
// * Action / Rendu : Simule une pile de routage imbriquée dans le DOM virtuel pour permettre à React Router de calculer et d'exécuter les redirections graphiques. *
const renderWithRoutes = (ctx: AuthContextType, initialPath = '/dashboard') =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          {/* PrivateRoute comme element parent : agit comme un garde */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Contenu Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Page Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('PrivateRoute', () => {
  it('affiche le spinner pendant le chargement initial', () => {
    // ? Lecture de l'état initial ?
    renderWithRoutes(makeAuthContext({ loading: true }))

    // ? Vérification graphique ?
    // ? On s'assure qu'en phase de chargement, l'interface affiche l'icône d'attente système. ?
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('redirige vers /login si non connecté', () => {
    // ! ALERTE SÉCURITÉ : Garde de sécurité activé. Un utilisateur anonyme tentant de forcer l'accès au tableau de bord doit être éjecté immédiatement. !
    renderWithRoutes(makeAuthContext({ user: null, loading: false }))

    // ? Lecture de l'état du DOM ?
    // ? L'arbre de route doit avoir muté : la page de Login doit être visible, et l'interface protégée totalement absente du rendu. ?
    expect(screen.getByText('Page Login')).toBeInTheDocument()
    expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
  })

  it('affiche le contenu protégé si connecté', () => {
    // * Action de déblocage : Session valide transmise au fournisseur de contexte. *
    renderWithRoutes(makeAuthContext({ user: mockUser, loading: false }))

    // ? Vérification d'accès ?
    // ? Le composant enfant doit être rendu avec succès grâce à l'appel interne de la balise <Outlet />. ?
    expect(screen.getByText('Contenu Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Page Login')).not.toBeInTheDocument()
  })

  it("n'affiche pas le contenu pendant le chargement", () => {
    // ! ALERTE COMPORTEMENTALE : Si la session contient des données utilisateur mais que le statut d'authentification est encore asynchrone (loading: true), le contenu sécurisé doit rester caché pour éviter les flashs visuels. !
    renderWithRoutes(makeAuthContext({ loading: true, user: mockUser }))

    // ? Vérification d'étanchéité ?
    expect(screen.queryByText('Contenu Dashboard')).not.toBeInTheDocument()
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests de la route de sécurité PrivateRoute terminée.
// ============================================================================