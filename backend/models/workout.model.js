// ============================================================
// models/workout.model.js — Couche d'accès aux données (tables Workout et WorkoutExercise)
//
// Ce modèle gère deux tables liées :
//   - Workout : les séances d'entraînement
//   - WorkoutExercise : la table de jointure (exercices d'une séance)
// ============================================================

const db = require('../config/database');

const WorkoutModel = {

  // ? ---- Lister toutes les séances d'un utilisateur ---- ?
  async findAllByUser(userId) {
    const [rows] = await db.execute(
      // ? LEFT JOIN : on récupère les séances même si elles n'ont pas d'exercices ?
      // ? COUNT(we.id) : compte les exercices associés à chaque séance ?
      // ? GROUP BY w.id : nécessaire pour que COUNT() fonctionne par séance ?
      // ? ORDER BY date DESC : les séances les plus récentes en premier ?
      `SELECT w.*,
        COUNT(we.id) as exercise_count
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON w.id = we.workout_id
       WHERE w.user_id = ?
       GROUP BY w.id
       ORDER BY w.date DESC, w.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // ? ---- Récupérer une séance avec tous ses exercices ---- ?
  async findById(id, userId) {
    // ! Sécurité : On vérifie d'abord l'appartenance pour empêcher l'accès aux données d'autrui !
    const [workouts] = await db.execute(
      'SELECT * FROM Workout WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!workouts[0]) return null;

    // ? Deuxième requête : Récupération des exercices de la séance enrichis (nom, catégorie...) ?
    const [exercises] = await db.execute(
      `SELECT we.*, e.name, e.category, e.muscle_group
       FROM WorkoutExercise we
       JOIN Exercise e ON we.exercise_id = e.id
       WHERE we.workout_id = ?
       ORDER BY we.id`,
      [id]
    );

    // * Fusion via le Spread operator en un seul objet { id, title, ..., exercises: [...] } *
    return { ...workouts[0], exercises };
  },

  // * ---- Créer une séance (sans exercices) ---- *
  async create({ user_id, title, date, duration, notes }) {
    const [result] = await db.execute(
      'INSERT INTO Workout (user_id, title, date, duration, notes) VALUES (?, ?, ?, ?, ?)',
      [user_id, title, date, duration || null, notes || null]
    );
    return result.insertId;
  },

  // * ---- Ajouter un exercice à une séance ---- *
  async addExercise(workoutId, { exercise_id, sets, reps, weight_used, duration }) {
    // * Insertion dans la table de jointure WorkoutExercise *
    // ? weight_used / duration peuvent être null selon le type d'effort (cardio vs musculation) ?
    const [result] = await db.execute(
      'INSERT INTO WorkoutExercise (workout_id, exercise_id, sets, reps, weight_used, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [workoutId, exercise_id, sets || null, reps || null, weight_used || null, duration || null]
    );
    return result.insertId;
  },

  // * ---- Modifier les stats d'un exercice dans une séance ---- *
  async updateExercise(weId, workoutId, { sets, reps, weight_used, duration }) {
    // ! Sécurité : Le workout_id assure l'isolation des données lors de la modification !
    await db.execute(
      'UPDATE WorkoutExercise SET sets=?, reps=?, weight_used=?, duration=? WHERE id=? AND workout_id=?',
      [sets || null, reps || null, weight_used || null, duration || null, weId, workoutId]
    );
  },

  // ! ---- Retirer un exercice d'une séance ---- !
  async removeExercise(weId, workoutId) {
    const [result] = await db.execute(
      'DELETE FROM WorkoutExercise WHERE id=? AND workout_id=?',
      [weId, workoutId]
    );
    return result.affectedRows > 0;
  },

  // * ---- Remplacer tous les exercices d'une séance ---- *
  // * Utilisé lors d'un PUT : stratégie DELETE + INSERT (plus simple qu'un calcul de diff) *
  async replaceExercises(workoutId, exercises) {
    await db.execute('DELETE FROM WorkoutExercise WHERE workout_id = ?', [workoutId]);
    for (const ex of exercises) {
      if (!ex.exercise_id) continue; // ! Ignore les lignes corrompues ou incomplètes !
      await this.addExercise(workoutId, ex);
    }
  },

  // * ---- Modifier les infos d'une séance (mise à jour partielle) ---- *
  async update(id, userId, { title, date, duration, notes }) {
    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    if (duration !== undefined) { fields.push('duration = ?'); values.push(duration); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }

    if (fields.length === 0) return this.findById(id, userId);

    // ! Sécurité : Injection de id ET userId dans le WHERE pour restreindre l'action à l'auteur !
    values.push(id, userId);
    await db.execute(`UPDATE Workout SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    return this.findById(id, userId);
  },

  // ! ---- Supprimer une séance ---- !
  async delete(id, userId) {
    const [result] = await db.execute(
      'DELETE FROM Workout WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    // ! Les cascades (ON DELETE CASCADE) sont gérées nativement côté SGBD (init.sql) !
    return result.affectedRows > 0;
  },

  // ? ---- Statistiques de progression ---- ?
  // ? Agrège les données via plusieurs requêtes SQL spécialisées ?
  async getProgressionStats(userId) {
    // ? 1. Statistiques globales : COALESCE évite les valeurs NULL sur l'absence de données ?
    const [totalStats] = await db.execute(
      `SELECT
        COUNT(DISTINCT w.id) as total_workouts,
        COALESCE(SUM(w.duration), 0) as total_minutes,
        COALESCE(AVG(w.duration), 0) as avg_duration,
        COUNT(DISTINCT we.exercise_id) as unique_exercises
       FROM Workout w
       LEFT JOIN WorkoutExercise we ON w.id = we.workout_id
       WHERE w.user_id = ?`,
      [userId]
    );

    // ? 2. Statistiques par mois : DATE_FORMAT regroupe l'historique sur les 6 derniers mois ?
    const [monthlyStats] = await db.execute(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as workout_count,
        COALESCE(SUM(duration), 0) as total_minutes
       FROM Workout
       WHERE user_id = ?
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month DESC
       LIMIT 6`,
      [userId]
    );

    // ? 3. Répartition : Double jointure pour lier WorkoutExercise à la table Exercise ?
    const [categoryStats] = await db.execute(
      `SELECT
        e.category,
        COUNT(we.id) as exercise_count,
        COALESCE(SUM(we.sets * we.reps), 0) as total_reps
       FROM WorkoutExercise we
       JOIN Exercise e ON we.exercise_id = e.id
       JOIN Workout w ON we.workout_id = w.id
       WHERE w.user_id = ?
       GROUP BY e.category`,
      [userId]
    );

    // ? 4. Flux récent : Les 5 dernières séances pour le tableau de bord ?
    const [recentWorkouts] = await db.execute(
      `SELECT id, title, date, duration
       FROM Workout
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 5`,
      [userId]
    );

    return {
      summary: totalStats[0],
      monthly: monthlyStats,
      byCategory: categoryStats,
      recent: recentWorkouts,
    };
  },
};

module.exports = WorkoutModel;