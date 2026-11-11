# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

**Verzió: 1.6.0 · Utolsó frissítés: 2026. 11. 12.**

Ingyenes, mindent egyben tartalmazó akadálymentesítő bővítmény. Nincs telemetria, nincs hálózat, nincs fiók: minden a böngészőjében marad.

## Mit tud
- **Automatikus kontrasztjavítás (WCAG AA/AAA)**: méri a valódi szöveg/háttér kontrasztot, és csak a nem elégséges szöveget igazítja, a letiltott mezőket is.
- **Nagy kontrasztú témák**, színszűrők, **színtévesztés** (korrekció és szimuláció), kékfényszűrő, látásszimulátor.
- **Szöveg**: nagyítás, méret, térközök, betűtípusok (diszlexiabarát, Lexend, Atkinson Hyperlegible), balra igazítás.
- **Olvasás**: vonalzó, maszk, nagyító, olvasó mód, gyorsolvasás, felolvasás (helyi hangok), exportálható kiemelések.
- **Mozgás és vezérlés**: nagy kattintási célpontok, rámutatásos kattintás, egykapcsolós pásztázás, számozott címkék, beillesztés feloldása.
- **Nyugalom és stabilitás**: elrejti a sávokat és felugró ablakokat, újratördelés, megállítja a GIF-eket, láthatóan tartja a fókuszt.
- **WCAG 2.2 ellenőrzés** folyamatos figyeléssel és kézi ellenőrzésekkel.
- **Helyi képernyőkép** (látható terület, terület, teljes oldal, elem) jegyzetekkel, a személyes adatok automatikus eltakarásával (keretekben és shadow DOM-ban is), valamint PNG + leírás (.md) ZIP-ben.
- **Helyi képernyőfelvétel** kattintásgyűrűkkel, megjelenített billentyűkkel és WebVTT műveletnaplóval.
- **Profilok**, oldalankénti beállítások, JSON exportálás/importálás, vállalati szabályzatok (managed storage).
- **8 nyelv**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Telepítés

Válassza a böngészőjének megfelelő csomagot (`dist/` mappa vagy a kiadás fájljai):

| Csomag | Böngészők |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale és minden Chromium 109+ böngésző |
| `claritas-firefox.zip` | Firefox (asztali 140+ és Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (Xcode-dal rendelkező Mac szükséges) |

- **Chromium család**: csomagolja ki, nyissa meg a bővítmények oldalát (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), kapcsolja be a *Fejlesztői módot*, válassza a *Kicsomagolt bővítmény betöltése* lehetőséget, és jelölje ki a mappát.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Ideiglenes kiegészítő betöltése* → `manifest.json`. Végleges telepítéshez írja alá nem listázott kiegészítőként az addons.mozilla.org oldalon (azonosító: `claritas@trom.tf`).
- **Safari**: Xcode-dal rendelkező Macen futtassa a `./build-safari.sh` parancsot a kicsomagolt forrásból, majd kapcsolja be a Safari → Beállítások → Bővítmények alatt.
- **Mobil**: Firefox Android (egyéni kiegészítőgyűjteményen át), Edge Android és Samsung Internet (a saját áruházukon át). A Chrome, a Brave és az Opera Androidon nem fogad bővítményeket.

## Billentyűparancsok

`Alt+Shift+O` be/ki · `D` téma · `L` felolvasás · `G` vonalzó · `Alt+Shift+P` rögzítési menü · `Alt+Shift+H` számozott címkék · `Alt+Shift+S` pásztázás. A böngésző bővítmény-billentyűparancs beállításaiban módosíthatók (a felugró ablakban gomb is van hozzá).

## Adatvédelem

Nincsenek hálózati kérések, nincs telemetria, nincs fiók. A képernyőképek és felvételek helyben, a böngészőben készülnek és mentődnek.

## Ismert korlátok

- A Safari és a Samsung Internet nem támogat vállalati (managed) szabályzatokat; a Firefox Androidon nincs képernyőfelvétel.
- A Safari iOS levághatja a képernyőképeket; használja a terület- vagy elemrögzítést.
- Élőben Chrome-ban ellenőrizve; a Firefoxot, a Safarit és a többi böngészőt statikusan vizsgáltuk.

## Licenc

MIT — szerzői jog: Alexandru-Ionuț Chiuță (Alexio).

## Támogatás

Ha a Claritas segít Önnek, támogathatja a munkát: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

Ellenőrzési állapot (v1.6.0): automatikusan tesztelve CI-ben: Chromium, Edge, Brave, Firefox (több csatorna), valódi Safari 27.2 macOS-en, Safari 26.2 iPhone/iPad szimulátorban, Chrome 113 és Firefox 162 Android 14-en (emulátor). Nem ellenőrzött: Opera, Vivaldi, valódi Samsung Internet, a valódi Safari/iOS-ben aktivált bővítmény, márkás Chrome. Az Alt+Shift+O/D/L/G a böngészőben átállítható; a P/H/S/M rögzített. A definíció gomb csak kattintásra nyitja meg a dexonline.ro-t vagy a Wiktionaryt.

## Választható modulok (v1.6)
Mind alapból ki van kapcsolva (felugró ablak → „Választható modulok”); semmi sem hagyja el a böngészőt. Szófajok az Olvasóban (román/angol, heurisztikus), kiegészítő ellenőrzési szabályok (ARIA, űrlapok, main, nagyítás, feliratok), helyi szótár (saját JSON/TSV, max. 4 MB), a beállítások szinkronizálása a böngésző `storage.sync` tárolójával (szótár és felvételek nélkül) és helyi OCR a külön `claritas-*-ocr.zip` csomagban (~20 MB; automatikusan csak Chromiumban ellenőrizve, Firefox/Safari nem ellenőrzött).
