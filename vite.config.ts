// @lovable.dev/vite-tanstack-config inclut déjà : tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, componentTagger (dev), injection des VITE_*, alias @, dédupe React.
// Ne pas les rajouter manuellement (plugins dupliqués = app cassée).
//
// Déploiement : Vercel, en mode SPA. Le site n'a besoin d'aucun rendu serveur
// (tout le contenu vient de l'API FastAPI côté client) : le build produit une
// coquille HTML statique + les assets, servie comme un site statique classique.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * VITE_API_URL est figée au moment de la compilation. Si elle manque lors d'un
 * build de production, le site part en ligne en appelant http://localhost:8000,
 * c'est-à-dire la machine du visiteur : tous les formulaires échouent, sans
 * message explicite. On préfère donc faire échouer le build tout de suite.
 */
function requireApiUrl(): Plugin {
  return {
    name: "require-api-url",
    apply: "build",
    config() {
      if (process.env.NODE_ENV === "development") return;
      if (!process.env.VITE_API_URL) {
        throw new Error(
          "\n\n=========================================================\n" +
            " BUILD ARRETE : la variable VITE_API_URL n'est pas definie.\n" +
            "=========================================================\n" +
            " Sans elle, le site deploye appellerait http://localhost:8000\n" +
            " et tous les formulaires echoueraient chez les visiteurs.\n\n" +
            " Vercel : Settings > Environment Variables > VITE_API_URL\n" +
            "          = https://votre-api.up.railway.app (sans slash final)\n" +
            "          puis Redeploy SANS le cache de build.\n" +
            "=========================================================\n",
        );
      }
    },
  };
}

export default defineConfig({
  cloudflare: false,
  plugins: [requireApiUrl()],
  tanstackStart: {
    spa: {
      enabled: true,
      prerender: { outputPath: "/index.html" },
    },
  },
});
