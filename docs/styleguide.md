# Styleguide Glana

## TypeScript

### Imports
- Ordre : React/Next → Libs externes → Composants → Utils → Types
- Utiliser `@/` pour les imports absolus

### Typage
- Toujours typer les props des composants
- Utiliser `interface` pour les objets, `type` pour les unions
- Éviter `any`, préférer `unknown` si nécessaire

### Exemples
```typescript
// Bon
interface TweetCardProps {
  tweet: Tweet;
  onDelete?: () => void;
}

// Mauvais
type Props = any;
```

## React / Next.js

### Composants
- Un composant par fichier
- Nommage PascalCase
- Export default pour les pages, named export pour les composants

### Hooks
- Préfixer par `use`
- Un hook custom par fichier dans `/hooks`

### Server vs Client
- Par défaut : Server Components
- Ajouter `'use client'` seulement si nécessaire (interactivité, hooks React)

## Tailwind CSS

### Classes
- Ordre : layout → spacing → sizing → colors → effects
- Utiliser les classes utilitaires, éviter le CSS custom

### Dark mode
- Pas de dark mode pour le MVP (le design est déjà sombre)

### Couleurs projet
```css
--primary: #A300D9;    /* Magenta Jon Labs */
--secondary: #00D9A3;  /* Turquoise Jon Labs */
```

## API Routes

### Structure réponse
```typescript
// Succès
{ success: true, data: {...} }

// Erreur
{ success: false, error: "Message d'erreur" }
```

### Codes HTTP
- 200 : Succès
- 201 : Création réussie
- 400 : Erreur client (validation)
- 401 : Non authentifié
- 404 : Ressource non trouvée
- 500 : Erreur serveur

## Git

### Commits
Format : `type(scope): message`

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatting
- `refactor` : Refactoring
- `chore` : Maintenance

Exemples :
- `feat(api): add tweets endpoint`
- `fix(extension): handle empty tweet content`
- `docs: update README`

### Branches
- `main` : Production
- `feat/xxx` : Nouvelles features
