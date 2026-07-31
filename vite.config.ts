// @lovable.dev/vite-tanstack-config inclut déjà : tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, componentTagger (dev), injection des VITE_*, alias @, dédupe React.
// Ne pas les rajouter manuellement (plugins dupliqués = app cassée).
//
// Déploiement : Vercel, en mode SPA.
// Le site n'a besoin d'aucun rendu serveur (tout le contenu vient de l'API FastAPI
// côté client) : le build produit une coquille HTML statique + les assets, servie
// par Vercel comme un site statique classique. Cela évite d'avoir à héberger un
// serveur Node pour le frontend.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: { outputPath: "/index.html" },
    },
  },
});
