// ============================================================================
// ROLE MACRO : Tests d'intégration pour les routes de gestion des exercices (tests/exercises.test.js).
// Ce script s'assure du bon comportement des endpoints CRUD (/api/exercises).
// Il valide la sécurité (Jetons JWT requis), le contrôle des paramètres de requêtes
// (filtrage par catégories), la validation des payloads entrants (champs obligatoires),
// ainsi que la gestion propre des erreurs de contraintes relationnelles MySQL.
// ============================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ---- Déclaration des Mocks globaux ----
// ! jest.mock('../config/database', ...) !
// ! ALERTE ARCHITECTURALE : Neutralise la connexion physique à la base de données pour garantir l'isolation complète de la suite de tests. !
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

// ? jest.mock('../models/exercise.model', ...) ?
// ? Requêtage et interception : Remplace le modèle réel par des fonctions simulées (jest.fn()). Permet de piloter précisément les retours de données pour chaque scénario de test. ?
jest.mock('../models/exercise.model', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const app = require('../server');
const ExerciseModel = require('../models/exercise.model');

// ---- Générateur de header JWT ----
// * const authHeader = () => { ... } *
// * Action / Authentification : Helper générant à la volée un token valide signé avec la clé de test secrète. Permet de passer la barrière de l'authMiddleware sur les routes protégées. *
const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )}`,
});

// Exercice de référence réutilisé dans les tests
const BASE_EXERCISE = {
  id: 1,
  name: 'Squat',
  category: 'Musculation',
  muscle_group: 'Jambes',
  description: 'Exercice de base pour les jambes',
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('Exercise Routes', () => {
  beforeEach(() => {
    // * Action de nettoyage : Remet à zéro l'historique d'appels et les valeurs des mocks avant chaque cas d'utilisation. *
    jest.clearAllMocks();
  });

  // ==========================================================================
  describe('GET /api/exercises', () => {
  // ==========================================================================

    it('retourne la liste des exercices (200)', async () => {
      // ? Lecture de données ?
      // ? Configuration du mock pour retourner un tableau contenant notre exercice de référence. ?
      ExerciseModel.findAll.mockResolvedValue([BASE_EXERCISE]);

      // * Action / Simulation *
      const res = await request(app)
        .get('/api/exercises')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('exercises');
      expect(res.body).toHaveProperty('count', 1);
      expect(res.body.exercises[0].name).toBe('Squat');
    });

    it('retourne 401 sans token', async () => {
      // ! ALERTE SÉCURITÉ : Vérifie que le middleware d'authentification bloque la requête en amont si aucun en-tête n'est transmis. !
      const res = await request(app).get('/api/exercises');

      expect(res.status).toBe(401);
    });

    it('retourne 400 pour une catégorie invalide', async () => {
      // * Action / Validation *
      // * Transmission d'une catégorie absente de l'énumération acceptée par le système. Le contrôleur doit rejeter la demande. *
      const res = await request(app)
        .get('/api/exercises?category=InvalidCategory')
        .set(authHeader());

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category must be one of');
    });

    it('accepte les catégories valides', async () => {
      ExerciseModel.findAll.mockResolvedValue([]);

      // * Action en boucle *
      // * Validation séquentielle de chaque valeur de l'énumération acceptée pour s'assurer qu'aucune ne lève de faux négatifs. *
      for (const cat of ['Musculation', 'Cardio', 'Flexibilité']) {
        const res = await request(app)
          .get(`/api/exercises?category=${encodeURIComponent(cat)}`)
          .set(authHeader());

        expect(res.status).toBe(200);
      }
    });
  });

  // ==========================================================================
  describe('POST /api/exercises', () => {
  // ==========================================================================

    it('crée un exercice avec succès (201)', async () => {
      // ? Écriture / Préparation des données ?
      // ? On configure le mock pour simuler une insertion réussie renvoyant l'entité complète créée en BDD. ?
      ExerciseModel.create.mockResolvedValue(BASE_EXERCISE);

      // * Action / Simulation *
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat', category: 'Musculation', muscle_group: 'Jambes' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Exercise created.');
      expect(res.body.exercise.name).toBe('Squat');
    });

    it('retourne 400 si name manquant', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ category: 'Musculation' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name and category are required.');
    });

    it('retourne 400 si category manquante', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name and category are required.');
    });

    it('retourne 400 si catégorie invalide', async () => {
      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Test', category: 'InvalidCat' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category must be one of');
    });
  });

  // ==========================================================================
  describe('PUT /api/exercises/:id', () => {
  // ==========================================================================

    it('modifie un exercice avec succès (200)', async () => {
      const updated = { ...BASE_EXERCISE, name: 'Squat modifié' };
      // ? Lecture et modification de données ?
      // ? Le contrôleur doit d'abord vérifier l'existence de la ressource (findById) avant de procéder à sa mise à jour (update). ?
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
      ExerciseModel.update.mockResolvedValue(updated);

      // * Action / Simulation *
      const res = await request(app)
        .put('/api/exercises/1')
        .set(authHeader())
        .send({ name: 'Squat modifié', category: 'Musculation' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercise updated.');
      expect(res.body.exercise.name).toBe('Squat modifié');
    });

    it("retourne 404 si l'exercice n'existe pas", async () => {
      // ? Vérification de données ?
      // ? findById renvoie null, simulant une ressource inexistante dans la table. ?
      ExerciseModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/exercises/999')
        .set(authHeader())
        .send({ name: 'Test', category: 'Cardio' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Exercise not found.');
    });

    it('retourne 400 si catégorie invalide lors de la modification', async () => {
      const res = await request(app)
        .put('/api/exercises/1')
        .set(authHeader())
        .send({ category: 'Invalide' });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================================================
  describe('DELETE /api/exercises/:id', () => {
  // ==========================================================================

    it('supprime un exercice avec succès (200)', async () => {
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
      // ? Suppression de données ?
      // ? On simule une suppression validée (affectedRows > 0, retourne true). ?
      ExerciseModel.delete.mockResolvedValue(true);

      // * Action / Simulation *
      const res = await request(app)
        .delete('/api/exercises/1')
        .set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Exercise deleted.');
    });

    it("retourne 404 si l'exercice n'existe pas", async () => {
      ExerciseModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/exercises/999')
        .set(authHeader());

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Exercise not found.');
    });

    it("retourne 409 si l'exercice est utilisé dans une séance", async () => {
      ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);

      // ! ALERTE ARCHITECTURALE / SÉCURITÉ DES DONNÉES : Interception d'erreur SQL critique. !
      // ! On simule le rejet de la requête par la base de données suite au déclenchement d'une contrainte de clé étrangère (RESTRICT). L'application doit attraper l'erreur native et la traduire proprement en statut HTTP 409 pour l'utilisateur sans faire crasher le processus Node. !
      const fkError = new Error('FK constraint');
      fkError.code = 'ER_ROW_IS_REFERENCED_2';
      ExerciseModel.delete.mockRejectedValue(fkError);

      // * Action / Simulation *
      const res = await request(app)
        .delete('/api/exercises/1')
        .set(authHeader());

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Cannot delete: exercise is used in one or more workouts.');
    });
  });
});

// ============================================================================
// FIN DU FICHIER : Suite de tests d'intégration des exercices complétée.
// ============================================================================