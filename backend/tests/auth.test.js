// ============================================================================
// ROLE MACRO : Tests d'intégration pour les routes d'authentification (tests/auth.test.js).
// Ce script simule des requêtes HTTP (via Supertest) sur les endpoints d'inscription,
// de connexion et de récupération de profil (/me). Il intercepte et isole les couches
// d'accès aux données (base de données et modèles) grâce à des mocks Jest pour garantir
// des tests rapides, déterministes et indépendants de l'état réel de la BDD.
// ============================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// ---- Mock de la base de données ----
// ! jest.mock('../config/database', ...) !
// ! ALERTE ARCHITECTURALE : Court-circuite la configuration globale de la base de données. Indispensable pour éviter l'ouverture de vraies connexions SQL ou de pools réseau pendant l'exécution de la suite de tests. Doit impérativement être déclaré avant l'import du serveur. !
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

// ---- Mock du modèle User ----
// ? jest.mock('../models/user.model', ...) ?
// ? Requêtage et interception : Remplace le modèle réel par des fonctions espionnes (jest.fn()). Permet de simuler et de contrôler les retours de données (lignes affectées, utilisateurs trouvés) sans exécuter le code SQL sous-jacent. ?
jest.mock('../models/user.model', () => ({
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  update: jest.fn(),
}));

// L'app est importée APRÈS les mocks pour que le code utilise les faux modules
const app = require('../server');
const UserModel = require('../models/user.model');

// Objet utilisateur de test réutilisé dans plusieurs cas de test
const BASE_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  weight: null,
  goal: 'maintain',
  created_at: '2024-01-01T00:00:00.000Z',
};

// Fonction utilitaire pour générer un JWT valide en test
const generateToken = (payload = {}) =>
  jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

describe('Auth Routes', () => {
  // * beforeEach(...) *
  // * Action de nettoyage : S'exécute avant chaque bloc de test ("it"). Réinitialise l'état interne de tous les espions et mocks pour empêcher qu'un test n'influence le résultat du suivant (isolation des tests). *
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  describe('POST /api/auth/register', () => {
  // ==========================================================================

    it('crée un compte avec succès (201)', async () => {
      // ? Lecture / Préparation des données ?
      // ? On configure les mocks pour simuler un scénario où l'email et le username sont libres (retournent null), puis le succès de l'insertion. ?
      UserModel.findByEmail.mockResolvedValue(null);
      UserModel.findByUsername.mockResolvedValue(null);
      UserModel.create.mockResolvedValue(1);
      UserModel.findById.mockResolvedValue(BASE_USER);

      // * Action / Simulation *
      // * Déclenche une fausse requête HTTP POST en envoyant un payload d'inscription valide à l'application. *
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.message).toBe('Account created successfully.');
    });

    it('retourne 400 si username manquant', async () => {
      // * Action / Validation *
      // * On passe directement à l'action. Le middleware de validation doit bloquer la requête en amont avant même de solliciter un modèle ou la BDD. *
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username, email and password are required.');
    });

    it('retourne 400 si email manquant', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username, email and password are required.');
    });

    it('retourne 400 si mot de passe < 6 caractères', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'test@example.com', password: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters.');
    });

    it('retourne 409 si email déjà utilisé', async () => {
      // ? Vérification de données ?
      // ? On force findByEmail à renvoyer un utilisateur existant pour simuler un doublon en base de données. ?
      UserModel.findByEmail.mockResolvedValue(BASE_USER);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(409); 
      expect(res.body.error).toBe('Email already in use.');
    });

    it('retourne 409 si username déjà pris', async () => {
      UserModel.findByEmail.mockResolvedValue(null);
      // ? Vérification de données ?
      // ? findByUsername retourne un faux objet, signifiant que le pseudonyme est déjà attribué. ?
      UserModel.findByUsername.mockResolvedValue({ id: 2 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already taken.');
    });
  });

  // ==========================================================================
  describe('POST /api/auth/login', () => {
  // ==========================================================================

    it('connecte avec succès (200)', async () => {
      // ? Lecture / Préparation des données ?
      // ? On simule la récupération d'un utilisateur possédant un mot de passe haché, nécessaire pour l'étape de comparaison de la logique métier. ?
      const userWithPassword = { ...BASE_USER, password: 'hashed_password' };
      UserModel.findByEmail.mockResolvedValue(userWithPassword);
      UserModel.verifyPassword.mockResolvedValue(true);

      // * Action / Simulation *
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      
      // ! ALERTE SÉCURITÉ : Test critique de non-régression. On s'assure impérativement que le hash du mot de passe a bien été supprimé de l'objet utilisateur avant l'envoi de la réponse HTTP. !
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.message).toBe('Login successful.');
    });

    it('retourne 400 si champs manquants', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password are required.');
    });

    it('retourne 401 si email inexistant', async () => {
      // ? Vérification de données ?
      // ? L'adresse email n'est pas trouvée en BDD (retourne null). ?
      UserModel.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      // ! ALERTE SÉCURITÉ : Utilisation d'un message générique ("Invalid credentials") pour éviter l'énumération de comptes par des attaquants externes. !
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('retourne 401 si mot de passe incorrect', async () => {
      const userWithPassword = { ...BASE_USER, password: 'hashed_password' };
      UserModel.findByEmail.mockResolvedValue(userWithPassword);
      // ? Vérification de données ?
      // ? verifyPassword renvoie false pour simuler l'échec de la comparaison bcrypt. ?
      UserModel.verifyPassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });
  });

  // ==========================================================================
  describe('GET /api/auth/me', () => {
  // ==========================================================================

    it('retourne le profil avec un token valide (200)', async () => {
      UserModel.findById.mockResolvedValue(BASE_USER);
      // * Action : Génération d'un faux token signé à la volée pour simuler une session utilisateur valide. *
      const token = generateToken();

      // * Action / Simulation *
      // * Envoi de la requête GET en injectant le token d'authentification dans l'en-tête HTTP. *
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('retourne 401 sans token', async () => {
      // ! ALERTE SÉCURITÉ / BLOCAGE : Accès refusé par le middleware de sécurité d'authentification en l'absence de l'en-tête requis. !
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('retourne 401 avec un token invalide', async () => {
      // ! ALERTE SÉCURITÉ / BLOCAGE : Accès refusé suite à l'échec du décodage ou de la vérification de la signature du jeton par jwt.verify(). !
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });
});

// ============================================================================
// FIN DU FICHIER : Suite de tests pour les routes d'authentification finalisée.
// ============================================================================