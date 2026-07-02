// ============================================================================
// ROLE MACRO : Tests d'intégration UI pour le composant d'inscription (tests/Register.test.tsx).
// Ce script valide le bon fonctionnement du formulaire de création de compte :
// vérification de la présence de l'ensemble des champs (incluant le sélecteur d'objectif),
// transmission conforme du payload à l'action d'inscription, redirection automatique,
// et gestion des conflits de données (ex: email déjà existant).
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'
import { AuthContext, AuthContextType } from '../context/AuthContext'

const mockNavigate = vi.fn()

// ! vi.mock('react-router-dom', ...) !
// ! ALERTE ARCHITECTURALE : Substitution des modules de navigation pour empêcher les changements d'URL réels et intercepter les cibles de redirection. !
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ! vi.mock('react-hot-toast', ...) !
// ! ALERTE INTERFACE : Neutralisation du service de toasts graphiques afin de valider programmatiquement les retours d'informations à l'utilisateur. !
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

const mockRegister = vi.fn()

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Prépare un mock de contexte avec la méthode d'inscription (register) espionnée pour suivre ses invocations. *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  loading: false,
  login: vi.fn(),
  register: mockRegister,
  logout: vi.fn(),
  ...overrides,
})

// * const renderRegister = (...) => ... *
// * Action / Rendu : Monte le composant Register isolé dans son environnement de route et de contexte applicatif. *
const renderRegister = (ctx = makeAuthContext()) =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('Register', () => {
  beforeEach(() => {
    // * Action de nettoyage : Efface l'historique des appels des mocks entre chaque test. *
    vi.clearAllMocks()
  })

  // ==========================================================================
  // ---- Tests de rendu visuel et conformité du DOM ----
  // ==========================================================================

  it('affiche tous les champs du formulaire', () => {
    renderRegister()

    // ? Vérification de la présence des inputs ?
    // ? Recherche les placeholders attendus par l'utilisateur pour valider la complétude du formulaire de saisie. ?
    expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ton@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('6 caractères minimum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument()
  })

  it("affiche le sélecteur d'objectif avec la valeur par défaut", () => {
    renderRegister()

    // ? Lecture de l'état de l'interface ?
    // ? Contrôle que l'élément select se positionne nativement sur l'option attendue de maintien. ?
    expect(screen.getByDisplayValue('Maintenir')).toBeInTheDocument()
  })

  it("contient les 3 options d'objectif", () => {
    renderRegister()

    // ? Vérification du dictionnaire de données ?
    // ? Valide que les choix de l'utilisateur couvrent l'intégralité des trois options de la logique métier (Perdre, Maintenir, Prendre). ?
    expect(screen.getByRole('option', { name: 'Perdre' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Maintenir' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Prendre' })).toBeInTheDocument()
  })

  // ==========================================================================
  // ---- Tests de comportement et d'interaction ----
  // ==========================================================================

  it('appelle register avec les données correctes', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue(undefined)
    renderRegister()

    // * Action utilisateur : Simulation des saisies clavier et validation finale du formulaire d'inscription. *
    await user.type(screen.getByPlaceholderText('johndoe'), 'testuser')
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    // ? Vérification asynchrone du traitement de données ?
    // ? S'assure que le payload collecté par l'interface contient bien toutes les valeurs obligatoires, y compris celle héritée par défaut du select. ?
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          goal: 'maintain',
        })
      )
    })
  })

  it('redirige vers /dashboard après inscription réussie', async () => {
    const user = userEvent.setup()
    mockRegister.mockResolvedValue(undefined)
    renderRegister()

    await user.type(screen.getByPlaceholderText('johndoe'), 'testuser')
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() => {
      // * Vérification de l'action de routage : Redirection vers le tableau de bord validée après l'écriture réussie en base. *
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('affiche un lien vers la page de connexion', () => {
    renderRegister()

    // ? Vérification des liens de redirection alternatifs ?
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })

  it("affiche une erreur toast en cas d'échec d'inscription", async () => {
    const toast = (await import('react-hot-toast')).default
    const user = userEvent.setup()
    
    // ? Simulation d'une erreur de contrainte de clé unique ?
    // ? Injecte un rejet de promesse imitant la réponse du serveur face à une collision d'adresses email (code 409). ?
    mockRegister.mockResolvedValue = mockRegister.mockRejectedValue({ 
      response: { data: { error: 'Email already in use.' } } 
    })
    renderRegister()

    await user.type(screen.getByPlaceholderText('johndoe'), 'testuser')
    await user.type(screen.getByPlaceholderText('ton@email.com'), 'existing@example.com')
    await user.type(screen.getByPlaceholderText('6 caractères minimum'), 'password123')
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() => {
      // ? Lecture des retours utilisateurs : S'assure que le retour d'erreur système est correctement notifié via l'UI. ?
      expect(toast.error).toHaveBeenCalled()
    })
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration du composant Register terminée.
// ============================================================================