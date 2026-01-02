# PRD: Swipe File X

## 📋 Document Info

| Champ | Valeur |
|-------|--------|
| Projet | Swipe File X |
| Version | 1.0.0 MVP |
| Auteur | Jonathan Vouilloz (Jon Labs) |
| Date | Janvier 2025 |
| Destinataire | Claude Code |

---

## 🎯 Vision Produit

### Problème
En tant que créateur de contenu sur X/Twitter, je veux sauvegarder des tweets inspirants que je trouve en scrollant, les organiser par thème, et pouvoir les consulter plus tard pour m'inspirer quand je crée du contenu.

### Solution
Une application composée de :
1. **Extension Chrome** : Bouton injecté sur chaque tweet pour sauvegarder en 1 clic
2. **Raccourci iOS** : Share sheet pour capturer depuis mobile (2-3 taps)
3. **API Backend** : Stockage, classification IA automatique, gestion des thèmes
4. **Webapp Dashboard** : Consultation, exploration par thème, suggestions
5. **MCP Server** : Intégration Claude pour requêter la bibliothèque

### Utilisateur
Un seul utilisateur (Jonathan) - pas d'authentification complexe, juste une API key.

---

## 🏗️ Architecture Technique

### Stack

| Composant | Technologie | Raison |
|-----------|-------------|--------|
| API | Next.js API Routes | Déploiement Vercel simplifié |
| Database | Vercel Postgres | Intégré Vercel, gratuit tier |
| ORM | Drizzle | Léger, type-safe |
| Frontend | Next.js (App Router) | Même projet que l'API |
| Extension | Vanilla JS + Manifest V3 | Léger, pas de build |
| Classification | Claude API (Haiku) | Rapide, économique |
| MCP Server | Node.js standalone | Séparé pour Claude Desktop |

