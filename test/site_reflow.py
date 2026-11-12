"""Site: reflow la 320 px în toate limbile, fără cereri externe, cu CSP care blochează rețeaua."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'site' / 'index.html').as_uri()
fails = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 320, 'height': 640})).new_page(); reqs = []
        pg.on('request', lambda r: reqs.append(r.url)); await pg.goto(URL)
        for l in ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu']:
            await pg.evaluate("l=>localStorage.setItem('claritas-lang',l)", l); await pg.reload(); await pg.wait_for_timeout(250)
            r = await pg.evaluate("()=>({ov:document.documentElement.scrollWidth-innerWidth,wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).position!=='fixed').length})")
            good = r['ov'] <= 0 and r['wide'] == 0; print(('PASS ' if good else 'FAIL ') + 'reflow 320px ' + l, r)
            if not good: fails.append(l)
        ext = [u for u in reqs if not u.startswith(('file:', 'data:', 'blob:'))]
        print(('PASS ' if not ext else 'FAIL ') + 'fără cereri externe', ext)
        csp = await pg.evaluate("()=>!!document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]')")
        print(('PASS ' if csp else 'FAIL ') + 'CSP prezent')
        if ext or not csp: fails.append('net/csp')
        await b.close()
    print('RESULT', fails); sys.exit(1 if fails else 0)
asyncio.run(main())
