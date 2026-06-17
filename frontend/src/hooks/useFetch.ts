// ============================================================
// hooks/useFetch.ts — Hook générique pour les appels API GET
//
// Ce hook centralise la logique répétitive de tout appel API :
//   - état de chargement (loading)
//   - données reçues (data)
//   - gestion d'erreur (error)
//   - possibilité de relancer la requête (refetch)
//
// Le <T> est un générique TypeScript : il permet de typer le résultat
// à l'usage. Ex: useFetch<{ exercises: Exercise[] }>('/exercises')
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

interface UseFetchResult<T> {
  data: T | null      
  loading: boolean    
  error: string | null
  refetch: () => void 
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  // ? Initialisation des états locaux pour stocker les données de requêtage ?
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // * Définition de l'action de fetch mémoïsée pour éviter les rendus infinis *
  const fetchData = useCallback(() => {
    // * Action : Réinitialisation des états avant le lancement de la requête *
    setLoading(true)
    setError(null)

    // ? Requêtage HTTP GET vers l'API avec le type générique attendu ?
    api
      .get<T>(url)
      // ? Lecture des données reçues en cas de succès ?
      .then((res: { data: T }) => setData(res.data))
      // ! Alerte : Capture de l'erreur si l'appel API échoue !
      .catch(() => setError('Impossible de charger les données'))
      // * Action finale : Désactivation de l'état de chargement *
      .finally(() => setLoading(false))
  }, [url]) 

  // * Étape du cycle de vie : Déclenchement de la requête *
  useEffect(() => {
    // ! Alerte : On isole l'exécution pour éviter les setState synchrones en cascade !
    const startFetch = async () => {
      fetchData()
    }
    
    startFetch()
  }, [fetchData])

  // * Retour des données et de l'action refetch pour les composants consommateurs *
  return { data, loading, error, refetch: fetchData }
}

// ============================================================