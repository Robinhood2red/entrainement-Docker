// ============================================================
// controllers/stats.controller.js — Statistiques de progression
//
// Ce contrôleur est volontairement simple : il n'a qu'une seule
// responsabilité — agréger les stats de l'utilisateur connecté
// et les retourner en une seule réponse JSON structurée.
// ============================================================

const WorkoutModel = require('../models/workout.model');
const UserModel = require('../models/user.model');

const StatsController = {

  // ? ---- GET /api/stats/progression ---- ?
  // ? Retourne les statistiques complètes de l'utilisateur : résumé global, ?
  // ? historique mensuel, répartition par catégorie, et séances récentes. ?
  async getProgression(req, res) {
    try {
      // * Performance : Promise.all([...]) exécute les requêtes asynchrones EN PARALLÈLE *
      // * Au lieu d'attendre la fin de la première pour lancer la seconde, elles s'exécutent simultanément *
      // * La destructuration [stats, user] récupère les résultats dans l'ordre du tableau *
      const [stats, user] = await Promise.all([ // ! Objet qui représente le résultat d'une opération asynchrone 
      // ! dont la valeur finale n'est pas encore connue. Cela évite ici un code séquentiel moins performant.
        WorkoutModel.getProgressionStats(req.user.id), // ? Aggrège 4 requêtes SQL en une seule méthode du modèle ?
        UserModel.findById(req.user.id),               // ? 1 requête SQL classique pour le profil ?
      ]);

      // ! Sécurité : Le mot de passe est déjà filtré côté modèle par findById !
      // * On extrait uniquement les infos utiles pour l'affichage du profil *
      res.json({
        user: {
          username: user.username,
          weight: user.weight,
          goal: user.goal,
          member_since: user.created_at, // * Date d'inscription pour le "Membre depuis" du front *
        },
        stats, // * Contient les objets : summary, monthly, byCategory, recent *
      });
    } catch (err) {
      // ! Log d'erreur critique pour le suivi en production !
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Failed to fetch stats.' });
    }
  },
};

module.exports = StatsController;