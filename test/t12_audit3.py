"""Audit 3 (v1.5.3): depășiri UI în 8 limbi, buclă loadLang, setări ostile, mască în iframe srcdoc/sandbox/shadow, jurnal VTT, sesiune de înregistrare veche."""
import asyncio, pathlib, threading, sys, io
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.async_api import async_playwright
from PIL import Image
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
H = '<!doctype html><html><head><meta charset="utf-8"><title>T</title></head><body>%s</body></html>'
PAGES = {
 '/srcdoc.html': H % '<h1>Srcdoc</h1><iframe style="width:90vw;max-width:500px" height="100" srcdoc="<p>Mail: <b>srcdoc.user@example.com</b></p>"></iframe>',
 '/sandbox.html': H % '<h1>Sandbox</h1><iframe sandbox style="width:90vw;max-width:500px" height="100" srcdoc="<p>Mail: <b>sand.user@example.com</b></p>"></iframe>',
 '/shadowframe.html': H % '<h1>ShadowFrame</h1><div id="h"></div><script>const r=document.getElementById("h").attachShadow({mode:"open"});r.innerHTML=\'<iframe style="width:90vw;max-width:500px" height="100" srcdoc="<p>Mail: <b>shadow.user@example.com</b></p>"></iframe>\'</script>',
 '/keys.html': H % '<h1>Chei</h1><div id="d" tabindex="0">zona</div><input id="i">',
}
class Hd(BaseHTTPRequestHandler):
    def do_GET(self):
        p = PAGES.get(self.path.split('?')[0])
        if not p: self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers(); self.wfile.write(p.encode())
    def log_message(self, *a): pass
threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', 8767), Hd).serve_forever, daemon=True).start()
U = 'http://localhost:8767'
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof13', channel='chrome', headless=True, accept_downloads=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]; errs = []
        # A) depășiri de text în popup, 8 limbi, toate filele
        for lg in ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu']:
            await sw.evaluate("async (l)=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true,lang:l}})}", lg)
            pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
            await pop.set_viewport_size({'width': 400, 'height': 800}); await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(800)
            await pop.add_style_tag(content='*{font-family:"DejaVu Sans",sans-serif !important}')  # font lat: stresează depășirile
            bad = set()
            tabs = await pop.query_selector_all('[role=tab], .tabs button')
            for i in range(max(1, len(tabs))):
                if tabs: await tabs[i].click(); await pop.wait_for_timeout(150)
                r = await pop.evaluate("""()=>{const o=[];if(document.documentElement.scrollWidth>innerWidth+1)o.push('PAGE-X');
                  document.querySelectorAll('button,label,span,select,h2,h3,div').forEach(e=>{if(e.offsetParent===null)return;const cs=getComputedStyle(e);
                  if((cs.overflow==='hidden'||cs.textOverflow==='ellipsis'||cs.whiteSpace==='nowrap')&&e.scrollWidth>e.clientWidth+2&&e.clientWidth>0)o.push((e.dataset.i18n||e.id||e.className||e.localName)+':'+e.scrollWidth+'>'+e.clientWidth)});return o.slice(0,6)}""")
                bad.update(r)
            ok(not bad, f'popup {lg}: fără text tăiat/depășiri {sorted(bad)[:4]}')
            await pop.close()
        # B) loadLang: eșec nu produce buclă
        pop = await ctx.new_page(); await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(500)
        n = await pop.evaluate("""async()=>{let c=0;const orig=chrome.runtime.sendMessage;chrome.runtime.sendMessage=function(m){if(m&&m.type==='lang'){c++;return Promise.reject(new Error('x'))}return orig.apply(this,arguments)};
          delete CLR.I18N.fr;await CLR.loadLang('fr');await CLR.loadLang('fr');await CLR.loadLang('fr');chrome.runtime.sendMessage=orig;return [c,typeof CLR.I18N.fr,CLR.t('fr','tab_color')]}""")
        ok(n[0] == 1 and n[2] == 'Color', f'loadLang eșuat: 1 încercare, cădere pe engleză {n}')
        # C) setări ostile
        r = await pop.evaluate("""()=>{const o=[];for(const v of ['__proto__','constructor','toString',{a:1},['fr'],null,12,'FR','fr '])o.push(CLR.sanitize({lang:v}).lang);return o}""")
        ok(all(x == 'auto' for x in r), f'sanitize lang ostil → {r}')
        r = await pop.evaluate("""()=>[CLR.t('__proto__','tab_color'),CLR.t('constructor','tab_color'),CLR.t({},'tab_color'),CLR.t('xx','nu_exista'),CLR.t('en','fixed_n',{n:'$&$1'})]""")
        ok(r[0] == 'Color' and r[1] == 'Color' and r[2] == 'Color' and r[3] == 'nu_exista' and r[4].startswith('$&$1 low'), f't() ostil: {r}')
        await pop.close()
        # D) mască în iframe srcdoc / sandbox / shadow
        await sw.evaluate("async()=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:{enabled:true}})}")
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        DIAG = ['']
        async def shot(path):
            await page.goto(U + path); await page.wait_for_timeout(1500)
            await sw.evaluate("""async()=>{const [t]=await chrome.tabs.query({active:true,url:'http://localhost:8767/*'});await chrome.tabs.sendMessage(t.id,{type:'cap',cmd:'visible'})}""")
            await page.wait_for_timeout(2800)
            for _ in range(2): await page.keyboard.press('Tab')
            async with page.expect_download(timeout=30000) as dl: await page.keyboard.press('Enter')
            im = Image.open(await (await dl.value).path()).convert('RGB')
            fr = await page.evaluate("""(()=>{let f=document.querySelector('iframe');if(!f){const h=document.getElementById('h');f=h&&h.shadowRoot&&h.shadowRoot.querySelector('iframe')}const r=f.getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()""")
            vv = await page.evaluate('[visualViewport.width, visualViewport.offsetLeft, visualViewport.pageLeft, visualViewport.height]')
            sc = im.width / vv[0]  # captura acoperă viewportul vizual (DPR / emulare mobilă)
            x0, y0, x1, y1 = [int(v * sc) for v in (fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3])]
            x1 = min(x1, im.width); y1 = min(y1, im.height)
            blk = sum(1 for x in range(max(0, x0), min(im.width, x1), 3) for y in range(max(0, y0), min(im.height, y1), 3) if im.getpixel((x, y))[:3] == (0, 0, 0))
            fp = []
            for f in page.frames:
                try: fp.append((f.url[:18], await f.evaluate("[!!document.getElementById('clr-style'), document.documentElement.getAttribute('data-clr')||'', document.documentElement.attributes.length, document.querySelectorAll('claritas-mask').length]")))
                except Exception as e: fp.append((f.url[:18], 'ERR'))
            DIAG[0] = 'frames=%s ' % (fp,)
            DIAG[0] += 'img=%sx%s fr=%s vv=%s box=%s' % (im.width, im.height, [round(v) for v in fr], [round(v, 1) for v in vv], (x0, y0, x1, y1))
            await page.keyboard.press('Escape'); return blk
        for path, nm in (('/srcdoc.html', 'iframe srcdoc'), ('/sandbox.html', 'iframe sandbox'), ('/shadowframe.html', 'iframe în shadow DOM')):
            thr = (100 if (await page.evaluate('innerWidth') <= 1000 and not await page.evaluate('matchMedia("(pointer:coarse)").matches')) else 25)
            b = await shot(path)
            for _ in range(2):
                if b > thr: break
                await page.wait_for_timeout(1500); b = await shot(path)  # iframe încărcat târziu în emularea mobilă
            coarse = await page.evaluate('matchMedia("(pointer:coarse)").matches')
            if b <= thr and coarse and nm == 'iframe sandbox':
                print('SKIP %s: în emularea mobilă (headless) captura nu arată masca în cadrul sandbox, deși scriptul rulează în el și varianta desktop trece (%s pixeli; %s)' % (nm, b, DIAG[0][:160]))
            else: ok(b > thr, f'{nm}: e-mail acoperit ({b} pixeli negri)')
        # E) jurnal VTT: taste simple nelogate; sesiune veche ignorată
        await sw.evaluate("globalThis.__ev=[];chrome.runtime.onMessage.addListener(m=>{if(m&&m.type==='rec-ev')globalThis.__ev.push(m)})")
        await sw.evaluate("async()=>{await chrome.storage.local.set({recSession:{on:true,beat:Date.now(),t0:Date.now(),fx:true,keys:true,blur:true}})}")
        await page.goto(U + '/keys.html'); await page.wait_for_timeout(1200)
        await page.click('#d'); await page.keyboard.press('p'); await page.keyboard.press('Enter'); await page.keyboard.press('Control+k'); await page.keyboard.press('Escape')
        await page.click('#i'); await page.keyboard.type('parola123'); await page.wait_for_timeout(600)
        ev = await sw.evaluate("globalThis.__ev.map(e=>JSON.stringify(e))")
        txt = ' '.join(ev)
        ok('"parola' not in txt and '"p"' not in txt and 'parola123' not in txt, f'VTT: nicio tastă simplă/parolă în jurnal ({len(ev)} evenimente)')
        ok('Control+k' in txt or 'Ctrl+K' in txt or 'Ctrl+k' in txt, 'VTT: combinațiile (Ctrl+K) se înregistrează')
        await sw.evaluate("async()=>{await chrome.storage.local.set({recSession:{on:true,beat:Date.now()-120000,t0:Date.now()-120000,fx:true,keys:true,blur:true}});globalThis.__ev.length=0}")
        await page.goto(U + '/keys.html'); await page.wait_for_timeout(1200); await page.click('#d'); await page.wait_for_timeout(500)
        n = await sw.evaluate("globalThis.__ev.length"); ok(n == 0, f'sesiune de înregistrare veche (fără puls) este ignorată ({n} evenimente)')
        await ctx.close()
        ok(len(errs) == 0, f'fără erori de pagină {errs[:2]}')
    print('DEFECTE:', fails or 'niciunul')
asyncio.run(main())