### Diagramme

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js App                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ API Routes  │  │  Dashboard  │  │  Landing Page   │  │    │
│  │  │ /api/*      │  │  /dashboard │  │  /              │  │    │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘  │    │
│  │         │                                                │    │
│  │         ▼                                                │    │
│  │  ┌─────────────┐                                         │    │
│  │  │  Drizzle    │                                         │    │
│  │  └──────┬──────┘                                         │    │
│  └─────────┼────────────────────────────────────────────────┘    │
│            ▼                                                      │
│  ┌─────────────────┐                                             │
│  │ Vercel Postgres │                                             │
│  └─────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘

        ▲                    ▲                      ▲
        │                    │                      │
        │ POST /api/tweets   │ GET /api/tweets      │ MCP Protocol
        │                    │                      │
┌───────┴───────┐  ┌─────────┴─────────┐  ┌────────┴────────┐
│ Extension     │  │ iOS Shortcut      │  │ MCP Server      │
│ Chrome        │  │ (Share Sheet)     │  │ (Local Node.js) │
└───────────────┘  └───────────────────┘  └─────────────────┘

        │
        ▼
┌─────────────────┐
│ Claude API      │
│ (Classification)│
└─────────────────┘
```

---

## 💾 Base de Données

### Schema Drizzle (PostgreSQL)

```typescript
// db/schema.ts

import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

export const themes = pgTable('themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color').default('#6366f1'), // Couleur pour UI
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tweets = pgTable('tweets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tweetId: text('tweet_id').notNull().unique(), // ID Twitter original
  tweetUrl: text('tweet_url').notNull(),
  authorUsername: text('author_username').notNull(),
  authorDisplayName: text('author_display_name'),
  content: text('content').notNull(), // Texte du tweet
  themeId: uuid('theme_id').references(() => themes.id),
  tags: jsonb('tags').$type<string[]>().default([]),
  aiAnalysis: jsonb('ai_analysis').$type<{
    suggestedTheme: string;
    suggestedTags: string[];
    hookType: string | null; // "question", "statement", "story", "statistic", etc.
    tone: string | null; // "inspirational", "educational", "controversial", etc.
    summary: string;
  }>(),
  isClassified: boolean('is_classified').default(false),
  isFavorite: boolean('is_favorite').default(false),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Index pour recherche full-text
// CREATE INDEX tweets_content_idx ON tweets USING gin(to_tsvector('french', content));
```

### Migrations

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
```

---

## 🔌 API Endpoints

### Configuration

```typescript
// lib/auth.ts
const API_KEY = process.env.API_KEY; // Clé unique pour Jonathan

export function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === API_KEY;
}
```

### Endpoints

#### `POST /api/tweets`
Ajouter un nouveau tweet à la bibliothèque.

**Request:**
```typescript
{
  tweetUrl: string;      // URL complète du tweet
  content: string;       // Texte du tweet (extrait par l'extension)
  authorUsername: string;
  authorDisplayName?: string;
}
```

**Response:**
```typescript
{
  success: true;
  tweet: {
    id: string;
    tweetId: string;
    content: string;
    themeId: string | null;
    tags: string[];
    isClassified: boolean;
  };
}
```

**Logique:**
1. Valider API key
2. Extraire tweetId depuis l'URL (regex: `/status\/(\d+)/)
3. Vérifier si tweet déjà existant (upsert)
4. Insérer en DB avec `isClassified: false`
5. Déclencher classification async (voir section Classification)
6. Retourner le tweet créé

---

#### `GET /api/tweets`
Lister les tweets avec filtres.

**Query params:**
```
?themeId=uuid          // Filtrer par thème
?tag=string            // Filtrer par tag
?search=string         // Recherche full-text dans content
?favorites=true        // Seulement les favoris
?unclassified=true     // Seulement les non-classifiés
?limit=20              // Pagination (default 20, max 100)
?offset=0              // Pagination offset
```

**Response:**
```typescript
{
  tweets: Tweet[];
  total: number;
  hasMore: boolean;
}
```

---

#### `GET /api/tweets/:id`
Détail d'un tweet.

---

#### `PATCH /api/tweets/:id`
Modifier un tweet (thème, tags, favori).

**Request:**
```typescript
{
  themeId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
}
```

---

#### `DELETE /api/tweets/:id`
Supprimer un tweet.

---

#### `GET /api/themes`
Lister tous les thèmes.

**Response:**
```typescript
{
  themes: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    tweetCount: number; // Nombre de tweets dans ce thème
  }[];
}
```

---

#### `POST /api/themes`
Créer un nouveau thème.

**Request:**
```typescript
{
  name: string;
  description?: string;
  color?: string;
}
```

---

#### `PATCH /api/themes/:id`
Modifier un thème.

---

#### `DELETE /api/themes/:id`
Supprimer un thème (les tweets associés passent à `themeId: null`).

---

#### `POST /api/tweets/:id/classify`
Forcer la re-classification d'un tweet.

---

#### `GET /api/suggestions`
Obtenir des suggestions d'inspiration.

**Query params:**
```
?themeId=uuid          // Suggestions pour ce thème
?count=5               // Nombre de suggestions (default 5)
?excludeIds=id1,id2    // Exclure ces tweets
```

**Logique:**
1. Si themeId fourni, prendre des tweets random de ce thème
2. Sinon, sélection diversifiée (1-2 par thème)
3. Prioriser les tweets avec `isFavorite: true`

---

#### `GET /api/stats`
Statistiques de la bibliothèque.

**Response:**
```typescript
{
  totalTweets: number;
  totalThemes: number;
  tweetsPerTheme: { themeId: string; themeName: string; count: number }[];
  topTags: { tag: string; count: number }[];
  lastCaptured: string; // ISO date
  unclassifiedCount: number;
}
```

---

## 🤖 Classification IA

### Prompt System

```typescript
// lib/classification.ts

const CLASSIFICATION_PROMPT = `Tu es un assistant qui analyse des tweets pour une bibliothèque de "swipe file" (collection d'inspirations pour créateur de contenu).

THÈMES DISPONIBLES:
{themes}

TWEET À ANALYSER:
"{content}"

Analyse ce tweet et retourne un JSON avec:
1. suggestedTheme: Le nom du thème le plus approprié parmi ceux disponibles, OU un nouveau thème suggéré si aucun ne correspond (max 3 mots)
2. suggestedTags: 2-5 tags descriptifs (en français, lowercase, sans #)
3. hookType: Le type d'accroche utilisé parmi: "question", "statement", "story", "statistic", "controversial", "how-to", "list", "personal", "other"
4. tone: Le ton général parmi: "inspirational", "educational", "humorous", "controversial", "personal", "professional", "provocative"
5. summary: Résumé en 1 phrase de pourquoi ce tweet est inspirant/utile

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`;

export async function classifyTweet(content: string, existingThemes: string[]): Promise<ClassificationResult> {
  const themesText = existingThemes.length > 0 
    ? existingThemes.join(', ')
    : 'Aucun thème existant - suggère-en un nouveau';
    
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: CLASSIFICATION_PROMPT
        .replace('{themes}', themesText)
        .replace('{content}', content)
    }]
  });
  
  return JSON.parse(response.content[0].text);
}
```

### Workflow de classification

```typescript
// Appelé après création d'un tweet (async, non-bloquant)
export async function classifyAndUpdateTweet(tweetId: string) {
  const tweet = await db.query.tweets.findFirst({ where: eq(tweets.id, tweetId) });
  if (!tweet || tweet.isClassified) return;
  
  const existingThemes = await db.query.themes.findMany();
  const themeNames = existingThemes.map(t => t.name);
  
  const analysis = await classifyTweet(tweet.content, themeNames);
  
  // Trouver ou créer le thème
  let themeId: string | null = null;
  const matchingTheme = existingThemes.find(
    t => t.name.toLowerCase() === analysis.suggestedTheme.toLowerCase()
  );
  
  if (matchingTheme) {
    themeId = matchingTheme.id;
  } else if (analysis.suggestedTheme) {
    // Créer le nouveau thème suggéré
    const [newTheme] = await db.insert(themes).values({
      name: analysis.suggestedTheme,
      description: `Thème auto-créé pour: ${analysis.summary}`,
    }).returning();
    themeId = newTheme.id;
  }
  
  // Mettre à jour le tweet
  await db.update(tweets)
    .set({
      themeId,
      tags: analysis.suggestedTags,
      aiAnalysis: analysis,
      isClassified: true,
      updatedAt: new Date(),
    })
    .where(eq(tweets.id, tweetId));
}
```

---

## 🧩 Extension Chrome

### Structure

```
extension/
├── manifest.json
├── content.js          # Injecte le bouton sur X.com
├── background.js       # Service worker pour les requêtes API
├── popup.html          # Popup de l'extension
├── popup.js            # Logique du popup
├── styles.css          # Styles du bouton injecté
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Swipe File X",
  "version": "1.0.0",
  "description": "Sauvegarde tes tweets préférés dans ta bibliothèque d'inspiration",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://x.com/*", "https://twitter.com/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://x.com/*", "https://twitter.com/*"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### content.js

```javascript
// Configuration
const API_URL = 'https://swipe-file-x.vercel.app/api';
let API_KEY = '';

// Charger l'API key depuis le storage
chrome.storage.sync.get(['apiKey'], (result) => {
  API_KEY = result.apiKey || '';
});

// Observer pour détecter les nouveaux tweets chargés
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        injectButtons(node);
      }
    });
  });
});

// Démarrer l'observation
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Injection initiale
injectButtons(document.body);

function injectButtons(root) {
  // Sélecteur pour les tweets (article avec data-testid="tweet")
  const tweets = root.querySelectorAll('article[data-testid="tweet"]');
  
  tweets.forEach((tweet) => {
    // Éviter double injection
    if (tweet.querySelector('.swipefile-btn')) return;
    
    // Trouver le groupe d'actions (like, retweet, etc.)
    const actionBar = tweet.querySelector('[role="group"]');
    if (!actionBar) return;
    
    // Créer le bouton
    const btn = document.createElement('button');
    btn.className = 'swipefile-btn';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    btn.title = 'Sauvegarder dans Swipe File';
    
    // Event listener
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!API_KEY) {
        alert('Configure ton API key dans l\'extension Swipe File X');
        return;
      }
      
      const tweetData = extractTweetData(tweet);
      if (!tweetData) {
        alert('Impossible d\'extraire les données du tweet');
        return;
      }
      
      btn.classList.add('loading');
      
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'saveTweet',
          data: tweetData
        });
        
        if (response.success) {
          btn.classList.remove('loading');
          btn.classList.add('saved');
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          `;
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        btn.classList.remove('loading');
        btn.classList.add('error');
        console.error('Swipe File X Error:', error);
        setTimeout(() => btn.classList.remove('error'), 2000);
      }
    });
    
    // Insérer le bouton
    actionBar.appendChild(btn);
  });
}

function extractTweetData(tweetElement) {
  try {
    // Extraire l'URL du tweet
    const timeElement = tweetElement.querySelector('time');
    const linkElement = timeElement?.closest('a');
    const tweetUrl = linkElement?.href;
    
    if (!tweetUrl || !tweetUrl.includes('/status/')) return null;
    
    // Extraire le contenu textuel
    const contentDiv = tweetElement.querySelector('[data-testid="tweetText"]');
    const content = contentDiv?.innerText || '';
    
    if (!content.trim()) return null;
    
    // Extraire l'auteur
    const userLinks = tweetElement.querySelectorAll('a[href^="/"]');
    let authorUsername = '';
    let authorDisplayName = '';
    
    for (const link of userLinks) {
      const href = link.getAttribute('href');
      if (href && href.match(/^\/[^\/]+$/) && !href.includes('/status/')) {
        authorUsername = href.slice(1);
        // Le display name est souvent dans un span à côté
        const parentDiv = link.closest('[data-testid="User-Name"]');
        if (parentDiv) {
          const spans = parentDiv.querySelectorAll('span');
          for (const span of spans) {
            if (span.innerText && !span.innerText.startsWith('@')) {
              authorDisplayName = span.innerText;
              break;
            }
          }
        }
        break;
      }
    }
    
    return {
      tweetUrl,
      content,
      authorUsername,
      authorDisplayName
    };
  } catch (error) {
    console.error('Error extracting tweet data:', error);
    return null;
  }
}
```

### styles.css

```css
.swipefile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: rgb(113, 118, 123);
  transition: all 0.2s ease;
  margin-left: 4px;
}

.swipefile-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: rgb(99, 102, 241);
}

.swipefile-btn.loading {
  opacity: 0.5;
  pointer-events: none;
}

.swipefile-btn.saved {
  color: rgb(99, 102, 241);
}

.swipefile-btn.error {
  color: rgb(244, 63, 94);
}

.swipefile-btn svg {
  width: 18px;
  height: 18px;
}
```

### background.js

```javascript
// Service worker pour gérer les requêtes API

const API_URL = 'https://swipe-file-x.vercel.app/api';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveTweet') {
    handleSaveTweet(request.data)
      .then(sendResponse)
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Indique une réponse async
  }
});

async function handleSaveTweet(tweetData) {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);
  
  if (!apiKey) {
    throw new Error('API key non configurée');
  }
  
  const response = await fetch(`${API_URL}/tweets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(tweetData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur serveur');
  }
  
  return { success: true, data: await response.json() };
}
```

### popup.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
    }
    
    h1 {
      font-size: 18px;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    h1 svg {
      width: 24px;
      height: 24px;
      color: #6366f1;
    }
    
    .form-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    
    input:focus {
      outline: none;
      border-color: #6366f1;
    }
    
    button {
      width: 100%;
      padding: 10px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #4f46e5;
    }
    
    .status {
      margin-top: 12px;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
    }
    
    .status.success {
      background: #dcfce7;
      color: #166534;
    }
    
    .status.error {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .stats {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    
    .stats-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    .stats-value {
      font-weight: 600;
      color: #6366f1;
    }
    
    .dashboard-link {
      display: block;
      text-align: center;
      margin-top: 16px;
      color: #6366f1;
      text-decoration: none;
      font-size: 13px;
    }
    
    .dashboard-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    Swipe File X
  </h1>
  
  <div class="form-group">
    <label>API Key</label>
    <input type="password" id="apiKey" placeholder="Colle ton API key ici">
  </div>
  
  <button id="save">Sauvegarder</button>
  
  <div id="status" class="status" style="display: none;"></div>
  
  <div class="stats" id="stats" style="display: none;">
    <div class="stats-item">
      <span>Tweets sauvegardés</span>
      <span class="stats-value" id="totalTweets">-</span>
    </div>
    <div class="stats-item">
      <span>Thèmes</span>
      <span class="stats-value" id="totalThemes">-</span>
    </div>
  </div>
  
  <a href="https://swipe-file-x.vercel.app/dashboard" target="_blank" class="dashboard-link">
    Ouvrir le Dashboard →
  </a>
  
  <script src="popup.js"></script>
</body>
</html>
```

### popup.js

```javascript
const API_URL = 'https://swipe-file-x.vercel.app/api';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');
  const statsDiv = document.getElementById('stats');
  
  // Charger l'API key existante
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);
  if (apiKey) {
    apiKeyInput.value = apiKey;
    loadStats(apiKey);
  }
  
  // Sauvegarder l'API key
  saveButton.addEventListener('click', async () => {
    const newApiKey = apiKeyInput.value.trim();
    
    if (!newApiKey) {
      showStatus('Veuillez entrer une API key', 'error');
      return;
    }
    
    // Tester la clé
    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${newApiKey}` }
      });
      
      if (!response.ok) {
        throw new Error('API key invalide');
      }
      
      await chrome.storage.sync.set({ apiKey: newApiKey });
      showStatus('API key sauvegardée !', 'success');
      loadStats(newApiKey);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  async function loadStats(apiKey) {
    try {
      const response = await fetch(`${API_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        const stats = await response.json();
        document.getElementById('totalTweets').textContent = stats.totalTweets;
        document.getElementById('totalThemes').textContent = stats.totalThemes;
        statsDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
});
```

---

## 📱 Raccourci iOS (Apple Shortcuts)

### Instructions de création

Le raccourci doit être créé manuellement dans l'app Raccourcis iOS avec ces étapes :

1. **Nom**: "Save to Swipe File"
2. **Type**: Recevoir depuis le Share Sheet
3. **Accepte**: URLs

### Actions du raccourci

```
1. Recevoir [URL] depuis le Share Sheet
2. Définir la variable [tweetUrl] sur [Entrée du raccourci]
3. Obtenir le contenu de [tweetUrl]
4. Obtenir le texte de [Contenu de la page]
5. Définir la variable [content] sur [Texte]
6. Obtenir les URLs de [tweetUrl]
7. Correspondance de texte: motif "@([^/]+)" dans [tweetUrl]
8. Définir la variable [username] sur [Correspondances]
9. URL: https://swipe-file-x.vercel.app/api/tweets
10. Obtenir le contenu de [URL]
    - Méthode: POST
    - Headers:
      - Authorization: Bearer [API_KEY]
      - Content-Type: application/json
    - Corps (JSON):
      {
        "tweetUrl": [tweetUrl],
        "content": [content],
        "authorUsername": [username]
      }
11. Si [Code de statut] est 200
    - Afficher la notification "Tweet sauvegardé ! 🎉"
12. Sinon
    - Afficher l'alerte "Erreur: [Réponse]"
```

### Alternative simplifiée

Si l'extraction de contenu est trop complexe côté iOS, le raccourci peut simplement envoyer l'URL et laisser le backend fetch le contenu via l'API Twitter/X (ou un scraper).

```
1. Recevoir [URL] depuis le Share Sheet
2. URL: https://swipe-file-x.vercel.app/api/tweets/from-url
3. Obtenir le contenu de [URL]
    - Méthode: POST
    - Headers: Authorization: Bearer [API_KEY]
    - Corps (JSON): { "tweetUrl": [URL] }
4. Notification selon résultat
```

Endpoint backend à créer :

```typescript
// POST /api/tweets/from-url
// Extrait automatiquement le contenu depuis l'URL
export async function POST(request: Request) {
  const { tweetUrl } = await request.json();
  
  // Extraire le contenu via syndication.twitter.com (pas d'auth requise)
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];
  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}`;
  
  const tweetData = await fetch(syndicationUrl).then(r => r.json());
  
  // Suite du traitement...
}
```

---

## 🖥️ Webapp Dashboard

### Structure des pages

```
app/
├── page.tsx                    # Landing page simple
├── dashboard/
│   ├── page.tsx               # Vue principale (tous les tweets)
│   ├── themes/
│   │   └── [id]/
│   │       └── page.tsx       # Tweets d'un thème
│   ├── favorites/
│   │   └── page.tsx           # Tweets favoris
│   ├── unclassified/
│   │   └── page.tsx           # Tweets à classifier
│   └── settings/
│       └── page.tsx           # Gestion des thèmes, API key
├── api/
│   ├── tweets/
│   │   ├── route.ts           # GET, POST /api/tweets
│   │   ├── [id]/
│   │   │   └── route.ts       # GET, PATCH, DELETE /api/tweets/:id
│   │   └── from-url/
│   │       └── route.ts       # POST /api/tweets/from-url
│   ├── themes/
│   │   ├── route.ts           # GET, POST /api/themes
│   │   └── [id]/
│   │       └── route.ts       # PATCH, DELETE /api/themes/:id
│   ├── suggestions/
│   │   └── route.ts           # GET /api/suggestions
│   └── stats/
│       └── route.ts           # GET /api/stats
└── components/
    ├── TweetCard.tsx          # Carte d'un tweet
    ├── TweetList.tsx          # Liste de tweets avec infinite scroll
    ├── ThemeBadge.tsx         # Badge coloré pour un thème
    ├── TagList.tsx            # Liste de tags cliquables
    ├── Sidebar.tsx            # Navigation latérale
    ├── SearchBar.tsx          # Barre de recherche
    ├── SuggestionPanel.tsx    # Panel "Inspire-moi"
    └── ThemeManager.tsx       # CRUD des thèmes
```

### Composants clés

#### TweetCard.tsx

```tsx
interface TweetCardProps {
  tweet: {
    id: string;
    content: string;
    authorUsername: string;
    authorDisplayName: string | null;
    tweetUrl: string;
    theme: { id: string; name: string; color: string } | null;
    tags: string[];
    isFavorite: boolean;
    aiAnalysis: {
      hookType: string | null;
      tone: string | null;
      summary: string;
    } | null;
    capturedAt: string;
  };
  onThemeChange?: (themeId: string | null) => void;
  onTagClick?: (tag: string) => void;
  onFavoriteToggle?: () => void;
  onDelete?: () => void;
}

export function TweetCard({ tweet, ...actions }: TweetCardProps) {
  return (
    <div className="tweet-card">
      <div className="tweet-header">
        <a href={`https://x.com/${tweet.authorUsername}`} target="_blank">
          @{tweet.authorUsername}
        </a>
        {tweet.authorDisplayName && (
          <span className="display-name">{tweet.authorDisplayName}</span>
        )}
      </div>
      
      <div className="tweet-content">
        {tweet.content}
      </div>
      
      <div className="tweet-meta">
        {tweet.theme && (
          <ThemeBadge 
            name={tweet.theme.name} 
            color={tweet.theme.color}
            onClick={() => {/* navigate to theme */}}
          />
        )}
        
        <TagList 
          tags={tweet.tags} 
          onTagClick={actions.onTagClick}
        />
        
        {tweet.aiAnalysis && (
          <div className="ai-badges">
            {tweet.aiAnalysis.hookType && (
              <span className="hook-type">{tweet.aiAnalysis.hookType}</span>
            )}
            {tweet.aiAnalysis.tone && (
              <span className="tone">{tweet.aiAnalysis.tone}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="tweet-actions">
        <button 
          className={`favorite-btn ${tweet.isFavorite ? 'active' : ''}`}
          onClick={actions.onFavoriteToggle}
        >
          ⭐
        </button>
        
        <a href={tweet.tweetUrl} target="_blank" className="original-link">
          Voir sur X →
        </a>
        
        <button className="delete-btn" onClick={actions.onDelete}>
          🗑️
        </button>
      </div>
    </div>
  );
}
```

#### SuggestionPanel.tsx

```tsx
export function SuggestionPanel() {
  const [suggestions, setSuggestions] = useState<Tweet[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadSuggestions = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ count: '5' });
    if (selectedTheme) params.set('themeId', selectedTheme);
    
    const res = await fetch(`/api/suggestions?${params}`);
    const data = await res.json();
    setSuggestions(data.suggestions);
    setIsLoading(false);
  };
  
  return (
    <div className="suggestion-panel">
      <h2>🎲 Inspire-moi</h2>
      
      <div className="theme-filter">
        <select 
          value={selectedTheme || ''} 
          onChange={(e) => setSelectedTheme(e.target.value || null)}
        >
          <option value="">Tous les thèmes</option>
          {/* themes options */}
        </select>
      </div>
      
      <button onClick={loadSuggestions} disabled={isLoading}>
        {isLoading ? 'Chargement...' : 'Nouvelle inspiration'}
      </button>
      
      <div className="suggestions-list">
        {suggestions.map(tweet => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </div>
  );
}
```

### Design system

```css
/* globals.css */

:root {
  /* Jon Labs colors */
  --primary: #A300D9;      /* Magenta */
  --secondary: #00D9A3;    /* Turquoise */
  
  /* Neutrals */
  --bg: #0a0a0a;
  --bg-card: #141414;
  --bg-hover: #1a1a1a;
  --text: #fafafa;
  --text-muted: #a1a1aa;
  --border: #27272a;
  
  /* Semantic */
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Tweet card */
.tweet-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.2s;
}

.tweet-card:hover {
  border-color: var(--primary);
}

.tweet-content {
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  margin: 12px 0;
}

/* Theme badge */
.theme-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

/* Tags */
.tag {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-hover);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
}

.tag:hover {
  background: var(--primary);
  color: white;
}
```

---

## 🔗 MCP Server

### Structure

```
mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
└── README.md
```

### package.json

```json
{
  "name": "swipefile-mcp",
  "version": "1.0.0",
  "description": "MCP Server pour Swipe File X",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

### src/index.ts

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.SWIPEFILE_API_URL || 'https://swipe-file-x.vercel.app/api';
const API_KEY = process.env.SWIPEFILE_API_KEY || '';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

const server = new Server(
  {
    name: 'swipefile-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_tweets',
        description: 'Recherche dans la bibliothèque de tweets sauvegardés. Utilise pour trouver de l\'inspiration ou des exemples de formulations.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Mots-clés de recherche dans le contenu des tweets',
            },
            theme: {
              type: 'string',
              description: 'Filtrer par nom de thème (ex: "freelance", "productivité")',
            },
            tag: {
              type: 'string',
              description: 'Filtrer par tag',
            },
            limit: {
              type: 'number',
              description: 'Nombre de résultats (défaut: 10)',
            },
          },
        },
      },
      {
        name: 'get_suggestions',
        description: 'Obtient des suggestions d\'inspiration aléatoires de la bibliothèque.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Thème spécifique pour les suggestions (optionnel)',
            },
            count: {
              type: 'number',
              description: 'Nombre de suggestions (défaut: 5)',
            },
          },
        },
      },
      {
        name: 'list_themes',
        description: 'Liste tous les thèmes disponibles dans la bibliothèque avec leur nombre de tweets.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_stats',
        description: 'Obtient les statistiques de la bibliothèque (nombre total de tweets, thèmes, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Exécution des outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'search_tweets': {
      const params = new URLSearchParams();
      if (args?.query) params.set('search', args.query as string);
      if (args?.theme) params.set('themeName', args.theme as string);
      if (args?.tag) params.set('tag', args.tag as string);
      params.set('limit', String(args?.limit || 10));
      
      const data = await fetchAPI(`/tweets?${params}`);
      
      const formattedTweets = data.tweets.map((t: any) => 
        `---\n@${t.authorUsername}: "${t.content}"\nThème: ${t.theme?.name || 'Non classé'} | Tags: ${t.tags.join(', ') || 'Aucun'}\nURL: ${t.tweetUrl}\n`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Trouvé ${data.total} tweet(s):\n\n${formattedTweets}`,
          },
        ],
      };
    }
    
    case 'get_suggestions': {
      const params = new URLSearchParams();
      if (args?.theme) params.set('themeName', args.theme as string);
      params.set('count', String(args?.count || 5));
      
      const data = await fetchAPI(`/suggestions?${params}`);
      
      const formatted = data.suggestions.map((t: any) => 
        `---\n@${t.authorUsername}: "${t.content}"\n${t.aiAnalysis?.summary || ''}\n`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `🎲 Suggestions d'inspiration:\n\n${formatted}`,
          },
        ],
      };
    }
    
    case 'list_themes': {
      const data = await fetchAPI('/themes');
      
      const formatted = data.themes.map((t: any) => 
        `- ${t.name}: ${t.tweetCount} tweets`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📁 Thèmes disponibles:\n\n${formatted}`,
          },
        ],
      };
    }
    
    case 'get_stats': {
      const data = await fetchAPI('/stats');
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Statistiques Swipe File:\n\n` +
              `Total tweets: ${data.totalTweets}\n` +
              `Total thèmes: ${data.totalThemes}\n` +
              `Non classifiés: ${data.unclassifiedCount}\n` +
              `Dernier ajout: ${data.lastCaptured}`,
          },
        ],
      };
    }
    
    default:
      throw new Error(`Outil inconnu: ${name}`);
  }
});

