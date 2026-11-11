# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md)

**Version: 1.5.3 · Letzte Aktualisierung: 11.11.2026**

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

`Alt+Shift+C` an/aus · `T` Design · `R` Vorlesen · `G` Lineal · `Alt+Shift+P` Aufnahmemenü · `Alt+Shift+H` nummerierte Beschriftungen · `Alt+Shift+S` Scanning. Änderbar in den Tastenkürzel-Einstellungen der Browser-Erweiterungen (das Popup hat eine Schaltfläche dafür).

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
