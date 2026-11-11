import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
T = {}
T['ro'] = ("Module opționale (v1.7)", """Toate sunt oprite implicit (popup → «Mai mult» → «Module opționale (v1.7)»). Nu există telemetrie; butonul «Ce părăsește browserul?» citește codul extensiei și listează adresele și apelurile de rețea găsite.
- **Navigare rapidă**: Alt+Shift+J/K titlu următor/anterior, M/N reper următor/anterior, L listă filtrabilă de repere, titluri și linkuri, G spotlight pe paragraf; focus mărit și vizibil.
- **Control vocal** (Alt+Shift+V): comenzi precum „next heading”, „titlul anterior”, „zoom in”, „citește”, „ajutor”. În Chrome, sunetul este prelucrat de serviciul de recunoaștere vocală al browserului; Firefox nu are această funcție.
- **Rezumat, text simplificat, glosar** (Alt+Shift+Y): rezumat prin selecția statistică a propozițiilor (nu AI; folosește modelul local din Chrome doar dacă «AI local» e pornit și disponibil), simplificare care doar împarte propozițiile lungi, glosar de abrevieri definite în pagină și cuvinte lungi (cu dicționarul local, dacă e importat).
- **Descrieri pentru imagini fără alt**: din legendă, titlu, textul linkului sau numele fișierului; marcate „generat automat”. Nu analizează imaginea.
- **Subtitrări live** (Alt+Shift+C): doar vorbirea captată de microfon, nu sunetul din filme sau din pagină.
- **Profiluri noi**: vârstnici, tremor/mobilitate, fotosensibilitate, ADHD/concentrare.
- **Reguli pe site**: export/import JSON sau listă de domenii de dezactivat.
- **Raport de audit**: HTML, CSV sau JSON cu corespondență WCAG 2.2 / EN 301 549, sugestii de reparare și comparare cu o referință salvată.
- **Mod CI**: `python tools/claritas_ci.py https://exemplu.ro --format all --max-errors 0` (cod de ieșire 1 dacă pragul e depășit). Acoperă doar regulile automate Claritas.
- **Verificat (Chromium, extensia reală)**: 36 de verificări în `test/t14_v17.py` (navigare, listă, spotlight, parser de comenzi vocale, alt, rezumat/glosar, rapoarte, profiluri, import de reguli, panou de confidențialitate, curățare la dezactivare). **Neverificat**: recunoașterea vocală cu voce reală (doar pornirea/oprirea și parserul de comenzi), subtitrările live cu voce reală, modulele pe Firefox/Safari.""")
T['en'] = ("Optional modules (v1.7)", """All are off by default (popup → “More” → “Optional modules (v1.7)”). There is no telemetry; the “What leaves the browser?” button reads the extension’s own code and lists the addresses and network calls it finds.
- **Quick navigation**: Alt+Shift+J/K next/previous heading, M/N next/previous landmark, L filterable list of landmarks, headings and links, G paragraph spotlight; larger visible focus.
- **Voice control** (Alt+Shift+V): commands such as “next heading”, “zoom in”, “read”, “help” (Romanian equivalents too). In Chrome the audio is processed by the browser’s speech service; Firefox does not have it.
- **Summary, simplified text, glossary** (Alt+Shift+Y): summary by statistical sentence selection (not AI; uses Chrome’s local model only if “Local AI” is on and available), simplification that only splits long sentences, glossary of abbreviations defined on the page plus long words (with the local dictionary if imported).
- **Descriptions for images without alt**: from caption, title, link text or file name; marked “auto-generated”. It does not analyse the image.
- **Live captions** (Alt+Shift+C): speech picked up by the microphone only, not audio playing in videos or the page.
- **New profiles**: older adults, tremor/motor, photosensitivity, ADHD/focus.
- **Site rules**: export/import as JSON or a list of domains to disable.
- **Audit report**: HTML, CSV or JSON with WCAG 2.2 / EN 301 549 mapping, fix suggestions and comparison with a saved baseline.
- **CI mode**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (exit code 1 above the threshold). Covers only Claritas’s automatic rules.
- **Verified (Chromium, real extension)**: 36 checks in `test/t14_v17.py` (navigation, list, spotlight, voice-command parser, alt, summary/glossary, reports, profiles, rule import, privacy panel, cleanup on disable). **Not verified**: speech recognition with real speech (only start/stop and the command parser), live captions with real speech, the modules on Firefox/Safari.""")
T['de'] = ("Optionale Module (v1.7)", """Alle sind standardmäßig aus (Popup → „Mehr“ → „Optionale Module (v1.7)“). Es gibt keine Telemetrie; die Schaltfläche „Was verlässt den Browser?“ liest den Code der Erweiterung und listet gefundene Adressen und Netzwerkaufrufe.
- **Schnellnavigation**: Alt+Umschalt+J/K nächste/vorherige Überschrift, M/N nächster/vorheriger Bereich, L filterbare Liste von Bereichen, Überschriften und Links, G Absatz-Spotlight; größerer sichtbarer Fokus.
- **Sprachsteuerung** (Alt+Umschalt+V): Befehle wie „next heading“, „zoom in“, „read“, „help“. In Chrome verarbeitet der Spracherkennungsdienst des Browsers das Audio; Firefox hat ihn nicht.
- **Zusammenfassung, vereinfachter Text, Glossar** (Alt+Umschalt+Y): Zusammenfassung durch statistische Satzauswahl (keine KI; nutzt Chromes lokales Modell nur, wenn „Lokale KI“ an und verfügbar ist), Vereinfachung teilt nur lange Sätze, Glossar der auf der Seite definierten Abkürzungen und langer Wörter (mit dem lokalen Wörterbuch, falls importiert).
- **Beschreibungen für Bilder ohne Alt**: aus Bildunterschrift, Titel, Linktext oder Dateiname; als „automatisch erzeugt“ markiert. Das Bild wird nicht analysiert.
- **Live-Untertitel** (Alt+Umschalt+C): nur vom Mikrofon aufgenommene Sprache, nicht Ton aus Videos oder der Seite.
- **Neue Profile**: Ältere, Tremor/Motorik, Lichtempfindlichkeit, ADHS/Konzentration.
- **Website-Regeln**: Export/Import als JSON oder Liste zu deaktivierender Domains.
- **Audit-Bericht**: HTML, CSV oder JSON mit Zuordnung zu WCAG 2.2 / EN 301 549, Korrekturvorschlägen und Vergleich mit einer gespeicherten Referenz.
- **CI-Modus**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (Exit-Code 1 bei Überschreitung). Deckt nur die automatischen Regeln von Claritas ab.
- **Geprüft (Chromium, echte Erweiterung)**: 36 Prüfungen in `test/t14_v17.py`. **Nicht geprüft**: Spracherkennung mit echter Sprache (nur Start/Stopp und Befehlsparser), Live-Untertitel mit echter Sprache, die Module in Firefox/Safari.""")
T['es'] = ("Módulos opcionales (v1.7)", """Todos están desactivados por defecto (popup → «Más» → «Módulos opcionales (v1.7)»). No hay telemetría; el botón «¿Qué sale del navegador?» lee el código de la extensión y enumera las direcciones y llamadas de red que encuentra.
- **Navegación rápida**: Alt+Mayús+J/K título siguiente/anterior, M/N región siguiente/anterior, L lista filtrable de regiones, títulos y enlaces, G foco en el párrafo; foco más grande y visible.
- **Control por voz** (Alt+Mayús+V): órdenes como «next heading», «zoom in», «read», «help». En Chrome el audio lo procesa el servicio de voz del navegador; Firefox no lo tiene.
- **Resumen, texto simplificado, glosario** (Alt+Mayús+Y): resumen por selección estadística de frases (no IA; usa el modelo local de Chrome solo si «IA local» está activada y disponible), simplificación que solo divide frases largas, glosario de abreviaturas definidas en la página y palabras largas (con el diccionario local, si se importó).
- **Descripciones para imágenes sin alt**: a partir de leyenda, título, texto del enlace o nombre de archivo; marcadas «generado automáticamente». No analiza la imagen.
- **Subtítulos en vivo** (Alt+Mayús+C): solo el habla captada por el micrófono, no el audio de vídeos o de la página.
- **Perfiles nuevos**: personas mayores, temblor/motricidad, fotosensibilidad, TDAH/concentración.
- **Reglas por sitio**: exportar/importar JSON o lista de dominios a desactivar.
- **Informe de auditoría**: HTML, CSV o JSON con correspondencia WCAG 2.2 / EN 301 549, correcciones sugeridas y comparación con una referencia guardada.
- **Modo CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (código de salida 1 si se supera el umbral). Solo cubre las reglas automáticas de Claritas.
- **Verificado (Chromium, extensión real)**: 36 comprobaciones en `test/t14_v17.py`. **No verificado**: reconocimiento de voz con voz real (solo inicio/parada y el analizador de órdenes), subtítulos en vivo con voz real, los módulos en Firefox/Safari.""")
T['fr'] = ("Modules facultatifs (v1.7)", """Tous sont désactivés par défaut (popup → « Plus » → « Modules optionnels (v1.7) »). Aucune télémétrie ; le bouton « Que quitte le navigateur ? » lit le code de l’extension et liste les adresses et appels réseau trouvés.
- **Navigation rapide** : Alt+Maj+J/K titre suivant/précédent, M/N repère suivant/précédent, L liste filtrable de repères, titres et liens, G projecteur sur le paragraphe ; focus agrandi et visible.
- **Commande vocale** (Alt+Maj+V) : commandes comme « next heading », « zoom in », « read », « help ». Dans Chrome, l’audio est traité par le service vocal du navigateur ; Firefox ne l’a pas.
- **Résumé, texte simplifié, glossaire** (Alt+Maj+Y) : résumé par sélection statistique de phrases (pas d’IA ; utilise le modèle local de Chrome seulement si « IA locale » est activée et disponible), simplification qui ne fait que découper les phrases longues, glossaire des abréviations définies dans la page et des mots longs (avec le dictionnaire local, s’il est importé).
- **Descriptions pour images sans alt** : à partir de la légende, du titre, du texte du lien ou du nom de fichier ; marquées « générées automatiquement ». L’image n’est pas analysée.
- **Sous-titres en direct** (Alt+Maj+C) : uniquement la parole captée par le micro, pas le son des vidéos ou de la page.
- **Nouveaux profils** : seniors, tremblements/motricité, photosensibilité, TDAH/concentration.
- **Règles par site** : export/import JSON ou liste de domaines à désactiver.
- **Rapport d’audit** : HTML, CSV ou JSON avec correspondance WCAG 2.2 / EN 301 549, corrections suggérées et comparaison à une référence enregistrée.
- **Mode CI** : `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (code de sortie 1 au-delà du seuil). Ne couvre que les règles automatiques de Claritas.
- **Vérifié (Chromium, extension réelle)** : 36 contrôles dans `test/t14_v17.py`. **Non vérifié** : reconnaissance vocale avec une vraie voix (seulement démarrage/arrêt et analyseur de commandes), sous-titres en direct avec une vraie voix, les modules sous Firefox/Safari.""")
T['hu'] = ("Választható modulok (v1.7)", """Alapértelmezetten mind ki van kapcsolva (popup → „Továbbiak” → „Opcionális modulok (v1.7)”). Nincs telemetria; a „Mi hagyja el a böngészőt?” gomb beolvassa a bővítmény kódját, és listázza a talált címeket és hálózati hívásokat.
- **Gyors navigáció**: Alt+Shift+J/K következő/előző címsor, M/N következő/előző tájékozódási pont, L szűrhető lista pontokból, címsorokból és linkekből, G bekezdés-reflektor; nagyobb, látható fókusz.
- **Hangvezérlés** (Alt+Shift+V): parancsok, pl. „next heading”, „zoom in”, „read”, „help”. Chrome-ban a hangot a böngésző beszédfelismerő szolgáltatása dolgozza fel; a Firefox nem támogatja.
- **Összefoglaló, egyszerűsített szöveg, szójegyzék** (Alt+Shift+Y): összefoglaló statisztikai mondatkiválasztással (nem MI; a Chrome helyi modelljét csak akkor használja, ha a „Helyi MI” be van kapcsolva és elérhető), az egyszerűsítés csak a hosszú mondatokat bontja, szójegyzék az oldalon definiált rövidítésekből és hosszú szavakból (az importált helyi szótárral).
- **Leírások alt nélküli képekhez**: felirat, cím, link szövege vagy fájlnév alapján; „automatikusan generált” jelöléssel. A képet nem elemzi.
- **Élő feliratok** (Alt+Shift+C): csak a mikrofon által rögzített beszéd, nem a videók vagy az oldal hangja.
- **Új profilok**: idősek, remegés/mozgás, fényérzékenység, ADHD/koncentráció.
- **Webhelyszabályok**: export/import JSON-ként vagy kikapcsolandó domainek listájaként.
- **Audit-jelentés**: HTML, CSV vagy JSON WCAG 2.2 / EN 301 549 megfeleltetéssel, javítási javaslatokkal és mentett referenciával való összevetéssel.
- **CI mód**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (1-es kilépési kód a küszöb túllépésekor). Csak a Claritas automatikus szabályait fedi le.
- **Ellenőrizve (Chromium, valódi bővítmény)**: 36 ellenőrzés a `test/t14_v17.py` fájlban. **Nem ellenőrzött**: beszédfelismerés valódi beszéddel (csak indítás/leállítás és a parancsértelmező), élő feliratok valódi beszéddel, a modulok Firefoxban/Safariban.""")
T['it'] = ("Moduli opzionali (v1.7)", """Tutti sono disattivati di default (popup → «Altro» → «Moduli opzionali (v1.7)»). Nessuna telemetria; il pulsante «Cosa lascia il browser?» legge il codice dell’estensione ed elenca gli indirizzi e le chiamate di rete trovati.
- **Navigazione rapida**: Alt+Maiusc+J/K titolo successivo/precedente, M/N regione successiva/precedente, L elenco filtrabile di regioni, titoli e link, G spotlight sul paragrafo; focus ingrandito e visibile.
- **Controllo vocale** (Alt+Maiusc+V): comandi come «next heading», «zoom in», «read», «help». In Chrome l’audio è elaborato dal servizio vocale del browser; Firefox non lo ha.
- **Riassunto, testo semplificato, glossario** (Alt+Maiusc+Y): riassunto con selezione statistica delle frasi (non IA; usa il modello locale di Chrome solo se «IA locale» è attiva e disponibile), semplificazione che divide solo le frasi lunghe, glossario delle abbreviazioni definite nella pagina e delle parole lunghe (con il dizionario locale, se importato).
- **Descrizioni per immagini senza alt**: da didascalia, titolo, testo del link o nome file; contrassegnate «generato automaticamente». L’immagine non viene analizzata.
- **Sottotitoli dal vivo** (Alt+Maiusc+C): solo il parlato captato dal microfono, non l’audio di video o pagina.
- **Nuovi profili**: anziani, tremore/motricità, fotosensibilità, ADHD/concentrazione.
- **Regole per sito**: esporta/importa JSON o elenco di domini da disattivare.
- **Rapporto di audit**: HTML, CSV o JSON con corrispondenza WCAG 2.2 / EN 301 549, correzioni suggerite e confronto con un riferimento salvato.
- **Modalità CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (codice di uscita 1 oltre la soglia). Copre solo le regole automatiche di Claritas.
- **Verificato (Chromium, estensione reale)**: 36 controlli in `test/t14_v17.py`. **Non verificato**: riconoscimento vocale con voce reale (solo avvio/arresto e parser dei comandi), sottotitoli dal vivo con voce reale, i moduli su Firefox/Safari.""")
T['pt'] = ("Módulos opcionais (v1.7)", """Todos estão desativados por predefinição (popup → «Mais» → «Módulos opcionais (v1.7)»). Não há telemetria; o botão «O que sai do navegador?» lê o código da extensão e lista os endereços e chamadas de rede encontrados.
- **Navegação rápida**: Alt+Shift+J/K título seguinte/anterior, M/N região seguinte/anterior, L lista filtrável de regiões, títulos e ligações, G destaque do parágrafo; foco ampliado e visível.
- **Controlo por voz** (Alt+Shift+V): comandos como «next heading», «zoom in», «read», «help». No Chrome o áudio é processado pelo serviço de voz do navegador; o Firefox não o tem.
- **Resumo, texto simplificado, glossário** (Alt+Shift+Y): resumo por seleção estatística de frases (não IA; usa o modelo local do Chrome apenas se «IA local» estiver ativa e disponível), simplificação que só divide frases longas, glossário de abreviaturas definidas na página e palavras longas (com o dicionário local, se importado).
- **Descrições para imagens sem alt**: a partir de legenda, título, texto da ligação ou nome do ficheiro; marcadas «gerado automaticamente». A imagem não é analisada.
- **Legendas em direto** (Alt+Shift+C): apenas a fala captada pelo microfone, não o áudio de vídeos ou da página.
- **Perfis novos**: idosos, tremor/motricidade, fotossensibilidade, TDAH/concentração.
- **Regras por site**: exportar/importar JSON ou lista de domínios a desativar.
- **Relatório de auditoria**: HTML, CSV ou JSON com correspondência WCAG 2.2 / EN 301 549, correções sugeridas e comparação com uma referência guardada.
- **Modo CI**: `python tools/claritas_ci.py https://example.com --format all --max-errors 0` (código de saída 1 acima do limiar). Cobre apenas as regras automáticas do Claritas.
- **Verificado (Chromium, extensão real)**: 36 verificações em `test/t14_v17.py`. **Não verificado**: reconhecimento de voz com voz real (apenas início/paragem e o analisador de comandos), legendas em direto com voz real, os módulos no Firefox/Safari.""")
files = {'ro':'README.ro.md','en':'README.md','de':'README.de.md','es':'README.es.md','fr':'README.fr.md','hu':'README.hu.md','it':'README.it.md','pt':'README.pt.md'}
for lg, f in files.items():
    p = root/f; s = p.read_text(encoding='utf8')
    if '(v1.7)' in s: continue
    s = s.replace('1.6.0', '1.7.0', 1)
    m = re.search(r'^## [^\n]*\(v1\.6\)', s, re.M)
    s = s[:m.start()] + '## ' + T[lg][0] + '\n' + T[lg][1] + '\n\n' + s[m.start():]
    p.write_text(s, encoding='utf8')
print('ok')
