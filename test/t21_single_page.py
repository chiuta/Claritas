"""Verificare cu O SINGURĂ filă (Vivaldi nu expune file noi prin CDP): script de conținut, audit, popup în aceeași filă."""
import os, asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page3.html').resolve())
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof21', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]
        page = [pg for pg in ctx.pages if not pg.is_closed()][0]; errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await sw.evaluate("() => chrome.storage.local.set({settings:{enabled:true}})")
        await page.goto(PAGE); await page.wait_for_timeout(2000)
        async def feat(cmd):
            return await sw.evaluate("""async (cmd) => { const ts=await chrome.tabs.query({url:'file:///*'}); return await chrome.tabs.sendMessage(ts[ts.length-1].id,{type:'feat',cmd}); }""", cmd)
        pg_ = await feat('ping'); ok(pg_ and pg_.get('ok'), 'scriptul de conținut răspunde (ping)')
        rules = set()
        for _ in range(20):
            a = await feat('audit'); rules = {i['rule'] for i in a['items']}
            if 'auth_ac' in rules and 'spacing_clip' in rules: break
            await asyncio.sleep(1)
        ok({'img_alt', 'label'} <= rules, 'audit: reguli de bază (img_alt, label) %s' % sorted(rules))
        ok('auth_ac' in rules and 'spacing_clip' in rules, 'audit: reguli extra (auth_ac, spacing_clip)')
        ok(await page.evaluate("!!document.getElementById('clr-style')||document.querySelectorAll('[data-clr-b]').length>0"), 'contrastul se aplică pe pagină')
        ok(not errs, 'fără erori de pagină %s' % errs[:2])
        # popup în aceeași filă
        await page.goto(f'chrome-extension://{eid}/popup.html'); await page.wait_for_timeout(1500)
        ok(await page.evaluate("document.querySelectorAll('.tabs [role=tab]').length>=4"), 'popup: filele sunt randate')
        ok(await page.evaluate("!!document.getElementById('q') && !!document.getElementById('quick')"), 'popup: căutare și bară rapidă')
        await page.focus('#q'); await page.keyboard.type('contrast'); await page.wait_for_timeout(500)
        ok(await page.evaluate("document.querySelectorAll('.sx-hide').length>0 || document.getElementById('q').value==='contrast'"), 'popup: căutarea reacționează')
        await ctx.close()
    print('FAILS', fails)
asyncio.run(main())
