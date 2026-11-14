"""Module opționale v1.6: părți de vorbire, audit suplimentar, dicționar local, sincronizare profiluri (+ OCR dacă pachetul -ocr e construit)."""
import tempfile, asyncio, pathlib, json, sys, base64, os
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
OCR_EXT = pathlib.Path('../dist/chromium-ocr-unz')
TMP = tempfile.gettempdir().replace('\\', '/')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
HTML = """<!doctype html><html lang="en"><head><meta charset="utf-8"><title>t</title>
<meta name="viewport" content="width=device-width, user-scalable=no"></head><body>
<div role="foo">x</div><button aria-labelledby="nope">b</button>
<div aria-hidden="true"><a href="#x">hidden focusable</a></div>
<input id="i1" type="text"><video src="data:video/mp4;base64,AAAA" controls></video>
<svg role="img" width="10" height="10"><rect width="5" height="5"/></svg>
<a href="/x"><button>nested</button></a>
<article><h1>Title</h1><p>The quick happiness was running quickly through the beautiful garden and everyone enjoyed management decisions.</p>
<p>Casa frumoasă are informația importantă și oamenii lucrează repede acolo, iar conducerea hotărăște.</p></article>
""" + "".join(f"<p>filler {i}</p>" for i in range(60)) + "</body></html>"
pathlib.Path(TMP + '/t13.html').write_text(HTML)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(TMP + '/prof13', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        eid = sw.url.split('/')[2]; errs = []
        await sw.evaluate("async()=>{await chrome.storage.local.clear();await chrome.storage.sync.clear();await chrome.storage.local.set({settings:{enabled:true,lang:'en'}})}")
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(900)
        # 1. părți de vorbire
        pos = await pop.evaluate("""()=>({
          a:CLR.mod.pos('happiness','en'), b:CLR.mod.pos('quickly','en'), c:CLR.mod.pos('running','en'), d:CLR.mod.pos('the','en'), e:CLR.mod.pos('beautiful','en'),
          f:CLR.mod.pos('informația','ro'), g:CLR.mod.pos('frumoasă','ro'), h:CLR.mod.pos('și','ro'), i:CLR.mod.pos('hotărăște','ro'), j:CLR.mod.pos('hello','de')})""")
        ok(pos['a'] == 'n' and pos['b'] == 'r' and pos['c'] == 'v' and pos['d'] == 'f' and pos['e'] == 'a', f'POS engleză {pos}')
        ok(pos['f'] == 'n' and pos['g'] == 'a' and pos['h'] == 'f' and pos['i'] == 'v', f'POS română {pos}')
        ok(pos['j'] == '', 'POS pentru limbă nesuportată = gol (nu inventează)')
        # 2. dicționar: parse + salvare + căutare
        r = await pop.evaluate("""async()=>{const M=CLR.mod; const j=M.dictParse('{"Casă":"clădire de locuit","frumoasă":["plăcută","atrăgătoare"]}'); const t=M.dictParse('carte\\to publicație tipărită\\nmasă;mobilă cu blat'); const bad=M.dictParse('nimic valid'); await M.dictSave(Object.assign({},j.dict,t.dict)); return {j:j.n,t:t.n,bad:bad.n,l1:await M.dictLookup('casă'),l2:await M.dictLookup('Frumoasă,'),l3:await M.dictLookup('carte'),l4:await M.dictLookup('inexistent'),cnt:await M.dictCount()}}""")
        ok(r['j'] == 2 and r['t'] == 2 and r['bad'] == 0, f'dictParse JSON/TSV {r}')
        ok(r['l1'] == 'clădire de locuit' and r['l2'] == 'plăcută; atrăgătoare' and r['l3'] == 'o publicație tipărită' and r['l4'] is None and r['cnt'] == 4, 'căutare în dicționar local (diacritice, majuscule, punctuație)')
        # import prin interfață
        pathlib.Path(TMP + '/d13.json').write_text(json.dumps({'alfa': 'prima literă', 'beta': 'a doua literă', 'gama': 'a treia'}, ensure_ascii=False))
        await pop.set_input_files('#dictFile', TMP + '/d13.json'); await pop.wait_for_timeout(600)
        info = await pop.inner_text('#dictInfo'); ok(info.startswith('3'), f'import dicționar din popup: «{info}»')
        # 3. audit suplimentar
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',modAuditPlus:false}})")
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(pathlib.Path(TMP + '/t13.html').as_uri()); await page.wait_for_timeout(1500)
        async def feat(cmd, **kw):
            return await sw.evaluate("""async ([cmd,kw]) => { const ts=await chrome.tabs.query({url:'file:///*'}); const t=ts[ts.length-1]; return await chrome.tabs.sendMessage(t.id, Object.assign({type:'feat',cmd}, kw)); }""", [cmd, kw])
        a0 = {i['rule'] for i in (await feat('audit'))['items']}
        ok('aria_role' not in a0 and 'viewport_zoom' not in a0, 'audit suplimentar oprit implicit: regulile noi nu apar')
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',modAuditPlus:true}})"); await page.wait_for_timeout(800)
        a1 = {i['rule'] for i in (await feat('audit'))['items']}
        for need in ['aria_role', 'aria_ref', 'form_label', 'aria_hidden_focus', 'viewport_zoom', 'video_captions', 'svg_name', 'nested_interactive', 'main_missing']:
            ok(need in a1, f'audit suplimentar detectează {need}')
        # 4. dicționar în bara de selecție: cuvânt din dicționar nu deschide fila online; cuvânt absent da
        # (bara e în shadow DOM închis; verificăm efectul: număr de pagini noi)
        # 5. Cititor cu părți de vorbire
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',modPos:true},reader:{pos:true,theme:'light',size:20,width:68,lh:1.7,font:'sans'}})"); await page.wait_for_timeout(600)
        await feat('reader'); await page.wait_for_timeout(1200)
        st = await feat('readerStats')
        ok(st.get('open') and st['pos'] >= 5 and st['noun'] >= 2, f'Cititor: cuvinte etichetate cu părți de vorbire {st}')
        await feat('reader')
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',modPos:false},reader:{pos:true,theme:'light',size:20,width:68,lh:1.7,font:'sans'}})"); await page.wait_for_timeout(600)
        await feat('reader'); await page.wait_for_timeout(1000)
        st2 = await feat('readerStats'); ok(st2.get('open') and st2['pos'] == 0, f'modul oprit: nicio etichetă ({st2})')
        await feat('reader')
        # 6. sincronizare
        await sw.evaluate("()=>chrome.storage.sync.clear()")
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',syncProfiles:true,textScale:130},sites:{}})"); await page.wait_for_timeout(4500)
        meta = await sw.evaluate("async()=>(await chrome.storage.sync.get('cs_meta')).cs_meta")
        ok(meta and meta['n'] >= 1, f'sincronizare: setările urcă în storage.sync {meta}')
        got = await sw.evaluate("async()=>{const m=(await chrome.storage.sync.get('cs_meta')).cs_meta; let s=''; for(let i=0;i<m.n;i++) s+=(await chrome.storage.sync.get('cs_'+i))['cs_'+i]; return JSON.parse(decodeURIComponent(escape(atob(s))))}")
        ok(got['settings'].get('textScale') == 130 and 'syncProfiles' not in got['settings'], 'conținut sincronizat: setări fără opțiunea syncProfiles')
        other = {'settings': {'enabled': True, 'lang': 'en', 'textScale': 170}, 'sites': {}}
        b64 = base64.b64encode(json.dumps(other).encode()).decode()
        await sw.evaluate("""async(b)=>{await chrome.storage.sync.set({cs_0:b, cs_meta:{t:Date.now()+5000,n:1,dev:'altul'}})}""", b64); await page.wait_for_timeout(1500)
        loc = await sw.evaluate("async()=>(await chrome.storage.local.get('settings')).settings")
        ok(loc.get('textScale') == 170 and loc.get('syncProfiles') is True, f'de pe alt dispozitiv: setările se aplică local și syncProfiles rămâne pornit ({loc.get("textScale")})')
        await sw.evaluate("()=>chrome.storage.local.set({settings:{enabled:true,lang:'en',syncProfiles:false,textScale:90}})"); await page.wait_for_timeout(4000)
        meta2 = await sw.evaluate("async()=>(await chrome.storage.sync.get('cs_meta')).cs_meta")
        ok(meta2['dev'] == 'altul', 'sincronizare oprită: nu se mai scrie nimic în storage.sync')
        ok(not errs, f'fără erori de pagină {errs[:3]}')
        await ctx.close()
        # 7. OCR (doar dacă pachetul -ocr e despachetat)
        if (OCR_EXT / 'ocr.html').exists():
            ext2 = str(OCR_EXT.resolve())
            from PIL import Image, ImageDraw, ImageFont
            im = Image.new('RGB', (900, 200), 'white'); d = ImageDraw.Draw(im)
            f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 56) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') else ImageFont.load_default()
            d.text((30, 60), 'Hello Claritas OCR 2026', fill='black', font=f); im.save(TMP + '/ocr13.png')
            ctx2 = await p.chromium.launch_persistent_context(TMP + '/prof13b', channel='chrome', headless=True,
                args=[f'--disable-extensions-except={ext2}', f'--load-extension={ext2}', '--headless=new', '--no-sandbox'])
            sw2 = ctx2.service_workers[0] if ctx2.service_workers else await ctx2.wait_for_event('serviceworker', timeout=30000)
            eid2 = sw2.url.split('/')[2]; pg = await ctx2.new_page(); e2 = []
            pg.on('pageerror', lambda e: e2.append(str(e))); pg.on('requestfailed', lambda r: e2.append('REQFAIL ' + r.url[:80]))
            await pg.goto(f'chrome-extension://{eid2}/ocr.html'); await pg.wait_for_timeout(1500)
            await pg.set_input_files('#file', TMP + '/ocr13.png'); await pg.select_option('#lang', 'eng'); await pg.click('#run')
            for _ in range(40):
                await pg.wait_for_timeout(2000)
                if await pg.evaluate('!!(window.__ocrDone||window.__ocrErr)'): break
            txt = await pg.input_value('#out'); err = (await pg.evaluate('window.__ocrErr||""')) + ' | ' + await pg.inner_text('#status') + ' | ' + str(e2[:3])
            ok('claritas' in txt.lower() and '2026' in txt, f'OCR local recunoaște textul: «{txt}» {err}')
            ext_reqs = [x for x in e2 if x.startswith('REQFAIL') and 'chrome-extension' not in x]
            ok(not ext_reqs, f'OCR fără cereri externe {ext_reqs[:2]}')
            await ctx2.close()
        else:
            print('SKIP OCR: dist/chromium-ocr-unz absent')
    print('\nEȘECURI:', fails if fails else 'niciunul'); sys.exit(1 if fails else 0)
asyncio.run(main())
