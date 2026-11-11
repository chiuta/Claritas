# Claritas — recenzie adversarială și comparativă pe browsere (v1.5.0 → v1.5.2)
Data: 2026-11-11. Verificare live: doar Chrome real (Playwright). Celelalte browsere: analiză statică și documentație.

## 1. Defecte găsite și stare
| # | Severitate | Defect | Stare |
|---|---|---|---|
| 1 | Mare | Acoperirea datelor personale nu citea valorile din `input` (email/tel) și `textarea`, decât după nume/id | Reparat, verificat (t10) |
| 2 | Mare | Shadow DOM deschis nescanat (e-mail vizibil în captură) | Reparat, verificat |
| 3 | Mare | CSS ostil al paginii (`html>*{display:none!important}`) ascundea editorul; `hideUi/showUi` suprascriau fără `!important` | Reparat (element propriu + `!important` inline), verificat |
| 4 | Medie | Regex de e-mail nemărginit (risc ReDoS); text de 400 KB: 0,5 s după mărginire și tăiere la 20 000 caractere | Reparat, verificat |
| 5 | Medie | Jurnalul înregistrării putea afișa/loga caractere simple tastate (ex. parole în câmpuri personalizate) | Reparat: niciun caracter simplu nu se mai afișează |
| 6 | Medie | `recSession` rămânea „activ” după un crash; evenimentul `nav` se repeta la fiecare actualizare | Reparat: puls la 5 s, ignorat dacă e mai vechi de 30 s, sincronizare idempotentă |
| 7 | Medie | Recorder fără avertisment la închiderea filei, fără plafon, `AudioContext` posibil suspendat | Reparat: `beforeunload`, oprire automată la 2 h, `resume()` |
| 8 | Mică | Popup se închidea în tăcere când captura eșua | Reparat: mesaj `cap_fail` afișat |

## 2. Limite tratate în v1.5.2 prin metode alternative
| Limită | Metodă alternativă | Stare |
|---|---|---|
| iframe cross-origin neacoperit | Fiecare cadru își acoperă singur datele (mască neagră) cât timp pagina de sus face captura; mesaj prin background | Verificat în Chrome (320 pixeli negri în cadru) |
| Două descărcări (PNG + .md) | Un singur ZIP fără comprimare, cu PNG + .md, scris local | Verificat (ZIP valid, 1 descărcare) |
| `contenteditable` | Era deja acoperit prin scanarea textului (afirmația anterioară era greșită) | Verificat |
| WebM fără Duration | Durata se scrie în antetul Info la oprire | Verificat: ffprobe 3,94 s, decodare fără erori. Cues tot lipsesc, dar bara de timp funcționează |
| Brave „farbling” în PNG | Imaginea nemodificată se exportă ca PNG original, fără re-codare prin canvas | Implementat; Brave nu a putut fi testat |
| Safari iOS decupare | Detectare prin raportul lățime/înălțime al imaginii vs. fereastră și mesaj cu alternativa (regiune/element) | Implementat; neverificat pe iOS |
| Acces la site-uri retras (Chrome „la clic”, Firefox) | Banner în popup cu buton care cere permisiunea | Implementat; verificat doar cazul „permis” |
| Scurtături în conflict | Buton în popup către setările de scurtături (`commands.openShortcutSettings` sau pagina browserului) | Implementat; neverificat |
| Firefox Android fără getDisplayMedia | Butonul de înregistrare se dezactivează cu explicație | Implementat; neverificat pe Android |

## 2b. Limite care rămân
- Safari și Samsung Internet nu au politici gestionate (`storage.managed`); setările se fac din popup.
- Samsung Internet: add-on-urile se instalează doar din Galaxy Store.
- Firefox Android: nu există înregistrare de ecran (lipsește API-ul din browser).
- Safari iOS: `captureVisibleTab` poate decupa; există doar avertizare și alternativa de regiune/element.
- Cadrele cross-origin sunt acoperite doar dacă extensia rulează în ele (nu pe pagini interne sau cadre blocate).

## 3. Matrice browser × funcții
Legendă: V = verificat live, D = doar documentat/static, N = nesuportat.

| Browser | Teme/CSS | Capturi | Captură pagină întreagă | Înregistrare ecran | Politici gestionate |
|---|---|---|---|---|---|
| Chrome | V | V | V | V | V (schema) |
| Edge, Brave, Opera/GX, Vivaldi, Arc, Dia, Comet, Yandex | D (aceeași bază Chromium; neinstalat aici) | D | D | D | D |
| Firefox desktop | D (web-ext lint: 0 erori) | D | D | D | D |
| Firefox Android | D | D | D | N (fără getDisplayMedia) | N (respinge managed storage) |
| Safari macOS | D | D (doar fila activă) | D | D | N (fără storage.managed) |
| Safari iOS | D | D (risc de decupare) | D | D | N |
| Samsung Internet | D | D | D | D | N |

## 4. Teste
t3–t9 trec fără defecte pe v1.5.2. t10 (nou): DPR, CSP strict, ReDoS, iframe, shadow DOM, câmpuri, CSS ostil, container derulabil, pagină de 12 000 px, evenimente sintetice — fără defecte. `web-ext lint`: 0 erori, 0 avertismente. Nu am putut testa live Firefox, Safari, Opera, Samsung (indisponibile în mediu).

## Surse
Cercetarea din sesiune: documentația MDN/Mozilla (permisiuni host Firefox 127+, Firefox Android fără getDisplayMedia și managed storage), Apple (Safari WebExtensions, `captureVisibleTab` doar fila activă, fără `storage.managed`), Chrome for Developers (`captureVisibleTab` ≈2 apeluri/s, descărcări multiple, „on click” implicit), Brave (canvas farbling), Samsung Internet (add-on-uri prin Galaxy Store), Opera (suport MV2 și MV3), note despre WebM Cues în Chrome 140+.

## 5. v1.5.3 — 8 limbi
Interfața (315 chei), descrierile din magazin (`_locales`) și README-urile sunt în EN, RO, FR, IT, ES, PT, DE, HU. Limbile noi se încarcă la cerere din pachet (fără rețea). Verificat în Chrome: popup și recorder în toate cele 8 limbi, selectorul cu 8 opțiuni, meniul din pagină în germană. Traducerile nu au fost revizuite de vorbitori nativi.

## 6. Audit 3 (v1.5.3 → v1.5.4)
| Defect | Stare |
|---|---|
| Cadrele sandbox (origine opacă) nu primeau scriptul de conținut → e-mail necenzurat în captură | Reparat: `match_origin_as_fallback`; verificat |
| iframe în shadow DOM nedetectat de `window.frames` → fără mască | Reparat: masca se trimite mereu, o singură dată pe flux; verificat |
| Descrieri de magazin 183–231 caractere (limită 132) | Reparat în toate cele 8 limbi |
| `loadLang` eșuat → reîncercări nesfârșite (popup) | Reparat: dicționar gol la eșec; verificat (1 încercare) |
| `t()` interpreta `$&` din valori și accepta coduri de limbă ostile | Reparat; verificat |
| WebM: patch riscant dacă fișierul are SeekHead sau Segment cu dimensiune cunoscută | Reparat: nu se modifică în acele cazuri |
| Mesaj de limbă trimis din fiecare iframe | Reparat: doar cadrul de sus |
Verificate fără defecte: text tăiat în popup (8 limbi × toate filele), jurnal VTT (nicio tastă simplă, combinațiile se înregistrează), sesiune de înregistrare veche ignorată, setări ostile. Suita t3–t12 trece; `web-ext lint` 0 erori.
