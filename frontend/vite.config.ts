// ============================================================
// vite.config.ts — Configuration Bundler Vite
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

export default defineConfig({
  // * Action : Ajout de tailwindcss() dans les plugins *
  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
})

// ============================================================