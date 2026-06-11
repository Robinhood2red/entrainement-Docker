// ============================================================
// routes/auth.routes.js — Définition des routes d'authentification
//
// Le routeur Express regroupe les routes d'un même domaine fonctionnel.
// Il est monté dans server.js sous le préfixe /api/auth.
// Son rôle : relier une URL + méthode HTTP à un contrôleur.
// ============================================================

const express = require('express');

// * express.Router() crée un mini-routeur indépendant qu'on peut exporter *
// * et brancher dans server.js avec app.use('/api/auth', authRoutes) *
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ? POST /api/auth/register — Création de compte (route publique, pas de JWT requis) ?
router.post('/register', AuthController.register);

// ? POST /api/auth/login — Connexion (route publique, pas de JWT requis) ?
router.post('/login', AuthController.login);

// * GET /api/auth/me — Profil de l'utilisateur connecté (route protégée par JWT) *
// ! authMiddleware est passé en 2e argument : il s'exécute impérativement AVANT AuthController.me !
// ! Si le token est absent/invalide, authMiddleware répond 401 et .me n'est jamais appelé !
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;