"""Module opționale v1.8: inspector contrast, hartă tab/nume, listă de citit, CSS pe site, matematică, IA locală (stub), ghid voci, axe-core, cititor PDF."""
import tempfile, asyncio, pathlib, json, sys, threading, http.server, socketserver, zipfile, shutil, functools
from playwright.async_api import async_playwright
DIST = pathlib.Path('../dist').resolve()
EXT = str(DIST / 'chromium')
TMP = tempfile.gettempdir().replace('\\', '/')
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
W = pathlib.Path(TMP + '/t15www'); shutil.rmtree(W, ignore_errors=True); W.mkdir()
(W / 'p.html').write_text("""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Test page</title></head><body>
<main><h1>Title</h1>
<p id="low" style="color:#aaaaaa;background:#ffffff;font-size:16px">Low contrast gray text</p>
<p id="good" style="color:#000;background:#fff">Good text</p>
<div style="background:#003;"><span id="sa" style="color:rgba(255,255,255,.9)">Light on dark</span></div>
<button id="b1" tabindex="3">Positive tab</button><button id="b2"></button><a id="l1" href="#x">Named link</a>
<div id="d1" tabindex="0">generic focusable</div><div aria-hidden="true"><button id="b3">hidden focusable</button></div>
<input id="in1" type="text"><label for="in2">Labeled</label><input id="in2" type="text">
<math id="m1"><mfrac><mi>a</mi><mn>2</mn></mfrac><mo>+</mo><msup><mi>x</mi><mn>2</mn></msup><mo>=</mo><msqrt><mi>π</mi></msqrt></math>
<img id="im1" src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=" width="100" height="100">
<p>Some selected sentence for the reading list.</p></main></body></html>""")
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(W))); PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://localhost:{PORT}/p.html'
def unzip(name):
    if not (DIST / (name + '.zip')).exists(): return None
    d = pathlib.Path(TMP + '/' + name); shutil.rmtree(d, ignore_errors=True)
    zipfile.ZipFile(DIST / (name + '.zip')).extractall(d); return str(d)
SH = "document.getElementById('clr-m3') && document.getElementById('clr-m3').shadowRoot"
async def launch(p, ext, prof):
    return await p.chromium.launch_persistent_context(TMP + '/' + prof, channel='chrome', headless=True, accept_downloads=True,
        args=[f'--disable-extensions-except={ext}', f'--load-extension={ext}', '--headless=new', '--no-sandbox'], viewport={'width': 1000, 'height': 800})
