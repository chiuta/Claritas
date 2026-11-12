# Claritas

[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version: 1.7.0 · Dernière mise à jour: 12/11/2026**

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

`Alt+Shift+O` activer/désactiver · `D` thème · `L` lecture · `G` règle · `Alt+Shift+P` menu de capture · `Alt+Shift+H` étiquettes numérotées · `Alt+Shift+S` balayage. Modifiables dans les réglages des raccourcis d’extensions du navigateur (le popup propose un bouton).

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

État de vérification (v1.6.0) : testé automatiquement en CI sur Chromium, Edge, Brave, Firefox (plusieurs canaux), Safari 27.2 réel sur macOS, Safari 26.2 dans le simulateur iPhone/iPad, Chrome 113 et Firefox 162 sur Android 14 (émulateur). Vérifié en CI sous Linux pour v1.7.0 : Opera 140 (les 12 fichiers de test). Non vérifié : Vivaldi (il démarre, mais la connexion de débogage automatique expire), Samsung Internet réel, l’extension activée dans Safari/iOS réels, Chrome de marque. Alt+Shift+O/D/L/G sont réassignables dans le navigateur ; P/H/S/M sont fixes. Le bouton de définition n’ouvre dexonline.ro ou Wiktionary qu’au clic.

## Modules facultatifs (v1.7)
Tous sont désactivés par défaut (popup → « Plus » → « Modules optionnels (v1.7) »). Aucune télémétrie ; le bouton « Que quitte le navigateur ? » lit le code de l’extension et liste les adresses et appels réseau trouvés.
- **Navigation rapide** : Alt+Maj+J/K titre suivant/précédent, M/N repère suivant/précédent, L liste filtrable de repères, titres et liens, G projecteur sur le paragraphe ; focus agrandi et visible.
- **Commande vocale** (Alt+Maj+V) : commandes comme « next heading », « zoom in », « read », « help ». Dans Chrome, l’audio est traité par le service vocal du navigateur ; Firefox ne l’a pas.
- **Résumé, texte simplifié, glossaire** (Alt+Maj+Y) : résumé par sélection statistique de phrases (pas d’IA ; utilise le modèle local de Chrome seulement si « IA locale » est activée et disponible), simplification qui ne fait que découper les phrases longues, glossaire des abréviations définies dans la page et des mots longs (avec le dictionnaire local, s’il est importé).
- **Descriptions pour images sans alt** : à partir de la légende, du titre, du texte du lien ou du nom de fichier ; marquées « générées automatiquement ». L’image n’est pas analysée.
- **Sous-titres en direct** (Alt+Maj+C) : uniquement la parole captée par le micro, pas le son des vidéos ou de la page.
- **Nouveaux profils** : seniors, tremblements/motricité, photosensibilité, TDAH/concentration.
- **Règles par site** : export/import JSON ou liste de domaines à désactiver.
- **Rapport d’audit** : HTML, CSV ou JSON avec correspondance WCAG 2.2 / EN 301 549, corrections suggérées et comparaison à une référence enregistrée.
- **Mode CI** : `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (code de sortie 1 au-delà du seuil). Ne couvre que les règles automatiques de Claritas.
- **Vérifié (Chromium, extension réelle)** : 36 contrôles dans `test/t14_v17.py`. **Non vérifié** : reconnaissance vocale avec une vraie voix (seulement démarrage/arrêt et analyseur de commandes), sous-titres en direct avec une vraie voix, les modules sous Firefox/Safari.

## Modules facultatifs (v1.6)
Tous désactivés par défaut (popup → « Modules facultatifs ») ; rien ne quitte le navigateur. Catégories grammaticales dans le Lecteur (roumain/anglais, heuristique), règles d’audit supplémentaires (ARIA, formulaires, main, zoom, sous-titres), dictionnaire local (votre propre JSON/TSV, 4 Mo max.), synchronisation des réglages via `storage.sync` du navigateur (sans dictionnaire ni enregistrements) et OCR local dans le paquet séparé `claritas-*-ocr.zip` (~20 Mo ; vérifié automatiquement seulement dans Chromium, Firefox/Safari non vérifiés).
