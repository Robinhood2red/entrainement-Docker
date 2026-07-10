// ============================================================
// services/api.ts — Instance Axios centralisée
//
// Axios est une librairie pour faire des requêtes HTTP depuis le navigateur.
// Plutôt que de créer une nouvelle instance à chaque appel, on en configure
// une seule ici avec les réglages communs (baseURL, token JWT, gestion 401).
// Tous les fichiers du frontend importent cette instance au lieu d'axios directement.
// ============================================================

import axios from 'axios'

// * axios.create() retourne une instance Axios préconfigurée *
// * baseURL : toutes les requêtes seront relatives à /api (Ex : api.get('/auth/me') -> GET /api/auth/me) *
// * Le proxy Vite (vite.config.ts) redirige /api → http://backend:5000 *
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});


// * INTERCEPTEUR DE REQUÊTE : S'exécute automatiquement avant chaque envoi pour centraliser la logique métier *
api.interceptors.request.use((config) => {
  // ? Récupération du token stocké dans le localStorage après le login ?
  const token = localStorage.getItem('token')
  
  if (token) {
    // * Action : Ajout du token JWT au format "Bearer" dans le header Authorization *
    config.headers.Authorization = `Bearer ${token}`
  }
  // * On retourne la config modifiée pour continuer le cycle de la requête *
  return config 
})

// * INTERCEPTEUR DE RÉPONSE : Gestion centralisée des retours de l'API *
api.interceptors.response.use(
  // ? Succès (statut 2xx) : on laisse passer la réponse sans modification ?
  (response) => response,

  (error) => {
    // ? Vérification du statut de l'erreur : est-ce un problème d'authentification ? ?
    if (error.response?.status === 401) {
      // ! ALERTE : Token expiré ou invalide détecté !
      // ! Sécurité : Suppression immédiate du token périmé pour invalider la session locale !
      localStorage.removeItem('token')      
      
      // * Action : Redirection forcée de l'utilisateur vers la page de connexion *
      window.location.href = '/login'        
    }
    // * On propage l'erreur pour que les composants appelants puissent la traiter si nécessaire *
    return Promise.reject(error)
  }
)

export default api

// ============================================================
// Fin du fichier services/api.ts
// ============================================================