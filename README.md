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
- [Étape 4 — Posts: Create](#étape-4--posts-create)
- [Étape 3 — Auth: Login](#étape-3--auth-login)
- [Étape 2 — Auth: Register](#étape-2--auth-register)
- [Étape 0 — Mise en place de la base documentaire](#étape-0--mise-en-place-de-la-base-documentaire)
- [Étape 1 — Smoke test (GET /)](#étape-1--smoke-test-get-)

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
- Étape 4 — Posts: Create
- Étape 3 — Auth: Login
- Étape 2 — Auth: Register
- Étape 1 — Smoke test (GET /)
- Étape 0 — Mise en place de la base documentaire

## Étape 3 — Auth: Login
- **Objectif** : exposer l'endpoint `POST /auth/login` qui renvoie un JWT signé (`{ "access_token": "..." }`) contenant le payload `{ sub, email }` et dont la durée de validité dépend des variables d'environnement `JWT_SECRET` et `JWT_EXPIRES_IN`.
- **Validation** : mêmes règles que pour l'inscription (`email` valide, `password` ≥ 8 caractères). Une combinaison invalide d'identifiants renvoie `401 Unauthorized`.
- **Réponse attendue (200)** : `{ "access_token": "eyJhbGci..." }`.
- **Tests** :
  - Unitaires (`AuthService`) :
    ```bash
    npm run test -- auth/auth.service.spec.ts
    ```
  - End-to-end :
    ```bash
    npm run test:e2e -- auth.e2e-spec.ts
    ```
- **Postman** : nouvelle requête `Auth — Login` (`POST {{baseUrl}}/auth/login`) avec body JSON `{ "email": "alice@example.com", "password": "password123" }`. Le script de test enregistre automatiquement `pm.environment.set("token", json.access_token);` afin d'alimenter la variable `{{token}}`.
- **Vérifications manuelles** :
  - `curl -X POST {{baseUrl}}/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"password123"}'`
  - Requête Postman `Auth — Login` (vérifier que la variable d'environnement `token` est remplie après l'exécution).
- **Risques sécurité résiduels** : utiliser un `JWT_SECRET` robuste (hors code source) et surveiller la durée de vie des tokens (`JWT_EXPIRES_IN`) pour éviter une expiration trop courte en production.

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

## Étape 1 — Smoke test (GET /)
- **Objectif** : mettre en place la base des tests e2e (Jest + adaptateur Fastify) et exposer un endpoint racine renvoyant `{ "status": "ok" }`.
- **Fichiers modifiés/ajoutés** :
  - `src/app.controller.ts`, `src/app.service.ts`, `src/app.controller.spec.ts`
  - `test/jest-e2e.json`, `test/app.e2e-spec.ts`
  - `postman/SocialPOC.postman_collection.json`, `postman/SocialPOC.local.postman_environment.json`
- **Comment lancer le smoke test** :
  ```bash
  npm run test:e2e
  ```
- **Bloc Postman** :
  - Requête `Smoke — GET /` : `GET {{baseUrl}}/`
  - Réponse attendue : `{"status":"ok"}`
  - Procédure : ré-importer ou mettre à jour `postman/SocialPOC.postman_collection.json` et `postman/SocialPOC.local.postman_environment.json` pour récupérer la requête.
- **Vérifications manuelles** :
  - `curl http://localhost:3000/`
  - Requête Postman `Smoke — GET /`
- **Risques sécurité résiduels** : minimes (endpoint public), vérifier que `helmet` et la limitation de débit (`rate-limit`) restent activés via `main.ts`.

## Étape 2 — Auth: Register
- **Objectif** : exposer l'endpoint `POST /auth/register` permettant de créer un compte utilisateur à partir d'un couple `{ email, password }`.
- **Règles de validation** :
  - `email` doit être une adresse valide et unique (conflit → `409 Conflict`).
  - `password` doit contenir au moins 8 caractères.
  - Les mots de passe sont hachés via Argon2 avant stockage et ne sont jamais renvoyés en réponse ou loggés.
  - Les contrôles de validation lèvent une `400 Bad Request` en cas de payload invalide.
- **Réponse attendue (201)** : `{ "id": "...", "email": "alice@example.com", "createdAt": "..." }`.
- **Limitation de débit** : le plugin Fastify `@fastify/rate-limit` est toujours actif (config globale) et protège l'ensemble des routes, y compris `/auth/*`, contre la force brute.
- **Tests** :
  - Unitaires (`AuthService`) :
    ```bash
    npm run test -- auth/auth.service.spec.ts
    ```
  - End-to-end :
    ```bash
    npm run test:e2e -- auth.e2e-spec.ts
    ```
- **Vérifications manuelles** :
  - `curl -X POST {{baseUrl}}/auth/register -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"password123"}'`
  - Requête Postman `Auth — Register` (voir collection mise à jour).
- **Postman** : nouvelle requête `Auth — Register` (`POST {{baseUrl}}/auth/register`) avec body JSON `{ "email": "alice@example.com", "password": "password123" }`. La réponse attendue est le payload utilisateur sans mot de passe.
- **Risques sécurité résiduels** : surveiller les tentatives de brute force (limitation de débit déjà en place), garantir le stockage chiffré des secrets Prisma (`DATABASE_URL`) et vérifier que seuls les champs autorisés sont renvoyés côté API.
## Étape 4 — Posts: Create
- **Objectif** : permettre à un utilisateur authentifié de créer un post via `POST /posts` en fournissant un contenu non vide.
- **Sécurité** : l'en-tête `Authorization: Bearer {{token}}` est obligatoire (token issu de `/auth/login`). Une absence de token déclenche `401 Unauthorized`.
- **Payload attendu** : `{ "content": "Votre message" }`.
- **Réponse attendue (201)** : `{ "id": "...", "content": "Votre message", "createdAt": "...", "author": { "id": "...", "email": "alice@example.com" } }`.
- **Tests** :
  - Unitaire (validation DTO) :
    ```bash
    npm run test -- posts/dto/create-post.dto.spec.ts
    ```
  - End-to-end :
    ```bash
    npm run test:e2e -- posts.e2e-spec.ts
    ```
- **Postman** : nouvelle requête `Posts — Create` (`POST {{baseUrl}}/posts`) avec body JSON `{ "content": "Hello world" }`, en-tête `Authorization: Bearer {{token}}` et script de test enregistrant l'identifiant du post :
  ```javascript
  const json = pm.response.json();
  pm.environment.set("postId", json.id);
  ```
- **Vérifications manuelles** :
  - `curl -X POST {{baseUrl}}/posts -H 'Authorization: Bearer {{token}}' -H 'Content-Type: application/json' -d '{"content":"Hello world"}'`
  - Exécuter la requête Postman `Posts — Create` après authentification.
- **Risques sécurité résiduels** : conserver les mots de passe des utilisateurs hors de toute réponse API (seules les informations publiques de l'auteur sont renvoyées) et veiller à la confidentialité du token JWT.

