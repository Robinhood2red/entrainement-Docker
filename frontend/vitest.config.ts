// ============================================================================
// ROLE MACRO : Fichier de configuration isolé pour le framework de test Vitest.
// Il intègre le plugin React pour compiler le JSX, définit un environnement 
// simulant un navigateur (jsdom) pour tester les composants, charge les scripts
// d'initialisation globaux et configure l'analyseur de couverture de code v8.
// ============================================================================

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // * plugins: [react()] *
  // * Action / Compilation : Injecte le plugin officiel React de Vite. Cela permet à Vitest de comprendre, transpiler et manipuler le JSX/TSX présent dans tes composants lors de l'exécution des tests. *
  plugins: [react()],
  
  test: {
    // * globals: true *
    // * Action : Active l'injection globale des API de Vitest (comme describe, it, expect, vi). Cela t'évite d'avoir à les importer manuellement en haut de chaque fichier de test. *
    globals: true,

    // ? environment: 'jsdom' ?
    // ? Configuration de l'environnement : Utilise 'jsdom' pour simuler un document et une fenêtre de navigateur (DOM) directement dans Node.js. Indispensable pour tester le rendu de composants React et les interactions utilisateur (clics, inputs). ?
    environment: 'jsdom',

    // ! setupFiles: './src/tests/setup.ts' !
    // ! ALERTE ARCHITECTURALE : Script d'initialisation critique exécuté avant chaque fichier de test. Utilisé pour étendre les assertions Jest/Vitest (comme jest-dom) ou pour mocker globalement des API du navigateur (LocalStorage, Fetch, etc.). !
    setupFiles: './src/tests/setup.ts',

    // ? coverage: { ... } ?
    // ? Requêtage et rapports : Configure l'analyse de couverture du code. Utilise le moteur natif v8 pour collecter les métriques et génère des rapports consultables en console (text) ou via une interface interactive (html). ?
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // ? include: [...] ?
      // ? Filtrage des données : Cible précisément les répertoires applicatifs contenant la logique métier visuelle, les hooks personnalisés et la gestion d'état à auditer. ?
      include: [
        'src/pages/**',
        'src/hooks/**',
        'src/components/**',
        'src/context/**',
      ],
    },
  },
})

// ============================================================================
// FIN DU FICHIER : Configuration Vitest prête pour les tests unitaires et d'intégration.
// ============================================================================