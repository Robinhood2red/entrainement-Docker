// ============================================================
// server.js — Point d'entrée de l'API FitTrack
// C'est le premier fichier exécuté par Node.js (via "node server.js").
// Il configure Express, les middlewares globaux et les routes.
// ============================================================

// dotenv charge les variables depuis le fichier .env dans process.env
// Doit être appelé en tout premier, avant d'utiliser process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// On importe chaque fichier de routes — chacun gère un groupe de routes
const authRoutes = require('./routes/auth.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const workoutRoutes = require('./routes/workout.routes');
const statsRoutes = require('./routes/stats.routes');

// Création de l'application Express
const app = express();

// Le port vient du .env ; si absent, 5000 par défaut
const PORT = process.env.PORT || 5000;

//* ---- CORS (Cross-Origin Resource Sharing) ---- *
// Par sécurité, les navigateurs bloquent les requêtes vers un domaine différent.
// Ce middleware autorise explicitement le frontend (localhost:3000) à appeler l'API.
//! Sans CORS, le navigateur rejetterait les requêtes avant même qu'elles arrivent.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Autorise l'envoi de cookies/headers d'auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Authorization = JWT Bearer
}));

//* ---- Middlewares de parsing ---- *
// express.json() : lit le corps des requêtes en JSON et le met dans req.body
// Sans lui, req.body serait undefined pour les POST/PUT avec du JSON
app.use(express.json());

// express.urlencoded() : lit les données de formulaires HTML classiques
app.use(express.urlencoded({ extended: true }));

//* ---- Route de santé (health check) ---- *
// Permet de vérifier rapidement que l'API tourne (GET /api)
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

//* ---- Branchement des routes ---- *
// app.use(préfixe, routeur) : toutes les routes définies dans le fichier
// seront accessibles sous ce préfixe.
// Ex : router.post('/login') dans auth.routes.js → POST /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);

//* ---- Middleware 404 ---- *
// Si aucune route n'a correspondu, on répond avec une erreur 404.
// Ce middleware doit être APRÈS toutes les routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//* ---- Middleware de gestion des erreurs ---- *
// Signature spéciale avec 4 paramètres (err, req, res, next) : Express
// reconnaît automatiquement ce middleware comme gestionnaire d'erreurs.
// Appelé quand on fait next(err) dans une route ou qu'une exception survient.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

//! Si pas en mode dev
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     error: 'Internal server error', 
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.' 
//   });
// });
//!

//* ---- Démarrage du serveur ---- *
// On ne démarre pas le serveur en mode test : les tests importent
// directement `app` et Supertest crée son propre serveur temporaire.
// Cela évite des conflits de port et des effets de bord dans les tests.
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitTrack API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// Export de l'app pour les tests (Supertest l'importe directement)
module.exports = app;