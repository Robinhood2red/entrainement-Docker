// ============================================================================
// ROLE MACRO : Tests d'intégration asynchrones pour le hook de requêtage (tests/useFetch.test.tsx).
// Ce script valide la cinétique des requêtes HTTP asynchrones gérées par useFetch :
// initialisation des flags de chargement, traitement et mapping des réponses HTTP success (200),
// interception et formatage des cas de pannes réseau (rejet de promesse), ainsi que la
// réactivation manuelle de la synchronisation via la fonction de rappel refetch.
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useFetch } from '../hooks/useFetch'
import api from '../services/api'

// ! vi.mock('../services/api', ...) !
// ! ALERTE ARCHITECTURALE : Substitution globale du client HTTP Axios pour intercepter les requêtes sortantes et court-circuiter le réseau réel. !
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

// ? const mockGet = vi.mocked(api.get) ?
// ? Requêtage et Typage : Récupération de la référence fortement typée du mock api.get pour configurer les promesses de test. ?
const mockGet = vi.mocked(api.get)

describe('useFetch', () => {
  beforeEach(() => {
    // * Action de nettoyage : Vidage complet de l'historique d'appels du mock avant chaque scénario. *
    vi.clearAllMocks()
  })

  // ==========================================================================
  // ---- Tests de démarrage et des états initiaux synchrone ----
  // ==========================================================================

  it('démarre en état de chargement (loading: true, data: null, error: null)', () => {
    // ? Configuration du flux réseau ?
    // ? On injecte délibérément une promesse jamais résolue pour maintenir le hook dans son état initial et valider ses variables d'attente. ?
    mockGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useFetch<{ items: number[] }>('/test'))

    // ? Vérification synchrone de l'état initial ?
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  // ==========================================================================
  // ---- Tests des résolutions asynchrones (Success & Errors) ----
  // ==========================================================================

  it('retourne les données après un appel API réussi', async () => {
    const responseData = { items: [1, 2, 3] }
    // ? Simulation d'une réponse de base de données (HTTP 200) ?
    mockGet.mockResolvedValue({ data: responseData })

    const { result } = renderHook(() => useFetch<{ items: number[] }>('/test'))

    // ? Attente asynchrone du changement d'état du DOM virtuel ?
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // ? Vérification de l'intégrité des données reçues ?
    expect(result.current.data).toEqual(responseData)
    expect(result.current.error).toBeNull()
    expect(mockGet).toHaveBeenCalledWith('/test')
  })

  it("retourne une erreur en cas d'échec de l'appel API", async () => {
    // ! ALERTE COMPORTEMENTALE : Erreur de communication ou serveur inaccessible. !
    // ! On simule un crash réseau ou un rejet de promesse pour s'assurer du comportement résilient de l'application. !
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFetch<unknown>('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // ? Vérification de la gestion des exceptions et du message utilisateur de secours ?
    expect(result.current.error).toBe('Impossible de charger les données')
    expect(result.current.data).toBeNull()
  })

  // ==========================================================================
  // ---- Tests des mécanismes de ré-interrogation (Refetch) ----
  // ==========================================================================

  it('refetch déclenche un nouvel appel API', async () => {
    mockGet.mockResolvedValue({ data: { count: 1 } })

    const { result } = renderHook(() => useFetch<{ count: number }>('/test'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGet).toHaveBeenCalledTimes(1)

    // * Action de rafraîchissement : Déclenchement manuel de l'appel de mise à jour des données. *
    act(() => {
        result.current.refetch()
    })

    // ? Attente et validation de la seconde requête ?
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2)
    })
  })

  it('remet loading à true lors du refetch', async () => {
    mockGet.mockResolvedValue({ data: { count: 1 } })

    const { result } = renderHook(() => useFetch<{ count: number }>('/test'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    // ? Configuration de la seconde phase réseau ?
    // ? On re-bloque la requête suivante pour capter la transition instantanée du booléen de chargement. ?
    mockGet.mockReturnValue(new Promise(() => {}))

    // * Action de rafraîchissement *
    act(() => {
        result.current.refetch()
    })

    // ? Vérification immédiate du verrouillage d'écran graphique ?
    await waitFor(() => expect(result.current.loading).toBe(true))
  })

  it('appelle api.get avec la bonne URL', async () => {
    mockGet.mockResolvedValue({ data: {} })

    renderHook(() => useFetch('/stats/progression'))

    // ? Vérification du routage de l'API REST ?
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/stats/progression')
    })
  })
})

// ============================================================================
// FIN DU FICHIER : Suite de tests asynchrones du custom hook useFetch terminée.
// ============================================================================