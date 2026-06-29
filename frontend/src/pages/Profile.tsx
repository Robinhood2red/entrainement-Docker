// ============================================================================================
// pages/Profile.tsx — Page profil utilisateur
//
// Affiche les informations du compte + un graphique d'activité mensuelle.
// Réutilise le même endpoint que Dashboard (/stats/progression) pour éviter un appel API supplémentaire.
// ============================================================================================

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { User, Target, Scale, Calendar, Activity } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ProgressionStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

// ? ? Dictionnaire de correspondance pour traduire les clés d'objectifs techniques en français ? ?
const GOAL_LABELS: Record<string, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien du poids',
  gain: 'Prise de masse',
}

// * * Couleurs de classes Tailwind associées aux objectifs pour la thématisation de l'interface * *
const GOAL_COLORS: Record<string, string> = {
  lose: 'text-amber-400',
  maintain: 'text-emerald-400',
  gain: 'text-violet-400',
}

// ? ? Dictionnaire de conversion des index de mois ISO numériques en libellés courts francophones ? ?
const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Jul', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

// * * Extraction et formatage du mois depuis une chaîne de caractères au format "YYYY-MM" * *
function formatMonth(m: string) {
  // ? ? Découpage de la chaîne ISO reçue et fallback sécurisé si le mois est inconnu ? ?
  const [, month] = m.split('-')
  return MONTH_LABELS[month] ?? month
}

// * * Conversion d'une chaîne de date ISO (ou Timestamp) en format local français complet * *
function formatDate(d: string) {
  // ? ? Isolation des 10 premiers caractères (YYYY-MM-DD) et conversion sécurisée en nombres ? ?
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  // * * Instanciation de l'objet Date (ajustement de l'index du mois à base 0) et régionalisation * *
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// * * Configuration centralisée du style brut pour l'affichage de l'infobulle du graphique Recharts * *
const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#F1F5F9',
}

export default function Profile() {
  // ! ! Importation de la session globale : s'assurer en amont que le contexte Auth protège cette route ! !
  const { user } = useAuth()
  
  // ? ? Appel API asynchrone sur l'endpoint partagé pour collecter le profil et l'historique d'activité ? ?
  const { data, loading } = useFetch<ProgressionStats>('/stats/progression')

  // ! ! Interception du cycle de rendu si l'état de chargement de l'API est actif pour éviter les erreurs de type undefined ! !
  if (loading) return <LoadingSpinner />

  // ? ? Raccourci de lecture optionnel sur les statistiques utilisateur retournées par l'API ? ?
  const stats = data?.stats

  // * * Préparation des données du graphique : copie superficielle pour inverser le tableau et mapping structurel * *
  const chartData = stats
    ? [...stats.monthly].reverse().map((m) => ({
        name: formatMonth(m.month),
        Séances: m.workout_count,
      }))
    : []

  // * * Calcul des deux premières lettres du pseudonyme utilisateur pour générer l'avatar de remplacement * *
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'FT'

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100">Mon profil</h1>

      {/* Carte utilisateur */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{user?.username}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            {/* ? ? Rendu conditionnel strict : validation de la donnée optionnelle member_since ? ? */}
            {data?.user.member_since && (
              <p className="text-xs text-slate-500 mt-1">
                Membre depuis {formatDate(data.user.member_since)}
              </p>
            )}
          </div>
        </div>

        {/* 3 infos en grille : poids, objectif, nombre de séances */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-700/50">
          <InfoItem
            icon={<Scale size={15} className="text-slate-500" />}
            label="Poids"
            // ? ? Opérateur de chaînage optionnel et valeur par défaut si le poids n'est pas renseigné ? ?
            value={user?.weight ? `${user.weight} kg` : '—'}
          />
          <InfoItem
            icon={<Target size={15} className="text-slate-500" />}
            label="Objectif"
            // * * Injection dynamique d'un nœud JSX stylisé via des clés de dictionnaires associatives * *
            value={
              <span className={GOAL_COLORS[user?.goal ?? 'maintain']}>
                {GOAL_LABELS[user?.goal ?? 'maintain']}
              </span>
            }
          />
          <InfoItem
            icon={<Activity size={15} className="text-slate-500" />}
            label="Séances"
            value={stats?.summary.total_workouts ?? 0}
          />
        </div>
      </div>

      {/* Deux cards côte à côte : minutes totales et exercices maîtrisés */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className="text-indigo-400" />
            <span className="text-xs text-slate-500">Minutes totales</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats?.summary.total_minutes ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">d'entraînement</p>
        </div>
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <User size={14} className="text-violet-400" />
            <span className="text-xs text-slate-500">Exercices maîtrisés</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats?.summary.unique_exercises ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">exercices différents</p>
        </div>
      </div>

      {/* Graphique d'activité mensuelle */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Activité mensuelle</h3>
        {/* ? ? Évaluation de la présence de coordonnées exploitables avant d'instancier Recharts ? ? */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
              <Bar dataKey="Séances" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500 text-sm text-center py-10">Aucune donnée d'activité</p>
        )}
      </div>

      {/* Répartition par catégorie */}
      {/* ? ? Double validation logique : vérification de l'existence du tableau et de sa non-vacuité ? ? */}
      {stats?.byCategory && stats.byCategory.length > 0 && (
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Répartition par type</h3>
          <div className="space-y-3">
            {stats.byCategory.map((cat) => {
              // * * Calcul analytique en ligne du volume cumulé pour générer le ratio de complétion de la jauge * *
              const total = stats.byCategory.reduce((a, c) => a + c.exercise_count, 0)
              const pct = total > 0 ? Math.round((cat.exercise_count / total) * 100) : 0
              const colors: Record<string, string> = {
                Musculation: '#6366F1', Cardio: '#F59E0B', Flexibilité: '#10B981',
              }
              const color = colors[cat.category] ?? '#94A3B8'
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="w-24 shrink-0">
                    <span className="text-xs text-slate-400">{cat.category}</span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    {/* * * Injection d'une largeur en style inline React pour supporter le calcul dynamique du pourcentage * * */}
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// * * Composant interne d'affichage atomique d'informations de statistiques * *
// ! ! Typage strict des Props : 'value' accepte React.ReactNode pour autoriser les structures HTML/JSX ! !
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-sm font-semibold text-slate-200">{value}</p>
    </div>
  )
}

// ============================================================================================
// Fin de pages/Profile.tsx
// ============================================================================================