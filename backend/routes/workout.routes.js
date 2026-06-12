const express = require('express');
const router = express.Router();
const WorkoutController = require('../controllers/workout.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ! All workout routes are protected !
router.use(authMiddleware);

// ? GET /api/workouts - Retrieve all workouts ?
router.get('/', WorkoutController.getAll);

// ? GET /api/workouts/:id - Retrieve a specific workout by ID ?
router.get('/:id', WorkoutController.getOne);

// * POST /api/workouts - Create a new workout *
router.post('/', WorkoutController.create);

// * PUT /api/workouts/:id - Update a workout entirely *
router.put('/:id', WorkoutController.update);

// ! DELETE /api/workouts/:id - Delete a workout !
router.delete('/:id', WorkoutController.delete);

// * POST /api/workouts/:id/exercises - Add an exercise to a workout *
router.post('/:id/exercises', WorkoutController.addExercise);

// * PATCH /api/workouts/:id/exercises/:weId - Update specific fields of an exercise in a workout *
router.patch('/:id/exercises/:weId', WorkoutController.updateExercise);

// ! DELETE /api/workouts/:id/exercises/:weId - Remove an exercise from a workout !
router.delete('/:id/exercises/:weId', WorkoutController.removeExercise);

module.exports = router;