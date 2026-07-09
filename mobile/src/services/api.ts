// ============================================================================
// api.ts — Client HTTP centralisé (Axios)
//
// Toutes les requêtes vers le backend passent par cette instance.
// Avantage : on configure le JWT et la gestion d'erreur UNE SEULE FOIS ici,
// et tous les écrans en bénéficient automatiquement.
// ============================================================================

import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../config'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Typage explicite de config : InternalAxiosRequestConfig
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // ? Récupération du token JWT stocké localement avant l'envoi de la requête ?
  const token = await AsyncStorage.getItem('token')
  if (token) {
    // ! Sécurité : injection du header d'autorisation Bearer pour authentifier la requête HTTP !
    config.headers.Authorization = `Bearer ${token}`
  }
  // * Action : transmission de la configuration modifiée pour poursuivre l'appel réseau *
  return config
})

// Typage explicite de response et error
api.interceptors.response.use(
  // * Action : pas d'erreur, transmission directe de la réponse au composant appelant *
  (response: AxiosResponse) => response,
  // Cas d'erreur : on intercepte pour traiter le status 401
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // ! Alerte sécurité : token invalide ou expiré (401), suppression du stockage pour forcer la reconnexion !
      await AsyncStorage.removeItem('token')
    }
    // * Action : propagation de l'erreur au bloc catch du composant pour gestion locale du feedback utilisateur *
    return Promise.reject(error)
  }
)

export default api