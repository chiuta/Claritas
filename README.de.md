# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

**Version: 1.7.0 · Letzte Aktualisierung: 12.11.2026**

Kostenlose Barrierefreiheits-Erweiterung „Alles in einem“. Keine Telemetrie, kein Netzwerk, keine Konten: Alles bleibt in Ihrem Browser.

## Funktionen
- **Automatische Kontrastkorrektur (WCAG AA/AAA)**: misst den tatsächlichen Text-/Hintergrundkontrast und passt nur unzureichenden Text an, auch deaktivierte Felder.
- **Hochkontrast-Designs**, Farbfilter, **Farbenblindheit** (Korrektur und Simulation), Blaulichtfilter, Sehsimulator.
- **Text**: Seitenzoom, Größe, Abstände, Schriften (legasthenie-freundlich, Lexend, Atkinson Hyperlegible), Linksausrichtung.
- **Lesen**: Lineal, Maske, Lupe, Lesemodus, Schnelllesen, Vorlesen (lokale Stimmen), Markierungen mit Export.
- **Motorik und Steuerung**: große Klickziele, Verweilklick, Ein-Tasten-Scanning, nummerierte Beschriftungen, Einfügen entsperren.
- **Ruhe und Stabilität**: blendet Banner und Pop-ups aus, Reflow, hält GIFs an, hält den Fokus sichtbar.
- **WCAG-2.2-Prüfung** mit laufender Überwachung und manuellen Checks.
- **Lokales Bildschirmfoto** (sichtbarer Bereich, Bereich, ganze Seite, Element) mit Anmerkungen, automatischer Abdeckung persönlicher Daten (auch in Frames und Shadow DOM) und ZIP mit PNG + Beschreibung (.md).
- **Lokale Bildschirmaufnahme** mit Klickringen, angezeigten Tasten und WebVTT-Aktionsprotokoll.
- **Profile**, Einstellungen pro Website, JSON-Export/-Import, Unternehmensrichtlinien (managed storage).
- **8 Sprachen**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Installation

Wählen Sie das Paket passend zu Ihrem Browser (Ordner `dist/` oder Release-Dateien):

