// === backend/test-connection.js ===
// ? mesnotes ? Fichier temporaire de test de connectivité réseau avant import
const mysql = require('mysql2/promise');

mysql.createConnection({
  host: 'b4ccxoq2ioi7xkiwwzzz-mysql.services.clever-cloud.com',
  port: 3306,
  user: 'uteodvfyvtu6aznt',
  password: 'VDqrLXJ6k5rQDpz89cI2', // 🔐 Remplace par ton vrai mot de passe (déverrouille le cadenas sur leur site)
  database: 'b4ccxoq2ioi7xkiwwzzz',
})
  .then(() => console.log('✅ Connexion réussie'))
  .catch((e) => console.error('❌ Échec:', e.message));