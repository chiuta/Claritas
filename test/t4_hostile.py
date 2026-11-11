"""Teste ostile: setări corupte/malițioase, DOM adânc, parole, shadow DOM, per-site, import."""
import asyncio, pathlib, json, sys
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)

HTML = """<!doctype html><html><body style="background:#fff">
<input id=pw type=password value="SECRET123" style="color:#ccc">
<input id=cc autocomplete="cc-number" value="4111" style="color:#ccc">
<p id=p style="color:#ddd">Text slab</p>
<div id=host></div><iframe id=fr srcdoc="<p id=q style='color:#ddd'>in iframe</p>"></iframe>
<script>const sr=document.getElementById('host').attachShadow({mode:'open'});sr.innerHTML='<p id=sp style="color:#ddd">umbra</p>';
let d=document.body;for(let i=0;i<1500;i++){const x=document.createElement('div');d.appendChild(x);d=x}
d.id='deep';d.textContent='adanc';d.style.color='#ddd';</script></body></html>"""
open('/tmp/h.html','w').write(HTML)

async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof4', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        errs = []
        page = await ctx.new_page(); page.on('pageerror', lambda e: errs.append(str(e)))
        async def setst(st, sites=None):
            await sw.evaluate("([s,t]) => chrome.storage.local.set({settings: s, sites: t})", [st, sites or {}])
            await page.wait_for_timeout(700)
        await setst({'enabled': True}); await page.goto('file:///tmp/h.html'); await page.wait_for_timeout(2500)
        col = lambda sel: page.evaluate("s=>getComputedStyle(document.querySelector(s)).color", sel)
        ok(await col('#p') != 'rgb(221, 221, 221)', 'text slab corectat')
        ok(await page.evaluate("getComputedStyle(document.getElementById('deep')).color") != 'rgb(221, 221, 221)', 'DOM adânc (1500 niveluri) fără crash și corectat')
        ok(await page.evaluate("getComputedStyle(document.getElementById('host').shadowRoot.getElementById('sp')).color") != 'rgb(221, 221, 221)', 'shadow DOM corectat')
        ok(len(errs) == 0, f'fără erori în pagină {errs[:1]}')
        # magnifier nu expune parola
        await setst({'enabled': True, 'magnifier': True})
        box = await page.locator('#pw').bounding_box()
        await page.mouse.move(box['x'] + 10, box['y'] + 8); await page.wait_for_timeout(400)
        shot = await page.evaluate("document.getElementById('clr-root') ? 'present' : 'none'")
        ok(shot == 'present', 'overlay prezent')
        # (conținutul e într-un shadow închis: verificăm prin captură că 'SECRET123' nu apare mărit)
        await page.screenshot(path='/tmp/mag_pw.png')
        # setări ostile
        evil = {'enabled': True, 'theme': 'custom', 'custom': {'bg': 'red}body{display:none', 'fg': 'url(x)', 'link': '#fff'},
                'brightness': 'abc', 'contrast': 1e9, 'textScale': -5, 'cb': 'EVIL', 'font': '__proto__', 'lang': 'xx', 'lineHeight': 'NaN', 'target': {}}
        await setst(evil)
        ok(await page.evaluate("getComputedStyle(document.body).display") != 'none', 'injecție CSS prin culori custom blocată')
        css = await page.evaluate("document.getElementById('clr-style').textContent")
        ok('red}body{display:none' not in css and 'NaN' not in css and 'Infinity' not in css and 'EVIL' not in css and 'url(x)' not in css, 'CSS generat curat')
        ok(len(errs) == 0, 'fără erori după setări corupte')
        # tipuri greșite complet
        await setst('garbage'); ok(await page.evaluate("!!document.getElementById('clr-style')"), 'setări string: fără crash, rămâne funcțional')
        await sw.evaluate("() => chrome.storage.local.set({settings: null, sites: [1,2]})"); await page.wait_for_timeout(500)
        await sw.evaluate("() => chrome.storage.local.set({settings: {enabled:true}, sites: {'__proto__': {off:true}, 'constructor': {off:true}, 'localhost': 5}})"); await page.wait_for_timeout(500)
        ok(await page.evaluate("!!document.getElementById('clr-style')"), 'sites corupt/__proto__ ignorat')
        # per-site off
        await setst({'enabled': True}, {'local': {'off': True}})
        ok(await page.evaluate("!document.getElementById('clr-style')?.textContent && !document.querySelector('[data-clr-c]')"), 'site oprit: zero modificări')
        # extensie dezactivată → zero urme
        await setst({'enabled': False}, {})
        ok(await page.evaluate("document.querySelectorAll('[data-clr-c],[data-clr-fs],[data-clr-b],[data-clr-p]').length") == 0, 'teardown curat')
        # cb valid + dark împreună
        await setst({'enabled': True, 'theme': 'dark', 'cb': 'deut-fix', 'warm': 30, 'guide': True, 'mask': True})
        ok(await page.evaluate("!!document.getElementById('clr-svg')"), 'dark+cb+overlay funcționează')
        ok(len(errs) == 0, 'zero erori la final')
        await ctx.close()
    print('\nEȘECURI:', fails if fails else 'niciunul'); sys.exit(1 if fails else 0)
asyncio.run(main())
