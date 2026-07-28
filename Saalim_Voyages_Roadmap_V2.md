# Roadmap V2 — Migration vers FastAPI + Google Drive + Vercel

*Ce document remplace la section "roadmap" du premier mémo. Il part des décisions déjà prises et propose une suite concrète, à valider ensemble avant de coder.*

---

## 0. Ce qui a changé depuis le premier état des lieux

- Un dépôt Git a été créé (`github.com/nourou-dine-cisse/salami-voyage`) et un premier commit `init` a été poussé.
- Décision : déploiement du frontend sur **Vercel** (plus Cloudflare Workers).
- Décision : les **inscriptions** (données personnelles + passeport) ne seront plus stockées en base de données mais dans **Google Drive**, un dossier par pèlerin (fiche récapitulative + scan du passeport). Une fois la soumission validée, un **e-mail est envoyé à l'admin**.
- Décision : les **API** seront écrites en **FastAPI** (Python) plutôt qu'en fonctions serverless TanStack/Supabase.
- Décision : l'authentification admin reste **inchangée** (email/mot de passe via Supabase Auth).
- Hébergement de FastAPI : **pas encore tranché** — recommandation ci-dessous.

## ⚠️ 1. Constats de nettoyage — deux points nécessitent une action de votre côté

Je n'ai pas un accès complet à votre machine (pas de vos identifiants Git/GitHub, et le dossier a des protections que je ne peux pas toujours contourner). J'ai donc fait ce qui était possible directement dans les fichiers, mais deux choses restent à finir **par vous** :

**a) Le fichier `.env` a été commité et poussé sur GitHub dans le commit `init`.**
Bonne nouvelle : les clés qu'il contient (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*`) sont des clés *publiques/publishable*, prévues pour être exposées côté client — ce n'est donc pas critique. Mais ce n'est pas une bonne pratique, et ça le deviendra si un jour un secret plus sensible (token Google, secret FastAPI) est ajouté au même fichier par erreur.
J'ai déjà : ajouté `.env` au `.gitignore`, et retiré `.env` du suivi Git (`git rm --cached .env` — le fichier reste sur votre disque, juste plus suivi par Git).
Il vous reste à exécuter, depuis votre terminal (pas depuis moi) :
```
cd salami-voyage
rm -f .git/index.lock   # un verrou Git bloqué empêche tout commit depuis mon environnement
git add -A
git commit -m "Cleanup: retire .env du suivi Git, dépendances Cloudflare/Railway inutiles, cible Vercel"
git push origin main
```

**b) Fichiers Cloudflare obsolètes** (`wrangler.jsonc`, dossier `.wrangler/`, dossier `dist/`) : je n'ai pas pu les supprimer (protection du dossier). Vous pouvez les supprimer manuellement une fois le point (a) réglé — ils ne servent plus avec Vercel.

**Déjà fait par moi, sans action requise :**
- Suppression des dépendances mortes dans `package.json` (`@cloudflare/vite-plugin`, `@railway/cli`, `railway`, et deux entrées clairement accidentelles : `"-"` et `"g"`).
- Désactivation du plugin Cloudflare dans `vite.config.ts` (`defineConfig({ cloudflare: false })`) — le build ne générera plus de bundle Workers.
- Correction des métadonnées SEO génériques ("Lovable App") dans `src/routes/__root.tsx`.
- Point d'attention non corrigé (à trancher) : deux lockfiles coexistent (`bun.lockb` et `package-lock.json`). Il faudra en choisir un seul — `package-lock.json` semble le plus récent/actif.

---

## 2. Nouvelle architecture cible

```
┌─────────────────┐        HTTPS/JSON        ┌──────────────────┐
│  Frontend React  │ ───────────────────────► │   API FastAPI    │
│  (TanStack Start)│ ◄─────────────────────── │                  │
│  déployé Vercel   │                          │  héberge : Railway│
└─────────────────┘                          │  (recommandé)     │
        │                                     └──────────────────┘
        │ Auth (login admin only)                     │
        ▼                                              ▼
┌─────────────────┐                          ┌──────────────────┐
│  Supabase        │                          │  Google Drive     │
│  (Auth + reste   │                          │  1 dossier /       │
│  des tables :    │                          │  pèlerin           │
│  payments,       │                          │  (fiche + passport)│
│  reviews,        │                          └──────────────────┘
│  contacts, visas)│                                    │
└─────────────────┘                          ┌──────────────────┐
                                              │  E-mail admin      │
                                              │  (à chaque         │
                                              │  inscription       │
                                              │  validée)          │
                                              └──────────────────┘
```

**Hypothèse à valider avec vous :** seules les *inscriptions* migrent vers Drive. Les paiements, avis, demandes de visa et messages de contact resteraient sur Supabase (déjà fonctionnels, RLS en place), puisque vous n'avez mentionné que le registration pour ce changement et que vous gardez Supabase pour l'auth. Dites-moi si vous voulez au contraire tout faire migrer derrière FastAPI.

