// ============================================================
// controllers/exercise.controller.js — Logique métier des exercices
//
// Le contrôleur orchestre : il valide les données reçues,
// appelle le modèle pour accéder à la BDD, et renvoie la réponse.
// Il ne contient jamais de SQL — c'est le rôle du modèle.
// ============================================================

const ExerciseModel = require('../models/exercise.model');

// * Liste des catégories autorisées (correspond à l'ENUM défini dans init.sql) *
// * Centralisée ici pour éviter de la dupliquer dans chaque méthode *
const VALID_CATEGORIES = ['Musculation', 'Cardio', 'Flexibilité'];

const ExerciseController = {

  // * ---- GET /api/exercises?category=X&search=Y ---- *
  // * Retourne la liste des exercices avec filtres optionnels *
  async getAll(req, res) {
    try {
      // ? req.query contient les paramètres de l'URL après le ? ?
      // ? Ex: /api/exercises?category=Cardio&search=corde → { category: 'Cardio', search: 'corde' } ?
      const { category, search } = req.query;

      // ! Validation de la catégorie AVANT d'appeler le modèle !
      // ! Permet d'éviter d'envoyer une requête SQL avec une valeur invalide !
      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      const exercises = await ExerciseModel.findAll({ category, search });

      // * On retourne aussi le count : utile côté frontend pour afficher "X exercices" *
      res.json({ exercises, count: exercises.length });
    } catch (err) {
      console.error('GetAll exercises error:', err);
      res.status(500).json({ error: 'Failed to fetch exercises.' });
    }
  },

  // * ---- GET /api/exercises/:id ---- *
  // ? req.params.id contient le segment dynamique de l'URL (ex: /exercises/42 → id = "42") ?
  async getOne(req, res) {
    try {
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });
      // ! 404 = Not Found : la ressource demandée n'existe pas !
      res.json({ exercise });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch exercise.' });
    }
  },

  // * ---- POST /api/exercises ---- *
  // * Crée un nouvel exercice. Requiert name et category. *
  async create(req, res) {
    try {
      // ? req.body est parsé par express.json() (configuré dans server.js) ?
      const { name, category, muscle_group, description } = req.body;

      // ! Validation des champs obligatoires !
      if (!name || !category) {
        return res.status(400).json({ error: 'Name and category are required.' });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      const exercise = await ExerciseModel.create({ name, category, muscle_group, description });

      // * 201 = Created : convention REST pour signaler la création d'une ressource *
      res.status(201).json({ message: 'Exercise created.', exercise });
    } catch (err) {
      console.error('Create exercise error:', err);
      res.status(500).json({ error: 'Failed to create exercise.' });
    }
  },

  // * ---- PUT /api/exercises/:id ---- *
  // * Met à jour un exercice existant. Tous les champs sont optionnels (mise à jour partielle). *
  async update(req, res) {
    try {
      const { name, category, muscle_group, description } = req.body;

      // ? On valide la catégorie seulement si elle est fournie ?
      if (category && !VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      }

      // ! On vérifie l'existence AVANT de mettre à jour pour retourner un 404 clair !
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

      const updated = await ExerciseModel.update(req.params.id, { name, category, muscle_group, description });
      res.json({ message: 'Exercise updated.', exercise: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update exercise.' });
    }
  },

  // * ---- DELETE /api/exercises/:id ---- *
  // * Supprime un exercice. Échoue si l'exercice est utilisé dans une séance. *
  async delete(req, res) {
    try {
      const exercise = await ExerciseModel.findById(req.params.id);
      if (!exercise) return res.status(404).json({ error: 'Exercise not found.' });

      const deleted = await ExerciseModel.delete(req.params.id);
      if (!deleted) return res.status(400).json({ error: 'Cannot delete exercise (may be in use by workouts).' });

      res.json({ message: 'Exercise deleted.' });
    } catch (err) {
      // ! La contrainte FK RESTRICT en BDD lève cette erreur spécifique !
      // ! quand on tente de supprimer un exercice référencé par WorkoutExercise !
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'Cannot delete: exercise is used in one or more workouts.' });
        // ! 409 = Conflict : l'opération est impossible à cause des contraintes d'intégrité !
      }
      res.status(500).json({ error: 'Failed to delete exercise.' });
    }
  },
};

module.exports = ExerciseController;