# CODE DESK — ms-auth (Authentication Microservice)

Bienvenue sur le microservice d'authentification de la plateforme CODE DESK.
Ce projet est construit avec **NestJS** et **MongoDB**, et expose une API robuste pour l'authentification (JWT), la gestion des utilisateurs, et le contrôle d'accès basé sur les rôles (RBAC).

## 🗄️ Connexion à MongoDB (avec MongoDB Compass)

Chaque développeur doit avoir MongoDB installé localement sur sa machine.

### Option A — MongoDB local (recommandé pour le développement)

1. **Télécharger MongoDB Community Server** : https://www.mongodb.com/try/download/community
2. **Télécharger MongoDB Compass** (interface graphique) : https://www.mongodb.com/try/download/compass
3. Ouvrir MongoDB Compass et se connecter avec l'URI par défaut :
   ```
   mongodb://localhost:27017
   ```
4. La base de données **`ms_auth_dev`** sera créée automatiquement au premier lancement du projet.

### Option B — MongoDB Atlas (cloud gratuit)

1. Créer un compte gratuit sur https://www.mongodb.com/atlas
2. Créer un cluster **Free Tier (M0)**
3. Dans "Database Access", créer un utilisateur avec mot de passe
4. Dans "Network Access", ajouter `0.0.0.0/0` pour autoriser toutes les IPs
5. Copier l'URI de connexion (format : `mongodb+srv://user:password@cluster.mongodb.net/ms_auth_dev`)
6. Coller cet URI dans votre fichier `.env` à la variable `MONGODB_URI`

### Vérification de la connexion

Une fois le serveur lancé (`npm run start:dev`), vous devez voir dans le terminal :
```
✅ MongoDB connected successfully
```
Si vous voyez `❌ MongoDB connection error`, vérifiez que MongoDB tourne bien sur votre machine
ou que votre URI Atlas est correctement configurée dans le fichier `.env`.

---

## 🚀 Installation & Démarrage

### 1. Prérequis
- Node.js (v20+)
- MongoDB local **ou** un compte MongoDB Atlas (gratuit)

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
