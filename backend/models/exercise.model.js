// ============================================================
// models/exercise.model.js — Couche d'accès aux données (table Exercise)
//
// Toutes les requêtes SQL liées aux exercices passent par ici.
// Les contrôleurs appellent ces méthodes sans jamais écrire de SQL.
// ============================================================

const db = require('../config/database');

const ExerciseModel = {

  // ? ---- Lister les exercices avec filtres optionnels ---- ?
  async findAll({ category, search } = {}) {
    // * Astuce Architecture : Initialisation avec "WHERE 1=1" (toujours vrai) *
    // * Permet de concaténer des clauses "AND" dynamiquement sans se soucier du premier bloc *
    let query = 'SELECT * FROM Exercise WHERE 1=1';
    const values = [];

    // ? Filtrage optionnel par catégorie (ex: ?category=musculation) ?
    if (category) {
      query += ' AND category = ?';
      values.push(category);
    }

    // ? Recherche textuelle : Le mot-clé LIKE avec % recherche si la String est contenue ?
    // ? (ex: %squat% intercepte "Front Squat" et "Back Squat") ?
    if (search) {
      query += ' AND (name LIKE ? OR muscle_group LIKE ?)';
      values.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY category, name';
    
    // ? Ici rows contient UN TABLEAU d'objets (plusieurs lignes Excel) ?
    const [rows] = await db.execute(query, values);
    return rows;
  },

  // ? ---- Trouver un exercice par son id ---- ?
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM Exercise WHERE id = ?', [id]);
    
    // ! Rappel : L'ID est unique. rows[0] extrait l'UNIQUE objet de la première ligne !
    // ? Si rows est vide (aucun ID trouvé), on bascule sur la valeur de repli : null ?
    return rows[0] || null;
  },

  // * ---- Créer un exercice ---- *
  async create({ name, category, muscle_group, description }) {
    // ! Sécurité : Paramètres liés (?) pour bloquer l'injection SQL !
    const [result] = await db.execute(
      'INSERT INTO Exercise (name, category, muscle_group, description) VALUES (?, ?, ?, ?)',
      [name, category, muscle_group || null, description || null]
    );
    
    // * Étape 2 : On relit l'exercice créé depuis la BDD pour retourner l'objet complet *
    // * (Garantit l'accès à l'id généré, au created_at par défaut, etc.) *
    return this.findById(result.insertId);
  },

  // * ---- Mettre à jour un exercice (mise à jour partielle) ---- *
  async update(id, { name, category, muscle_group, description }) {
    // * Construction dynamique pour ne cibler que les champs effectivement fournis *
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (muscle_group !== undefined) { fields.push('muscle_group = ?'); values.push(muscle_group); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }

    // * Économie de requête : Aucun champ modifié -> on retourne l'existant direct *
    if (fields.length === 0) return this.findById(id);

    // ! L'id ferme la marche pour correspondre au WHERE id = ? !
    values.push(id);
    await db.execute(`UPDATE Exercise SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  // ! ---- Supprimer un exercice ---- !
  async delete(id) {
    const [result] = await db.execute('DELETE FROM Exercise WHERE id = ?', [id]);

    // ! Sécurité / Intégrité : affectedRows valide si la ligne existait au départ !
    // ! Attention : La contrainte RESTRICT configurée en BDD lèvera une erreur SQL !
    // ! si l'exercice est actuellement rattaché à une séance (WorkoutExercise) !
    return result.affectedRows > 0;
  },
};

module.exports = ExerciseModel;