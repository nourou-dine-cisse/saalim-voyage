# Nettoyage — fichiers à supprimer

Je n'ai pas les droits de suppression sur votre dossier. Ces éléments sont
inutilisés et vérifiés comme tels ; une seule commande suffit à les retirer.

```bash
cd ~/Downloads/saalim-voyages-main/saalim-voyage

# 46 composants shadcn (4 360 lignes) : aucun n'est importé, les sections
# du site sont écrites en Tailwind brut.
rm -rf src/components/ui

# Hook utilisé uniquement par le composant sidebar supprimé ci-dessus.
rm -rf src/hooks

# Script devenu inutile : l'admin lit désormais directement la Google Sheet,
# il n'y a donc plus rien à importer vers SQLite.
rm -f api/scripts/import_sheet_registrations.py

# Dépendances retirées du package.json : régénère le lockfile.
npm install

# Vérification finale.
npm run build
```

## Ce qui a déjà été nettoyé

- `sheets_service.py` : fonctions des départs et vidéos retirées (ces contenus
  vivent en SQLite) ; le fichier ne gère plus que l'index des inscriptions
- `store.py` : `count_registrations()`, jamais appelée
- `admin.tsx` : composant `CenterMsg`, devenu orphelin après le passage à
  l'authentification par jeton
- `package.json` : 38 dépendances supprimées (les 27 paquets Radix UI et
  11 bibliothèques qui ne servaient qu'aux composants shadcn)

## Ce qui a été volontairement conservé

**Les traductions** (`translations.ts`) — certaines clés ne servent plus depuis
que forfaits et lieux viennent de l'admin, mais le fichier est imbriqué et une
suppression automatique y a déjà cassé la section Services lors d'un essai. Le
gain (60 lignes) ne justifie pas le risque.

**Les images d'origine** (`src/assets/`) — elles servent de visuels de secours
quand un forfait, un lieu ou un départ est saisi sans image. Seule
`Logo-Saalim.jpeg` est un doublon de `logo.jpeg` et peut être supprimée.

**Cinq dépendances sans import direct** mais nécessaires : `@tailwindcss/vite`,
`@tanstack/router-plugin`, `vite-tsconfig-paths`, `react-dom` et
`@tanstack/react-query`. Elles interviennent au build ou à l'exécution.

**`list_registrations_db()`** dans `store.py` — seul moyen de relire la copie de
secours des inscriptions si la Google Sheet venait à disparaître.
