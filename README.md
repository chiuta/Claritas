# Claritas

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version: 1.6.0 · Last updated: 12 Nov 2026**

Free all-in-one accessibility extension. No telemetry, no network, no accounts: everything stays in your browser.

## What it does
- **Automatic contrast fix (WCAG AA/AAA)**: measures the real text/background contrast and adjusts only insufficient text, including disabled fields.
- **High-contrast themes**, colour filters, **colour-blindness** correction and simulation, blue-light filter, vision simulator.
- **Text**: page zoom, text size, spacing, fonts (dyslexia-friendly, Lexend, Atkinson Hyperlegible), left alignment.
- **Reading**: ruler, mask, magnifier, reader mode, speed reading, read aloud (local voices), highlights with export.
- **Motor and control**: large click targets, dwell click, single-switch scanning, numbered labels, unblock paste.
- **Calm and stability**: hides banners and pop-ups, reflow, freezes GIFs, keeps focus visible.
- **WCAG 2.2 audit** with continuous monitoring and manual checks.
- **Local screenshot** (visible area, region, whole page, element) with annotations, automatic covering of personal data (also inside frames and shadow DOM) and a ZIP with PNG + description (.md).
- **Local screen recording** with click and key overlay and a WebVTT action log.
- **Profiles**, per-site settings, JSON export/import, enterprise policies (managed storage).
- **8 languages**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Installation

Pick the package that matches your browser (in the `dist/` folder or the release assets):

| Package | Browsers |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale and any Chromium 109+ browser |
| `claritas-firefox.zip` | Firefox (desktop 140+ and Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (needs a Mac with Xcode) |

- **Chromium family**: unzip, open the extensions page (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), turn on *Developer mode*, choose *Load unpacked* and select the folder.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → `manifest.json`. For a permanent install, sign it as an unlisted add-on on addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari**: on a Mac with Xcode run `./build-safari.sh` from the unzipped source, then enable it in Safari → Settings → Extensions.
- **Mobile**: Firefox Android (via a custom add-on collection), Edge Android and Samsung Internet (via their stores). Chrome, Brave and Opera on Android do not accept extensions.

## Shortcuts

`Alt+Shift+O` on/off · `D` theme · `L` read aloud · `G` ruler · `Alt+Shift+P` screenshot menu · `Alt+Shift+H` numbered labels · `Alt+Shift+S` scanning. Change them in your browser’s extension shortcut settings (the popup has a button for it).

## Privacy

No network requests, no telemetry, no accounts. Screenshots and recordings are created and saved locally in your browser.

## Known limits

- Safari and Samsung Internet have no enterprise (managed) policies; Firefox Android has no screen recording.
- Safari iOS may crop screenshots; use region or element capture.

## License

MIT — copyright Alexandru-Ionuț Chiuță (Alexio).

## Support

If Claritas helps you, you can support the work: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

Verification status (v1.5.5): tested automatically in CI on Chromium, Edge, Brave, Firefox (several channels), real Safari 27.2 on macOS, Safari 26.2 in iPhone/iPad Simulator, Chrome 113 and Firefox 162 on Android 14 (emulator). Not verified: Opera, Vivaldi, real Samsung Internet, the extension activated inside real Safari/iOS, branded Chrome. Shortcuts Alt+Shift+O/D/L/G can be remapped in the browser; P/H/S/M are fixed. The definition button opens dexonline.ro or Wiktionary only when you click it.

## Optional modules (v1.6)
All are off by default; switch them on in the popup → “Optional modules”. Nothing sends data outside the browser.
- **Parts of speech in Reader** (Romanian and English): noun ─, verb ╌, adjective ┈, adverb ═ (different underline styles, not colour alone). Heuristic, approximate.
- **Extra audit rules**: invalid ARIA role, broken ARIA references, unlabeled form fields, missing/duplicate `main`, focusable element inside `aria-hidden`, blocked zoom, video without captions, unnamed SVG, nested interactive elements, no skip link.
- **Local dictionary**: you import a JSON `{"word":"definition"}` or TSV file (max 4 MB); the 📖 button on the selection bar looks there first, then opens the online dictionary.
- **Settings sync** through the browser’s `storage.sync` (settings and per-site rules only; not the dictionary, captures or recordings). The most recent change wins.
- **Local OCR** (separate `claritas-chromium-ocr.zip` / `claritas-firefox-ocr.zip`, ~20 MB): bundled Tesseract.js with language data for all 8 languages; `ocr.html` page (button in the popup). Automatically verified in Chromium only; Firefox and Safari: not verified (Safari does not get the OCR pack).
