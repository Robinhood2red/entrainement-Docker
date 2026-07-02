// ============================================================================
// ROLE MACRO : Tests d'intégration UI pour le composant Dashboard (tests/Dashboard.test.tsx).
// Ce script valide le cycle de vie asynchrone du tableau de bord : affichage du
// loader pendant la requête Axios, relecture et formatage des statistiques
// de progression (cards de synthèse, liste des séances récentes, conversion du
// libellé d'objectif) et gestion robuste de l'état vide.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { AuthContext, AuthContextType } from '../context/AuthContext'
import { ProgressionStats, User } from '../types'
import api from '../services/api'

// ---- Configuration des Mocks et de la Sandbox ----

// ! vi.mock('../services/api', ...) !
// ! ALERTE ARCHITECTURALE : Court-circuite l'instance globale d'Axios pour interdire tout appel réseau réel et simuler les réponses HTTP du serveur. !
vi.mock('../services/api', () => ({
  default: { get: vi.fn() },
}))

// ! vi.mock('recharts', ...) !
// ! ALERTE INTERFACE : Neutralise le moteur de rendu SVG complexe de Recharts qui s'effondre sous jsdom (absence de layout engine). On le substitue par des stubs HTML standards. !
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  CartesianGrid: () => null,
}))

const mockGet = vi.mocked(api.get)

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: 75,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
}

// Jeu de données statistiques témoin pour injecter dans le mock Axios
const mockStats: ProgressionStats = {
  user: { username: 'testuser', weight: 75, goal: 'maintain', member_since: '2024-01-01' },
  stats: {
    summary: {
      total_workouts: 12,
      total_minutes: 720,
      avg_duration: 45,
      unique_exercises: 9,
    },
    monthly: [
      { month: '2024-01', workout_count: 4, total_minutes: 240 },
      { month: '2024-02', workout_count: 8, total_minutes: 480 },
    ],
    byCategory: [
      { category: 'Musculation', exercise_count: 8, total_reps: 320 },
    ],
    recent: [
      { id: 1, title: 'Séance du lundi', date: '2024-01-15', duration: 90 },
    ],
  },
}

// * const makeAuthContext = (...) => ... *
// * Action / Initialisation : Prépare la session globale de l'utilisateur avec des données par défaut valides. *
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: mockUser,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// * const renderDashboard = (...) => ... *
// * Action / Rendu : Monte le composant dans un wrapper isolé contenant le routeur mémoire et le fournisseur de contexte d'authentification. *
const renderDashboard = (ctx = makeAuthContext()) =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('Dashboard', () => {
  beforeEach(() => {
    // * Action de nettoyage : Remet à zéro les compteurs d'appels des espions. *
    vi.clearAllMocks()
  })

  it('affiche le spinner pendant le chargement', () => {
    // ! ALERTE COMPORTEMENTALE : Renvoie une promesse en suspens pour maintenir le composant à l'état initial d'attente (isLoading = true). !
    mockGet.mockReturnValue(new Promise(() => {}))
    renderDashboard()

    // ? Vérification graphique ?
    // ? On cible la classe utilitaire d'animation Tailwind pour valider visuellement la présence de l'indicateur de chargement. ?
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it("affiche le message de bienvenue avec le nom d'utilisateur", async () => {
    // ? Mock de lecture de données ?
    mockGet.mockResolvedValue({ data: mockStats })
    renderDashboard()

    // ? Attente asynchrone ?
    // ? waitFor intercepte la mise à jour asynchrone du DOM après la résolution de la promesse Axios. ?
    await waitFor(() => {
      expect(screen.getByText(/bonjour, testuser/i)).toBeInTheDocument()
    })
  })

  it('affiche les 4 cards de statistiques avec les bonnes valeurs', async () => {
    mockGet.mockResolvedValue({ data: mockStats })
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Séances totales')).toBeInTheDocument()
      expect(screen.getByText("Minutes d'entraînement")).toBeInTheDocument()
      expect(screen.getByText('Durée moyenne')).toBeInTheDocument()
      expect(screen.getByText('Exercices différents')).toBeInTheDocument()
    })

    // ? Vérification de l'affichage des métriques métier ?
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('720')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
  })

  it('affiche les dernières séances', async () => {
    mockGet.mockResolvedValue({ data: mockStats })
    renderDashboard()

    await waitFor(() => {
      // ? Lecture et présence des lignes du tableau / historique récent ?
      expect(screen.getByText('Séance du lundi')).toBeInTheDocument()
    })
  })

  it("affiche 0 pour les stats quand il n'y a pas de données", async () => {
    const emptyStats: ProgressionStats = {
      ...mockStats,
      stats: {
        ...mockStats.stats,
        summary: { total_workouts: 0, total_minutes: 0, avg_duration: 0, unique_exercises: 0 },
        recent: [],
        byCategory: [],
      },
    }
    // ? Mock d'état vide ?
    mockGet.mockResolvedValue({ data: emptyStats })
    renderDashboard()

    await waitFor(() => {
      // ? Traitement d'exception UI : S'assure qu'un message d'absence d'activité (Empty State) s'affiche correctement pour guider l'utilisateur. ?
      expect(screen.getByText('Aucune séance.')).toBeInTheDocument()
    })
  })

  it("affiche l'objectif de l'utilisateur", async () => {
    mockGet.mockResolvedValue({ data: mockStats })
    renderDashboard()

    await waitFor(() => {
      // ? Traduction et mapping logique : Vérifie que la clé brute 'maintain' est convertie en texte lisible via l'objet d'association (Dictionary Mapping). ?
      expect(screen.getByText(/Maintien du poids/)).toBeInTheDocument()
    })
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration du composant Dashboard finalisée.
// ============================================================================