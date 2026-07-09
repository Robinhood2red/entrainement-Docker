// ============================================================================
// Ce fichier centralise les types et interfaces TypeScript partagés dans l'application mobile.
// Il assure le typage des entités de données issues de la base de données (miroir du frontend web)
// ainsi que le typage strict de la navigation (React Navigation).
// ============================================================================

// Types partagés entre les écrans — miroir du frontend web (frontend/src/types/index.ts).
// ! Toute modification du schéma BDD doit être répercutée ici ET dans le frontend web. !

// ? Données de profil utilisateur provenant de la BDD ?
export interface User {
  id: number
  username: string
  email: string
  weight?: number
  goal: 'lose' | 'maintain' | 'gain'
  created_at: string
}

// ? Définition d'un exercice disponible dans le catalogue BDD ?
export interface Exercise {
  id: number
  name: string
  category: 'Musculation' | 'Cardio' | 'Flexibilité'
  muscle_group?: string
  description?: string
  created_at: string
}

// ? Structure d'un exercice lié à une séance d'entraînement spécifique ?
export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  exercise_name?: string
  category?: string
  muscle_group?: string
  sets?: number
  reps?: number
  weight_used?: number
  duration?: number
}

// ? Entité séance d'entraînement complète avec ses exercices associés ?
export interface Workout {
  id: number
  user_id: number
  title: string
  date: string
  duration?: number
  notes?: string
  exercise_count?: number
  exercises?: WorkoutExercise[]
  created_at: string
}

// ? Agglomération des données statistiques globales et mensuelles pour les graphiques ?
export interface ProgressionStats {
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
    }>
    recent: Array<{
      id: number
      title: string
      date: string
      duration?: number
    }>
  }
}

// Types React Navigation — utilisés pour typer useNavigation() et RouteProp.

// * Mapping des routes du Stack principal et validation des paramètres de navigation *
export type RootStackParamList = {
  Login: undefined
  Register: undefined
  AppTabs: undefined
  WorkoutDetail: { workoutId: number; title?: string }
}

// * Mapping des routes des onglets principaux (Bottom Tabs) sans paramètres de navigation *
export type TabParamList = {
  Dashboard: undefined
  Exercises: undefined
  Workouts: undefined
  Profile: undefined
}