import asyncio, pathlib
from playwright.async_api import async_playwright
EXT = str(pathlib.Path('../dist/chromium').resolve())
PAGE = 'file://' + str(pathlib.Path('page.html').resolve())
async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context('/tmp/prof3', channel='chrome', headless=True,
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'], viewport={'width':900,'height':700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker', timeout=30000)
        eid = sw.url.split('/')[2]
        errs=[]
        pop = await ctx.new_page(); pop.on('pageerror', lambda e: errs.append(str(e))); pop.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        await pop.set_viewport_size({'width':420,'height':760})
        await pop.goto(f'chrome-extension://{eid}/popup.html'); await pop.wait_for_timeout(800)
        await pop.screenshot(path='p1_contrast.png')
        await pop.click('#t-color'); await pop.screenshot(path='p2_color.png')
        await pop.click('#t-prof'); await pop.click('[data-profile=dyslexia]'); await pop.wait_for_timeout(300)
        st = await sw.evaluate("() => chrome.storage.local.get('settings')")
        print('after dyslexia profile:', st)
        await pop.click('#t-contrast'); await pop.click('#themes button[data-theme=yb]'); await pop.wait_for_timeout(300)
        print('theme:', (await sw.evaluate("() => chrome.storage.local.get('settings')"))['settings'].get('theme'))
        await pop.click('#t-read'); await pop.screenshot(path='p3_read.png')
        print('popup errors:', errs)
        print(('PASS ' if not errs else 'FAIL ') + 'popup fără erori JS')
        print(('PASS ' if st['settings'].get('profile') or st['settings'].get('theme') else 'FAIL ') + 'profil dislexie aplicat în setări')
        # magnifier test
        await sw.evaluate("s => chrome.storage.local.set({settings: s})", {'enabled':True,'magnifier':True,'mask':True,'cursor':True})
        page = await ctx.new_page(); await page.goto(PAGE); await page.wait_for_timeout(1000)
        await page.mouse.move(120, 230); await page.wait_for_timeout(100); await page.mouse.move(125, 228); await page.wait_for_timeout(500)
        await page.screenshot(path='m1_mag.png')
        await ctx.close()
asyncio.run(main())
