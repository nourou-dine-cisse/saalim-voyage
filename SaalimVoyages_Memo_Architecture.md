# 📘 Mémo Architecture — Saalim Voyages

Document de référence pour comprendre **où se trouve chaque élément** du site et **comment le modifier**.

---

## 1. Vue d'ensemble

Le site est une application **React + TanStack Start** (TypeScript) hébergée sur **Lovable Cloud** (backend Supabase managé). Il est bilingue (FR/EN) et propose :

- Une page d'accueil unique (`/`) découpée en sections.
- Une interface d'administration sécurisée (`/admin`).
- Un backend (base de données, stockage des passeports, authentification admin).

---

## 2. Arborescence essentielle

```
saalim-voyages/
├── src/
│   ├── routes/                    ← Pages du site
│   │   ├── __root.tsx             ← Layout racine (HTML, head, scripts)
│   │   ├── index.tsx              ← Page d'accueil (assemble les sections)
│   │   └── admin.tsx              ← Tableau de bord admin
│   │
│   ├── components/
│   │   ├── Header.tsx             ← Barre de navigation supérieure
│   │   ├── Footer.tsx             ← Pied de page
│   │   ├── LangSwitcher.tsx       ← Bouton FR / EN
│   │   └── sections/              ← Toutes les sections de la home
│   │       ├── Hero.tsx           ← Bandeau d'accueil + badge animé vertical
│   │       ├── Packages.tsx       ← Forfaits Omra/Hajj
│   │       ├── Planning.tsx       ← Calendrier des départs
│   │       ├── Services.tsx       ← Services (visa, billet, tontine…)
│   │       ├── Places.tsx         ← Lieux saints (Mecque, Médine)
│   │       ├── Guide.tsx          ← Guide spirituel Omra & Hajj (onglets)
│   │       ├── Register.tsx       ← Formulaire d'inscription
│   │       ├── Reviews.tsx        ← Témoignages + dépôt d'avis
│   │       ├── Videos.tsx         ← Vidéos
│   │       ├── FAQ.tsx            ← Questions fréquentes
│   │       ├── Payment.tsx        ← Déclaration paiement Wave/Orange
│   │       ├── Contact.tsx        ← Coordonnées + formulaire
│   │       └── SectionHeading.tsx ← Titre stylisé réutilisable
│   │
│   ├── components/ui/             ← Composants shadcn (boutons, inputs…)
│   │                                  ⚠️ Ne pas modifier sauf cas particulier.
│   │
│   ├── i18n/
│   │   ├── LangContext.tsx        ← Contexte React FR/EN
│   │   └── translations.ts        ← 🟢 TOUS les textes FR & EN
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts              ← ⛔ Auto-généré, ne pas éditer
│   │   ├── client.server.ts       ← ⛔ Auto-généré
│   │   └── types.ts               ← ⛔ Auto-généré (schéma DB)
│   │
│   ├── assets/                    ← Images (QR codes, photos…)
│   │   ├── qr-wave.jpg
│   │   └── qr-orange.jpg
│   │
│   ├── styles.css                 ← 🎨 Couleurs, polices, animations
│   └── router.tsx                 ← Configuration du routeur
│
├── supabase/
│   ├── config.toml                ← ⛔ Auto-généré
│   └── migrations/                ← Historique des changements DB
│
└── .env                           ← ⛔ Auto-géré par Lovable Cloud
```

Légende : 🟢 = à modifier souvent · 🎨 = design · ⛔ = ne pas toucher

---

## 3. Où modifier quoi ? (cheat sheet)

| Vous voulez changer… | Allez dans… |
|---|---|
| Un texte (FR ou EN) | `src/i18n/translations.ts` |
| Le logo, les images | `src/assets/` + import dans le composant |
| Les couleurs / police / dégradés | `src/styles.css` (variables `--primary`, `--gold`, etc.) |
| Le badge animé d'accueil | `src/components/sections/Hero.tsx` + clé `hero.rotating` dans `translations.ts` |
| Les forfaits proposés | `src/components/sections/Packages.tsx` |
| Les dates de départ | `src/components/sections/Planning.tsx` |
| Les étapes du guide spirituel | `src/components/sections/Guide.tsx` |
| Les QR codes Wave / Orange Money | Remplacer `src/assets/qr-wave.jpg` ou `qr-orange.jpg` |
| Le numéro WhatsApp / e-mail | `src/components/sections/Contact.tsx` + `Payment.tsx` |
| L'ordre des sections | `src/routes/index.tsx` (réordonner les `<Composant />`) |
| La navigation (header) | `src/components/Header.tsx` |
| Le pied de page | `src/components/Footer.tsx` |
| Le titre / SEO de la page | `head()` dans `src/routes/index.tsx` |
| Les règles de sécurité backend | `supabase/migrations/` (créer une migration) |