// Ressources (pour lister les tweets comme ressources consultables)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const data = await fetchAPI('/themes');
  
  return {
    resources: data.themes.map((t: any) => ({
      uri: `swipefile://theme/${t.id}`,
      name: `Thème: ${t.name}`,
      description: `${t.tweetCount} tweets sur le thème "${t.name}"`,
      mimeType: 'text/plain',
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/swipefile:\/\/theme\/(.+)/);
  
  if (match) {
    const themeId = match[1];
    const data = await fetchAPI(`/tweets?themeId=${themeId}&limit=50`);
    
    const formatted = data.tweets.map((t: any) => 
      `@${t.authorUsername}: "${t.content}"`
    ).join('\n\n---\n\n');
    
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: formatted,
        },
      ],
    };
  }
  
  throw new Error(`Ressource inconnue: ${uri}`);
});

// Démarrage du serveur
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Swipe File MCP Server running');
}

main().catch(console.error);
```

### Configuration Claude Desktop

Ajouter dans `~/Library/Application Support/Claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "swipefile": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "SWIPEFILE_API_URL": "https://swipe-file-x.vercel.app/api",
        "SWIPEFILE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

---

## 📁 Structure complète du projet

```
swipe-file-x/
├── .env.local                  # Variables d'environnement
├── .env.example                # Template des variables
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── drizzle.config.ts
├── README.md
│
├── db/
│   ├── schema.ts              # Schema Drizzle
│   ├── index.ts               # Export de la connexion DB
│   └── migrate.ts             # Script de migration
│
├── lib/
│   ├── auth.ts                # Validation API key
│   ├── classification.ts      # Logique classification IA
│   └── utils.ts               # Helpers divers
│
├── app/
│   ├── layout.tsx             # Layout global
│   ├── page.tsx               # Landing page
│   ├── globals.css            # Styles globaux
│   │
│   ├── dashboard/
│   │   ├── layout.tsx         # Layout dashboard avec sidebar
│   │   ├── page.tsx           # Vue tous les tweets
│   │   ├── themes/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── favorites/
│   │   │   └── page.tsx
│   │   ├── unclassified/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── tweets/
│       │   ├── route.ts
│       │   ├── [id]/
│       │   │   └── route.ts
│       │   └── from-url/
│       │       └── route.ts
│       ├── themes/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── suggestions/
│       │   └── route.ts
│       └── stats/
│           └── route.ts
│
├── components/
│   ├── ui/                    # Composants UI génériques
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   ├── TweetCard.tsx
│   ├── TweetList.tsx
│   ├── ThemeBadge.tsx
│   ├── TagList.tsx
│   ├── Sidebar.tsx
│   ├── SearchBar.tsx
│   ├── SuggestionPanel.tsx
│   └── ThemeManager.tsx
│
├── extension/                  # Extension Chrome (dossier séparé)
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── styles.css
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── mcp-server/                # MCP Server (dossier séparé)
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   └── index.ts
    └── README.md
```

