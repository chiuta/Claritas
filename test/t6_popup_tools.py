import asyncio, pathlib, sys
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page2.html').resolve())
fails=[]
def ok(c,m):
    print(('PASS ' if c else 'FAIL ')+m)
    if not c: fails.append(m)
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof6', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'])
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=8000)
        eid = sw.url.split('/')[2]
        await sw.evaluate("() => chrome.storage.local.clear()")
        page = await ctx.new_page(); await page.goto(PAGE); await page.wait_for_timeout(1200)
        tid = await sw.evaluate("async () => (await chrome.tabs.query({url:'file:///*'}))[0].id")
        errs=[]
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e)))
        pop.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pop.add_init_script("""const _q=chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query=async()=>[{id:%d}]; window.close=()=>{};""" % tid)
        await pop.set_viewport_size({'width':360,'height':800})
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(900)
        ok(await pop.evaluate("document.getElementById('unsupported').hidden"), 'popup vede pagina (supported)')
        await pop.click('#t-tools'); await pop.click('#auditBtn')
        for _ in range(16):
            await pop.wait_for_timeout(500)
            n = await pop.evaluate("document.querySelectorAll('#auditList li').length")
            if n >= 6: break
        ok(n >= 6, f'audit afișat în popup: {n} elemente')
        await pop.screenshot(path='p4_tools_audit.png', full_page=True)
        await pop.click('#outlineBtn'); await pop.wait_for_timeout(500)
        ok(await pop.evaluate("document.querySelectorAll('#auditList li').length") >= 3, 'structură afișată')
        await pop.click('#auditList li button')
        loc = False
        for _ in range(20):  # navigatoarele lente (Opera sub xvfb) au nevoie de mai mult de 500 ms
            await pop.wait_for_timeout(500)
            loc = await page.evaluate("!!document.getElementById('clr-f')")
            if loc: break
        ok(loc, 'locate din popup')
        ow = await pop.evaluate("document.documentElement.scrollWidth - innerWidth")
        ok(ow <= 0, f'fără overflow orizontal la 360px ({ow})')
        for tab in ['color','text','read']:
            await pop.click('#t-'+tab); await pop.screenshot(path=f'p5_{tab}.png', full_page=True)
        # selector temă automată și voce populate
        ok(await pop.evaluate("document.querySelectorAll('#autoTheme option').length") == 8, 'selector temă automată populat')
        await pop.click('#t-color'); await pop.select_option('[data-k=sim]', 'cataract'); await pop.wait_for_timeout(400)
        st = await sw.evaluate("() => chrome.storage.local.get('settings')")
        ok(st['settings'].get('sim') == 'cataract', 'setare nouă scrisă din popup')
        await pop.fill('[data-k=autoFrom]', '21:30'); await pop.wait_for_timeout(400)
        ok((await sw.evaluate("() => chrome.storage.local.get('settings')"))['settings'].get('autoFrom') == '21:30', 'ora salvată')
        ok(not errs, f'fără erori popup {errs[:2]}')
        await ctx.close()
    print('EȘECURI:', fails or 'niciunul'); sys.exit(1 if fails else 0)
asyncio.run(main())
