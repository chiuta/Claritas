"""Pagina de prezentare în Chromium/Firefox/WebKit: fără erori JS, fără depășire orizontală, comutator limbă/temă, tab-uri, demo-uri."""
import asyncio, pathlib, sys, json
from playwright.async_api import async_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'site' / 'index.html').as_uri()
ENG = sys.argv[1] if len(sys.argv) > 1 else 'chromium'
fails = []
def ok(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        b = await getattr(p, ENG).launch()
        for w in (320, 390, 768, 1440):
            pg = await b.new_page(viewport={'width': w, 'height': 900}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            reqs = []; pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
            await pg.goto(URL); await pg.wait_for_timeout(700)
            over = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
            ok(over <= 1, f'{ENG} {w}px: fără depășire orizontală ({over})')
            ok(not errs, f'{ENG} {w}px: fără erori JS/consolă {errs[:2]}')
            ok(not reqs, f'{ENG} {w}px: fără cereri externe {reqs[:2]}')
            if w == 1440:
                await pg.select_option('#langSel', 'ro'); await pg.wait_for_timeout(250)
                t_before = await pg.evaluate("document.body.innerText.slice(0,400)")
                for lg in ('en', 'de', 'es', 'fr', 'hu', 'it', 'pt', 'ro'):
                    try:
                        await pg.select_option('#langSel', lg); await pg.wait_for_timeout(250)
                        t = await pg.evaluate("document.body.innerText.slice(0,400)")
                        ok(await pg.evaluate("document.documentElement.lang") == lg and t != t_before or lg == 'ro', f'{ENG}: limba {lg} aplicată')
                        n = await pg.evaluate("document.body.innerText.length")
                        ok(n > 3000, f'{ENG}: conținut prezent în {lg} ({n})')
                        ov = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
                        ok(ov <= 1, f'{ENG}: fără depășire în {lg} ({ov})')
                    except Exception as e:
                        ok(False, f'{ENG}: limba {lg}: {str(e)[:80]}')
                await pg.select_option('#langSel', 'ro'); await pg.wait_for_timeout(200)
                tabs = pg.locator('[role=tab]'); nt = await tabs.count()
                ok(nt >= 4, f'{ENG}: tab-uri demo ({nt})')
                if nt >= 2:
                    await tabs.nth(1).click(); await pg.wait_for_timeout(200)
                    sel = await tabs.nth(1).get_attribute('aria-selected'); ok(sel == 'true', f'{ENG}: tab selectat prin click')
                    await tabs.nth(1).press('ArrowRight'); await pg.wait_for_timeout(150)
                    sel2 = await tabs.nth(2).get_attribute('aria-selected'); ok(sel2 == 'true', f'{ENG}: tab cu săgeată dreapta')
                tabs_focus = 0
                for i in range(60):
                    await pg.keyboard.press('Tab')
                    f = await pg.evaluate("(()=>{const e=document.activeElement;if(!e||e===document.body)return -1;const r=e.getBoundingClientRect();const s=getComputedStyle(e);return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none'?1:0})()")
                    if f == 1: tabs_focus += 1
                ok(tabs_focus >= 40, f'{ENG}: focus vizibil la Tab ({tabs_focus}/60)')
            await pg.close()
        # reduced motion
        ctx = await b.new_context(reduced_motion='reduce'); pg = await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(500)
        anim = await pg.evaluate("Array.from(document.querySelectorAll('*')).filter(e=>{const s=getComputedStyle(e);return s.animationName!=='none'&&parseFloat(s.animationDuration)>0.01}).length")
        ok(anim == 0, f'{ENG}: reduced-motion fără animații active ({anim})')
        await b.close()
    print('RESULT:', json.dumps(fails))
    sys.exit(1 if fails else 0)
asyncio.run(main())
