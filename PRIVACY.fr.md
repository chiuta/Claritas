# Claritas — Politique de confidentialité

**Version 1.10.0 · Dernière mise à jour : 17 nov. 2026** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · Français · [Italiano](PRIVACY.it.md) · [Español](PRIVACY.es.md) · [Português](PRIVACY.pt.md) · [Deutsch](PRIVACY.de.md) · [Magyar](PRIVACY.hu.md)

Claritas est une extension d'accessibilité gratuite et open source (MIT). Elle n'a **ni télémétrie, ni analyse d'audience, ni comptes, ni serveurs propres**. Ce document indique exactement ce qu'elle stocke et les rares cas où votre navigateur (et non Claritas) communique avec un tiers.

## Ce que Claritas stocke
Tout est conservé dans le stockage d'extension de votre navigateur (`storage.local`) :
- vos réglages, profils et règles par site ;
- les fonctions facultatives que vous activez : liste de lecture et notes, votre CSS par site, un fichier de dictionnaire que vous importez, les surlignages.

Les captures d'écran et enregistrements d'écran sont créés dans le navigateur et enregistrés directement dans votre dossier Téléchargements. Claritas ne les envoie jamais.

Vous pouvez tout exporter ou supprimer depuis la fenêtre contextuelle, ou en supprimant l'extension.

## Ce que Claritas lit
Pour remplir sa mission (corriger le contraste, lire à voix haute, auditer, etc.), le script de contenu lit les pages que vous visitez **à l'intérieur de votre navigateur**. Claritas n'envoie le contenu des pages nulle part. Le bouton « Qu'est-ce qui quitte le navigateur ? » du panneau des modules facultatifs lit le code de l'extension et liste chaque appel réseau trouvé : vous pouvez ainsi le vérifier vous-même.

Pour estimer le contraste d'un texte placé sur une image d'arrière-plan, le script de contenu peut décoder cette image localement (petit canevas) lorsqu'il s'agit d'une image `data:`/`blob:` ou provenant du même site que la page (normalement déjà dans le cache). Claritas ne télécharge jamais les images d'autres sites, et rien sur l'image n'est conservé ni envoyé.

## Cas où des données peuvent quitter votre navigateur
Jamais activés par défaut, ou seulement sur votre action explicite :
1. **Bouton de définition** : ouvre dexonline.ro ou Wiktionary dans un nouvel onglet, uniquement lorsque vous l'appuyez. Ces sites voient alors le mot recherché.
2. **Commande vocale et sous-titres en direct (Chrome)** : le service de reconnaissance vocale du navigateur traite l'audio, selon les conditions de Google. Firefox n'a pas de tel service.
3. **Synchronisation des réglages (désactivée par défaut)** : utilise le `storage.sync` de votre navigateur, synchronisé par son éditeur. Seuls les réglages et les règles par site sont inclus, jamais le dictionnaire, les notes, les captures ni les enregistrements.
4. **IA sur l'appareil (désactivée par défaut)** : utilise l'API Prompt de Chrome avec le modèle déjà présent sur votre ordinateur. Claritas n'envoie aucun texte de page à un serveur ; Chrome peut télécharger son propre modèle, ce qui relève de Chrome.
5. **Paquets facultatifs** (`-ocr`, `-axe`, `-pdf`) : inclus et exécutés localement ; ils ne font aucune requête.

## Autorisations
- `storage` : enregistrer vos réglages.
- Accès à tous les sites (script de contenu sur `<all_urls>`, tous les cadres) : nécessaire pour appliquer les corrections de contraste, les thèmes et les outils sur toute page où vous choisissez de les utiliser. L'extension peut être désactivée globalement ou par site.

## Enfants
Claritas ne collecte aucune donnée personnelle, y compris auprès des enfants.

## Modifications
Les modifications de cette politique apparaissent dans ce fichier et dans l'historique du dépôt : https://github.com/chiuta/Claritas

## Contact
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