### Recommandation d'hébergement FastAPI : **Railway**
Raisons : `@railway/cli` était déjà présent dans vos dépendances (signe d'un intérêt antérieur), un process Python persistant convient mieux à l'intégration Google Drive (upload de fichiers potentiellement volumineux, tokens OAuth à rafraîchir) que des fonctions serverless à froid, le déploiement continu depuis GitHub est simple à brancher, et le coût reste faible pour ce volume de trafic. Alternative équivalente : Render. À éviter : Vercel Functions Python pour ce cas d'usage (timeouts courts, pas de process persistant, plus complexe pour gérer un client Google Drive authentifié).

### Format de stockage Drive — proposition
Vous avez choisi "un dossier par pèlerin". Pour que l'admin puisse quand même lister/filtrer rapidement les inscriptions sans interroger l'API Google Drive à chaque clic (lente, quotas limités), je propose d'ajouter un **index léger** : une Google Sheet unique (ou une petite base SQLite côté FastAPI) qui garde une ligne par pèlerin avec les champs clés (nom, contact, service, date de départ, lien vers le dossier Drive, statut). Le dossier Drive reste la source de vérité documentaire (fiche + passeport) ; la Sheet/SQLite n'est qu'un index de consultation rapide pour l'admin. Dites-moi si vous préférez que l'admin interroge Drive directement à chaque fois (plus simple à construire, plus lent à l'usage).

---

## 3. Roadmap détaillée

### Phase 0 — Finaliser l'assainissement du dépôt (vous)
- Exécuter les 4 commandes de la section 1(a).
- Supprimer `wrangler.jsonc`, `.wrangler/`, `dist/`.
- Choisir un seul gestionnaire de paquets (npm recommandé) et supprimer l'autre lockfile.

### Phase 1 — Bootstrap FastAPI (MVP inscriptions)
- Nouveau service `api/` (dépôt séparé ou dossier dans le même repo, à trancher) avec FastAPI + un endpoint `POST /registrations`.
- Intégration Google Drive : créer un compte de service Google Cloud, partager un dossier racine avec ce compte de service, implémenter la création de dossier + upload de fichier via `google-api-python-client`.
- Validation des champs (Pydantic, reprenant les règles déjà présentes côté Zod dans `Register.tsx`).
- Envoi d'e-mail à l'admin à chaque inscription validée (SMTP simple ou service comme Resend/SendGrid).
- Tests locaux avant de toucher au frontend.

### Phase 2 — Brancher le frontend
- Remplacer dans `Register.tsx` l'appel `supabase.from("registrations").insert(...)` + `supabase.storage.from("passports").upload(...)` par un seul appel `fetch()` vers l'API FastAPI (upload multipart avec le fichier passeport).
- Adapter l'onglet admin "Inscriptions" (`admin.tsx`) pour lire depuis le nouvel index (Sheet/SQLite) via un endpoint FastAPI protégé, au lieu de `supabase.from("registrations")`.
- Le lien "voir le passeport" pointera vers un lien Drive (partagé en lecture avec l'admin uniquement) au lieu d'une URL signée Supabase Storage.

### Phase 3 — Authentification croisée frontend ↔ FastAPI
- L'admin se connecte toujours via Supabase Auth (inchangé).
- Le frontend transmet le token Supabase (Bearer) à FastAPI pour les routes protégées (liste des inscriptions, etc.).
- FastAPI vérifie ce token via les clés publiques JWKS de Supabase (pas besoin de dupliquer un système de login).
- Supprimer ou réutiliser `auth-middleware.ts`, qui existait déjà côté TanStack mais n'était jamais appelé — sa logique de vérification de token trouve enfin un usage concret côté FastAPI (réécrite en Python).

### Phase 4 — Déploiement
- Frontend : connecter le repo GitHub à Vercel, variables d'environnement `VITE_SUPABASE_*` à reconfigurer dans le dashboard Vercel.
- API : déployer FastAPI sur Railway (ou Render), variables d'environnement sensibles (credentials Google, SMTP) définies uniquement côté hébergeur — jamais commitées.
- Mettre à jour le DNS/domaine si un nom de domaine personnalisé est prévu.

### Phase 5 — Sécurité & conformité
- Le compte de service Google et les identifiants SMTP ne doivent jamais être commités (ajouter un `.env.example` vide comme modèle).
- Restreindre le partage des dossiers Drive au compte Google de l'agence uniquement (pas de lien public).
- Réfléchir à une politique de rétention des passeports scannés (durée de conservation, suppression après le voyage).
- Envisager la rotation des clés Supabase existantes par prudence, même si leur exposition actuelle est à faible risque.

### Phase 6 — Reste du périmètre (à confirmer)
- Décider si paiements / avis / visas / contacts restent sur Supabase ou migrent aussi vers FastAPI + une vraie base de données (PostgreSQL géré par vous, ou SQLite si le volume reste faible).
- Reprise des chantiers identifiés dans la première cartographie : rendre Packages et Planning pilotables depuis l'admin, remplacer les vignettes vidéo factices, formulaire "visa seul" réellement branché.

---

## 4. Points à valider avec vous avant de commencer à coder

1. FastAPI : dépôt séparé ou même repo (monorepo avec `api/` à côté de `src/`) ?
2. Confirmez-vous que paiements/avis/visas/contacts restent sur Supabase pour l'instant (Phase 6 plus tard), et que seule l'inscription bascule vers Drive/FastAPI immédiatement ?
3. Êtes-vous d'accord pour l'index Google Sheet/SQLite en plus du dossier-par-pèlerin, ou préférez-vous que l'admin interroge Drive directement ?
4. Avez-vous déjà un compte Google Cloud / Workspace pour créer le compte de service Drive, ou faut-il le prévoir dans la roadmap ?
