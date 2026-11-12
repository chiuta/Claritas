# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versione: 1.8.0 · Ultimo aggiornamento: 12/11/2026**

Estensione di accessibilità tutto-in-uno, gratuita. Nessuna telemetria, nessuna rete, nessun account: tutto resta nel tuo browser.

## Cosa fa
- **Correzione automatica del contrasto (WCAG AA/AAA)**: misura il contrasto reale testo/sfondo e regola solo il testo insufficiente, compresi i campi disabilitati.
- **Temi ad alto contrasto**, filtri colore, **daltonismo** (correzione e simulazione), filtro luce blu, simulatore di visione.
- **Testo**: zoom, dimensione, spaziatura, caratteri (adatto alla dislessia, Lexend, Atkinson Hyperlegible), allineamento a sinistra.
- **Lettura**: righello, maschera, lente, modalità lettura, lettura veloce, lettura ad alta voce (voci locali), evidenziazioni con esportazione.
- **Motricità e controllo**: bersagli di clic grandi, clic con permanenza, scansione a pulsante singolo, etichette numerate, sblocco dell’incolla.
- **Calma e stabilità**: nasconde banner e pop-up, riflusso, ferma le GIF, mantiene il focus visibile.
- **Verifica WCAG 2.2** con monitoraggio continuo e controlli manuali.
- **Schermata locale** (area visibile, regione, pagina intera, elemento) con annotazioni, copertura automatica dei dati personali (anche nei frame e nello shadow DOM) e ZIP con PNG + descrizione (.md).
- **Registrazione locale dello schermo** con anelli al clic, tasti mostrati e registro delle azioni WebVTT.
- **Profili**, impostazioni per sito, esportazione/importazione JSON, criteri aziendali (managed storage).
- **8 lingue**: English, Română, Français, Italiano, Español, Português, Deutsch, Magyar.

## Installazione

Scegli il pacchetto adatto al tuo browser (cartella `dist/` o file della release):

| Pacchetto | Browser |
|---|---|
| `claritas-chromium.zip` | Chrome, Edge, Opera / Opera GX, Brave, Vivaldi, Arc, Dia, Comet, Yandex, Whale e qualsiasi browser Chromium 109+ |
| `claritas-firefox.zip` | Firefox (desktop 140+ e Android 142+), LibreWolf, Zen, Floorp, Waterfox, Mullvad Browser |
| `claritas-safari-source.zip` | Safari macOS / iOS / iPadOS (serve un Mac con Xcode) |

- **Famiglia Chromium**: decomprimi, apri la pagina delle estensioni (`chrome://extensions`, `edge://extensions`, `opera://extensions`…), attiva la *modalità sviluppatore*, scegli *Carica estensione non pacchettizzata* e seleziona la cartella.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Carica componente aggiuntivo temporaneo* → `manifest.json`. Per un’installazione permanente, firmalo come componente non elencato su addons.mozilla.org (ID `claritas@trom.tf`).
- **Safari**: su un Mac con Xcode esegui `./build-safari.sh` dai sorgenti decompressi, poi attivalo in Safari → Impostazioni → Estensioni.
- **Mobile**: Firefox Android (tramite una raccolta personalizzata di componenti), Edge Android e Samsung Internet (tramite i loro store). Chrome, Brave e Opera su Android non accettano estensioni.

## Scorciatoie

`Alt+Shift+O` attiva/disattiva · `D` tema · `L` lettura · `G` righello · `Alt+Shift+P` menu schermata · `Alt+Shift+H` etichette numerate · `Alt+Shift+S` scansione. Modificabili nelle impostazioni delle scorciatoie delle estensioni del browser (il popup ha un pulsante apposito).

## Privacy

Nessuna richiesta di rete, nessuna telemetria, nessun account. Schermate e registrazioni vengono create e salvate localmente nel browser.

## Limiti noti

- Safari e Samsung Internet non hanno criteri aziendali (managed); Firefox Android non ha la registrazione dello schermo.
- Safari iOS può ritagliare le schermate; usa l’acquisizione di regione o di elemento.
- Verificato dal vivo in Chrome; Firefox, Safari e gli altri browser sono stati analizzati in modo statico.

## Licenza

MIT — copyright Alexandru-Ionuț Chiuță (Alexio).

## Sostegno

Se Claritas ti è utile, puoi sostenere il lavoro: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).

Informativa sulla privacy: [PRIVACY.md](PRIVACY.md)

Stato di verifica (v1.6.0): testato automaticamente in CI su Chromium, Edge, Brave, Firefox (più canali), Safari 27.2 reale su macOS, Safari 26.2 nel simulatore iPhone/iPad, Chrome 113 e Firefox 162 su Android 14 (emulatore). Verificato in CI su Linux per v1.7.0: Opera 140 (tutti i 12 file di test). Non verificato: Vivaldi (si avvia, ma la connessione di debug automatica va in timeout), Samsung Internet reale, l’estensione attivata in Safari/iOS reali, Chrome di marca. Alt+Shift+O/D/L/G sono modificabili nel browser; P/H/S/M sono fissi. Il pulsante di definizione apre dexonline.ro o Wiktionary solo al clic.

