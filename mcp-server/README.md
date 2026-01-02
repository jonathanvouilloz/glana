# Glana MCP Server

Serveur MCP pour accéder à ta bibliothèque de tweets Glana depuis Claude Desktop.

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration Claude Desktop

Ajoute cette configuration dans ton fichier Claude Desktop :

**macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
**Linux** : `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "glana": {
      "command": "node",
      "args": ["/chemin/vers/glana/mcp-server/dist/index.js"],
      "env": {
        "GLANA_API_URL": "https://glana.ai",
        "GLANA_API_KEY": "ta-clé-api"
      }
    }
  }
}
```

Remplace `/chemin/vers/glana` par le chemin absolu vers ton installation Glana.

## Outils disponibles

### `search_tweets`
Recherche dans les tweets sauvegardés.

Paramètres :
- `search` : Terme de recherche dans le contenu
- `themeId` : Filtrer par thème
- `tag` : Filtrer par tag
- `favorites` : Uniquement les favoris
- `unclassified` : Uniquement les non-classifiés
- `limit` : Nombre max de résultats (défaut: 20, max: 100)

### `get_suggestions`
Obtenir des suggestions aléatoires pour l'inspiration.

Paramètres :
- `themeId` : Filtrer par thème
- `count` : Nombre de suggestions (défaut: 5, max: 20)

### `list_themes`
Lister tous les thèmes avec leur nombre de tweets.

### `get_stats`
Statistiques de la bibliothèque : total tweets, thèmes, non-classifiés, répartition par thème, top tags.

## Exemples d'utilisation avec Claude

- "Inspire-moi avec des tweets sur le marketing"
- "Montre-moi mes tweets favoris"
- "Quelles sont mes statistiques Glana ?"
- "Cherche des tweets qui parlent de productivité"
