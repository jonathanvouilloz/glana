# Glana - Contexte Projet

## Vue d'ensemble
Glana est une application "swipe file" pour sauvegarder, classifier automatiquement et consulter des tweets inspirants. Elle comprend une extension Chrome, un dashboard webapp, et un serveur MCP pour Claude Desktop.

## Stack technique
- Framework: Next.js 14 (App Router)
- Database: Vercel Postgres + Drizzle ORM
- Styling: Tailwind CSS
- Classification: Claude API (Haiku)
- Déploiement: Vercel

## Structure du projet
```
glana/
├── app/              # Next.js App Router (API + Dashboard)
├── components/       # Composants React
├── db/               # Schema Drizzle + connexion
├── lib/              # Utils, auth, classification
├── extension/        # Extension Chrome (Vanilla JS)
├── mcp-server/       # Serveur MCP (Node.js)
└── docs/             # Documentation
```

## Commandes utiles
- `npm run dev` : Serveur de développement
- `npm run db:push` : Push schema vers DB
- `npm run db:studio` : Drizzle Studio
- `npm run build` : Build production

## Conventions
- Langue du code : Anglais
- Langue des commentaires : Français si clarification nécessaire
- Nommage : camelCase pour variables/fonctions, PascalCase pour composants

## État actuel
- [x] Phase 1 : Setup & Database
- [x] Phase 2 : API Backend
- [x] Phase 3 : Extension Chrome
- [x] Phase 4 : Webapp Dashboard
- [x] Phase 5 : MCP Server
- [ ] Phase 6 : Polish & Deploy

## Notes importantes
- Domaine : glana.ai
- Couleurs Jon Labs : Primary #A300D9 (Magenta), Secondary #00D9A3 (Turquoise)
- Un seul utilisateur (Jonathan) - authentification par API key simple