## Moduli opzionali (v1.8)
Tutti disattivati per impostazione predefinita (popup → «Altro» → «Moduli opzionali (v1.8)»). Tutto funziona in locale; nulla viene inviato altrove.
- **Ispettore del contrasto** (Alt+Maiusc+I): passa sopra o dai il focus a un testo per vedere colori reali, rapporto, AA/AAA e una correzione suggerita; clic per bloccare.
- **Mappa dell’ordine di tabulazione** (Alt+Maiusc+T): badge numerati nell’ordine di tabulazione, nome accessibile e ruolo di ogni controllo, con i problemi (senza nome, tabindex positivo, aria-hidden su elemento focalizzabile, salti indietro).
- **Lista di lettura e note** (Alt+Maiusc+B): salva pagine, testo selezionato e note nel browser; esporta in Markdown/JSON, importa JSON.
- **CSS personale per sito** (Alt+Maiusc+U): salvato localmente; `@import` e URL esterni rimossi; modelli (barre non fisse, link sottolineati, spaziatura, nascondi banner).
- **Formule** (Alt+Maiusc+Q): descrizioni parlate per MathML (frazioni, potenze, radici, somme, lettere greche; rumeno e inglese) e lettura ad alta voce.
- **Guida alle voci** (popup → Voce): classifica le voci per la tua lingua, locali prima delle online, con pulsante di ascolto.
- **IA locale** (Alt+Maiusc+A, classe B): domande sulla pagina e descrizioni di immagini suggerite tramite la Prompt API di Chrome (Chrome 148+ con modello locale). Solo con il tuo consenso; contrassegnate «generate automaticamente». Non testato con un modello reale.
- **Pacchetti opzionali**: `-axe` aggiunge l’audit axe-core (MPL-2.0) e `-pdf` un lettore PDF locale (pdf.js, Apache-2.0: indice, ricerca, temi, lettura, salva .txt). Si creano con `tools/fetch_vendor.sh` e poi `python build.py`.
- **Verificato (Chromium, estensione reale)**: `test/t15_v18.py`. I controlli per Firefox sono in `test/ff_selenium.py`. Confermato in CI (12/11/2026): Edge e Opera (Linux) con lo stesso file e i controlli Firefox di `test/ff_selenium.py` su Linux e Windows (stabile, ESR, beta, nightly, developer edition); Firefox su macOS non è stato eseguito (limite GitHub). Non coperti: Safari, un modello locale reale, il download dei file .md/.json.

## Moduli opzionali (v1.7)
Tutti sono disattivati di default (popup → «Altro» → «Moduli opzionali (v1.7)»). Nessuna telemetria; il pulsante «Cosa lascia il browser?» legge il codice dell’estensione ed elenca gli indirizzi e le chiamate di rete trovati.
- **Navigazione rapida**: Alt+Maiusc+J/K titolo successivo/precedente, M/N regione successiva/precedente, L elenco filtrabile di regioni, titoli e link, G spotlight sul paragrafo; focus ingrandito e visibile.
- **Controllo vocale** (Alt+Maiusc+V): comandi come «next heading», «zoom in», «read», «help». In Chrome l’audio è elaborato dal servizio vocale del browser; Firefox non lo ha.
- **Riassunto, testo semplificato, glossario** (Alt+Maiusc+Y): riassunto con selezione statistica delle frasi (non IA; usa il modello locale di Chrome solo se «IA locale» è attiva e disponibile), semplificazione che divide solo le frasi lunghe, glossario delle abbreviazioni definite nella pagina e delle parole lunghe (con il dizionario locale, se importato).
- **Descrizioni per immagini senza alt**: da didascalia, titolo, testo del link o nome file; contrassegnate «generato automaticamente». L’immagine non viene analizzata.
- **Sottotitoli dal vivo** (Alt+Maiusc+C): solo il parlato captato dal microfono, non l’audio di video o pagina.
- **Nuovi profili**: anziani, tremore/motricità, fotosensibilità, ADHD/concentrazione.
- **Regole per sito**: esporta/importa JSON o elenco di domini da disattivare.
- **Rapporto di audit**: HTML, CSV o JSON con corrispondenza WCAG 2.2 / EN 301 549, correzioni suggerite e confronto con un riferimento salvato.
- **Modalità CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (codice di uscita 1 oltre la soglia). Copre solo le regole automatiche di Claritas.
- **Verificato (Chromium, estensione reale)**: 36 controlli in `test/t14_v17.py`. **Non verificato**: riconoscimento vocale con voce reale (solo avvio/arresto e parser dei comandi), sottotitoli dal vivo con voce reale, i moduli su Firefox/Safari.

## Moduli opzionali (v1.6)
Tutti disattivati di default (popup → «Moduli opzionali»); nulla esce dal browser. Parti del discorso nel Lettore (rumeno/inglese, euristico), regole di audit aggiuntive (ARIA, moduli, main, zoom, sottotitoli), dizionario locale (tuo JSON/TSV, max 4 MB), sincronizzazione delle impostazioni con `storage.sync` del browser (senza dizionario né registrazioni) e OCR locale nel pacchetto separato `claritas-*-ocr.zip` (~20 MB; verificato automaticamente solo in Chromium, Firefox/Safari non verificati).