---

## 4. Sections de la page d'accueil — ordre actuel

Défini dans **`src/routes/index.tsx`** :

1. **Hero** — Bandeau, badge vertical animé
2. **Packages** — Forfaits
3. **Planning** — Calendrier des départs
4. **Services** — Visa, billet, tontine, etc.
5. **Places** — Lieux saints
6. **Guide** — Guide spirituel (Omra + Hajj)
7. **Register** — Formulaire d'inscription
8. **Reviews** — 3 témoignages + dépôt d'avis
9. **Videos** — Vidéos
10. **FAQ** — Questions fréquentes
11. **Payment** — Déclaration de paiement (Wave / Orange Money)
12. **Contact** — Coordonnées + formulaire

Pour réordonner : déplacer les balises dans le `<main>` du fichier `index.tsx`.

---

## 5. Backend (Lovable Cloud)

### Tables principales

| Table | Rôle |
|---|---|
| `registrations` | Inscriptions au pèlerinage |
| `visa_requests` | Demandes de visa seul |
| `payments` | Déclarations de paiement Wave/Orange |
| `reviews` | Témoignages clients (à valider en admin) |
| `contact_messages` | Messages du formulaire de contact |
| `user_roles` | Rôles utilisateurs (admin) |

### Stockage

- **Bucket `passports`** (privé) : scans des passeports uploadés via le formulaire d'inscription.

### Compte administrateur

- **E-mail** : `saalimvoyages@gmail.com`
- **Mot de passe** : `sa@limvoyages1!`
- **Accès** : `/admin` → onglets Inscriptions · Visas · Paiements · Avis

Toutes les tables ont des **policies RLS** : seuls les admins peuvent lire/modifier ; n'importe qui peut soumettre un formulaire.

---

## 6. Système bilingue (FR / EN)

Tous les textes sont centralisés dans **`src/i18n/translations.ts`** sous la forme :

```ts
export const translations = {
  fr: { hero: { title: "..." }, register: { ... } },
  en: { hero: { title: "..." }, register: { ... } },
};
```

Pour utiliser dans un composant :

```tsx
import { useLang } from "@/i18n/LangContext";
const { t, lang } = useLang();
return <h1>{t.hero.title}</h1>;
```

➡️ **Pour ajouter ou corriger un texte** : éditer **uniquement** `translations.ts`, dans les deux langues.

---

## 7. Design system

Tout est dans **`src/styles.css`** :

- Variables de couleur (`--primary`, `--gold`, `--background`…) en format `oklch`.
- Dégradés (`--gradient-primary`).
- Ombres (`--shadow-elegant`, `--shadow-soft`).
- Animations (`@keyframes marquee-vertical` pour le badge animé).

⚠️ **Ne jamais écrire de couleurs en dur** (`bg-blue-500`, `text-white`…) dans les composants. Toujours utiliser les classes sémantiques (`bg-primary`, `text-foreground`…).

---

## 8. Fichiers à NE PAS modifier manuellement

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/types.ts`
- `src/routeTree.gen.ts`
- `supabase/config.toml`
- `.env`

Ces fichiers sont régénérés automatiquement par Lovable.

---

## 9. Workflow de modification recommandé

1. **Texte / traduction** → `src/i18n/translations.ts`
2. **Visuel d'une section** → fichier correspondant dans `src/components/sections/`
3. **Couleurs / animations globales** → `src/styles.css`
4. **Nouveau champ dans un formulaire** → composant + table Supabase (migration)
5. **Nouvelle page** → créer `src/routes/nom-page.tsx`

---

## 10. Liens utiles

- **Aperçu** : `https://id-preview--725ebada-eb6c-4e3a-9185-177732f20c93.lovable.app`
- **Admin** : `<URL>/admin`
- **Documentation Lovable** : https://docs.lovable.dev

---

*Document généré pour Saalim Voyages — V1*