| Paket | Browser |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale und jeder Chromium-109+-Browser |
| `claritas-firefox.zip` | Firefox (Desktop 140+ und Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (erfordert einen Mac mit Xcode) |

- **Chromium-Familie**: entpacken, die Erweiterungsseite öffnen (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), den *Entwicklermodus* aktivieren, *Entpackte Erweiterung laden* wählen und den Ordner auswählen.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Temporäres Add-on laden* → `manifest.json`. Für eine dauerhafte Installation als nicht gelistetes Add-on auf addons.mozilla.org signieren (ID `claritas@trom.tf`).
- **Safari**: auf einem Mac mit Xcode `./build-safari.sh` aus dem entpackten Quellcode ausführen und die Erweiterung unter Safari → Einstellungen → Erweiterungen aktivieren.
- **Mobil**: Firefox Android (über eine eigene Add-on-Sammlung), Edge Android und Samsung Internet (über deren Stores). Chrome, Brave und Opera unter Android nehmen keine Erweiterungen an.

## Tastenkürzel

`Alt+Shift+O` an/aus · `D` Design · `L` Vorlesen · `G` Lineal · `Alt+Shift+P` Aufnahmemenü · `Alt+Shift+H` nummerierte Beschriftungen · `Alt+Shift+S` Scanning. Änderbar in den Tastenkürzel-Einstellungen der Browser-Erweiterungen (das Popup hat eine Schaltfläche dafür).

## Datenschutz

Keine Netzwerkanfragen, keine Telemetrie, keine Konten. Bildschirmfotos und Aufnahmen werden lokal in Ihrem Browser erstellt und gespeichert.

## Bekannte Grenzen

- Safari und Samsung Internet haben keine Unternehmensrichtlinien (managed); Firefox Android hat keine Bildschirmaufnahme.
- Safari iOS kann Bildschirmfotos beschneiden; nutzen Sie die Bereichs- oder Elementaufnahme.
- Live in Chrome geprüft; Firefox, Safari und die übrigen Browser wurden statisch begutachtet.

## Lizenz

MIT — Copyright Alexandru-Ionuț Chiuță (Alexio).

## Unterstützung

Wenn Claritas Ihnen hilft, können Sie die Arbeit unterstützen: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

Prüfstatus (v1.6.0): automatisch in CI getestet auf Chromium, Edge, Brave, Firefox (mehrere Kanäle), echtem Safari 27.2 (macOS), Safari 26.2 im iPhone/iPad-Simulator, Chrome 113 und Firefox 162 auf Android 14 (Emulator). Nicht verifiziert: Opera, Vivaldi, echtes Samsung Internet, die in echtem Safari/iOS aktivierte Erweiterung, Chrome-Markenversion. Alt+Shift+O/D/L/G sind im Browser änderbar; P/H/S/M sind fest. Die Definitionsschaltfläche öffnet dexonline.ro oder Wiktionary nur auf Klick.

## Optionale Module (v1.7)
Alle sind standardmäßig aus (Popup → „Mehr“ → „Optionale Module (v1.7)“). Es gibt keine Telemetrie; die Schaltfläche „Was verlässt den Browser?“ liest den Code der Erweiterung und listet gefundene Adressen und Netzwerkaufrufe.
- **Schnellnavigation**: Alt+Umschalt+J/K nächste/vorherige Überschrift, M/N nächster/vorheriger Bereich, L filterbare Liste von Bereichen, Überschriften und Links, G Absatz-Spotlight; größerer sichtbarer Fokus.
- **Sprachsteuerung** (Alt+Umschalt+V): Befehle wie „next heading“, „zoom in“, „read“, „help“. In Chrome verarbeitet der Spracherkennungsdienst des Browsers das Audio; Firefox hat ihn nicht.
- **Zusammenfassung, vereinfachter Text, Glossar** (Alt+Umschalt+Y): Zusammenfassung durch statistische Satzauswahl (keine KI; nutzt Chromes lokales Modell nur, wenn „Lokale KI“ an und verfügbar ist), Vereinfachung teilt nur lange Sätze, Glossar der auf der Seite definierten Abkürzungen und langer Wörter (mit dem lokalen Wörterbuch, falls importiert).
- **Beschreibungen für Bilder ohne Alt**: aus Bildunterschrift, Titel, Linktext oder Dateiname; als „automatisch erzeugt“ markiert. Das Bild wird nicht analysiert.
- **Live-Untertitel** (Alt+Umschalt+C): nur vom Mikrofon aufgenommene Sprache, nicht Ton aus Videos oder der Seite.
- **Neue Profile**: Ältere, Tremor/Motorik, Lichtempfindlichkeit, ADHS/Konzentration.
- **Website-Regeln**: Export/Import als JSON oder Liste zu deaktivierender Domains.
- **Audit-Bericht**: HTML, CSV oder JSON mit Zuordnung zu WCAG 2.2 / EN 301 549, Korrekturvorschlägen und Vergleich mit einer gespeicherten Referenz.
- **CI-Modus**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (Exit-Code 1 bei Überschreitung). Deckt nur die automatischen Regeln von Claritas ab.
- **Geprüft (Chromium, echte Erweiterung)**: 36 Prüfungen in `test/t14_v17.py`. **Nicht geprüft**: Spracherkennung mit echter Sprache (nur Start/Stopp und Befehlsparser), Live-Untertitel mit echter Sprache, die Module in Firefox/Safari.

## Optionale Module (v1.6)
Alle sind standardmäßig aus (Popup → „Optionale Module“); nichts verlässt den Browser. Wortarten im Leser (Rumänisch/Englisch, heuristisch), zusätzliche Prüfregeln (ARIA, Formulare, main, Zoom, Untertitel), lokales Wörterbuch (eigene JSON-/TSV-Datei, max. 4 MB), Einstellungs-Sync über `storage.sync` des Browsers (ohne Wörterbuch und Aufnahmen) und lokale OCR im separaten Paket `claritas-*-ocr.zip` (~20 MB; nur in Chromium automatisch geprüft, Firefox/Safari nicht geprüft).
