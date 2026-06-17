// ============================================================
// pages/Login.tsx — Page de connexion
//
// Composant de page React : rendu par React Router quand l'URL est /login.
// Gère un formulaire contrôlé, un appel API asynchrone, et la navigation
// programmatique vers /dashboard après une connexion réussie.
// ============================================================

import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  // ? Récupération de la méthode de connexion depuis le contexte global d'auth ?
  const { login } = useAuth()
  const navigate = useNavigate()

  // ? Initialisation des états locaux pour le contrôle des champs du formulaire ?
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // * Logique métier : État d'attente pour verrouiller l'interface pendant l'appel API *
  const [loading, setLoading] = useState(false)

  // * Action : Soumission du formulaire et traitement de la tentative d'authentification *
  const handleSubmit = async (e: FormEvent) => {
    // * Action : Interception du rechargement de page natif *
    e.preventDefault()
    setLoading(true)
    
    try {
      // ? Requêtage HTTP POST via le service login du contexte global ?
      await login(email, password)
      // * Action : Redirection de l'utilisateur vers son espace personnel *
      navigate('/dashboard')
    } catch (err: unknown) {
      // ! Alerte : Extraction et capture sécurisée du message d'erreur de l'API !
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(message || 'Email ou mot de passe incorrect')
    } finally {
      // * Action finale : Libération du verrou de chargement de l'interface *
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 mb-4">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">FitTrack</h1>
          <p className="text-slate-400 text-sm mt-1">Connecte-toi à ton espace</p>
        </div>

        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
          {/* * Action : Liaison du handler de soumission globale sur le formulaire * */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              {/* ? Lecture et modification de l'état local via l'input contrôlé ? */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="ton@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mot de passe
              </label>
              {/* ? Lecture et modification de l'état local via l'input contrôlé ? */}
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* ! Alerte : Désactivation préventive du bouton pour parer aux double-soumissions ! */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Pas de compte ?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================