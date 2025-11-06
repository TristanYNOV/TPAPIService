# TPAPIService

> API REST NestJS (Fastify) — base de travail pour le POC Social.

## Table des matières
- [Aperçu](#aperçu)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement de l'application](#lancement-de-lapplication)
- [Structure du projet](#structure-du-projet)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts npm](#scripts-npm)
- [Postman — démarrage](#postman--démarrage)
- [Changelog](#changelog)
- [Étape 0 — Mise en place de la base documentaire](#étape-0--mise-en-place-de-la-base-documentaire)
- [Étape 2 — Auth: Register](#étape-2--auth-register)

## Aperçu
Cette application utilise [NestJS](https://nestjs.com) avec l'adaptateur Fastify et Prisma pour la couche d'accès aux données. Elle servira de socle pour construire l'API REST sécurisée du POC Social.

## Prérequis
- [Node.js](https://nodejs.org/) >= 20.11.1 (version LTS recommandée)
- [npm](https://www.npmjs.com/) >= 10.5.0 (installé avec Node.js)

Vérifiez vos versions :
```bash
node --version
npm --version
```

## Installation
1. Cloner le dépôt :
   ```bash
   git clone <url-du-repo>
   cd TPAPIService
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```

## Lancement de l'application
- **Développement** :
  ```bash
  npm run start:dev
  ```
- **Production (build puis run)** :
  ```bash
  npm run build
  npm run start:prod
  ```
- **Autres modes** :
  - `npm run start` : lancement simple sans watch.
  - `npm run start:debug` : lancement avec debug Node.

L'application écoute par défaut sur `http://localhost:3000`.

## Structure du projet
```
.
├── prisma/             # Schéma Prisma, migrations et base SQLite de dev
├── src/                # Code source NestJS
├── test/               # Tests unitaires et e2e
├── postman/            # Collections et environnements Postman
├── package.json        # Scripts npm et dépendances
├── prisma.config.ts    # Configuration Prisma pour NestJS
└── README.md
```

## Variables d'environnement
Créer un fichier `.env` à la racine du projet en vous basant sur l'exemple ci-dessous :
```
# Base de données SQLite utilisée par Prisma
DATABASE_URL="file:./prisma/dev.db"

# Clé pour signer les JWT (sera remplacée par une valeur sécurisée)
JWT_SECRET="change-me"

# Durée de validité des tokens
JWT_EXPIRES_IN="15m"
```
> ⚠️ Ne commitez jamais vos secrets. Utilisez des variables différentes par environnement.

Pour Prisma, régénérez le client après modification du schéma :
```bash
npx prisma generate
```

## Scripts npm
| Script | Description |
| --- | --- |
| `npm run build` | Compile le projet dans `dist/`. |
| `npm run format` | Formate le code avec Prettier. |
| `npm run lint` | Analyse statique ESLint. |
| `npm run start` | Démarre NestJS en mode standard. |
| `npm run start:dev` | Démarre NestJS avec rechargement à chaud. |
| `npm run start:debug` | Démarre NestJS avec l'inspecteur Node. |
| `npm run start:prod` | Démarre l'app à partir du build TypeScript. |
| `npm run test` | Lance les tests unitaires Jest. |
| `npm run test:watch` | Tests en watch mode. |
| `npm run test:cov` | Génère le rapport de couverture. |
| `npm run test:debug` | Lance Jest en mode debug. |
| `npm run test:e2e` | Lance les tests end-to-end. |

## Postman — démarrage
1. Ouvrez Postman et importez :
   - `postman/SocialPOC.postman_collection.json`
   - `postman/SocialPOC.local.postman_environment.json`
2. Sélectionnez l'environnement `SocialPOC (local)` :
   - La variable `{{baseUrl}}` pointe par défaut sur `http://localhost:3000`.
   - La variable `{{token}}` reste vide ; elle sera alimentée après authentification.
3. Les requêtes de la collection utilisent `{{baseUrl}}` pour l'URL et, lorsque nécessaire, l'en-tête `Authorization: Bearer {{token}}`.

## Changelog
- Étape 0 — Mise en place de la base documentaire
- Étape 2 — Auth: Register

## Étape 0 — Mise en place de la base documentaire
- **Objectifs** : fournir un guide de démarrage (prérequis, installation, scripts), préparer les fichiers Postman et structurer la documentation.
- **Comment lancer les tests** :
  ```bash
  npm run test
  npm run test:e2e
  ```
- **Bloc Postman** :
  - Variables : `{{baseUrl}} = http://localhost:3000`, `{{token}} = ""` (vide).
  - Importer `postman/SocialPOC.postman_collection.json` et `postman/SocialPOC.local.postman_environment.json`.
  - Requêtes disponibles pour cette étape : `GET {{baseUrl}}/placeholder` (placeholder en attendant les endpoints réels).

### Vérifications manuelles recommandées
- `curl http://localhost:3000/placeholder`
- Requête Postman `GET {{baseUrl}}/placeholder`

### Risques sécurité résiduels
- Clé JWT d'exemple (`JWT_SECRET`) à remplacer par une valeur forte avant toute mise en prod.
- Pas de mécanisme d'authentification ni de validation configuré à cette étape.
- Fichier `.env` à protéger (ne pas versionner, limiter les accès).

## Étape 2 — Auth: Register
- **Objectif** : exposer `POST /auth/register` pour créer un utilisateur avec email unique et mot de passe sécurisé (hash Argon2).
- **Règles de validation** :
  - `email` : format valide, unique.
  - `password` : chaîne d'au moins 8 caractères.
  - Requête invalide → `400 Bad Request`, email déjà pris → `409 Conflict`.
- **Réponse** : `201 Created` avec `{ id, email, createdAt }` (jamais de mot de passe renvoyé).
- **Tests** :
  - `npm run test` — inclut les tests unitaires du service (création ok, 409 si doublon, 400 si payload invalide).
  - `npm run test:e2e` — vérifie la réussite du register et la réponse épurée.
- **Bloc Postman** :
  - Nouvelle requête `Auth — Register` (POST `{{baseUrl}}/auth/register`).
  - Body JSON : `{ "email": "alice@example.com", "password": "password123" }`.
  - Attendu `201` avec `{ "id": "...", "email": "alice@example.com", "createdAt": "..." }`.
- **Vérifications manuelles recommandées** :
  - `curl -X POST {{baseUrl}}/auth/register -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"password123"}'`.
  - Requête Postman `Auth — Register`.
- **Risques sécurité résiduels** :
  - Attaques par force brute : rate-limit actif sur `/auth/*` (Fastify rate-limit).
  - Toujours éviter d'exposer le hash Argon2 en réponse ou dans les journaux.
