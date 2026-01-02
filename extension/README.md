# Glana Chrome Extension

Extension Chrome pour sauvegarder des tweets dans ta bibliothèque Glana.

## Installation (Mode Développeur)

1. Ouvre Chrome et va sur `chrome://extensions/`
2. Active le "Mode développeur" (toggle en haut à droite)
3. Clique sur "Charger l'extension non empaquetée"
4. Sélectionne ce dossier (`extension/`)

## Générer les icônes

Les icônes PNG doivent être générées à partir du fichier `icons/icon.svg`.

### Option 1 : En ligne
1. Va sur https://svgtopng.com/
2. Upload `icons/icon.svg`
3. Génère les tailles 16x16, 48x48, 128x128
4. Renomme les fichiers en `icon16.png`, `icon48.png`, `icon128.png`

### Option 2 : Avec ImageMagick
```bash
cd extension/icons
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Option 3 : Avec Inkscape
```bash
cd extension/icons
inkscape icon.svg -w 16 -h 16 -o icon16.png
inkscape icon.svg -w 48 -h 48 -o icon48.png
inkscape icon.svg -w 128 -h 128 -o icon128.png
```

## Configuration

1. Clique sur l'icône de l'extension dans la barre Chrome
2. Entre ton API key Glana
3. (Optionnel) Configure l'URL de l'API si différente de `https://glana.ai/api`

## Utilisation

1. Va sur x.com ou twitter.com
2. Un bouton bookmark apparaît sur chaque tweet
3. Clique dessus pour sauvegarder le tweet dans Glana
4. Le tweet sera automatiquement classifié par l'IA

## Développement

Pour tester les modifications :
1. Modifie les fichiers
2. Va sur `chrome://extensions/`
3. Clique sur le bouton de rechargement de l'extension
