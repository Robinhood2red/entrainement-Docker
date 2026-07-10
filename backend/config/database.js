// ============================================================
// config/database.js — Connexion à la base de données MySQL
// Ce fichier crée et exporte un "pool" de connexions réutilisables.
// ============================================================

const mysql = require('mysql2/promise');
 
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'fittrack',
  user: process.env.DB_USER || 'fittrack_user',
  password: process.env.DB_PASSWORD || 'fittrack_pass',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  // SSL requis pour les connexions MySQL externes (ex: Clever Cloud "Direct access")
  // DB_SSL=true sur Render ; absent en dev local -> pas de SSL
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: false },
  }),
});
 
pool.getConnection()
  .then(conn => { console.log('MySQL connected successfully'); conn.release(); })
  .catch(err => console.error('MySQL connection failed:', err.message));
 
module.exports = pool;



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