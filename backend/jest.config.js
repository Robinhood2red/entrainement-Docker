// ============================================================================
// ROLE MACRO : Fichier de configuration pour le framework de test Jest.
// Il définit l'environnement d'exécution, les fichiers d'initialisation,
// la stratégie de collecte de couverture de code (code coverage) et les
// motifs de correspondance pour identifier les fichiers de test du projet.
// ============================================================================

module.exports = {
  // * testEnvironment: 'node' *
  // ? Spécifie l'environnement dans lequel les tests vont s'exécuter. Ici, 'node' indique que les tests ciblent du code backend (Node.js) et non un navigateur (qui nécessiterait 'jsdom'). ?
  testEnvironment: 'node',

  // ! setupFiles: ['./tests/setup.js'] !
  // ! ALERTE ARCHITECTURALE : Liste de scripts exécutés avant CHAQUE fichier de test. Utilisé pour configurer des variables d'environnement globales, initialiser des mocks critiques ou configurer des bases de données de test. Risque d'effets de bord si mal configuré. !
  setupFiles: ['./tests/setup.js'],

  // ? coverageDirectory: 'coverage' ?
  // ? Indique le dossier de destination dans lequel Jest va générer les rapports d'analyse de la couverture de code (HTML, LCOV, etc.). ?
  coverageDirectory: 'coverage',

  // ? collectCoverageFrom: [...] ?
  // ? Requêtage et filtrage : Liste des fichiers sources à analyser pour calculer le pourcentage de code testé. On cible ici spécifiquement les contrôleurs, middlewares et routes. ?
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
  ],

  // * testMatch: ['**/tests/**/*.test.js'] *
  // * Action : Règle de correspondance (glob pattern) permettant à Jest de détecter automatiquement quels fichiers doivent être exécutés en tant que tests. Ici, tout fichier se terminant par `.test.js` situé dans un dossier `tests`. *
  testMatch: ['**/tests/**/*.test.js'],

  // * verbose: true *
  // * Action : Force Jest à afficher un rapport détaillé de chaque test individuel pendant l'exécution dans la console, plutôt que de simplement afficher un résumé global. *
  verbose: true,
};

// ============================================================================
// FIN DU FICHIER : Prêt pour l'exécution des tests via la commande jest.
// ============================================================================