async def main():
    async with async_playwright() as p:
        ctx = await launch(p, EXT, 'prof15')
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]; errs = []
        async def setset(**kw):
            base = dict(enabled=True, lang='en', noMotion=True); base.update(kw)
            await sw.evaluate("async(s)=>{await chrome.storage.local.set({settings:s})}", base)
        await sw.evaluate("async()=>{await chrome.storage.local.clear()}")
        # ---- A. funcții pure ----
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(800)
        await pop.add_script_tag(url=f'chrome-extension://{eid}/modules3.js')
        r = await pop.evaluate("""()=>{const M=CLR.m3; const d=document.createElement('div'); d.innerHTML=`<button id=a aria-label="Close">x</button><button id=b>Save</button><button id=c></button>
          <input id=d aria-labelledby=lab><span id=lab>Name field</span><img id=e alt="Logo"><a id=f href=# title="Tip"></a><label for=g>Mail</label><input id=g>
          <math id=m1><mfrac><mi>a</mi><mn>2</mn></mfrac><mo>+</mo><msup><mi>x</mi><mn>2</mn></msup><mo>=</mo><msqrt><mi>π</mi></msqrt></math>
          <math id=m2><mrow><mi>b</mi><mo>≥</mo><msub><mi>x</mi><mn>1</mn></msub></mrow></math><math id=m3><mrow><msup><mi>y</mi><mn>5</mn></msup><mo>≠</mo><mn>0</mn></mrow></math>`;
          document.body.appendChild(d); const q=(i)=>d.querySelector('#'+i);
          return {n:['a','b','c','d','e','f','g'].map(i=>M.accName(q(i))), role:['a','d','e','f'].map(i=>M.roleOf(q(i))),
            m1:M.mathSpeech(q('m1'),'en'), m1r:M.mathSpeech(q('m1'),'ro'), m2:M.mathSpeech(q('m2'),'en'), m3:M.mathSpeech(q('m3'),'ro'),
            css:M.cleanCss('@import url(http://x/y.css); a{background:url(https://evil/x.png);color:red} b{background:url(data:image/png;base64,AA)} /* c */ i{behavior:url(x.htc)}'),
            rl:[M.rlClean({url:'javascript:alert(1)'}),M.rlClean({url:'https://a.b/c',title:'T',note:'n'})],
            md:M.rlMarkdown([{url:'https://a.b/c',title:'T [x]',note:'n1\\nn2',sel:'q',read:true},{url:'https://d.e',title:'',note:'',sel:'',read:false}],'List')}}""")
        ok(r['n'] == ['Close', 'Save', '', 'Name field', 'Logo', 'Tip', 'Mail'], f'accName {r["n"]}')
        ok(r['role'] == ['button', 'textbox', 'img', 'link'], f'roleOf {r["role"]}')
        ok(r['m1'] == 'the fraction a over 2 end fraction plus x squared equals the square root of pi end', f'mathSpeech EN: {r["m1"]}')
        ok('fracția a supra 2' in r['m1r'] and 'la pătrat' in r['m1r'] and 'rădăcina pătrată din pi' in r['m1r'], f'mathSpeech RO: {r["m1r"]}')
        ok(r['m2'] == 'b is greater than or equal to x sub 1', f'mathSpeech ≥/sub: {r["m2"]}')
        ok(r['m3'] == 'y la puterea 5 diferit de 0', f'mathSpeech putere: {r["m3"]}')
        ok('@import' not in r['css'] and 'evil' not in r['css'] and 'data:' not in r['css'] and 'behavior' not in r['css'] and 'color:red' in r['css'], f'cleanCss: {r["css"]}')
        ok(r['md'] == '# List\n\n- [x] [T x](https://a.b/c)\n  - n1\n    n2\n  - > q\n- [ ] [https://d.e](https://d.e)\n', f'export .md: {r["md"]!r}')
        ok(r['rl'][0] is None and r['rl'][1]['url'] == 'https://a.b/c', 'rlClean respinge javascript:')
        # ---- B. pagină reală ----
        await setset(autoFix=False, modInspect=True, modOrder=True, modReadList=True, modSiteCss=True, modMath=True, modAI=True)
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(URL); await page.wait_for_timeout(1500)
        # B1. matematică
        al = await page.evaluate("document.getElementById('m1').getAttribute('aria-label')")
        ok(bool(al) and 'fraction' in al and 'squared' in al, f'modMath: aria-label pe formulă: {al}')
        # B2. inspector
        await page.keyboard.press('Alt+Shift+I'); await page.wait_for_timeout(300)
        await page.hover('#low'); await page.wait_for_timeout(300)
        tip = await page.evaluate(f"({SH}).querySelector('.tip') && ({SH}).querySelector('.tip').textContent")
        ok(tip and '#aaaaaa' in tip and '2.3' in tip and 'AA ✗' in tip and '#' in tip.split('Suggestion')[-1], f'inspector: text slab: {tip}')
        await page.hover('#good'); await page.wait_for_timeout(300)
        tip = await page.evaluate(f"({SH}).querySelector('.tip').textContent")
        ok('21 : 1' in tip and 'AA ✓' in tip and 'AAA ✓' in tip, f'inspector: text bun: {tip}')
        await page.hover('#sa'); await page.wait_for_timeout(300)
        tip = await page.evaluate(f"({SH}).querySelector('.tip').textContent")
        ok('AA ✓' in tip and '#003' not in tip, f'inspector: alb translucid peste fundal închis: {tip}')
        await page.click('#low'); await page.wait_for_timeout(200); await page.hover('#good'); await page.wait_for_timeout(300)
        tip = await page.evaluate(f"({SH}).querySelector('.tip').textContent")
        ok('#aaaaaa' in tip and 'Pinned' in tip, 'inspector: clic fixează')
        await page.keyboard.press('Alt+Shift+I'); await page.wait_for_timeout(200)
        ok(await page.evaluate(f"!({SH}).querySelector('.tip')"), 'inspector: se închide')
        # B3. harta ordinii de tab
        await page.keyboard.press('Alt+Shift+T'); await page.wait_for_timeout(500)
        info = await page.evaluate(f"""()=>{{const r={SH}; return {{sum:r.querySelector('.pnl p').textContent, items:[...r.querySelectorAll('.pnl li')].map(l=>l.textContent), badges:r.querySelectorAll('.bdg').length}}}}""")
        ok(info['badges'] >= 7 and 'errors' in info['sum'], f'ordine: {info["sum"]}')
        j = ' | '.join(info['items'])
        ok(info['items'][0].startswith('1. button: Positive tab') and 'Positive tabindex' in info['items'][0], f'ordine: tabindex pozitiv primul: {info["items"][0][:90]}')
        ok('No accessible name' in j and 'aria-hidden' in j and 'tabindex on an element without a role' in j, f'ordine: probleme (fără nume, aria-hidden, generic): {j}')
        ok(await page.evaluate(f"({SH}).querySelector('.pnl').getAttribute('role')") == 'dialog', 'ordine: panou cu rol dialog')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        ok(await page.evaluate(f"!({SH}).querySelector('.pnl')"), 'ordine: Escape închide panoul')
        await page.keyboard.press('Alt+Shift+T'); await page.wait_for_timeout(300)  # toggle off layer if still on
        # B4. lista de citit
        await page.evaluate("getSelection().selectAllChildren(document.querySelector('main p:last-child'))")
        await page.keyboard.press('Alt+Shift+B'); await page.wait_for_timeout(400)
        await page.evaluate(f"""()=>{{const r={SH}; r.querySelector('.pnl textarea').value='my note'; [...r.querySelectorAll('.pnl button')].find(b=>b.textContent.startsWith('Save this page')).click()}}""")
        await page.wait_for_timeout(500)
        rl = await sw.evaluate("async()=>(await chrome.storage.local.get('readList')).readList")
        ok(rl and rl[0]['url'] == URL and rl[0]['note'] == 'my note' and 'selected sentence' in rl[0]['sel'], f'listă de citit salvată: {json.dumps(rl)[:160]}')
        rows = await page.evaluate(f"({SH}).querySelectorAll('.pnl ul li').length")
        ok(rows == 1, 'listă de citit: apare în panou')
        await page.keyboard.press('Escape')
        # B5. CSS pe site
        await page.keyboard.press('Alt+Shift+U'); await page.wait_for_timeout(300)
        await page.evaluate(f"""()=>{{const r={SH}; r.querySelector('.pnl textarea').value='@import url(//x.y/z.css); #good{{color:rgb(1,2,3) !important}}'; [...r.querySelectorAll('.pnl button')].find(b=>b.textContent==='Save').click()}}""")
        await page.wait_for_timeout(500)
        col = await page.evaluate("getComputedStyle(document.getElementById('good')).color")
        ok(col == 'rgb(1, 2, 3)', f'CSS pe site aplicat: {col}')
        st = await sw.evaluate("async()=>(await chrome.storage.local.get('siteCss')).siteCss")
        ok(st and 'localhost' in st and '@import' not in st['localhost'], f'CSS salvat curățat: {st}')
        await page.keyboard.press('Escape'); await page.reload(); await page.wait_for_timeout(1200)
        col = await page.evaluate("getComputedStyle(document.getElementById('good')).color")
        ok(col == 'rgb(1, 2, 3)', 'CSS pe site persistă după reîncărcare')
        # B6. IA: indisponibilă în context real → mesaj, fără erori
        await page.keyboard.press('Alt+Shift+A'); await page.wait_for_timeout(400)
        msg = await page.evaluate(f"({SH}).querySelector('.pnl') && ({SH}).querySelector('.pnl').textContent")
        ok(msg and ('Not available' in msg or 'Ask' in msg), f'IA: panou deschis ({"fără model local" if "Not available" in msg else "model prezent"})')
        await page.keyboard.press('Escape')
        # B7. dezactivare modul -> se curăță
        await setset(); await page.wait_for_timeout(800)
        gone = await page.evaluate("[!document.getElementById('clr-m3-css'), !document.getElementById('m1').hasAttribute('aria-label')]")
        ok(all(gone), f'dezactivare: CSS și aria-label eliminate {gone}')
        # ---- C. IA cu stub (pagină de extensie) ----
        ai = await ctx.new_page()
        await ai.goto(f'chrome-extension://{eid}/popup.html'); await ai.wait_for_timeout(700)
        await ai.evaluate("""()=>{window.LanguageModel={availability:async()=>'available',create:async(o)=>({prompt:async(x)=>'A cat on a sofa',promptStreaming:(q)=>(async function*(){yield 'Answer ';yield 'about '+q})()})};
          document.body.innerHTML='<main><p>Page text about cats.</p><img id=zi width=120 height=120></main>'; const c=document.createElement('canvas');c.width=c.height=120;c.getContext('2d').fillRect(0,0,120,120);document.getElementById('zi').src=c.toDataURL();}""")
        await ai.wait_for_timeout(300); await ai.add_script_tag(url=f'chrome-extension://{eid}/modules3.js')
        res = await ai.evaluate("""async()=>{const S=Object.assign({},CLR.DEFAULTS,{enabled:true,lang:'en',modAI:true});
          CLR.ctx={S,active:true,isTop:true,doc:document}; CLR.m3.onApply(S,true); CLR.m3.run({what:'ai'}); await new Promise(r=>setTimeout(r,300));
          const root=document.getElementById('clr-m3').shadowRoot; const q=root.querySelector('.pnl input'); q.value='What?';
          [...root.querySelectorAll('.pnl button')].find(b=>b.textContent==='Ask').click(); await new Promise(r=>setTimeout(r,600));
          const ans=root.querySelector('.pnl div[aria-live]').textContent;
          [...root.querySelectorAll('.pnl button')].find(b=>b.textContent==='Suggest image descriptions').click(); await new Promise(r=>setTimeout(r,900));
          const desc=root.querySelector('.pnl div[aria-live]').textContent;
          const ap=[...root.querySelectorAll('.pnl button')].find(b=>b.textContent==='Use as alt text'); if(ap) ap.click();
          return {ans,desc,alt:document.getElementById('zi').getAttribute('alt')}}""")
        ok('Answer about What?' in res['ans'] and 'Auto-generated' in res['ans'], f'IA (stub): răspuns marcat generat automat: {res["ans"][:80]}')
        ok('A cat on a sofa' in res['desc'] and res['alt'] == 'A cat on a sofa', f'IA (stub): descriere imagine + aplicare alt: {res["alt"]}')
        # ---- D. ghid voci în popup ----
        await pop.reload(); await pop.wait_for_timeout(900)
        await pop.evaluate("""()=>{const v=[{name:'Local RO',lang:'ro-RO',localService:true,voiceURI:'l1',default:false},{name:'Online Neural RO',lang:'ro-RO',localService:false,voiceURI:'o1',default:false},{name:'English',lang:'en-US',localService:true,voiceURI:'e1',default:true}];
          speechSynthesis.getVoices=()=>v; speechSynthesis.dispatchEvent(new Event('voiceschanged'));}""")
        await pop.evaluate("document.querySelector('select[data-k=lang]').value='ro'; document.querySelector('select[data-k=lang]').dispatchEvent(new Event('change',{bubbles:true}))")
        await pop.wait_for_timeout(500)
        await pop.evaluate("document.getElementById('vgBtn').click()"); await pop.wait_for_timeout(400)
        items = await pop.evaluate("[...document.querySelectorAll('#vgList li')].map(l=>l.textContent)")
        ok(len(items) == 2 and items[0].startswith('Local RO') and 'locală' in items[0] and 'online' in items[1], f'ghid voci: locale înaintea celor online {items}')
        await pop.close()
        ok(len(errs) == 0, f'fără erori {errs[:3]}')
        await ctx.close()
        # ---- E. varianta -axe ----
        axe = unzip('claritas-chromium-axe')
        if axe is None: print('SKIP varianta -axe (rulează tools/fetch_vendor.sh și build.py)')
        else:
            ctx = await launch(p, axe, 'prof15a'); sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
            await sw.evaluate("async()=>{await chrome.storage.local.set({settings:{enabled:true,lang:'en',modAI:true}})}")
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1500)
            eid2 = sw.url.split('/')[2]
            pop2 = await ctx.new_page(); await pop2.goto(f'chrome-extension://{eid2}/popup.html'); await pop2.wait_for_timeout(900)
            vis = await pop2.evaluate("!document.getElementById('axeBtn').hidden"); ok(vis, 'varianta -axe: butonul axe apare în popup')
            await pop2.close()
            res = await pg.evaluate("window.__x=1")  # pagina principală
            await sw.evaluate("async()=>{const [t]=await chrome.tabs.query({url:'http://localhost/*'}); if(t) await chrome.tabs.sendMessage(t.id,{type:'feat',cmd:'m3',what:'axe'})}")
            await pg.wait_for_timeout(2500)
            txt = await pg.evaluate(f"({SH}) && ({SH}).querySelector('.pnl') ? ({SH}).querySelector('.pnl').textContent : ''")
            ok('axe-core' in txt and 'violation types found' in txt and ('label' in txt or 'image-alt' in txt or 'button-name' in txt), f'axe: raport în pagină: {txt[:140]}')
            await ctx.close()
        # ---- F. varianta -pdf ----
        pdfd = unzip('claritas-chromium-pdf')
        if pdfd is None: print('SKIP varianta -pdf (rulează tools/fetch_vendor.sh și build.py)')
        else:
            ctx = await launch(p, pdfd, 'prof15p'); sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
            eid3 = sw.url.split('/')[2]
            pp = await ctx.new_page(); perr = []; pp.on('pageerror', lambda e: perr.append(str(e)))
            await pp.goto(f'chrome-extension://{eid3}/pdf.html'); await pp.wait_for_timeout(900)
            await pp.set_input_files('#f', str(pathlib.Path('sample.pdf').resolve())); await pp.wait_for_timeout(4000)
            d = await pp.evaluate("({segs:[...document.querySelectorAll('p.seg')].map(p=>p.textContent), pages:document.querySelectorAll('section.pg').length, st:document.getElementById('status').textContent, nav:!document.getElementById('nav').hidden, links:[...document.querySelectorAll('#ol a')].map(a=>a.textContent+'>'+a.getAttribute('href'))})")
            ok(d['pages'] == 2 and any('Claritas' in s for s in d['segs']) and any('second paragraph' in s for s in d['segs']), f'PDF: {d["pages"]} pagini, paragrafe {d["segs"][:3]}')
            ok(not any(s.endswith('-') for s in d['segs']) and any('accessibility' in s for s in d['segs']), 'PDF: cuvânt despărțit la capăt de rând reunit')
            ok(d['nav'] and any('Chapter' in l for l in d['links']), f'PDF: cuprins {d["links"]}')
            await pp.fill('#q', 'paragraph'); await pp.wait_for_timeout(300)
            ok(await pp.evaluate("document.querySelectorAll('mark').length") >= 1, 'PDF: căutare evidențiază')
            await pp.select_option('#th', 'dark'); ok(await pp.evaluate("document.body.className") == 'dark', 'PDF: temă')
            ok(len(perr) == 0, f'PDF: fără erori {perr[:2]}')
            await ctx.close()
    srv.shutdown()
    print('EȘECURI:', fails or 'niciunul')
    sys.exit(1 if fails else 0)
asyncio.run(main())
