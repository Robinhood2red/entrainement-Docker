// ============================================================================
// ROLE MACRO : Tests d'intégration UI pour le composant de connexion (tests/Login.test.tsx).
// Ce script valide le comportement du formulaire d'authentification : rendu visuel,
// saisie utilisateur via user-event, soumission asynchrone, redirection vers le
// tableau de bord et affichage des messages d'erreur en cas d'échec.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { AuthContext, AuthContextType } from '../context/AuthContext'

// ---- Configuration des espions et mocks globaux ----
const mockNavigate = vi.fn()

// ! vi.mock('react-router-dom', ...) !
// ! ALERTE ARCHITECTURALE : Intercepte les hooks de navigation pour éviter de déclencher des redirections réelles dans l'environnement de test jsdom. !
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ! vi.mock('react-hot-toast', ...) !
// ! ALERTE INTERFACE : Neutralise le gestionnaire de notifications pour pouvoir espionner ses déclenchements sans instancier de rendu graphique de toast. !
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

const mockLogin = vi.fn()

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Fabrique un faux contexte d'authentification malléable pour simuler les différents états de la session (chargement, utilisateur connecté, etc.). *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  loading: false,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// * const renderLogin = (...) => ... *
// * Action / Rendu : Encapsule le composant Login dans ses providers indispensables (contexte global + routeur virtuel) pour l'isoler fidèlement. *
const renderLogin = (ctx = makeAuthContext()) =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('Login', () => {
  beforeEach(() => {
    // * Action de nettoyage : Remet à zéro l'historique des appels des espions avant chaque itération pour éviter les effets de bord. *
    vi.clearAllMocks()
  })

  // ==========================================================================
  // ---- Tests de rendu graphique (Ce que l'utilisateur voit) ----
  // ==========================================================================

  it('affiche le formulaire avec les champs email et mot de passe', () => {
    renderLogin()

    // ? Vérification de la présence des éléments ?
    // ? Recherche les éléments par leurs attributs d'accessibilité visibles pour l'utilisateur final. ?
    expect(screen.getByPlaceholderText('ton@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it("affiche un lien vers la page d'inscription", () => {
    renderLogin()

    // ? Vérification de l'arborescence DOM ?
    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  // ==========================================================================
  // ---- Tests de comportement et d'interaction ----
  // ==========================================================================

  it('appelle login avec les bons identifiants à la soumission', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    renderLogin()

    // * Action utilisateur : Simule la saisie réaliste au clavier et le clic sur le bouton de validation. *
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    // ? Vérification asynchrone des appels ?
    // ? Attend que le cycle asynchrone se termine et vérifie que la méthode du contexte a reçu les arguments attendus. ?
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('redirige vers /dashboard après connexion réussie', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      // * Vérification de l'action de routage : S'assure que l'utilisateur est bien redirigé vers l'espace applicatif sécurisé. *
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it("affiche une erreur toast en cas d'échec de connexion", async () => {
    const toast = (await import('react-hot-toast')).default
    const user = userEvent.setup()
    
    // ? Simulation d'une levée d'exception ?
    // ? Rejette la promesse pour reproduire la réception d'un code erreur 401 ou 400 de l'API. ?
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials.' } } })
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      // ? Lecture des effets secondaires : S'assure que l'alerte utilisateur a bien été déclenchée. ?
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('désactive le bouton pendant le chargement', async () => {
    const user = userEvent.setup()
    // ! ALERTE COMPORTEMENTALE : Bloque délibérément la promesse en suspens pour maintenir indéfiniment l'état d'envoi (loading). !
    mockLogin.mockImplementation(() => new Promise(() => {}))
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      // ? Vérification de l'interface : Le bouton doit afficher l'état transitoire et bloquer toute soumission multiple accidentelle. ?
      expect(screen.getByRole('button', { name: /connexion\.\.\./i })).toBeDisabled()
    })
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration du composant Login finalisée.
// ============================================================================