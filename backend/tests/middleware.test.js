// ============================================================================
// ROLE MACRO : Tests unitaires isolés pour le middleware JWT (tests/middleware.test.js).
// Afin de tester la sécurité de manière cloisonnée et d'éviter les effets de bord,
// ce script instancie une mini-application Express éphémère. Elle expose une unique 
// route sécurisée (/protected) permettant de valider les interceptions du middleware,
// le décodage des jetons et l'injection des données utilisateurs dans l'objet "req".
// ============================================================================

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');

// ---- Fabrication d'une mini-app Express pour les tests ----
// * const createApp = () => { ... } *
// * Action / Architecture : Constructeur d'application Express isolée. On monte uniquement le middleware à tester sur une route générique. Si le middleware appelle next(), la fonction fléchée prend le relais et répond. Sinon, le middleware coupe court. *
const createApp = () => {
  const app = express();
  app.get('/protected', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });
  return app;
};

describe('Auth Middleware', () => {
  const app = createApp();

  // ---- Cas : aucun header Authorization ----
  it('retourne 401 sans header Authorization', async () => {
    // ! ALERTE SÉCURITÉ : Blocage immédiat. Aucun en-tête d'authentification n'est fourni, l'accès à la ressource doit être interdit. !
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access denied. No token provided.');
  });

  // ---- Cas : format invalide (pas de préfixe "Bearer ") ----
  it("retourne 401 avec un format invalide (pas de 'Bearer')", async () => {
    // ! ALERTE SÉCURITÉ : Validation de format. Bien qu'un en-tête soit envoyé, l'absence du mot-clé standard "Bearer " doit provoquer un rejet par le middleware. !
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'invalid-token-format');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Access denied. No token provided.');
  });

  // ---- Cas : token présent mais corrompu/invalide ----
  it('retourne 401 avec un token invalide', async () => {
    // ! ALERTE SÉCURITÉ : Intégrité du jeton. Un jeton malformé échoue lors de la vérification de signature (jwt.verify) et lève une exception interceptée par le middleware. !
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer this.is.totally.invalid');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token.');
  });

  // ---- Cas : token expiré ----
  it('retourne 401 avec un token expiré', async () => {
    // ? Préparation de données / Vérification temporelle ?
    // ? Création d'un token JWT signé dont la date de validité est passée (expiresIn: '-1s'). ?
    const expiredToken = jwt.sign(
      { id: 1, email: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    // * Action / Simulation *
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    // ! ALERTE SÉCURITÉ : Un jeton expiré ne doit plus permettre l'accès à l'application. !
    expect(res.body.error).toBe('Token expired. Please log in again.');
  });

  // ---- Cas : token valide → req.user doit être renseigné ----
  it('autorise avec un token valide et attache req.user', async () => {
    // ? Préparation de données ?
    // ? Génération d'un token légitime, signé avec la bonne clé secrète de l'environnement de test et valide pour 1 jour. ?
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // * Action / Simulation *
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    // ? Vérification de données ?
    // ? Étape clé de la logique métier : On s'assure que le middleware a correctement extrait le payload du JWT et l'a injecté dans l'objet de requête (req.user), permettant aux contrôleurs en aval de connaître l'identité de l'appelant. ?
    expect(res.body.user).toMatchObject({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
    });
  });
});

// ============================================================================
// FIN DU FICHIER : Suite de tests unitaires du middleware validée.
// ============================================================================