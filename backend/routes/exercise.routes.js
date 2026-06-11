// ============================================================
// routes/exercise.routes.js — Définition des routes des exercices
//
// Toutes les routes ici sont protégées par authMiddleware.
// Au lieu de passer authMiddleware sur chaque route individuellement,
// on l'applique une seule fois avec router.use() : il s'exécute
// automatiquement avant TOUTES les routes déclarées après lui.
// ============================================================

const express = require('express');
const router = express.Router();
const ExerciseController = require('../controllers/exercise.controller');
const authMiddleware = require('../middleware/auth.middleware');

//  Applique authMiddleware sur toutes les routes de ce fichier 
//  Plus concis que de l'écrire sur chaque router.get/post/put/delete 
// ! ATTENTION : Seules les routes déclarées APRÈS ce router.use seront protégées. !
router.use(authMiddleware);

// ? GET /api/exercises?category=Musculation&search=squat ?
// * Paramètres de filtre optionnels passés dans l'URL (query string) *
router.get('/', ExerciseController.getAll);

// ? GET /api/exercises/:id ?
// * :id est un paramètre dynamique accessible via req.params.id *
router.get('/:id', ExerciseController.getOne);

// ? POST /api/exercises — Crée un exercice ?
router.post('/', ExerciseController.create);

// ? PUT /api/exercises/:id — Met à jour un exercice complet ?
router.put('/:id', ExerciseController.update);

// ? DELETE /api/exercises/:id — Supprime un exercice ?
router.delete('/:id', ExerciseController.delete);

module.exports = router;