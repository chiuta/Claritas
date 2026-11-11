# Claritas

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md)

**Versione: 1.6.0 · Ultimo aggiornamento: 12/11/2026**

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

Stato di verifica (v1.6.0): testato automaticamente in CI su Chromium, Edge, Brave, Firefox (più canali), Safari 27.2 reale su macOS, Safari 26.2 nel simulatore iPhone/iPad, Chrome 113 e Firefox 162 su Android 14 (emulatore). Non verificato: Opera, Vivaldi, Samsung Internet reale, l’estensione attivata in Safari/iOS reali, Chrome di marca. Alt+Shift+O/D/L/G sono modificabili nel browser; P/H/S/M sono fissi. Il pulsante di definizione apre dexonline.ro o Wiktionary solo al clic.

## Moduli opzionali (v1.6)
Tutti disattivati di default (popup → «Moduli opzionali»); nulla esce dal browser. Parti del discorso nel Lettore (rumeno/inglese, euristico), regole di audit aggiuntive (ARIA, moduli, main, zoom, sottotitoli), dizionario locale (tuo JSON/TSV, max 4 MB), sincronizzazione delle impostazioni con `storage.sync` del browser (senza dizionario né registrazioni) e OCR locale nel pacchetto separato `claritas-*-ocr.zip` (~20 MB; verificato automaticamente solo in Chromium, Firefox/Safari non verificati).
