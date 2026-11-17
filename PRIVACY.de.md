# Claritas — Datenschutzerklärung

**Version 1.10.0 · Zuletzt aktualisiert: 17. Nov. 2026** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · [Français](PRIVACY.fr.md) · [Italiano](PRIVACY.it.md) · [Español](PRIVACY.es.md) · [Português](PRIVACY.pt.md) · Deutsch · [Magyar](PRIVACY.hu.md)

Claritas ist eine kostenlose Open-Source-Erweiterung (MIT) für Barrierefreiheit. Sie hat **keine Telemetrie, keine Analysen, keine Konten und keine eigenen Server**. Dieses Dokument beschreibt genau, was gespeichert wird und in welchen wenigen Fällen Ihr Browser (nicht Claritas) mit Dritten kommuniziert.

## Was Claritas speichert
Alles liegt im Erweiterungsspeicher Ihres Browsers (`storage.local`):
- Ihre Einstellungen, Profile und Regeln pro Website;
- optionale Funktionen, die Sie aktivieren: Leseliste und Notizen, Ihr CSS pro Website, eine importierte Wörterbuchdatei, Markierungen.

Screenshots und Bildschirmaufnahmen entstehen im Browser und werden direkt in Ihrem Download-Ordner gespeichert. Claritas lädt sie nie hoch.

Sie können alles im Popup exportieren oder löschen – oder indem Sie die Erweiterung entfernen.

## Was Claritas liest
Um seine Aufgabe zu erfüllen (Kontrast korrigieren, vorlesen, prüfen usw.), liest das Content-Skript die besuchten Seiten **innerhalb Ihres Browsers**. Claritas sendet keine Seiteninhalte irgendwohin. Die Schaltfläche „Was verlässt den Browser?“ im Panel der optionalen Module liest den Code der Erweiterung selbst und listet jeden gefundenen Netzwerkaufruf auf, sodass Sie es selbst überprüfen können.

Um den Kontrast von Text über einem Hintergrundbild abzuschätzen, kann das Content-Skript dieses Bild lokal decodieren (kleines Canvas), wenn es ein `data:`/`blob:`-Bild ist oder von derselben Website wie die Seite stammt (normalerweise schon im Cache). Bilder anderer Websites ruft Claritas nie ab, und nichts über das Bild wird gespeichert oder gesendet.

## Fälle, in denen Daten Ihren Browser verlassen können
Nie standardmäßig aktiv oder nur auf Ihre ausdrückliche Aktion:
1. **Definitionsschaltfläche**: öffnet dexonline.ro oder Wiktionary in einem neuen Tab, nur wenn Sie sie drücken. Diese Seiten sehen dann das nachgeschlagene Wort.
2. **Sprachsteuerung und Live-Untertitel (Chrome)**: Der Spracherkennungsdienst des Browsers verarbeitet das Audio gemäß den Bedingungen von Google. Firefox hat keinen solchen Dienst.
3. **Einstellungssynchronisierung (standardmäßig aus)**: nutzt das `storage.sync` Ihres Browsers, das der Browserhersteller synchronisiert. Enthalten sind nur Einstellungen und Regeln pro Website, nie Wörterbuch, Notizen, Screenshots oder Aufnahmen.
4. **KI auf dem Gerät (standardmäßig aus)**: nutzt die Prompt API von Chrome mit dem bereits auf Ihrem Computer vorhandenen Modell. Claritas sendet keinen Seitentext an einen Server; Chrome kann sein eigenes Modell herunterladen – das ist Verhalten von Chrome.
5. **Optionale Pakete** (`-ocr`, `-axe`, `-pdf`): mitgeliefert und lokal ausgeführt; sie stellen keine Anfragen.

## Berechtigungen
- `storage`: Ihre Einstellungen speichern.
- Zugriff auf alle Websites (Content-Skript auf `<all_urls>`, alle Frames): erforderlich, um Kontrastkorrekturen, Designs und Werkzeuge auf jeder Seite anzuwenden, auf der Sie sie nutzen möchten. Die Erweiterung kann global oder pro Website deaktiviert werden.

## Kinder
Claritas erhebt von niemandem personenbezogene Daten, auch nicht von Kindern.

## Änderungen
Änderungen dieser Erklärung erscheinen in dieser Datei und im Verlauf des Repositorys: https://github.com/chiuta/Claritas

## Kontakt
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
