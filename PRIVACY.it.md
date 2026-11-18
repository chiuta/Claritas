# Claritas — Informativa sulla privacy

**Versione 1.10.2 · Ultimo aggiornamento: 18 nov 2026** · [English](PRIVACY.md) · [Română](PRIVACY.ro.md) · [Français](PRIVACY.fr.md) · Italiano · [Español](PRIVACY.es.md) · [Português](PRIVACY.pt.md) · [Deutsch](PRIVACY.de.md) · [Magyar](PRIVACY.hu.md)

> Traduzione assistita da macchina, non ancora rivista da un madrelingua. In caso di differenze prevale il testo inglese (PRIVACY.md).

Claritas è un'estensione di accessibilità gratuita e open source (MIT). **Non ha telemetria, analisi, account né server propri.** Questo documento indica esattamente cosa memorizza e i pochi casi in cui il browser (non Claritas) comunica con terze parti.

## Cosa memorizza Claritas
Tutto è conservato nell'archivio delle estensioni del browser (`storage.local`):
- le tue impostazioni, i profili e le regole per sito;
- le funzioni facoltative che attivi: elenco di lettura e note, il tuo CSS per sito, un file di dizionario che importi, le evidenziazioni.

Gli screenshot e le registrazioni dello schermo sono creati nel browser e salvati direttamente nella cartella Download. Claritas non li carica mai.

Puoi esportare o eliminare tutto dal popup oppure rimuovendo l'estensione.

## Cosa legge Claritas
Per svolgere il suo compito (correggere il contrasto, leggere ad alta voce, verificare, ecc.) lo script di contenuto legge le pagine che visiti **all'interno del browser**. Claritas non invia il contenuto delle pagine da nessuna parte. Il pulsante «Cosa esce dal browser?» nel pannello dei moduli facoltativi legge il codice dell'estensione ed elenca ogni chiamata di rete trovata, così puoi verificarlo tu stesso.

Per stimare il contrasto del testo sopra un'immagine di sfondo, lo script di contenuto può decodificare l'immagine in locale (un piccolo canvas) se è un'immagine `data:`/`blob:` o proviene dallo stesso sito della pagina (normalmente già nella cache). Claritas non scarica mai immagini di altri siti e nulla dell'immagine viene memorizzato o inviato.

## Casi in cui i dati possono uscire dal browser
Mai attivi per impostazione predefinita, oppure solo su tua azione esplicita:
1. **Pulsante definizione**: apre dexonline.ro o Wiktionary in una nuova scheda, solo quando lo premi. Quei siti vedono la parola cercata.
2. **Controllo vocale e sottotitoli in tempo reale (Chrome)**: il servizio di riconoscimento vocale del browser elabora l'audio secondo i termini di Google. Firefox non ha un servizio simile.
3. **Sincronizzazione delle impostazioni (disattivata per impostazione predefinita)**: usa il `storage.sync` del browser, sincronizzato dal produttore del browser. Include solo impostazioni e regole per sito, mai dizionario, note, screenshot o registrazioni.
4. **IA sul dispositivo (disattivata per impostazione predefinita)**: usa la Prompt API di Chrome con il modello già presente sul computer. Claritas non invia testo delle pagine ad alcun server; Chrome può scaricare il proprio modello, ed è comportamento di Chrome.
5. **Pacchetti facoltativi** (`-ocr`, `-axe`, `-pdf`): inclusi ed eseguiti in locale; non effettuano richieste.

## Autorizzazioni
- `storage`: salvare le impostazioni.
- Accesso a tutti i siti (script di contenuto su `<all_urls>`, tutti i frame): necessario per applicare correzioni di contrasto, temi e strumenti su qualsiasi pagina in cui scegli di usarli. L'estensione può essere disattivata globalmente o per sito.

## Minori
Claritas non raccoglie dati personali da nessuno, compresi i minori.

## Modifiche
Le modifiche a questa informativa compaiono in questo file e nella cronologia del repository: https://github.com/chiuta/Claritas

## Contatto
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
