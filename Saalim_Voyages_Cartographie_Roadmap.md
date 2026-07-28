# Cartographie & Roadmap — Saalim Voyages

*Document généré le 28 juillet 2026, à partir d'une revue complète du code source du dossier `saalim-voyages-main`.*

---

## 1. Stack technique

Le site est une application **React 19 + TanStack Start** (SSR, TypeScript), stylée avec **Tailwind CSS v4** et des composants **shadcn/ui**. Le backend est **Supabase** (PostgreSQL + Auth + Storage), initialement provisionné via Lovable Cloud. Il n'y a **aucun dépôt Git initialisé** dans le dossier (`git status` échoue : pas de `.git`), donc aucun historique de versions n'est actuellement conservé.

Point notable : trois pistes de déploiement coexistent sans qu'aucune ne soit clairement tranchée : `wrangler.jsonc` + `@cloudflare/vite-plugin` (Cloudflare Workers), le package `@railway/cli` (Railway), et un `VERCEL_OIDC_TOKEN` dans `.env.local` (Vercel). Un `dist/` déjà buildé pour Cloudflare Workers est présent.

---

## 2. Cartographie de l'arborescence

```
saalim-voyages/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          Layout racine (HTML, head, 404)
│   │   ├── index.tsx           Page d'accueil — assemble 12 sections
│   │   └── admin.tsx           Dashboard admin (635 lignes, 6 onglets)
│   │
│   ├── components/
│   │   ├── Header.tsx, Footer.tsx, LangSwitcher.tsx
│   │   └── sections/            12 sections de la home (Hero → Contact)
│   │
│   ├── components/ui/           ~35 composants shadcn (non métier)
│   │
│   ├── i18n/
│   │   ├── LangContext.tsx      Contexte FR/EN + conversion Hijri
│   │   └── translations.ts      743 lignes — tous les textes FR/EN
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts, client.server.ts   Clients auto-générés
│   │   ├── auth-middleware.ts            Middleware serveur — généré mais NON utilisé
│   │   └── types.ts                      Types DB auto-générés
│   │
│   └── assets/                  9 images (dont 2 QR codes Wave/Orange Money)
│
├── supabase/
│   ├── config.toml
│   └── migrations/               3 fichiers SQL (schéma complet)
│   └── functions/                ⚠️ ABSENT — voir section 4
│
└── .env / .env.local             Clés Supabase + token Vercel
```

---

## 3. Ce qui est fonctionnel aujourd'hui

### Base de données (3 migrations SQL, cohérentes et sécurisées par RLS)

Six tables existent : `registrations`, `visa_requests`, `payments`, `reviews`, `contact_messages`, `user_roles`. Les policies RLS sont correctement posées : n'importe qui peut insérer (soumettre un formulaire), seuls les admins (via la fonction `has_role()`) peuvent lire/modifier. Un bucket de stockage privé `passports` existe avec policies dédiées (upload public, lecture réservée aux admins). Un compte admin est provisionné par migration (`saalimvoyages@gmail.com`).

### Formulaires publics connectés à Supabase (bout en bout)

- **Register** — inscription complète (identité, service, date de départ, upload passeport vers le bucket privé, insertion dans `registrations`). Préremplissage possible depuis Planning/Services via un événement custom (`saalim:prefill`).
- **Payment** — déclaration de paiement Wave/Orange Money, insertion dans `payments`, puis relance WhatsApp pré-remplie.
- **Reviews** — dépôt d'avis (insertion `approved: false`) + affichage des 3 derniers avis approuvés en lecture publique.
- **Contact** — formulaire de contact, insertion dans `contact_messages`.

Toutes ces soumissions sont validées côté client avec Zod avant envoi.

### Interface admin (`/admin`)

Authentification Supabase Auth (email/mot de passe) + vérification du rôle `admin` via `user_roles`. Dashboard à 6 onglets, tous fonctionnels et branchés en direct sur Supabase :

- **Métriques** — total inscriptions, payées, en attente, nb visas, répartition par mois de départ (calculée côté client).
- **Inscriptions** — tableau complet + lien de visualisation sécurisée du passeport (URL signée, 60s).
- **Visas** — tableau des demandes de visa (voir limite en section 4).
- **Paiements** — tableau + action « confirmer » un paiement.
- **Avis** — modération (approuver / rejeter).
- **Messages** — liste des messages de contact.

### Système bilingue FR/EN

Centralisé dans `translations.ts`, contexte React propre, conversion de dates en calendrier hijri approximatif pour la section Planning.

### Design & UX

Design system cohérent (variables `oklch` dans `styles.css`), sections riches en interactions (modales, onglets, carrousel de dates), responsive, animations soignées.

---

## 4. Ce qui est statique, mocké ou incomplet

