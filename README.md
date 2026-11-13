# Claritas

**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Version: 1.9.0 · Last updated: 14 Nov 2026**

Free all-in-one accessibility extension. No telemetry, no network, no accounts: everything stays in your browser.

## What it does
- **Automatic contrast fix (WCAG AA/AAA)**: measures the real text/background contrast and adjusts only insufficient text, including disabled fields. Since 1.8.1 it also handles text over background images (average colour of images from the same origin or data: URLs, otherwise a cautious white/black choice plus a halo); small icons are not treated as backgrounds. Popup (1.9): search across all settings (`/` or Ctrl+K), quick actions (next theme, read aloud, text size), sticky tab bar with arrow-key navigation, last tab remembered.
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

Privacy policy: [PRIVACY.md](PRIVACY.md)

Website: https://claritas.chiuta.ro

Install: https://claritas.chiuta.ro/#instalare · `install/install.sh` · `install/install.ps1`

Verification status (v1.5.5): tested automatically in CI on Chromium, Edge, Brave, Firefox (several channels), real Safari 27.2 on macOS, Safari 26.2 in iPhone/iPad Simulator, Chrome 113 and Firefox 162 on Android 14 (emulator). Verified in CI on Linux for v1.7.0: Opera 140 (all 12 test files). Not verified: Vivaldi (it starts, but the automated debugging connection times out), real Samsung Internet, the extension activated inside real Safari/iOS, branded Chrome. Shortcuts Alt+Shift+O/D/L/G can be remapped in the browser; P/H/S/M are fixed. The definition button opens dexonline.ro or Wiktionary only when you click it.

## Optional modules (v1.8)
All are off by default (popup → “More” → “Optional modules (v1.8)”). Everything runs locally; nothing is sent anywhere.
- **Contrast inspector** (Alt+Shift+I): point at or focus any text to see its real colours, ratio, AA/AAA and a suggested fix; click to pin.
- **Tab-order map** (Alt+Shift+T): numbered badges in tab order, accessible name and role of each control, with problems (no name, positive tabindex, aria-hidden on a focusable element, focus jumping back).
- **Reading list and notes** (Alt+Shift+B): saves pages, selected text and notes in the browser; export to Markdown/JSON, import JSON.
- **Your own CSS per site** (Alt+Shift+U): stored locally; `@import` and external URLs are removed; starter snippets (static bars, underlined links, looser spacing, hide banners).
- **Formulas** (Alt+Shift+Q): spoken descriptions for MathML (fractions, powers, roots, sums, Greek letters; Romanian and English) and reading aloud.
- **Voice guide** (popup → Voice): ranks the voices for your language, local before online, with a test button.
- **On-device AI** (Alt+Shift+A, class B): questions about the page and suggested image descriptions through Chrome’s Prompt API (Chrome 148+ with the local model). Only with your consent; marked “auto-generated”. Not tested with a real model.
- **Optional packages**: `-axe` adds the axe-core audit (MPL-2.0) and `-pdf` a local PDF reader (pdf.js, Apache-2.0: contents, search, themes, read aloud, save .txt). Build them with `tools/fetch_vendor.sh` then `python build.py`.
- **Verified (Chromium, real extension)**: `test/t15_v18.py`. Firefox checks are in `test/ff_selenium.py`. Confirmed in CI (12 Nov 2026): Edge and Opera (Linux) with the same file, and the Firefox checks in `test/ff_selenium.py` on Linux and Windows (stable, ESR, beta, nightly, developer edition); macOS Firefox did not run (GitHub rate limit). Not covered: Safari, a real on-device model, the .md/.json file download.

## Optional modules (v1.7)
All are off by default (popup → “More” → “Optional modules (v1.7)”). There is no telemetry; the “What leaves the browser?” button reads the extension’s own code and lists the addresses and network calls it finds.
- **Quick navigation**: Alt+Shift+J/K next/previous heading, M/N next/previous landmark, L filterable list of landmarks, headings and links, G paragraph spotlight; larger visible focus.
- **Voice control** (Alt+Shift+V): commands such as “next heading”, “zoom in”, “read”, “help” (Romanian equivalents too). In Chrome the audio is processed by the browser’s speech service; Firefox does not have it.
- **Summary, simplified text, glossary** (Alt+Shift+Y): summary by statistical sentence selection (not AI; uses Chrome’s local model only if “Local AI” is on and available), simplification that only splits long sentences, glossary of abbreviations defined on the page plus long words (with the local dictionary if imported).
- **Descriptions for images without alt**: from caption, title, link text or file name; marked “auto-generated”. It does not analyse the image.
- **Live captions** (Alt+Shift+C): speech picked up by the microphone only, not audio playing in videos or the page.
- **New profiles**: older adults, tremor/motor, photosensitivity, ADHD/focus.
- **Site rules**: export/import as JSON or a list of domains to disable.
- **Audit report**: HTML, CSV or JSON with WCAG 2.2 / EN 301 549 mapping, fix suggestions and comparison with a saved baseline.
- **CI mode**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (exit code 1 above the threshold). Covers only Claritas’s automatic rules.
- **Verified (Chromium, real extension)**: 36 checks in `test/t14_v17.py` (navigation, list, spotlight, voice-command parser, alt, summary/glossary, reports, profiles, rule import, privacy panel, cleanup on disable). **Not verified**: speech recognition with real speech (only start/stop and the command parser), live captions with real speech, the modules on Firefox/Safari.

## Optional modules (v1.6)
All are off by default; switch them on in the popup → “Optional modules”. Nothing sends data outside the browser.
- **Parts of speech in Reader** (Romanian and English): noun ─, verb ╌, adjective ┈, adverb ═ (different underline styles, not colour alone). Heuristic, approximate.
- **Extra audit rules**: invalid ARIA role, broken ARIA references, unlabeled form fields, missing/duplicate `main`, focusable element inside `aria-hidden`, blocked zoom, video without captions, unnamed SVG, nested interactive elements, no skip link.
- **Local dictionary**: you import a JSON `{"word":"definition"}` or TSV file (max 4 MB); the 📖 button on the selection bar looks there first, then opens the online dictionary.
- **Settings sync** through the browser’s `storage.sync` (settings and per-site rules only; not the dictionary, captures or recordings). The most recent change wins.
- **Local OCR** (separate `claritas-chromium-ocr.zip` / `claritas-firefox-ocr.zip`, ~20 MB): bundled Tesseract.js with language data for all 8 languages; `ocr.html` page (button in the popup). Automatically verified in Chromium only; Firefox and Safari: not verified (Safari does not get the OCR pack).
