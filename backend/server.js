// ============================================================
// server.js — Point d'entrée de l'API FitTrack
// C'est le premier fichier exécuté par Node.js (via "node server.js").
// Il configure Express, les middlewares globaux et les routes.
// ============================================================

// ? dotenv charge les variables depuis le fichier .env dans process.env ?
// ! Doit être appelé en tout premier, avant d'utiliser process.env !
require('dotenv').config();

// * ---- Framework Principal & Sécurité ---- *

// * Express : Framework web minimaliste pour Node.js. Il gère le serveur HTTP, il permet de crée nos routes *
// * le routage des URL (GET, POST...) et la chaîne des middlewares. *
const express = require('express');

// * CORS (Cross-Origin Resource Sharing) : Package qui gère les entêtes HTTP *
// * de sécurité permettant d'autoriser ou restreindre les requêtes cross-origin. *
const cors = require('cors');

// ? On importe chaque fichier de routes — chacun gère un groupe de routes ?
const authRoutes = require('./routes/auth.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const workoutRoutes = require('./routes/workout.routes');
const statsRoutes = require('./routes/stats.routes');

// * Création de l'application Express *
const app = express();

// ? Le port vient du .env ; si absent, 5000 par défaut ?
const PORT = process.env.PORT || 5000;

// * ---- Configuration du Middleware CORS ---- *
// * Par sécurité, les navigateurs bloquent les requêtes Ajax vers un domaine différent *
// * de celui qui a servi le code frontend (mécanisme de la Same-Origin Policy). *
// ! Sans CORS configuré ici, le navigateur rejetterait les requêtes côté client !
app.use(cors({
  // ? L'origine autorisée (ex: ton application React/Next.js) ?
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // * Autorise le partage des cookies de session ou des en-têtes Authorization *
  credentials: true, 
  
  // * Liste des méthodes HTTP autorisées pour manipuler les ressources *
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // * Liste des en-têtes personnalisés acceptés (Content-Type pour le JSON, Authorization pour le JWT) *
  allowedHeaders: ['Content-Type', 'Authorization'], 
}));

// * ---- Middlewares de Parsing (Analyse des requêtes) ---- *

// * express.json() : Analyse le corps (body) des requêtes entrantes au format JSON *
// ! Sans lui, req.body serait "undefined" lors des requêtes POST ou PUT !
app.use(express.json());

// * express.urlencoded() : Analyse les corps de requêtes encodés en URL (formulaires HTML standard) *
app.use(express.urlencoded({ extended: true }));

// * ---- Route de santé (Health Check) ---- *
// ? Permet de vérifier rapidement que l'API tourne et répond correctement (GET /api) ?
app.get('/api', (req, res) => {
  res.json({
    message: 'FitTrack API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      exercises: '/api/exercises',
      workouts: '/api/workouts',
      stats: '/api/stats',
    },
  });
});

// * ---- Branchement des routeurs applicatifs ---- *
// * app.use(préfixe, routeur) : Associe un préfixe d'URL à un groupe de routes. *
// * Ex : router.post('/login') dans auth.routes.js deviendra accessible via POST /api/auth/login *
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);

// * ---- Middleware de capture 404 ---- *
// ! Si aucune route ne correspond, ce middleware intercepte la requête pour renvoyer une erreur 404. !
// ! Attention : Ce bloc doit impérativement se situer APRÈS la déclaration de toutes les routes. !
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// * ---- Middleware Global de Gestion des Erreurs ---- *
// ? Signature spéciale à 4 paramètres : Express identifie nativement ce format comme le catch-all des erreurs. ?
// ? Déclenché à chaque fois qu'une erreur survient ou qu'on appelle la fonction next(err). ?
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // ! En production, on masque les détails de la pile d'exécution (stack trace) pour des raisons de sécurité. !
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.' 
  });
});

// * ---- Démarrage de l'écoute du Serveur ---- *
// TODO: Ne pas instancier le serveur HTTP si le script est exécuté dans un environnement de test (Jest / Supertest).
// TODO: Cela évite les collisions de ports et les sockets restés ouverts durant les tests d'intégration.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitTrack API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// * Export de l'instance app pour permettre son injection directe dans la suite de tests *
module.exports = app;