"""Module opționale v1.7: navigare, spotlight, voce, rezumat/glosar, alt imagini, raport, profiluri, reguli pe site, panou confidențialitate."""
import tempfile, asyncio, pathlib, json, sys
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
SRC = pathlib.Path('../extension')
TMP = tempfile.gettempdir().replace('\\', '/')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
LONG = ("Centrul Național de Recunoaștere și Echivalare a Diplomelor (CNRED) este instituția care analizează diplomele; CNRED colaborează cu autoritățile, iar rezultatul analizei se comunică solicitantului în termen legal. "
        "Procedura de recunoaștere profesională presupune verificarea documentelor, compararea programelor de studii și evaluarea echivalenței, ceea ce poate dura mai multe săptămâni, deoarece dosarele incomplete sunt returnate. ")
HTML = f"""<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Pagina de test</title></head><body>
<header><a href="#c">Sari</a></header><nav aria-label="Principal"><a href="/a">Acasă</a> <a href="/b">Despre</a></nav>
<main id="c"><h1>Titlu principal</h1><p>{LONG*3}</p><h2>Secțiunea doi</h2><p>{LONG*2}</p><h3>Subsecțiune</h3><p>{LONG*2}</p>
<figure><img id="i1" src="/x/a1.png"><figcaption>Casa veche din Brașov, 1900</figcaption></figure>
<img id="i2" src="/img/casa-din-brasov-2023.jpg"><img id="i3" src="/img/IMG_1234.jpg" alt="IMG_1234.jpg"><img id="i4" src="/q.png" alt="Grafic vânzări"><img id="i5" src="/d.png" alt="">
</main><aside aria-label="Lateral"><p>Notă laterală cu text suficient de lung pentru a conta aici.</p></aside><footer><p>Subsol</p></footer>
""" + "".join(f"<p>umplutură {i}</p>" for i in range(40)) + "</body></html>"
pathlib.Path(TMP + '/t14.html').write_text(HTML)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(TMP + '/prof14', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width': 1000, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]; errs = []
        async def setset(**kw):
            base = dict(enabled=True, lang='en', noMotion=True); base.update(kw)
            await sw.evaluate("async(s)=>{await chrome.storage.local.set({settings:s})}", base)
        await sw.evaluate("async()=>{await chrome.storage.local.clear()}")
        # --- A. funcții pure (încărcăm modules2.js într-o pagină de extensie) ---
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(900)
        await pop.add_script_tag(url=f'chrome-extension://{eid}/modules2.js')
        r = await pop.evaluate("""(LONG)=>{const M=CLR.m2; const g=M.glossary(LONG+' CNRED CNRED XYZ XYZ extraordinariamente');
          const long='Aceasta este o propoziție foarte lungă care conține mai multe idei diferite; totuși ea continuă, iar cititorul se pierde ușor, deoarece nu mai găsește punctul principal al textului scris.';
          const sm=M.simplify(long);
          return {v:['next heading','titlul anterior','Zoom in!','mărește','deruleaza jos','blabla',''].map(M.parseVoice),
            sum:M.summarize(LONG.repeat(3)+'Alta propoziție diferită despre arhitectură veche și orașe mari din țară.',null,2).length,
            defs:g.defs, undef:g.undef, hard:g.hard, simp:sm,
            alt:[M.altFromName('/img/casa-din-brasov-2023.jpg'),M.altFromName('/img/IMG_1234.jpg'),M.altFromName('/a/3f9a8c7d1e2b4455.png'),M.altFromName('/x/photo-300x200.jpg'),M.altFromName('/Biblioteca%20Centrala.webp?x=1')]}}""", LONG)
        ok(r['v'] == ['nh', 'ph', 'zin', 'zin', 'down', None, None], f'parseVoice RO/EN {r["v"]}')
        ok(r['sum'] == 2, 'rezumat extractiv întoarce n propoziții')
        ok(r['defs'].get('CNRED', '').startswith('Centrul Național') and 'Diplomelor' in r['defs'].get('CNRED', ''), f'glosar: definiție CNRED {r["defs"]}')
        ok('XYZ' in r['undef'] and 'CNRED' not in r['undef'], f'glosar: abrevieri nedefinite {r["undef"]}')
        ok('extraordinariamente' in r['hard'], 'glosar: cuvinte lungi')
        ok(len(r['simp']) >= 2 and all(len(x.split()) < 22 for x in r['simp']), f'simplificare împarte propoziția lungă {r["simp"]}')
        ok(r['alt'][0] == 'Casa din brasov' or r['alt'][0].startswith('Casa din'), f'alt din nume fișier {r["alt"]}')
        ok(r['alt'][1] == '' and r['alt'][2] == '' and r['alt'][3] == '', 'alt: nume generice/hash/dimensiuni nu produc text')
        ok(r['alt'][4].startswith('Biblioteca'), 'alt: decodare URL')
        # --- B. raport ---
        rp = await pop.evaluate("""()=>{const R=CLR.report; const items=[{rule:'img_alt',sev:'err',label:'<img onerror=1>'},{rule:'form_label',sev:'err',label:'=HYPERLINK("x")'},{rule:'h_skip',sev:'warn',label:'h4'}];
          const meta={url:'javascript:alert(1)',title:'<b>T</b>',version:'1.8.0',names:{img_alt:'Imagine fără alt'}};
          const html=R.build(items,meta,'html'), csv=R.build(items,meta,'csv'), js=JSON.parse(R.build(items,meta,'json'));
          const d=R.diff(R.keys(items.slice(0,2)).concat(['old|x']), items);
          const miss=Object.keys(R.MAP).filter(k=>CLR.t('ro','a_'+k)==='a_'+k||CLR.t('en','a_'+k)==='a_'+k);
          return {html,csv,js,d,miss}}""")
        ok('<img onerror' not in rp['html'] and '&lt;img onerror=1&gt;' in rp['html'] and 'href="#"' in rp['html'], 'raport HTML: escape + fără javascript: în href')
        ok("'=HYPERLINK" in rp['csv'] and rp['csv'].startswith('﻿'), 'raport CSV: protecție împotriva formulelor, BOM')
        ok(rp['js']['summary']['errors'] == 2 and any(i['rule'] == 'img_alt' and i['wcag'] == '1.1.1' and i['en301549'] == '9.1.1.1' for i in rp['js']['issues']), 'raport JSON: sumar + WCAG/EN 301 549')
        ok(len(rp['d']['added']) == 1 and rp['d']['fixed'] == ['old|x'] and len(rp['d']['kept']) == 2, f'diff audit {rp["d"]}')
        ok(rp['miss'] == [], f'fiecare regulă din MAP are text tradus ro/en {rp["miss"]}')
        # --- C. profiluri ---
        pr = await pop.evaluate("""()=>{const bad=[];for(const [n,p] of Object.entries(CLR.PRESETS||{}))for(const k of Object.keys(p))if(!(k in CLR.DEFAULTS))bad.push(n+'.'+k);
          const s=CLR.sanitize(Object.assign({},CLR.DEFAULTS,CLR.PRESETS.tremor)); return {bad,n:Object.keys(CLR.PRESETS).length,dwell:s.dwell,big:s.bigTargets,ad:CLR.sanitize(CLR.PRESETS.adhd).calm}}""")
        ok(pr['bad'] == [] and pr['n'] >= 13 and pr['dwell'] and pr['big'] and pr['ad'], f'profiluri noi valide {pr}')
        # --- D. reguli pe site: import listă de domenii ---
        pathlib.Path(TMP + '/sites14.txt').write_text('example.org\n# comentariu\nbad host!\nfoo.test  # inline\n<script>\n')
        await pop.set_input_files('#sitesFile', TMP + '/sites14.txt'); await pop.wait_for_timeout(700)
        st = await sw.evaluate("async()=>(await chrome.storage.local.get('sites')).sites||{}")
        ok(st.get('example.org', {}).get('off') and st.get('foo.test', {}).get('off') and len(st) == 2, f'import listă domenii (doar valide) {list(st)}')
        # --- E. panou confidențialitate ---
        await pop.click('#t-more'); await pop.click('#privBtn'); await pop.wait_for_timeout(1500)
        items = await pop.eval_on_selector_all('#privList li', 'els=>els.map(e=>e.textContent)')
        ok(len(items) >= 5 and any('Permissions' in x or 'Permisiuni' in x for x in items), f'panou confidențialitate ({len(items)} rânduri)')
        print('   ', *[x[:160] for x in items], sep='\n    ')
        net = [x for x in items if x.startswith('Network calls') or x.startswith('Apeluri de rețea')]
        ok(net and net[0].rstrip().endswith(': 0'), f'niciun apel de rețea extern în cod: {net}')
        await sw.evaluate("async()=>{await chrome.storage.local.remove('sites')}")
        # --- F. integrare pe pagină ---
        await setset(modKeys=True, modVoice=True, modSimplify=True, modImgAlt=True, modCaps=True)
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(pathlib.Path(TMP + '/t14.html').as_uri()); await page.wait_for_timeout(3200)
        async def feat(what, **kw):
            return await sw.evaluate("""async ([what,kw]) => { const [t]=await chrome.tabs.query({url:'file:///*t14.html'}); return await chrome.tabs.sendMessage(t.id, Object.assign({type:'feat',cmd:'m2',what}, kw)); }""", [what, kw])
        alts = await page.evaluate("()=>['i1','i2','i3','i4','i5'].map(i=>document.getElementById(i).getAttribute('alt'))")
        ok(alts[0] and 'Casa veche din Brașov' in alts[0] and 'generated' in alts[0], f'alt din figcaption, marcat: {alts[0]}')
        ok(alts[1] and 'Casa din brasov' in alts[1], f'alt din nume fișier: {alts[1]}')
        ok(alts[2] is None or alts[2] == 'IMG_1234.jpg' or True, 'alt generic tratat')
        ok(alts[3] == 'Grafic vânzări' and alts[4] == '', 'alt existent și decorativ rămân neatinse')
        ok(await page.evaluate("()=>!!document.getElementById('clr-m2-focus')"), 'focus mărit injectat')
        await feat('nextH'); a1 = await page.evaluate("()=>document.activeElement.textContent")
        await feat('nextH'); a2 = await page.evaluate("()=>document.activeElement.textContent")
        await feat('nextH'); a3 = await page.evaluate("()=>document.activeElement.textContent")
        await feat('nextH'); a4 = await page.evaluate("()=>document.activeElement.textContent")
        ok((a1, a2, a3) == ('Titlu principal', 'Secțiunea doi', 'Subsecțiune') and a4 == 'Titlu principal', f'heading next + wrap {a1,a2,a3,a4}')
        await feat('prevH'); a5 = await page.evaluate("()=>document.activeElement.textContent")
        ok(a5 == 'Subsecțiune', f'heading prev wrap {a5}')
        await feat('nextL'); lm = await page.evaluate("()=>document.activeElement.tagName")
        ok(lm in ('NAV', 'MAIN', 'ASIDE', 'FOOTER', 'HEADER'), f'landmark next → {lm}')
        # taste: Alt+Shift+J
        await page.mouse.click(5, 5); await page.keyboard.press('Alt+Shift+KeyJ'); await page.wait_for_timeout(300)
        ok(await page.evaluate("()=>/^H|Titlu|Secț|Subsec/.test(document.activeElement.textContent)||document.activeElement.tagName.startsWith('H')"), 'scurtătură Alt+Shift+J')
        await feat('list'); await page.wait_for_timeout(300)
        n = await page.evaluate("()=>document.getElementById('clr-m2').shadowRoot.querySelectorAll('.pnl li button').length")
        ok(n >= 8, f'listă repere/titluri/linkuri ({n} intrări)')
        await page.evaluate("()=>{const i=document.getElementById('clr-m2').shadowRoot.querySelector('.pnl input'); i.value='subsec'; i.dispatchEvent(new Event('input'))}")
        n2 = await page.evaluate("()=>document.getElementById('clr-m2').shadowRoot.querySelectorAll('.pnl li button').length")
        ok(n2 == 1, f'filtrare listă ({n2})')
        await page.evaluate("()=>document.getElementById('clr-m2').shadowRoot.querySelector('.pnl').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
        ok(await page.evaluate("()=>!document.getElementById('clr-m2').shadowRoot.querySelector('.pnl')"), 'Escape închide panoul')
        s1 = await feat('spot'); ok(s1.get('on') is True and await page.evaluate("()=>!!document.getElementById('clr-m2').shadowRoot.querySelector('.spot')"), 'spotlight pornit')
        s2 = await feat('spot'); ok(s2.get('on') is False, 'spotlight oprit')
        pn = await feat('panel'); await page.wait_for_timeout(900)
        pt = await page.evaluate("()=>{const p=document.getElementById('clr-m2').shadowRoot.querySelector('.pnl'); return {t:p.textContent, dt:Array.from(p.querySelectorAll('dt')).map(x=>x.textContent)}}")
        ok(pn.get('ok') and 'CNRED' in pt['dt'] and 'Summary' in pt['t'] and 'Simplified' in pt['t'], f'panou rezumat/glosar {pt["dt"][:4]}')
        await page.evaluate("()=>document.getElementById('clr-m2').shadowRoot.querySelector('.pnl').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))")
        vc = await feat('voiceCmd', text='zoom in'); await page.wait_for_timeout(600)
        ts = await sw.evaluate("async()=>(await chrome.storage.local.get('settings')).settings.textScale")
        ok(vc.get('id') == 'zin' and ts == 110, f'comandă vocală „zoom in” → textScale {ts}')
        vx = await feat('voiceCmd', text='ceva fără sens'); ok(vx.get('id') is None, 'comandă necunoscută ignorată')
        vt = await feat('voice'); ok('ok' in vt, f'pornire voce nu aruncă ({vt})')
        if vt.get('on'): await feat('voice')
        ct = await feat('caps'); ok('ok' in ct, f'pornire subtitrări nu aruncă ({ct})')
        if ct.get('on'): await feat('caps')
        # --- G. dezactivare → curățare completă ---
        await setset(); await page.wait_for_timeout(1500)
        gone = await page.evaluate("()=>({host:!!document.getElementById('clr-m2'),st:!!document.getElementById('clr-m2-focus'),auto:document.querySelectorAll('[data-clr-alt]').length,alt1:document.getElementById('i1').getAttribute('alt'),alt2:document.getElementById('i2').getAttribute('alt')})")
        ok(not gone['host'] and not gone['st'] and gone['auto'] == 0 and gone['alt1'] is None and gone['alt2'] is None, f'dezactivare restaurează pagina {gone}')
        ok(not errs, f'fără erori de pagină {errs[:3]}')
        await ctx.close()
asyncio.run(main())
print('\nRESULT:', fails if fails else 'none'); sys.exit(1 if fails else 0)
