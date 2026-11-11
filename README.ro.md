# Claritas

[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versiune: 1.5.3 · Ultima actualizare: 11.11.2026**

Extensie gratuită de accesibilitate all-in-one. Fără telemetrie, fără rețea, fără conturi: totul rămâne în browserul tău.

## Ce face
- **Corecție automată a contrastului (WCAG AA/AAA)**: măsoară contrastul real text/fundal și ajustează doar textul insuficient, inclusiv câmpurile dezactivate.
- **Teme cu contrast mare**, filtre de culoare, **daltonism** (corecție și simulare), filtru de lumină albastră, simulator de vedere.
- **Text**: zoom pagină, mărime, spațieri, fonturi (prietenos cu dislexia, Lexend, Atkinson Hyperlegible), aliniere la stânga.
- **Citire**: riglă, mască, lupă, mod cititor, citire rapidă, citire cu voce (voci locale), evidențieri cu export.
- **Motricitate și control**: ținte de clic mari, clic prin menținere, scanare cu un singur buton, etichete numerotate, deblocare lipire.
- **Calm și stabilitate**: ascunde bannere și ferestre pop-up, reflow, oprește GIF-urile, păstrează focusul vizibil.
- **Audit WCAG 2.2** cu monitorizare continuă și verificări manuale.
- **Captură de ecran locală** (zonă vizibilă, regiune, toată pagina, element) cu adnotări, acoperire automată a datelor personale (inclusiv în cadre și shadow DOM) și un ZIP cu PNG + descriere (.md).
- **Înregistrare locală a ecranului** cu inele la clic, taste afișate și jurnal de acțiuni WebVTT.
- **Profile**, setări per site, export/import JSON, politici de întreprindere (managed storage).
- **8 limbi**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Instalare

Alege pachetul potrivit browserului (în folderul `dist/` sau în fișierele de versiune):

| Pachet | Browsere |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale și orice browser Chromium 109+ |
| `claritas-firefox.zip` | Firefox (desktop 140+ și Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (necesită un Mac cu Xcode) |

- **Familia Chromium**: dezarhivează, deschide pagina de extensii (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), activează *Mod dezvoltator*, alege *Încarcă extensie despachetată* și selectează folderul.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Load Temporary Add-on* → `manifest.json`. Pentru instalare permanentă, semnează-l ca add-on nelistat pe addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari**: pe un Mac cu Xcode rulează `./build-safari.sh` din sursa dezarhivată, apoi activează-l în Safari → Setări → Extensii.
- **Mobil**: Firefox Android (prin colecție personalizată de add-on-uri), Edge Android și Samsung Internet (prin magazinele lor). Chrome, Brave și Opera pe Android nu acceptă extensii.

## Scurtături

`Alt+Shift+C` pornit/oprit · `T` temă · `R` citire cu voce · `G` riglă · `Alt+Shift+P` meniul de captură · `Alt+Shift+H` etichete numerotate · `Alt+Shift+S` scanare. Se schimbă din setările de scurtături ale extensiilor din browser (popup-ul are un buton pentru asta).

## Confidențialitate

Fără cereri de rețea, fără telemetrie, fără conturi. Capturile și înregistrările se creează și se salvează local, în browser.

## Limite cunoscute

- Safari și Samsung Internet nu au politici de întreprindere (managed); Firefox Android nu are înregistrare de ecran.
- Safari iOS poate decupa capturile; folosește captura de regiune sau de element.
- Verificat live în Chrome; Firefox, Safari și celelalte browsere au fost analizate static.

## Licență

MIT — drepturi de autor Alexandru-Ionuț Chiuță (Alexio).

## Susținere

Dacă Claritas te ajută, poți sprijini munca: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

## Audit v1.5.3 → v1.5.4
- Cadrele sandbox (opace) sunt acum acoperite la captură (`match_origin_as_fallback`); iframe-urile din shadow DOM la fel (masca se trimite mereu).
- Descrierile din magazin ≤ 132 caractere în toate cele 8 limbi.
- Încărcarea limbilor: la eșec nu se mai reîncearcă la nesfârșit; `t()` nu mai interpretează `$&` din valori și ignoră coduri de limbă ostile.
- WebM: durata se scrie doar dacă fișierul nu are SeekHead și Segment cu dimensiune necunoscută (altfel nu se atinge).
- Mesajul de încărcare a limbii pleacă doar din cadrul de sus.

## Noutăți v1.5.2 — 8 limbi și alternative la limitele browserelor
- Interfață și documentație în 8 limbi (EN, RO, FR, IT, ES, PT, DE, HU); limbile noi se încarcă la cerere, din pachet, fără rețea.
- Cadrele (iframe) din alte origini își acoperă singure datele personale la captură; un singur ZIP (PNG + .md) în loc de două descărcări; durata scrisă în fișierul WebM; PNG original neatins când imaginea nu e modificată (Brave); acoperirea citește și valorile câmpurilor și shadow DOM deschis.
- Popup: buton pentru acordarea accesului la toate site-urile, buton către setările de scurtături, înregistrarea dezactivată unde browserul nu o suportă.
- Recorder: avertizare la închiderea filei, oprire automată la 2 h, puls anti-sesiune blocată.

## Noutăți v1.5 — captură de ecran și înregistrare, 100 % locale
- **Captură** (popup → Instrumente, sau Alt+Shift+P în pagină): zona vizibilă, regiune, toată pagina (derulare automată și lipire; barele fixe apar o singură dată), un element (alegere cu mouse sau tastatură), cu întârziere de 5 s pentru meniuri.
- **Acoperire automată a datelor personale** (e-mail, telefon RO, CNP, IBAN, card cu verificare Luhn, câmpuri de parolă): negru plin în imaginea finală, se poate dezactiva.
- **Editor** cu săgeată, dreptunghi, evidențiere, neclaritate, acoperire neagră, text, pași numerotați, creion — complet utilizabil de la tastatură (cursor virtual). Export PNG, clipboard sau **PNG + .md** cu descriere alternativă, pași, titluri vizibile și textul alt al imaginilor.
- **Înregistrare ecran** (pagina `recorder.html`): filă/fereastră/ecran, microfon și sunet, calitate la alegere; în pagină apar inele la clic, tastele apăsate (nu textul tastat în câmpuri), parolele sunt estompate, Alt+Shift+M pune marcaje. Rezultă video și **jurnal de acțiuni .vtt** (clic, taste, marcaje, pagini) — transcript accesibil al demonstrației.
- Nicio cerere de rețea, nimic încărcat; fișierele merg direct în Descărcări. Pe pagini file:// Chrome cere „Permite accesul la URL-uri de fișiere".
- Limite: pagini interne (chrome://, magazinul de extensii) nu pot fi capturate; derulare pe containere interne doar pentru cel mai mare container; înregistrarea cu MediaRecorder în Safari/Firefox neverificată.

## Noutăți v1.4 (din STUDIU_ACTUALIZARE_2026-11-11.md)
- **Preferințe de sistem**: respectă `forced-colors`, `prefers-contrast`, `prefers-reduced-motion`, `prefers-reduced-transparency` (setare „osPrefs").
- **Fonturi încorporate** (SIL OFL): Lexend, Atkinson Hyperlegible, OpenDyslexic — încărcate prin FontFace, fără dependență de CSP-ul paginii. OpenDyslexic nu are ă/ș/ț: se folosește Lexend pentru ele.
- **Calm și stabilitate**: mod calm (cookie/pop-up/chat/redare automată), bare fixe dezlipite, focus care nu dispare sub bare fixe, reflow, GIF-uri înghețate, profil „Calm".
- **Motricitate**: etichete numerotate (Alt+Shift+H), scanare cu un singur comutator (Alt+Shift+S), lipire/copiere deblocată, buton plutitor, marcaj pentru linkuri externe/descărcări.
- **Media și voce**: subtitrări mari, viteză media, voci locale preferate, limba vocii detectată din text, text alternativ vizibil.
- **Lectură**: silabe, focus pe rânduri, indice LIX, font Lexend/Atkinson; rezumat/traducere cu AI local Chrome (opțional, doar dacă modelul e deja descărcat).
- **Audit**: WCAG 2.2 (focus acoperit, spațiere text 1.4.12, autocomplete parolă), audit continuu, listă de verificări manuale.
- **Simulări**: strălucire, astigmatism, dislexie (litere amestecate).
- **Politică de administrare** (`storage.managed`): proprietăți JSON `defaults`, `enforce`, `sites`; setările impuse sunt blocate în popup. Neverificat pe un Chrome cu politici reale.
- Teste: `test/t7_v14.py` (+ regresii t2–t6). 

## Noutăți v1.3 (studiu comparativ → funcții clean-room)

Vezi `STUDIU_COMPARATIV.md` (produse studiate, matrice funcție × produs, ce nu s-a implementat și de ce).
Adăugat: voce cu evidențiere pe propoziție/cuvânt, pauză/anterior/următor, ton și alegere voce, citire la hover; **mod lectură** (bionic, fir de culoare pe rânduri, RSVP, teme/fonturi/lățime); **evidențiator persistent** (4 culori, export Markdown); bară de acțiuni la selecție; **ascundere elemente** cu click; **audit de accesibilitate** (21 de tipuri de constatări) + structura paginii + statistici de lizibilitate; derulare automată; click prin staționare (dwell); ținte mari; inel în jurul cursorului; folii colorate; rotire nuanță; simulatoare de vedere (încețoșare, cataractă, tubular, pierdere centrală); programare automată a temei (oră / sistem); mod listă albă; moștenire pe subdomenii; lățime maximă paragraf; oprire sunet la redare automată; profiluri „Abilități motorii” și „Citire confortabilă”.
Corecție: limita contrastului din setări era 150 % deși interfața permite 200 %.
Teste noi: `test/t5_features.py`, `test/t6_popup_tools.py`.

## Jurnal audit adversarial (v1.2)

Defecte confirmate și corectate:
- **Injecție CSS** prin culorile temei personalizate și prin fișierul JSON importat (valori nevalidate ajungeau în foaia de stil). Acum orice setare trece prin `CLR.sanitize` (liste albe, limite numerice, culori doar `#rgb/#rrggbb`) la citire, la import și la aplicare.
- **Crash la `cb` invalid** (`cbMatrix` arunca excepție și oprea `apply()`); valori numerice `NaN`/`Infinity` în CSS; chei `__proto__`/`constructor` în `sites`.
- **Lupa** putea afișa mărit valoarea câmpurilor de parolă / card (`autocomplete=cc-*`, OTP) — acum excluse.
- **Limba**: o setare per-site copiată suprascria selectorul de limbă; acum limba e mereu globală.
- **Stivă depășită** pe DOM foarte adânc (`effBg` recursiv) → iterativ; o eroare la un nod nu mai abandonează tot parcursul paginii.
- **Performanță**: parcurgeri duplicate (dedupe pe rădăcini), limită de noduri, scrieri în storage grupate (glisoare), fără furtună de re-aplicări.
- **Context orfan** după actualizarea/reîncărcarea extensiei: scriptul se oprește curat, fără erori.
- **Contrast la hover**: regula `:not(:hover)` lăsa elemente cu contrast slab la trecerea mouse-ului → eliminată.
- Iframe-uri: respectă acum setarea per-site a paginii-gazdă (unde `ancestorOrigins` există); TTS: limbă validată, pornire întârziată după `cancel()` (bug Chrome); export: ancoră atașată în DOM (Firefox); import limitat la 1 MB.

Teste: `test/t4_hostile.py` (setări corupte/ostile, CSS injection, parole, shadow DOM, DOM adânc, per-site, teardown, dark+daltonism+overlay) + t1–t3 — toate trec în Chrome real. Neverificat: Safari, Opera, Firefox rulat efectiv (doar lint + compilare pe ținte vechi).

Limite rămase (nu se pot rezolva fiabil): rădăcini shadow *closed* inaccesibile; elemente cu `background-image: url()` sunt sărite (contrast necunoscut); `url(#clr-cb)` poate eșua cu `<base href>` sau după `pushState` în unele pagini; atributele `data-clr-*` și `#clr-style` sunt detectabile de pagină; exportul de setări conține lista site-urilor cu setări proprii.

## Limite cunoscute
- Paginile interne ale browserului (`chrome://`, `about:`, magazinele de extensii, vizualizatorul PDF) nu pot fi modificate de extensii.
- Fundalurile cu **imagini** (nu gradiente) nu pot fi măsurate; temele de contrast mare le elimină.
- Fontul „prietenos cu dislexia” folosește OpenDyslexic / Lexend / Atkinson Hyperlegible dacă sunt instalate în sistem.
- Pe browserele fără API pentru zoom (`tabs.setZoom`) și fără scurtături (unele mobile) aceste comenzi lipsesc automat.
- Testat automat doar în Chrome (extensie reală încărcată, capturi și măsurători) și validat cu `web-ext lint` pentru Firefox. Opera, Edge, Brave, Vivaldi etc. folosesc același motor și același pachet, dar nu au fost rulate aici.

## Structură
`extension/` sursa comună · `manifests/` manifest per familie de browsere · `build.py` generează `dist/*.zip` · `test/` scripturi Playwright.
