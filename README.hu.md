# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

**Verzió: 1.9.0 · Utolsó frissítés: 2026. 11. 14.**

Ingyenes, mindent egyben tartalmazó akadálymentesítő bővítmény. Nincs telemetria, nincs hálózat, nincs fiók: minden a böngészőjében marad.

## Mit tud
- **Automatikus kontrasztjavítás (WCAG AA/AAA)**: méri a valódi szöveg/háttér kontrasztot, és csak a nem elégséges szöveget igazítja, a letiltott mezőket is. Az 1.8.1-től a háttérképen lévő szöveget is kezeli (az azonos eredetű vagy data: képek átlagszíne, egyébként óvatos fehér/fekete választás körvonallal); a kis ikonokat nem tekinti háttérnek. Popup (1.9): keresés minden beállításban (`/` vagy Ctrl+K), gyorsműveletek (következő téma, felolvasás, szövegméret), rögzített fülsáv nyílbillentyűs navigációval, az utolsó fül megjegyzése.
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

Adatvédelmi irányelvek: [PRIVACY.md](PRIVACY.md)

Weboldal: https://claritas.chiuta.ro

Install: https://claritas.chiuta.ro/#instalare · `install/install.sh` · `install/install.ps1`

Ellenőrzési állapot (v1.6.0): automatikusan tesztelve CI-ben: Chromium, Edge, Brave, Firefox (több csatorna), valódi Safari 27.2 macOS-en, Safari 26.2 iPhone/iPad szimulátorban, Chrome 113 és Firefox 162 Android 14-en (emulátor). CI-ben Linuxon ellenőrizve a v1.7.0-hoz: Opera 140 (mind a 12 tesztfájl). Nem ellenőrzött: Vivaldi (elindul, de az automatikus hibakeresési kapcsolat időtúllépéssel jár), valódi Samsung Internet, a valódi Safari/iOS-ben aktivált bővítmény, márkás Chrome. Az Alt+Shift+O/D/L/G a böngészőben átállítható; a P/H/S/M rögzített. A definíció gomb csak kattintásra nyitja meg a dexonline.ro-t vagy a Wiktionaryt.

## Opcionális modulok (v1.8)
Alapértelmezetten mind ki van kapcsolva (felugró ablak → „Több” → „Opcionális modulok (v1.8)”). Minden helyben fut; semmi sem kerül máshová.
- **Kontrasztvizsgáló** (Alt+Shift+I): mutass egy szövegre vagy fókuszáld, és látod a valódi színeket, az arányt, az AA/AAA-t és egy javasolt javítást; kattintással rögzíthető.
- **Tabulátorsorrend-térkép** (Alt+Shift+T): számozott jelvények tabulátorsorrendben, minden vezérlő elérhető neve és szerepe, a hibákkal (név nélkül, pozitív tabindex, aria-hidden fókuszálható elemen, visszaugrások).
- **Olvasólista és jegyzetek** (Alt+Shift+B): oldalakat, kijelölt szöveget és jegyzeteket ment a böngészőben; exportálás Markdown/JSON, importálás JSON.
- **Saját CSS oldalanként** (Alt+Shift+U): helyben tárolva; az `@import` és a külső URL-ek törlődnek; kezdő minták (nem rögzített sávok, aláhúzott hivatkozások, térköz, szalagok elrejtése).
- **Képletek** (Alt+Shift+Q): felolvasott leírás MathML-hez (törtek, hatványok, gyökök, összegek, görög betűk; román és angol) és felolvasás.
- **Hangválasztó** (felugró ablak → Hang): rangsorolja a hangokat a nyelvedhez, a helyiek az online előtt, meghallgatás gombbal.
- **Helyi MI** (Alt+Shift+A, B osztály): kérdések az oldalról és javasolt képleírások a Chrome Prompt API-ján át (Chrome 148+ helyi modellel). Csak a beleegyezéseddel; „automatikusan generált” jelöléssel. Valódi modellel nem tesztelve.
- **Opcionális csomagok**: az `-axe` az axe-core vizsgálatot (MPL-2.0), a `-pdf` helyi PDF-olvasót (pdf.js, Apache-2.0: tartalom, keresés, témák, felolvasás, .txt mentés) ad. Építés: `tools/fetch_vendor.sh`, majd `python build.py`.
- **Ellenőrizve (Chromium, valódi bővítmény)**: `test/t15_v18.py`. A Firefox-ellenőrzések a `test/ff_selenium.py` fájlban vannak. CI-ben megerősítve (2026. 11. 12.): Edge és Opera (Linux) ugyanazzal a fájllal, valamint a `test/ff_selenium.py` Firefox-ellenőrzései Linuxon és Windowson (stabil, ESR, béta, nightly, developer edition); a macOS-es Firefox nem futott le (GitHub-korlát). Nem lefedett: Safari, valódi helyi modell, a .md/.json fájlok letöltése.

