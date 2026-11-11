# Claritas

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version: 1.5.3 · Dernière mise à jour: 11/11/2026**

Extension d’accessibilité tout-en-un, gratuite. Sans télémétrie, sans réseau, sans compte : tout reste dans votre navigateur.

## Fonctionnalités
- **Correction automatique du contraste (WCAG AA/AAA)** : mesure le contraste réel texte/arrière-plan et n’ajuste que le texte insuffisant, y compris les champs désactivés.
- **Thèmes à fort contraste**, filtres de couleur, **daltonisme** (correction et simulation), filtre de lumière bleue, simulateur de vision.
- **Texte** : zoom, taille, espacements, polices (adaptée à la dyslexie, Lexend, Atkinson Hyperlegible), alignement à gauche.
- **Lecture** : règle, masque, loupe, mode lecture, lecture rapide, lecture à voix haute (voix locales), surlignages exportables.
- **Motricité et contrôle** : grandes cibles de clic, clic par survol, balayage à contacteur unique, étiquettes numérotées, déblocage du collage.
- **Calme et stabilité** : masque bandeaux et fenêtres surgissantes, reflux, fige les GIF, garde le focus visible.
- **Audit WCAG 2.2** avec surveillance continue et contrôles manuels.
- **Capture d’écran locale** (zone visible, région, page entière, élément) avec annotations, masquage automatique des données personnelles (y compris dans les cadres et le shadow DOM) et ZIP PNG + description (.md).
- **Enregistrement d’écran local** avec anneaux de clic, touches affichées et journal d’actions WebVTT.
- **Profils**, réglages par site, export/import JSON, politiques d’entreprise (managed storage).
- **8 langues** : English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Installation

Choisissez le paquet correspondant à votre navigateur (dossier `dist/` ou fichiers de la version) :

| Paquet | Navigateurs |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale et tout navigateur Chromium 109+ |
| `claritas-firefox.zip` | Firefox (ordinateur 140+ et Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (nécessite un Mac avec Xcode) |

- **Famille Chromium** : décompressez, ouvrez la page des extensions (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), activez le *mode développeur*, choisissez *Charger l’extension non empaquetée* et sélectionnez le dossier.
- **Firefox** : `about:debugging#/runtime/this-firefox` → *Charger un module complémentaire temporaire* → `manifest.json`. Pour une installation permanente, signez-le comme module non listé sur addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari** : sur un Mac avec Xcode, lancez `./build-safari.sh` depuis les sources décompressées, puis activez l’extension dans Safari → Réglages → Extensions.
- **Mobile** : Firefox Android (via une collection de modules personnalisée), Edge Android et Samsung Internet (via leurs boutiques). Chrome, Brave et Opera sur Android n’acceptent pas les extensions.

## Raccourcis

`Alt+Shift+C` activer/désactiver · `T` thème · `R` lecture · `G` règle · `Alt+Shift+P` menu de capture · `Alt+Shift+H` étiquettes numérotées · `Alt+Shift+S` balayage. Modifiables dans les réglages des raccourcis d’extensions du navigateur (le popup propose un bouton).

## Confidentialité

Aucune requête réseau, aucune télémétrie, aucun compte. Les captures et enregistrements sont créés et enregistrés localement dans votre navigateur.

## Limites connues

- Safari et Samsung Internet n’ont pas de politiques d’entreprise (managed) ; Firefox Android n’a pas d’enregistrement d’écran.
- Safari iOS peut rogner les captures ; utilisez la capture de région ou d’élément.
- Vérifié en direct dans Chrome ; Firefox, Safari et les autres navigateurs ont été examinés statiquement.

## Licence

MIT — copyright Alexandru-Ionuț Chiuță (Alexio).

## Soutien

Si Claritas vous aide, vous pouvez soutenir ce travail : [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
