# Plan de développement Glana

## Phase 1 : Setup & Database (Priorité: HAUTE) ✅
### Tâches
- [x] 1.1 Init projet Next.js 14 avec App Router
- [x] 1.2 Configurer Tailwind CSS
- [x] 1.3 Setup Drizzle ORM + schema
- [x] 1.4 Configurer variables d'environnement
- [x] 1.5 Premier déploiement Vercel (vide)

### Livrables
- Projet qui tourne en local
- Schema DB prêt
- Déploiement Vercel fonctionnel

---

## Phase 2 : API Backend (Priorité: HAUTE) ✅
### Tâches
- [x] 2.1 Middleware d'authentification API key
- [x] 2.2 CRUD /api/tweets
- [x] 2.3 CRUD /api/themes
- [x] 2.4 GET /api/suggestions
- [x] 2.5 GET /api/stats
- [x] 2.6 POST /api/tweets/from-url (extraction auto)
- [x] 2.7 Intégration classification Claude Haiku

### Dépendances
- Phase 1 complète

### Livrables
- Tous les endpoints fonctionnels
- Classification automatique active

---

## Phase 3 : Extension Chrome (Priorité: MOYENNE) ✅
### Tâches
- [x] 3.1 Structure extension Manifest V3
- [x] 3.2 Content script : injection bouton
- [x] 3.3 Content script : extraction données tweet
- [x] 3.4 Background script : communication API
- [x] 3.5 Popup : configuration API key
- [x] 3.6 Popup : affichage stats

### Dépendances
- Phase 2 complète (API fonctionnelle)

### Livrables
- Extension installable en mode dev
- Capture de tweets fonctionnelle

---

## Phase 4 : Webapp Dashboard (Priorité: MOYENNE) ✅
### Tâches
- [x] 4.1 Layout global + Sidebar
- [x] 4.2 Composant TweetCard
- [x] 4.3 Page tous les tweets + infinite scroll
- [x] 4.4 Page par thème
- [x] 4.5 Page favoris
- [x] 4.6 Page non-classifiés
- [x] 4.7 Recherche full-text
- [x] 4.8 Panel suggestions "Inspire-moi"
- [x] 4.9 Page settings (gestion thèmes)

### Dépendances
- Phase 2 complète

### Livrables
- Dashboard navigable et fonctionnel
- Toutes les vues implémentées

---

## Phase 5 : MCP Server (Priorité: BASSE) ✅
### Tâches
- [x] 5.1 Setup projet Node.js dans /mcp-server
- [x] 5.2 Outil search_tweets
- [x] 5.3 Outil get_suggestions
- [x] 5.4 Outil list_themes
- [x] 5.5 Outil get_stats
- [x] 5.6 Documentation configuration

### Dépendances
- Phase 2 complète

### Livrables
- MCP fonctionnel avec Claude Desktop

---

## Phase 6 : Polish & Deploy (Priorité: BASSE)
### Tâches
- [x] 6.1 Tests end-to-end manuels
- [x] 6.2 Fix bugs découverts
- [ ] 6.3 Déploiement production
- [ ] 6.4 Génération API key prod
- [ ] 6.5 Documentation raccourci iOS

### Livrables
- Produit utilisable en production

---

## Ordre d'exécution recommandé
1. ~~Phase 1 (bloquante)~~ ✅
2. ~~Phase 2 (bloquante)~~ ✅
3. ~~Phase 3 + Phase 4 (parallélisables)~~ ✅
4. ~~Phase 5~~ ✅
5. Phase 6 ← **EN COURS**
