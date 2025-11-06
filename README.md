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
- [Étape 8 — Posts: Keyset pagination](#étape-8--posts-keyset-pagination)
- [Étape 7 — Posts: Feed scopes](#étape-7--posts-feed-scopes)
- [Étape 6 — Posts: Like](#étape-6--posts-like)
- [Étape 5 — Posts: List](#étape-5--posts-list)
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
- Étape 8 — Posts: Keyset pagination
- Étape 7 — Posts: Feed scopes
- Étape 6 — Posts: Like
- Étape 5 — Posts: List
- Étape 4 — Posts: Create
- Étape 3 — Auth: Login
- Étape 2 — Auth: Register
- Étape 1 — Smoke test (GET /)
- Étape 0 — Mise en place de la base documentaire

## Étape 7 — Posts: Feed scopes
- **Objectif** : unifier les réponses de collection et introduire trois vues de feed protégées par JWT (`Authorization: Bearer <token>`).

### Conventions REST retenues
- Ressources au pluriel, pas de verbes dans les URI, sous-ressource stable `GET /users/:userId/posts`.
- Réponses de collection uniformisées : `{ "data": [...], "nextCursor": null }` (le cursor enrichi `{ createdAt, id }` arrivera à l'étape 8).
- Codes HTTP : `200 OK` sur une collection vide, `401 Unauthorized` si le token est absent/invalidé, `400 Bad Request` pour des paramètres rejetés (scope inconnu, limite hors bornes, userId invalide, etc.).

### Vues de feed documentées
- **Global** (`GET /posts?scope=global`) : renvoie les posts publics récents de tous les utilisateurs. `scope` est optionnel et vaut `global` par défaut afin de garantir la compatibilité ascendante.
- **Mes posts** (`GET /posts?scope=me`) : renvoie uniquement les posts de l'auteur correspondant au JWT (`req.user.sub`).
- **Posts d’un user** (`GET /users/:userId/posts`) : sous-ressource REST pour consulter les posts d'un utilisateur précis, même si ce n'est pas l'utilisateur courant.

### Pagination & limites
- Les paramètres `limit` (défaut 10, maximum 100) et `cursor` sont disponibles sur les trois endpoints. La structure `{ data, nextCursor }` est prête pour l'implémentation du keyset (étape 8).
- Les identifiants `userId` suivent le format CUID (`c[a-z0-9]{24}`) ; un identifiant valide sans post renvoie `200` avec `data: []`.

### Compatibilité future
- Le paramètre `scope` est extensible (`global`, `me`, ...). L'ajout de nouvelles valeurs (ex: `following`, `recommended`) ne cassera pas les clients existants.

### Postman — requêtes
- Ajouter dans la collection trois requêtes GET héritant de l'en-tête `Authorization: Bearer {{token}}` :
  - `Posts — List (global)` → `GET {{baseUrl}}/posts?scope=global&limit={{limit}}`
  - `Posts — List (me)` → `GET {{baseUrl}}/posts?scope=me&limit={{limit}}`
  - `Users — Posts (by userId)` → `GET {{baseUrl}}/users/{{targetUserId}}/posts?limit={{limit}}`
- Scripts de test Postman (pour les trois) :
  ```javascript
  pm.test('Status 200', () => pm.response.code === 200);
  const json = pm.response.json();
  pm.test('Response shape', () => {
    pm.expect(json).to.have.property('data').that.is.an('array');
    pm.expect(json).to.have.property('nextCursor');
  });
  ```
- Variables d’environnement nécessaires : `limit` (ex: `2`) et `targetUserId` (à renseigner manuellement).

### Exemples cURL
```bash
curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/posts?scope=global&limit=2"
curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/posts?scope=me&limit=2"
curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/users/<USER_ID>/posts?limit=2"
```

## Étape 8 — Posts: Keyset pagination
- **Objectif** : garantir un scroll infini sans doublon en ordonnant les posts par `createdAt DESC, id DESC` et en utilisant un curseur composite `{ createdAt, id }`.
- **Pourquoi ce couple est unique** : deux posts peuvent partager la même seconde de création mais pas la même paire `(createdAt, id)` ; la contrainte `@@unique([createdAt, id], name: "createdAt_id")` impose un ordre strictement décroissant et stable, même si de nouveaux posts apparaissent entre deux requêtes.
- **Format du cursor** : l'API retourne un objet JSON `{ "createdAt": "<ISO-8601>", "id": "<cuid>" }`. Pour charger la page suivante, transmettez ce JSON stringifié dans le paramètre `cursor`.
- **Exemple encodé** : `GET /posts?limit=2&cursor=%7B%22createdAt%22%3A%222024-05-01T11%3A00%3A00.000Z%22%2C%22id%22%3A%22clx123example%22%7D`.
- **Réponse standardisée** : `{ "data": [...], "nextCursor": { createdAt, id } | null }`. Lorsque `nextCursor` vaut `null`, il n'y a plus de page suivante.
- **Migrations & génération Prisma** : appliquez la migration avec `npx prisma migrate deploy` (ou `npx prisma migrate dev`) puis exécutez `npx prisma generate` pour rafraîchir le client Prisma. Sans cette étape, TypeScript n'a pas accès à la clé composite `createdAt_id` utilisée par la pagination.

## Étape 6 — Posts: Like
- **Objectif** : exposer l'endpoint `POST /posts/{postId}/like` pour ajouter un like authentifié et renvoyer le compteur associé.
- **Sécurité** : authentification JWT obligatoire (`Authorization: Bearer <token>`). Un utilisateur ne peut liker un même post qu'une seule fois ; les appels répétés renvoient le même compteur.
- **Réponses attendues** :
  - `404 Not Found` si le post n'existe pas.
  - `200 OK` avec `{ "likes": <number> }` après l'opération. La première requête incrémente le compteur, les suivantes renvoient le compteur inchangé.
- **Tests** :
  ```bash
  npm run test:e2e -- posts.e2e-spec.ts
  ```
- **Postman** : nouvelle requête `Posts — Like` (`POST {{baseUrl}}/posts/{{postId}}/like`) avec l'en-tête `Authorization: Bearer {{token}}`. Le test peut être enchaîné après `Posts — Create` en réutilisant la variable `{{postId}}`.
- **Vérifications manuelles** :
  - `curl -X POST "{{baseUrl}}/posts/<postId>/like" -H "Authorization: Bearer <token>"`
  - Enchaîner les requêtes Postman `Posts — Create` puis `Posts — Like` pour confirmer l'idempotence.
- **Risques sécurité résiduels** : l'endpoint dépend d'une authentification stricte et les messages d'erreur restent volontairement succincts pour ne pas divulguer d'information inutile.

## Étape 5 — Posts: List
- **Objectif** : exposer l'endpoint `GET /posts` avec une pagination `cursor`/`limit` ordonnée par `createdAt DESC`, renvoyant `{ data, nextCursor }`.
- **Query params** :
  - `limit` *(optionnel, défaut = 10)* : nombre maximum d'éléments renvoyés. Doit être un entier ≥ 1.
  - `cursor` *(optionnel)* : identifiant du dernier post récupéré. Permet de charger la page suivante.
- **Réponse attendue (200)** :
  ```json
  {
    "data": [
      {
        "id": "...",
        "content": "...",
        "createdAt": "2024-04-01T08:00:00.000Z",
        "author": {
          "id": "...",
          "email": "author@example.com"
        },
        "_count": {
          "likes": 2
        }
      }
    ],
    "nextCursor": "cmhxxxxxxxxxxxxx" // null s'il n'y a plus de page
  }
  ```
- **Tests** :
  ```bash
  npm run test:e2e -- posts.e2e-spec.ts
  ```
  Les seeds vérifient que la limite est respectée, que l'ordre `createdAt DESC` est conservé et que `nextCursor` est présent lorsqu'une page suivante existe.
- **Postman** : nouvelles requêtes
  - `Posts — List (page 1)` (`GET {{baseUrl}}/posts?limit=2`) avec un script de test `pm.environment.set("nextCursor", json.nextCursor);`.
  - `Posts — List (page 2)` (`GET {{baseUrl}}/posts?limit=2&cursor={{nextCursor}}`).
- **Vérifications manuelles** :
  - `curl "{{baseUrl}}/posts?limit=5"`
  - Enchaîner les requêtes Postman `Posts — List (page 1)` puis `Posts — List (page 2)` pour valider la pagination.
- **Risques sécurité résiduels** : veiller à ne pas exposer de données sensibles dans l'objet `author` (limité à `{ id, email }`) et surveiller les limites de pagination pour éviter les abus.

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

## Étape 9 — Auth obligatoire pour la lecture des posts

- **Résumé** : Tous les endpoints de lecture de posts nécessitent `Authorization: Bearer {{token}}`.
- **Usage** :
  - Exécuter « Auth — Login » dans Postman pour hydrater `{{token}}`.
  - Utiliser « Posts — List (global/me) » et « Users — Posts (by userId) » (héritent du header Bearer).
  - Exemples `curl` :
    ```bash
    curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/posts?scope=global&limit=2"
    curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/posts?scope=me&limit=2"
    curl -H "Authorization: Bearer $TOKEN" "{{baseUrl}}/users/<USER_ID>/posts?limit=2"
    ```
- **Notes sécurité** :
  - `401 Unauthorized` si le header `Authorization` est absent ou invalide.
  - Aucune information sensible n'est exposée dans les messages d'erreur.
  - Prépare l'évolution vers un feed personnalisé par utilisateur.


## Étape 10 — Tests Postman automatisés (Newman) & CI

![Postman E2E](https://github.com/<ORG_OR_USER>/<REPO>/actions/workflows/postman.yml/badge.svg)

### Local
- Démarrer manuellement l'API puis exécuter la collection :
  ```bash
  npm run postman:run
  ```
- OU lancer l'enchaînement complet (démarrage de l'app, attente de `http://127.0.0.1:3000`, exécution Newman) :
  ```bash
  npm run ci:e2e
  ```

### CI
- Le workflow **Postman E2E** s'exécute automatiquement sur chaque `push`/`pull_request` vers `main`.
- Les rapports JUnit sont publiés en tant qu'artifact (`newman-report.xml`).
- Définir `JWT_SECRET` dans **Settings → Secrets and variables → Actions → Repository secrets** afin que le workflow puisse authentifier les requêtes.

### Notes
- SQLite : la migration génère `dev.db` directement sur le runner GitHub Actions.
- Passage à PostgreSQL : adapter `DATABASE_URL` et déclarer un service `postgres` dans le workflow.

### Dépannage
- **DATABASE_URL manquant** : s'assurer que la variable est définie dans le job ou qu'un fichier `.env` est chargé via `@nestjs/config`.
- **Token Postman vide** : lancer d'abord la requête `Auth — Login` (un test de la collection hydrate `{{token}}`).

### Collection Postman — exigences d’assertions
- `Auth — Register` : vérifie le `201`, la présence de `{ id, email, createdAt }` et l'absence du champ `password`.
- `Auth — Login` : attend un `200`, vérifie la présence de `access_token` et renseigne `{{token}}`.
- `Posts — Create` : attend un `201` et stocke `{{postId}}`.
- `Posts — List (Page 1)` : attend un `200`, enregistre `{{page1Ids}}` et `{{nextCursor}}`.
- `Posts — Insert between pages` : ajoute un post intermédiaire pour tester l'absence de doublons.
- `Posts — List (NextPage)` : attend un `200`, vérifie l'absence de doublons avec `page1Ids` et met à jour `{{nextCursor}}`.
- `Posts — Like` : attend un `200` et vérifie qu'un re-like ne modifie pas le compteur.
- Toutes les requêtes de lecture (`/posts`, `/users/:userId/posts`) héritent de l'en-tête `Authorization: Bearer {{token}}` défini au niveau de la collection.