---

## 🔐 Variables d'environnement

### .env.example

```bash
# Database (Vercel Postgres)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Authentication
API_KEY="sfx_your_secret_key_here"

# Claude API (pour classification)
ANTHROPIC_API_KEY="sk-ant-..."

# App
NEXT_PUBLIC_APP_URL="https://swipe-file-x.vercel.app"
```

---

## 🚀 Plan d'implémentation

### Phase 1 : Setup & Database (1-2h)
1. Créer le projet Next.js avec App Router
2. Configurer Vercel Postgres + Drizzle
3. Créer le schema et migrer
4. Configurer les variables d'environnement

### Phase 2 : API Backend (2-3h)
1. Implémenter l'authentification API key
2. Créer tous les endpoints tweets
3. Créer tous les endpoints themes
4. Créer endpoint suggestions et stats
5. Intégrer la classification Claude Haiku

### Phase 3 : Extension Chrome (2h)
1. Créer la structure de l'extension
2. Implémenter l'injection de bouton
3. Implémenter l'extraction de données tweet
4. Créer le popup de configuration
5. Tester sur x.com

### Phase 4 : Webapp Dashboard (3-4h)
1. Créer le layout avec sidebar
2. Implémenter TweetCard et TweetList
3. Créer les vues par thème/favoris/non-classifiés
4. Implémenter la recherche
5. Créer le panel de suggestions
6. Créer la page settings (gestion thèmes)

