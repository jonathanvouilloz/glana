# Bonnes pratiques Glana

## Développement

### Principe #1 : Fonctionnel > Parfait
C'est un MVP personnel. Priorise ce qui marche sur ce qui est beau ou optimal.

### Principe #2 : Pas d'over-engineering
- Pas de state management global (useState/useContext suffisent)
- Pas de tests unitaires pour le MVP
- Pas d'abstraction prématurée

### Principe #3 : Itératif
Chaque phase doit être testable indépendamment. Ne pas attendre la fin pour tester.

## Sécurité

### API Key
- Une seule API key pour l'utilisateur unique
- Stockée dans `.env.local`, jamais committée
- Validée sur chaque requête API

### Données
- Pas de données sensibles stockées
- Les tweets sont publics par nature

## Performance

### Base de données
- Index sur `tweets.content` pour recherche full-text
- Index sur `tweets.themeId` pour filtrage
- Pagination obligatoire sur les listes

### Frontend
- Lazy loading des images (si ajoutées plus tard)
- Infinite scroll plutôt que pagination classique

## Classification IA

### Coûts
- Utiliser Claude Haiku (le moins cher)
- Classifier en async (non-bloquant)
- Ne pas re-classifier si déjà fait

### Prompt
- Garder le prompt simple et direct
- Demander du JSON strict (pas de markdown)
- Limiter max_tokens à 500

## Extension Chrome

### Robustesse
- Gérer le cas où le DOM de X change
- Fallback gracieux si extraction échoue
- Ne pas bloquer le scroll/navigation

### UX
- Feedback visuel immédiat (loading, success, error)
- Ne pas spammer l'utilisateur avec des alertes

## Debugging

### Logs
- `console.error` pour les erreurs (gardés en prod)
- `console.log` pour debug (à retirer avant commit)

### API
- Toujours retourner des messages d'erreur explicites
- Logger les erreurs côté serveur
