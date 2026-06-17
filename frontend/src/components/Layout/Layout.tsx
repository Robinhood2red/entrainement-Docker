// ============================================================
// components/Layout/Layout.tsx — Structure globale de l'application
//
// Ce composant définit l'ossature de l'interface utilisateur.
// Il intègre une barre de navigation latérale (Sidebar) fixe 
// et une zone de contenu principale dynamique (Outlet) défilante.
// ============================================================

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  // * Action : Structuration de l'écran en deux colonnes (Sidebar + Contenu principal) *
  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* * Action : Affichage de la barre latérale de navigation * */}
      <Sidebar />
      
      {/* * Action : Zone principale avec défilement vertical indépendant * */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {/* ? Requêtage et injection de la vue enfant correspondante à la route active ? */}
          <Outlet />
        </div>
      </main>
    </div>
  )
}

// ============================================================