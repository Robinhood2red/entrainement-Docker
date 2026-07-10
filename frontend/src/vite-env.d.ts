// ============================================================================
// @file: vite-env.d.ts
// @description: Déclarations de types globales pour TypeScript. Permet de gérer
//               les imports de fichiers statiques et CSS sans erreurs de module.
// ============================================================================

// === frontend/src/vite-env.d.ts ===
// * Inclusion des types de l'environnement client de Vite *
/// <reference types="vite/client" />

// ! note ! Permet l'import de fichiers CSS globaux ou de modules CSS sans erreur TypeScript
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// ? note ? Optionnel : Déclarations pour les fichiers d'assets courants si nécessaire
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

// ============================================================================