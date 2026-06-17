// ============================================================
// components/LoadingSpinner.tsx — Composant visuel d'attente
//
// Ce composant affiche un indicateur de chargement centré sur 
// tout l'écran. Il est utilisé lors des transitions de route 
// ou pendant la vérification asynchrone des jetons d'accès.
// ============================================================

export default function LoadingSpinner() {
  // * Action : Rendu d'un conteneur plein écran centré avec Flexbox *
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      {/* * Action : Affichage du spinner animé via les classes utilitaires Tailwind * */}
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
    </div>
  )
}

// ============================================================