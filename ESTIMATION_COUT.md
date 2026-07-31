# Estimation du coût — Saalim Voyages

*Valorisation du travail réalisé, au 31 juillet 2026. Chiffrage en jours-homme, puis converti selon le profil du prestataire. Taux de conversion : 1 € = 656 FCFA.*

---

## 1. Ce qui a été livré

| Composant | Volume | Détail |
|---|---|---|
| Site vitrine | ~1 750 lignes | 12 sections, bilingue FR/EN, responsive, animations, modales |
| Traductions | 743 lignes | Tous les textes en français et anglais |
| Interface admin | ~1 400 lignes | 9 onglets, CRUD complet sur 4 types de contenu |
| API backend | ~2 300 lignes | 32 endpoints, authentification, intégrations |
| Client API | ~486 lignes | Couche d'appel typée entre le site et l'API |

Les 46 composants d'interface (boutons, champs, modales…) proviennent d'une bibliothèque open source (shadcn/ui) et ne sont pas comptabilisés comme du développement.

---

## 2. Estimation en jours-homme

Chiffrage pour un développeur compétent partant de zéro, sans assistance IA, incluant les allers-retours de mise au point.

| Lot | Jours | Contenu |
|---|---|---|
| **Site vitrine** | 12 – 18 | Intégration des 12 sections, design system, responsive, bilingue, animations |
| **API backend** | 10 – 14 | FastAPI, authentification par jeton, 32 endpoints, base SQLite, envoi d'e-mails, conteneurisation |
| **Intégrations Google** | 4 – 6 | OAuth, Drive (dossiers, upload, permissions), Sheets (index, onglets auto) |
| **Interface admin** | 8 – 12 | 9 onglets, CRUD forfaits / lieux / départs / vidéos avec upload d'images, modération des avis, validation des paiements |
| **Migration Supabase → FastAPI** | 3 – 5 | Reprise de l'existant, bascule de l'authentification, réécriture des formulaires |
| **Déploiement et mise au point** | 5 – 8 | Vercel, Railway, variables d'environnement, correction des incidents de production |
| **Documentation** | 1 – 2 | Guide de déploiement, README technique, cartographie |
| **TOTAL** | **43 – 65 jours** | soit environ **2 à 3 mois** de travail à temps plein |

Retenons **50 jours** comme hypothèse médiane.

---

## 3. Valorisation selon le profil

| Profil | Taux journalier | Coût pour 50 jours |
|---|---|---|
| Freelance junior (Dakar) | 25 000 – 40 000 FCFA | **1,25 – 2,0 M FCFA** (1 900 – 3 050 €) |
| Freelance confirmé (Dakar) | 50 000 – 80 000 FCFA | **2,5 – 4,0 M FCFA** (3 800 – 6 100 €) |
| Agence web (Dakar) | 100 000 – 180 000 FCFA | **5,0 – 9,0 M FCFA** (7 600 – 13 700 €) |
| Freelance (Europe) | 300 – 550 € | **9,8 – 18,0 M FCFA** (15 000 – 27 500 €) |
| Agence (Europe) | 600 – 1 000 € | **19,7 – 32,8 M FCFA** (30 000 – 50 000 €) |

**Fourchette réaliste pour ce projet au Sénégal : 2,5 à 5 millions FCFA** (environ 3 800 à 7 600 €), pour un prestataire confirmé ou une petite structure.

À titre de comparaison, un simple site vitrine sans back-office ni intégrations se négocie généralement entre 300 000 et 1 000 000 FCFA à Dakar. L'écart tient ici à la partie sur mesure : back-office complet, intégrations Google, gestion des paiements et des passeports.

---

## 4. Coûts récurrents

| Poste | Coût mensuel | Remarque |
|---|---|---|
| Hébergement API (Railway) | 5 – 20 $ | Selon le trafic ; ~5 $ suffisent au démarrage |
| Volume de stockage (Railway) | ~1 $ | Indispensable pour ne pas perdre les données |
| Hébergement site (Vercel) | 0 € | Offre gratuite largement suffisante |
| Google Drive / Sheets | 0 € | 15 Go inclus ; ~2 € /mois au-delà (100 Go) |
| Envoi d'e-mails | 0 € | Gmail ; un service dédié serait ~0-20 $ selon le volume |
| Nom de domaine | ~1 € | ~12 € par an |
| **TOTAL** | **≈ 8 – 25 $ / mois** | soit **5 000 à 16 000 FCFA** |

---

## 5. Ce qui reste à faire (non inclus ci-dessus)

| Chantier | Estimation | Priorité |
|---|---|---|
| Intégration d'un vrai paiement en ligne (PayDunya, CinetPay, Wave Business) | 5 – 8 jours | Selon besoin commercial |
| Sections Services et Hero éditables depuis l'admin | 3 – 4 jours | Confort |
| Formulaire dédié « visa seul » | 2 – 3 jours | Confort |
| Sauvegardes automatiques de la base | 1 – 2 jours | Recommandé |
| Tests automatisés et intégration continue | 4 – 6 jours | Recommandé avant montée en charge |
| Traduction anglaise des contenus gérés en admin | 2 – 3 jours | Si clientèle internationale visée |

---

## 6. Précisions honnêtes sur ce chiffrage

Ce projet a été développé avec une assistance IA, ce qui a considérablement réduit le temps réel passé — sans rien changer à la **valeur** du livrable, qui est ce que mesure cette estimation. Un prestataire facturant au forfait chiffrerait sur la base des jours indiqués.

Deux éléments ne sont pas valorisés ici : la maquette graphique initiale, générée via Lovable (une prestation de design sur mesure représenterait 5 à 10 jours supplémentaires), et les contenus rédactionnels — textes des sections, guide spirituel, FAQ — qui existaient déjà.

Enfin, la fourchette suppose un projet mené d'une traite. Un développement étalé avec de nombreux allers-retours de spécification coûte en pratique 20 à 40 % de plus.
