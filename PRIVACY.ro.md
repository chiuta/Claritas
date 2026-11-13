# Claritas — Politica de confidențialitate

**Versiunea 1.8.1 · Ultima actualizare: 13 nov. 2026** · Versiunea în engleză: [PRIVACY.md](PRIVACY.md)

Claritas este o extensie gratuită, open-source (MIT), de accesibilitate. **Nu are telemetrie, analitice, conturi sau servere proprii.** Documentul spune exact ce păstrează și puținele cazuri în care browserul (nu Claritas) comunică cu un terț.

## Ce păstrează Claritas
Totul stă în spațiul de stocare al extensiei din browser (`storage.local`):
- setările, profilurile și regulile pe site;
- funcțiile opționale pe care le pornești: lista de citit și notele, CSS-ul tău pe site, un dicționar importat, evidențierile.

Capturile de ecran și înregistrările se creează în browser și se salvează direct în Descărcări. Claritas nu le încarcă nicăieri.

Poți exporta sau șterge totul din fereastra extensiei sau eliminând extensia.

## Ce citește Claritas
Ca să-și facă treaba (corectarea contrastului, citirea cu voce, auditul etc.), scriptul de conținut citește paginile vizitate **în interiorul browserului**. Conținutul paginii nu este trimis nicăieri de Claritas. Butonul „Ce pleacă din browser?” din panoul de module opționale citește codul extensiei și listează fiecare apel de rețea găsit, ca să verifici singur.

Pentru a estima contrastul textului pus peste o imagine de fundal, scriptul de conținut poate decoda local acea imagine (un canvas mic) dacă este `data:`/`blob:` sau provine de pe același site ca pagina (de obicei deja în cache-ul browserului). Imaginile de pe alte site-uri nu sunt descărcate niciodată de Claritas, iar nimic despre imagine nu se stochează și nu se trimite.

## Cazuri în care datele pot ieși din browser
Nu sunt niciodată pornite implicit sau se întâmplă doar la acțiunea ta explicită:
1. **Butonul de definiție**: deschide dexonline.ro sau Wiktionary într-o filă nouă, doar când îl apeși. Acele site-uri văd cuvântul căutat.
2. **Control vocal și subtitrări live (Chrome)**: serviciul de recunoaștere vocală al browserului procesează sunetul, conform termenilor Google. Firefox nu are acest serviciu.
3. **Sincronizarea setărilor (oprită implicit)**: folosește `storage.sync` al browserului, sincronizat de producătorul acestuia. Intră doar setările și regulile pe site, niciodată dicționarul, notele, capturile sau înregistrările.
4. **IA pe dispozitiv (oprită implicit)**: folosește Prompt API din Chrome cu modelul deja aflat pe calculator. Claritas nu trimite textul paginii niciunui server; Chrome își poate descărca singur modelul, ceea ce ține de comportamentul Chrome.
5. **Pachetele opționale** (`-ocr`, `-axe`, `-pdf`) sunt incluse și rulează local; nu fac cereri.

## Permisiuni
- `storage`: păstrarea setărilor.
- Acces la toate site-urile (script de conținut pe `<all_urls>`, toate cadrele): necesar pentru a aplica corecturile de contrast, temele și uneltele pe orice pagină unde alegi să le folosești. Extensia poate fi oprită global sau pe site.

## Copii
Claritas nu colectează date personale de la nimeni, nici de la copii.

## Modificări
Modificările apar în acest fișier și în istoricul depozitului: https://github.com/chiuta/Claritas

## Contact
Alexandru-Ionuț Chiuță (Alexio) · alexio@trom.tf
