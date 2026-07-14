# CODE DESK — ms-auth (Authentication Microservice)

Bienvenue sur le microservice d'authentification de la plateforme CODE DESK.
Ce projet est construit avec **NestJS** et **MongoDB**, et expose une API robuste pour l'authentification (JWT), la gestion des utilisateurs, et le contrôle d'accès basé sur les rôles (RBAC).

## 🚀 Installation & Démarrage

### 1. Prérequis
- Node.js (v20+)
- Une base de données MongoDB (locale via MongoDB Compass ou Atlas)

### 2. Variables d'environnement
Avant de lancer le projet, configurez vos variables d'environnement.
Copiez le fichier d'exemple et remplissez-le si nécessaire :
```bash
cp .env.example .env
```
*(Par défaut, la configuration pointe vers `mongodb://localhost:27017/ms_auth_dev`)*

### 3. Installation des dépendances
```bash
npm install
```

### 4. Initialisation de la Base de Données (Seed)
Pour tester l'API immédiatement, vous pouvez générer les permissions, les rôles (ex: `super_admin`) et un utilisateur par défaut :
```bash
npm run seed
```
> **Compte Admin généré :**
> - **Email** : `admin@codedesk.local`
> - **Mot de passe** : `Admin@CodeDesk2024!`

### 5. Démarrer le serveur
Mode développement avec rechargement automatique :
```bash
npm run start:dev
```

---

## 📚 Documentation API (Swagger)

Une fois le serveur lancé, vous pouvez consulter et tester la documentation interactive de l'API via Swagger à cette adresse :
👉 **http://localhost:3001/api/docs**

---

## 🏗️ Architecture du code

Le code source (`src/`) est organisé en modules :
- `auth/` : Logique d'authentification (Login, Register, Refresh Tokens, Stratégies JWT/Local).
- `users/` : CRUD et gestion des données utilisateurs.
- `roles/` : Gestion des rôles (Admin, Professeur, Membre, etc.).
- `permissions/` : Liste des actions réalisables sur les différents modules.
- `common/` : Contient les Guards (`JwtAuthGuard`, `RolesGuard`), Intercepteurs et Décorateurs custom.
- `database/` : Connexion Mongoose et scripts de seed.
- `config/` : Configuration centralisée et fortement typée via `class-validator`.

Bon dev ! 💻
