# Saalim Voyages — API (FastAPI)

Remplace, pour le flux d'inscription (`registrations`), l'insertion directe dans Supabase
par un stockage dans Google Drive (un dossier par pèlerin : fiche + passeport) et
une notification e-mail à l'admin. Le reste des données (paiements, avis, visas,
messages de contact) reste sur Supabase pour l'instant — voir le roadmap V2 à la
racine du dépôt.

## 1. Pourquoi OAuth et pas un compte de service

Un compte de service Google Cloud n'a **aucun quota de stockage propre**. Il peut créer
des dossiers (gratuit), mais pas déposer de fichiers dedans (erreur
`storageQuotaExceeded`) — sauf sur un Drive partagé, une fonctionnalité Google
Workspace non disponible sur un compte Gmail personnel. La solution retenue : l'API
s'authentifie **en tant que le compte Gmail de l'agence lui-même** (OAuth), et les
fichiers utilisent alors ses 15 Go gratuits normaux.

## 2. Créer les identifiants OAuth (une seule fois)

1. Console Google Cloud → créer un projet (ou réutiliser un projet existant).
2. Activer les API **Google Drive API** et **Google Sheets API** (APIs & Services → Library).
3. **APIs & Services → OAuth consent screen** : type "External", statut "Testing". Dans "Test users", ajouter l'adresse Gmail de l'agence (ex. `saalimvoyages@gmail.com`) — indispensable, sinon Google refuse la connexion.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**, type **"Desktop app"**. Télécharger le JSON généré.
5. Renommer ce fichier téléchargé en `client_secret.json` et le placer dans `api/scripts/`.
6. Lancer, en local :
   ```bash
   cd api
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   python scripts/get_refresh_token.py
   ```
7. Une fenêtre de navigateur s'ouvre : se connecter avec le compte Gmail de l'agence, accepter l'accès à Drive/Sheets. Le script affiche trois valeurs à copier dans `.env` : `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`.

Cette étape ne se refait qu'une fois (sauf si le refresh token est un jour révoqué).

## 3. Préparer Drive et la Sheet d'index

Comme l'API agit maintenant comme le compte Gmail lui-même, il suffit de créer les éléments normalement dans votre propre Drive — pas besoin de les partager avec qui que ce soit.

1. Créer un dossier Google Drive "Inscriptions Saalim Voyages" (dans votre Drive personnel). Copier son ID dans l'URL du dossier → `DRIVE_ROOT_FOLDER_ID`.
2. Créer une Google Sheet vide, un onglet nommé `Inscriptions` avec la ligne d'en-tête :
   `registration_id | created_at | full_name | email | phone | service_type | departure_date | drive_folder_link`
   Copier son ID dans l'URL → `REGISTRATIONS_INDEX_SHEET_ID`.

## 4. Variables d'environnement

Copier `.env.example` vers `.env` et remplir :
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_OAUTH_REFRESH_TOKEN` : générés à l'étape 2.
- `DRIVE_ROOT_FOLDER_ID` / `REGISTRATIONS_INDEX_SHEET_ID` : les ID récupérés à l'étape 3.
- `SMTP_*` : identifiants d'un compte capable d'envoyer des e-mails (Gmail avec mot de passe d'application, ou tout service SMTP).
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` : dans le dashboard Supabase → Project Settings → API (optionnel pour tester le flux d'inscription — voir section suivante).
- `FRONTEND_ORIGIN` : l'URL du site une fois déployé sur Vercel (pour CORS).

## 5. Lancer en local

```bash
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Tester : `POST http://localhost:8000/registrations` (multipart/form-data, champs listés dans `app/schemas.py`, fichier optionnel sous la clé `passport`). Préférer un `curl` direct en Terminal plutôt que le "Try it out" de Swagger UI sous Safari, qui peut échouer silencieusement avec les uploads de fichier (`TypeError: Load failed`).

## 6. Déploiement (Railway recommandé)

1. Nouveau projet Railway → "Deploy from GitHub repo" → sélectionner ce dépôt, **root directory : `api/`**.
2. Railway détecte le `Dockerfile` automatiquement (ou utilise `railway.json`).
3. Renseigner toutes les variables de `.env.example` dans l'onglet Variables de Railway.
4. Une fois déployé, récupérer l'URL publique et la renseigner côté frontend (variable `VITE_API_URL`, à créer — voir Phase 2 du roadmap).

## Ce qui reste à faire (Phase 2 du roadmap)

- Brancher `src/components/sections/Register.tsx` sur `POST {API_URL}/registrations` au lieu de Supabase.
- Adapter l'onglet "Inscriptions" de `src/routes/admin.tsx` pour lire `GET {API_URL}/registrations` (Bearer token = session Supabase de l'admin) au lieu de `supabase.from("registrations")`.
