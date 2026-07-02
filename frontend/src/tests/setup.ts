// ============================================================================
// ROLE MACRO : Script de configuration globale pré-test (src/tests/setup.ts).
// Ce fichier s'exécute automatiquement en amont de chaque suite de tests front-end.
// Son but principal est d'étendre l'objet d'assertion de base (expect) de Vitest
// en y injectant les matchers sémantiques spécialisés dans l'analyse du DOM de
// la bibliothèque React Testing Library.
// ============================================================================

// ! import '@testing-library/jest-dom' !
// ! ALERTE ARCHITECTURALE : Importation critique pour l'extension des assertions. !
// ! Sans cette ligne, l'interpréteur de tests lèvera des erreurs de type indéfinie !
// ! à chaque rencontre de fonctions clés telles que .toBeInTheDocument() ou .toBeDisabled(). !
import '@testing-library/jest-dom'

// ============================================================================
// FIN DU FICHIER : Extensions de matchers DOM chargées avec succès.
// ============================================================================