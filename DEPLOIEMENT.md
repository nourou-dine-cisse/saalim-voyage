# Déploiement — Saalim Voyages

Architecture : **frontend sur Vercel**, **API FastAPI sur Railway**, données dans **Google Drive/Sheets** (inscriptions, départs, vidéos) et **SQLite** (paiements, avis, messages).

---

## ⚠️ 3 points à régler AVANT de déployer

### 1. Le jeton Google expire dans 7 jours (bloquant)

Votre écran de consentement OAuth est en statut **"Testing"**. Google fait expirer les refresh tokens au bout de **7 jours** dans ce mode : une semaine après la mise en ligne, les inscriptions, les départs et les vidéos cesseraient de fonctionner sans prévenir.

À faire : Google Cloud Console → **APIs & Services → OAuth consent screen / Audience** → bouton **"Publish app"** (passer en "In production"). L'application n'étant utilisée que par vous, la vérification Google n'est pas nécessaire ; un écran d'avertissement "application non vérifiée" apparaîtra uniquement lors d'une reconnexion, et se contourne via "Paramètres avancés → Continuer".

Après publication, régénérez le refresh token : `python scripts/get_refresh_token.py`, puis mettez à jour `GOOGLE_OAUTH_REFRESH_TOKEN`.

### 2. Mot de passe admin exposé dans le dépôt GitHub

Les fichiers `supabase/migrations/*.sql` et `SaalimVoyages_Memo_Architecture.md` contiennent l'ancien mot de passe admin **en clair**, et ils sont déjà poussés sur GitHub. Supabase n'étant plus utilisé, supprimez-les :

```bash
cd salami-voyage
rm -rf supabase src/integrations
rm -f SaalimVoyages_Memo_Architecture.md
```

Attention : supprimer les fichiers ne les efface pas de l'historique Git. Si le dépôt est public, passez-le en privé (GitHub → Settings → General → Danger Zone → Change visibility). Le mot de passe actuel de l'admin est différent et n'est stocké nulle part en clair, donc le risque est limité — mais un dépôt privé reste préférable.

### 3. Vérifier que le build passe en local

```bash
cd salami-voyage
npm install
npm run build
```

Si cette commande échoue, le déploiement Vercel échouera aussi. Corrigez avant de continuer.

---

## Étape 1 — Committer et pousser

```bash
cd salami-voyage
rm -f .git/index.lock
git add -A
git commit -m "Migration complète vers FastAPI + Drive/Sheets + SQLite, suppression de Supabase"
git push origin main
```

Vérifiez avant de pousser que `git status` ne mentionne **ni** `.venv/`, **ni** `api/.env`, **ni** `api/data/` (ils sont désormais dans `.gitignore`).

---

## Étape 2 — Déployer l'API sur Railway

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → sélectionnez le dépôt.
2. Dans les réglages du service : **Root Directory = `api`**. Railway détectera le `Dockerfile`.
3. Onglet **Variables** : recopiez toutes les valeurs de votre `api/.env` local, à trois exceptions près :
   - `SQLITE_PATH=/data/saalim.db`
   - `FRONTEND_ORIGIN=` (à remplir à l'étape 4)
   - `ENVIRONMENT=production`
4. **Volume persistant (indispensable)** : onglet **Volumes → New Volume**, point de montage **`/data`**. Sans ça, paiements, avis et messages sont effacés à chaque redéploiement.
5. Onglet **Settings → Networking → Generate Domain** pour obtenir l'URL publique (ex. `saalim-api.up.railway.app`).
6. Vérifiez : `https://VOTRE-API.up.railway.app/health` doit renvoyer `{"status":"ok"}`.

---

## Étape 3 — Déployer le frontend sur Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importez le dépôt GitHub.
2. **Root Directory = `salami-voyage`** (le code n'est pas à la racine du dépôt).
3. **Environment Variables** : `VITE_API_URL` = l'URL Railway de l'étape 2 (sans slash final).
4. **Deploy**.

Si le build échoue avec une erreur liée au rendu serveur, dites-le-moi : TanStack Start peut nécessiter un ajustement de configuration selon la cible d'hébergement.

---

## Étape 4 — Relier les deux

Retournez dans Railway → Variables → `FRONTEND_ORIGIN` = l'URL Vercel (ex. `https://saalim-voyages.vercel.app`). Redéployez le service.

Les domaines `*.vercel.app` sont déjà autorisés d'office côté API, mais renseigner la valeur exacte reste plus propre — et sera indispensable le jour où vous brancherez un nom de domaine personnalisé.

---

## Étape 5 — Vérifications après mise en ligne

- [ ] Page d'accueil : les sections s'affichent, la bascule FR/EN fonctionne
- [ ] Formulaire d'inscription : un dossier apparaît dans Drive + e-mail reçu
- [ ] Déclaration de paiement : e-mail reçu, visible dans l'admin
- [ ] Formulaire de contact : e-mail reçu, visible dans l'admin
- [ ] Dépôt d'un avis puis approbation depuis l'admin → l'avis apparaît sur le site
- [ ] `/admin` : connexion, ajout d'une date de départ, upload d'une vidéo
- [ ] Changer le mot de passe admin (il a circulé pendant la mise au point)

---

## Bon à savoir pour la suite

**Sauvegardes.** SQLite vit sur le volume Railway. Prévoyez une copie régulière (téléchargement du fichier, ou script d'export CSV) : un volume perdu = paiements, avis et messages perdus.

**Coûts.** Railway propose un crédit gratuit mensuel puis facture à l'usage ; Vercel est gratuit pour ce type de site. Les 15 Go de Drive suffisent largement pour des passeports, moins pour des vidéos (une vidéo = 50 à 500 Mo).

**Chantiers restants** (non bloquants) : les forfaits (prix, durées, inclusions) restent modifiables uniquement dans le code, et le formulaire « visa seul » écrit dans les inscriptions classiques.
