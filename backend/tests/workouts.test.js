// ============================================================================
// ROLE MACRO : Tests d'intégration pour l'API des séances d'entraînement (tests/workouts.test.js).
// Ce script teste les endpoints CRUD liés aux séances (/api/workouts).
// Il garantit le respect de la propriété des données (isolation par utilisateur via le JWT),
// la validation stricte des payloads (champs obligatoires), ainsi que la création
// combinée d'une séance avec sa liste d'exercices associés.
// ============================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ---- Déclaration des Mocks globaux ----
// ! jest.mock('../config/database', ...) !
// ! ALERTE ARCHITECTURALE : Annule l'accès réseau à la base de données réelle pour s'assurer qu'aucune altération ou écriture SQL n'ait lieu hors sandbox. !
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

// ? jest.mock('../models/workout.model', ...) ?
// ? Requêtage et interception : Remplace l'ensemble des interactions avec la table des séances par des espions configurables (jest.fn()). ?
jest.mock('../models/workout.model', () => ({
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  addExercise: jest.fn(),
  updateExercise: jest.fn(),
  removeExercise: jest.fn(),
  replaceExercises: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getProgressionStats: jest.fn(),
}));

const app = require('../server');
const WorkoutModel = require('../models/workout.model');

// ---- Générateur de header JWT ----
// * const authHeader = () => { ... } *
// * Action / Authentification : Crée un en-tête d'autorisation contenant un jeton d'un utilisateur de test (id: 1). Indispensable pour injecter req.user dans les contrôleurs. *
const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )}`,
});

// Séance de référence : user_id: 1 correspond à l'utilisateur du token
const BASE_WORKOUT = {
  id: 1,
  user_id: 1,
  title: 'Séance du lundi',
  date: '2024-01-15',
  duration: 60,
  notes: null,
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
  exercises: [],
};

describe('Workout Routes', () => {
  beforeEach(() => {
    // * Action de nettoyage : Remet à zéro l'état interne de tous les espions pour isoler chaque cas de test. *
    jest.clearAllMocks();
  });

  // ==========================================================================
  describe('GET /api/workouts', () => {
  // ==========================================================================

    it("retourne les séances de l'utilisateur (200)", async () => {
      // ? Lecture de données ?
      // ? On configure le mock pour qu'il retourne un tableau contenant notre séance témoin. ?
      WorkoutModel.findAllByUser.mockResolvedValue([BASE_WORKOUT]);

      // * Action / Simulation *
      const res = await request(app)
        .get('/api/workouts')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('workouts');
      expect(res.body.count).toBe(1);
      expect(res.body.workouts[0].title).toBe('Séance du lundi');
    });

    it('retourne 401 sans token', async () => {
      // ! ALERTE SÉCURITÉ : Contrôle d'accès. Le middleware de sécurité doit intercepter la requête et bloquer la lecture si l'en-tête est manquant. !
      const res = await request(app).get('/api/workouts');

      expect(res.status).toBe(401);
    });

    it('retourne un tableau vide si aucune séance', async () => {
      // ? Vérification de cohérence de données ?
      // ? Un utilisateur sans séances enregistrées doit recevoir une réponse 200 avec un tableau vide, et non une erreur 404. ?
      WorkoutModel.findAllByUser.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/workouts')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.workouts).toEqual([]);
      expect(res.body.count).toBe(0);
    });
  });

  // ==========================================================================
  describe('POST /api/workouts', () => {
  // ==========================================================================

    it('crée une séance avec succès (201)', async () => {
      // ? Écriture / Préparation des données ?
      // ? Simulation de l'insertion en cascade : d'abord la création de la séance principale (retourne un insertId de 1), puis la relecture du modèle complet. ?
      WorkoutModel.create.mockResolvedValue(1);
      WorkoutModel.findById.mockResolvedValue(BASE_WORKOUT);

      // * Action / Simulation *
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ title: 'Séance du lundi', date: '2024-01-15', duration: 60 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Workout created.');
      expect(res.body.workout.title).toBe('Séance du lundi');
    });

    it('retourne 400 si title manquant', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ date: '2024-01-15' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and date are required.');
    });

    it('retourne 400 si date manquante', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({ title: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title and date are required.');
    });

    it('crée une séance avec des exercices', async () => {
      WorkoutModel.create.mockResolvedValue(1);
      WorkoutModel.addExercise.mockResolvedValue(undefined);
      
      // ? Préparation de données relationnelles ?
      // ? On simule la relecture d'une séance enrichie de ses jointures d'exercices pour valider le retour de l'API. ?
      WorkoutModel.findById.mockResolvedValue({
        ...BASE_WORKOUT,
        exercises: [{ exercise_id: 1, sets: 3, reps: 10, weight_used: 50 }],
      });

      // * Action / Écriture *
      const res = await request(app)
        .post('/api/workouts')
        .set(authHeader())
        .send({
          title: 'Full body',
          date: '2024-01-15',
          exercises: [{ exercise_id: 1, sets: 3, reps: 10, weight_used: 50 }],
        });

      expect(res.status).toBe(201);
      // * Vérification d'action : S'assure que la méthode addExercise du modèle a bien été déclenchée exactement une fois pour insérer la ligne dans la table de liaison (workout_exercises). *
      expect(WorkoutModel.addExercise).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  describe('DELETE /api/workouts/:id', () => {
  // ==========================================================================

    it('supprime une séance avec succès (200)', async () => {
      // ? Suppression de données ?
      // ? Le modèle simule affectedRows = 1, confirmant que la séance appartenait bien à l'utilisateur et a été supprimée. ?
      WorkoutModel.delete.mockResolvedValue(1);

      // * Action / Simulation *
      const res = await request(app)
        .delete('/api/workouts/1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Workout deleted.');
    });

    it("retourne 404 si la séance n'existe pas", async () => {
      // ? Vérification de données ?
      // ? Si le modèle retourne 0, cela signifie que l'ID n'existait pas OU que la clause WHERE user_id = ? a bloqué l'action (protection de données). L'API doit répondre par une erreur 404. ?
      WorkoutModel.delete.mockResolvedValue(0);

      const res = await request(app)
        .delete('/api/workouts/999')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Workout not found.');
    });

    it('retourne 401 sans token', async () => {
      // ! ALERTE SÉCURITÉ : Interdiction stricte de suppression de ressources sans authentification préalable. !
      const res = await request(app).delete('/api/workouts/1');

      expect(res.status).toBe(401);
    });
  });
});

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration des séances finalisée.
// ============================================================================