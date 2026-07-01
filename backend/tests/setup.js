// ============================================================================
// ROLE MACRO : Configuration globale de l'environnement de test Jest (tests/setup.js).
// Ce script est injecté et exécuté automatiquement AVANT chaque fichier de test.
// Il permet de définir les variables d'environnement nécessaires pour simuler le
// contexte de l'application sans toucher à la production ou aux vraies bases de données.
// ============================================================================

// ! process.env.JWT_SECRET = 'test-jwt-secret-fittrack-testing-key-256bits'; !
// ! ALERTE SÉCURITÉ : Clé secrète de test utilisée par la bibliothèque jsonwebtoken. Elle permet au middleware d'authentification de valider les tokens JWT générés pendant les tests d'intégration. Ne JAMAIS utiliser une clé de production ici. !
process.env.JWT_SECRET = 'test-jwt-secret-fittrack-testing-key-256bits';

// ? process.env.JWT_EXPIRES_IN = '1d'; ?
// ? Vérification de données : Durée de validité par défaut des tokens émis durant la session de test (ici, 1 jour). ?
process.env.JWT_EXPIRES_IN = '1d';

// * process.env.NODE_ENV = 'test'; *
// * Logique métier / Architecture : Indique à l'application qu'elle s'exécute dans un contexte de test. Cela permet notamment à server.js d'empêcher le lancement automatique de app.listen(), laissant l'outil Supertest gérer l'écoute réseau de manière isolée. *
process.env.NODE_ENV = 'test';

// ============================================================================
// FIN DU FICHIER : Environnement de test initialisé avec succès.
// ============================================================================