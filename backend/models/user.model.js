// ============================================================
// models/user.model.js — Couche d'accès aux données (table User)
//
// Le modèle est la seule partie du code qui écrit du SQL.
// Il isole la logique de base de données du reste de l'application :
//! Si un jours je dois passer de SQL à MondoDB ou autre seul ce fichier est à modifier, 
//! pas les controllers !
// ============================================================


const db = require('../config/database');
const bcrypt = require('bcrypt');

// ! Paramétrage de sécurité : Nombre de "tours" de hachage bcrypt (coût CPU vs résistance brute force) !
const SALT_ROUNDS = 10;

const UserModel = {

  // * ---- Créer un utilisateur ---- *
  async create({ username, email, password, weight, goal }) {
    // ! Sécurité : Hachage du mot de passe en amont (génère un sel + hash de 60 caractères) !
    // ! Même si la BDD est compromise, les mots de passe restent totalement illisibles !
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ! Sécurité : db.execute() génère des requêtes préparées avec paramètres liés (?) !
    // ! Le SGBD échappe automatiquement les valeurs : parade absolue contre l'injection SQL !
    // ! Ne JAMAIS concaténer ou interpoler des variables directement dans une chaîne SQL !
    const [result] = await db.execute(
      'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, weight || null, goal || 'maintain']
    );

    // * Retourne l'id auto-incrémenté généré par MySQL *
    return result.insertId;
  },

  // ? ---- Trouver par email (pour le login et la vérification de doublon) ---- ?
  async findByEmail(email) {
    // ? Déstructuration [rows] pour isoler le jeu de données renvoyé par MySQL ?
    const [rows] = await db.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );
    // ? Retourne le premier enregistrement trouvé, sinon null ?
    return rows[0] || null;
  },

  // ? ---- Trouver par id (pour GET /me et après création) ---- ?
  async findById(id) {
    // ! Sécurité : Sélection explicite des colonnes pour exclure définitivement le hash du mot de passe !
    const [rows] = await db.execute(
      'SELECT id, username, email, weight, goal, created_at FROM User WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // ? ---- Trouver par username (pour vérifier les doublons à l'inscription) ---- ?
  async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT id FROM User WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  // * ---- Mettre à jour le profil (mise à jour partielle) ---- *
  async update(id, { username, weight, goal }) {
    // * Étape 1 : Construction dynamique de la requête selon les champs fournis *
    const fields = [];
    const values = [];

    if (username !== undefined) { fields.push('username = ?'); values.push(username); }
    if (weight !== undefined) { fields.push('weight = ?'); values.push(weight); }
    if (goal !== undefined) { fields.push('goal = ?'); values.push(goal); }

    // * Aucun champ modifié : On stoppe l'exécution pour économiser une requête SQL *
    if (fields.length === 0) return null;

    // ! L'id doit être inséré en dernier pour correspondre au '?' de la clause WHERE id = ? !
    values.push(id);

    // * Étape 2 : Exécution de l'UPDATE reconstruit par Template Literal *
    await db.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);

    // ? Étape 3 : Retourne le profil fraîchement mis à jour via findById() (sans mot de passe) ?
    return this.findById(id);
  },

  // ? ---- Vérifier le mot de passe lors du login ---- ?
  // ? bcrypt.compare() extrait le sel du hash d'origine, re-hache la String en clair et compare ?
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

module.exports = UserModel;