### Phase 5 : MCP Server (1-2h)
1. Créer le projet Node.js séparé
2. Implémenter les outils MCP
3. Tester avec Claude Desktop
4. Documenter la configuration

### Phase 6 : Polish & Deploy (1h)
1. Tester le flow complet
2. Déployer sur Vercel
3. Générer l'API key de production
4. Charger l'extension en mode développeur
5. Créer le raccourci iOS

---

## ✅ Critères de validation MVP

- [ ] Je peux voir un bouton sur chaque tweet dans X.com
- [ ] En cliquant, le tweet est sauvegardé dans ma DB
- [ ] Le tweet est automatiquement classifié par thème
- [ ] Je peux voir tous mes tweets dans le dashboard
- [ ] Je peux filtrer par thème
- [ ] Je peux marquer des favoris
- [ ] Je peux obtenir des suggestions aléatoires
- [ ] Je peux rechercher dans mes tweets
- [ ] Le MCP fonctionne dans Claude Desktop
- [ ] Je peux sauvegarder depuis iOS via share sheet

---

## 📝 Notes pour Claude Code

### Priorités
1. **Fonctionnel > Beau** : Focus sur le flow qui marche, le polish viendra après
2. **Simple > Clever** : Pas d'over-engineering, c'est un MVP perso
3. **Itératif** : Chaque phase doit être testable indépendamment

### Conventions
- TypeScript strict
- Noms de variables en anglais
- Commentaires en français si clarification nécessaire
- Pas de console.log en production (sauf erreurs)

### À éviter
- Pas de framework CSS lourd (Tailwind suffit)
- Pas d'authentification complexe (juste API key)
- Pas de tests unitaires pour le MVP
- Pas de CI/CD complexe (Vercel fait le job)

### En cas de doute
Demander à Jonathan plutôt que supposer. Le PRD couvre l'essentiel mais des questions peuvent émerger pendant l'implémentation.