## Választható modulok (v1.7)
Alapértelmezetten mind ki van kapcsolva (popup → „Továbbiak” → „Opcionális modulok (v1.7)”). Nincs telemetria; a „Mi hagyja el a böngészőt?” gomb beolvassa a bővítmény kódját, és listázza a talált címeket és hálózati hívásokat.
- **Gyors navigáció**: Alt+Shift+J/K következő/előző címsor, M/N következő/előző tájékozódási pont, L szűrhető lista pontokból, címsorokból és linkekből, G bekezdés-reflektor; nagyobb, látható fókusz.
- **Hangvezérlés** (Alt+Shift+V): parancsok, pl. „next heading”, „zoom in”, „read”, „help”. Chrome-ban a hangot a böngésző beszédfelismerő szolgáltatása dolgozza fel; a Firefox nem támogatja.
- **Összefoglaló, egyszerűsített szöveg, szójegyzék** (Alt+Shift+Y): összefoglaló statisztikai mondatkiválasztással (nem MI; a Chrome helyi modelljét csak akkor használja, ha a „Helyi MI” be van kapcsolva és elérhető), az egyszerűsítés csak a hosszú mondatokat bontja, szójegyzék az oldalon definiált rövidítésekből és hosszú szavakból (az importált helyi szótárral).
- **Leírások alt nélküli képekhez**: felirat, cím, link szövege vagy fájlnév alapján; „automatikusan generált” jelöléssel. A képet nem elemzi.
- **Élő feliratok** (Alt+Shift+C): csak a mikrofon által rögzített beszéd, nem a videók vagy az oldal hangja.
- **Új profilok**: idősek, remegés/mozgás, fényérzékenység, ADHD/koncentráció.
- **Webhelyszabályok**: export/import JSON-ként vagy kikapcsolandó domainek listájaként.
- **Audit-jelentés**: HTML, CSV vagy JSON WCAG 2.2 / EN 301 549 megfeleltetéssel, javítási javaslatokkal és mentett referenciával való összevetéssel.
- **CI mód**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (1-es kilépési kód a küszöb túllépésekor). Csak a Claritas automatikus szabályait fedi le.
- **Ellenőrizve (Chromium, valódi bővítmény)**: 36 ellenőrzés a `test/t14_v17.py` fájlban. **Nem ellenőrzött**: beszédfelismerés valódi beszéddel (csak indítás/leállítás és a parancsértelmező), élő feliratok valódi beszéddel, a modulok Firefoxban/Safariban.

## Választható modulok (v1.6)
Mind alapból ki van kapcsolva (felugró ablak → „Választható modulok”); semmi sem hagyja el a böngészőt. Szófajok az Olvasóban (román/angol, heurisztikus), kiegészítő ellenőrzési szabályok (ARIA, űrlapok, main, nagyítás, feliratok), helyi szótár (saját JSON/TSV, max. 4 MB), a beállítások szinkronizálása a böngésző `storage.sync` tárolójával (szótár és felvételek nélkül) és helyi OCR a külön `claritas-*-ocr.zip` csomagban (~20 MB; automatikusan csak Chromiumban ellenőrizve, Firefox/Safari nem ellenőrzött).