| Élément | État constaté |
|---|---|
| **Forfaits (Packages)** | Contenu 100 % en dur dans `translations.ts` (prix, durée, inclusions). Aucune table DB, aucune gestion admin. Modifier un prix = éditer du code. |
| **Dates de départ (Planning)** | Générées **côté client** par une fonction `buildDepartures()` qui invente 8 dates fictives à intervalles réguliers avec des places restantes aléatoires. Ce n'est pas une vraie disponibilité — c'est un mock visuel. |
| **Edge Function `notify-registration`** | Invoquée dans `Register.tsx` (`supabase.functions.invoke("notify-registration", …)`) mais **le dossier `supabase/functions/` n'existe pas** dans le repo. Aucune notification (email/SMS à l'agence) n'est donc réellement envoyée ; l'échec est avalé silencieusement (`catch { /* ignore */ }`). |
| **Formulaire de demande de visa seul** | La table `visa_requests` existe en base et l'onglet admin correspondant est prêt, mais **aucun formulaire public ne l'alimente**. Le champ `service_type = "visa_only"` du formulaire Register écrit dans `registrations`, pas dans `visa_requests`. L'onglet admin « Visas » restera donc vide en permanence dans l'état actuel. |
| **Vidéos** | 3 vignettes cliquables affichant systématiquement le texte « Video coming soon » — aucune vidéo réelle, aucun lecteur intégré. |
| **`auth-middleware.ts`** | Middleware serveur généré (validation de Bearer token) mais non référencé nulle part dans le code — scaffolding inutilisé pour l'instant. |
| **SEO / métadonnées racine** | `__root.tsx` contient encore les métadonnées par défaut de Lovable (« Lovable App », « Lovable Generated Project », `twitter:site: @Lovable`) au lieu de celles de Saalim Voyages. Seule la route `/` surcharge son propre titre/description. |
| **Tests automatisés** | Aucun fichier de test trouvé dans le projet. |
| **CI/CD** | Aucun workflow (`.github/workflows` absent) ; aucun dépôt Git initialisé. |
| **Cible de déploiement** | Trois configurations coexistent (Cloudflare Workers, Railway, Vercel) sans que l'une soit désignée comme définitive. |
| **Avis clients** | Aucun avis pré-existant en base (les 3 migrations n'insèrent aucune donnée de démo) — la section Reviews affichera « aucun avis » tant que personne n'en aura soumis un et qu'un admin ne l'aura pas approuvé. |

---

## 5. Roadmap complète

### Phase 0 — Fondations projet (avant tout développement)
- Initialiser un dépôt Git et le pousser sur une plateforme (GitHub/GitLab), avec `.gitignore` déjà présent.
- Trancher la cible de déploiement unique (Cloudflare Workers **recommandé**, vu que le projet est déjà configuré et buildé pour ça) et retirer les dépendances/config des deux autres pistes.
- Corriger les métadonnées SEO génériques dans `__root.tsx`.

### Phase 1 — Fiabiliser les fonctionnalités critiques existantes
- Créer et déployer la edge function `notify-registration` (email/WhatsApp à l'agence à chaque inscription) — actuellement un appel mort.
- Décider du sort du flux « visa seul » : soit créer un vrai formulaire public écrivant dans `visa_requests`, soit supprimer cette option du formulaire Register pour ne pas laisser un onglet admin en permanence vide.
- Ajouter des logs/alertes (ex. Sentry) pour détecter les échecs silencieux (`catch { /* ignore */ }` dans Register et l'appel edge function).

### Phase 2 — Rendre Packages et Planning pilotables depuis l'admin
- Créer les tables `packages` et `departures` en base (avec migration + policies RLS : lecture publique, écriture admin).
- Remplacer le contenu en dur de `Packages.tsx` et la génération fictive de `Planning.tsx` par de vraies requêtes Supabase.
- Ajouter deux nouveaux onglets admin (« Forfaits », « Départs ») pour créer/éditer/désactiver forfaits et dates, avec un vrai compteur de places restantes décrémenté par les inscriptions confirmées.

### Phase 3 — Contenu réel
- Remplacer les vignettes vidéo « coming soon » par de vraies vidéos (upload Supabase Storage ou intégration YouTube/Instagram).
- Injecter quelques avis clients réels ou en demander activement aux premiers pèlerins pour amorcer la section Reviews.
- Revoir les visuels génériques (images stock) si des photos propres à l'agence sont disponibles.

### Phase 4 — Sécurité, qualité, exploitation
- Ajouter des tests (au minimum : validation des schémas Zod, policies RLS via des tests d'intégration Supabase).
- Mettre en place une CI (lint + build + tests) sur chaque push.
- Décider si `auth-middleware.ts` doit protéger de futures routes serveur (ex. API interne) ou être retiré s'il reste inutile.
- Ajouter une rotation/rappel pour le mot de passe admin actuellement en clair dans les migrations et le mémo d'architecture.
- Mettre en place des sauvegardes régulières de la base et un plan de restauration.

### Phase 5 — Fonctionnalités avancées (optionnel, selon besoins métier)
- Notifications email automatiques au client (confirmation d'inscription, rappel de paiement).
- Génération de reçu/facture PDF téléchargeable après confirmation de paiement.
- Tableau de bord analytics plus poussé (taux de conversion par forfait, entonnoir inscription → paiement confirmé).
- Multi-devise si expansion hors zone XOF.
- Export CSV des tableaux admin (inscriptions, paiements, visas).

---

## 6. Priorités suggérées

Si une seule chose doit être corrigée en premier : **le flux de notification (`notify-registration`) est cassé silencieusement** — l'agence peut donc manquer de vraies inscriptions sans le savoir. C'est la priorité absolue avant toute nouvelle fonctionnalité.

Juste derrière : clarifier le sort de « visa seul » (formulaire fantôme actuellement) et initialiser Git pour sécuriser l'historique du code.
