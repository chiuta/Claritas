# Claritas — Adatvédelmi irányelvek

**1.10.2 verzió · Utolsó frissítés: 2026. nov. 18.** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · [Français](PRIVACY.fr.md) · [Italiano](PRIVACY.it.md) · [Español](PRIVACY.es.md) · [Português](PRIVACY.pt.md) · [Deutsch](PRIVACY.de.md) · Magyar

> Gépi segítséggel készült fordítás, anyanyelvi lektorálás még nem történt. Eltérés esetén az angol szöveg (PRIVACY.md) az irányadó.

A Claritas ingyenes, nyílt forráskódú (MIT) akadálymentesítési bővítmény. **Nincs benne telemetria, elemzés, fiók, és saját szervere sincs.** Ez a dokumentum pontosan leírja, mit tárol, és a ritka eseteket, amikor a böngésző (nem a Claritas) harmadik féllel kommunikál.

## Mit tárol a Claritas
Minden a böngésző bővítménytárolójában (`storage.local`) van:
- a beállítások, profilok és oldalankénti szabályok;
- az Ön által bekapcsolt opcionális funkciók: olvasólista és jegyzetek, oldalankénti CSS, importált szótárfájl, kiemelések.

A képernyőképek és a képernyőfelvételek a böngészőben készülnek, és közvetlenül a Letöltések mappába kerülnek. A Claritas soha nem tölti fel őket.

Mindent exportálhat vagy törölhet a felugró ablakból, vagy a bővítmény eltávolításával.

## Mit olvas a Claritas
A feladata ellátásához (kontraszt javítása, felolvasás, ellenőrzés stb.) a tartalmi szkript **a böngészőn belül** olvassa a meglátogatott oldalakat. A Claritas az oldaltartalmat sehová sem küldi. Az opcionális modulok paneljén a „Mi hagyja el a böngészőt?” gomb a bővítmény saját kódját olvassa, és felsorol minden talált hálózati hívást, így Ön is ellenőrizheti.

A háttérkép fölötti szöveg kontrasztjának becsléséhez a tartalmi szkript helyben dekódolhatja a képet (kis vászon), ha az `data:`/`blob:` kép, vagy az oldallal azonos webhelyről származik (általában már a gyorsítótárban van). Más webhelyek képeit a Claritas soha nem tölti le, és a képről semmi nem kerül tárolásra vagy küldésre.

## Esetek, amikor adat elhagyhatja a böngészőt
Alapértelmezés szerint soha nem aktívak, vagy csak az Ön kifejezett műveletére:
1. **Meghatározás gomb**: új lapon megnyitja a dexonline.ro-t vagy a Wikiszótárt, csak ha megnyomja. Ezek az oldalak látják a keresett szót.
2. **Hangvezérlés és élő feliratok (Chrome)**: a böngésző beszédfelismerő szolgáltatása dolgozza fel a hangot a Google feltételei szerint. A Firefoxban nincs ilyen szolgáltatás.
3. **Beállítások szinkronizálása (alapból kikapcsolva)**: a böngésző saját `storage.sync` tárolóját használja, amelyet a böngészőgyártó szinkronizál. Csak a beállítások és az oldalankénti szabályok kerülnek bele, a szótár, jegyzetek, képernyőképek és felvételek soha.
4. **Eszközön futó MI (alapból kikapcsolva)**: a Chrome Prompt API-ját használja a számítógépen már meglévő modellel. A Claritas nem küld oldalszöveget semmilyen szervernek; a Chrome letöltheti a saját modelljét, ez a Chrome működése.
5. **Opcionális csomagok** (`-ocr`, `-axe`, `-pdf`): a csomag részei, helyben futnak, nem kezdeményeznek kéréseket.

## Engedélyek
- `storage`: a beállítások mentése.
- Hozzáférés minden webhelyhez (tartalmi szkript `<all_urls>` mintán, minden keretben): szükséges a kontrasztjavítások, témák és eszközök alkalmazásához bármely oldalon, ahol használni kívánja őket. A bővítmény globálisan vagy webhelyenként kikapcsolható.

## Gyermekek
A Claritas senkitől nem gyűjt személyes adatot, a gyermekektől sem.

## Változások
Az irányelvek változásai ebben a fájlban és a tárhely előzményeiben jelennek meg: https://github.com/chiuta/Claritas

## Kapcsolat
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
