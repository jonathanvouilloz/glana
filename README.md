# Glana

**Swipe file intelligent pour capturer et organiser tes tweets inspirants.**

Glana est une application complète pour sauvegarder, classifier automatiquement et consulter des tweets. Elle comprend une extension Chrome, un dashboard webapp, et un serveur MCP pour Claude Desktop.

## Fonctionnalités

- **Capture rapide** : Extension Chrome pour sauvegarder des tweets en un clic
- **Classification IA** : Classification automatique par thème via Claude Haiku
- **Dashboard web** : Interface pour naviguer, rechercher et organiser tes tweets
- **Intégration Claude Desktop** : Serveur MCP pour accéder à ta bibliothèque depuis Claude
- **Recherche full-text** : Retrouve n'importe quel tweet instantanément
- **Suggestions** : Fonction "Inspire-moi" pour redécouvrir tes tweets

## Stack technique

| Technologie | Usage |
|-------------|-------|
| Next.js 14 | Framework web (App Router) |
| Vercel Postgres | Base de données |
| Drizzle ORM | ORM TypeScript |
| Tailwind CSS | Styling |
| Claude API (Haiku) | Classification automatique |
| Vercel | Déploiement |

## Structure du projet

```
glana/
├── app/                  # Next.js App Router
│   ├── api/              # Endpoints API REST
│   │   ├── tweets/       # CRUD tweets
│   │   ├── themes/       # CRUD thèmes
│   │   ├── suggestions/  # Suggestions aléatoires
│   │   └── stats/        # Statistiques
│   └── (dashboard)/      # Pages du dashboard
├── components/           # Composants React
├── db/                   # Schema Drizzle + connexion
├── lib/                  # Utils, auth, classification
├── extension/            # Extension Chrome (Manifest V3)
├── mcp-server/           # Serveur MCP pour Claude Desktop
└── docs/                 # Documentation
```

## Installation

### Prérequis

- Node.js 18+
- npm ou pnpm
- Compte Vercel (pour Postgres)
- Clé API Anthropic (pour classification)

### 1. Cloner et installer

```bash
git clone https://github.com/ton-user/glana.git
cd glana
npm install
```

### 2. Configuration des variables d'environnement

Copie le fichier d'exemple et configure tes variables :

```bash
cp .env.example .env.local
```

Variables requises :

```env
# Database (Vercel Postgres)
POSTGRES_URL="postgres://..."

# Authentication
API_KEY="glana_your_secret_key_here"

# Claude API (pour classification)
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialiser la base de données

```bash
npm run db:push
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer en production |
| `npm run lint` | Linter ESLint |
| `npm run db:push` | Synchroniser le schema avec la DB |
| `npm run db:studio` | Ouvrir Drizzle Studio |
| `npm run db:generate` | Générer les migrations |

## API Reference

Tous les endpoints nécessitent le header `Authorization: Bearer <API_KEY>`.

### Tweets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tweets` | Liste les tweets (pagination, filtres) |
| POST | `/api/tweets` | Créer un tweet |
| POST | `/api/tweets/from-url` | Créer depuis une URL Twitter |
| GET | `/api/tweets/[id]` | Détails d'un tweet |
| PATCH | `/api/tweets/[id]` | Modifier un tweet |
| DELETE | `/api/tweets/[id]` | Supprimer un tweet |

**Paramètres GET /api/tweets :**
- `search` : Recherche full-text
- `themeId` : Filtrer par thème
- `tag` : Filtrer par tag
- `favorites` : `true` pour les favoris uniquement
- `unclassified` : `true` pour les non-classifiés
- `page` : Numéro de page (défaut: 1)
- `limit` : Résultats par page (défaut: 20)

### Thèmes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/themes` | Liste les thèmes |
| POST | `/api/themes` | Créer un thème |
| PATCH | `/api/themes/[id]` | Modifier un thème |
| DELETE | `/api/themes/[id]` | Supprimer un thème |

### Autres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/suggestions` | Tweets aléatoires pour inspiration |
| GET | `/api/stats` | Statistiques de la bibliothèque |

## Extension Chrome

L'extension permet de sauvegarder des tweets directement depuis X/Twitter.

### Installation

1. Ouvre `chrome://extensions/`
2. Active le **Mode développeur**
3. Clique sur **Charger l'extension non empaquetée**
4. Sélectionne le dossier `extension/`

### Configuration

1. Clique sur l'icône Glana dans la barre Chrome
2. Entre ton API key
3. (Optionnel) Configure l'URL de l'API

### Utilisation

Sur x.com ou twitter.com, un bouton apparaît sur chaque tweet. Clique dessus pour sauvegarder et classifier automatiquement.

> Voir [`extension/README.md`](extension/README.md) pour plus de détails.

## Serveur MCP (Claude Desktop)

Le serveur MCP permet d'accéder à ta bibliothèque depuis Claude Desktop.

### Installation

```bash
cd mcp-server
npm install
npm run build
```

### Configuration Claude Desktop

Ajoute dans ton fichier de configuration Claude Desktop :

**macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux** : `~/.config/Claude/claude_desktop_config.json`
**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "glana": {
      "command": "node",
      "args": ["/chemin/absolu/vers/glana/mcp-server/dist/index.js"],
      "env": {
        "GLANA_API_URL": "https://glana.ai",
        "GLANA_API_KEY": "ta-clé-api"
      }
    }
  }
}
```

### Outils disponibles

- `search_tweets` : Rechercher dans les tweets
- `get_suggestions` : Obtenir des suggestions aléatoires
- `list_themes` : Lister les thèmes
- `get_stats` : Statistiques de la bibliothèque

> Voir [`mcp-server/README.md`](mcp-server/README.md) pour plus de détails.

## Déploiement

### Vercel (recommandé)

1. Connecte ton repo GitHub à Vercel
2. Configure les variables d'environnement
3. Déploie

### Variables de production

```env
POSTGRES_URL="postgres://..."
API_KEY="glana_production_key"
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_APP_URL="https://glana.ai"
```

## Schéma de données

### Tweet

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| tweetId | string | ID Twitter du tweet |
| tweetUrl | string | URL du tweet |
| authorUsername | string | @handle de l'auteur |
| authorDisplayName | string | Nom affiché |
| content | string | Contenu du tweet |
| themeId | UUID | Thème assigné |
| tags | string[] | Tags |
| aiAnalysis | object | Analyse IA (thème suggéré, tags, hook, ton) |
| isClassified | boolean | A été classifié |
| isFavorite | boolean | Marqué comme favori |
| capturedAt | timestamp | Date de capture |

### Thème

| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | Identifiant unique |
| name | string | Nom du thème |
| description | string | Description |
| color | string | Couleur hex |

## Licence

Projet privé - Tous droits réservés.

---

Développé par [Jon Labs](https://jonlabs.com)
