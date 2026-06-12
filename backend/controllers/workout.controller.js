// ============================================================
// controllers/workout.controller.js — Logique métier des séances
//
// Gère les opérations CRUD sur les séances ET sur les exercices
// d'une séance (ajout, modification, suppression d'un exercice).
// req.user est injecté par authMiddleware (contient id, email, username).
// ============================================================

const WorkoutModel = require('../models/workout.model');

const WorkoutController = {

  // ? ---- GET /api/workouts ---- ?
  // ? Retourne toutes les séances de l'utilisateur connecté ?
  async getAll(req, res) {
    try {
      // ! Isolation garantie côté SQL : chaque utilisateur ne voit que SES séances !
      const workouts = await WorkoutModel.findAllByUser(req.user.id);
      res.json({ workouts, count: workouts.length });
    } catch (err) {
      // ! Log d'erreur critique pour le débogage !
      console.error('GetAll workouts error:', err);
      res.status(500).json({ error: 'Failed to fetch workouts.' });
    }
  },

  // ? ---- GET /api/workouts/:id ---- ?
  // ? Retourne une séance avec ses exercices détaillés ?
  async getOne(req, res) {
    try {
      // ! Sécurité : on passe req.user.id pour vérifier l'appartenance !
      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!workout) return res.status(404).json({ error: 'Workout not found.' });
      res.json({ workout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch workout.' });
    }
  },

  // * ---- POST /api/workouts ---- *
  // * Crée une séance avec ses exercices en une seule requête *
  async create(req, res) {
    try {
      const { title, date, duration, notes, exercises } = req.body;

      if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
      }

      // * Étape 1 : création de la séance liée à l'utilisateur connecté *
      const workoutId = await WorkoutModel.create({
        user_id: req.user.id,
        title,
        date,
        duration,
        notes,
      });

      // * Étape 2 : ajout des exercices si fournis dans le body *
      if (Array.isArray(exercises) && exercises.length > 0) {
        for (const ex of exercises) {
          if (!ex.exercise_id) continue; // ! Ignore les entrées invalides sans exercise_id !
          await WorkoutModel.addExercise(workoutId, ex);
        }
      }

      // * Étape 3 : lecture de la séance complète pour la réponse *
      const workout = await WorkoutModel.findById(workoutId, req.user.id);
      res.status(201).json({ message: 'Workout created.', workout });
    } catch (err) {
      console.error('Create workout error:', err);
      res.status(500).json({ error: 'Failed to create workout.' });
    }
  },

  // * ---- PUT /api/workouts/:id ---- *
  // * Met à jour une séance et remplace complètement ses exercices *
  async update(req, res) {
    try {
      const { title, date, duration, notes, exercises } = req.body;

      // ! Vérification d'existence et d'appartenance AVANT la modification !
      const existing = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!existing) return res.status(404).json({ error: 'Workout not found.' });

      await WorkoutModel.update(req.params.id, req.user.id, { title, date, duration, notes });

      // * Stratégie : On remplace tout (DELETE + INSERT) pour éviter de calculer le diff *
      if (Array.isArray(exercises)) {
        await WorkoutModel.replaceExercises(req.params.id, exercises);
      }

      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      res.json({ message: 'Workout updated.', workout });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update workout.' });
    }
  },

  // * ---- POST /api/workouts/:id/exercises ---- *
  // * Ajoute un exercice à une séance existante *
  async addExercise(req, res) {
    try {
      // ! Vérification des droits d'accès sur la séance !
      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!workout) return res.status(404).json({ error: 'Workout not found.' });

      const { exercise_id, sets, reps, weight_used, duration } = req.body;
      if (!exercise_id) return res.status(400).json({ error: 'exercise_id is required.' });

      await WorkoutModel.addExercise(req.params.id, { exercise_id, sets, reps, weight_used, duration });

      const updated = await WorkoutModel.findById(req.params.id, req.user.id);
      res.status(201).json({ message: 'Exercise added.', workout: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add exercise.' });
    }
  },

  // * ---- PATCH /api/workouts/:id/exercises/:weId ---- *
  // * Modifie les stats d'un exercice (table de jointure) dans une séance *
  async updateExercise(req, res) {
    try {
      // ! Vérification d'appartenance via req.params.id !
      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!workout) return res.status(404).json({ error: 'Workout not found.' });

      const { sets, reps, weight_used, duration } = req.body;

      // * req.params.weId correspond à l'id de la table de jointure WorkoutExercise *
      await WorkoutModel.updateExercise(req.params.weId, req.params.id, { sets, reps, weight_used, duration });

      const updated = await WorkoutModel.findById(req.params.id, req.user.id);
      res.json({ message: 'Exercise updated.', workout: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update exercise.' });
    }
  },

  // ! ---- DELETE /api/workouts/:id/exercises/:weId ---- !
  // ! Retire un exercice d'une séance (sans supprimer l'entité exercice globale) !
  async removeExercise(req, res) {
    try {
      const workout = await WorkoutModel.findById(req.params.id, req.user.id);
      if (!workout) return res.status(404).json({ error: 'Workout not found.' });

      const deleted = await WorkoutModel.removeExercise(req.params.weId, req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Exercise not found in this workout.' });

      const updated = await WorkoutModel.findById(req.params.id, req.user.id);
      res.json({ message: 'Exercise removed.', workout: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove exercise.' });
    }
  },

  // ! ---- DELETE /api/workouts/:id ---- !
  // ! Supprime une séance et ses exercices associés (ON DELETE CASCADE en BDD) !
  async delete(req, res) {
    try {
      // ! Sécurité : retourne false si la séance n'existe pas ou n'appartient pas à l'user !
      const deleted = await WorkoutModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ error: 'Workout not found.' });
      res.json({ message: 'Workout deleted.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete workout.' });
    }
  },
};

module.exports = WorkoutController;