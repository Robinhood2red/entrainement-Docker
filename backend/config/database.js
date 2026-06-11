// ============================================================
// config/database.js — Connexion à la base de données MySQL
// Ce fichier crée et exporte un "pool" de connexions réutilisables.
// ============================================================

const mysql = require('mysql2/promise');

// * ---- Qu'est-ce qu'un pool de connexions ? ----
// * Établir une connexion MySQL à chaque requête est coûteux (~100ms).
// * Un pool maintient un ensemble de connexions ouvertes et prêtes à l'emploi.
const pool = mysql.createPool({
  // ? Les valeurs viennent du .env (injectées par Docker en production)
  host: process.env.DB_HOST || 'mysql',       // * Nom du service Docker
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || 'fittrack',
  user: process.env.DB_USER || 'fittrack_user',
  password: process.env.DB_PASSWORD || 'fittrack_pass',

  // * utf8mb4 supporte tous les caractères Unicode (dont les emojis et accents)
  charset: 'utf8mb4',

  // ? waitForConnections : si le pool est plein, mettre la requête en file d'attente
  waitForConnections: true,

  // * Nombre maximum de connexions simultanées dans le pool
  connectionLimit: 10,

  // * 0 = file d'attente illimitée (0 signifie pas de limite)
  queueLimit: 0,

  // ! Stocke les dates en UTC dans MySQL pour éviter les décalages horaires
  timezone: '+00:00',

  // * Évite les coupures de connexion lors des périodes d'inactivité du serveur
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// * ---- Test de connexion robuste au démarrage ----
// ! Docker lance les containers en parallèle. MySQL pouvant mettre quelques secondes
// ! à s'initialiser complètement, on implémente un système de "retries".
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // * 3 secondes

function connectWithRetry(attempt = 1) {
  pool.getConnection()
    .then(conn => {
      console.log('==================================================');
      console.log(' 💾 MySQL Database Connected & Pool Ready !');
      console.log('==================================================');
      conn.release(); // ! Toujours libérer la connexion après usage (éviter les fuites de pool)
    })
    .catch(err => {
      console.error(`⚠️ MySQL Connection Failed (Attempt ${attempt}/${MAX_RETRIES}):`, err.message);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Next retry in ${RETRY_DELAY / 1000}s...`);
        setTimeout(() => connectWithRetry(attempt + 1), RETRY_DELAY);
      } else {
        console.error('🚨 [CRITICAL] Unable to reach MySQL. Verify your Docker network or credentials.');
      }
    });
}

// TODO: Ne pas lancer le mécanisme d'attente pendant les tests pour ne pas bloquer Jest
if (process.env.NODE_ENV !== 'test') {
  connectWithRetry();
}

// * Export du pool : tous les models l'importent pour exécuter des requêtes SQL
module.exports = pool;