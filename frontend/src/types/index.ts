// =====================================================================================
// CE FICHIER DÉFINIT LES INTERFACES TYPESCRIPT POUR L'APPLICATION DE SUIVI DE FITNESS.
// IL REPRÉSENTE LES STRUCTURES DE DONNÉES UTILISÉES POUR LES UTILISATEURS, LES EXERCICES,
// LES ENTRAÎNEMENTS ET LES STATISTIQUES DE PROGRESSION.
// =====================================================================================

export interface User {
  id: number
  username: string
  email: string
  // ? weight: number | null ? -> Poids de l'utilisateur, peut être nul si non renseigné
  weight: number | null
  // * goal: 'lose' | 'maintain' | 'gain' * -> Objectif strict de l'utilisateur (perdre, maintenir, prendre)
  goal: 'lose' | 'maintain' | 'gain'
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  // * category: 'Musculation' | 'Cardio' | 'Flexibilité' * -> Catégorie fixe de l'exercice pour la logique métier
  category: 'Musculation' | 'Cardio' | 'Flexibilité'
  muscle_group: string | null
  description: string | null
  created_at: string
}

export interface WorkoutExercise {
  // ! id: number ! -> Identifiant unique de la liaison de l'exercice au sein d'une séance spécifique
  id: number
  workout_id: number
  exercise_id: number
  name: string
  category: string
  muscle_group: string | null
  // ? sets: number | null ? -> Nombre de séries, optionnel selon le type d'exercice
  sets: number | null
  // ? reps: number | null ? -> Nombre de répétitions par série
  reps: number | null
  // ? weight_used: number | null ? -> Charge utilisée en kg, nulle si poids du corps ou cardio
  weight_used: number | null
  // ? duration: number | null ? -> Durée spécifique de l'exercice (ex: pour le cardio)
  duration: number | null
}

export interface Workout {
  id: number
  user_id: number
  title: string
  date: string
  duration: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // ? exercise_count?: number ? -> Nombre total d'exercices dans la séance (propriété optionnelle)
  exercise_count?: number
  // ? exercises?: WorkoutExercise[] ? -> Tableau contenant le détail des exercices de la séance (optionnel)
  exercises?: WorkoutExercise[]
}

export interface ProgressionStats {
  // ? user: { ... } ? -> Données de profil agrégées pour l'affichage du tableau de bord
  user: {
    username: string
    weight: number | null
    goal: 'lose' | 'maintain' | 'gain'
    member_since: string
  }
  // ? stats: { ... } ? -> Données calculées issues des requêtes analytiques pour les graphiques et le suivi
  stats: {
    summary: {
      total_workouts: number
      total_minutes: number
      avg_duration: number
      unique_exercises: number
    }
    monthly: Array<{
      month: string
      workout_count: number
      total_minutes: number
    }>
    byCategory: Array<{
      category: string
      exercise_count: number
      total_reps: number
    }>
    recent: Array<{
      id: number
      title: string
      date: string
      duration: number | null
    }>
  }
}

// =====================================================================================
// FIN DU FICHIER DE TYPAGE - ASSURE LA COHÉRENCE ENTRE LE BACKEND ET L'INTERFACE APPLICATIVE
// =====================================================================================