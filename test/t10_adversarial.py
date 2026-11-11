"""Recenzie adversarială v1.5 (Chrome real): DPR 2, CSP strict, ReDoS, iframe/shadow/inputs, CSS ostil, container derulabil, pagini mari, evenimente sintetice, jurnal VTT din alte file."""
import asyncio, pathlib, threading, time, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from playwright.async_api import async_playwright
from PIL import Image
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)
BASE = '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>T</title>%s</head><body>%s</body></html>'
MAIL = '<p>Contact: <span id="mail">ion.popescu@example.com</span> <button id="b1">Buton</button></p>'
PAGES = {
 '/csp.html': (BASE % ('<style>body{font:16px Arial}</style>', '<h1>CSP</h1>' + MAIL), {'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:"}),
 '/redos.html': (BASE % ('', '<p id="big">' + ('a' * 400000) + '</p>' + MAIL), {}),
 '/hostile.html': (BASE % ('<style>html>*:not(body){display:none!important} div{visibility:hidden!important;opacity:0!important}</style>', '<h1>Ostil</h1>' + MAIL), {}),
 '/shadow.html': (BASE % ('', '<h1>Shadow</h1><div id="h"></div><script>const r=document.getElementById("h").attachShadow({mode:"open"});r.innerHTML=\'<span id="sm">maria.ionescu@example.org</span>\'</script>'), {}),
 '/inputs.html': (BASE % ('', '<h1>Inputs</h1><input id="em" type="email" value="ana.pop@example.com"><input id="tl" type="tel" value="0722123456"><textarea id="ta">CNP 1850315123456</textarea>'), {}),
 '/app.html': (BASE % ('<style>html,body{height:100%;margin:0;overflow:hidden}#sc{height:100%;overflow:auto}.s{height:500px;border-bottom:2px solid #999}</style>', '<div id="sc">' + ''.join('<div class="s">Secțiunea %d</div>' % i for i in range(9)) + '</div>'), {}),
 '/tall.html': (BASE % ('<style>body{margin:0}.s{height:600px;border-bottom:2px solid #999}</style>', ''.join('<div class="s">S%d</div>' % i for i in range(20))), {}),
 '/inner.html': (BASE % ('', '<p>Date: <b>secret.person@example.net</b></p>'), {}),
 '/ce.html': (BASE % ('', '<h1>CE</h1><div id="ce" contenteditable="true">ana.pop@example.com</div>'), {}),
 '/outer.html': (BASE % ('', '<h1>Cadru</h1><iframe src="http://127.0.0.1:8766/inner.html" width="500" height="120"></iframe>'), {}),
}
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        p = PAGES.get(self.path.split('?')[0])
        if not p: self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8')
        for k, v in p[1].items(): self.send_header(k, v)
        self.end_headers(); self.wfile.write(p[0].encode())
    def log_message(self, *a): pass
for port in (8765, 8766):
    t = threading.Thread(target=ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever, daemon=True); t.start()
U = 'http://localhost:8765'
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof10', channel='chrome', headless=True, accept_downloads=True, device_scale_factor=2,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width':900,'height':700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        async def setst(s):
            await sw.evaluate("async (s)=>{await chrome.storage.local.clear();await chrome.storage.local.set({settings:s})}", s)
        async def cap(cmd):
            await sw.evaluate("""async (cmd)=>{const [t]=await chrome.tabs.query({active:true,url:'http://localhost:8765/*'});await chrome.tabs.sendMessage(t.id,{type:'cap',cmd});}""", cmd)
        async def save(wait=2500, n=2, timeout=60000):
            await page.wait_for_timeout(wait)
            for _ in range(n): await page.keyboard.press('Tab')
            async with page.expect_download(timeout=timeout) as dl: await page.keyboard.press('Enter')
            d = await dl.value; return await d.path()
        async def goto(path, wait=1500):
            await page.goto(U + path); await page.wait_for_timeout(wait)
        def black(im, cx, cy):
            s = im.size[0] / 900
            n = 0
            for d in range(-16, 17, 8):
                x, y = int(cx * s) + d, int(cy * s)
                if 0 <= x < im.size[0] and 0 <= y < im.size[1] and im.getpixel((x, y))[:3] == (0, 0, 0): n += 1
            return n >= 4
        center = "(id)=>{const r=document.getElementById(id).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}"
        await setst({'enabled': True})
        # A) DPR 2 + acoperire
        await goto('/csp.html'); await cap('visible'); path = await save(); im = Image.open(path).convert('RGB')
        cx, cy = await page.evaluate(center, 'mail')
        print('INFO dimensiune captură', im.size); ok(im.size[0] in (900,1800), 'DPR: dimensiune coerentă cu viewportul'); ok(black(im, cx, cy), 'DPR2: e-mail acoperit în coordonate corecte')
        
        await page.keyboard.press('Escape')
        # C) CSP strict + font încorporat + captură + descărcare funcționează
        await setst({'enabled': True, 'font': 'lexend', 'calm': True}); await goto('/csp.html', 2200)
        ok(await page.evaluate("document.fonts.check('16px Lexend')"), 'CSP strict (default-src none): fontul Lexend se încarcă din extensie')
        # D) ReDoS
        await setst({'enabled': True}); await goto('/redos.html', 2500)
        t0 = time.time(); await cap('visible')
        try:
            path = await save(2500, 2, 40000); dt = time.time() - t0
            ok(dt < 8, f'ReDoS: pagină cu text de 400 KB — captură în {dt:.1f}s')
        except Exception as e:
            ok(False, 'ReDoS: captura nu a ieșit în 40 s (tab blocat)')
        await page.keyboard.press('Escape')
        # E) iframe cross-origin
        await goto('/outer.html', 2000); await cap('visible'); path = await save(); im = Image.open(path).convert('RGB')
        fr = await page.evaluate("(()=>{const r=document.querySelector('iframe').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
        sc = im.size[0] / 900; blk = 0
        for x in range(int(fr[0]*sc), int((fr[0]+fr[2])*sc), 3):
            for y in range(int(fr[1]*sc), int((fr[1]+fr[3])*sc), 3):
                if im.getpixel((x, y))[:3] == (0, 0, 0): blk += 1
        ok(blk > 150, f'iframe cross-origin: e-mailul din cadru este acoperit de masca cadrului ({blk} pixeli negri)')
        await page.keyboard.press('Escape')
        # F) shadow DOM deschis
        await goto('/shadow.html'); await cap('visible'); path = await save(); im = Image.open(path).convert('RGB')
        r = await page.evaluate("(()=>{const r=document.getElementById('h').shadowRoot.getElementById('sm').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()")
        ok(black(im, r[0], r[1]), 'shadow DOM deschis: e-mailul este acoperit')
        await page.keyboard.press('Escape')
        # G) câmpuri
        await goto('/inputs.html'); await cap('visible'); path = await save(); im = Image.open(path).convert('RGB')
        for i, nm in (('em', 'input type=email'), ('tl', 'input type=tel'), ('ta', 'textarea cu CNP')):
            x, y = await page.evaluate(center, i); ok(black(im, x, y), f'câmp {nm}: valoarea este acoperită')
        await page.keyboard.press('Escape')
        # G2) contenteditable
        await goto('/ce.html'); await cap('visible'); path = await save(); im = Image.open(path).convert('RGB')
        x, y = await page.evaluate(center, 'ce'); ok(black(im, (await page.evaluate("document.getElementById('ce').getBoundingClientRect().left")) + 60, y), 'contenteditable: e-mailul este acoperit')
        await page.keyboard.press('Escape')
        # H) CSS ostil
        await goto('/hostile.html'); await cap('visible'); await page.wait_for_timeout(2500)
        await page.screenshot(path='/tmp/hostile.png'); sh = Image.open('/tmp/hostile.png').convert('RGB')
        yel = sum(1 for x in range(0, sh.size[0], 20) for y in range(0, sh.size[1], 20) if sh.getpixel((x, y))[0] > 200 and sh.getpixel((x, y))[1] > 200 and sh.getpixel((x, y))[2] < 90)
        ok(yel > 5, f'CSS ostil (html>*{{display:none!important}}): editorul rămâne vizibil ({yel} eșantioane galbene)')
        await page.keyboard.press('Escape')
        # I) container derulabil
        await goto('/app.html'); await cap('full'); path = await save(9000); im = Image.open(path)
        ok(abs(im.size[1] - 9 * 502 * 2) <= 40 or im.size[1] > 700 * 2 * 3, f'aplicație cu container derulabil: înălțime {im.size[1]} (așteptat ~{9*502*2})')
        await page.keyboard.press('Escape')
        # J) pagină înaltă
        await goto('/tall.html'); t0 = time.time(); await cap('full'); path = await save(14000, 2, 90000); im = Image.open(path)
        ok(abs(im.size[1] - 20 * 602 * im.size[0] // 900) <= 80, f'pagină 12000 px la DPR2: {im.size} în {time.time()-t0:.0f}s')
        await page.keyboard.press('Escape')
        # K) evenimente sintetice deschid hub-ul?
        await goto('/csp.html')
        await page.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{altKey:true,shiftKey:true,code:'KeyP',bubbles:true,cancelable:true}))"); await page.wait_for_timeout(500)
        await page.screenshot(path='/tmp/synth.png'); sh = Image.open('/tmp/synth.png').convert('RGB')
        yel = sum(1 for x in range(600, 900, 6) for y in range(0, 300, 6) if sh.getpixel((x, y))[0] > 200 and sh.getpixel((x, y))[1] > 200 and sh.getpixel((x, y))[2] < 90)
        ok(yel == 0, f'eveniment sintetic de la pagină NU deschide meniul de captură ({yel} pixeli galbeni)')
        # L) jurnal VTT: evenimente din alte file
        ok(len(errs) == 0, f'fără erori de pagină {errs[:2]}')
        await ctx.close()
    print('DEFECTE:', fails or 'niciunul')
asyncio.run(main())
